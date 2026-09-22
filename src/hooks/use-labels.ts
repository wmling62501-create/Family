import { useTranslation } from "react-i18next";

import type { ActivityCategory, Gender } from "@/lib/constants";
import type { RsvpStatus } from "@/types/app";

/**
 * Label maps are built from static t() calls so the i18n scanner can see
 * every key; never build these from dynamic key strings.
 */
export const useCategoryLabels = (): Record<ActivityCategory, string> => {
  const { t } = useTranslation();
  return {
    gathering: t("activities.category.gathering"),
    trip: t("activities.category.trip"),
    festival: t("activities.category.festival"),
    wedding: t("activities.category.wedding"),
    memorial: t("activities.category.memorial"),
    birthday: t("activities.category.birthday"),
    other: t("activities.category.other"),
  };
};

export const useGenderLabels = (): Record<Gender, string> => {
  const { t } = useTranslation();
  return {
    male: t("members.gender.male"),
    female: t("members.gender.female"),
    other: t("members.gender.other"),
  };
};

export const useRsvpStatusLabels = (): Record<RsvpStatus, string> => {
  const { t } = useTranslation();
  return {
    attending: t("rsvp.status.attending"),
    declined: t("rsvp.status.declined"),
  };
};
