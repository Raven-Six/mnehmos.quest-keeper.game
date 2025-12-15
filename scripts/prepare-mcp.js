import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Paths
const srcNativeModule = join(projectRoot, 'src-tauri', 'better_sqlite3.node');
const targetDebug = join(projectRoot, 'src-tauri', 'target', 'debug', 'better_sqlite3.node');
const targetRelease = join(projectRoot, 'src-tauri', 'target', 'release', 'better_sqlite3.node');

console.log('[Prepare MCP] Copying better_sqlite3.node to target directories...');

// Ensure source exists
if (!existsSync(srcNativeModule)) {
  console.error('[Prepare MCP] ERROR: better_sqlite3.node not found in src-tauri/binaries/');
  console.error('[Prepare MCP] Please ensure the native module is present before running.');
  process.exit(1);
}

// Create debug directory if needed and copy
try {
  const debugDir = dirname(targetDebug);
  if (!existsSync(debugDir)) {
    mkdirSync(debugDir, { recursive: true });
  }
  copyFileSync(srcNativeModule, targetDebug);
  console.log('[Prepare MCP] ✓ Copied to debug/');
} catch (err) {
  console.error('[Prepare MCP] Failed to copy to debug:', err.message);
}

// Create release directory if needed and copy
try {
  const releaseDir = dirname(targetRelease);
  if (!existsSync(releaseDir)) {
    mkdirSync(releaseDir, { recursive: true });
  }
  copyFileSync(srcNativeModule, targetRelease);
  console.log('[Prepare MCP] ✓ Copied to release/');
} catch (err) {
  console.error('[Prepare MCP] Failed to copy to release:', err.message);
}

console.log('[Prepare MCP] Native module preparation complete!');
