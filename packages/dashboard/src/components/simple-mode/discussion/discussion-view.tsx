import { useState, useRef, useEffect } from "react";
import { useDiscussion } from "@/components/providers/discussion-provider";
import { useWebSocket } from "@/components/providers/websocket-provider";
import { QuestionCard } from "./question-card";
import { AnsweredCard } from "./answered-card";
import { SkeletonCard } from "./skeleton-card";
import { DiscussionFooter } from "./discussion-footer";
import { ConfirmationDialog } from "./confirmation-dialog";
import { DiscussionCompleteCard } from "./discussion-complete-card";

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
    receiveQuestions,
  } = useDiscussion();

  const { onQuestionReceivedRef } = useWebSocket();

  // Wire WebSocket question callback to discussion provider
  useEffect(() => {
    onQuestionReceivedRef.current = (questions) => {
      receiveQuestions(questions);
    };
    return () => {
      onQuestionReceivedRef.current = null;
    };
  }, [receiveQuestions, onQuestionReceivedRef]);

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
