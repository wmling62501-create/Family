import { useState } from "react";
import { Images, Link2, Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useCategoryLabels } from "@/hooks/use-labels";
import {
  ACTIVITY_CATEGORIES,
  type ActivityCategory,
} from "@/lib/constants";

const BATCH_SIZE = 12;

type ListResult = { title?: string; imageUrls?: string[] };
type ImportResult = {
  activityId?: string;
  imported?: number;
  failed?: number;
};

const today = () => new Date().toISOString().slice(0, 10);

/** Album titles usually start with yyyymmdd, e.g. "20260921 二姑父70大壽". */
const parseAlbumTitle = (raw: string) => {
  const match = raw.match(/^\s*(\d{4})(\d{2})(\d{2})\s*(.*)$/);
  if (!match) return { title: raw.trim(), date: today() };

  const [, year, month, day, rest] = match;
  return {
    title: rest.trim() || raw.trim(),
    date: `${year}-${month}-${day}`,
  };
};

export const AlbumImporter = () => {
  const { t } = useTranslation();
  const categoryLabels = useCategoryLabels();

  const [albumUrl, setAlbumUrl] = useState("");
  const [listing, setListing] = useState<string[] | null>(null);
  const [reading, setReading] = useState(false);

  const [title, setTitle] = useState("");
  const [activityDate, setActivityDate] = useState(today());
  const [category, setCategory] = useState<ActivityCategory>("birthday");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleRead = async () => {
    setReading(true);
    setResult(null);

    const { data, error } = await supabase.functions.invoke<ListResult>(
      "import-google-album",
      {
        body: { action: "list", albumUrl: albumUrl.trim() },
        headers: { "Content-Type": "application/json" },
      },
    );

    setReading(false);

    if (error || !data) {
      console.error("Album read failed", error);
      toast.error(t("admin.import.error"));
      return;
    }

    const imageUrls = data.imageUrls ?? [];
    if (imageUrls.length === 0) {
      toast.error(t("admin.import.empty"));
      return;
    }

    const parsed = parseAlbumTitle(data.title ?? "");
    setListing(imageUrls);
    setTitle(parsed.title);
    setActivityDate(parsed.date);
    toast.success(t("admin.import.found", { n: imageUrls.length }));
  };

  const handleImport = async () => {
    if (!listing || listing.length === 0) return;
    if (!title.trim() || !activityDate) {
      toast.error(t("activities.form.errorTitle"));
      return;
    }

    setImporting(true);
    setProgress({ done: 0, total: listing.length });

    let activityId: string | undefined;
    let imported = 0;
    let failed = 0;

    for (let index = 0; index < listing.length; index += BATCH_SIZE) {
      const batch = listing.slice(index, index + BATCH_SIZE);

      const { data, error } = await supabase.functions.invoke<ImportResult>(
        "import-google-album",
        {
          body: {
            action: "import",
            imageUrls: batch,
            activityId,
            activity: activityId
              ? undefined
              : {
                  title: title.trim(),
                  activity_date: activityDate,
                  category,
                  location: location.trim() || null,
                  description: description.trim() || null,
                },
          },
          headers: { "Content-Type": "application/json" },
        },
      );

      if (error || !data) {
        console.error("Album import batch failed", error);
        failed += batch.length;
        setProgress({ done: index + batch.length, total: listing.length });
        continue;
      }

      activityId = data.activityId ?? activityId;
      imported += data.imported ?? 0;
      failed += data.failed ?? 0;
      setProgress({ done: index + batch.length, total: listing.length });
    }

    setImporting(false);
    setResult({ activityId, imported, failed });

    if (imported === 0) {
      toast.error(t("admin.import.error"));
      return;
    }
    if (failed > 0) {
      toast.warning(t("admin.import.partial", { n: imported, failed }));
      return;
    }
    toast.success(t("admin.import.success", { n: imported }));
  };

  const reset = () => {
    setListing(null);
    setResult(null);
    setAlbumUrl("");
    setProgress({ done: 0, total: 0 });
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Link2 className="h-4 w-4 text-primary" />
            {t("admin.import.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            {t("admin.import.hint")}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="album-url">{t("admin.import.urlLabel")}</Label>
              <Input
                id="album-url"
                value={albumUrl}
                onChange={(event) => setAlbumUrl(event.target.value)}
                placeholder={t("admin.import.urlPlaceholder")}
                disabled={importing}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                void handleRead();
              }}
              disabled={reading || importing || albumUrl.trim().length === 0}
            >
              {reading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Images className="mr-2 h-4 w-4" />
              )}
              {reading ? t("admin.import.loading") : t("admin.import.load")}
            </Button>
          </div>

          {listing ? (
            <div className="space-y-5 border-t border-border/70 pt-5">
              <p className="flex items-center gap-2 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                {t("admin.import.found", { n: listing.length })}
              </p>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="import-title">
                    {t("admin.import.activityTitle")}
                  </Label>
                  <Input
                    id="import-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    disabled={importing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="import-date">
                    {t("admin.import.activityDate")}
                  </Label>
                  <Input
                    id="import-date"
                    type="date"
                    value={activityDate}
                    onChange={(event) => setActivityDate(event.target.value)}
                    disabled={importing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.import.category")}</Label>
                  <Select
                    value={category}
                    onValueChange={(value) =>
                      setCategory(value as ActivityCategory)
                    }
                    disabled={importing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_CATEGORIES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {categoryLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="import-location">
                    {t("admin.import.location")}
                  </Label>
                  <Input
                    id="import-location"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder={t("admin.import.locationPlaceholder")}
                    disabled={importing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="import-description">
                  {t("activities.form.description")}
                </Label>
                <Textarea
                  id="import-description"
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={t("activities.form.descriptionPlaceholder")}
                  disabled={importing}
                />
              </div>

              {progress.total > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {importing
                      ? t("admin.import.progress", {
                          done: progress.done,
                          total: progress.total,
                        })
                      : t("admin.import.success", {
                          n: result?.imported ?? progress.done,
                        })}
                  </p>
                  <Progress
                    value={
                      progress.total === 0
                        ? 0
                        : Math.round((progress.done / progress.total) * 100)
                    }
                  />
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => {
                    void handleImport();
                  }}
                  disabled={importing}
                >
                  {importing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Images className="mr-2 h-4 w-4" />
                  )}
                  {t("admin.import.start")}
                </Button>

                {result?.activityId ? (
                  <Button asChild variant="outline">
                    <Link to={`/activities/${result.activityId}`}>
                      {t("admin.import.viewActivity")}
                    </Link>
                  </Button>
                ) : null}

                <Button variant="ghost" onClick={reset} disabled={importing}>
                  {t("admin.import.reset")}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
