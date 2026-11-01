import { format, toZonedTime } from "date-fns-tz";
import { parseISO, isValid, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";

export const APP_TIMEZONE = "Asia/Kolkata";

/**
 * Converts any date or ISO string to UTC ISO-8601 string for database storage.
 * e.g., '2026-10-27T03:47:00.000Z'
 */
export function toUTCString(date: Date | string | null | undefined = new Date()): string {
  if (!date) return new Date().toISOString();
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return isValid(d) ? d.toISOString() : new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Converts an IST date string (YYYY-MM-DD) and IST time string (HH:mm) into a UTC ISO string.
 * Example: '2026-10-28', '11:00' -> '2026-10-28T05:30:00.000Z'
 */
export function istDateTimeToUTC(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.trim();
  const cleanTime = timeStr.trim().length === 5 ? `${timeStr.trim()}:00` : timeStr.trim();
  const isoWithISTOffset = `${cleanDate}T${cleanTime}+05:30`;
  const dateObj = new Date(isoWithISTOffset);
  if (isNaN(dateObj.getTime())) {
    throw new Error("Invalid date or time provided for Indian Standard Time conversion.");
  }
  return dateObj.toISOString();
}

/**
 * Formats a UTC date string or Date object for display in Asia/Kolkata (IST).
 * Default format: 'dd MMM yyyy, hh:mm a' (e.g. '27 Oct 2026, 09:17 AM')
 */
export function formatInIST(
  date: Date | string | null | undefined,
  formatPattern: string = "dd MMM yyyy, hh:mm a"
): string {
  if (!date) return "N/A";
  try {
    const parsedDate = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(parsedDate)) return "Invalid date";
    const zonedDate = toZonedTime(parsedDate, APP_TIMEZONE);
    return format(zonedDate, formatPattern, { timeZone: APP_TIMEZONE });
  } catch {
    return "Invalid date";
  }
}

/**
 * Formats a UTC date for short date display in IST (e.g., '27 Oct 2026')
 */
export function formatISTDate(date: Date | string | null | undefined): string {
  return formatInIST(date, "dd MMM yyyy");
}

/**
 * Formats a UTC date for time-only display in IST (e.g., '09:17 AM')
 */
export function formatISTTime(date: Date | string | null | undefined): string {
  return formatInIST(date, "hh:mm a");
}

/**
 * Returns current date/time in Asia/Kolkata zone
 */
export function getCurrentIST(): Date {
  return toZonedTime(new Date(), APP_TIMEZONE);
}

/**
 * Checks if a given UTC timestamp falls on "Today" in Indian Standard Time (IST)
 */
export function isTodayInIST(utcDate: string): boolean {
  try {
    const parsed = parseISO(utcDate);
    if (!isValid(parsed)) return false;
    const itemDateIST = formatInIST(parsed, "yyyy-MM-dd");
    const todayDateIST = formatInIST(new Date(), "yyyy-MM-dd");
    return itemDateIST === todayDateIST;
  } catch {
    return false;
  }
}

/**
 * Generates a human-friendly countdown or status badge for an upcoming site visit in IST
 */
export function getVisitCountdownText(utcDate: string): { label: string; urgency: "critical" | "warning" | "normal" | "past" } {
  try {
    const visitDate = parseISO(utcDate);
    if (!isValid(visitDate)) return { label: "Date unavailable", urgency: "normal" };

    const now = new Date();
    const diffMinutes = differenceInMinutes(visitDate, now);

    if (diffMinutes < 0) {
      return { label: `Passed (${formatInIST(visitDate, "dd MMM, hh:mm a")})`, urgency: "past" };
    }

    if (diffMinutes <= 120) {
      return { label: `In ${diffMinutes} mins!`, urgency: "critical" };
    }

    const diffHours = differenceInHours(visitDate, now);
    if (diffHours < 24 && isTodayInIST(utcDate)) {
      return { label: `Today at ${formatISTTime(visitDate)}`, urgency: "warning" };
    }

    const diffDays = differenceInDays(visitDate, now);
    if (diffDays <= 1) {
      return { label: `Tomorrow at ${formatISTTime(visitDate)}`, urgency: "normal" };
    }

    return { label: formatInIST(visitDate, "dd MMM, hh:mm a"), urgency: "normal" };
  } catch {
    return { label: "Scheduled", urgency: "normal" };
  }
}
