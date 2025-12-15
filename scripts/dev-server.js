/**
 * Dynamic port dev server script
 * Finds an available port and starts Vite + Tauri with the correct URL
 * 
 * This script:
 * 1. Kills any stale processes on our preferred ports
 * 2. Finds a truly available port by actually binding to it
 * 3. Starts Vite with strictPort=true on that specific port
 * 4. Creates a temp Tauri config pointing to that port
 * 5. Starts Tauri
 */

import { spawn, execSync } from 'child_process';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const PREFERRED_PORT = 1420;
const MAX_PORT = 1450;

/**
 * Check if a port is available by actually binding to it briefly
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      resolve(false);
    });
    server.once('listening', () => {
      // Port is free - close immediately
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Find the first available port in range
 */
async function findAvailablePort(startPort) {
  for (let port = startPort; port <= MAX_PORT; port++) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
    console.log(`[Dev] Port ${port} is busy, trying next...`);
  }
  throw new Error(`No available ports found between ${startPort} and ${MAX_PORT}`);
}

/**
 * Kill any processes using the port (Windows-specific)
 */
function tryKillPort(port) {
  try {
    // Find PID using netstat on Windows
    const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const lines = result.trim().split('\n');
    const pids = new Set();
    
    for (const line of lines) {
      const match = line.match(/\s+(\d+)\s*$/);
      if (match) {
        pids.add(match[1]);
      }
    }
    
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`[Dev] Killed process ${pid} using port ${port}`);
      } catch (e) {
        // Process may have already exited
      }
    }
  } catch (e) {
    // No process found on port, which is fine
  }
}

async function main() {
  try {
    // Run prepare:mcp first
    console.log('[Dev] Preparing MCP server...');
    execSync('node scripts/prepare-mcp.js', { stdio: 'inherit', cwd: projectRoot });

    // Try to free up the preferred port
    console.log(`[Dev] Checking port ${PREFERRED_PORT}...`);
    tryKillPort(PREFERRED_PORT);
    
    // Wait a moment for ports to be released
    await new Promise(r => setTimeout(r, 500));

    // Find available port
    const port = await findAvailablePort(PREFERRED_PORT);
    console.log(`[Dev] ✓ Using port ${port}${port !== PREFERRED_PORT ? ` (${PREFERRED_PORT} was busy)` : ''}`);

    // Read existing tauri.conf.json
    const tauriConfPath = path.join(projectRoot, 'src-tauri', 'tauri.conf.json');
    const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
    
    // Create a temporary config file with the dynamic port
    const tempConfPath = path.join(projectRoot, 'src-tauri', 'tauri.dev.json');
    const devConf = {
      ...tauriConf,
      build: {
        ...tauriConf.build,
        devUrl: `http://localhost:${port}`,
        beforeDevCommand: null // We're handling dev server ourselves
      }
    };
    fs.writeFileSync(tempConfPath, JSON.stringify(devConf, null, 2));
    console.log(`[Dev] Created temporary config: tauri.dev.json`);

    // Start Vite with strictPort=true on our verified port
    console.log(`[Dev] Starting Vite on http://localhost:${port}`);
    const vite = spawn('npx', ['vite', '--port', port.toString(), '--strictPort'], {
      stdio: 'inherit',
      shell: true,
      cwd: projectRoot,
      env: { ...process.env }
    });

    // Wait for Vite to start
    await new Promise(r => setTimeout(r, 3000));

    // Start Tauri with the temporary config file
    console.log('[Dev] Starting Tauri...');
    const tauri = spawn('npx', ['tauri', 'dev', '-c', 'tauri.dev.json'], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(projectRoot, 'src-tauri'),
      env: { ...process.env }
    });

    // Handle cleanup
    const cleanup = () => {
      console.log('\n[Dev] Shutting down...');
      try {
        vite.kill();
        tauri.kill();
        // Clean up temp config
        if (fs.existsSync(tempConfPath)) {
          fs.unlinkSync(tempConfPath);
          console.log('[Dev] Cleaned up temporary config');
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      process.exit();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    // Wait for either to exit
    vite.on('exit', (code) => {
      console.log(`[Dev] Vite exited with code ${code}`);
      cleanup();
    });
    tauri.on('exit', (code) => {
      console.log(`[Dev] Tauri exited with code ${code}`);
      cleanup();
    });

  } catch (error) {
    console.error('[Dev] Error:', error.message);
    process.exit(1);
  }
}

main();
