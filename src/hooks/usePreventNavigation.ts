import { useEffect, useRef } from 'react';
import { useSubmission } from '../contexts/SubmissionContext';

export const usePreventNavigation = () => {
  const { hasPendingSubmissions } = useSubmission();
  const handlerRef = useRef<((e: BeforeUnloadEvent) => void) | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingSubmissions()) {
        // Show browser's default confirmation dialog
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    handlerRef.current = handleBeforeUnload;
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasPendingSubmissions]);
};
