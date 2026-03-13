#!/usr/bin/env ts-node
/**
 * Model Promotion Script
 * Promotes models from staging to production with versioning
 * 
 * Usage: npx ts-node scripts/promote-model.ts <model-id>
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuration
const CONFIG = {
  REGISTRY_PATH: path.join(__dirname, '..', 'src', 'dev', 'model-registry.json'),
  VERSIONS_TO_KEEP: 3,
  BACKUP_DIR: path.join(__dirname, '..', 'model-backups'),
};

// Model entry interface
interface ModelEntry {
  id: string;
  version: string;
  url: string;
  checksum: string;
  accuracy: number;
  size: number;
  deployedAt: string;
  status: 'staging' | 'production' | 'archived';
  previousVersion?: string;
}

// Registry interface
interface ModelRegistry {
  models: ModelEntry[];
  version: string;
  lastUpdated: string;
}

// Promotion report interface
interface PromotionReport {
  modelId: string;
  previousVersion: string;
  newVersion: string;
  timestamp: string;
  success: boolean;
  rolledBackVersion?: string;
  archivedVersions: string[];
  errors: string[];
}

/**
 * Load the model registry
 */
function loadRegistry(): ModelRegistry {
  if (!fs.existsSync(CONFIG.REGISTRY_PATH)) {
    // Create default registry if not exists
    const defaultRegistry: ModelRegistry = {
      models: [],
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
    };
    saveRegistry(defaultRegistry);
    return defaultRegistry;
  }
  
  const content = fs.readFileSync(CONFIG.REGISTRY_PATH, 'utf-8');
  return JSON.parse(content);
}

/**
 * Save the model registry
 */
function saveRegistry(registry: ModelRegistry): void {
  registry.lastUpdated = new Date().toISOString();
  fs.mkdirSync(path.dirname(CONFIG.REGISTRY_PATH), { recursive: true });
  fs.writeFileSync(CONFIG.REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

/**
 * Parse semantic version
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

/**
 * Increment patch version
 */
function incrementPatch(version: string): string {
  const v = parseVersion(version);
  return `${v.major}.${v.minor}.${v.patch + 1}`;
}

/**
 * Find model by ID
 */
function findModel(registry: ModelRegistry, modelId: string): ModelEntry | undefined {
  return registry.models.find(m => m.id === modelId);
}

/**
 * Get production versions of a model
 */
function getProductionVersions(registry: ModelRegistry, modelId: string): ModelEntry[] {
  return registry.models
    .filter(m => m.id === modelId && m.status === 'production')
    .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime());
}

/**
 * Promote model from staging to production
 */
async function promoteModel(modelId: string): Promise<PromotionReport> {
  const report: PromotionReport = {
    modelId,
    previousVersion: '',
    newVersion: '',
    timestamp: new Date().toISOString(),
    success: false,
    archivedVersions: [],
    errors: [],
  };

  console.log(`🚀 Promoting model: ${modelId}`);

  // Load registry
  const registry = loadRegistry();
  
  // Find the model
  const model = findModel(registry, modelId);
  if (!model) {
    report.errors.push(`Model not found: ${modelId}`);
    return report;
  }

  if (model.status !== 'staging') {
    report.errors.push(`Model must be in 'staging' status to promote. Current status: ${model.status}`);
    return report;
  }

  // Store previous version reference
  const productionVersions = getProductionVersions(registry, modelId);
  if (productionVersions.length > 0) {
    report.previousVersion = productionVersions[0].version;
    model.previousVersion = productionVersions[0].version;
  }

  // Increment version
  report.newVersion = incrementPatch(model.version);
  model.version = report.newVersion;
  
  // Update status to production
  model.status = 'production';
  model.deployedAt = new Date().toISOString();
  
  // Update URL with new version
  const baseName = modelId.replace(/-v\d+$/, '');
  model.url = `/models/${baseName}-v${report.newVersion}.json`;

  console.log(`📦 New version: ${report.newVersion}`);
  console.log(`📍 Model URL: ${model.url}`);

  // Archive old versions (keep last N)
  const versionsToArchive = productionVersions.slice(CONFIG.VERSIONS_TO_KEEP - 1);
  for (const oldVersion of versionsToArchive) {
    oldVersion.status = 'archived';
    report.archivedVersions.push(oldVersion.version);
    console.log(`📦 Archived version: ${oldVersion.version}`);
  }

  // Save backup
  fs.mkdirSync(CONFIG.BACKUP_DIR, { recursive: true });
  const backupPath = path.join(CONFIG.BACKUP_DIR, `registry-backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(registry, null, 2));
  console.log(`💾 Registry backup saved: ${backupPath}`);

  // Save updated registry
  saveRegistry(registry);
  
  report.success = true;
  console.log(`✅ Model promoted to production successfully!`);
  
  return report;
}

/**
 * Rollback to previous version
 */
async function rollbackModel(modelId: string): Promise<PromotionReport> {
  const report: PromotionReport = {
    modelId,
    previousVersion: '',
    newVersion: '',
    timestamp: new Date().toISOString(),
    success: false,
    archivedVersions: [],
    errors: [],
  };

  console.log(`⏪ Rolling back model: ${modelId}`);

  const registry = loadRegistry();
  const model = findModel(registry, modelId);
  
  if (!model) {
    report.errors.push(`Model not found: ${modelId}`);
    return report;
  }

  if (!model.previousVersion) {
    report.errors.push('No previous version available for rollback');
    return report;
  }

  // Find previous production version
  const prevVersionEntry = registry.models.find(
    m => m.id === modelId && m.version === model.previousVersion
  );
  
  if (!prevVersionEntry) {
    report.errors.push(`Previous version ${model.previousVersion} not found`);
    return report;
  }

  // Archive current version
  model.status = 'archived';
  report.archivedVersions.push(model.version);

  // Restore previous version to production
  prevVersionEntry.status = 'production';
  prevVersionEntry.deployedAt = new Date().toISOString();
  
  report.rolledBackVersion = model.previousVersion;
  report.newVersion = prevVersionEntry.version;
  report.previousVersion = model.version;

  saveRegistry(registry);
  
  report.success = true;
  console.log(`✅ Rolled back to version: ${prevVersionEntry.version}`);
  
  return report;
}

/**
 * Save promotion report
 */
function saveReport(report: PromotionReport): void {
  const reportPath = path.join(process.cwd(), 'promotion-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📝 Promotion report saved: ${reportPath}`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const modelId = args[0];
  const isRollback = args.includes('--rollback');
  
  if (!modelId) {
    console.error('❌ Error: Model ID required');
    console.error('Usage:');
    console.error('  Promote: npx ts-node scripts/promote-model.ts <model-id>');
    console.error('  Rollback: npx ts-node scripts/promote-model.ts <model-id> --rollback');
    process.exit(1);
  }

  let report: PromotionReport;
  
  if (isRollback) {
    report = await rollbackModel(modelId);
  } else {
    report = await promoteModel(modelId);
  }

  saveReport(report);

  console.log('\n' + '='.repeat(50));
  if (report.success) {
    console.log(isRollback ? '✅ ROLLBACK SUCCESSFUL' : '✅ PROMOTION SUCCESSFUL');
    console.log('='.repeat(50));
    if (isRollback) {
      console.log(`Rolled back to: ${report.newVersion}`);
      console.log(`Archived: ${report.previousVersion}`);
    } else {
      console.log(`New version: ${report.newVersion}`);
      console.log(`Previous version: ${report.previousVersion || 'none'}`);
      if (report.archivedVersions.length > 0) {
        console.log(`Archived versions: ${report.archivedVersions.join(', ')}`);
      }
    }
    process.exit(0);
  } else {
    console.log('❌ OPERATION FAILED');
    console.log('='.repeat(50));
    report.errors.forEach(e => console.log(`  - ${e}`));
    process.exit(1);
  }
}

main();
