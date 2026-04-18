import { FilePen, FilePlus, FileText, Search, Terminal } from "lucide-react";

type ToolType = "read" | "write" | "edit" | "bash" | "glob";

type ToolIconProps = {
  type: ToolType;
  size?: number;
};

const iconMap: Record<ToolType, { icon: React.ElementType; colorClass: string }> = {
  read:  { icon: FileText,  colorClass: "text-tool-read"  },
  write: { icon: FilePlus,  colorClass: "text-tool-write" },
  edit:  { icon: FilePen,   colorClass: "text-tool-edit"  },
  bash:  { icon: Terminal,  colorClass: "text-tool-bash"  },
  glob:  { icon: Search,    colorClass: "text-tool-glob"  },
};

export default function ToolIcon({ type, size = 14 }: ToolIconProps) {
  const { icon: Icon, colorClass } = iconMap[type];
  return <Icon size={size} className={colorClass} />;
}
