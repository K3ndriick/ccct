import Button from "../ui/Button";
import { useRef, useEffect } from "react";

type SettingsModalProps = {
  onClose: () => void,
  onOpenConfig: () => void
}

export default function SettingsModal({ onClose, onOpenConfig } : SettingsModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose])

  return (
    <div ref={ref} className="fixed top-12 right-4 z-50 w-64 bg-surface-raised border border-surface-border rounded-md shadow">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted px-3 py-2">Settings</p>

      <section className="border-t border-surface-border px-3 py-2">
        <p className="text-sm text-text-primary">Color</p>
        <p className="text-sm text-text-primary">Coming Soon...</p>
      </section>

      <section className="border-t border-surface-border px-3 py-2">
        <p className="text-sm text-text-primary">Font Size</p>
        <p className="text-sm text-text-primary">Coming soon...</p>
      </section>

      <section className="border-t border-surface-border px-3 py-2">
        <p className="text-sm text-text-primary">Accessibility</p>
        <p className="text-sm text-text-primary">Coming soon...</p>
      </section>

      <div className="border-t border-surface-border px-3 py-2">
        <Button className="w-full" onClick={onOpenConfig}>Configuration</Button>
      </div>
    </div>
  )

}