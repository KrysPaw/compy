'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  COMPARISON_VIEW_MODE_KEY,
  DEFAULT_COMPARISON_VIEW_MODE,
  parseComparisonViewMode,
  readStoredComparisonViewMode,
  writeStoredComparisonViewMode,
  type ComparisonViewMode,
} from '@/lib/comparison-view-mode';

const MOBILE_BREAKPOINT = 768;

type ComparisonViewModeContextValue = {
  mode: ComparisonViewMode;
  setMode: (mode: ComparisonViewMode) => void;
  /** Always cards on mobile or before viewport is known (avoids table flash). */
  effectiveMode: ComparisonViewMode;
  /** True only after mount confirms desktop (`md+`). */
  showToggle: boolean;
};

const ComparisonViewModeContext =
  createContext<ComparisonViewModeContextValue | null>(null);

function useComparisonViewModeState(): ComparisonViewModeContextValue {
  const [mode, setModeState] = useState<ComparisonViewMode>(
    DEFAULT_COMPARISON_VIEW_MODE,
  );
  const [isMobile, setIsMobile] = useState(true);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    setModeState(readStoredComparisonViewMode());

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    onChange();
    setReady(true);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== COMPARISON_VIEW_MODE_KEY) {
        return;
      }
      setModeState(parseComparisonViewMode(event.newValue));
    }

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setMode = useCallback((next: ComparisonViewMode) => {
    setModeState(next);
    writeStoredComparisonViewMode(next);
  }, []);

  const effectiveMode: ComparisonViewMode =
    !ready || isMobile ? 'cards' : mode;
  const showToggle = ready && !isMobile;

  return useMemo(
    () => ({ mode, setMode, effectiveMode, showToggle }),
    [mode, setMode, effectiveMode, showToggle],
  );
}

export function ComparisonViewModeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const value = useComparisonViewModeState();

  return (
    <ComparisonViewModeContext.Provider value={value}>
      {children}
    </ComparisonViewModeContext.Provider>
  );
}

export function useComparisonViewMode(): ComparisonViewModeContextValue {
  const context = useContext(ComparisonViewModeContext);
  if (context === null) {
    throw new Error(
      'useComparisonViewMode must be used within ComparisonViewModeProvider',
    );
  }

  return context;
}
