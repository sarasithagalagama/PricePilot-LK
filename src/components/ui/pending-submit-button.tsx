"use client";

import { useFormStatus } from "react-dom";

interface PendingSubmitButtonProps {
  idleText: string;
  pendingText: string;
  className: string;
  disabled?: boolean;
}

export function PendingSubmitButton({
  idleText,
  pendingText,
  className,
  disabled = false,
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={className}
      aria-disabled={pending || disabled}
    >
      {pending ? pendingText : idleText}
    </button>
  );
}
