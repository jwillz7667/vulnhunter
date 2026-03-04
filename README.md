# VulnHunter CLI

[![npm version](https://badge.fury.io/js/vulnhunter.svg)](https://badge.fury.io/js/vulnhunter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/kingclaw/vulnhunter-cli/workflows/Node.js%20CI/badge.svg)](https://github.com/kingclaw/vulnhunter-cli/actions)

A powerful CLI tool for scanning code vulnerabilities using the VulnHunter security analysis platform.

## 🚀 Features

- **Multi-language support**: JavaScript, TypeScript, Python, Solidity, Go, Ruby, Java, PHP, Rust, C, C++
- **Recursive scanning**: Automatically finds and scans all supported files in directories
- **Multiple output formats**: Human-readable table, JSON, and SARIF (for GitHub integration)
- **CI/CD friendly**: Exit codes for build gating
- **Color-coded results**: Easy-to-read severity indicators
- **Stdin support**: Pipe code directly for analysis
- **Free tier available**: Get started with a free API key

## 📦 Installation

```bash
# Install globally via npm
npm install -g vulnhunter

# Or use with npx (no installation required)
npx vulnhunter --help
```

## 🛠️ Quick Start

### 1. Get your API key

```bash
# Register for a free API key
vulnhunter register your@email.com

# Or if you already have a key, save it
vulnhunter auth your-api-key-here
```

### 2. Start scanning

```bash
# Scan a single file
vulnhunter scan app.js

# Scan an entire directory (recursive)
vulnhunter scan ./src

# Scan with specific language hint
vulnhunter scan contract.sol --language Solidity
```

## 📖 Usage Examples

### Basic Scanning

```bash
# Scan a JavaScript file
vulnhunter scan src/app.js

# Scan all files in a directory
vulnhunter scan ./project

# Scan with language hint for better accuracy
vulnhunter scan smart-contract.sol --language Solidity
```

### Input Methods

```bash
# Scan from file
vulnhunter scan vulnerable.py

# Pipe code via stdin
cat suspicious-code.js | vulnhunter scan --stdin

# Specify language for stdin
echo "exec($_GET['cmd']);" | vulnhunter scan --stdin --language PHP
```

### Output Formats

```bash
# Default: Human-readable table with colors
vulnhunter scan ./src

# JSON output for automation
vulnhunter scan ./src --format json

# SARIF format for GitHub integration
vulnhunter scan ./src --format sarif > results.sarif
```

## 🎯 Supported Languages

| Language   | Extensions |
|------------|------------|
| JavaScript | `.js`, `.jsx` |
| TypeScript | `.ts`, `.tsx` |
| Python     | `.py` |
| Solidity   | `.sol` |
| Go         | `.go` |
| Ruby       | `.rb` |
| Java       | `.java` |
| PHP        | `.php` |
| Rust       | `.rs` |
| C          | `.c`, `.h` |
| C++        | `.cpp`, `.cc`, `.cxx`, `.hpp` |

## 📊 Output Example

```
📋 Vulnerability Report

1. HIGH - SQL Injection Vulnerability
   CWE: CWE-89
   Location: src/database.js:42
   Issue: User input directly concatenated into SQL query
   Fix: Use parameterized queries or prepared statements

2. MEDIUM - Cross-Site Scripting (XSS)
   CWE: CWE-79
   Location: src/views.js:18
   Issue: Unescaped user input rendered in HTML
   Fix: Sanitize user input before rendering

╔══════════════════════════════════════╗
║  VulnHunter Scan Results            ║
╠══════════════════════════════════════╣
║  Files scanned: 12                  ║
║  Critical: 0  High: 1  Medium: 1   ║
║  Low: 0       Info: 0              ║
║  Risk Score: 3.0/10                ║
╚══════════════════════════════════════╝
```

## 🔧 Configuration

### API Key Storage

VulnHunter stores your API key in `~/.vulnhunter/config.json`. You can also use the environment variable:

```bash
export VULNHUNTER_API_KEY="your-api-key-here"
vulnhunter scan myfile.js
```

### CI/CD Integration

VulnHunter returns appropriate exit codes for CI/CD pipelines:

- `0`: No vulnerabilities found
- `1`: Vulnerabilities detected (build should fail)
- `2`: Error occurred

```yaml
# GitHub Actions example
- name: Security Scan
  run: |
    npm install -g vulnhunter
    vulnhunter scan ./src --format sarif > security-results.sarif
    
- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: security-results.sarif
```

## 🌐 API Endpoints

VulnHunter CLI uses the following endpoints:

- **Primary**: `https://vulnhunter.kingclaw.tech/api`
- **Fallback**: `http://134.199.142.165:8300/api`

The CLI automatically handles failover between endpoints for maximum reliability.

## 🆘 Troubleshooting

### Common Issues

**"No API key found"**
```bash
# Solution: Register or set your API key
vulnhunter register your@email.com
# or
vulnhunter auth your-existing-key
```

**"No supported files found"**
- Ensure your files have supported extensions
- Check that you're scanning the correct directory
- VulnHunter skips `node_modules`, `.git`, and other build directories

**"Scan failed" or connection errors**
- Check your internet connection
- Verify your API key is valid
- The CLI automatically retries with fallback endpoints

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔗 Links

- **Website**: [vulnhunter.kingclaw.tech](https://vulnhunter.kingclaw.tech)
- **Documentation**: [docs.vulnhunter.kingclaw.tech](https://docs.vulnhunter.kingclaw.tech)
- **Issues**: [GitHub Issues](https://github.com/kingclaw/vulnhunter-cli/issues)
- **NPM Package**: [vulnhunter](https://npmjs.com/package/vulnhunter)

---

Made with ⚡ by [KingClaw](https://kingclaw.tech)