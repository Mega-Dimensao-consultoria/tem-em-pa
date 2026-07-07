import { CalendarPlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadIcs, googleCalendarUrl, type CalendarEvent } from "@/lib/calendar";

/**
 * Add-to-calendar buttons for a single event (Google Calendar + ICS).
 * Silent no-op on SSR (relies on window/document only inside click handlers).
 */
export function EventCalendarButtons({
  event,
  size = "sm",
}: {
  event: CalendarEvent;
  size?: "sm" | "default";
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        asChild
        size={size}
        variant="outline"
        className="rounded-full text-xs"
      >
        <a
          href={googleCalendarUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Adicionar ${event.title} ao Google Agenda`}
        >
          <CalendarPlus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Google Agenda
        </a>
      </Button>
      <Button
        type="button"
        size={size}
        variant="outline"
        className="rounded-full text-xs"
        onClick={() => downloadIcs(event)}
        aria-label={`Baixar arquivo .ics do evento ${event.title}`}
      >
        <Download className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
        .ics
      </Button>
    </div>
  );
}
