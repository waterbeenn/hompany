import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "rounded-[var(--radius-input)] px-4 py-2.5 text-[15px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "bg-primary text-white hover:bg-[#2f78c2]"
      : "border border-gray-100 text-gray-900 bg-white hover:bg-gray-50";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
