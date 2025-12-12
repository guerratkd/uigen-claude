# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. It uses Claude (Anthropic) to generate React components based on natural language descriptions. The app features a virtual file system (no files written to disk), live preview with hot reload, and supports both authenticated and anonymous users.

## Development Commands

### Initial Setup
```bash
npm run setup
```
Installs dependencies, generates Prisma client, and runs database migrations. Run this first.

### Development Server
```bash
npm run dev
```
Starts Next.js dev server with Turbopack at http://localhost:3000

### Testing
```bash
npm test                    # Run all tests with Vitest
npm test -- path/to/test    # Run specific test file
npm test -- --ui            # Run tests with UI
```

Tests use Vitest with jsdom environment and React Testing Library.

### Database Operations
```bash
npx prisma generate         # Generate Prisma client (after schema changes)
npx prisma migrate dev      # Create and apply migrations
npm run db:reset            # Reset database (drops all data)
npx prisma studio           # Open database GUI
```

### Build and Lint
```bash
npm run build              # Production build
npm run lint               # Run ESLint
```

## Architecture

### Core File System Architecture

The application uses a **virtual in-memory file system** (`VirtualFileSystem` class in `src/lib/file-system.ts`) that operates entirely in browser memory—no files are written to disk during component generation. This is critical to understand:

- Files are stored as a `Map<string, FileNode>` structure
- All paths use Unix-style (`/`) and must start with `/`
- The file system supports standard operations: create, read, update, delete, rename
- The VFS is serialized to JSON for database persistence (authenticated users only)
- Anonymous users store their work in sessionStorage via `src/lib/anon-work-tracker.ts`

### AI Integration & Tool System

The AI chat functionality (`src/app/api/chat/route.ts`) uses the Vercel AI SDK with two custom tools:

1. **`str_replace_editor`** (`src/lib/tools/str-replace.ts`): Text editor-style operations
   - `view`: Display file contents with line numbers
   - `create`: Create new files with automatic parent directory creation
   - `str_replace`: Replace all occurrences of a string in a file
   - `insert`: Insert text at a specific line number

2. **`file_manager`** (`src/lib/tools/file-manager.ts`): File management operations
   - `rename`: Move/rename files or directories (recursively creates parent dirs)
   - `delete`: Delete files or directories

The AI receives a system prompt from `src/lib/prompts/generation.tsx` instructing it to:
- Always create `/App.jsx` as the root entry point with a default export
- Use `@/` import alias for local files (e.g., `import Counter from '@/components/Counter'`)
- Style with Tailwind CSS (never hardcoded styles)
- Keep responses brief and focus on implementation

### React Context Architecture

The app uses two main React contexts:

1. **FileSystemContext** (`src/lib/contexts/file-system-context.tsx`):
   - Wraps the `VirtualFileSystem` instance
   - Manages selected file state
   - Handles tool call updates from AI (creates/updates files in real-time)
   - Provides `refreshTrigger` mechanism to notify UI of file changes
   - Can deserialize saved projects from database

2. **ChatContext** (`src/lib/contexts/chat-context.tsx`):
   - Uses `useChat` from Vercel AI SDK
   - Sends serialized file system with each message
   - Calls `handleToolCall` on FileSystemContext to update files
   - Tracks anonymous work via `setHasAnonWork` for session persistence

### Preview System & JSX Transformation

The preview system (`src/components/preview/PreviewFrame.tsx`) transforms JSX to executable JavaScript:

1. **JSX Transformer** (`src/lib/transform/jsx-transformer.ts`):
   - Uses `@babel/standalone` to transpile JSX/TSX to JavaScript
   - Extracts imports and CSS imports
   - Creates ES module import maps with blob URLs
   - Maps `@/` alias to root directory
   - Third-party packages load from `esm.sh` CDN
   - Handles missing imports by creating placeholder modules
   - Tracks syntax errors per file

2. **Preview HTML Generation** (`createPreviewHTML` in jsx-transformer.ts):
   - Generates standalone HTML with inline import map
   - Includes Tailwind CDN
   - Injects collected CSS from `.css` files
   - Creates React error boundary for runtime errors
   - Displays syntax errors with formatted UI if transformation fails
   - Entry point is always `/App.jsx` (or first available file)

The preview updates in real-time as AI tools modify files through the FileSystemContext.

### Authentication & Data Persistence

- **Auth System** (`src/lib/auth.ts`): JWT-based sessions using `jose` library
  - Tokens stored in HTTP-only cookies (7-day expiration)
  - Session includes `userId`, `email`, `expiresAt`
  - Middleware (`src/middleware.ts`) protects project routes

- **Database** (Prisma + SQLite):
  - `User`: email, hashed password (bcrypt)
  - `Project`: name, userId, messages (JSON), data (serialized VFS, JSON)
  - Projects saved after each AI response completion (`onFinish` callback)
  - Anonymous users have no persistence beyond sessionStorage

- **Anonymous Work Tracking** (`src/lib/anon-work-tracker.ts`):
  - Stores messages and file system data in sessionStorage
  - Used to prompt anonymous users to sign up and preserve work
  - Keys: `uigen_has_anon_work`, `uigen_anon_data`

### Mock Provider

If `ANTHROPIC_API_KEY` is not set in `.env`, the app uses `MockLanguageModel` (`src/lib/provider.ts`):
- Returns static component templates (Counter, ContactForm, or Card)
- Simulates multi-turn tool use (create component → enhance → create App.jsx)
- Limited to 4 steps to prevent repetition
- Useful for development/demo without API costs

## Key Implementation Details

### Path Resolution Rules
- All file paths in VFS use absolute paths starting with `/`
- Import alias `@/` maps to root directory `/`
- Example: `/components/Button.jsx` can be imported as `@/components/Button`
- Import map supports both with and without file extensions

### Component Requirements
- **Every project must have `/App.jsx`** as the entry point
- App.jsx must export a React component as default export
- All styling should use Tailwind utility classes (Tailwind CDN loaded in preview)

### Testing Patterns
- Tests are colocated in `__tests__` directories next to source files
- Use `@testing-library/react` for component tests
- Use `@testing-library/user-event` for interactions
- File system and context tests mock only necessary parts

### Environment Variables
```bash
ANTHROPIC_API_KEY=sk-...      # Optional: enables real AI generation
JWT_SECRET=...                # Used for auth tokens (defaults to dev key)
```

## Common Workflows

### Adding New AI Tools
1. Create tool definition in `src/lib/tools/[tool-name].ts`
2. Build tool with `tool()` from `ai` package
3. Define Zod schema for parameters
4. Implement `execute` function that operates on VirtualFileSystem
5. Register in `tools` object in `src/app/api/chat/route.ts`
6. Add handling in `FileSystemContext.handleToolCall()` if UI updates needed

### Debugging Preview Issues
- Check browser console in preview iframe (right-click preview → Inspect)
- Verify import map in generated HTML (logged to console on errors)
- Ensure all imports use `@/` for local files
- Check that `/App.jsx` exists and has default export
- Look for syntax errors in file transformation (displayed in preview UI)

### Modifying System Prompt
- Edit `src/lib/prompts/generation.tsx`
- Changes apply immediately (prompt is sent with each request)
- Uses prompt caching for efficiency (Anthropic cache control)
