/**
 * One-shot migration: convert legacy Environment data into Chrome bookmarks
 * tagged with the appropriate environment metadata. Runs once on app boot.
 *
 * For each environment (Local / Stage / Production), every link becomes a
 * Chrome bookmark under "Environments / <env name>", with the `environment`
 * field persisted in our metadata overlay so the existing prod-safety and
 * "open all" actions in the bookmarks panel keep working.
 *
 * Safe to call multiple times — guarded by `environmentsMigratedToBookmarks`.
 */

import type { Environment, StorageKey } from '@/types';
import { storage } from '@/services/storage';
import { createChromeBookmark } from './chromeBookmarks';

const MIGRATION_FLAG = 'environmentsMigratedToBookmarks' as StorageKey;

interface MigrationResult {
  ranNow: boolean;
  importedCount: number;
}

interface BookmarkMetaPatch {
  environment: 'local' | 'stage' | 'production';
  tags: string[];
  description?: string;
}

async function patchMetaForId(id: string, patch: BookmarkMetaPatch): Promise<void> {
  const meta = (await storage.get<Record<string, unknown>>('bookmarksMeta')) ?? {};
  meta[id] = { ...(meta[id] as object), ...patch };
  await storage.set('bookmarksMeta', meta);
}

export async function migrateEnvironmentsToBookmarks(): Promise<MigrationResult> {
  // Already migrated? Short-circuit.
  const done = await storage.get<boolean>(MIGRATION_FLAG);
  if (done) return { ranNow: false, importedCount: 0 };

  const environments = (await storage.get<Environment[]>('environments')) ?? [];
  if (environments.length === 0) {
    await storage.set(MIGRATION_FLAG, true);
    return { ranNow: false, importedCount: 0 };
  }

  let imported = 0;

  for (const env of environments) {
    if (!env.links?.length) continue;
    const folderTitle = `Environments / ${env.name}`;

    for (const link of env.links) {
      if (!link.url) continue;
      try {
        const created = await createChromeBookmark(link.label || link.url, link.url, folderTitle);
        if (!created) continue;
        await patchMetaForId(created.id, {
          environment: env.type,
          tags: [env.name, link.type].filter(Boolean),
          description: env.notes,
        });
        imported += 1;
      } catch {
        // Skip individual failures so a single bad link doesn't abort the
        // whole migration — the user can retry next boot if the flag isn't set.
      }
    }
  }

  await storage.set(MIGRATION_FLAG, true);
  return { ranNow: true, importedCount: imported };
}
