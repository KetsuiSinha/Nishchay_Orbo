/**
 * Kills stale Vite dev servers (node processes) that are orphaned.
 * Targets only node.exe processes whose command line includes "vite".
 */
const { execSync } = require('child_process');

try {
  const result = execSync(
    'wmic process where "name=\'node.exe\'" get ProcessId,CommandLine /format:list',
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
  );

  const blocks = result.split('\n\n').filter((b) => b.includes('CommandLine'));
  let killed = 0;

  blocks.forEach((block) => {
    const cmdMatch = block.match(/CommandLine=(.*)/);
    const pidMatch = block.match(/ProcessId=(\d+)/);
    if (!cmdMatch || !pidMatch) return;

    const cmd = cmdMatch[1];
    const pid = pidMatch[1];

    // Only kill vite dev servers (not our npm scripts)
    if (cmd.includes('vite') && !cmd.includes('kill-port')) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`[cleanup] Killed stale Vite process ${pid}`);
        killed++;
      } catch {
        /* ignore */
      }
    }
  });

  if (killed === 0) console.log('[cleanup] No stale Vite processes found.');
} catch {
  console.log('[cleanup] No stale processes found.');
}
