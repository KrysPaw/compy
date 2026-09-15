import { execSync } from 'node:child_process';
import path from 'node:path';
import { E2E_DATABASE_URL } from './env';

export default function globalSetup(): void {
  const repoRoot = path.resolve(__dirname, '../../..');

  execSync('npm run db:test:prepare -w @compy/api', {
    cwd: repoRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      E2E_DATABASE_URL,
    },
  });
}
