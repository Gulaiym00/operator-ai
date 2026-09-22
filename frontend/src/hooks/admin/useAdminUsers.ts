import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";

export interface IAppUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  age: number | null;
  phone: string | null;
  has_google: boolean;
  is_admin: boolean;
  created_at: string;
}

interface IAdminUsersResponse {
  message: string;
  data: IAppUser[];
}

export const ADMIN_USERS_QUERY_KEY = ["admin-users"];

export const useAdminUsers = () =>
  useQuery({
    queryKey: ADMIN_USERS_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<IAdminUsersResponse>("/admin/users");
      return response.data.data;
    },
  });
