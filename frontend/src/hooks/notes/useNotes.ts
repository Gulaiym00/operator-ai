import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { api } from "../api/api";

export interface INote {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface INotesResponse {
  message: string;
  data: INote[];
}

interface INoteResponse {
  message: string;
  data: INote;
}

export interface INoteBody {
  title?: string;
  content?: string;
}

export const NOTES_QUERY_KEY = ["notes"];

export const useNotes = () =>
  useQuery({
    queryKey: NOTES_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<INotesResponse>("/notes");
      return response.data.data;
    },
  });

export const useCreateNote = () => {
  const queryClient = useQueryClient();

  return useMutation<INoteResponse, AxiosError<{ message: string }>, INoteBody | void>({
    mutationFn: async (body) => {
      const response = await api.post<INoteResponse>("/notes", body || {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();

  return useMutation<
    INoteResponse,
    AxiosError<{ message: string }>,
    { id: number; body: INoteBody }
  >({
    mutationFn: async ({ id, body }) => {
      const response = await api.put<INoteResponse>(`/notes/${id}`, body);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<{ message: string }>, number>({
    mutationFn: async (id) => {
      await api.delete(`/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
};
