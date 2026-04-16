// Generación de archivos .ics para agregar eventos al calendario
import ical, { ICalCalendarMethod } from "ical-generator";

interface CalendarEventData {
  id:          string;
  nombre:      string;
  descripcion: string;
  fechaInicio: Date;
  fechaFin:    Date;
  direccion:   string;
  organizador: string;
  url:         string;
}

// Genera un string .ics compatible con Google Calendar, Apple Calendar y Outlook
export function generateICS(evento: CalendarEventData): string {
  const cal = ical({
    name:   "Eventure",
    method: ICalCalendarMethod.REQUEST,
  });

  cal.createEvent({
    id:          evento.id,
    start:       evento.fechaInicio,
    end:         evento.fechaFin,
    summary:     evento.nombre,
    description: `${evento.descripcion}\n\nVer en Eventure: ${evento.url}`,
    location:    evento.direccion,
    url:         evento.url,
    organizer:   {
      name:  evento.organizador,
      email: process.env.EMAIL_FROM?.replace(/.*<(.*)>/, "$1") || "noreply@eventure.mx",
    },
  });

  return cal.toString();
}

// Genera link directo a Google Calendar
export function getGoogleCalendarUrl(evento: CalendarEventData): string {
  const format = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action:   "TEMPLATE",
    text:     evento.nombre,
    dates:    `${format(evento.fechaInicio)}/${format(evento.fechaFin)}`,
    details:  `${evento.descripcion}\n\nVer en Eventure: ${evento.url}`,
    location: evento.direccion,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
