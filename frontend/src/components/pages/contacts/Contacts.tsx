"use client";

import { useEffect, useRef, useState } from "react";
import {
  Briefcase,
  Check,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";

import scss from "./contacts.module.scss";
import {
  IContactBody,
  useContacts,
  useCreateContact,
  useDeleteContact,
  useUpdateContact,
} from "@/hooks/contacts/useContacts";

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const Contacts = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // без debounce каждое нажатие клавиши бьёт по /contacts?search=... —
  // ждём паузу в наборе, а не шлём запрос на каждый символ
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [search]);

  const { data: contacts, isLoading } = useContacts(debouncedSearch);
  const { mutate: createContactMutation, isPending: isCreating } = useCreateContact();
  const { mutate: updateContactMutation, isPending: isSaving } = useUpdateContact();
  const { mutate: deleteContactMutation } = useDeleteContact();

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [draft, setDraft] = useState<IContactBody>({});
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const contactsList = contacts || [];
  const selectedContact = contactsList.find((c) => c.id === selectedId) || null;

  useEffect(() => {
    if (contactsList.length > 0 && selectedId === null) {
      setSelectedId(contactsList[0]!.id);
    }
  }, [contactsList, selectedId]);

  useEffect(() => {
    setDraft({
      name: selectedContact?.name || "",
      email: selectedContact?.email || "",
      phone: selectedContact?.phone || "",
      company: selectedContact?.company || "",
      notes: selectedContact?.notes || "",
    });
  }, [selectedContact?.id]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const scheduleSave = (nextDraft: IContactBody) => {
    if (!selectedId) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(() => {
      updateContactMutation({ id: selectedId, body: nextDraft });
    }, 600);
  };

  const updateField = (field: keyof IContactBody, value: string) => {
    const next = { ...draft, [field]: value };
    setDraft(next);
    scheduleSave(next);
  };

  const createContact = () => {
    createContactMutation(
      { name: "New contact" },
      { onSuccess: (res) => setSelectedId(res.data.id) },
    );
  };

  const deleteContact = () => {
    if (!selectedContact) return;

    const remaining = contactsList.filter((c) => c.id !== selectedContact.id);
    deleteContactMutation(selectedContact.id);
    setSelectedId(remaining[0]?.id ?? null);
  };

  return (
    <section id={scss.contacts}>
      <div className="container">
        <div className={scss.contacts}>
          {/* HEADER */}

          <header className={scss.header}>
            <div className={scss.title}>
              <div className={scss.titleIcon}>
                <Users size={20} />
              </div>

              <div>
                <h1>Contacts</h1>
                <p>Keep track of the people and companies you work with</p>
              </div>
            </div>

            <button
              className={scss.createButton}
              onClick={createContact}
              disabled={isCreating}
            >
              <Plus size={17} />
              New contact
            </button>
          </header>

          {/* WORKSPACE */}

          <div className={scss.workspace}>
            {/* SIDEBAR */}

            <aside className={scss.sidebar}>
              <div className={scss.sidebarTop}>
                <div className={scss.search}>
                  <Search size={16} />

                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <button
                  className={scss.smallCreate}
                  onClick={createContact}
                  title="Create contact"
                  disabled={isCreating}
                >
                  <Plus size={17} />
                </button>
              </div>

              <div className={scss.contactsList}>
                <div className={scss.listTitle}>
                  <span>My contacts</span>
                  <small>{isLoading ? "..." : contactsList.length}</small>
                </div>

                {contactsList.map((contact) => (
                  <button
                    key={contact.id}
                    className={`${scss.contactItem} ${
                      selectedId === contact.id ? scss.active : ""
                    }`}
                    onClick={() => setSelectedId(contact.id)}
                  >
                    <div className={scss.contactAvatar}>{initials(contact.name)}</div>

                    <div className={scss.contactPreview}>
                      <strong>{contact.name}</strong>
                      <p>{contact.company || contact.email || "No details yet"}</p>
                      <span>{contact.phone || ""}</span>
                    </div>
                  </button>
                ))}

                {!isLoading && contactsList.length === 0 && (
                  <div className={scss.emptyList}>
                    <Search size={25} />
                    <p>No contacts found</p>
                  </div>
                )}
              </div>
            </aside>

            {/* EDITOR */}

            <main className={scss.editor}>
              {selectedContact ? (
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

                      <button title="Delete contact" onClick={deleteContact}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={scss.editorContent}>
                    <input
                      className={scss.contactName}
                      value={draft.name || ""}
                      onChange={(event) => updateField("name", event.target.value)}
                      placeholder="Contact name"
                    />

                    <div className={scss.fieldsGrid}>
                      <div className={scss.field}>
                        <label>
                          <Mail size={11} style={{ marginRight: 4 }} />
                          Email
                        </label>
                        <input
                          type="email"
                          value={draft.email || ""}
                          onChange={(event) => updateField("email", event.target.value)}
                          placeholder="name@example.com"
                        />
                      </div>

                      <div className={scss.field}>
                        <label>
                          <Phone size={11} style={{ marginRight: 4 }} />
                          Phone
                        </label>
                        <input
                          value={draft.phone || ""}
                          onChange={(event) => updateField("phone", event.target.value)}
                          placeholder="+1 555 000 0000"
                        />
                      </div>

                      <div className={`${scss.field} ${scss.fieldFull}`}>
                        <label>
                          <Briefcase size={11} style={{ marginRight: 4 }} />
                          Company
                        </label>
                        <input
                          value={draft.company || ""}
                          onChange={(event) => updateField("company", event.target.value)}
                          placeholder="Company name"
                        />
                      </div>

                      <div className={`${scss.field} ${scss.fieldFull}`}>
                        <label>Notes</label>
                        <textarea
                          value={draft.notes || ""}
                          onChange={(event) => updateField("notes", event.target.value)}
                          placeholder="Anything worth remembering..."
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className={scss.noContact}>
                  <Users size={40} />
                  <h3>{isLoading ? "Loading contacts..." : "Select a contact"}</h3>
                  <p>
                    {isLoading
                      ? "Fetching your contacts..."
                      : "Select a contact from the list or create a new one."}
                  </p>

                  {!isLoading && (
                    <button onClick={createContact} disabled={isCreating}>
                      <Plus size={15} />
                      New contact
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

export default Contacts;
