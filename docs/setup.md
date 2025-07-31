# Setup Guide

This guide will help you set up the Postman automation framework on your local machine and configure it for your specific needs.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (v7 or higher) - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)

## Local Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd postman-automation-framework
```

### 2. Install Dependencies

```bash
# Install all dependencies and global packages
npm run setup

# Or install manually
npm install
npm install -g newman
npm install -g newman-reporter-htmlextra
```

### 3. Verify Installation

```bash
# Check Newman installation
newman --version

# Validate collections and environments
npm run validate:collections
npm run validate:environments
```

## Configuration

### 1. Update Environment Variables

Edit the environment files in the `environments/` directory:

- `dev.postman_environment.json` - Development environment
- `qa.postman_environment.json` - QA environment
- `staging.postman_environment.json` - Staging environment
- `prod.postman_environment.json` - Production environment

Update the following variables for each environment:

```json
{
  "key": "base_url",
  "value": "https://your-api-url.com",
  "type": "default",
  "enabled": true
}
```

### 2. Update Collections

Modify the collections in the `collections/` directory:

- `api-tests.postman_collection.json` - Main API test collection
- `health-check.postman_collection.json` - Health check collection

### 3. Configure GitHub Actions (Optional)

If using GitHub Actions, update the workflow files in `.github/workflows/`:

1. **Set up GitHub Secrets** (if needed):
   - Go to your repository settings
   - Navigate to Secrets and variables > Actions
   - Add secrets for sensitive data like API keys

2. **Update workflow triggers** in `api-tests.yml`:
   ```yaml
   on:
     push:
       branches: [ main, develop ]  # Update branch names
     pull_request:
       branches: [ main ]
   ```

## Running Tests Locally

### Quick Start

```bash
# Run tests on development environment
npm run test:dev

# Run tests on QA environment

npm run test:qa
# Run tests on staging environment
npm run test:staging
```

### Advanced Usage

```bash
# Run specific collection with custom options
newman run collections/api-tests.postman_collection.json \
  -e environments/dev.postman_environment.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export reports/custom-report.html \
  --bail \
  --verbose

# Using the custom test runner
node scripts/run-tests.js api-tests dev --bail --verbose
node scripts/run-tests.js health-check dev,qa,staging
```

## Project Structure Customization

### Adding New Collections

1. Export your collection from Postman
2. Save it in the `collections/` directory
3. Add npm scripts in `package.json`:
   ```json
   "test:new-collection": "newman run collections/new-collection.postman_collection.json -e environments/dev.postman_environment.json"
   ```

### Adding New Environments

1. Export your environment from Postman
2. Save it in the `environments/` directory
3. Update GitHub Actions workflows to include the new environment
4. Add validation rules in `scripts/validate-environments.js` if needed

### Custom Reports

The framework supports multiple report formats:

- **HTML**: Visual reports with detailed information
- **JSON**: Machine-readable reports for analysis
- **CLI**: Console output for immediate feedback

Configure custom report templates:

```bash
newman run collection.json -e environment.json \
  --reporters htmlextra \
  --reporter-htmlextra-template custom-template.hbs \
  --reporter-htmlextra-export custom-report.html
```

## Environment-Specific Configuration

### Development Environment

```json
{
  "base_url": "http://localhost:3000",
  "timeout": "5000",
  "debug_mode": "true",
  "ssl_verify": "false"
}
```

### Production Environment

```json
{
  "base_url": "https://api.production.com",
  "timeout": "2000",
  "debug_mode": "false",
  "ssl_verify": "true"
}
```

## Security Best Practices

### 1. Environment Variables

- Store sensitive data in environment variables or GitHub Secrets
- Use the `secret` type for sensitive variables in Postman environments
- Never commit credentials to version control

### 2. API Keys and Tokens

```bash
# Set environment variables locally
export API_KEY="your-secret-key"
export DATABASE_PASSWORD="your-password"

# Use in Postman pre-request scripts
pm.environment.set("api_key", pm.variables.get("API_KEY"));
```

### 3. GitHub Secrets

Add secrets in GitHub repository settings:
- `API_KEY`
- `DATABASE_PASSWORD`
- `PROD_USERNAME`
- `PROD_PASSWORD`

Reference in workflows:
```yaml
env:
  API_KEY: ${{ secrets.API_KEY }}
```

## Troubleshooting Setup

### Common Issues

1. **Newman not found**
   ```bash
   npm install -g newman
   # On Windows, you might need to restart your terminal
   ```

2. **Permission errors on npm install**
   ```bash
   # Use npm prefix to install globally without sudo
   npm config set prefix ~/.npm-global
   export PATH=~/.npm-global/bin:$PATH
   ```

3. **Collection validation fails**
   ```bash
   # Check JSON syntax
   node -e "console.log(JSON.parse(require('fs').readFileSync('path/to/collection.json')))"
   ```

4. **Environment validation fails**
   ```bash
   # Validate environment structure
   npm run validate:environments
   ```

### Getting Help

- Check the [Troubleshooting Guide](troubleshooting.md)
- Review Newman documentation: https://learning.postman.com/docs/collections/using-newman-cli/
- Create an issue in the repository

## Next Steps

1. **Customize Collections**: Update the test collections for your API
2. **Configure Environments**: Set up your specific environment variables
3. **Set up CI/CD**: Configure GitHub Actions or your preferred CI/CD platform
4. **Add Monitoring**: Set up notifications for test failures
5. **Extend Framework**: Add custom scripts and validators as needed

## Additional Resources

- [Postman Documentation](https://learning.postman.com/)
- [Newman CLI Documentation](https://learning.postman.com/docs/collections/using-newman-cli/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Newman Reporters](https://www.npmjs.com/search?q=newman%20reporter)
