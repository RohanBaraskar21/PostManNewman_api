# Troubleshooting Guide

This guide helps you resolve common issues you might encounter while using the Postman automation framework.

## Common Issues and Solutions

### 1. Newman Installation Issues

#### Issue: "newman: command not found"

**Solution:**
```bash
# Install Newman globally
npm install -g newman

# Verify installation
newman --version

# On Windows, restart your terminal/PowerShell
```

#### Issue: Permission denied during global install

**Solution:**
```bash
# Option 1: Use npx instead of global install
npx newman run collection.json -e environment.json

# Option 2: Configure npm prefix (macOS/Linux)
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Option 3: Use sudo (not recommended)
sudo npm install -g newman
```

### 2. Collection Validation Errors

#### Issue: "Missing required field" errors

**Symptoms:**
```
✗ Collection has errors:
  • Missing "info" field
  • Missing collection name
```

**Solution:**
1. Open your collection in Postman
2. Ensure all required fields are present:
   - Collection name
   - Request names
   - HTTP methods
   - URLs
3. Re-export the collection

#### Issue: Invalid JSON format

**Symptoms:**
```
✗ Failed to parse collection: Unexpected token
```

**Solution:**
```bash
# Validate JSON syntax
node -e "console.log(JSON.parse(require('fs').readFileSync('collections/your-collection.json')))"

# Use online JSON validator: https://jsonlint.com/
```

### 3. Environment Issues

#### Issue: Variables not resolving

**Symptoms:**
- URLs showing `{{base_url}}` instead of actual URL
- Authentication failures
- Tests referring to undefined variables

**Solution:**
1. Check environment file structure:
   ```json
   {
     "values": [
       {
         "key": "base_url",
         "value": "https://api.example.com",
         "enabled": true
       }
     ]
   }
   ```

2. Verify environment is loaded:
   ```bash
   newman run collection.json -e environment.json --verbose
   ```

3. Check for typos in variable names

#### Issue: Secret variables not working

**Solution:**
```json
{
  "key": "api_key",
  "value": "your-secret-value",
  "type": "secret",
  "enabled": true
}
```

### 4. Test Execution Failures

#### Issue: Tests timing out

**Symptoms:**
```
Error: timeout of 2000ms exceeded
```

**Solution:**
```bash
# Increase timeout
newman run collection.json -e environment.json --timeout-request 10000

# Or in package.json
"test:dev": "newman run ... --timeout-request 10000"
```

#### Issue: SSL/TLS certificate errors

**Symptoms:**
```
Error: unable to verify the first certificate
```

**Solution:**
```bash
# Disable SSL verification (development only)
newman run collection.json -e environment.json --insecure

# Or set in environment
{
  "key": "ssl_verify",
  "value": "false"
}
```

#### Issue: Network connectivity issues

**Solution:**
1. Check if API is accessible:
   ```bash
   curl -I https://your-api-url.com/health
   ```

2. Verify DNS resolution
3. Check firewall settings
4. Use proxy if needed:
   ```bash
   newman run collection.json -e environment.json --proxy-url http://proxy:8080
   ```

### 5. GitHub Actions Issues

#### Issue: Workflow fails with "newman not found"

**Solution:**
Update workflow to install Newman:
```yaml
- name: Install Newman
  run: |
    npm install -g newman
    npm install -g newman-reporter-htmlextra
```

#### Issue: Artifacts not uploading

**Solution:**
```yaml
- name: Upload Test Reports
  uses: actions/upload-artifact@v4
  if: always()  # This ensures upload even if tests fail
  with:
    name: test-reports
    path: reports/
    retention-days: 30
```

#### Issue: Environment secrets not working

**Solution:**
1. Add secrets in GitHub repository settings
2. Reference in workflow:
   ```yaml
   env:
     API_KEY: ${{ secrets.API_KEY }}
   ```
3. Use in pre-request script:
   ```javascript
   pm.environment.set("api_key", pm.variables.get("API_KEY"));
   ```

### 6. Report Generation Issues

#### Issue: HTML reports not generating

**Solution:**
```bash
# Install HTML reporter
npm install -g newman-reporter-htmlextra

# Specify correct reporter
newman run collection.json -e environment.json \
  --reporters htmlextra \
  --reporter-htmlextra-export report.html
```

#### Issue: Reports directory not found

**Solution:**
```bash
# Create reports directory
mkdir -p reports

# Or in scripts
const fs = require('fs');
if (!fs.existsSync('reports')) {
  fs.mkdirSync('reports', { recursive: true });
}
```

### 7. Authentication Issues

#### Issue: Token-based authentication failing

**Solution:**
1. Check token format in environment:
   ```json
   {
     "key": "auth_token",
     "value": "Bearer your-token-here"
   }
   ```

2. Use in request headers:
   ```json
   {
     "key": "Authorization",
     "value": "{{auth_token}}"
   }
   ```

3. Refresh token in pre-request script:
   ```javascript
   // Pre-request script for login
   pm.sendRequest({
     url: pm.environment.get("base_url") + "/auth/login",
     method: 'POST',
     header: { 'Content-Type': 'application/json' },
     body: {
       mode: 'raw',
       raw: JSON.stringify({
         username: pm.environment.get("username"),
         password: pm.environment.get("password")
       })
     }
   }, function (err, response) {
     if (response && response.json()) {
       pm.environment.set("auth_token", "Bearer " + response.json().token);
     }
   });
   ```

### 8. Data Management Issues

#### Issue: Test data conflicts between environments

**Solution:**
1. Use environment-specific data:
   ```javascript
   // Generate unique data per environment
   const envName = pm.environment.get("environment_name");
   const uniqueId = envName + "_" + Date.now();
   pm.environment.set("test_user_id", uniqueId);
   ```

2. Clean up test data:
   ```javascript
   // Post-request cleanup
   pm.test("Cleanup test data", function () {
     if (pm.environment.get("created_user_id")) {
       pm.sendRequest({
         url: pm.environment.get("base_url") + "/users/" + pm.environment.get("created_user_id"),
         method: 'DELETE',
         header: { 'Authorization': pm.environment.get("auth_token") }
       });
       pm.environment.unset("created_user_id");
     }
   });
   ```

### 9. Performance Issues

#### Issue: Tests running slowly

**Solution:**
1. Optimize requests:
   ```bash
   # Run in parallel (where possible)
   newman run collection.json -e environment.json --parallel
   
   # Reduce iterations
   newman run collection.json -e environment.json -n 1
   ```

2. Use health checks instead of full test suites for monitoring

3. Optimize test data size

### 10. Debugging Tips

#### Enable verbose logging

```bash
newman run collection.json -e environment.json --verbose
```

#### Check individual requests

```bash
# Run single request
newman run collection.json -e environment.json --folder "Health Check"
```

#### Debug environment variables

```javascript
// Add to pre-request script
console.log("Base URL:", pm.environment.get("base_url"));
console.log("Auth Token:", pm.environment.get("auth_token"));
```

#### Validate response data

```javascript
// Enhanced test validation
pm.test("Response validation", function () {
    const response = pm.response.json();
    console.log("Response data:", JSON.stringify(response, null, 2));
    
    pm.expect(response).to.be.an('object');
    pm.expect(response).to.have.property('status');
});
```

## Getting Additional Help

### 1. Enable Debug Mode

Add to your environment:
```json
{
  "key": "debug_mode",
  "value": "true"
}
```

### 2. Check Logs

- **Newman CLI**: Use `--verbose` flag
- **GitHub Actions**: Check workflow logs
- **Local runs**: Check console output

### 3. Validate Configurations

```bash
# Validate collections
npm run validate:collections

# Validate environments
npm run validate:environments
```

### 4. Community Resources

- [Postman Community](https://community.postman.com/)
- [Newman GitHub Issues](https://github.com/postmanlabs/newman/issues)
- [Stack Overflow - Postman tag](https://stackoverflow.com/questions/tagged/postman)

### 5. Contact Support

If you continue to experience issues:

1. Check existing GitHub issues in this repository
2. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Collection/environment files (sanitized)

### 6. Quick Diagnostic Commands

```bash
# Check Newman version
newman --version

# Validate collection syntax
node -e "console.log('Valid JSON')" < collections/api-tests.postman_collection.json

# Test environment loading
newman run collections/health-check.postman_collection.json -e environments/dev.postman_environment.json --bail

# Check reports directory
ls -la reports/

# Verify Node/npm versions
node --version && npm --version
```

Remember to sanitize any sensitive information (passwords, API keys, etc.) before sharing error messages or configuration files for troubleshooting.
