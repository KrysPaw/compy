import { execSync } from 'node:child_process';
import { Client } from 'pg';

const TEST_DATABASE_NAME = 'compy_test';
const TEST_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/compy_test?schema=public';

function databaseName(databaseUrl: string): string {
  const { pathname } = new URL(databaseUrl);
  return decodeURIComponent(pathname.replace(/^\//, '')).split('/')[0] ?? '';
}

function maintenanceUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.pathname = '/postgres';
  return url.toString();
}

async function ensureTestDatabase(): Promise<void> {
  const name = databaseName(TEST_DATABASE_URL);

  if (name !== TEST_DATABASE_NAME) {
    throw new Error(
      `Refusing to prepare unexpected database "${name}". Expected "${TEST_DATABASE_NAME}".`,
    );
  }

  const client = new Client({ connectionString: maintenanceUrl(TEST_DATABASE_URL) });
  await client.connect();

  try {
    const existing = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [name],
    );

    if (existing.rowCount === 0) {
      await client.query(`CREATE DATABASE ${TEST_DATABASE_NAME}`);
    }
  } finally {
    await client.end();
  }
}

function migrateTestDatabase(): void {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
    },
  });
}

await ensureTestDatabase();
migrateTestDatabase();
