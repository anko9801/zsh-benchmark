/**
 * Migration utilities for handling schema changes
 * Ensures backward compatibility with older data formats
 */

import { HistoryEntry, SCHEMA_VERSIONS } from "./schema.ts";

export interface MigrationResult {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  errors: string[];
  warnings: string[];
}

/**
 * Migrate a history entry to the current schema version
 */
export function migrateEntry(entry: any): MigrationResult {
  const result: MigrationResult = {
    success: true,
    fromVersion: entry.metadata?.schemaVersion || 1,
    toVersion: SCHEMA_VERSIONS.CURRENT,
    errors: [],
    warnings: [],
  };

  if (result.fromVersion === result.toVersion) {
    return result;
  }

  try {
    let migratedEntry = { ...entry };

    // Apply migrations in sequence
    if (result.fromVersion < SCHEMA_VERSIONS.v2) {
      migratedEntry = migrateV1toV2(migratedEntry, result);
    }

    if (result.fromVersion < SCHEMA_VERSIONS.v3) {
      migratedEntry = migrateV2toV3(migratedEntry, result);
    }

    // Update schema version
    migratedEntry.metadata.schemaVersion = SCHEMA_VERSIONS.CURRENT;

    // Replace original entry properties
    Object.keys(entry).forEach(key => delete entry[key]);
    Object.assign(entry, migratedEntry);

  } catch (error) {
    result.success = false;
    result.errors.push(`Migration failed: ${error.message}`);
  }

  return result;
}

/**
 * Migrate from v1 to v2 (adds interactive metrics)
 */
function migrateV1toV2(entry: any, result: MigrationResult): any {
  const migrated = { ...entry };

  // Add interactive metrics placeholders to results
  if (migrated.results && Array.isArray(migrated.results)) {
    migrated.results = migrated.results.map((r: any) => ({
      ...r,
      firstPromptLag: undefined,
      firstCommandLag: undefined,
      commandLag: undefined,
      inputLag: undefined,
    }));
  }

  // Update statistics structure if present
  if (migrated.statistics?.summary) {
    for (const manager in migrated.statistics.summary) {
      for (const pluginCount in migrated.statistics.summary[manager]) {
        if (!migrated.statistics.summary[manager][pluginCount].interactiveMetrics) {
          migrated.statistics.summary[manager][pluginCount].interactiveMetrics = undefined;
        }
      }
    }
  }

  result.warnings.push("Added interactive metrics fields (v1 → v2)");
  return migrated;
}

/**
 * Migrate from v2 to v3 (adds resource monitoring)
 */
function migrateV2toV3(entry: any, result: MigrationResult): any {
  const migrated = { ...entry };

  // Add resource metrics to metadata
  if (!migrated.metadata.environment.cpuModel) {
    migrated.metadata.environment.cpuModel = undefined;
    migrated.metadata.environment.cpuCount = undefined;
    migrated.metadata.environment.memoryGB = undefined;
  }

  // Add resource usage to results
  if (migrated.results && Array.isArray(migrated.results)) {
    migrated.results = migrated.results.map((r: any) => ({
      ...r,
      resourceUsage: undefined,
    }));
  }

  result.warnings.push("Added resource monitoring fields (v2 → v3)");
  return migrated;
}

/**
 * Validate migration result
 */
export function validateMigration(entry: any, result: MigrationResult): boolean {
  if (!result.success) return false;

  // Check that schema version is current
  if (entry.metadata?.schemaVersion !== SCHEMA_VERSIONS.CURRENT) {
    result.errors.push(`Schema version mismatch: expected ${SCHEMA_VERSIONS.CURRENT}, got ${entry.metadata?.schemaVersion}`);
    return false;
  }

  // Check required fields based on current schema
  const requiredFields = ['id', 'timestamp', 'metadata', 'results'];
  for (const field of requiredFields) {
    if (!(field in entry)) {
      result.errors.push(`Missing required field: ${field}`);
      return false;
    }
  }

  return true;
}

/**
 * Batch migrate multiple entries
 */
export async function batchMigrate(
  entries: any[],
  onProgress?: (current: number, total: number) => void
): Promise<{
  successful: number;
  failed: number;
  results: MigrationResult[];
}> {
  const results: MigrationResult[] = [];
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < entries.length; i++) {
    if (onProgress) {
      onProgress(i + 1, entries.length);
    }

    const result = migrateEntry(entries[i]);
    results.push(result);

    if (result.success && validateMigration(entries[i], result)) {
      successful++;
    } else {
      failed++;
    }
  }

  return { successful, failed, results };
}

/**
 * Create a migration backup
 */
export async function createMigrationBackup(
  sourcePath: string,
  backupDir: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupPath = `${backupDir}/backup-${timestamp}.json`;
  
  try {
    const content = await Deno.readTextFile(sourcePath);
    await Deno.writeTextFile(backupPath, content);
    return backupPath;
  } catch (error) {
    throw new Error(`Failed to create backup: ${error.message}`);
  }
}

/**
 * Generate migration report
 */
export function generateMigrationReport(results: MigrationResult[]): string {
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  let report = `# Migration Report\n\n`;
  report += `Total entries: ${results.length}\n`;
  report += `Successful: ${successful}\n`;
  report += `Failed: ${failed}\n\n`;

  // Version summary
  const versionMap = new Map<string, number>();
  results.forEach(r => {
    const key = `v${r.fromVersion} → v${r.toVersion}`;
    versionMap.set(key, (versionMap.get(key) || 0) + 1);
  });

  report += `## Version Migrations\n`;
  versionMap.forEach((count, version) => {
    report += `- ${version}: ${count} entries\n`;
  });

  // Errors summary
  const errors = results.flatMap(r => r.errors);
  if (errors.length > 0) {
    report += `\n## Errors\n`;
    const errorMap = new Map<string, number>();
    errors.forEach(error => {
      errorMap.set(error, (errorMap.get(error) || 0) + 1);
    });
    errorMap.forEach((count, error) => {
      report += `- ${error}: ${count} occurrences\n`;
    });
  }

  // Warnings summary
  const warnings = results.flatMap(r => r.warnings);
  if (warnings.length > 0) {
    report += `\n## Warnings\n`;
    const warningMap = new Map<string, number>();
    warnings.forEach(warning => {
      warningMap.set(warning, (warningMap.get(warning) || 0) + 1);
    });
    warningMap.forEach((count, warning) => {
      report += `- ${warning}: ${count} occurrences\n`;
    });
  }

  return report;
}