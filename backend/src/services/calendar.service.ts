import { google } from "googleapis";
import { getGoogleAuthClient } from "./googleClient";

const getCalendarClient = async (userId: number) => {
  const auth = await getGoogleAuthClient(userId);
  return google.calendar({ version: "v3", auth });
};

export const listEventsService = async (
  userId: number,
  opts: { timeMin: string; timeMax: string },
) => {
  const calendar = await getCalendarClient(userId);

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: opts.timeMin,
    timeMax: opts.timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  const events = (res.data.items || []).map((event) => ({
    id: event.id,
    title: event.summary || "(no title)",
    description: event.description || "",
    location: event.location || "",
    start: event.start?.dateTime || event.start?.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    allDay: !event.start?.dateTime,
    hangoutLink: event.hangoutLink || "",
    htmlLink: event.htmlLink || "",
  }));

  return events;
};

export const createEventService = async (
  userId: number,
  body: {
    title: string;
    description?: string | undefined;
    location?: string | undefined;
    start: string;
    end: string;
    allDay?: boolean | undefined;
  },
) => {
  const calendar = await getCalendarClient(userId);

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: body.title,
      ...(body.description ? { description: body.description } : {}),
      ...(body.location ? { location: body.location } : {}),
      start: body.allDay ? { date: body.start } : { dateTime: body.start },
      end: body.allDay ? { date: body.end } : { dateTime: body.end },
    },
  });

  return {
    id: res.data.id,
    title: res.data.summary || "(no title)",
    description: res.data.description || "",
    location: res.data.location || "",
    start: res.data.start?.dateTime || res.data.start?.date || "",
    end: res.data.end?.dateTime || res.data.end?.date || "",
    allDay: !res.data.start?.dateTime,
    hangoutLink: res.data.hangoutLink || "",
    htmlLink: res.data.htmlLink || "",
  };
};

export const deleteEventService = async (userId: number, eventId: string) => {
  const calendar = await getCalendarClient(userId);
  await calendar.events.delete({ calendarId: "primary", eventId });
};
