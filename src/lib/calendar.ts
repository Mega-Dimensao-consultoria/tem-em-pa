/**
 * Calendar helpers for event export (ICS + Google Calendar deep link).
 * All values are escaped per RFC 5545 for ICS output.
 */

export type CalendarEvent = {
  uid: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: string; // ISO
  endsAt?: string | null; // ISO
  url?: string | null;
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/** Format an ISO date as YYYYMMDDTHHMMSSZ (UTC) — required by ICS/Google. */
function toIcsUtc(iso: string): string {
  const d = new Date(iso);
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

/** RFC 5545 line escape: backslash, semicolon, comma, newline. */
function esc(v: string | null | undefined): string {
  if (!v) return "";
  return v
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Build an ICS calendar (single VEVENT). */
export function buildIcs(ev: CalendarEvent): string {
  const end = ev.endsAt ?? new Date(new Date(ev.startsAt).getTime() + 60 * 60 * 1000).toISOString();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tem em Pouso Alegre//Eventos//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${esc(ev.uid)}@tem-em-pa.lovable.app`,
    `DTSTAMP:${toIcsUtc(new Date().toISOString())}`,
    `DTSTART:${toIcsUtc(ev.startsAt)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${esc(ev.title)}`,
    ev.description ? `DESCRIPTION:${esc(ev.description)}` : "",
    ev.location ? `LOCATION:${esc(ev.location)}` : "",
    ev.url ? `URL:${esc(ev.url)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

/** Trigger a browser download of the ICS file. */
export function downloadIcs(ev: CalendarEvent) {
  const ics = buildIcs(ev);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = ev.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 60) || "evento";
  a.href = url;
  a.download = `${safeName}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Build a Google Calendar "add event" URL that opens in a new tab. */
export function googleCalendarUrl(ev: CalendarEvent): string {
  const end =
    ev.endsAt ?? new Date(new Date(ev.startsAt).getTime() + 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${toIcsUtc(ev.startsAt)}/${toIcsUtc(end)}`,
  });
  if (ev.description) params.set("details", ev.description);
  if (ev.location) params.set("location", ev.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
