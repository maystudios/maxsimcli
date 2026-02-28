import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  type ReactNode,
  type MutableRefObject,
} from "react";

// --- Types ---

export interface DiscussionOption {
  id: string;
  label: string;
  description: string;
  markdown?: string;
}

export interface DiscussionQuestion {
  id: string;
  header: string;
  question: string;
  multiSelect: boolean;
  options: DiscussionOption[];
}

export interface AnsweredQuestion {
  questionId: string;
  header: string;
  selectedOptionIds: string[];
  selectedLabels: string[];
  freeText: string;
}

export type DiscussionPhase =
  | "idle"
  | "loading"
  | "active"
  | "submitting"
  | "complete";

export interface DiscussionState {
  phase: DiscussionPhase;
  questions: DiscussionQuestion[];
  currentQuestion: DiscussionQuestion | null;
  answeredQuestions: AnsweredQuestion[];
  answerCount: number;
}

// --- Actions ---

type DiscussionAction =
  | { type: "START_DISCUSSION" }
  | { type: "QUESTIONS_RECEIVED"; questions: DiscussionQuestion[] }
  | { type: "SUBMIT_ANSWER"; answer: AnsweredQuestion }
  | { type: "ANSWER_ACCEPTED" }
  | { type: "ASK_MORE" }
  | { type: "DONE_EXECUTE" }
  | { type: "RESET" };

// --- Reducer ---

const INITIAL: DiscussionState = {
  phase: "idle",
  questions: [],
  currentQuestion: null,
  answeredQuestions: [],
  answerCount: 0,
};

function reducer(state: DiscussionState, action: DiscussionAction): DiscussionState {
  switch (action.type) {
    case "START_DISCUSSION":
      return { ...state, phase: "loading" };

    case "QUESTIONS_RECEIVED": {
      const [first, ...rest] = action.questions;
      return {
        ...state,
        phase: first ? "active" : state.phase,
        currentQuestion: first ?? null,
        questions: [...state.questions, ...rest],
      };
    }

    case "SUBMIT_ANSWER":
      return {
        ...state,
        phase: "submitting",
        answeredQuestions: [...state.answeredQuestions, action.answer],
        answerCount: state.answerCount + 1,
      };

    case "ANSWER_ACCEPTED": {
      const [next, ...remaining] = state.questions;
      return {
        ...state,
        phase: next ? "active" : "loading",
        currentQuestion: next ?? null,
        questions: remaining,
      };
    }

    case "ASK_MORE":
      return { ...state, phase: "loading" };

    case "DONE_EXECUTE":
      return { ...state, phase: "complete", currentQuestion: null, questions: [] };

    case "RESET":
      return INITIAL;

    default:
      return state;
  }
}

// --- Context ---

interface DiscussionContextValue extends DiscussionState {
  startDiscussion: () => void;
  receiveQuestions: (questions: DiscussionQuestion[]) => void;
  submitAnswer: (answer: AnsweredQuestion) => void;
  askMore: () => void;
  doneExecute: () => void;
  resetDiscussion: () => void;
  onQuestionReceived: MutableRefObject<((q: DiscussionQuestion[]) => void) | null>;
  onExecutionQueued: MutableRefObject<(() => void) | null>;
}

const DiscussionContext = createContext<DiscussionContextValue | null>(null);

// --- Provider ---

export function DiscussionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const onQuestionReceived = useRef<((q: DiscussionQuestion[]) => void) | null>(null);
  const onExecutionQueued = useRef<(() => void) | null>(null);

  const startDiscussion = useCallback(() => {
    dispatch({ type: "START_DISCUSSION" });
  }, []);

  const receiveQuestions = useCallback((questions: DiscussionQuestion[]) => {
    dispatch({ type: "QUESTIONS_RECEIVED", questions });
  }, []);

  const submitAnswer = useCallback((answer: AnsweredQuestion) => {
    dispatch({ type: "SUBMIT_ANSWER", answer });
    // For now (Phase 32), immediately accept — no server round-trip
    dispatch({ type: "ANSWER_ACCEPTED" });
  }, []);

  const askMore = useCallback(() => {
    dispatch({ type: "ASK_MORE" });
  }, []);

  const doneExecute = useCallback(() => {
    dispatch({ type: "DONE_EXECUTE" });
    onExecutionQueued.current?.();
  }, []);

  const resetDiscussion = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return (
    <DiscussionContext.Provider
      value={{
        ...state,
        startDiscussion,
        receiveQuestions,
        submitAnswer,
        askMore,
        doneExecute,
        resetDiscussion,
        onQuestionReceived,
        onExecutionQueued,
      }}
    >
      {children}
    </DiscussionContext.Provider>
  );
}

// --- Hook ---

export function useDiscussion(): DiscussionContextValue {
  const ctx = useContext(DiscussionContext);
  if (!ctx) throw new Error("useDiscussion must be used within DiscussionProvider");
  return ctx;
}
