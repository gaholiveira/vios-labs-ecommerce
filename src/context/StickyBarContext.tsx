"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface StickyBarContextType {
  stickyBarVisible: boolean;
  setStickyBarVisible: (visible: boolean) => void;
}

const StickyBarContext = createContext<StickyBarContextType | undefined>(
  undefined
);

export function StickyBarProvider({ children }: { children: ReactNode }) {
  const [stickyBarVisible, setStickyBarVisible] = useState(false);

  const setVisible = useCallback((visible: boolean) => {
    setStickyBarVisible(visible);
  }, []);

  return (
    <StickyBarContext.Provider
      value={{ stickyBarVisible, setStickyBarVisible: setVisible }}
    >
      {children}
    </StickyBarContext.Provider>
  );
}

export function useStickyBar() {
  const context = useContext(StickyBarContext);
  return context;
}
