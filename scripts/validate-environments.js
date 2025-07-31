const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const ENVIRONMENTS_DIR = path.join(__dirname, '..', 'environments');

/**
 * Validates Postman environment structure and content
 */
function validateEnvironment(filePath) {
    console.log(`\n${chalk.blue('Validating environment:')} ${path.basename(filePath)}`);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const environment = JSON.parse(content);
        
        const errors = [];
        const warnings = [];
        
        // Check required fields
        if (!environment.name) {
            errors.push('Missing environment name');
        }
        
        if (!environment.values || !Array.isArray(environment.values)) {
            errors.push('Missing or invalid "values" array');
        } else {
            validateVariables(environment.values, errors, warnings);
        }
        
        // Check for required variables
        const requiredVars = ['base_url'];
        const variables = environment.values || [];
        const varNames = variables.map(v => v.key);
        
        requiredVars.forEach(reqVar => {
            if (!varNames.includes(reqVar)) {
                errors.push(`Missing required variable: ${reqVar}`);
            }
        });
        
        // Check for common variables
        const commonVars = ['username', 'password', 'api_key', 'timeout'];
        commonVars.forEach(commonVar => {
            if (!varNames.includes(commonVar)) {
                warnings.push(`Consider adding common variable: ${commonVar}`);
            }
        });
        
        // Report results
        if (errors.length === 0) {
            console.log(`${chalk.green('✓')} Environment is valid`);
        } else {
            console.log(`${chalk.red('✗')} Environment has errors:`);
            errors.forEach(error => console.log(`  ${chalk.red('•')} ${error}`));
        }
        
        if (warnings.length > 0) {
            console.log(`${chalk.yellow('⚠')} Warnings:`);
            warnings.forEach(warning => console.log(`  ${chalk.yellow('•')} ${warning}`));
        }
        
        return errors.length === 0;
        
    } catch (error) {
        console.log(`${chalk.red('✗')} Failed to parse environment: ${error.message}`);
        return false;
    }
}

/**
 * Validates environment variables
 */
function validateVariables(variables, errors, warnings) {
    const variableNames = new Set();
    
    variables.forEach((variable, index) => {
        const varPath = `values[${index}]`;
        
        // Check required fields
        if (!variable.key) {
            errors.push(`${varPath}: Missing variable key`);
        } else {
            // Check for duplicates
            if (variableNames.has(variable.key)) {
                errors.push(`${varPath}: Duplicate variable key "${variable.key}"`);
            }
            variableNames.add(variable.key);
        }
        
        if (variable.value === undefined || variable.value === null) {
            warnings.push(`${varPath} (${variable.key}): Variable has no value`);
        }
        
        // Check variable naming convention
        if (variable.key && !variable.key.match(/^[a-z_][a-z0-9_]*$/)) {
            warnings.push(`${varPath} (${variable.key}): Consider using snake_case naming`);
        }
        
        // Check for sensitive data
        const sensitiveKeys = ['password', 'token', 'key', 'secret', 'api_key'];
        if (variable.key && sensitiveKeys.some(sensitive => 
            variable.key.toLowerCase().includes(sensitive))) {
            if (variable.type !== 'secret') {
                warnings.push(`${varPath} (${variable.key}): Consider marking as secret type`);
            }
        }
        
        // Check URL format
        if (variable.key === 'base_url' && variable.value) {
            if (!variable.value.match(/^https?:\/\/.+/)) {
                errors.push(`${varPath} (${variable.key}): Base URL should start with http:// or https://`);
            }
        }
        
        // Check timeout format
        if (variable.key === 'timeout' && variable.value) {
            if (!variable.value.match(/^\d+$/)) {
                errors.push(`${varPath} (${variable.key}): Timeout should be a number`);
            }
        }
    });
}

/**
 * Compares environments for consistency
 */
function compareEnvironments(environments) {
    console.log(chalk.cyan('\n🔄 Comparing environments for consistency...\n'));
    
    if (environments.length < 2) {
        console.log(chalk.yellow('Not enough environments to compare'));
        return;
    }
    
    // Get all variable keys from all environments
    const allKeys = new Set();
    const envKeys = {};
    
    environments.forEach(env => {
        const keys = env.values.map(v => v.key);
        envKeys[env.name] = new Set(keys);
        keys.forEach(key => allKeys.add(key));
    });
    
    // Check for missing variables
    console.log(chalk.blue('Variable consistency check:'));
    allKeys.forEach(key => {
        const missingIn = [];
        Object.entries(envKeys).forEach(([envName, keys]) => {
            if (!keys.has(key)) {
                missingIn.push(envName);
            }
        });
        
        if (missingIn.length > 0) {
            console.log(`${chalk.yellow('⚠')} Variable "${key}" missing in: ${missingIn.join(', ')}`);
        }
    });
}

/**
 * Main validation function
 */
function validateEnvironments() {
    console.log(chalk.cyan('🔍 Validating Postman Environments...\n'));
    
    if (!fs.existsSync(ENVIRONMENTS_DIR)) {
        console.log(chalk.red('Environments directory not found!'));
        process.exit(1);
    }
    
    const files = fs.readdirSync(ENVIRONMENTS_DIR)
        .filter(file => file.endsWith('.postman_environment.json'));
    
    if (files.length === 0) {
        console.log(chalk.yellow('No environment files found!'));
        process.exit(1);
    }
    
    let allValid = true;
    const environments = [];
    
    files.forEach(file => {
        const filePath = path.join(ENVIRONMENTS_DIR, file);
        const isValid = validateEnvironment(filePath);
        if (!isValid) {
            allValid = false;
        }
        
        // Load environment for comparison
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const environment = JSON.parse(content);
            environments.push(environment);
        } catch (error) {
            // Error already reported in validateEnvironment
        }
    });
    
    // Compare environments
    if (environments.length > 1) {
        compareEnvironments(environments);
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (allValid) {
        console.log(chalk.green('✅ All environments are valid!'));
        process.exit(0);
    } else {
        console.log(chalk.red('❌ Some environments have errors!'));
        process.exit(1);
    }
}

// Run validation if script is executed directly
if (require.main === module) {
    validateEnvironments();
}

module.exports = { validateEnvironments, validateEnvironment };
