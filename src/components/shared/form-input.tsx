"use client";

import { forwardRef, useState } from "react";

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'required'> {
  label?: string;
  icon?: string;
  error?: string;
  required?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon, error, required, type, className = "", ...props }, ref) => {
    const isPassword = type === "password";
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-(--on-surface-variant)">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            type={isPassword && showPassword ? "text" : type}
            className={`w-full bg-(--surface-container-low) border rounded-xl py-4 px-6 focus:bg-white focus:ring-2 focus:ring-(--primary)/20 focus:border-(--primary) transition-all text-(--on-surface) font-medium placeholder:text-(--outline)/40 outline-none ${icon ? "pl-12" : ""} ${isPassword ? "pr-12" : ""} ${error ? "border-red-400 bg-red-50/30" : "border-transparent"} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-(--outline) hover:text-(--on-surface) transition-colors"
              tabIndex={-1}
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          )}
        </div>
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
FormInput.displayName = "FormInput";
