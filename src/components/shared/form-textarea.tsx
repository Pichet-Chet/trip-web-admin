"use client";

import { forwardRef } from "react";

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full bg-(--surface-container-low) border border-transparent rounded-xl py-4 px-6 focus:bg-white focus:ring-2 focus:ring-(--primary)/20 focus:border-(--primary) transition-all text-(--on-surface) font-medium placeholder:text-(--outline)/40 outline-none resize-none ${className}`}
          {...props}
        />
      </div>
    );
  }
);
FormTextarea.displayName = "FormTextarea";
