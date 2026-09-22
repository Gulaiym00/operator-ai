import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { api } from "../api/api";

export type IssueStatus = "todo" | "progress" | "review" | "done";
export type IssuePriority = "low" | "medium" | "high";
export type IssueType = "task" | "bug";

export interface ITask {
  id: number;
  key: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  sprint: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface IIssuesResponse {
  message: string;
  data: ITask[];
}

interface IIssueResponse {
  message: string;
  data: ITask;
}

export interface IIssueBody {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
  sprint?: string;
  dueDate?: string | null;
}

export const TASKS_QUERY_KEY = ["tasks"];

export const useIssues = () =>
  useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<IIssuesResponse>("/tasks");
      return response.data.data;
    },
  });

export const useCreateIssue = () => {
  const queryClient = useQueryClient();

  return useMutation<IIssueResponse, AxiosError<{ message: string }>, IIssueBody>({
    mutationFn: async (body) => {
      const response = await api.post<IIssueResponse>("/tasks", body);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useUpdateIssue = () => {
  const queryClient = useQueryClient();

  return useMutation<
    IIssueResponse,
    AxiosError<{ message: string }>,
    { id: number; body: IIssueBody }
  >({
    mutationFn: async ({ id, body }) => {
      const response = await api.put<IIssueResponse>(`/tasks/${id}`, body);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useDeleteIssue = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<{ message: string }>, number>({
    mutationFn: async (id) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};
