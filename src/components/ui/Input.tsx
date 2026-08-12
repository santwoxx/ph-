"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import clsx from "clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, hint, id, ...props },
  ref
) {
  return (
    <label className="block w-full">
      {label && (
        <span className="mb-1.5 block text-sm font-semibold text-acai-900">{label}</span>
      )}
      <input
        ref={ref}
        id={id}
        className={clsx(
          "w-full rounded-xl border-2 border-acai-100 bg-white px-4 py-2.5 text-sm text-acai-950 outline-none transition placeholder:text-acai-300",
          "focus:border-acai-500 focus:ring-4 focus:ring-acai-100",
          error && "border-red-400 focus:border-red-500 focus:ring-red-100",
          className
        )}
        {...props}
      />
      {hint && !error && <span className="mt-1 block text-xs text-acai-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-500">{error}</span>}
    </label>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, error, id, ...props },
  ref
) {
  return (
    <label className="block w-full">
      {label && (
        <span className="mb-1.5 block text-sm font-semibold text-acai-900">{label}</span>
      )}
      <textarea
        ref={ref}
        id={id}
        className={clsx(
          "w-full resize-none rounded-xl border-2 border-acai-100 bg-white px-4 py-2.5 text-sm text-acai-950 outline-none transition placeholder:text-acai-300",
          "focus:border-acai-500 focus:ring-4 focus:ring-acai-100",
          error && "border-red-400 focus:border-red-500 focus:ring-red-100",
          className
        )}
        {...props}
      />
      {error && <span className="mt-1 block text-xs font-medium text-red-500">{error}</span>}
    </label>
  );
});
