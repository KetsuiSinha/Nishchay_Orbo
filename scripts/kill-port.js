/**
 * Kills any process listening on the given port (Windows).
 * Usage: node scripts/kill-port.js 8000
 */
const { execSync } = require('child_process');

const port = process.argv[2] || '8000';

try {
  const result = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  });

  const pids = new Set();
  result
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const parts = line.split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    });

  if (pids.size === 0) {
    console.log(`[kill-port] Port ${port} is free.`);
    process.exit(0);
  }

  pids.forEach((pid) => {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      console.log(`[kill-port] Killed stale process ${pid} on port ${port}.`);
    } catch {
      console.warn(`[kill-port] Could not kill process ${pid}.`);
    }
  });
} catch {
  // findstr returns non-zero when no match found — port is free
  console.log(`[kill-port] Port ${port} is free.`);
}
