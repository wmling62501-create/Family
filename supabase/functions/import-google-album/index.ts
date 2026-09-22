// Imports photos from a public Google Photos album into the family album.
//
// The browser cannot read lh3.googleusercontent.com cross-origin, so the album
// page is parsed and every photo is downloaded here, then uploaded to Enter
// Cloud Storage with the caller's own credentials. RLS still applies: only an
// approved family member can create the activity and store the photos.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const BUCKET = "family-media";
const MAX_BATCH = 12;
const MAX_IMAGE_BYTES = 9 * 1024 * 1024;
const PHOTO_WIDTH = "w2000";

const CATEGORIES = [
  "gathering",
  "trip",
  "festival",
  "wedding",
  "memorial",
  "birthday",
  "other",
];

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Album photos are served from lh3.googleusercontent.com/pw/<id>. */
const extractPhotoUrls = (html: string) => {
  const matches =
    html.match(/https:\/\/lh3\.googleusercontent\.com\/pw\/[A-Za-z0-9_-]+/g) ??
    [];
  return [...new Set(matches)];
};

const extractTitle = (html: string) => {
  const raw = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  // Google localizes the suffix, e.g. "- Google Photos" / "- Google 相簿".
  return raw.replace(/\s*-\s*Google\s+[^-]+$/i, "").trim();
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return json({ error: "missing_authorization" }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error("album import rejected: no session", userError?.message);
      return json({ error: "unauthenticated" }, 401);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, is_approved")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("album import: profile lookup failed", profileError.message);
      return json({ error: "profile_lookup_failed" }, 500);
    }

    if (!profile?.is_approved) {
      console.error("album import rejected: member not approved");
      return json({ error: "not_approved" }, 403);
    }

    const body = await req.json().catch(() => null);
    const action = body?.action;

    if (action === "list") {
      const albumUrl = String(body?.albumUrl ?? "").trim();
      const isAlbumUrl =
        albumUrl.startsWith("https://photos.app.goo.gl/") ||
        albumUrl.startsWith("https://photos.google.com/");

      if (!isAlbumUrl) {
        return json({ error: "invalid_album_url" }, 400);
      }

      const albumResponse = await fetch(albumUrl, {
        headers: {
          "User-Agent": BROWSER_UA,
          "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
        },
      });

      if (!albumResponse.ok) {
        console.error("album fetch failed", albumResponse.status, albumUrl);
        return json(
          { error: "album_unreachable", status: albumResponse.status },
          502,
        );
      }

      const html = await albumResponse.text();
      const imageUrls = extractPhotoUrls(html);

      console.log(
        `album listed: ${imageUrls.length} photos, title="${extractTitle(html)}"`,
      );

      return json({ title: extractTitle(html), imageUrls });
    }

    if (action === "import") {
      const imageUrls = Array.isArray(body?.imageUrls)
        ? body.imageUrls.slice(0, MAX_BATCH).map(String)
        : [];

      if (imageUrls.length === 0) {
        return json({ error: "no_images" }, 400);
      }

      let activityId: string | null = body?.activityId
        ? String(body.activityId)
        : null;
      let existingPhotos = 0;

      if (activityId) {
        const { count, error: countError } = await supabase
          .from("activity_photos")
          .select("id", { count: "exact", head: true })
          .eq("activity_id", activityId);

        if (countError) {
          console.error("photo count failed", countError.message);
          return json({ error: "photo_count_failed" }, 500);
        }
        existingPhotos = count ?? 0;
      } else {
        const activity = body?.activity ?? {};
        const title = String(activity.title ?? "").trim();
        const activityDate = String(activity.activity_date ?? "").trim();

        if (!title || !activityDate) {
          return json({ error: "missing_activity_fields" }, 400);
        }

        const { data: created, error: createError } = await supabase
          .from("activities")
          .insert({
            title,
            description: activity.description
              ? String(activity.description)
              : null,
            activity_date: activityDate,
            location: activity.location ? String(activity.location) : null,
            category: CATEGORIES.includes(activity.category)
              ? activity.category
              : "gathering",
          })
          .select("id")
          .single();

        if (createError) {
          console.error("activity insert failed", createError.message);
          return json(
            { error: "activity_insert_failed", detail: createError.message },
            500,
          );
        }

        activityId = created.id;
        console.log(`album import: created activity ${activityId}`);
      }

      const imported: string[] = [];
      let failed = 0;

      for (const url of imageUrls) {
        try {
          const imageResponse = await fetch(`${url}=${PHOTO_WIDTH}`, {
            headers: { "User-Agent": BROWSER_UA },
          });

          if (!imageResponse.ok) {
            failed += 1;
            console.error("photo download failed", imageResponse.status);
            continue;
          }

          const contentType =
            imageResponse.headers.get("content-type") ?? "image/jpeg";
          if (!contentType.startsWith("image/")) {
            failed += 1;
            continue;
          }

          const bytes = new Uint8Array(await imageResponse.arrayBuffer());
          if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
            failed += 1;
            console.error("photo rejected, bytes:", bytes.byteLength);
            continue;
          }

          const path = `activities/${crypto.randomUUID()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(path, new Blob([bytes], { type: contentType }), {
              contentType,
              upsert: false,
            });

          if (uploadError) {
            failed += 1;
            console.error("storage upload failed", uploadError.message);
            continue;
          }

          const { data: publicUrl } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(path);

          imported.push(publicUrl.publicUrl);
        } catch (error) {
          failed += 1;
          console.error("photo import threw", error);
        }
      }

      if (imported.length > 0) {
        const { error: photoError } = await supabase
          .from("activity_photos")
          .insert(
            imported.map((imageUrl, index) => ({
              activity_id: activityId,
              image_url: imageUrl,
              sort_order: existingPhotos + index,
            })),
          );

        if (photoError) {
          console.error("photo insert failed", photoError.message);
          return json(
            { error: "photo_insert_failed", detail: photoError.message },
            500,
          );
        }

        const { data: firstPhoto } = await supabase
          .from("activity_photos")
          .select("image_url")
          .eq("activity_id", activityId)
          .order("sort_order", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (firstPhoto?.image_url) {
          await supabase
            .from("activities")
            .update({ cover_image_url: firstPhoto.image_url })
            .eq("id", activityId);
        }
      }

      console.log(
        `album import: activity=${activityId} imported=${imported.length} failed=${failed}`,
      );

      return json({ activityId, imported: imported.length, failed });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (error) {
    console.error("import-google-album failed", error);
    return json({ error: "unexpected_error" }, 500);
  }
});
