const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const COLLECTIONS_DIR = path.join(__dirname, '..', 'collections');

/**
 * Validates Postman collection structure and content
 */
function validateCollection(filePath) {
    console.log(`\n${chalk.blue('Validating collection:')} ${path.basename(filePath)}`);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const collection = JSON.parse(content);
        
        const errors = [];
        const warnings = [];
        
        // Check required fields
        if (!collection.info) {
            errors.push('Missing "info" field');
        } else {
            if (!collection.info.name) errors.push('Missing collection name');
            if (!collection.info.schema) warnings.push('Missing schema definition');
        }
        
        if (!collection.item || !Array.isArray(collection.item)) {
            errors.push('Missing or invalid "item" array');
        } else {
            // Validate items recursively
            validateItems(collection.item, '', errors, warnings);
        }
        
        // Check for test scripts
        let hasTests = false;
        if (collection.item) {
            hasTests = checkForTests(collection.item);
        }
        
        if (!hasTests) {
            warnings.push('No test scripts found in collection');
        }
        
        // Report results
        if (errors.length === 0) {
            console.log(`${chalk.green('✓')} Collection is valid`);
        } else {
            console.log(`${chalk.red('✗')} Collection has errors:`);
            errors.forEach(error => console.log(`  ${chalk.red('•')} ${error}`));
        }
        
        if (warnings.length > 0) {
            console.log(`${chalk.yellow('⚠')} Warnings:`);
            warnings.forEach(warning => console.log(`  ${chalk.yellow('•')} ${warning}`));
        }
        
        return errors.length === 0;
        
    } catch (error) {
        console.log(`${chalk.red('✗')} Failed to parse collection: ${error.message}`);
        return false;
    }
}

/**
 * Validates collection items recursively
 */
function validateItems(items, path, errors, warnings) {
    items.forEach((item, index) => {
        const itemPath = path ? `${path}[${index}]` : `item[${index}]`;
        
        if (!item.name) {
            errors.push(`${itemPath}: Missing item name`);
        }
        
        if (item.item) {
            // Folder
            validateItems(item.item, `${itemPath}.item`, errors, warnings);
        } else if (item.request) {
            // Request
            validateRequest(item.request, itemPath, errors, warnings);
        } else {
            errors.push(`${itemPath}: Item must have either "item" or "request" field`);
        }
    });
}

/**
 * Validates request structure
 */
function validateRequest(request, path, errors, warnings) {
    if (!request.method) {
        errors.push(`${path}.request: Missing HTTP method`);
    }
    
    if (!request.url) {
        errors.push(`${path}.request: Missing URL`);
    } else if (typeof request.url === 'string') {
        if (!request.url.includes('{{') && !request.url.startsWith('http')) {
            warnings.push(`${path}.request: URL should use variables or be absolute`);
        }
    } else if (request.url.raw) {
        if (!request.url.raw.includes('{{') && !request.url.raw.startsWith('http')) {
            warnings.push(`${path}.request: URL should use variables or be absolute`);
        }
    }
}

/**
 * Checks if collection has test scripts
 */
function checkForTests(items) {
    for (const item of items) {
        if (item.event) {
            const testEvent = item.event.find(e => e.listen === 'test');
            if (testEvent && testEvent.script && testEvent.script.exec) {
                return true;
            }
        }
        
        if (item.item && checkForTests(item.item)) {
            return true;
        }
    }
    return false;
}

/**
 * Main validation function
 */
function validateCollections() {
    console.log(chalk.cyan('🔍 Validating Postman Collections...\n'));
    
    if (!fs.existsSync(COLLECTIONS_DIR)) {
        console.log(chalk.red('Collections directory not found!'));
        process.exit(1);
    }
    
    const files = fs.readdirSync(COLLECTIONS_DIR)
        .filter(file => file.endsWith('.postman_collection.json'));
    
    if (files.length === 0) {
        console.log(chalk.yellow('No collection files found!'));
        process.exit(1);
    }
    
    let allValid = true;
    
    files.forEach(file => {
        const filePath = path.join(COLLECTIONS_DIR, file);
        const isValid = validateCollection(filePath);
        if (!isValid) {
            allValid = false;
        }
    });
    
    console.log('\n' + '='.repeat(50));
    
    if (allValid) {
        console.log(chalk.green('✅ All collections are valid!'));
        process.exit(0);
    } else {
        console.log(chalk.red('❌ Some collections have errors!'));
        process.exit(1);
    }
}

// Run validation if script is executed directly
if (require.main === module) {
    validateCollections();
}

module.exports = { validateCollections, validateCollection };
