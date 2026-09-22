import { differenceInYears, format, parseISO } from "date-fns";

const toDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** Format an ISO date (yyyy-MM-dd) for display. Returns null when unset. */
export const formatDate = (value?: string | null, pattern = "yyyy/MM/dd") => {
  const date = toDate(value);
  return date ? format(date, pattern) : null;
};

export const formatYear = (value?: string | null) => formatDate(value, "yyyy");

/** Whole years between a birth date and today (or a given date of passing). */
export const calculateAge = (
  birthDate?: string | null,
  deathDate?: string | null,
) => {
  const birth = toDate(birthDate);
  if (!birth) return null;
  const end = toDate(deathDate) ?? new Date();
  const age = differenceInYears(end, birth);
  return age >= 0 ? age : null;
};
