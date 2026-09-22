import { drive_v3, google } from "googleapis";
import { getGoogleAuthClient } from "./googleClient";
import { apiErrors } from "../utils/apiErrors";

const getDriveClient = async (userId: number) => {
  const auth = await getGoogleAuthClient(userId);
  return google.drive({ version: "v3", auth });
};

const FIELDS =
  "id, name, mimeType, modifiedTime, size, starred, trashed, parents, iconLink, webViewLink, owners(displayName)";

const FOLDER_MIME = "application/vnd.google-apps.folder";

const mapFile = (file: drive_v3.Schema$File) => ({
  id: file.id,
  name: file.name,
  isFolder: file.mimeType === FOLDER_MIME,
  mimeType: file.mimeType,
  modifiedTime: file.modifiedTime || "",
  size: file.size ? Number(file.size) : null,
  starred: !!file.starred,
  owner: file.owners?.[0]?.displayName || "",
  webViewLink: file.webViewLink || "",
  iconLink: file.iconLink || "",
});

export const listFilesService = async (
  userId: number,
  opts: {
    folderId?: string | undefined;
    query?: string | undefined;
    starredOnly?: boolean | undefined;
    pageToken?: string | undefined;
  } = {},
) => {
  if (opts.folderId && !/^[\w-]+$/.test(opts.folderId)) {
    throw apiErrors.badRequest("Invalid folder id");
  }

  const drive = await getDriveClient(userId);

  const filters = ["trashed = false"];
  if (opts.starredOnly) {
    filters.push("starred = true");
  } else {
    filters.push(`'${opts.folderId || "root"}' in parents`);
  }
  if (opts.query) {
    filters.push(`name contains '${opts.query.replace(/[\\']/g, "\\$&")}'`);
  }

  const res = await drive.files.list({
    q: filters.join(" and "),
    fields: `nextPageToken, files(${FIELDS})`,
    orderBy: "folder,name",
    pageSize: 50,
    ...(opts.pageToken ? { pageToken: opts.pageToken } : {}),
  });

  return {
    files: (res.data.files || []).map(mapFile),
    nextPageToken: res.data.nextPageToken || null,
  };
};

export const toggleStarService = async (
  userId: number,
  fileId: string,
  starred: boolean,
) => {
  const drive = await getDriveClient(userId);
  await drive.files.update({ fileId, requestBody: { starred } });
};

export const trashFileService = async (userId: number, fileId: string) => {
  const drive = await getDriveClient(userId);
  await drive.files.update({ fileId, requestBody: { trashed: true } });
};
