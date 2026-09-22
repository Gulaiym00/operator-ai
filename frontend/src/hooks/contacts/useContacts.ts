import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { api } from "../api/api";

export interface IContact {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface IContactsResponse {
  message: string;
  data: IContact[];
}

interface IContactResponse {
  message: string;
  data: IContact;
}

export interface IContactBody {
  name?: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
}

export const CONTACTS_QUERY_KEY = ["contacts"];

export const useContacts = (search?: string) =>
  useQuery({
    queryKey: [...CONTACTS_QUERY_KEY, search || ""],
    queryFn: async () => {
      const response = await api.get<IContactsResponse>("/contacts", {
        params: search ? { search } : undefined,
      });
      return response.data.data;
    },
  });

export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation<IContactResponse, AxiosError<{ message: string }>, IContactBody>({
    mutationFn: async (body) => {
      const response = await api.post<IContactResponse>("/contacts", body);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY });
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();

  return useMutation<
    IContactResponse,
    AxiosError<{ message: string }>,
    { id: number; body: IContactBody }
  >({
    mutationFn: async ({ id, body }) => {
      const response = await api.put<IContactResponse>(`/contacts/${id}`, body);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY });
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<{ message: string }>, number>({
    mutationFn: async (id) => {
      await api.delete(`/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY });
    },
  });
};
