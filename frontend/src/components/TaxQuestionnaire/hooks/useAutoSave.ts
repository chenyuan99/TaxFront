import { useEffect, useCallback, useState } from 'react';
import { QuestionnaireData } from '../types';
import { autoSaveManager } from '../services';

interface UseAutoSaveOptions {
  userId: string;
  enabled?: boolean;
  onSave?: (data: Partial<QuestionnaireData>) => void;
  onError?: (error: Error) => void;
}

interface UseAutoSaveReturn {
  saveNow: (data: Partial<QuestionnaireData>) => Promise<void>;
  lastSaved: Date | null;
  isSaving: boolean;
  error: Error | null;
}

export const useAutoSave = ({
  userId,
  enabled = true,
  onSave,
  onError
}: UseAutoSaveOptions): UseAutoSaveReturn => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Initialize auto-save when component mounts
  useEffect(() => {
    if (!enabled || !userId) return;

    const handleSave = (data: Partial<QuestionnaireData>) => {
      setLastSaved(new Date());
      setError(null);
      onSave?.(data);
    };

    autoSaveManager.enableAutoSave(userId, handleSave);

    return () => {
      autoSaveManager.disableAutoSave();
    };
  }, [userId, enabled, onSave]);

  // Manual save function
  const saveNow = useCallback(async (data: Partial<QuestionnaireData>) => {
    if (!enabled || !userId) return;

    setIsSaving(true);
    setError(null);

    try {
      await autoSaveManager.saveNow(data);
      setLastSaved(new Date());
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Save failed');
      setError(error);
      onError?.(error);
    } finally {
      setIsSaving(false);
    }
  }, [userId, enabled, onError]);

  // Update last saved time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const managerLastSaved = autoSaveManager.getLastSaved();
      if (managerLastSaved && managerLastSaved !== lastSaved) {
        setLastSaved(managerLastSaved);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSaved]);

  return {
    saveNow,
    lastSaved,
    isSaving,
    error
  };
};