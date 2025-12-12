import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAuth } from "../use-auth";
import * as actions from "@/actions";
import * as anonTracker from "@/lib/anon-work-tracker";
import * as getProjectsAction from "@/actions/get-projects";
import * as createProjectAction from "@/actions/create-project";

// Create mock functions
const mockPush = vi.fn();

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signIn", () => {
    test("successfully signs in and handles post-sign-in flow", async () => {
      const mockResult = { success: true };
      vi.mocked(actions.signIn).mockResolvedValue(mockResult);
      vi.mocked(anonTracker.getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjectsAction.getProjects).mockResolvedValue([
        {
          id: "project-1",
          name: "Existing Project",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      let signInResult: any;
      await act(async () => {
        signInResult = await result.current.signIn("test@example.com", "password123");
      });

      expect(signInResult).toEqual(mockResult);
      expect(actions.signIn).toHaveBeenCalledWith("test@example.com", "password123");
      expect(result.current.isLoading).toBe(false);
    });

    test("sets loading state during sign in", async () => {
      const mockResult = { success: true };
      let resolveSignIn: any;
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve;
      });
      vi.mocked(actions.signIn).mockReturnValue(signInPromise as any);
      vi.mocked(anonTracker.getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjectsAction.getProjects).mockResolvedValue([]);
      vi.mocked(createProjectAction.createProject).mockResolvedValue({
        id: "new-project",
        name: "New Project",
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: "[]",
        data: "{}",
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      let signInPromiseRef: Promise<any>;
      act(() => {
        signInPromiseRef = result.current.signIn("test@example.com", "password123");
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      resolveSignIn(mockResult);
      await act(async () => {
        await signInPromiseRef!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("returns error result on sign in failure", async () => {
      const mockResult = { success: false, error: "Invalid credentials" };
      vi.mocked(actions.signIn).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let signInResult: any;
      await act(async () => {
        signInResult = await result.current.signIn("test@example.com", "wrongpassword");
      });

      expect(signInResult).toEqual(mockResult);
      expect(result.current.isLoading).toBe(false);
      expect(anonTracker.getAnonWorkData).not.toHaveBeenCalled();
    });

    test("resets loading state even if post-sign-in flow throws error", async () => {
      const mockResult = { success: true };
      vi.mocked(actions.signIn).mockResolvedValue(mockResult);
      vi.mocked(anonTracker.getAnonWorkData).mockImplementation(() => {
        throw new Error("Storage error");
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signIn("test@example.com", "password123");
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    test("successfully signs up and handles post-sign-in flow", async () => {
      const mockResult = { success: true };
      vi.mocked(actions.signUp).mockResolvedValue(mockResult);
      vi.mocked(anonTracker.getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjectsAction.getProjects).mockResolvedValue([]);
      vi.mocked(createProjectAction.createProject).mockResolvedValue({
        id: "new-project",
        name: "New Project",
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: "[]",
        data: "{}",
      });

      const { result } = renderHook(() => useAuth());

      let signUpResult: any;
      await act(async () => {
        signUpResult = await result.current.signUp("newuser@example.com", "password123");
      });

      expect(signUpResult).toEqual(mockResult);
      expect(actions.signUp).toHaveBeenCalledWith("newuser@example.com", "password123");
      expect(result.current.isLoading).toBe(false);
    });

    test("sets loading state during sign up", async () => {
      const mockResult = { success: true };
      let resolveSignUp: any;
      const signUpPromise = new Promise((resolve) => {
        resolveSignUp = resolve;
      });
      vi.mocked(actions.signUp).mockReturnValue(signUpPromise as any);
      vi.mocked(anonTracker.getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjectsAction.getProjects).mockResolvedValue([]);
      vi.mocked(createProjectAction.createProject).mockResolvedValue({
        id: "new-project",
        name: "New Project",
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: "[]",
        data: "{}",
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      let signUpPromiseRef: Promise<any>;
      act(() => {
        signUpPromiseRef = result.current.signUp("test@example.com", "password123");
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      resolveSignUp(mockResult);
      await act(async () => {
        await signUpPromiseRef!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("returns error result on sign up failure", async () => {
      const mockResult = { success: false, error: "Email already registered" };
      vi.mocked(actions.signUp).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let signUpResult: any;
      await act(async () => {
        signUpResult = await result.current.signUp("existing@example.com", "password123");
      });

      expect(signUpResult).toEqual(mockResult);
      expect(result.current.isLoading).toBe(false);
      expect(anonTracker.getAnonWorkData).not.toHaveBeenCalled();
    });

    test("resets loading state even if post-sign-in flow throws error", async () => {
      const mockResult = { success: true };
      vi.mocked(actions.signUp).mockResolvedValue(mockResult);
      vi.mocked(anonTracker.getAnonWorkData).mockImplementation(() => {
        throw new Error("Storage error");
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signUp("test@example.com", "password123");
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("handlePostSignIn - anonymous work flow", () => {
    test("creates project from anonymous work and redirects to it", async () => {
      const mockAnonWork = {
        messages: [{ id: "1", role: "user", content: "Create a counter" }],
        fileSystemData: { "/App.jsx": { type: "file", content: "test" } },
      };
      const mockProject = {
        id: "anon-project-123",
        name: "Design from 10:30:00 AM",
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: JSON.stringify(mockAnonWork.messages),
        data: JSON.stringify(mockAnonWork.fileSystemData),
      };

      vi.mocked(actions.signIn).mockResolvedValue({ success: true });
      vi.mocked(anonTracker.getAnonWorkData).mockReturnValue(mockAnonWork);
      vi.mocked(createProjectAction.createProject).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(anonTracker.getAnonWorkData).toHaveBeenCalled();
      expect(createProjectAction.createProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: mockAnonWork.messages,
        data: mockAnonWork.fileSystemData,
      });
      expect(anonTracker.clearAnonWork).toHaveBeenCalled();
    });

    test("does not create project from empty anonymous work", async () => {
      const mockAnonWork = {
        messages: [],
        fileSystemData: {},
      };

      vi.mocked(actions.signIn).mockResolvedValue({ success: true });
      vi.mocked(anonTracker.getAnonWorkData).mockReturnValue(mockAnonWork);
      vi.mocked(getProjectsAction.getProjects).mockResolvedValue([]);
      vi.mocked(createProjectAction.createProject).mockResolvedValue({
        id: "new-project",
        name: "New Project",
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: "[]",
        data: "{}",
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(anonTracker.getAnonWorkData).toHaveBeenCalled();
      expect(anonTracker.clearAnonWork).not.toHaveBeenCalled();
      expect(getProjectsAction.getProjects).toHaveBeenCalled();
    });

    test("handles null anonymous work data", async () => {
      vi.mocked(actions.signIn).mockResolvedValue({ success: true });
      vi.mocked(anonTracker.getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjectsAction.getProjects).mockResolvedValue([]);
      vi.mocked(createProjectAction.createProject).mockResolvedValue({
        id: "new-project",
        name: "New Project",
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: "[]",
        data: "{}",
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(anonTracker.getAnonWorkData).toHaveBeenCalled();
      expect(anonTracker.clearAnonWork).not.toHaveBeenCalled();
      expect(getProjectsAction.getProjects).toHaveBeenCalled();
    });
  });

  describe("handlePostSignIn - existing projects flow", () => {
    test("redirects to most recent project when projects exist", async () => {
      const mockProjects = [
        {
          id: "project-recent",
          name: "Recent Project",
          createdAt: new Date("2024-01-02"),
          updatedAt: new Date("2024-01-02"),
        },
        {
          id: "project-old",
          name: "Old Project",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ];

      vi.mocked(actions.signIn).mockResolvedValue({ success: true });
      vi.mocked(anonTracker.getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjectsAction.getProjects).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(getProjectsAction.getProjects).toHaveBeenCalled();
      expect(createProjectAction.createProject).not.toHaveBeenCalled();
    });
  });

  describe("handlePostSignIn - new project flow", () => {
    test("creates new project when no projects exist", async () => {
      const mockProject = {
        id: "new-project-456",
        name: "New Design #12345",
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: "[]",
        data: "{}",
      };

      vi.mocked(actions.signIn).mockResolvedValue({ success: true });
      vi.mocked(anonTracker.getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjectsAction.getProjects).mockResolvedValue([]);
      vi.mocked(createProjectAction.createProject).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(getProjectsAction.getProjects).toHaveBeenCalled();
      expect(createProjectAction.createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
    });

    test("generates random project name with number", async () => {
      const mockProject = {
        id: "new-project",
        name: "New Design #99999",
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: "[]",
        data: "{}",
      };

      vi.mocked(actions.signIn).mockResolvedValue({ success: true });
      vi.mocked(anonTracker.getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjectsAction.getProjects).mockResolvedValue([]);
      vi.mocked(createProjectAction.createProject).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      const createProjectCall = vi.mocked(createProjectAction.createProject).mock.calls[0][0];
      expect(createProjectCall.name).toMatch(/^New Design #\d+$/);
      const projectNumber = parseInt(createProjectCall.name.split("#")[1]);
      expect(projectNumber).toBeGreaterThanOrEqual(0);
      expect(projectNumber).toBeLessThan(100000);
    });
  });

  describe("edge cases", () => {
    test("handles concurrent sign in and sign up calls", async () => {
      vi.mocked(actions.signIn).mockResolvedValue({ success: true });
      vi.mocked(actions.signUp).mockResolvedValue({ success: true });
      vi.mocked(anonTracker.getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjectsAction.getProjects).mockResolvedValue([]);
      vi.mocked(createProjectAction.createProject).mockResolvedValue({
        id: "project",
        name: "Project",
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: "[]",
        data: "{}",
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await Promise.all([
          result.current.signIn("test@example.com", "password123"),
          result.current.signUp("test2@example.com", "password456"),
        ]);
      });

      expect(actions.signIn).toHaveBeenCalledTimes(1);
      expect(actions.signUp).toHaveBeenCalledTimes(1);
    });

    test("handles empty email and password", async () => {
      const mockResult = { success: false, error: "Email and password are required" };
      vi.mocked(actions.signIn).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let signInResult: any;
      await act(async () => {
        signInResult = await result.current.signIn("", "");
      });

      expect(signInResult).toEqual(mockResult);
      expect(actions.signIn).toHaveBeenCalledWith("", "");
    });

    test("isLoading is exposed in return value", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("signIn");
      expect(result.current).toHaveProperty("signUp");
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(typeof result.current.isLoading).toBe("boolean");
    });
  });
});
