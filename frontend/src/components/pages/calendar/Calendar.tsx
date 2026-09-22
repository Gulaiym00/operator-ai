"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Video,
  X,
} from "lucide-react";

import scss from "./calendar.module.scss";
import {
  ICalendarEvent,
  useCalendarEvents,
  useCreateEvent,
  useDeleteEvent,
} from "@/hooks/calendar/useCalendar";

const googleAuthUrl = `${
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
}/auth/google`;

type ViewMode = "month" | "week" | "day";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const eventDateKey = (event: ICalendarEvent) => formatDate(new Date(event.start));

const eventTimeLabel = (event: ICalendarEvent) =>
  event.allDay
    ? "All day"
    : new Date(event.start).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

const Calendar = () => {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState<ViewMode>("month");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: formatDate(today),
    start: "10:00",
    end: "11:00",
    location: "",
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("en-US", { month: "long" });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const timeMin = useMemo(
    () => new Date(year, month, 1).toISOString(),
    [year, month],
  );
  const timeMax = useMemo(
    () => new Date(year, month + 1, 0, 23, 59, 59).toISOString(),
    [year, month],
  );

  const {
    data: fetchedEvents,
    isError: isEventsError,
    error: eventsError,
  } = useCalendarEvents(timeMin, timeMax);

  const { mutate: createEventMutation, isPending: isCreating, error: createError } =
    useCreateEvent();
  const { mutate: deleteEventMutation } = useDeleteEvent();

  const notConnected =
    isEventsError &&
    (eventsError as any)?.response?.data?.message === "Google account is not connected";

  const events = fetchedEvents || [];

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);

    return days;
  }, [firstDay, daysInMonth]);

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.location?.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreateModal(date?: Date) {
    const targetDate = date || selectedDate;

    setNewEvent({
      title: "",
      date: formatDate(targetDate),
      start: "10:00",
      end: "11:00",
      location: "",
    });

    setShowCreateModal(true);
  }

  function createEvent() {
    if (!newEvent.title.trim()) return;

    const start = new Date(`${newEvent.date}T${newEvent.start}:00`).toISOString();
    const end = new Date(`${newEvent.date}T${newEvent.end}:00`).toISOString();

    createEventMutation(
      {
        title: newEvent.title,
        location: newEvent.location || undefined,
        start,
        end,
      },
      { onSuccess: () => setShowCreateModal(false) },
    );
  }

  function deleteEvent(id: string) {
    deleteEventMutation(id);
  }

  function previousMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToToday() {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  }

  function isToday(day: number) {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  }

  function isSelected(day: number) {
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  }

  function getEventsForDay(day: number) {
    const date = formatDate(new Date(year, month, day));
    return filteredEvents.filter((event) => eventDateKey(event) === date);
  }

  const selectedDayEvents = filteredEvents.filter(
    (event) => eventDateKey(event) === formatDate(selectedDate),
  );

  return (
    <section id={scss.calendar}>
      <div className="container">
        <div className={scss.calendar}>
          {/* HEADER */}

          <header className={scss.header}>
            <div className={scss.title}>
              <div className={scss.icon}>
                <CalendarDays size={21} />
              </div>

              <div>
                <h1>Calendar</h1>
                <p>Manage your schedule</p>
              </div>
            </div>

            <button
              className={scss.createButton}
              onClick={() => openCreateModal()}
              disabled={notConnected}
            >
              <Plus size={17} />
              Create
            </button>
          </header>

          {/* TOOLBAR */}

          <div className={scss.toolbar}>
            <div className={scss.leftToolbar}>
              <button onClick={goToToday} className={scss.todayButton}>
                Today
              </button>

              <div className={scss.navigation}>
                <button onClick={previousMonth}>
                  <ChevronLeft size={18} />
                </button>

                <button onClick={nextMonth}>
                  <ChevronRight size={18} />
                </button>
              </div>

              <h2>
                {monthName} {year}
              </h2>
            </div>

            <div className={scss.rightToolbar}>
              <div className={scss.search}>
                <Search size={16} />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                />
              </div>

              <div className={scss.viewSwitcher}>
                <button
                  className={view === "month" ? scss.active : ""}
                  onClick={() => setView("month")}
                >
                  Month
                </button>

                <button
                  className={view === "week" ? scss.active : ""}
                  onClick={() => setView("week")}
                >
                  Week
                </button>

                <button
                  className={view === "day" ? scss.active : ""}
                  onClick={() => setView("day")}
                >
                  Day
                </button>
              </div>
            </div>
          </div>

          {notConnected ? (
            <div className={scss.calendarCard}>
              <div className={scss.weekView}>
                <div className={scss.weekMessage}>
                  <CalendarDays size={35} />
                  <h3>Connect your Google account</h3>
                  <p>
                    Sign in with Google to see and create events on your real
                    calendar.
                  </p>
                  <a
                    href={googleAuthUrl}
                    className={scss.createButton}
                    style={{
                      textDecoration: "none",
                      display: "inline-flex",
                      marginTop: 16,
                    }}
                  >
                    Connect Google
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* CALENDAR */}

              <div className={scss.calendarCard}>
                {view === "month" && (
                  <>
                    <div className={scss.weekDays}>
                      {weekDays.map((day) => (
                        <div key={day}>{day}</div>
                      ))}
                    </div>

                    <div className={scss.days}>
                      {calendarDays.map((day, index) => {
                        if (!day) {
                          return (
                            <div key={`empty-${index}`} className={scss.emptyDay} />
                          );
                        }

                        const dayEvents = getEventsForDay(day);
                        const date = new Date(year, month, day);

                        return (
                          <div
                            key={day}
                            className={`${scss.day} ${
                              isSelected(day) ? scss.selected : ""
                            }`}
                            onClick={() => setSelectedDate(date)}
                          >
                            <div className={scss.dayHeader}>
                              <span className={isToday(day) ? scss.today : ""}>
                                {day}
                              </span>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCreateModal(date);
                                }}
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <div className={scss.dayEvents}>
                              {dayEvents.map((event) => (
                                <div key={event.id} className={`${scss.event} ${scss.blue}`}>
                                  <span>{eventTimeLabel(event)}</span>
                                  <strong>{event.title}</strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {view === "week" && (
                  <div className={scss.weekView}>
                    <div className={scss.weekMessage}>
                      <CalendarDays size={35} />
                      <h3>Week view</h3>
                      <p>Your weekly schedule will appear here.</p>
                    </div>
                  </div>
                )}

                {view === "day" && (
                  <div className={scss.dayView}>
                    <div className={scss.dayViewHeader}>
                      <h3>
                        {selectedDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </h3>

                      <button onClick={() => openCreateModal()}>
                        <Plus size={16} />
                        Add event
                      </button>
                    </div>

                    <div className={scss.timeline}>
                      {Array.from({ length: 12 }).map((_, index) => {
                        const hour = index + 8;

                        return (
                          <div className={scss.timeRow} key={hour}>
                            <span>{String(hour).padStart(2, "0")}:00</span>
                            <div />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* SELECTED DAY */}

              <div className={scss.selectedDayPanel}>
                <div className={scss.panelHeader}>
                  <div>
                    <h3>
                      {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
                    </h3>

                    <span>
                      {selectedDate.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <button onClick={() => openCreateModal()}>
                    <Plus size={16} />
                    Add event
                  </button>
                </div>

                <div className={scss.eventList}>
                  {selectedDayEvents.map((event) => (
                    <div className={scss.eventItem} key={event.id}>
                      <div className={scss.eventTime}>
                        <Clock3 size={14} />
                        {eventTimeLabel(event)}
                      </div>

                      <div className={scss.eventInfo}>
                        <h4>{event.title}</h4>

                        {event.location && (
                          <p>
                            {event.hangoutLink ? (
                              <Video size={13} />
                            ) : (
                              <MapPin size={13} />
                            )}
                            {event.location}
                          </p>
                        )}
                      </div>

                      <button
                        className={scss.moreButton}
                        onClick={() => deleteEvent(event.id)}
                        title="Delete event"
                      >
                        <MoreVertical size={17} />
                      </button>
                    </div>
                  ))}

                  {selectedDayEvents.length === 0 && (
                    <div className={scss.noEvents}>
                      <CalendarDays size={28} />
                      <p>No events for this day</p>

                      <button onClick={() => openCreateModal()}>
                        <Plus size={15} />
                        Create event
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* CREATE EVENT MODAL */}

          {showCreateModal && (
            <div
              className={scss.modalOverlay}
              onClick={() => setShowCreateModal(false)}
            >
              <div className={scss.modal} onClick={(e) => e.stopPropagation()}>
                <div className={scss.modalHeader}>
                  <div>
                    <h2>Create event</h2>
                    <p>Add a new event to your calendar</p>
                  </div>

                  <button onClick={() => setShowCreateModal(false)}>
                    <X size={18} />
                  </button>
                </div>

                <div className={scss.form}>
                  <label>
                    Event title
                    <input
                      value={newEvent.title}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, title: e.target.value })
                      }
                      placeholder="Team meeting"
                    />
                  </label>

                  <label>
                    Date
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, date: e.target.value })
                      }
                    />
                  </label>

                  <div className={scss.timeInputs}>
                    <label>
                      Start
                      <input
                        type="time"
                        value={newEvent.start}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, start: e.target.value })
                        }
                      />
                    </label>

                    <label>
                      End
                      <input
                        type="time"
                        value={newEvent.end}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, end: e.target.value })
                        }
                      />
                    </label>
                  </div>

                  <label>
                    Location
                    <input
                      value={newEvent.location}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, location: e.target.value })
                      }
                      placeholder="Google Meet / Office"
                    />
                  </label>

                  {createError && (
                    <p style={{ color: "#dc2626", fontSize: 12 }}>
                      {createError.response?.data?.message ||
                        "Couldn't create the event. Please try again."}
                    </p>
                  )}

                  <div className={scss.modalActions}>
                    <button
                      className={scss.cancel}
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </button>

                    <button
                      className={scss.save}
                      onClick={createEvent}
                      disabled={isCreating}
                    >
                      {isCreating ? "Creating..." : "Create event"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Calendar;
