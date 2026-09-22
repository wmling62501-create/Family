import { useEffect, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGenderLabels } from "@/hooks/use-labels";
import {
  useCreateFamilyMember,
  useDeleteFamilyMember,
  useUpdateFamilyMember,
} from "@/hooks/use-members";
import { GENDERS, type Gender } from "@/lib/constants";
import { uploadImage } from "@/lib/upload";
import type { FamilyMember } from "@/types/app";

type MemberFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: FamilyMember[];
  member?: FamilyMember | null;
};

const emptyForm = {
  fullName: "",
  gender: "other" as Gender,
  birthDate: "",
  deathDate: "",
  parentId: "",
  spouseId: "",
  photoUrl: "",
  bio: "",
};

export const MemberForm = ({
  open,
  onOpenChange,
  members,
  member,
}: MemberFormProps) => {
  const { t } = useTranslation();
  const genderLabels = useGenderLabels();
  const createMember = useCreateFamilyMember();
  const updateMember = useUpdateFamilyMember();
  const deleteMember = useDeleteFamilyMember();

  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      member
        ? {
            fullName: member.full_name,
            gender: member.gender as Gender,
            birthDate: member.birth_date ?? "",
            deathDate: member.death_date ?? "",
            parentId: member.parent_id ?? "",
            spouseId: member.spouse_id ?? "",
            photoUrl: member.photo_url ?? "",
            bio: member.bio ?? "",
          }
        : emptyForm,
    );
  }, [member, open]);

  const otherMembers = members.filter((candidate) => candidate.id !== member?.id);
  const isPending = createMember.isPending || updateMember.isPending;

  const handlePhoto = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "members");
      setForm((current) => ({ ...current, photoUrl: url }));
    } catch (error) {
      console.error("Member photo upload failed", error);
      toast.error(t("activities.form.errorUpload"));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.fullName.trim()) {
      toast.error(t("members.form.errorName"));
      return;
    }

    const input = {
      full_name: form.fullName.trim(),
      gender: form.gender,
      birth_date: form.birthDate || null,
      death_date: form.deathDate || null,
      parent_id: form.parentId || null,
      spouse_id: form.spouseId || null,
      photo_url: form.photoUrl || null,
      bio: form.bio.trim() ? form.bio.trim() : null,
    };

    try {
      if (member) {
        await updateMember.mutateAsync({
          id: member.id,
          input,
          previousSpouseId: member.spouse_id,
        });
        toast.success(t("members.form.successEdit"));
      } else {
        await createMember.mutateAsync(input);
        toast.success(t("members.form.successNew"));
      }
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("own parent")) {
        toast.error(t("members.form.errorSelfParent"));
        return;
      }
      if (message.includes("own spouse")) {
        toast.error(t("members.form.errorSelfSpouse"));
        return;
      }
      if (message.includes("Circular ancestry")) {
        toast.error(t("members.form.errorSelfParent"));
        return;
      }
      console.error("Failed to save member", error);
      toast.error(t("common.error"));
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    if (!window.confirm(t("members.form.deleteConfirm"))) return;

    try {
      await deleteMember.mutateAsync(member.id);
      toast.success(t("members.form.deleteSuccess"));
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete member", error);
      toast.error(t("common.error"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {member ? t("members.form.titleEdit") : t("members.form.titleNew")}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="space-y-5"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-warm text-xl font-semibold text-primary-foreground">
              {form.photoUrl ? (
                <img
                  src={form.photoUrl}
                  alt={form.fullName || t("members.form.photo")}
                  className="h-full w-full object-cover"
                />
              ) : (
                (form.fullName || "?").slice(0, 1)
              )}
            </span>
            <div className="space-y-2">
              <Label htmlFor="member-photo">{t("members.form.photo")}</Label>
              <div>
                <Button type="button" variant="outline" size="sm" asChild>
                  <label htmlFor="member-photo" className="cursor-pointer">
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {t("members.form.uploadPhoto")}
                  </label>
                </Button>
              </div>
              <input
                id="member-photo"
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  void handlePhoto(event.target.files?.[0]);
                }}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-name">{t("members.form.name")}</Label>
              <Input
                id="member-name"
                value={form.fullName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                placeholder={t("members.form.namePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("members.form.gender")}</Label>
              <Select
                value={form.gender}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    gender: value as Gender,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {genderLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-birth">{t("members.form.birthDate")}</Label>
              <Input
                id="member-birth"
                type="date"
                value={form.birthDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    birthDate: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-death">{t("members.form.deathDate")}</Label>
              <Input
                id="member-death"
                type="date"
                value={form.deathDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    deathDate: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("members.form.parent")}</Label>
              <Select
                value={form.parentId || "none"}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    parentId: value === "none" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {t("members.form.noParent")}
                  </SelectItem>
                  {otherMembers.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("members.form.parentHint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t("members.form.spouse")}</Label>
              <Select
                value={form.spouseId || "none"}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    spouseId: value === "none" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {t("members.form.noSpouse")}
                  </SelectItem>
                  {otherMembers.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("members.form.spouseHint")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-bio">{t("members.form.bio")}</Label>
            <Textarea
              id="member-bio"
              rows={3}
              value={form.bio}
              onChange={(event) =>
                setForm((current) => ({ ...current, bio: event.target.value }))
              }
              placeholder={t("members.form.bioPlaceholder")}
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {member ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  void handleDelete();
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("common.delete")}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isPending || uploading}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {member
                  ? t("members.form.submitEdit")
                  : t("members.form.submitNew")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
