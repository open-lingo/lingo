import { LockIcon } from "@/shared/components/icons";

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
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
              : node.status === "current"
                ? "bg-emerald-500 text-white dark:bg-emerald-600"
                : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
          }`}
        >
          {node.status === "locked" && (
            <LockIcon className="h-3.5 w-3.5 shrink-0" />
          )}
          {node.label}
        </span>
      ))}
    </div>
  );
}
