import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'trilha_progress';

interface TrilhaProgress {
  completedUnits: string[];
  currentUnit: string;
  lastVisited: string;
}

const defaultProgress: TrilhaProgress = {
  completedUnits: [],
  currentUnit: 'U00',
  lastVisited: new Date().toISOString(),
};

export function useTrilhaProgress() {
  const [progress, setProgress] = useState<TrilhaProgress>(defaultProgress);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProgress(parsed);
      } catch {
        setProgress(defaultProgress);
      }
    }
  }, []);

  const saveProgress = useCallback((newProgress: TrilhaProgress) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
    setProgress(newProgress);
  }, []);

  const completeUnit = useCallback((unitId: string) => {
    const newProgress = {
      ...progress,
      completedUnits: [...new Set([...progress.completedUnits, unitId])],
      lastVisited: new Date().toISOString(),
    };
    
    const unitNum = parseInt(unitId.replace('U', ''));
    const nextUnitNum = unitNum + 1;
    if (nextUnitNum <= 24) {
      newProgress.currentUnit = `U${nextUnitNum.toString().padStart(2, '0')}`;
    }
    
    saveProgress(newProgress);
  }, [progress, saveProgress]);

  const setCurrentUnit = useCallback((unitId: string) => {
    const newProgress = {
      ...progress,
      currentUnit: unitId,
      lastVisited: new Date().toISOString(),
    };
    saveProgress(newProgress);
  }, [progress, saveProgress]);

  const isUnitCompleted = useCallback((unitId: string) => {
    return progress.completedUnits.includes(unitId);
  }, [progress.completedUnits]);

  const resetProgress = useCallback(() => {
    saveProgress(defaultProgress);
  }, [saveProgress]);

  return {
    progress,
    completedCount: progress.completedUnits.length,
    totalUnits: 25,
    completeUnit,
    setCurrentUnit,
    isUnitCompleted,
    resetProgress,
  };
}
