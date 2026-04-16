import 'server-only';

import { loadEnvConfig } from '@next/env';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  loadEnvConfig(process.cwd());
  loadEnvConfig(path.resolve(process.cwd(), '..'));
}

function getConnectionString() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. Add it to your environment or the repo root .env file.',
    );
  }

  const connectionUrl = new URL(databaseUrl);
  const runningInDocker = existsSync('/.dockerenv');

  // When the frontend runs on the host machine, "postgres" is only reachable
  // from the Docker network, so fall back to the published container port.
  if (!runningInDocker && connectionUrl.hostname === 'postgres') {
    connectionUrl.hostname = process.env.DATABASE_HOST || 'localhost';
    connectionUrl.port = process.env.DATABASE_PORT || '5433';
  }

  return connectionUrl.toString();
}

let poolInstance: Pool | null = null;

function getPool() {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: getConnectionString(),
    });
  }

  return poolInstance;
}

export const pool = new Proxy({} as Pool, {
  get(_target, property) {
    const value = getPool()[property as keyof Pool];
    return typeof value === 'function' ? value.bind(getPool()) : value;
  },
});
