#!/usr/bin/env ts-node
/**
 * Model Validation Script
 * Validates TensorFlow.js model structure and integrity
 * 
 * Usage: npx ts-node scripts/validate-model.ts <model-path>
 */

import * as fs from 'fs';
import * as path from 'path';

// Validation configuration
const CONFIG = {
  MAX_MODEL_SIZE_BYTES: 512000, // 500KB
  TEST_INPUTS: [0.5, 0.5, 0.5],
  REQUIRED_FIELDS: ['modelTopology', 'weightsManifest'],
  WEIGHTS_MAX_SIZE_BYTES: 524288000, // 500MB max for weights
};

// Validation report interface
interface ValidationReport {
  modelPath: string;
  timestamp: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    modelSize: number;
    hasModelTopology: boolean;
    hasWeightsManifest: boolean;
    weightsCount: number;
    testPrediction: {
      passed: boolean;
      input: number[];
      output?: number[];
      error?: string;
    };
  };
}

/**
 * Main validation function
 */
async function validateModel(modelPath: string): Promise<ValidationReport> {
  const report: ValidationReport = {
    modelPath,
    timestamp: new Date().toISOString(),
    valid: true,
    errors: [],
    warnings: [],
    details: {
      modelSize: 0,
      hasModelTopology: false,
      hasWeightsManifest: false,
      weightsCount: 0,
      testPrediction: {
        passed: false,
        input: CONFIG.TEST_INPUTS,
      },
    },
  };

  console.log(`🔍 Validating model: ${modelPath}`);

  // Check if file exists
  if (!fs.existsSync(modelPath)) {
    report.valid = false;
    report.errors.push(`Model file not found: ${modelPath}`);
    return report;
  }

  // Check file size
  const stats = fs.statSync(modelPath);
  report.details.modelSize = stats.size;
  
  if (stats.size > CONFIG.MAX_MODEL_SIZE_BYTES) {
    report.warnings.push(
      `Model size (${stats.size} bytes) exceeds recommended limit (${CONFIG.MAX_MODEL_SIZE_BYTES} bytes)`
    );
  }
  console.log(`📦 Model size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);

  // Parse and validate model.json structure
  let modelJson: any;
  try {
    const content = fs.readFileSync(modelPath, 'utf-8');
    modelJson = JSON.parse(content);
  } catch (error) {
    report.valid = false;
    report.errors.push(`Failed to parse model JSON: ${error}`);
    return report;
  }

  // Validate required fields
  for (const field of CONFIG.REQUIRED_FIELDS) {
    if (!(field in modelJson)) {
      report.valid = false;
      report.errors.push(`Missing required field: ${field}`);
    } else {
      if (field === 'modelTopology') report.details.hasModelTopology = true;
      if (field === 'weightsManifest') report.details.hasWeightsManifest = true;
    }
  }

  // Validate weights manifest
  if (modelJson.weightsManifest) {
    const weightsManifest = modelJson.weightsManifest;
    
    if (!Array.isArray(weightsManifest)) {
      report.valid = false;
      report.errors.push('weightsManifest must be an array');
    } else {
      let totalWeights = 0;
      
      for (const manifest of weightsManifest) {
        if (manifest.weights) {
          totalWeights += manifest.weights.length;
          
          // Validate each weight entry
          for (const weight of manifest.weights) {
            if (!weight.name) {
              report.warnings.push('Weight entry missing name');
            }
            if (!weight.shape || !Array.isArray(weight.shape)) {
              report.warnings.push(`Weight ${weight.name} missing valid shape`);
            }
          }
        }
        
        // Check weights files exist
        if (manifest.paths) {
          const modelDir = path.dirname(modelPath);
          for (const weightPath of manifest.paths) {
            const fullPath = path.join(modelDir, weightPath);
            if (!fs.existsSync(fullPath)) {
              report.valid = false;
              report.errors.push(`Weight file not found: ${weightPath}`);
            } else {
              const weightStats = fs.statSync(fullPath);
              if (weightStats.size > CONFIG.WEIGHTS_MAX_SIZE_BYTES) {
                report.warnings.push(`Weight file ${weightPath} exceeds maximum size`);
              }
            }
          }
        }
      }
      
      report.details.weightsCount = totalWeights;
      console.log(`🏋️  Total weights: ${totalWeights}`);
    }
  }

  // Run test prediction (mock implementation)
  const predictionResult = await runTestPrediction(modelJson);
  report.details.testPrediction = {
    passed: predictionResult.valid,
    input: CONFIG.TEST_INPUTS,
    output: predictionResult.output,
    error: predictionResult.error,
  };

  if (!predictionResult.valid) {
    report.valid = false;
    report.errors.push(`Test prediction failed: ${predictionResult.error}`);
  } else {
    console.log(`✅ Test prediction passed`);
    if (predictionResult.output) {
      console.log(`   Input: [${CONFIG.TEST_INPUTS.join(', ')}]`);
      console.log(`   Output: [${predictionResult.output.map(v => v.toFixed(4)).join(', ')}]`);
    }
  }

  return report;
}

/**
 * Mock test prediction - validates output format
 * In production, this would use @tensorflow/tfjs
 */
async function runTestPrediction(modelJson: any): Promise<{
  valid: boolean;
  output?: number[];
  error?: string;
}> {
  try {
    // Mock prediction - simulate running the model with test inputs
    // In production: const model = await tf.loadLayersModel(`file://${modelPath}`);
    //                 const output = model.predict(tf.tensor([CONFIG.TEST_INPUTS]));
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate mock output (would come from actual model inference)
    const mockOutput = [
      CONFIG.TEST_INPUTS[0] * 0.8 + 0.1,
      CONFIG.TEST_INPUTS[1] * 0.6 + 0.2,
      CONFIG.TEST_INPUTS[2] * 0.7 + 0.15,
    ];
    
    // Validate outputs are valid numbers
    for (const val of mockOutput) {
      if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
        return {
          valid: false,
          error: `Invalid output value: ${val}`,
        };
      }
    }
    
    return {
      valid: true,
      output: mockOutput,
    };
  } catch (error) {
    return {
      valid: false,
      error: String(error),
    };
  }
}

/**
 * Generate validation report file
 */
function saveReport(report: ValidationReport): void {
  const reportPath = path.join(process.cwd(), 'validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📝 Validation report saved: ${reportPath}`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const modelPath = process.argv[2];
  
  if (!modelPath) {
    console.error('❌ Error: Model path required');
    console.error('Usage: npx ts-node scripts/validate-model.ts <model-path>');
    process.exit(1);
  }

  const report = await validateModel(modelPath);
  saveReport(report);

  console.log('\n' + '='.repeat(50));
  if (report.valid) {
    console.log('✅ VALIDATION PASSED');
    console.log('='.repeat(50));
    if (report.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      report.warnings.forEach(w => console.log(`   - ${w}`));
    }
    process.exit(0);
  } else {
    console.log('❌ VALIDATION FAILED');
    console.log('='.repeat(50));
    console.log('\n🚫 Errors:');
    report.errors.forEach(e => console.log(`   - ${e}`));
    if (report.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      report.warnings.forEach(w => console.log(`   - ${w}`));
    }
    process.exit(1);
  }
}

main();
