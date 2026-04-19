import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-surface-base font-semibold hover:bg-accent-dim disabled:bg-surface-raised disabled:text-text-muted disabled:cursor-not-allowed",
  secondary:
    "border border-surface-border text-text-secondary hover:text-text-primary",
  ghost:
    "text-text-secondary hover:text-text-primary",
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`px-3 py-2 rounded-md text-sm transition-colors cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
