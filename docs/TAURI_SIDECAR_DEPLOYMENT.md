# Tauri Sidecar Binary Deployment Guide

## Critical Path Discovery

**Problem Discovered:** 2024-12-14

When deploying updated MCP server binaries during development, the app was still loading old versions because Tauri dev mode uses a different path than expected.

## Binary Locations

| Location                             | Purpose                            |
| ------------------------------------ | ---------------------------------- |
| `src-tauri/binaries/`                | Source files for production builds |
| `src-tauri/target/debug/binaries/`   | Runtime location for `tauri dev`   |
| `src-tauri/target/release/binaries/` | Runtime location for `tauri build` |

## Deployment Procedure

When updating `rpg-mcp-server`:

1. Build the new binary:

   ```bash
   cd rpg-mcp
   npm run build:binaries
   ```

2. Copy to **BOTH** locations:

   ```powershell
   # Production source
   Copy-Item -Force bin/rpg-mcp-win.exe src-tauri/binaries/rpg-mcp-server-x86_64-pc-windows-msvc.exe

   # Dev runtime (Tauri dev loads from here!)
   Copy-Item -Force bin/rpg-mcp-win.exe src-tauri/target/debug/binaries/rpg-mcp-server-x86_64-pc-windows-msvc.exe
   ```

3. Kill any running server processes:

   ```powershell
   taskkill /F /IM rpg-mcp-server* /T
   ```

4. Restart the app (`npm run tauri dev`)

## The `prepare-mcp.js` Script

This script only copies `better_sqlite3.node`, NOT the main server executable. A future enhancement could be to add server binary copying to this script.
