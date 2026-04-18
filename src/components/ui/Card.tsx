import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export default function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`bg-surface-raised border border-surface-border rounded-md overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
