import { Settings } from "lucide-react";

type TopBarProps = {
  onSettingsClick: () => void
}

export default function TopBar({ onSettingsClick } : TopBarProps) {
  return(
    <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
      <h1 className="text-sm font-semibold text-text-primary">CCCT</h1>

      <button className="text-text-muted" onClick={onSettingsClick}>
        <Settings size={14}/>
      </button>
    </div>
  )  
}