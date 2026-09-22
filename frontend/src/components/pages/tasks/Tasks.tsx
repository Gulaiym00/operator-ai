"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bug,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Circle,
  KanbanSquare,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";

import scss from "./tasks.module.scss";
import {
  ITask,
  IssuePriority,
  IssueStatus,
  useCreateIssue,
  useDeleteIssue,
  useIssues,
  useUpdateIssue,
} from "@/hooks/tasks/useTasks";

const formatDueDate = (dueDate: string | null) => {
  if (!dueDate) return "No due date";
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return dueDate;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const getStatusTitle = (status: IssueStatus) => {
  switch (status) {
    case "todo":
      return "To do";
    case "progress":
      return "In progress";
    case "review":
      return "In review";
    case "done":
      return "Done";
  }
};

const getStatusIcon = (status: IssueStatus) => {
  switch (status) {
    case "todo":
      return <Circle size={13} />;
    case "progress":
      return <KanbanSquare size={13} />;
    case "review":
      return <Circle size={13} />;
    case "done":
      return <CheckCircle2 size={13} />;
  }
};

const DRAG_MIME = "application/x-task-id";

interface TaskCardProps {
  task: ITask;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onChangeStatus: (status: IssueStatus) => void;
  onChangePriority: (priority: IssuePriority) => void;
  onDelete: () => void;
  onSaveFields: (fields: { title?: string; description?: string }) => void;
}

const TaskCard = ({
  task,
  isMenuOpen,
  onToggleMenu,
  onChangeStatus,
  onChangePriority,
  onDelete,
  onSaveFields,
}: TaskCardProps) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [isDragging, setIsDragging] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
  }, [task.title, task.description]);

  const scheduleSave = (nextTitle: string, nextDescription: string) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      onSaveFields({ title: nextTitle, description: nextDescription });
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  return (
    <article
      className={`${scss.taskCard} ${isDragging ? scss.dragging : ""}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(DRAG_MIME, String(task.id));
        event.dataTransfer.effectAllowed = "move";
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
    >
      <div className={scss.taskTop}>
        <div className={scss.issueKey}>
          {task.type === "bug" ? <Bug size={12} /> : <CheckCircle2 size={12} />}
          {task.key}
        </div>

        <div className={scss.taskMenu}>
          <button onClick={onToggleMenu}>
            <MoreHorizontal size={15} />
          </button>

          {isMenuOpen && (
            <div className={scss.dropdown}>
              <button onClick={() => onChangeStatus("todo")}>
                Move to To do
              </button>

              <button onClick={() => onChangeStatus("progress")}>
                Move to In progress
              </button>

              <button onClick={() => onChangeStatus("review")}>
                Move to Review
              </button>

              <button onClick={() => onChangeStatus("done")}>
                Mark as done
              </button>

              <div className={scss.dropdownDivider} />

              <button
                onClick={() =>
                  onChangePriority(
                    task.priority === "high"
                      ? "medium"
                      : task.priority === "medium"
                        ? "low"
                        : "high",
                  )
                }
              >
                Change priority
              </button>

              <div className={scss.dropdownDivider} />

              <button onClick={onDelete}>
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <input
        className={scss.taskTitleInput}
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          scheduleSave(event.target.value, description);
        }}
        placeholder="Issue title"
      />

      <textarea
        className={scss.description}
        value={description}
        rows={2}
        onChange={(event) => {
          setDescription(event.target.value);
          scheduleSave(title, event.target.value);
        }}
        placeholder="Add task description..."
      />

      <div className={scss.taskInfo}>
        <span className={`${scss.priority} ${scss[task.priority]}`}>
          {task.priority}
        </span>

        <span className={scss.sprint}>{task.sprint}</span>
      </div>

      <div className={scss.taskFooter}>
        <div className={scss.assignee}>
          <div className={scss.avatar}>
            <User size={11} />
          </div>
          Me
        </div>

        <div className={scss.dueDate}>
          <CalendarDays size={11} />
          {formatDueDate(task.dueDate)}
        </div>
      </div>
    </article>
  );
};

const Tasks = () => {
  const [search, setSearch] = useState("");
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<IssueStatus | null>(
    null,
  );
  const [activeProject] = useState("Operator AI");

  const { data: issues, isLoading } = useIssues();
  const { mutate: createIssue, isPending: isCreating } = useCreateIssue();
  const { mutate: updateIssue } = useUpdateIssue();
  const { mutate: deleteIssue } = useDeleteIssue();

  const tasks = issues || [];

  const filteredTasks = useMemo(() => {
    const value = search.toLowerCase();

    return tasks.filter(
      (task) =>
        task.key.toLowerCase().includes(value) ||
        task.title.toLowerCase().includes(value) ||
        task.description.toLowerCase().includes(value),
    );
  }, [tasks, search]);

  const createTask = () => {
    createIssue({
      title: "New task",
      description: "Add task description...",
      sprint: "Sprint 1",
    });
  };

  const changeStatus = (id: number, status: IssueStatus) => {
    updateIssue({ id, body: { status } });
    setActiveMenu(null);
  };

  const changePriority = (id: number, priority: IssuePriority) => {
    updateIssue({ id, body: { priority } });
    setActiveMenu(null);
  };

  const removeTask = (id: number) => {
    deleteIssue(id);
    setActiveMenu(null);
  };

  const statusTasks = (status: IssueStatus) =>
    filteredTasks.filter((task) => task.status === status);

  const handleDrop = (status: IssueStatus) => (event: React.DragEvent) => {
    event.preventDefault();
    setDragOverStatus(null);

    const idValue = event.dataTransfer.getData(DRAG_MIME);
    const id = Number(idValue);
    if (!id) return;

    const task = tasks.find((t) => t.id === id);
    if (task && task.status !== status) {
      updateIssue({ id, body: { status } });
    }
  };

  return (
    <section id={scss.tasks}>
      <div className="container">
        <div className={scss.tasks}>
          {/* TOP HEADER */}

          <header className={scss.header}>
            <div className={scss.headerLeft}>
              <div className={scss.tasksIcon}>
                <KanbanSquare size={19} />
              </div>

              <div>
                <h1>Tasks</h1>

                <div className={scss.project}>
                  <span className={scss.projectDot} />
                  {activeProject}
                  <ChevronDown size={12} />
                </div>
              </div>
            </div>
            <div className={scss.headerActions}>
              <button
                className={scss.createButton}
                onClick={createTask}
                disabled={isCreating}
              >
                <Plus size={15} />
                Create
              </button>
            </div>
          </header>
          {/* TOOLBAR */}
          <div className={scss.toolbar}>
            <div className={scss.search}>
              <Search size={15} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search issues..."
              />
            </div>
          </div>

          {/* BOARD */}

          <div className={scss.board}>
            {(["todo", "progress", "review", "done"] as IssueStatus[]).map(
              (status) => (
                <div key={status} className={scss.column}>
                  <div className={scss.columnHeader}>
                    <div className={scss.columnTitle}>
                      {getStatusIcon(status)}
                      <h2>{getStatusTitle(status)}</h2>
                      <span>{statusTasks(status).length}</span>
                    </div>

                    <button
                      onClick={createTask}
                      title="Create issue"
                      disabled={isCreating}
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  <div
                    className={`${scss.columnBody} ${
                      dragOverStatus === status ? scss.dragOver : ""
                    }`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (dragOverStatus !== status) setDragOverStatus(status);
                    }}
                    onDragLeave={() =>
                      setDragOverStatus((current) =>
                        current === status ? null : current,
                      )
                    }
                    onDrop={handleDrop(status)}
                  >
                    {statusTasks(status).map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isMenuOpen={activeMenu === task.id}
                        onToggleMenu={() =>
                          setActiveMenu(activeMenu === task.id ? null : task.id)
                        }
                        onChangeStatus={(nextStatus) =>
                          changeStatus(task.id, nextStatus)
                        }
                        onChangePriority={(priority) =>
                          changePriority(task.id, priority)
                        }
                        onDelete={() => removeTask(task.id)}
                        onSaveFields={(fields) =>
                          updateIssue({ id: task.id, body: fields })
                        }
                      />
                    ))}

                    {!isLoading && statusTasks(status).length === 0 && (
                      <div className={scss.empty}>
                        {getStatusIcon(status)}
                        <span>No issues</span>
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>

          {/* FOOTER */}

          <footer className={scss.footer}>
            <span>{filteredTasks.length} issues</span>
            <span>Sprint 1 · {activeProject}</span>
          </footer>
        </div>
      </div>
    </section>
  );
};

export default Tasks;
