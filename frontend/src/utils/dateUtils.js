/**
 * Kivora Chat & Messaging Timestamp Utilities
 * Handles timezone-aware parsing and localized formatting across Creator Hub and Brand Portal.
 * Enforces:
 * - Unambiguous UTC parsing (with or without Z)
 * - Safe handling of SQLite legacy strings and ISO strings with offsets
 * - Localized rendering using Intl.DateTimeFormat in the user's browser timezone (e.g. IST)
 * - Clean display for today (HH:mm), previous days (d MMM), and older years (d MMM yyyy)
 * - Graceful fallback returning empty string for null/invalid dates (no 'NaN' or 'Invalid Date')
 */

/**
 * Parses any timestamp input (ISO string, SQLite string, or Date) into a valid Date instant.
 * Does not double-shift strings that already contain an explicit offset or 'Z'.
 * Treats naive server timestamps as UTC, aligning with Kivora's backend storage convention.
 */
export function parseMessageDate(input) {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  let str = String(input).trim();
  if (!str) return null;

  // Convert SQLite space separator 'YYYY-MM-DD HH:mm:ss' to ISO 'T'
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(str)) {
    str = str.replace(' ', 'T');
  }

  // Check if timezone indicator is already present ('Z' or '+HH:mm' / '-HH:mm')
  const hasTimezone = /Z$/i.test(str) || /[+-]\d{2}(:?\d{2})?$/.test(str);
  if (!hasTimezone && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
    // Naive ISO timestamp from backend SQLite storage -> treat as UTC instant
    str = str + 'Z';
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a message timestamp for chat bubbles.
 * - Today: '06:27' or '13:45' (24-hour localized time)
 * - Same year: '12 Oct, 18:02'
 * - Older year: '12 Oct 2025, 18:02'
 * - Invalid/null: ''
 */
export function formatMessageBubbleTime(dateInput, timeZone) {
  const d = parseMessageDate(dateInput);
  if (!d) return '';

  const now = new Date();
  const timeFormatterOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  };
  const timeStr = new Intl.DateTimeFormat(undefined, timeFormatterOptions).format(d);

  // Compare calendar days in the target timezone / local timezone
  const dateFormatterOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  };
  const dCalendar = new Intl.DateTimeFormat('en-CA', dateFormatterOptions).format(d);
  const nowCalendar = new Intl.DateTimeFormat('en-CA', dateFormatterOptions).format(now);

  if (dCalendar === nowCalendar) {
    return timeStr;
  }

  const isSameYear = d.getFullYear() === now.getFullYear();
  const dateStr = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    ...(isSameYear ? {} : { year: 'numeric' }),
    ...(timeZone ? { timeZone } : {}),
  }).format(d);

  return `${dateStr}, ${timeStr}`;
}

/**
 * Formats a timestamp for conversation list entries in the sidebar.
 * - Today: '06:27' or '13:45'
 * - Same year: '12 Oct'
 * - Older year: '12 Oct 2025'
 * - Invalid/null: ''
 */
export function formatConversationListItemTime(dateInput, timeZone) {
  const d = parseMessageDate(dateInput);
  if (!d) return '';

  const now = new Date();
  const dateFormatterOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  };
  const dCalendar = new Intl.DateTimeFormat('en-CA', dateFormatterOptions).format(d);
  const nowCalendar = new Intl.DateTimeFormat('en-CA', dateFormatterOptions).format(now);

  if (dCalendar === nowCalendar) {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...(timeZone ? { timeZone } : {}),
    }).format(d);
  }

  const isSameYear = d.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    ...(isSameYear ? {} : { year: 'numeric' }),
    ...(timeZone ? { timeZone } : {}),
  }).format(d);
}
