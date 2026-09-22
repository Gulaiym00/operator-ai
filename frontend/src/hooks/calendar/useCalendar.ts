import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { api } from "../api/api";

export interface ICalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  allDay: boolean;
  hangoutLink: string;
  htmlLink: string;
}

interface IEventsResponse {
  message: string;
  data: ICalendarEvent[];
}

export interface ICreateEventBody {
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay?: boolean;
}

export const CALENDAR_QUERY_KEY = ["calendar-events"];

export const useCalendarEvents = (timeMin: string, timeMax: string) =>
  useQuery({
    queryKey: [...CALENDAR_QUERY_KEY, timeMin, timeMax],
    queryFn: async () => {
      const response = await api.get<IEventsResponse>("/calendar", {
        params: { timeMin, timeMax },
      });
      return response.data.data;
    },
    // "Google account is not connected" не исчезнет от повторных попыток
    retry: false,
  });

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; data: ICalendarEvent },
    AxiosError<{ message: string }>,
    ICreateEventBody
  >({
    mutationFn: async (body) => {
      const response = await api.post("/calendar", body);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<{ message: string }>, string>({
    mutationFn: async (id) => {
      await api.delete(`/calendar/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY });
    },
  });
};
