import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";

// сколько последних сообщений уходит модели как контекст — ограничивает
// расход токенов и размер запроса, даже если диалог длится сотни сообщений
const CONTEXT_LIMIT = 30;

const makeTitle = (message: string) => {
  const oneLine = message.replace(/\s+/g, " ").trim();
  return oneLine.length > 60 ? `${oneLine.slice(0, 57)}...` : oneLine || "New chat";
};

export const listConversationsService = async (userId: number) => {
  const res = await pool.query(
    `select id, title, updated_at
    from chat_conversations
    where user_id = $1
    order by updated_at desc
    limit 100`,
    [userId],
  );

  return res.rows;
};

export const getConversationService = async (userId: number, conversationId: number) => {
  if (!Number.isInteger(conversationId)) throw apiErrors.notFaund("Conversation not found");

  const conversation = await pool.query(
    `select id, title, updated_at from chat_conversations where id = $1 and user_id = $2`,
    [conversationId, userId],
  );

  if (!conversation.rows[0]) throw apiErrors.notFaund("Conversation not found");

  const messages = await pool.query(
    `select id, role, content, created_at
    from chat_messages
    where conversation_id = $1
    order by id asc`,
    [conversationId],
  );

  return { ...conversation.rows[0], messages: messages.rows };
};

type ContextRow = { role: "user" | "assistant"; content: string };

// Модель должна получать чередующиеся реплики user → assistant → user...
// Вопрос без ответа (модель тогда упала) в контекст не берём, а окно из
// последних N сообщений могло начаться с ответа ассистента — такой хвост режем.
export const toModelContext = (rows: ContextRow[]): ContextRow[] => {
  const answered = rows.filter(
    (row, i) => row.role === "assistant" || rows[i + 1]?.role === "assistant",
  );

  while (answered[0]?.role === "assistant") answered.shift();

  return answered;
};

export const getContextMessagesService = async (userId: number, conversationId: number) => {
  const owner = await pool.query(
    `select 1 from chat_conversations where id = $1 and user_id = $2`,
    [conversationId, userId],
  );

  if (!owner.rows[0]) throw apiErrors.notFaund("Conversation not found");

  const res = await pool.query(
    `select role, content from (
      select id, role, content from chat_messages
      where conversation_id = $1
      order by id desc
      limit $2
    ) recent
    order by id asc`,
    [conversationId, CONTEXT_LIMIT],
  );

  return toModelContext(res.rows as ContextRow[]);
};

// Шаг 1: сохраняем вопрос ДО обращения к модели — если она недоступна
// (лимит, 503), диалог и вопрос всё равно остаются в истории.
export const startExchangeService = async (
  userId: number,
  conversationId: number | undefined,
  userText: string,
) => {
  const client = await pool.connect();

  try {
    await client.query("begin");

    let id = conversationId;

    if (id) {
      const touched = await client.query(
        `update chat_conversations set updated_at = now() where id = $1 and user_id = $2 returning id`,
        [id, userId],
      );
      if (!touched.rows[0]) throw apiErrors.notFaund("Conversation not found");
    } else {
      const created = await client.query(
        `insert into chat_conversations (user_id, title) values ($1, $2) returning id`,
        [userId, makeTitle(userText)],
      );
      id = created.rows[0].id as number;
    }

    const message = await client.query(
      `insert into chat_messages (conversation_id, role, content)
      values ($1, 'user', $2)
      returning id, role, content, created_at`,
      [id, userText],
    );

    const conversation = await client.query(
      `select id, title, updated_at from chat_conversations where id = $1`,
      [id],
    );

    await client.query("commit");

    return { conversation: conversation.rows[0], userMessage: message.rows[0] };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
};

// Шаг 2: модель ответила — дописываем ответ в тот же диалог
export const finishExchangeService = async (conversationId: number, assistantText: string) => {
  const message = await pool.query(
    `insert into chat_messages (conversation_id, role, content)
    values ($1, 'assistant', $2)
    returning id, role, content, created_at`,
    [conversationId, assistantText],
  );

  const conversation = await pool.query(
    `update chat_conversations set updated_at = now() where id = $1
    returning id, title, updated_at`,
    [conversationId],
  );

  return { conversation: conversation.rows[0], assistantMessage: message.rows[0] };
};

export const deleteConversationService = async (userId: number, conversationId: number) => {
  if (!Number.isInteger(conversationId)) throw apiErrors.notFaund("Conversation not found");

  const res = await pool.query(
    `delete from chat_conversations where id = $1 and user_id = $2 returning id`,
    [conversationId, userId],
  );

  if (!res.rows[0]) throw apiErrors.notFaund("Conversation not found");
};
