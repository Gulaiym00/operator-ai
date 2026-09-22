"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import scss from "./notes.module.scss";
import {
  useCreateNote,
  useDeleteNote,
  useNotes,
  useUpdateNote,
} from "@/hooks/notes/useNotes";

const formatUpdatedAt = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const Notes = () => {
  const { data: notes, isLoading } = useNotes();
  const { mutate: createNoteMutation, isPending: isCreating } = useCreateNote();
  const { mutate: updateNoteMutation, isPending: isSaving } = useUpdateNote();
  const { mutate: deleteNoteMutation } = useDeleteNote();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // локальный черновик для мгновенного набора текста —
  // само сохранение на бэкенд уходит с задержкой (debounce)
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notesList = notes || [];
  const selectedNote = notesList.find((note) => note.id === selectedId) || null;

  useEffect(() => {
    if (notesList.length > 0 && selectedId === null) {
      setSelectedId(notesList[0]!.id);
    }
  }, [notesList, selectedId]);

  useEffect(() => {
    setDraftTitle(selectedNote?.title || "");
    setDraftContent(selectedNote?.content || "");
  }, [selectedNote?.id]);

  const scheduleSave = (title: string, content: string) => {
    if (!selectedId) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(() => {
      updateNoteMutation({ id: selectedId, body: { title, content } });
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const filteredNotes = notesList.filter(
    (note) =>
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase()),
  );

  const createNote = () => {
    createNoteMutation(undefined, {
      onSuccess: (res) => setSelectedId(res.data.id),
    });
  };

  const deleteNote = () => {
    if (!selectedNote) return;

    const remaining = notesList.filter((note) => note.id !== selectedNote.id);
    deleteNoteMutation(selectedNote.id);
    setSelectedId(remaining[0]?.id ?? null);
  };

  return (
    <section id={scss.notes}>
      <div className="container">
        <div className={scss.notes}>
          {/* HEADER */}

          <header className={scss.header}>
            <div className={scss.title}>
              <div className={scss.titleIcon}>
                <FileText size={20} />
              </div>

              <div>
                <h1>Notes</h1>
                <p>Write, organize and manage your notes</p>
              </div>
            </div>

            <button
              className={scss.createButton}
              onClick={createNote}
              disabled={isCreating}
            >
              <Plus size={17} />
              New note
            </button>
          </header>

          {/* NOTES WORKSPACE */}

          <div className={scss.workspace}>
            {/* SIDEBAR */}

            <aside className={scss.sidebar}>
              <div className={scss.sidebarTop}>
                <div className={scss.search}>
                  <Search size={16} />

                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <button
                  className={scss.smallCreate}
                  onClick={createNote}
                  title="Create note"
                  disabled={isCreating}
                >
                  <Plus size={17} />
                </button>
              </div>

              <div className={scss.notesList}>
                <div className={scss.listTitle}>
                  <span>My notes</span>
                  <small>{isLoading ? "..." : filteredNotes.length}</small>
                </div>

                {filteredNotes.map((note) => (
                  <button
                    key={note.id}
                    className={`${scss.noteItem} ${
                      selectedId === note.id ? scss.active : ""
                    }`}
                    onClick={() => setSelectedId(note.id)}
                  >
                    <div className={scss.noteIcon}>
                      <FileText size={15} />
                    </div>

                    <div className={scss.notePreview}>
                      <strong>{note.title}</strong>
                      <p>{note.content || "No content yet..."}</p>
                      <span>{formatUpdatedAt(note.updated_at)}</span>
                    </div>
                  </button>
                ))}

                {!isLoading && filteredNotes.length === 0 && (
                  <div className={scss.emptyList}>
                    <Search size={25} />
                    <p>No notes found</p>
                  </div>
                )}
              </div>
            </aside>

            {/* EDITOR */}

            <main className={scss.editor}>
              {selectedNote ? (
                <>
                  <div className={scss.editorToolbar}>
                    <div className={scss.toolbarRight}>
                      <span className={scss.saved}>
                        {isSaving ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        {isSaving ? "Saving..." : "Saved"}
                      </span>

                      <button title="Delete note" onClick={deleteNote}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={scss.editorContent}>
                    <input
                      className={scss.noteTitle}
                      value={draftTitle}
                      onChange={(event) => {
                        setDraftTitle(event.target.value);
                        scheduleSave(event.target.value, draftContent);
                      }}
                      placeholder="Note title"
                    />

                    <div className={scss.meta}>
                      Last edited {formatUpdatedAt(selectedNote.updated_at)}
                    </div>

                    <textarea
                      className={scss.textarea}
                      value={draftContent}
                      onChange={(event) => {
                        setDraftContent(event.target.value);
                        scheduleSave(draftTitle, event.target.value);
                      }}
                      placeholder="Start writing your note..."
                    />
                  </div>

                </>
              ) : (
                <div className={scss.noNote}>
                  <FileText size={40} />
                  <h3>{isLoading ? "Loading notes..." : "Select a note"}</h3>
                  <p>
                    {isLoading
                      ? "Fetching your notes..."
                      : "Select a note from the list or create a new one."}
                  </p>

                  {!isLoading && (
                    <button onClick={createNote} disabled={isCreating}>
                      <Plus size={15} />
                      New note
                    </button>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Notes;
