import { createContext, useContext, useReducer, useCallback, type ReactNode } from "react";

export type SimpleTab = "plan" | "execute";

interface SimpleModeState {
  activeTab: SimpleTab;
  expandedCardId: string | null;
  inputValues: Record<string, string>;
}

type SimpleModeAction =
  | { type: "SET_TAB"; tab: SimpleTab }
  | { type: "SET_EXPANDED"; cardId: string | null }
  | { type: "SET_INPUT"; cardId: string; value: string }
  | { type: "RESET" };

function reducer(state: SimpleModeState, action: SimpleModeAction): SimpleModeState {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, activeTab: action.tab, expandedCardId: null };
    case "SET_EXPANDED":
      return { ...state, expandedCardId: action.cardId };
    case "SET_INPUT":
      return { ...state, inputValues: { ...state.inputValues, [action.cardId]: action.value } };
    case "RESET":
      return { activeTab: "plan", expandedCardId: null, inputValues: {} };
    default:
      return state;
  }
}

const INITIAL: SimpleModeState = { activeTab: "plan", expandedCardId: null, inputValues: {} };

interface SimpleModeContextValue extends SimpleModeState {
  setTab: (tab: SimpleTab) => void;
  setExpanded: (cardId: string | null) => void;
  setInput: (cardId: string, value: string) => void;
  reset: () => void;
}

const SimpleModeContext = createContext<SimpleModeContextValue | null>(null);

export function SimpleModeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const setTab = useCallback((tab: SimpleTab) => dispatch({ type: "SET_TAB", tab }), []);
  const setExpanded = useCallback((cardId: string | null) => dispatch({ type: "SET_EXPANDED", cardId }), []);
  const setInput = useCallback((cardId: string, value: string) => dispatch({ type: "SET_INPUT", cardId, value }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);
  return (
    <SimpleModeContext.Provider value={{ ...state, setTab, setExpanded, setInput, reset }}>
      {children}
    </SimpleModeContext.Provider>
  );
}

export function useSimpleMode(): SimpleModeContextValue {
  const ctx = useContext(SimpleModeContext);
  if (!ctx) throw new Error("useSimpleMode must be used within SimpleModeProvider");
  return ctx;
}
