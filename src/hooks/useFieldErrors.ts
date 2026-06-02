import { useCallback, useState } from "react";

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

export function useFieldErrors<T extends string>() {
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = useCallback((next: FieldErrors<T>): boolean => {
    setErrors(next);
    setSubmitted(Object.keys(next).length > 0);
    return Object.keys(next).length === 0;
  }, []);

  const clearField = useCallback((field: T) => {
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setErrors({});
    setSubmitted(false);
  }, []);

  const getError = useCallback(
    (field: T) => (submitted ? errors[field] : undefined),
    [errors, submitted],
  );

  const showError = useCallback(
    (field: T) => submitted && !!errors[field],
    [errors, submitted],
  );

  return {
    errors,
    submitted,
    validate,
    clearField,
    reset,
    getError,
    showError,
  };
}
