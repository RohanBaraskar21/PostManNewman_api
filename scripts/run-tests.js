const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');

/**
 * Run Newman tests with custom configuration
 */
class TestRunner {
    constructor(options = {}) {
        this.options = {
            reportDir: path.join(__dirname, '..', 'reports'),
            collectionsDir: path.join(__dirname, '..', 'collections'),
            environmentsDir: path.join(__dirname, '..', 'environments'),
            ...options
        };
        
        this.ensureDirectories();
    }
    
    /**
     * Ensure required directories exist
     */
    ensureDirectories() {
        if (!fs.existsSync(this.options.reportDir)) {
            fs.mkdirSync(this.options.reportDir, { recursive: true });
        }
    }
    
    /**
     * Run tests for a specific environment
     */
    async runTests(collection, environment, options = {}) {
        const collectionPath = path.join(this.options.collectionsDir, `${collection}.postman_collection.json`);
        const environmentPath = path.join(this.options.environmentsDir, `${environment}.postman_environment.json`);
        
        // Validate files exist
        if (!fs.existsSync(collectionPath)) {
            throw new Error(`Collection not found: ${collectionPath}`);
        }
        
        if (!fs.existsSync(environmentPath)) {
            throw new Error(`Environment not found: ${environmentPath}`);
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportName = `${environment}-${collection}-${timestamp}`;
        
        const newmanArgs = [
            'run', collectionPath,
            '-e', environmentPath,
            '--reporters', 'cli,html,json',
            '--reporter-html-export', path.join(this.options.reportDir, `${reportName}.html`),
            '--reporter-json-export', path.join(this.options.reportDir, `${reportName}.json`)
        ];
        
        // Add additional options
        if (options.bail) newmanArgs.push('--bail');
        if (options.verbose) newmanArgs.push('--verbose');
        if (options.silent) newmanArgs.push('--silent');
        if (options.timeout) newmanArgs.push('--timeout-request', options.timeout);
        if (options.delay) newmanArgs.push('--delay-request', options.delay);
        if (options.iterations) newmanArgs.push('-n', options.iterations);
        
        console.log(chalk.cyan(`🚀 Running tests: ${collection} on ${environment}`));
        console.log(chalk.gray(`Command: newman ${newmanArgs.join(' ')}`));
        
        return new Promise((resolve, reject) => {
            const newman = spawn('newman', newmanArgs, {
                stdio: 'inherit',
                shell: true
            });
            
            newman.on('close', (code) => {
                if (code === 0) {
                    console.log(chalk.green(`✅ Tests completed successfully for ${environment}`));
                    resolve({
                        success: true,
                        environment,
                        collection,
                        reportPath: path.join(this.options.reportDir, `${reportName}.html`)
                    });
                } else {
                    console.log(chalk.red(`❌ Tests failed for ${environment} (exit code: ${code})`));
                    resolve({
                        success: false,
                        environment,
                        collection,
                        exitCode: code,
                        reportPath: path.join(this.options.reportDir, `${reportName}.html`)
                    });
                }
            });
            
            newman.on('error', (error) => {
                console.error(chalk.red(`Failed to start newman: ${error.message}`));
                reject(error);
            });
        });
    }
    
    /**
     * Run tests for multiple environments
     */
    async runMultipleTests(collection, environments, options = {}) {
        const results = [];
        
        for (const environment of environments) {
            try {
                const result = await this.runTests(collection, environment, options);
                results.push(result);
                
                // Add delay between environment tests if specified
                if (options.environmentDelay && environment !== environments[environments.length - 1]) {
                    console.log(chalk.yellow(`⏳ Waiting ${options.environmentDelay}ms before next environment...`));
                    await new Promise(resolve => setTimeout(resolve, options.environmentDelay));
                }
            } catch (error) {
                console.error(chalk.red(`Error running tests for ${environment}: ${error.message}`));
                results.push({
                    success: false,
                    environment,
                    collection,
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    /**
     * Generate summary report
     */
    generateSummary(results) {
        console.log('\n' + '='.repeat(60));
        console.log(chalk.cyan.bold('📊 TEST SUMMARY'));
        console.log('='.repeat(60));
        
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        console.log(`${chalk.green('✅ Successful:')} ${successful.length}`);
        console.log(`${chalk.red('❌ Failed:')} ${failed.length}`);
        console.log(`${chalk.blue('📈 Total:')} ${results.length}`);
        
        if (successful.length > 0) {
            console.log('\n' + chalk.green('Successful tests:'));
            successful.forEach(result => {
                console.log(`  ${chalk.green('✓')} ${result.environment} - ${result.collection}`);
            });
        }
        
        if (failed.length > 0) {
            console.log('\n' + chalk.red('Failed tests:'));
            failed.forEach(result => {
                console.log(`  ${chalk.red('✗')} ${result.environment} - ${result.collection}${result.exitCode ? ` (exit code: ${result.exitCode})` : ''}`);
            });
        }
        
        console.log('\n' + chalk.blue('Reports generated in:'), this.options.reportDir);
        console.log('='.repeat(60));
        
        return {
            total: results.length,
            successful: successful.length,
            failed: failed.length,
            results
        };
    }
}

/**
 * CLI interface
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(chalk.cyan('Postman Test Runner'));
        console.log('Usage: node run-tests.js <collection> <environment1,environment2,...> [options]');
        console.log('\nExamples:');
        console.log('  node run-tests.js api-tests dev');
        console.log('  node run-tests.js api-tests dev,qa,staging');
        console.log('  node run-tests.js health-check dev --bail --verbose');
        process.exit(0);
    }
    
    const collection = args[0];
    const environments = args[1] ? args[1].split(',') : ['dev'];
    
    const options = {};
    if (args.includes('--bail')) options.bail = true;
    if (args.includes('--verbose')) options.verbose = true;
    if (args.includes('--silent')) options.silent = true;
    
    const timeoutIndex = args.indexOf('--timeout');
    if (timeoutIndex !== -1 && args[timeoutIndex + 1]) {
        options.timeout = args[timeoutIndex + 1];
    }
    
    const delayIndex = args.indexOf('--delay');
    if (delayIndex !== -1 && args[delayIndex + 1]) {
        options.delay = args[delayIndex + 1];
    }
    
    const iterationsIndex = args.indexOf('--iterations');
    if (iterationsIndex !== -1 && args[iterationsIndex + 1]) {
        options.iterations = args[iterationsIndex + 1];
    }
    
    try {
        const runner = new TestRunner();
        const results = await runner.runMultipleTests(collection, environments, options);
        const summary = runner.generateSummary(results);
        
        // Exit with error code if any tests failed
        process.exit(summary.failed > 0 ? 1 : 0);
        
    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
    }
}

// Run if script is executed directly
if (require.main === module) {
    main();
}

module.exports = { TestRunner };
