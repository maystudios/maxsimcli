import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { WebSocketServer } from 'ws';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PendingQuestion {
  id: string;
  question: string;
  options: Array<{ value: string; label: string; description?: string }>;
  allowFreeText: boolean;
  receivedAt: number;
  conversationId?: string;
}

export interface ConversationMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: number;
  questionId?: string;
}

export interface Conversation {
  id: string;
  topic: string;
  messages: ConversationMessage[];
  createdAt: number;
  updatedAt: number;
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createMcpServer(deps: {
  wss: WebSocketServer;
  questionQueue: PendingQuestion[];
  pendingAnswers: Map<string, (answer: string) => void>;
  currentLifecycleState: { value: Record<string, unknown> | null };
  conversations: Map<string, Conversation>;
  broadcast: (wss: WebSocketServer, msg: Record<string, unknown>) => void;
}): McpServer {
  const { wss, questionQueue, pendingAnswers, currentLifecycleState, conversations, broadcast } = deps;

  const server = new McpServer({ name: 'maxsim-dashboard', version: '1.0.0' });

  // ── ask_question ──────────────────────────────────────────────────────────

  server.tool(
    'ask_question',
    'Present a question to the dashboard user and wait for their answer. Optionally link to a conversation for multi-turn discussions.',
    {
      question: z.string(),
      options: z
        .array(
          z.object({
            value: z.string(),
            label: z.string(),
            description: z.string().optional(),
          }),
        )
        .optional(),
      allow_free_text: z.boolean().default(true),
      conversation_id: z.string().optional().describe('Link this question to an existing conversation for multi-turn flow'),
    },
    async ({ question, options, allow_free_text, conversation_id }) => {
      const questionId = randomUUID();

      const pending: PendingQuestion = {
        id: questionId,
        question,
        options: options ?? [],
        allowFreeText: allow_free_text,
        receivedAt: Date.now(),
        conversationId: conversation_id,
      };

      // Track in conversation history if linked
      if (conversation_id && conversations.has(conversation_id)) {
        const conv = conversations.get(conversation_id)!;
        conv.messages.push({
          role: 'assistant',
          content: question,
          timestamp: Date.now(),
          questionId,
        });
        conv.updatedAt = Date.now();
      }

      questionQueue.push(pending);

      broadcast(wss, {
        type: 'question-received',
        question: pending,
        queueLength: questionQueue.length,
      });

      // Block until the browser submits an answer
      const answer = await new Promise<string>((resolve) => {
        pendingAnswers.set(questionId, resolve);
      });

      // Remove from queue
      const idx = questionQueue.findIndex((q) => q.id === questionId);
      if (idx !== -1) questionQueue.splice(idx, 1);

      // Track answer in conversation history
      if (conversation_id && conversations.has(conversation_id)) {
        const conv = conversations.get(conversation_id)!;
        conv.messages.push({
          role: 'user',
          content: answer,
          timestamp: Date.now(),
          questionId,
        });
        conv.updatedAt = Date.now();
      }

      broadcast(wss, {
        type: 'answer-given',
        questionId,
        conversationId: conversation_id,
        remainingQueue: questionQueue.length,
      });

      return { content: [{ type: 'text' as const, text: answer }] };
    },
  );

  // ── start_conversation ─────────────────────────────────────────────────

  server.tool(
    'start_conversation',
    'Start a new multi-turn conversation thread with the dashboard user',
    {
      topic: z.string().describe('A short label for this conversation thread'),
    },
    async ({ topic }) => {
      const id = randomUUID();
      const conv: Conversation = {
        id,
        topic,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      conversations.set(id, conv);

      broadcast(wss, {
        type: 'conversation-started',
        conversation: { id, topic, createdAt: conv.createdAt },
      });

      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ conversation_id: id, topic }) }],
      };
    },
  );

  // ── get_conversation_history ───────────────────────────────────────────

  server.tool(
    'get_conversation_history',
    'Retrieve the full message history of a conversation',
    {
      conversation_id: z.string(),
    },
    async ({ conversation_id }) => {
      const conv = conversations.get(conversation_id);
      if (!conv) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Conversation not found' }) }],
        };
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(conv, null, 2) }],
      };
    },
  );

  // ── submit_lifecycle_event ────────────────────────────────────────────────

  server.tool(
    'submit_lifecycle_event',
    'Broadcast a workflow lifecycle event to connected dashboard clients',
    {
      event_type: z.enum([
        'phase-started',
        'phase-complete',
        'plan-started',
        'plan-complete',
      ]),
      phase_name: z.string(),
      phase_number: z.string(),
      step: z.number().optional(),
      total_steps: z.number().optional(),
    },
    async ({ event_type, phase_name, phase_number, step, total_steps }) => {
      const event = {
        event_type,
        phase_name,
        phase_number,
        step: step ?? null,
        total_steps: total_steps ?? null,
        timestamp: Date.now(),
      };

      currentLifecycleState.value = event;

      broadcast(wss, { type: 'lifecycle', event });

      return {
        content: [
          {
            type: 'text' as const,
            text: `Event recorded: ${event_type} for Phase ${phase_number} (${phase_name})`,
          },
        ],
      };
    },
  );

  // ── get_phase_status ──────────────────────────────────────────────────────

  server.tool(
    'get_phase_status',
    'Get current question queue length and lifecycle state',
    {},
    async () => {
      const status = {
        pendingQuestions: questionQueue.length,
        questions: questionQueue.map((q) => ({
          id: q.id,
          question: q.question,
          receivedAt: q.receivedAt,
        })),
        lifecycleState: currentLifecycleState.value,
      };

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(status, null, 2) }],
      };
    },
  );

  return server;
}
