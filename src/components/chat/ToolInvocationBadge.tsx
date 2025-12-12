import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  state: string;
  args?: any;
  result?: any;
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const message = getToolMessage(toolInvocation);
  const isCompleted = toolInvocation.state === "result" && toolInvocation.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isCompleted ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{message}</span>
    </div>
  );
}

function getToolMessage(tool: ToolInvocation): string {
  const { toolName, args } = tool;

  if (toolName === "str_replace_editor" && args) {
    const { command, path } = args;

    switch (command) {
      case "create":
        return `Creating ${path}`;
      case "str_replace":
        return `Editing ${path}`;
      case "insert":
        return `Inserting into ${path}`;
      case "view":
        return `Viewing ${path}`;
      default:
        return `Modifying ${path}`;
    }
  }

  if (toolName === "file_manager" && args) {
    const { command, path, new_path } = args;

    switch (command) {
      case "rename":
        return `Renaming ${path} to ${new_path}`;
      case "delete":
        return `Deleting ${path}`;
      default:
        return `Managing ${path}`;
    }
  }

  // Fallback to tool name
  return toolName;
}
