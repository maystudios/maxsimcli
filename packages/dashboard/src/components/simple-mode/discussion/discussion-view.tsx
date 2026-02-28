import { useState, useRef, useEffect } from "react";
import { useDiscussion } from "@/components/providers/discussion-provider";
import type { DiscussionQuestion } from "@/components/providers/discussion-provider";
import { QuestionCard } from "./question-card";
import { AnsweredCard } from "./answered-card";
import { SkeletonCard } from "./skeleton-card";
import { DiscussionFooter } from "./discussion-footer";
import { ConfirmationDialog } from "./confirmation-dialog";
import { DiscussionCompleteCard } from "./discussion-complete-card";

// --- Mock Questions (temporary for Phase 32) ---

const MOCK_QUESTIONS: DiscussionQuestion[] = [
  {
    id: "mock-q1",
    header: "Auth Method",
    question:
      "Which authentication approach do you want for your API?\n\nConsider factors like **session management**, token expiry, and integration with third-party providers.",
    multiSelect: false,
    options: [
      {
        id: "opt-jwt",
        label: "JWT with refresh tokens",
        description:
          "Stateless authentication using signed tokens. Access token expires in 15 minutes, refresh token in 7 days.",
        markdown:
          "```typescript\n// Example JWT middleware\nconst decoded = jwt.verify(token, SECRET);\nreq.user = decoded;\n```",
      },
      {
        id: "opt-session",
        label: "Server-side sessions",
        description:
          "Traditional session-based auth with server-side storage. Requires a session store (Redis, DB).",
      },
      {
        id: "opt-oauth",
        label: "OAuth 2.0 with PKCE",
        description:
          "Delegate authentication to external providers (Google, GitHub). Best for apps that don't need custom credentials.",
      },
    ],
  },
  {
    id: "mock-q2",
    header: "Features",
    question: "Select the features you want included in the initial build:",
    multiSelect: true,
    options: [
      {
        id: "feat-api",
        label: "REST API endpoints",
        description: "Standard CRUD endpoints with validation and error handling",
      },
      {
        id: "feat-ws",
        label: "WebSocket support",
        description: "Real-time bidirectional communication for live updates",
      },
      {
        id: "feat-queue",
        label: "Background job queue",
        description:
          "Async task processing with retries and dead letter queue. Uses BullMQ or similar.",
      },
      {
        id: "feat-cache",
        label: "Caching layer",
        description: "Redis-based caching with TTL and invalidation patterns",
      },
    ],
  },
  {
    id: "mock-q3",
    header: "Description",
    question:
      "Describe your project in a few sentences. What problem does it solve? Who are the primary users?",
    multiSelect: false,
    options: [],
  },
  {
    id: "mock-q4",
    header: "Database",
    question: "Which database engine should we use?",
    multiSelect: false,
    options: [
      {
        id: "db-pg",
        label: "PostgreSQL",
        description: "Relational database with strong ACID compliance and JSON support",
      },
      {
        id: "db-sqlite",
        label: "SQLite",
        description: "Embedded database, zero configuration, great for single-server deployments",
      },
    ],
  },
];

function useMockQuestions() {
  const { phase, receiveQuestions, answeredQuestions } = useDiscussion();
  const hasSentRef = useRef(false);

  useEffect(() => {
    if (phase === "loading" && !hasSentRef.current) {
      hasSentRef.current = true;
      const timer = setTimeout(() => {
        receiveQuestions(MOCK_QUESTIONS);
      }, 500);
      return () => clearTimeout(timer);
    }
    // Reset when discussion is reset
    if (phase === "idle") {
      hasSentRef.current = false;
    }
  }, [phase, receiveQuestions, answeredQuestions.length]);
}

// --- DiscussionView ---

export function DiscussionView() {
  const {
    phase,
    currentQuestion,
    answeredQuestions,
    answerCount,
    submitAnswer,
    askMore,
    doneExecute,
  } = useDiscussion();

  useMockQuestions();

  const [showConfirm, setShowConfirm] = useState(false);
  const activeQuestionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active question
  useEffect(() => {
    if (phase === "active" && activeQuestionRef.current) {
      activeQuestionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [phase, currentQuestion?.id]);

  function handleDoneExecute() {
    setShowConfirm(true);
  }

  function handleConfirm() {
    setShowConfirm(false);
    doneExecute();
  }

  function handleCancel() {
    setShowConfirm(false);
  }

  const isDisabled = phase === "submitting" || phase === "complete";

  return (
    <div className="flex flex-col h-full">
      {/* Header with progress counter */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Discussion ({answerCount}/?)
        </span>
      </div>

      {/* Scrollable chat area */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="mx-auto max-w-3xl p-4 flex flex-col gap-2">
          {/* Answered questions (collapsed) */}
          {answeredQuestions.map((answer) => (
            <AnsweredCard key={answer.questionId} answer={answer} />
          ))}

          {/* Active question */}
          {phase === "active" && currentQuestion && (
            <div ref={activeQuestionRef}>
              <QuestionCard
                question={currentQuestion}
                onSubmit={submitAnswer}
              />
            </div>
          )}

          {/* Loading skeleton */}
          {phase === "loading" && <SkeletonCard />}

          {/* Discussion complete */}
          {phase === "complete" && (
            <DiscussionCompleteCard answerCount={answerCount} />
          )}
        </div>
      </div>

      {/* Sticky footer */}
      {phase !== "complete" && (
        <DiscussionFooter
          onAskMore={askMore}
          onDoneExecute={handleDoneExecute}
          disabled={isDisabled}
        />
      )}

      {/* Confirmation dialog */}
      <ConfirmationDialog
        open={showConfirm}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
