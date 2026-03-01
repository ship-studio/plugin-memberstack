# Technology Stack

**Analysis Date:** 2026-03-01

## Languages

**Primary:**
- TypeScript 5.6 - All source code
- JSX/TSX 19.0 - UI components

## Runtime

**Environment:**
- Node.js - Required for MCP server execution and shell commands
- Browser/Electron - Ship Studio host environment

**Package Manager:**
- npm - Dependency management
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- React 19.0 - UI framework (peer dependency, injected by Ship Studio)
- Vite 6.0 - Build tool and development server
- TypeScript 5.6 - Static type checking and compilation

**Build/Dev:**
- Vite 6.0 - ES module bundling and library builds
- Rollup (via Vite) - Code splitting and external dependency handling

## Key Dependencies

**Critical:**
- React 19.0 (peer) - UI component framework
- @types/react 19.0 - TypeScript definitions for React

**Build Chain:**
- Vite 6.0 - Development and production bundling
- TypeScript 5.6 - Language transpilation

## Configuration

**Environment:**
- No .env file required for development
- Configuration via Ship Studio plugin context
- MCP server URL: `https://mcp.memberstack.com/mcp` (hardcoded in `src/useMemberstack.ts` line 5)

**Build:**
- Vite config: `vite.config.ts`
- TypeScript config: `tsconfig.json`
- Plugin manifest: `plugin.json`

**TypeScript Settings:**
- Target: ES2020
- Module: ESNext
- JSX: react-jsx
- Strict mode: enabled
- Module resolution: bundler

## Platform Requirements

**Development:**
- Node.js (any recent version supporting npm)
- npm for package management

**Production:**
- Ship Studio 0.3.53+ (specified in `plugin.json` min_app_version)
- One of two AI tools installed:
  - Claude Code (installed via `npm install -g @anthropic-ai/claude-code`)
  - OpenAI Codex (installed via `npm install -g @openai/codex`)
- Node.js available in system PATH (verified during plugin initialization)
- Bash/sh shell for executing detection and configuration scripts

## Build Output

**Library build:**
- Format: ES module (`es` format only)
- Output file: `dist/index.js`
- Externalized dependencies: `react`, `react-dom`, `react/jsx-runtime`
- External paths mapped to window globals via data URLs (Ship Studio injection)
- Minification: disabled
- Source maps: not generated (declaration: false)

## Scripts

**Available npm scripts:**
- `npm run build` - Vite library build for production
- `npm run dev` - Vite library build in watch mode for development

---

*Stack analysis: 2026-03-01*
