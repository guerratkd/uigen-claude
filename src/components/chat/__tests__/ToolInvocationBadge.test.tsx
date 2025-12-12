import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

describe("ToolInvocationBadge", () => {
  describe("str_replace_editor tool", () => {
    it("displays 'Creating' message for create command", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        state: "result",
        args: {
          command: "create",
          path: "/App.jsx",
          file_text: "console.log('hello')",
        },
        result: "File created: /App.jsx",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("Creating /App.jsx")).toBeDefined();
    });

    it("displays 'Editing' message for str_replace command", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        state: "result",
        args: {
          command: "str_replace",
          path: "/components/Card.jsx",
          old_str: "old",
          new_str: "new",
        },
        result: "Replaced 1 occurrence(s)",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("Editing /components/Card.jsx")).toBeDefined();
    });

    it("displays 'Inserting into' message for insert command", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        state: "result",
        args: {
          command: "insert",
          path: "/utils/helpers.js",
          insert_line: 5,
          new_str: "// New comment",
        },
        result: "Text inserted",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("Inserting into /utils/helpers.js")).toBeDefined();
    });

    it("displays 'Viewing' message for view command", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        state: "result",
        args: {
          command: "view",
          path: "/config.json",
        },
        result: "1\t{ config: true }",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("Viewing /config.json")).toBeDefined();
    });

    it("displays 'Modifying' message for unknown command", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        state: "result",
        args: {
          command: "unknown",
          path: "/test.js",
        },
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("Modifying /test.js")).toBeDefined();
    });
  });

  describe("file_manager tool", () => {
    it("displays 'Renaming' message for rename command", () => {
      const toolInvocation = {
        toolName: "file_manager",
        state: "result",
        args: {
          command: "rename",
          path: "/old.jsx",
          new_path: "/new.jsx",
        },
        result: { success: true },
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("Renaming /old.jsx to /new.jsx")).toBeDefined();
    });

    it("displays 'Deleting' message for delete command", () => {
      const toolInvocation = {
        toolName: "file_manager",
        state: "result",
        args: {
          command: "delete",
          path: "/components/OldComponent.jsx",
        },
        result: { success: true },
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("Deleting /components/OldComponent.jsx")).toBeDefined();
    });

    it("displays 'Managing' message for unknown command", () => {
      const toolInvocation = {
        toolName: "file_manager",
        state: "result",
        args: {
          command: "unknown",
          path: "/test.js",
        },
        result: { success: true },
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("Managing /test.js")).toBeDefined();
    });
  });

  describe("unknown tool", () => {
    it("displays tool name as fallback", () => {
      const toolInvocation = {
        toolName: "custom_tool",
        state: "result",
        args: {},
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("custom_tool")).toBeDefined();
    });

    it("displays tool name when args are missing", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        state: "result",
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("str_replace_editor")).toBeDefined();
    });
  });

  describe("loading state", () => {
    it("displays spinner when tool is in progress", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        state: "call",
        args: {
          command: "create",
          path: "/App.jsx",
        },
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

      // Check for loading spinner (Loader2 component)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeDefined();
    });

    it("displays green dot when tool is completed", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        state: "result",
        args: {
          command: "create",
          path: "/App.jsx",
        },
        result: "File created",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

      // Check for green completion dot
      const completionDot = document.querySelector('.bg-emerald-500');
      expect(completionDot).toBeDefined();
    });
  });
});
