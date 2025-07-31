# Postman API Automation Framework

A comprehensive framework for automating API testing using Postman collections with Newman, integrated with GitHub Actions for continuous integration across multiple environments.

## 🚀 Features

- **Multi-Environment Support**: Dev, QA, Staging, and Production environments
- **Newman Integration**: Command-line collection runner for Postman
- **GitHub Actions CI/CD**: Automated testing pipeline
- **Comprehensive Reporting**: HTML and JSON reports
- **Industry Best Practices**: Structured organization and validation
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 📁 Project Structure

```
postman-automation-framework/
├── .github/
│   └── workflows/
│       ├── api-tests.yml
│       └── manual-trigger.yml
├── collections/
│   ├── api-tests.postman_collection.json
│   └── health-check.postman_collection.json
├── environments/
│   ├── dev.postman_environment.json
│   ├── qa.postman_environment.json
│   ├── staging.postman_environment.json
│   └── prod.postman_environment.json
├── scripts/
│   ├── validate-collections.js
│   ├── validate-environments.js
│   └── run-tests.js
├── reports/
│   └── .gitkeep
├── docs/
│   ├── setup.md
│   └── troubleshooting.md
├── package.json
├── README.md
└── .gitignore
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd postman-automation-framework
```

2. Install dependencies:
```bash
npm run setup
```

## 🧪 Running Tests

### Single Environment
```bash
# Development environment
npm run test:dev

# QA environment
npm run test:qa

# Staging environment
npm run test:staging

# Production environment (use with caution)
npm run test:prod
```

### All Environments
```bash
npm run test:all
```

### Custom Newman Command
```bash
newman run collections/api-tests.postman_collection.json \
  -e environments/dev.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export reports/custom-report.html
```

## 📊 Reports

Test reports are generated in the `reports/` directory:
- HTML reports for visual analysis
- JSON reports for programmatic analysis
- Console output for immediate feedback

## 🔧 Environment Variables

Each environment file contains:
- Base URLs
- Authentication tokens
- Database connections
- Feature flags
- Environment-specific configurations

## 🚀 GitHub Actions Integration

The framework includes pre-configured GitHub Actions workflows:

1. **Automated Testing**: Runs on push/PR to main branch
2. **Manual Trigger**: On-demand testing for specific environments
3. **Scheduled Testing**: Daily health checks

## 📝 Best Practices

1. **Version Control**: Keep collections and environments in sync
2. **Environment Isolation**: Use separate credentials for each environment
3. **Test Data Management**: Use dynamic variables and cleanup procedures
4. **Security**: Store sensitive data in GitHub Secrets
5. **Monitoring**: Set up notifications for test failures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your changes
4. Run tests locally
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the [Troubleshooting Guide](docs/troubleshooting.md)
- Create an issue in the repository
- Review Newman documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
