import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-[15px] text-gray-900">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`rounded-[var(--radius-input)] border px-3.5 py-2.5 text-[15px] text-gray-900 outline-none transition-colors placeholder:text-gray-600 focus:border-primary ${
            error ? "border-danger-text" : "border-gray-100"
          } ${className}`}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {error && <p className="text-[13px] text-danger-text">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
