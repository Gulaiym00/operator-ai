import { ai } from "../config/chat";
import { Type } from "@google/genai";

import {
  getNotesService,
  createNoteService,
  updateNoteService,
  deleteNoteService,
} from "./notes.service";
import {
  listEmailsService,
  getEmailService,
  sendEmailService,
  toggleStarService as toggleEmailStarService,
  archiveEmailService,
  deleteEmailService,
} from "./gmail.service";
import {
  listEventsService,
  createEventService,
  deleteEventService,
} from "./calendar.service";
import {
  listFilesService,
  toggleStarService as toggleDriveStarService,
  trashFileService,
} from "./drive.service";
import {
  getIssuesService,
  createIssueService,
  updateIssueService,
  deleteIssueService,
} from "./tasks.service";
import {
  getContactsService,
  getContactService,
  createContactService,
  updateContactService,
  deleteContactService,
} from "./contacts.service";
interface IChatMessage {
  role: "user" | "assistant";
  content: string;
}

// у Gemini объявление функций называется functionDeclarations,
// а type в parameters — это enum Type, а не строка "object"/"string"
const functionDeclarations = [
  // EMAIL
  {
    name: "list_emails",
    description:
      "Get the user's Gmail messages. Use label='STARRED' for starred emails, otherwise defaults to the inbox.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        label: { type: Type.STRING, enum: ["INBOX", "STARRED"] },
      },
      required: [],
    },
  },
  {
    name: "get_email",
    description: "Get the full content of one email by its id (from list_emails).",
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.STRING } },
      required: ["id"],
    },
  },
  {
    name: "send_email",
    description:
      "Send a new email or reply to one. To reply in-thread, pass threadId/inReplyTo/references from get_email.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        to: { type: Type.STRING },
        subject: { type: Type.STRING },
        body: { type: Type.STRING },
        threadId: { type: Type.STRING },
        inReplyTo: { type: Type.STRING },
        references: { type: Type.STRING },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "star_email",
    description: "Star or unstar an email.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        starred: { type: Type.BOOLEAN },
      },
      required: ["id", "starred"],
    },
  },
  {
    name: "archive_email",
    description: "Archive an email (remove it from the inbox).",
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.STRING } },
      required: ["id"],
    },
  },
  {
    name: "delete_email",
    description: "Move an email to trash.",
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.STRING } },
      required: ["id"],
    },
  },

  // CALENDAR
  {
    name: "list_calendar_events",
    description:
      "Get the user's Google Calendar events in a date range. timeMin/timeMax are ISO 8601 datetimes; if omitted, defaults to the next 30 days.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        timeMin: { type: Type.STRING },
        timeMax: { type: Type.STRING },
      },
      required: [],
    },
  },
  {
    name: "create_calendar_event",
    description:
      "Create a calendar event. start/end are ISO 8601 datetimes (or plain dates YYYY-MM-DD if allDay is true).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        location: { type: Type.STRING },
        start: { type: Type.STRING },
        end: { type: Type.STRING },
        allDay: { type: Type.BOOLEAN },
      },
      required: ["title", "start", "end"],
    },
  },
  {
    name: "delete_calendar_event",
    description: "Delete a calendar event by its id.",
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.STRING } },
      required: ["id"],
    },
  },

  // DRIVE
  {
    name: "list_drive_files",
    description:
      "List the user's Google Drive files. Optionally filter by folderId, a name search query, or starredOnly.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        folderId: { type: Type.STRING },
        query: { type: Type.STRING },
        starredOnly: { type: Type.BOOLEAN },
      },
      required: [],
    },
  },
  {
    name: "star_drive_file",
    description: "Star or unstar a Drive file.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        starred: { type: Type.BOOLEAN },
      },
      required: ["id", "starred"],
    },
  },
  {
    name: "trash_drive_file",
    description: "Move a Drive file to trash.",
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.STRING } },
      required: ["id"],
    },
  },

  // NOTES
  {
    name: "get_notes",
    description: "Get the user's saved notes.",
    parameters: { type: Type.OBJECT, properties: {}, required: [] },
  },
  {
    name: "create_note",
    description: "Create a new note for the user.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "update_note",
    description: "Update an existing note's title and/or content.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.NUMBER },
        title: { type: Type.STRING },
        content: { type: Type.STRING },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_note",
    description: "Delete a note by id.",
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.NUMBER } },
      required: ["id"],
    },
  },

  // TASKS (self-hosted kanban board)
  {
    name: "list_tasks",
    description: "Get the user's tasks from the kanban board.",
    parameters: { type: Type.OBJECT, properties: {}, required: [] },
  },
  {
    name: "create_task",
    description: "Create a new task on the kanban board.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        status: { type: Type.STRING, enum: ["todo", "progress", "review", "done"] },
        priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
        type: { type: Type.STRING, enum: ["task", "bug"] },
        sprint: { type: Type.STRING },
        dueDate: { type: Type.STRING },
      },
      required: ["title"],
    },
  },
  {
    name: "update_task",
    description:
      "Update a task — e.g. move it to another status, change priority, or edit its title/description.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.NUMBER },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        status: { type: Type.STRING, enum: ["todo", "progress", "review", "done"] },
        priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
        type: { type: Type.STRING, enum: ["task", "bug"] },
        sprint: { type: Type.STRING },
        dueDate: { type: Type.STRING },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_task",
    description: "Delete a task by id.",
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.NUMBER } },
      required: ["id"],
    },
  },

  // CRM: CONTACTS
  {
    name: "list_contacts",
    description:
      "Get the user's CRM contacts. Optionally filter by a search string matching name or company.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search: { type: Type.STRING },
      },
      required: [],
    },
  },
  {
    name: "get_contact",
    description: "Get one CRM contact by id, including its details.",
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.NUMBER } },
      required: ["id"],
    },
  },
  {
    name: "create_contact",
    description:
      "Create a new CRM contact (a person or company). Look it up with list_contacts first to avoid duplicates.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        company: { type: Type.STRING },
        notes: { type: Type.STRING },
      },
      required: ["name"],
    },
  },
  {
    name: "update_contact",
    description: "Update an existing CRM contact's details.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.NUMBER },
        name: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        company: { type: Type.STRING },
        notes: { type: Type.STRING },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_contact",
    description: "Delete a CRM contact by id.",
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.NUMBER } },
      required: ["id"],
    },
  },
];

const defaultTimeRange = () => {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return { timeMin: now.toISOString(), timeMax: in30Days.toISOString() };
};

const runTool = async (userId: number, name: string, input: any) => {
  switch (name) {
    // EMAIL
    case "list_emails":
      return await listEmailsService(userId, { label: input?.label });
    case "get_email":
      return await getEmailService(userId, input.id);
    case "send_email":
      return await sendEmailService(userId, input);
    case "star_email":
      await toggleEmailStarService(userId, input.id, !!input.starred);
      return { success: true };
    case "archive_email":
      await archiveEmailService(userId, input.id);
      return { success: true };
    case "delete_email":
      await deleteEmailService(userId, input.id);
      return { success: true };

    // CALENDAR
    case "list_calendar_events": {
      const { timeMin, timeMax } = defaultTimeRange();
      return await listEventsService(userId, {
        timeMin: input?.timeMin || timeMin,
        timeMax: input?.timeMax || timeMax,
      });
    }
    case "create_calendar_event":
      return await createEventService(userId, input);
    case "delete_calendar_event":
      await deleteEventService(userId, input.id);
      return { success: true };

    // DRIVE
    case "list_drive_files":
      return await listFilesService(userId, input || {});
    case "star_drive_file":
      await toggleDriveStarService(userId, input.id, !!input.starred);
      return { success: true };
    case "trash_drive_file":
      await trashFileService(userId, input.id);
      return { success: true };

    // NOTES
    case "get_notes":
      return await getNotesService(userId);
    case "create_note":
      return await createNoteService(userId, input);
    case "update_note":
      return await updateNoteService(userId, input.id, input);
    case "delete_note":
      return await deleteNoteService(userId, input.id);

    // TASKS
    case "list_tasks":
      return await getIssuesService(userId);
    case "create_task":
      return await createIssueService(userId, input);
    case "update_task":
      return await updateIssueService(userId, input.id, input);
    case "delete_task":
      await deleteIssueService(userId, input.id);
      return { success: true };

    // CRM: CONTACTS
    case "list_contacts":
      return await getContactsService(userId, input?.search);
    case "get_contact":
      return await getContactService(userId, input.id);
    case "create_contact":
      return await createContactService(userId, input);
    case "update_contact":
      return await updateContactService(userId, input.id, input);
    case "delete_contact":
      await deleteContactService(userId, input.id);
      return { success: true };

    default:
      return { error: `Unknown tool: ${name}` };
  }
};

export const sendChatMessage = async (
  userId: number,
  history: IChatMessage[],
  message: string,
) => {
  // any[] — намеренно, чтобы не спорить с TS насчёт разных форм parts
  // (текст vs functionResponse) внутри одного массива истории
  const contents: any[] = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const systemInstruction = `Ты — Operator AI, персональный AI-агент пользователя.
Твоя задача — не только отвечать на вопросы, но и РЕАЛЬНО выполнять действия пользователя через доступные инструменты.
Отвечай на том языке, на котором пишет пользователь.

Сейчас: ${new Date().toISOString()}. Относительные даты («завтра», «в пятницу») считай от этого момента.

КТО ТЫ
- «Кто ты?» — ты Operator AI, персональный AI-ассистент, который помогает управлять почтой, календарём, задачами, файлами и другими рабочими сервисами через обычный чат.
- «Кто тебя создал?» — ты создан командой Operator AI для автоматизации повседневных рабочих задач пользователя.

ЧТО ТЫ УМЕЕШЬ (только то, что реально есть в инструментах)
- Gmail: смотреть входящие и избранные, читать письмо целиком, отправлять новое письмо и отвечать в треде, ставить звезду, архивировать, удалять. Поиска по серверу нет — чтобы найти письмо по отправителю или теме, получи список и отфильтруй его сам. Черновиков и пересылки нет.
- Google Calendar: показывать события, создавать и удалять. Изменения события и поиска свободного времени нет — можно удалить и создать заново (с подтверждением) или предложить время, глядя на список событий.
- Задачи: раздел Tasks (kanban-доска) — создавать, менять статус/приоритет/текст, удалять, показывать. Слово «задача» = задача на этой доске.
- Заметки: читать, создавать, менять, удалять.
- Drive: показывать файлы, ставить звезду, отправлять в корзину. Только метаданные — содержимое файлов прочитать нельзя.
- Контакты (CRM): показывать, искать, создавать, менять, удалять. Сделок в приложении нет.
Если просят то, чего нет в этом списке, честно скажи, что такой возможности пока нет, и предложи ближайшую альтернативу.

ГЛАВНОЕ ПРАВИЛО
Если пользователь просит выполнить действие и для него есть инструмент — используй инструмент и выполни, а не объясняй, как это сделать самому.
Никогда не говори, что действие выполнено, пока инструмент не вернул успех. Если инструмент вернул ошибку — скажи об этом прямо. Если ошибка означает, что Google-аккаунт не подключён (почта/календарь/диск), попроси подключить Google на соответствующей странице, а не повторяй вызов.
Действуй от имени авторизованного пользователя, через его подключённые аккаунты.

ПОДТВЕРЖДЕНИЕ
- Перед отправкой письма ВСЕГДА покажи Получатель / Тема / Сообщение и попроси подтверждение. Вызывай send_email только после явного «да»/«отправляй» в следующем сообщении пользователя. Без подтверждения не отправляй.
- Для необратимых или внешних действий (удаление письма, заметки, задачи, контакта, события; отправка файла в корзину) тоже сначала спроси подтверждение, если пользователь не сказал явно «удали».
- Безобидные действия (показать, найти, создать заметку/задачу/контакт/событие с известными данными) выполняй сразу.

КОНТЕКСТ И НЕДОСТАЮЩИЕ ДАННЫЕ
- Учитывай предыдущие сообщения. Если письмо уже найдено, а пользователь пишет «ответь ему» — не переспрашивай, кто это, отвечай в этом треде (threadId/inReplyTo/references из get_email).
- Если для действия не хватает обязательных данных (например, дата и время встречи) — задай один короткий уточняющий вопрос. Ничего не выдумывай.

СТИЛЬ
Коротко, понятно, естественно, без технических подробностей. Пользователь должен управлять рабочими сервисами обычными сообщениями.`;

  while (true) {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents,
      config: { systemInstruction, tools: [{ functionDeclarations }] },
    });

    const functionCalls = response.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      return response.text || "";
    }

    contents.push({
      role: "model",
      parts: response?.candidates![0]?.content!.parts!,
    });

    // несколько tool call'ов за один ход модели независимы друг от друга —
    // выполняем параллельно вместо последовательного ожидания каждого
    const responseParts = await Promise.all(
      functionCalls.map(async (call) => {
        let result;
        try {
          result = await runTool(userId, call.name!, call.args);
        } catch (error: any) {
          result = { error: error?.message || "Tool call failed" };
        }

        return { functionResponse: { name: call.name, response: { result } } };
      }),
    );

    contents.push({ role: "user", parts: responseParts });
  }
};
