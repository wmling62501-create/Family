import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";

type PhotoUploaderProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  folder: string;
  className?: string;
};

export const PhotoUploader = ({
  value,
  onChange,
  folder,
  className,
}: PhotoUploaderProps) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
      try {
        uploaded.push(await uploadImage(file, folder));
      } catch (error) {
        console.error("Photo upload failed", error);
      }
    }

    setUploading(false);

    if (uploaded.length === 0) {
      toast.error(t("activities.form.errorUpload"));
      return;
    }

    onChange([...value, ...uploaded]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="mr-2 h-4 w-4" />
          )}
          {uploading
            ? t("activities.form.uploading")
            : t("activities.form.uploadPhotos")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t("activities.form.photosHint")}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            void handleFiles(event.target.files);
          }}
        />
      </div>

      {value.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {value.map((url, index) => (
            <li
              key={url}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
            >
              <img
                src={url}
                alt={t("activities.detail.photoAlt")}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  onChange(value.filter((candidate) => candidate !== url))
                }
                aria-label={t("common.delete")}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 transition-smooth group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {index === 0 ? (
                <span className="absolute bottom-1 left-1 rounded bg-foreground/70 px-1.5 py-0.5 text-[10px] text-background">
                  {t("activities.form.coverHint")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
