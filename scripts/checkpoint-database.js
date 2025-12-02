/**
 * Checkpoint SQLite Database
 * This merges the WAL (Write-Ahead Log) into the main database file
 * so we have a single, portable .db file with all data.
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { copyFileSync, existsSync, unlinkSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceDbPath = 'C:\\Users\\mnehm\\AppData\\Local\\AnthropicClaude\\app-1.0.1405';
const sourceDb = join(sourceDbPath, 'rpg.db');
const targetDir = join(__dirname, '..', 'src-tauri');
const targetDb = join(targetDir, 'rpg.db');

console.log('📦 Creating bundled database with Fellowship data...\n');

// Open source database (read-only to be safe)
console.log('1️⃣  Opening source database...');
const db = new Database(sourceDb, { readonly: true });

// Get character count to verify
const result = db.prepare('SELECT COUNT(*) as count FROM characters').get();
console.log(`   ✓ Found ${result.count} characters in source database`);

// Close the database
db.close();

// Copy ALL database files (main file + WAL files)
console.log('\n2️⃣  Copying database files to Tauri project...');
copyFileSync(sourceDb, targetDb);
if (existsSync(sourceDb + '-wal')) {
    try {
        copyFileSync(sourceDb + '-wal', targetDb + '-wal');
        console.log(`   ✓ Copied WAL file`);
    } catch (err) {
        console.log(`   ⚠️  Could not copy WAL file (may be in use): ${err.message}`);
    }
}
if (existsSync(sourceDb + '-shm')) {
    try {
        copyFileSync(sourceDb + '-shm', targetDb + '-shm');
        console.log(`   ✓ Copied SHM file`);
    } catch (err) {
        console.log(`   ⚠️  Could not copy SHM file (may be in use): ${err.message}`);
    }
}
console.log(`   ✓ Main DB copied to: ${targetDb}`);

// Open the target database and checkpoint it
console.log('\n3️⃣  Checkpointing WAL to merge all data...');
const targetDbConn = new Database(targetDb);

// First verify it's in WAL mode
const journalMode = targetDbConn.pragma('journal_mode', { simple: true });
console.log(`   ℹ️  Journal mode: ${journalMode}`);

// Checkpoint to merge WAL into main file
const result2 = targetDbConn.pragma('wal_checkpoint(TRUNCATE)');
console.log(`   ✓ Checkpoint result: ${JSON.stringify(result2)}`);

// Verify data is present
const integrityCheck = targetDbConn.pragma('integrity_check', { simple: true });
if (integrityCheck !== 'ok') {
    console.log(`   ⚠️  Integrity check failed: ${integrityCheck}`);
    process.exit(1);
}

// Verify the checkpoint worked
const targetResult = targetDbConn.prepare('SELECT COUNT(*) as count FROM characters').get();
console.log(`   ✓ Checkpointed! ${targetResult.count} characters in bundled database`);

// List characters to confirm  
// First check what columns actually exist
console.log('\n📋 Characters in bundled database:');
try {
    const characters = targetDbConn.prepare('SELECT * FROM characters LIMIT 10').all();
    if (characters.length > 0) {
        console.log(`   Columns: ${Object.keys(characters[0]).join(', ')}`);
        characters.forEach(char => {
            console.log(`   - ${char.name || char.id}`);
        });
    } else {
        console.log('   ⚠️  No characters found after checkpoint!');
    }
} catch (err) {
    console.log('   ⚠️  Error reading characters:', err.message);
}

// Switch to DELETE journal mode to remove WAL files
console.log('\n4️⃣  Switching to DELETE mode for single-file distribution...');
targetDbConn.pragma('journal_mode = DELETE');
targetDbConn.close();

// Clean up WAL files if they still exist
if (existsSync(targetDb + '-wal')) {
    unlinkSync(targetDb + '-wal');
    console.log('   ✓ Removed WAL file');
}
if (existsSync(targetDb + '-shm')) {
    unlinkSync(targetDb + '-shm');
    console.log('   ✓ Removed SHM file');
}

console.log('\n✅ Database ready! This will be bundled with the Tauri app.\n');
