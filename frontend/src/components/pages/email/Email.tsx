"use client";

import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Mail,
  Paperclip,
  RefreshCw,
  Reply,
  Search,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import scss from "./email.module.scss";
import {
  EMAILS_QUERY_KEY,
  IEmailListItem,
  useArchiveEmail,
  useDeleteEmail,
  useEmail,
  useEmails,
  useSendEmail,
  useToggleStar,
} from "@/hooks/email/useEmail";
import { useAskAi } from "@/hooks/chat/useChat";

const googleAuthUrl = `${
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
}/auth/google`;

const formatListTime = (dateHeader: string) => {
  if (!dateHeader) return "";
  const date = new Date(dateHeader);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const initial = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

const Email = () => {
  const queryClient = useQueryClient();

  const [label, setLabel] = useState<"INBOX" | "STARRED">("INBOX");
  const [pageStack, setPageStack] = useState<(string | undefined)[]>([undefined]);
  const [pageIndex, setPageIndex] = useState(0);
  const currentPageToken = pageStack[pageIndex];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  const {
    data: listData,
    isLoading: isListLoading,
    isError: isListError,
    error: listError,
    refetch: refetchList,
    isFetching: isListFetching,
  } = useEmails(currentPageToken, label);

  const switchLabel = (next: "INBOX" | "STARRED") => {
    if (next === label) return;
    setLabel(next);
    setPageStack([undefined]);
    setPageIndex(0);
    setSelectedId(null);
  };

  const { data: selectedEmail, isLoading: isEmailLoading } = useEmail(selectedId);

  const { mutate: sendEmail, isPending: isSending, error: sendError } =
    useSendEmail();
  const { mutate: toggleStar } = useToggleStar();
  const { mutate: archiveEmail, isPending: isArchiving } = useArchiveEmail();
  const { mutate: deleteEmail, isPending: isDeleting } = useDeleteEmail();
  const { mutate: askAi, isPending: isDrafting } = useAskAi();

  // после открытия письма бэкенд снимает метку UNREAD — обновляем список,
  // чтобы жирный шрифт непрочитанного тоже пропал
  useEffect(() => {
    if (selectedEmail) {
      queryClient.invalidateQueries({ queryKey: EMAILS_QUERY_KEY });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmail?.id]);

  useEffect(() => {
    setIsReplying(false);
    setReplyText("");
  }, [selectedId]);

  const emails = listData?.emails || [];

  const filteredEmails = useMemo(() => {
    if (!search) return emails;
    const q = search.toLowerCase();
    return emails.filter(
      (email) =>
        email.sender.toLowerCase().includes(q) ||
        email.subject.toLowerCase().includes(q) ||
        email.preview.toLowerCase().includes(q),
    );
  }, [emails, search]);

  const notConnected =
    isListError &&
    (listError as any)?.response?.data?.message === "Google account is not connected";

  const selectEmail = (email: IEmailListItem) => setSelectedId(email.id);

  const handleRefresh = () => refetchList();

  const goPrevPage = () => setPageIndex((i) => Math.max(0, i - 1));
  const goNextPage = () => {
    if (!listData?.nextPageToken) return;
    setPageStack((prev) => {
      const next = prev.slice(0, pageIndex + 1);
      next.push(listData.nextPageToken as string);
      return next;
    });
    setPageIndex((i) => i + 1);
  };

  const handleToggleStar = (email: IEmailListItem | { id: string; starred: boolean }) => {
    toggleStar({ id: email.id, starred: !email.starred });
  };

  const handleArchive = () => {
    if (!selectedEmail) return;
    archiveEmail(selectedEmail.id);
    setSelectedId(null);
  };

  const handleDelete = () => {
    if (!selectedEmail) return;
    deleteEmail(selectedEmail.id);
    setSelectedId(null);
  };

  const handleSendReply = () => {
    if (!selectedEmail || !replyText.trim()) return;

    sendEmail(
      {
        to: selectedEmail.email,
        subject: selectedEmail.subject.startsWith("Re:")
          ? selectedEmail.subject
          : `Re: ${selectedEmail.subject}`,
        body: replyText,
        threadId: selectedEmail.threadId,
        inReplyTo: selectedEmail.messageIdHeader,
        references: selectedEmail.messageIdHeader,
      },
      {
        onSuccess: () => {
          setIsReplying(false);
          setReplyText("");
        },
      },
    );
  };

  const handleAiReply = () => {
    if (!selectedEmail) return;
    setIsReplying(true);

    const prompt = [
      "Draft a short, professional reply to this email as if you were me.",
      "Only output the reply text itself, no explanations or subject line.",
      "",
      `From: ${selectedEmail.sender} <${selectedEmail.email}>`,
      `Subject: ${selectedEmail.subject}`,
      "",
      selectedEmail.bodyText || "(email has no plain text body)",
    ].join("\n");

    askAi(
      { message: prompt },
      {
        onSuccess: (reply) => setReplyText(reply),
      },
    );
  };

  const sanitizedHtml = selectedEmail?.bodyHtml
    ? DOMPurify.sanitize(selectedEmail.bodyHtml, { ADD_ATTR: ["target"] })
    : null;

  return (
    <section id={scss.email}>
      <div className="container">
        <div className={scss.email}>
          {/* Header */}
          <div className={scss.header}>
            <div className={scss.title}>
              <div className={scss.titleIcon}>
                <Mail size={20} />
              </div>

              <div>
                <h1>Email</h1>
                <p>Manage your emails with Operator AI</p>
              </div>
            </div>

            <button
              className={scss.refreshButton}
              type="button"
              onClick={handleRefresh}
              disabled={isListFetching}
            >
              <RefreshCw size={17} />
              <span>{isListFetching ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>

          {/* Toolbar */}
          <div className={scss.toolbar}>
            <div className={scss.search}>
              <Search size={18} />

              <input
                type="text"
                placeholder="Search emails..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className={scss.toolbarActions}>
              <button
                type="button"
                className={label === "INBOX" ? scss.activeFilter : ""}
                onClick={() => switchLabel("INBOX")}
              >
                <Inbox size={17} />
                Inbox
              </button>

              <button
                type="button"
                className={label === "STARRED" ? scss.activeFilter : ""}
                onClick={() => switchLabel("STARRED")}
              >
                <Star size={17} />
                Starred
              </button>
            </div>
          </div>

          {/* Main email layout */}
          <div className={scss.emailLayout}>
            {/* Email list */}
            <aside className={scss.emailList}>
              <div className={scss.listHeader}>
                <div>
                  <h2>Inbox</h2>
                  <span>
                    {isListLoading ? "Loading..." : `${filteredEmails.length} messages`}
                  </span>
                </div>
              </div>

              <div className={scss.messages}>
                {!notConnected &&
                  filteredEmails.map((email) => (
                    <button
                      key={email.id}
                      type="button"
                      className={`${scss.message} ${
                        selectedId === email.id ? scss.active : ""
                      } ${email.unread ? scss.unread : ""}`}
                      onClick={() => selectEmail(email)}
                    >
                      <div className={scss.messageTop}>
                        <div className={scss.sender}>
                          <div className={scss.avatar}>{initial(email.sender)}</div>

                          <span>{email.sender}</span>
                        </div>

                        <span className={scss.time}>{formatListTime(email.date)}</span>
                      </div>

                      <div className={scss.messageSubject}>
                        <span>{email.subject}</span>

                        {email.starred && (
                          <Star size={15} className={scss.starred} fill="currentColor" />
                        )}
                      </div>

                      <div className={scss.preview}>{email.preview}</div>

                      {email.hasAttachment && (
                        <div className={scss.attachment}>
                          <Paperclip size={13} />
                          Attachment
                        </div>
                      )}
                    </button>
                  ))}

                {!notConnected && !isListLoading && filteredEmails.length === 0 && (
                  <div className={scss.empty} style={{ minHeight: 300 }}>
                    <Mail size={32} />
                    <h3>No emails</h3>
                    <p>Your inbox is empty.</p>
                  </div>
                )}
              </div>
            </aside>

            {/* Email content */}
            <main className={scss.emailContent}>
              {notConnected ? (
                <div className={scss.connectGoogle}>
                  <Mail size={40} />
                  <h3>Connect your Google account</h3>
                  <p>
                    Sign in with Google to let Operator AI read and reply to your
                    Gmail inbox.
                  </p>
                  <a href={googleAuthUrl}>Connect Google</a>
                </div>
              ) : selectedId ? (
                <>
                  <div className={scss.emailToolbar}>
                    <div className={scss.emailActions}>
                      <button
                        type="button"
                        title="Archive"
                        onClick={handleArchive}
                        disabled={isArchiving || !selectedEmail}
                      >
                        <Archive size={18} />
                      </button>

                      <button
                        type="button"
                        title="Delete"
                        onClick={handleDelete}
                        disabled={isDeleting || !selectedEmail}
                      >
                        <Trash2 size={18} />
                      </button>

                      <button
                        type="button"
                        title={selectedEmail?.starred ? "Unstar" : "Star"}
                        onClick={() => selectedEmail && handleToggleStar(selectedEmail)}
                        disabled={!selectedEmail}
                      >
                        <Star
                          size={18}
                          fill={selectedEmail?.starred ? "currentColor" : "none"}
                        />
                      </button>
                    </div>

                    <div className={scss.pagination}>
                      <button
                        type="button"
                        onClick={goPrevPage}
                        disabled={pageIndex === 0 || isListFetching}
                      >
                        <ChevronLeft size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={goNextPage}
                        disabled={!listData?.nextPageToken || isListFetching}
                      >
                        <ChevronRight size={17} />
                      </button>
                    </div>
                  </div>

                  <div className={scss.emailBody}>
                    {isEmailLoading || !selectedEmail ? (
                      <p>Loading email...</p>
                    ) : (
                      <>
                        <div className={scss.emailHeading}>
                          <div>
                            <h2>{selectedEmail.subject}</h2>

                            <div className={scss.senderInfo}>
                              <div className={scss.largeAvatar}>
                                {initial(selectedEmail.sender)}
                              </div>

                              <div>
                                <strong>{selectedEmail.sender}</strong>
                                <span>{selectedEmail.email}</span>
                              </div>
                            </div>
                          </div>

                          <div className={scss.emailDate}>
                            {selectedEmail.date
                              ? new Date(selectedEmail.date).toLocaleString()
                              : ""}
                          </div>
                        </div>

                        <div className={scss.content}>
                          {sanitizedHtml ? (
                            <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
                          ) : (
                            selectedEmail.bodyText
                              .split(/\n{2,}/)
                              .map((paragraph, i) => <p key={i}>{paragraph}</p>)
                          )}
                        </div>

                        <div className={scss.aiBox}>
                          <div className={scss.aiIcon}>✦</div>

                          <div>
                            <strong>Operator AI</strong>
                            <p>
                              Ask me to summarize this email, reply to it, create a
                              task or schedule a meeting.
                            </p>
                          </div>
                        </div>

                        {isReplying ? (
                          <div className={scss.replyBox}>
                            <textarea
                              value={replyText}
                              onChange={(event) => setReplyText(event.target.value)}
                              placeholder={
                                isDrafting ? "Drafting with AI..." : "Write your reply..."
                              }
                              disabled={isDrafting}
                            />

                            <div className={scss.replyBoxActions}>
                              <button
                                type="button"
                                className={scss.send}
                                onClick={handleSendReply}
                                disabled={isSending || isDrafting || !replyText.trim()}
                              >
                                <Send size={15} />
                                {isSending ? "Sending..." : "Send"}
                              </button>

                              <button
                                type="button"
                                onClick={handleAiReply}
                                disabled={isDrafting}
                              >
                                ✦ {isDrafting ? "Drafting..." : "Draft with AI"}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setIsReplying(false);
                                  setReplyText("");
                                }}
                                disabled={isSending}
                              >
                                Cancel
                              </button>
                            </div>

                            {sendError && (
                              <p className={scss.errorText}>
                                {sendError.response?.data?.message ||
                                  "Couldn't send the reply. Please try again."}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className={scss.reply}>
                            <button type="button" onClick={() => setIsReplying(true)}>
                              <Reply size={17} />
                              Reply
                            </button>

                            <button
                              type="button"
                              className={scss.aiReply}
                              onClick={handleAiReply}
                            >
                              ✦ Reply with AI
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className={scss.empty}>
                  <Mail size={40} />
                  <h3>Select an email</h3>
                  <p>Choose an email from your inbox to read it.</p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Email;
