import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { api } from "../api/api";

export interface IEmailListItem {
  id: string;
  threadId: string;
  sender: string;
  email: string;
  subject: string;
  preview: string;
  date: string;
  unread: boolean;
  starred: boolean;
  hasAttachment: boolean;
}

export interface IEmailDetail {
  id: string;
  threadId: string;
  sender: string;
  email: string;
  to: string;
  subject: string;
  date: string;
  bodyText: string;
  bodyHtml: string;
  starred: boolean;
  messageIdHeader: string;
}

interface IEmailsData {
  emails: IEmailListItem[];
  nextPageToken: string | null;
}

interface IEmailsResponse {
  message: string;
  data: IEmailsData;
}

interface IEmailResponse {
  message: string;
  data: IEmailDetail;
}

export interface ISendEmailBody {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}

export const EMAILS_QUERY_KEY = ["emails"];

export const useEmails = (pageToken?: string, label: "INBOX" | "STARRED" = "INBOX") =>
  useQuery({
    queryKey: [...EMAILS_QUERY_KEY, label, pageToken || null],
    queryFn: async () => {
      const response = await api.get<IEmailsResponse>("/email", {
        params: { label, ...(pageToken ? { pageToken } : {}) },
      });
      return response.data.data;
    },
    // "Google account is not connected" (400) не исчезнет от повторных попыток
    retry: false,
  });

export const useEmail = (id: string | null) =>
  useQuery({
    queryKey: ["email", id],
    queryFn: async () => {
      const response = await api.get<IEmailResponse>(`/email/${id}`);
      return response.data.data;
    },
    enabled: !!id,
    retry: false,
  });

export const useSendEmail = () =>
  useMutation<
    { message: string; data: { id: string; threadId: string } },
    AxiosError<{ message: string }>,
    ISendEmailBody
  >({
    mutationFn: async (body) => {
      const response = await api.post("/email/send", body);
      return response.data;
    },
  });

export const useToggleStar = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    AxiosError<{ message: string }>,
    { id: string; starred: boolean }
  >({
    mutationFn: async ({ id, starred }) => {
      await api.patch(`/email/${id}/star`, { starred });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMAILS_QUERY_KEY });
    },
  });
};

export const useArchiveEmail = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<{ message: string }>, string>({
    mutationFn: async (id) => {
      await api.patch(`/email/${id}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMAILS_QUERY_KEY });
    },
  });
};

export const useDeleteEmail = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<{ message: string }>, string>({
    mutationFn: async (id) => {
      await api.delete(`/email/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMAILS_QUERY_KEY });
    },
  });
};
