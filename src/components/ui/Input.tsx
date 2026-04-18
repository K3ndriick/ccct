import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  mono?: boolean;
};

export default function Input({ mono = false, className = "", ...props }: InputProps) {
  return (
    <input
      className={`bg-surface-overlay border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent ${mono ? "font-mono" : ""} ${className}`}
      {...props}
    />
  );
}
