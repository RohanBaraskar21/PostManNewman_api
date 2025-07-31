# Configuration Guide

This file explains how to configure the Postman automation framework for your specific needs.

## Framework Configuration

### Package.json Scripts

The `package.json` file contains several npm scripts for different purposes:

```json
{
  "scripts": {
    "test:dev": "Run tests on development environment",
    "test:qa": "Run tests on QA environment", 
    "test:staging": "Run tests on staging environment",
    "test:prod": "Run tests on production environment",
    "test:all": "Run tests on all environments sequentially",
    "validate:collections": "Validate collection structure",
    "validate:environments": "Validate environment structure",
    "clean": "Clean up old reports"
  }
}
```

### Environment Configuration

Each environment file should contain these key variables:

```json
{
  "values": [
    {
      "key": "base_url",
      "value": "https://your-api-url.com",
      "type": "default",
      "enabled": true
    },
    {
      "key": "username", 
      "value": "your-username",
      "type": "default",
      "enabled": true
    },
    {
      "key": "password",
      "value": "your-password", 
      "type": "secret",
      "enabled": true
    },
    {
      "key": "api_key",
      "value": "your-api-key",
      "type": "secret", 
      "enabled": true
    },
    {
      "key": "timeout",
      "value": "5000",
      "type": "default",
      "enabled": true
    }
  ]
}
```

## Customization Examples

### Adding a New Environment

1. Create new environment file: `environments/new-env.postman_environment.json`
2. Add npm script in `package.json`:
   ```json
   "test:new-env": "newman run collections/api-tests.postman_collection.json -e environments/new-env.postman_environment.json --reporters cli,htmlextra --reporter-htmlextra-export reports/new-env-report.html"
   ```
3. Update GitHub Actions workflow to include new environment

### Adding a New Collection

1. Export collection from Postman to `collections/`
2. Add npm script:
   ```json
   "test:new-collection": "newman run collections/new-collection.postman_collection.json -e environments/dev.postman_environment.json"
   ```

### Custom Newman Options

You can customize Newman execution with various options:

```bash
newman run collection.json -e environment.json \
  --reporters cli,htmlextra,json \
  --reporter-htmlextra-export reports/report.html \
  --reporter-json-export reports/results.json \
  --bail \                    # Stop on first failure
  --verbose \                 # Detailed output
  --timeout-request 10000 \   # Request timeout (ms)
  --delay-request 1000 \      # Delay between requests (ms)
  --iterations 3 \            # Run collection multiple times
  --folder "Specific Folder"  # Run only specific folder
```

### GitHub Actions Configuration

Customize the CI/CD pipeline in `.github/workflows/api-tests.yml`:

```yaml
# Change trigger branches
on:
  push:
    branches: [ main, develop, feature/* ]
  
# Add environment-specific secrets
env:
  API_KEY: ${{ secrets.API_KEY }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}

# Customize test execution
- name: Run Tests
  run: |
    newman run collections/api-tests.postman_collection.json \
      -e environments/qa.postman_environment.json \
      --bail \
      --timeout-request 15000
```

### Custom Validation Rules

Extend the validation scripts in `scripts/` to add your own rules:

```javascript
// In validate-collections.js
function validateCustomRules(collection, errors, warnings) {
  // Add your custom validation logic
  if (!collection.info.description) {
    warnings.push('Collection should have a description');
  }
  
  // Check for required test patterns
  const hasAuthTests = checkForPattern(collection, 'authentication');
  if (!hasAuthTests) {
    warnings.push('Consider adding authentication tests');
  }
}
```

## Best Practices Configuration

### 1. Environment Separation

```json
{
  "dev": {
    "base_url": "http://localhost:3000",
    "debug_mode": "true",
    "ssl_verify": "false"
  },
  "prod": {
    "base_url": "https://api.production.com", 
    "debug_mode": "false",
    "ssl_verify": "true"
  }
}
```

### 2. Test Data Management

Use environment-specific test data:

```javascript
// Pre-request script
const env = pm.environment.get('environment_name');
const testData = {
  dev: { userId: 'dev_user_123' },
  qa: { userId: 'qa_user_456' },
  staging: { userId: 'staging_user_789' }
};

pm.environment.set('test_user_id', testData[env].userId);
```

### 3. Security Configuration

Store sensitive data in GitHub Secrets:

```yaml
# In GitHub repository settings
secrets:
  DEV_API_KEY: "your-dev-api-key"
  QA_API_KEY: "your-qa-api-key"
  PROD_API_KEY: "your-prod-api-key"
```

Reference in workflows:
```yaml
env:
  API_KEY: ${{ secrets[format('{0}_API_KEY', github.event.inputs.environment)] }}
```

### 4. Report Configuration

Customize report generation:

```bash
# Enhanced HTML reports
newman run collection.json -e environment.json \
  --reporters htmlextra \
  --reporter-htmlextra-export reports/enhanced-report.html \
  --reporter-htmlextra-title "API Test Report" \
  --reporter-htmlextra-logs \
  --reporter-htmlextra-omitRequestBodies \
  --reporter-htmlextra-omitResponseBodies
```

## Integration Examples

### 1. Slack Notifications

Add to GitHub Actions:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: "API tests completed for ${{ matrix.environment }}"
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 2. Teams Integration

```yaml
- name: Notify Teams
  if: failure()
  uses: skitionek/notify-microsoft-teams@master
  with:
    webhook_url: ${{ secrets.TEAMS_WEBHOOK }}
    title: "API Tests Failed"
    summary: "Tests failed for ${{ matrix.environment }} environment"
```

### 3. JIRA Integration

```yaml
- name: Create JIRA Issue
  if: failure()
  uses: atlassian/gajira-create@master
  with:
    project: PROJECT_KEY
    issuetype: Bug
    summary: "API Tests Failed - ${{ matrix.environment }}"
    description: "Automated tests failed. Check reports for details."
```

## Advanced Configuration

### 1. Parallel Execution

Run multiple collections in parallel:

```yaml
strategy:
  matrix:
    collection: [api-tests, health-check, performance-tests]
    environment: [dev, qa]
```

### 2. Conditional Execution

Run certain tests only in specific conditions:

```yaml
- name: Run Production Tests
  if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
  run: npm run test:prod
```

### 3. Dynamic Environment Selection

```yaml
- name: Select Environment
  id: env
  run: |
    if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
      echo "environment=production" >> $GITHUB_OUTPUT
    elif [[ "${{ github.ref }}" == "refs/heads/develop" ]]; then
      echo "environment=staging" >> $GITHUB_OUTPUT
    else
      echo "environment=dev" >> $GITHUB_OUTPUT
    fi
```

This configuration guide should help you customize the framework to meet your specific needs. Remember to update the documentation when you make significant changes to the configuration.
