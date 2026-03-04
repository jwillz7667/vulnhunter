# VulnHunter CLI — npm Package Spec

Build an npm CLI tool called `vulnhunter` that scans code for security vulnerabilities using our API.

## Installation
```
npm install -g vulnhunter
```

## Usage
```bash
# Scan a single file
vulnhunter scan src/app.js

# Scan a directory (recursively finds .js, .ts, .py, .sol, .go, .rb, .java, .php, .rs, .c, .cpp files)
vulnhunter scan ./src

# Scan with specific language hint
vulnhunter scan contract.sol --language Solidity

# Pipe code in
cat myfile.py | vulnhunter scan --stdin --language Python

# Set API key
vulnhunter auth <api-key>
# Stores in ~/.vulnhunter/config.json

# Get a free API key
vulnhunter register your@email.com

# Output formats
vulnhunter scan ./src --format json      # machine-readable
vulnhunter scan ./src --format table     # default, human-readable table
vulnhunter scan ./src --format sarif     # SARIF for GitHub integration
```

## API Endpoint
- Base URL: https://vulnhunter.kingclaw.tech/api (Vercel rewrites to our VPS)
- Fallback: http://134.199.142.165:8300/api
- POST /api/scan — body: { code, language, filename }
- POST /api/register — body: { email }
- Header: X-API-Key

## Output
For each vulnerability found, show:
- Severity (color-coded: red=Critical, orange=High, yellow=Medium, blue=Low)
- Title
- CWE ID
- Location (file + line if available)
- Brief explanation
- Fix recommendation

## Summary at end:
```
╔══════════════════════════════════════╗
║  VulnHunter Scan Results            ║
╠══════════════════════════════════════╣
║  Files scanned: 12                  ║
║  Critical: 0  High: 2  Medium: 3   ║
║  Low: 1       Info: 0              ║
║  Risk Score: 7.5/10                ║
╚══════════════════════════════════════╝
```

## Exit codes
- 0: No vulnerabilities found
- 1: Vulnerabilities found (for CI/CD gating)
- 2: Error

## Tech
- Node.js, no heavy dependencies
- Use commander for CLI args
- Use chalk for colors
- Use ora for spinners
- Package name on npm: vulnhunter (check availability, fallback: @kingclaw/vulnhunter)

## package.json
- name: vulnhunter
- bin: { "vulnhunter": "./bin/vulnhunter.js" }
- Include a good README.md with install instructions, examples, badges

## IMPORTANT
- Do NOT hardcode any API keys
- Config stored at ~/.vulnhunter/config.json
- Support VULNHUNTER_API_KEY env var as override
