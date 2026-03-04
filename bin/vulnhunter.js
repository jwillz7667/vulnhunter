#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const chalk = require('chalk');

const Config = require('../src/config');
const Scanner = require('../src/scanner');
const Formatter = require('../src/formatter');

const program = new Command();
const config = new Config();
const formatter = new Formatter();

program
    .name('vulnhunter')
    .description('CLI tool for scanning code vulnerabilities')
    .version('1.0.0');

// Scan command
program
    .command('scan')
    .argument('[target]', 'File or directory to scan')
    .option('--stdin', 'Read code from stdin')
    .option('--language <lang>', 'Programming language hint')
    .option('--format <format>', 'Output format (table, json, sarif)', 'table')
    .description('Scan file, directory, or stdin for vulnerabilities')
    .action(async (target, options) => {
        try {
            const apiKey = config.getApiKey();
            if (!apiKey) {
                console.error(chalk.red('❌ No API key found.'));
                console.log('Run:', chalk.cyan('vulnhunter auth <api-key>'), 'or', chalk.cyan('vulnhunter register <email>'));
                process.exit(2);
            }

            const scanner = new Scanner(apiKey);
            let filesToScan = [];
            let hasVulnerabilities = false;

            if (options.stdin) {
                // Read from stdin
                const stdin = await readStdin();
                if (!stdin.trim()) {
                    console.error(chalk.red('❌ No input provided'));
                    process.exit(2);
                }

                const spinner = ora('Scanning code...').start();
                try {
                    const result = await scanner.scanCode(stdin, options.language, 'stdin');
                    spinner.succeed('Scan complete');
                    
                    if (options.format === 'json') {
                        formatter.formatJson(result, 1);
                    } else if (options.format === 'sarif') {
                        formatter.formatSarif(result, 1);
                    } else {
                        formatter.formatTable(result, 1);
                    }

                    if (result.vulnerabilities && result.vulnerabilities.length > 0) {
                        hasVulnerabilities = true;
                    }
                } catch (error) {
                    spinner.fail('Scan failed');
                    console.error(chalk.red('❌ Error:'), error.message);
                    process.exit(2);
                }
            } else if (target) {
                // Scan file or directory
                if (fs.lstatSync(target).isDirectory()) {
                    filesToScan = findSupportedFiles(target);
                } else {
                    filesToScan = [target];
                }

                if (filesToScan.length === 0) {
                    console.log(chalk.yellow('⚠️  No supported files found to scan'));
                    process.exit(0);
                }

                console.log(chalk.blue(`📁 Found ${filesToScan.length} file(s) to scan\n`));

                const allVulnerabilities = [];

                for (const file of filesToScan) {
                    const spinner = ora(`Scanning ${path.basename(file)}...`).start();
                    
                    try {
                        const code = fs.readFileSync(file, 'utf8');
                        const language = options.language || scanner.detectLanguageFromFile(file);
                        
                        const result = await scanner.scanCode(code, language, file);
                        spinner.succeed(`Scanned ${path.basename(file)}`);
                        
                        if (result.vulnerabilities && result.vulnerabilities.length > 0) {
                            result.vulnerabilities.forEach(vuln => {
                                vuln.file = file; // Ensure file path is set
                                allVulnerabilities.push(vuln);
                            });
                            hasVulnerabilities = true;
                        }
                    } catch (error) {
                        spinner.fail(`Failed to scan ${path.basename(file)}`);
                        console.error(chalk.red('❌ Error scanning'), file + ':', error.message);
                    }
                }

                const combinedResults = { vulnerabilities: allVulnerabilities };

                if (options.format === 'json') {
                    formatter.formatJson(combinedResults, filesToScan.length);
                } else if (options.format === 'sarif') {
                    formatter.formatSarif(combinedResults, filesToScan.length);
                } else {
                    formatter.formatTable(combinedResults, filesToScan.length);
                }
            } else {
                console.error(chalk.red('❌ Please provide a target file/directory or use --stdin'));
                process.exit(2);
            }

            // Exit with appropriate code
            process.exit(hasVulnerabilities ? 1 : 0);

        } catch (error) {
            console.error(chalk.red('❌ Unexpected error:'), error.message);
            process.exit(2);
        }
    });

// Auth command
program
    .command('auth')
    .argument('<api-key>', 'API key to save')
    .description('Save API key for VulnHunter')
    .action((apiKey) => {
        if (config.setApiKey(apiKey)) {
            console.log(chalk.green('✓ API key saved successfully'));
        } else {
            console.error(chalk.red('❌ Failed to save API key'));
            process.exit(2);
        }
    });

// Register command  
program
    .command('register')
    .argument('<email>', 'Email address to register')
    .description('Register for a free API key')
    .action(async (email) => {
        const spinner = ora('Registering...').start();
        
        try {
            const scanner = new Scanner(); // No API key needed for registration
            const result = await scanner.registerUser(email);
            spinner.succeed('Registration complete');
            
            if (result.apiKey) {
                config.setApiKey(result.apiKey);
                console.log(chalk.green('✓ Free API key received and saved!'));
                console.log(chalk.blue('💡 You can now run:'), chalk.cyan('vulnhunter scan <file-or-dir>'));
            } else {
                console.log(chalk.yellow('⚠️  Registration successful, but no API key returned'));
                console.log('Please check your email for further instructions');
            }
        } catch (error) {
            spinner.fail('Registration failed');
            console.error(chalk.red('❌ Error:'), error.message);
            process.exit(2);
        }
    });

// Helper functions
function findSupportedFiles(dir) {
    const supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.sol', '.go', '.rb', '.java', '.php', '.rs', '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp'];
    const files = [];
    
    function walk(currentDir) {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stats = fs.lstatSync(fullPath);
            
            if (stats.isDirectory()) {
                // Skip common directories that shouldn't be scanned
                if (!['node_modules', '.git', 'dist', 'build', '__pycache__', '.next', 'target'].includes(item)) {
                    walk(fullPath);
                }
            } else if (stats.isFile()) {
                const ext = path.extname(item).toLowerCase();
                if (supportedExtensions.includes(ext)) {
                    files.push(fullPath);
                }
            }
        }
    }
    
    walk(dir);
    return files;
}

async function readStdin() {
    return new Promise((resolve, reject) => {
        let data = '';
        
        process.stdin.setEncoding('utf8');
        
        process.stdin.on('readable', () => {
            let chunk;
            while ((chunk = process.stdin.read()) !== null) {
                data += chunk;
            }
        });
        
        process.stdin.on('end', () => {
            resolve(data);
        });
        
        process.stdin.on('error', (err) => {
            reject(err);
        });
    });
}

program.parse();