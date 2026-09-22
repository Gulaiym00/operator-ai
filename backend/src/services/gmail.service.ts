import { google, gmail_v1 } from "googleapis";
import { getGoogleAuthClient } from "./googleClient";

type Headers = gmail_v1.Schema$MessagePartHeader[] | undefined;

const getHeader = (headers: Headers, name: string) =>
  headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ||
  "";

const parseSender = (from: string) => {
  const match = from.match(/^(.*?)\s*<(.+)>$/);
  if (match) {
    return { name: match[1]?.replace(/"/g, "").trim() || match[2]!, email: match[2]! };
  }
  return { name: from, email: from };
};

const getGmailClient = async (userId: number) => {
  const auth = await getGoogleAuthClient(userId);
  return google.gmail({ version: "v1", auth });
};

const decodeBody = (data?: string | null) =>
  data ? Buffer.from(data, "base64").toString("utf-8") : "";

const extractBody = (
  payload: gmail_v1.Schema$MessagePart | undefined,
): { text: string; html: string } => {
  if (!payload) return { text: "", html: "" };

  if (payload.parts) {
    let text = "";
    let html = "";
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        text += decodeBody(part.body.data);
      } else if (part.mimeType === "text/html" && part.body?.data) {
        html += decodeBody(part.body.data);
      } else if (part.parts) {
        const nested = extractBody(part);
        text += nested.text;
        html += nested.html;
      }
    }
    return { text, html };
  }

  if (payload.mimeType === "text/html" && payload.body?.data) {
    return { text: "", html: decodeBody(payload.body.data) };
  }

  return { text: decodeBody(payload.body?.data), html: "" };
};

const hasAttachment = (payload: gmail_v1.Schema$MessagePart | undefined): boolean => {
  if (!payload?.parts) return false;
  return payload.parts.some(
    (part) => !!part.filename || hasAttachment(part),
  );
};

export const listEmailsService = async (
  userId: number,
  opts: {
    pageToken?: string | undefined;
    label?: "INBOX" | "STARRED" | undefined;
  } = {},
) => {
  const gmail = await getGmailClient(userId);

  const list = await gmail.users.messages.list({
    userId: "me",
    maxResults: 20,
    labelIds: [opts.label || "INBOX"],
    ...(opts.pageToken ? { pageToken: opts.pageToken } : {}),
  });

  const messages = list.data.messages || [];

  const details = await Promise.all(
    messages.map((m) =>
      gmail.users.messages.get({
        userId: "me",
        id: m.id!,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      }),
    ),
  );

  const emails = details.map((res) => {
    const headers = res.data.payload?.headers;
    const from = parseSender(getHeader(headers, "From"));
    const labelIds = res.data.labelIds || [];

    return {
      id: res.data.id,
      threadId: res.data.threadId,
      sender: from.name,
      email: from.email,
      subject: getHeader(headers, "Subject") || "(no subject)",
      preview: res.data.snippet || "",
      date: getHeader(headers, "Date"),
      unread: labelIds.includes("UNREAD"),
      starred: labelIds.includes("STARRED"),
      hasAttachment: hasAttachment(res.data.payload),
    };
  });

  return { emails, nextPageToken: list.data.nextPageToken || null };
};

export const getEmailService = async (userId: number, messageId: string) => {
  const gmail = await getGmailClient(userId);

  const res = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const headers = res.data.payload?.headers;
  const from = parseSender(getHeader(headers, "From"));
  const { text, html } = extractBody(res.data.payload);
  const labelIds = res.data.labelIds || [];

  if (labelIds.includes("UNREAD")) {
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: { removeLabelIds: ["UNREAD"] },
    });
  }

  return {
    id: res.data.id,
    threadId: res.data.threadId,
    sender: from.name,
    email: from.email,
    to: getHeader(headers, "To"),
    subject: getHeader(headers, "Subject") || "(no subject)",
    date: getHeader(headers, "Date"),
    bodyText: text,
    bodyHtml: html,
    starred: labelIds.includes("STARRED"),
    messageIdHeader: getHeader(headers, "Message-ID"),
  };
};

const buildRawMessage = (opts: {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string | undefined;
  references?: string | undefined;
}) => {
  const headers = [
    `To: ${opts.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(opts.subject).toString("base64")}?=`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `MIME-Version: 1.0`,
  ];
  if (opts.inReplyTo) headers.push(`In-Reply-To: ${opts.inReplyTo}`);
  if (opts.references) headers.push(`References: ${opts.references}`);

  const message = `${headers.join("\r\n")}\r\n\r\n${opts.body}`;

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const sendEmailService = async (
  userId: number,
  body: {
    to: string;
    subject: string;
    body: string;
    threadId?: string | undefined;
    inReplyTo?: string | undefined;
    references?: string | undefined;
  },
) => {
  const gmail = await getGmailClient(userId);

  const raw = buildRawMessage(body);

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
      ...(body.threadId ? { threadId: body.threadId } : {}),
    },
  });

  return { id: res.data.id, threadId: res.data.threadId };
};

export const toggleStarService = async (
  userId: number,
  messageId: string,
  starred: boolean,
) => {
  const gmail = await getGmailClient(userId);
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: starred
      ? { addLabelIds: ["STARRED"] }
      : { removeLabelIds: ["STARRED"] },
  });
};

export const archiveEmailService = async (userId: number, messageId: string) => {
  const gmail = await getGmailClient(userId);
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: { removeLabelIds: ["INBOX"] },
  });
};

export const deleteEmailService = async (userId: number, messageId: string) => {
  const gmail = await getGmailClient(userId);
  await gmail.users.messages.trash({ userId: "me", id: messageId });
};
