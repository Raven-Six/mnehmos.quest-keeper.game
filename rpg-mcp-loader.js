// Native module loader for pkg-bundled binaries
// This ensures better-sqlite3.node is found when running as a packaged executable

const path = require('path');
const fs = require('fs');

// When running as pkg binary, __dirname points to the snapshot filesystem
// We need to look for better_sqlite3.node in the executable's directory
if (process.pkg) {
  const execPath = path.dirname(process.execPath);
  const nativeModulePath = path.join(execPath, 'better_sqlite3.node');
  
  console.log('[Loader] Running as pkg binary');
  console.log('[Loader] Executable path:', process.execPath);
  console.log('[Loader] Looking for better_sqlite3.node at:', nativeModulePath);
  
  if (fs.existsSync(nativeModulePath)) {
    console.log('[Loader] Found better_sqlite3.node');
    process.env.BETTER_SQLITE3_BINARY_PATH = nativeModulePath;
  } else {
    console.error('[Loader] ERROR: better_sqlite3.node not found!');
    console.error('[Loader] Make sure better_sqlite3.node is in the same directory as the executable');
  }
}

// Now require the main server
require('./dist-bundle/server.cjs');
