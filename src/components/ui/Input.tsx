import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  mono?: boolean;
};

const Input = forwardRef<HTMLInputElement, InputProps>(({ mono = false, className = "", ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`bg-surface-overlay border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent ${mono ? "font-mono" : ""} ${className}`}
      {...props}
    />
  );
});

Input.displayName = "Input";
export default Input;
