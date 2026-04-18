import type { ButtonHTMLAttributes } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

export default function IconButton({ label, className = "", children, ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`text-text-muted hover:text-text-primary transition-colors cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
