import { useState, useCallback, useRef } from 'react';
import { useSubmission } from '../contexts/SubmissionContext';

interface FormData {
  [key: string]: any;
}

interface UseFormSubmissionOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

export const useFormSubmission = (options?: UseFormSubmissionOptions) => {
  const { registerSubmission, unregisterSubmission } = useSubmission();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const submissionIdRef = useRef<string>('');
  const savedFormDataRef = useRef<FormData | null>(null);

  const saveFormData = useCallback((data: FormData) => {
    savedFormDataRef.current = data;
  }, []);

  const clearError = useCallback(() => {
    setSubmitError(null);
  }, []);

  const handleSubmitStart = useCallback((submissionId: string) => {
    submissionIdRef.current = submissionId;
    setIsSubmitting(true);
    setIsRetrying(false);
    setSubmitError(null);
    registerSubmission(submissionId);
  }, [registerSubmission]);

  const handleSubmitSuccess = useCallback((submissionId: string) => {
    setIsSubmitting(false);
    setSubmitError(null);
    savedFormDataRef.current = null; // Clear saved data on success
    unregisterSubmission(submissionId);
    options?.onSuccess?.();
  }, [unregisterSubmission, options]);

  const handleSubmitError = useCallback((submissionId: string, error: string) => {
    setIsSubmitting(false);
    setSubmitError(error);
    setIsRetrying(false);
    unregisterSubmission(submissionId);
    options?.onError?.();
  }, [unregisterSubmission, options]);

  const getSavedFormData = useCallback(() => {
    return savedFormDataRef.current;
  }, []);

  const clearSavedData = useCallback(() => {
    savedFormDataRef.current = null;
  }, []);

  const setRetrying = useCallback(() => {
    setIsRetrying(true);
    // Re-register submission for retry
    if (submissionIdRef.current) {
      registerSubmission(submissionIdRef.current);
    }
  }, [registerSubmission]);

  return {
    isSubmitting,
    submitError,
    isRetrying,
    saveFormData,
    getSavedFormData,
    clearSavedData,
    clearError,
    handleSubmitStart,
    handleSubmitSuccess,
    handleSubmitError,
    setRetrying,
  };
};
