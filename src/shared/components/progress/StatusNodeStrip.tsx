import { Icon } from "@/shared/components/Icon";

export type NodeStatus = "completed" | "current" | "locked";

type StatusNode = {
  id: string;
  label: string;
  status: NodeStatus;
};

type StatusNodeStripProps = {
  nodes: StatusNode[];
  className?: string;
};

export function StatusNodeStrip({ nodes, className = "" }: StatusNodeStripProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {nodes.map((node) => (
        <span
          key={node.id}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
            node.status === "completed"
              ? "bg-accent-muted text-accent"
              : node.status === "current"
                ? "bg-accent text-accent-foreground"
                : "bg-surface-muted text-text-muted"
          }`}
        >
          {node.status === "locked" && (
            <Icon name="lock" size={14} className="shrink-0" />
          )}
          {node.label}
        </span>
      ))}
    </div>
  );
}
