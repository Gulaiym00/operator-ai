import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { api } from "../api/api";
import { clearAccessToken, setAccessToken } from "@/lib/auth";

export interface IUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  google_id?: string | number;
  created_at?: string;
  age?: number | null;
  phone?: string | null;
  is_admin?: boolean;
}

export interface ILoginBody {
  email: string;
  password: string;
}

export interface IRegisterBody {
  name: string;
  email: string;
  password: string;
  avatar?: FileList;
}

export interface IUpdateProfileBody {
  name?: string;
  avatar?: FileList;
  age?: number | null;
  phone?: string | null;
}

interface ILoginResponse {
  message: string;
  user: {
    user: IUser;
    accessToken: string;
  };
}

interface IRegisterResponse {
  message: string;
  user: IUser;
}

interface IProfileResponse {
  message: string;
  data: IUser | undefined;
}

interface IUpdateProfileResponse {
  message: string;
  data: IUser;
}

export const PROFILE_QUERY_KEY = ["profile"];

export const useProfile = () =>
  useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<IProfileResponse>("/auth/profile");
      return response.data.data ?? null;
    },
    retry: false,
  });

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<ILoginResponse, AxiosError<{ message: string }>, ILoginBody>({
    mutationFn: async (body) => {
      const response = await api.post<ILoginResponse>("/auth/login", body);
      return response.data;
    },
    onSuccess: (data) => {
      // кэш прошлого пользователя (чаты, заметки, контакты...) не должен
      // пережить вход под другим аккаунтом
      queryClient.clear();
      setAccessToken(data.user.accessToken);
      queryClient.setQueryData(PROFILE_QUERY_KEY, data.user.user);
    },
  });
};

export const useRegister = () => {
  const login = useLogin();

  return useMutation<IRegisterResponse, AxiosError<{ message: string }>, IRegisterBody>({
    mutationFn: async (body) => {
      const formData = new FormData();
      formData.append("name", body.name);
      formData.append("email", body.email);
      formData.append("password", body.password);
      if (body.avatar?.[0]) {
        formData.append("avatar", body.avatar[0]);
      }

      const response = await api.post<IRegisterResponse>(
        "/auth/register",
        formData,
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // после регистрации сразу логиним пользователя, чтобы не заставлять
      // вводить те же данные ещё раз на отдельном экране
      return login.mutateAsync({
        email: variables.email,
        password: variables.password,
      });
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<
    IUpdateProfileResponse,
    AxiosError<{ message: string }>,
    IUpdateProfileBody
  >({
    mutationFn: async (body) => {
      const formData = new FormData();
      if (body.name) formData.append("name", body.name);
      if (body.avatar?.[0]) formData.append("avatar", body.avatar[0]);
      if (body.age !== undefined && body.age !== null) {
        formData.append("age", String(body.age));
      }
      if (body.phone !== undefined && body.phone !== null) {
        formData.append("phone", body.phone);
      }

      const response = await api.put<IUpdateProfileResponse>(
        "/auth/profile",
        formData,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, data.data);
    },
  });
};

export interface IForgotPasswordBody {
  email: string;
}

export interface IResetPasswordBody {
  token: string;
  password: string;
}

export const useForgotPassword = () =>
  useMutation<
    { message: string },
    AxiosError<{ message: string }>,
    IForgotPasswordBody
  >({
    mutationFn: async (body) => {
      const response = await api.post("/auth/forgot-password", body);
      return response.data;
    },
  });

export const useResetPassword = () =>
  useMutation<
    { message: string },
    AxiosError<{ message: string }>,
    IResetPasswordBody
  >({
    mutationFn: async (body) => {
      const response = await api.post("/auth/reset-password", body);
      return response.data;
    },
  });

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSettled: () => {
      clearAccessToken();
      queryClient.clear();
      queryClient.setQueryData(PROFILE_QUERY_KEY, null);
    },
  });
};
