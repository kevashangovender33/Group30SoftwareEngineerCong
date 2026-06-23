import { execSync } from 'node:child_process';
import path from 'node:path';

/**
 * Global setup for Playwright E2E tests.
 * Seeds the database before any test runs to ensure deterministic test data.
 */
export default function globalSetup() {
  const rootDir = path.resolve(import.meta.dirname, '../..');

  console.log('🌱 Seeding database for E2E tests...');
  execSync('npm run db:seed --workspace=server', {
    cwd: rootDir,
    stdio: 'pipe',
  });
  console.log('✅ Database seeded');
}
