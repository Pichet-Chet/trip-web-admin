"use client";

import { forwardRef } from "react";

interface FormTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "required"> {
  label?: string;
  error?: string;
  required?: boolean;
  hint?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, required, hint, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full bg-(--surface-container-low) border rounded-xl py-4 px-6 focus:bg-white focus:ring-2 focus:ring-(--primary)/20 focus:border-(--primary) transition-all text-(--on-surface) font-medium placeholder:text-(--outline)/40 outline-none resize-none ${error ? "border-red-400 bg-red-50/30" : "border-transparent"} ${className}`}
          {...props}
        />
        {hint && !error && (
          <p className="text-[11px] text-(--on-surface-variant) px-1">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-red-500 px-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);
FormTextarea.displayName = "FormTextarea";
