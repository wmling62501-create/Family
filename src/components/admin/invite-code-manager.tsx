import { useState } from "react";
import { Check, Copy, Plus, Ticket, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateInviteCode,
  useDeleteInviteCode,
  useInviteCodes,
} from "@/hooks/use-invite-codes";
import { formatDate } from "@/lib/format";
import type { InviteCode } from "@/types/app";

type Role = InviteCode["role"];

export const InviteCodeManager = () => {
  const { t } = useTranslation();
  const { data: codes = [], isLoading } = useInviteCodes();
  const createCode = useCreateInviteCode();
  const deleteCode = useDeleteInviteCode();

  const [role, setRole] = useState<Role>("member");
  const [note, setNote] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const statusOf = (code: InviteCode) => {
    if (code.used_at) return t("admin.invites.status.used");
    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return t("admin.invites.status.expired");
    }
    return t("admin.invites.status.unused");
  };

  const handleCreate = async () => {
    try {
      await createCode.mutateAsync({
        role,
        note: note.trim() ? note.trim() : null,
        expiresAt: null,
      });
      setNote("");
      toast.success(t("admin.invites.createSuccess"));
    } catch (error) {
      console.error("Failed to create invite code", error);
      toast.error(t("common.error"));
    }
  };

  const handleCopy = async (code: InviteCode) => {
    await navigator.clipboard.writeText(code.code);
    setCopiedId(code.id);
    toast.success(t("admin.invites.copied"));
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            {t("admin.invites.create")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("admin.invites.hint")}
          </p>
          <div className="grid gap-4 sm:grid-cols-[180px_1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label>{t("admin.invites.role")}</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as Role)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">
                    {t("admin.invites.role.member")}
                  </SelectItem>
                  <SelectItem value="admin">
                    {t("admin.invites.role.admin")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-note">{t("admin.invites.note")}</Label>
              <Input
                id="invite-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t("admin.invites.notePlaceholder")}
              />
            </div>
            <Button
              onClick={() => {
                void handleCreate();
              }}
              disabled={createCode.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("admin.invites.create")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? null : codes.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={t("admin.invites.empty")}
          hint={t("admin.invites.hint")}
        />
      ) : (
        <ul className="space-y-3">
          {codes.map((code) => (
            <li
              key={code.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-mono text-base font-semibold tracking-wide text-foreground">
                  {code.code}
                </p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    {code.role === "admin"
                      ? t("admin.invites.role.admin")
                      : t("admin.invites.role.member")}
                  </span>
                  <span>{statusOf(code)}</span>
                  <span>
                    {code.expires_at
                      ? formatDate(code.expires_at)
                      : t("admin.invites.noExpiry")}
                  </span>
                  {code.note ? <span>{code.note}</span> : null}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void handleCopy(code);
                  }}
                >
                  {copiedId === code.id ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {t("admin.invites.copy")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!window.confirm(t("admin.invites.deleteConfirm"))) return;
                    deleteCode.mutate(code.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">{t("admin.invites.delete")}</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
