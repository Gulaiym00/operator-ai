import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { api } from "../api/api";

export interface IDriveFile {
  id: string;
  name: string;
  isFolder: boolean;
  mimeType: string;
  modifiedTime: string;
  size: number | null;
  starred: boolean;
  owner: string;
  webViewLink: string;
  iconLink: string;
}

interface IFilesData {
  files: IDriveFile[];
  nextPageToken: string | null;
}

interface IFilesResponse {
  message: string;
  data: IFilesData;
}

export const DRIVE_QUERY_KEY = ["drive-files"];

export const useDriveFiles = (opts: {
  folderId?: string;
  query?: string;
  starredOnly?: boolean;
  pageToken?: string;
}) =>
  useQuery({
    queryKey: [...DRIVE_QUERY_KEY, opts],
    queryFn: async () => {
      const response = await api.get<IFilesResponse>("/drive", {
        params: {
          ...(opts.folderId ? { folderId: opts.folderId } : {}),
          ...(opts.query ? { q: opts.query } : {}),
          ...(opts.starredOnly ? { starred: "true" } : {}),
          ...(opts.pageToken ? { pageToken: opts.pageToken } : {}),
        },
      });
      return response.data.data;
    },
    // "Google account is not connected" не исчезнет от повторных попыток
    retry: false,
  });

export const useToggleDriveStar = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    AxiosError<{ message: string }>,
    { id: string; starred: boolean }
  >({
    mutationFn: async ({ id, starred }) => {
      await api.patch(`/drive/${id}/star`, { starred });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVE_QUERY_KEY });
    },
  });
};

export const useTrashDriveFile = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<{ message: string }>, string>({
    mutationFn: async (id) => {
      await api.delete(`/drive/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVE_QUERY_KEY });
    },
  });
};
