"use client";

import { useMemo, useState } from "react";
import {
  File,
  FileText,
  Folder,
  Grid2X2,
  List,
  MoreVertical,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
} from "lucide-react";

import scss from "./drive.module.scss";
import {
  IDriveFile,
  useDriveFiles,
  useToggleDriveStar,
  useTrashDriveFile,
} from "@/hooks/drive/useDrive";

const googleAuthUrl = `${
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
}/auth/google`;

const formatModified = (iso: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileTypeClass = (file: IDriveFile) => {
  if (file.isFolder) return "folder";
  if (file.mimeType.includes("pdf")) return "pdf";
  if (file.mimeType.startsWith("image/")) return "image";
  return "document";
};

interface Crumb {
  id: string;
  name: string;
}

const Drive = () => {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("list");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [folderStack, setFolderStack] = useState<Crumb[]>([
    { id: "root", name: "My Drive" },
  ]);

  const currentFolder = folderStack[folderStack.length - 1]!;

  const {
    data: filesData,
    isLoading,
    isError,
    error,
  } = useDriveFiles({
    folderId: currentFolder.id === "root" ? undefined : currentFolder.id,
    query: search || undefined,
  });

  const { mutate: toggleStar } = useToggleDriveStar();
  const { mutate: trashFile } = useTrashDriveFile();

  const notConnected =
    isError &&
    (error as any)?.response?.data?.message === "Google account is not connected";

  const items = filesData?.files || [];

  const getIcon = (item: IDriveFile) => {
    if (item.isFolder) return <Folder size={22} />;
    if (fileTypeClass(item) === "pdf" || fileTypeClass(item) === "document") {
      return <FileText size={22} />;
    }
    return <File size={22} />;
  };

  const openFolder = (item: IDriveFile) => {
    if (!item.isFolder) {
      if (item.webViewLink) window.open(item.webViewLink, "_blank");
      return;
    }
    setFolderStack((prev) => [...prev, { id: item.id, name: item.name }]);
  };

  const goToCrumb = (index: number) => {
    setFolderStack((prev) => prev.slice(0, index + 1));
  };

  const handleToggleStar = (item: IDriveFile) => {
    toggleStar({ id: item.id, starred: !item.starred });
    setActiveMenu(null);
  };

  const handleDelete = (item: IDriveFile) => {
    trashFile(item.id);
    setActiveMenu(null);
  };

  return (
    <section id={scss.drive}>
      <div className="container">
        <div className={scss.drive}>
          {/* HEADER */}

          <header className={scss.header}>
            <div className={scss.title}>
              <div className={scss.icon}>
                <Folder size={21} />
              </div>

              <div>
                <h1>Drive</h1>
                <p>Manage your files with Operator AI</p>
              </div>
            </div>

            <div className={scss.headerActions}>
              <a
                className={scss.uploadButton}
                href="https://drive.google.com/drive/my-drive"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <Upload size={16} />
                Upload
              </a>

              <a
                className={scss.createButton}
                href="https://drive.google.com/drive/my-drive"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <Plus size={17} />
                New
              </a>
            </div>
          </header>

          {/* SEARCH */}

          <div className={scss.toolbar}>
            <div className={scss.search}>
              <Search size={17} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search in Drive"
              />
            </div>

            <div className={scss.toolbarRight}>
              <div className={scss.viewSwitcher}>
                <button
                  className={view === "list" ? scss.active : ""}
                  onClick={() => setView("list")}
                >
                  <List size={17} />
                </button>

                <button
                  className={view === "grid" ? scss.active : ""}
                  onClick={() => setView("grid")}
                >
                  <Grid2X2 size={17} />
                </button>
              </div>
            </div>
          </div>

          {/* BREADCRUMB */}

          <div className={scss.breadcrumb}>
            {folderStack.map((crumb, index) => (
              <span key={crumb.id} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                {index > 0 && <span>/</span>}
                <button onClick={() => goToCrumb(index)}>{crumb.name}</button>
              </span>
            ))}
          </div>

          {notConnected ? (
            <div className={scss.empty} style={{ minHeight: 400 }}>
              <Folder size={38} />
              <h3>Connect your Google account</h3>
              <p>Sign in with Google to browse your real Drive files.</p>
              <a
                className={scss.createButton}
                href={googleAuthUrl}
                style={{ textDecoration: "none", marginTop: 14 }}
              >
                Connect Google
              </a>
            </div>
          ) : (
            <>
              {/* CONTENT */}

              <div className={scss.content}>
                <div className={scss.contentHeader}>
                  <div>
                    <h2>{currentFolder.name}</h2>
                    <span>{isLoading ? "Loading..." : `${items.length} items`}</span>
                  </div>
                </div>

                {/* LIST VIEW */}

                {view === "list" && (
                  <div className={scss.list}>
                    <div className={scss.listHeader}>
                      <span>Name</span>
                      <span>Owner</span>
                      <span>Last modified</span>
                      <span>File size</span>
                      <span></span>
                    </div>

                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={scss.listItem}
                        onDoubleClick={() => openFolder(item)}
                      >
                        <div className={scss.fileName}>
                          <div className={`${scss.fileIcon} ${scss[fileTypeClass(item)]}`}>
                            {getIcon(item)}
                          </div>

                          <span>{item.name}</span>

                          {item.starred && (
                            <Star size={14} className={scss.starred} fill="currentColor" />
                          )}
                        </div>

                        <span className={scss.owner}>{item.owner}</span>
                        <span className={scss.modified}>{formatModified(item.modifiedTime)}</span>
                        <span className={scss.size}>{formatSize(item.size)}</span>

                        <div className={scss.itemActions}>
                          <button onClick={() => handleToggleStar(item)} title="Star">
                            <Star size={15} fill={item.starred ? "currentColor" : "none"} />
                          </button>

                          <button
                            onClick={() =>
                              setActiveMenu(activeMenu === item.id ? null : item.id)
                            }
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenu === item.id && (
                            <div className={scss.menu}>
                              <button onClick={() => handleToggleStar(item)}>
                                <Star size={14} />
                                {item.starred ? "Remove star" : "Add to starred"}
                              </button>

                              <button onClick={() => handleDelete(item)}>
                                <Trash2 size={14} />
                                Move to trash
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* GRID VIEW */}

                {view === "grid" && (
                  <div className={scss.grid}>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={scss.card}
                        onDoubleClick={() => openFolder(item)}
                      >
                        <div className={scss.cardPreview}>
                          <div className={`${scss.largeFileIcon} ${scss[fileTypeClass(item)]}`}>
                            {getIcon(item)}
                          </div>

                          <button
                            className={scss.cardMenu}
                            onClick={() =>
                              setActiveMenu(activeMenu === item.id ? null : item.id)
                            }
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenu === item.id && (
                            <div className={scss.menu}>
                              <button onClick={() => handleToggleStar(item)}>
                                <Star size={14} />
                                {item.starred ? "Remove star" : "Add to starred"}
                              </button>

                              <button onClick={() => handleDelete(item)}>
                                <Trash2 size={14} />
                                Move to trash
                              </button>
                            </div>
                          )}
                        </div>

                        <div className={scss.cardInfo}>
                          <div className={scss.cardName}>
                            <span>{item.name}</span>

                            {item.starred && (
                              <Star size={13} className={scss.starred} fill="currentColor" />
                            )}
                          </div>

                          <p>
                            {formatModified(item.modifiedTime)} · {item.owner}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isLoading && items.length === 0 && (
                  <div className={scss.empty}>
                    <Folder size={38} />
                    <h3>No files found</h3>
                    <p>Try another search or a different folder.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Drive;
