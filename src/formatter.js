const chalk = require('chalk');

class Formatter {
    constructor() {
        this.severityColors = {
            'Critical': chalk.red.bold,
            'High': chalk.red,
            'Medium': chalk.yellow,
            'Low': chalk.blue,
            'Info': chalk.gray
        };
    }

    formatTable(results, filesScanned = 0) {
        if (!results || !results.vulnerabilities || results.vulnerabilities.length === 0) {
            console.log(chalk.green('✓ No vulnerabilities found!'));
            this.printSummary({}, filesScanned);
            return;
        }

        console.log(chalk.bold('\n📋 Vulnerability Report\n'));
        
        results.vulnerabilities.forEach((vuln, index) => {
            const severityColor = this.severityColors[vuln.severity] || chalk.white;
            
            console.log(`${index + 1}. ${severityColor(vuln.severity.toUpperCase())} - ${vuln.title}`);
            
            if (vuln.cwe) {
                console.log(`   ${chalk.dim('CWE:')} ${vuln.cwe}`);
            }
            
            if (vuln.file && (vuln.line || vuln.location)) {
                const line = vuln.line || vuln.location?.replace(/\D/g, '') || '';
                console.log(`   ${chalk.dim('Location:')} ${vuln.file}${line ? ':' + line : ''}`);
            } else if (vuln.location) {
                console.log(`   ${chalk.dim('Location:')} ${vuln.location}`);
            } else if (vuln.file) {
                console.log(`   ${chalk.dim('File:')} ${vuln.file}`);
            }
            
            if (vuln.explanation || vuln.description) {
                console.log(`   ${chalk.dim('Issue:')} ${vuln.explanation || vuln.description}`);
            }
            
            if (vuln.fix || vuln.recommendation) {
                console.log(`   ${chalk.dim('Fix:')} ${vuln.fix || vuln.recommendation}`);
            }
            
            console.log(''); // Empty line between vulnerabilities
        });

        this.printSummary(results, filesScanned);
    }

    formatJson(results, filesScanned = 0) {
        const output = {
            summary: this.getSummaryData(results, filesScanned),
            vulnerabilities: results?.vulnerabilities || []
        };
        console.log(JSON.stringify(output, null, 2));
    }

    formatSarif(results, filesScanned = 0) {
        const sarif = {
            version: "2.1.0",
            $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
            runs: [{
                tool: {
                    driver: {
                        name: "VulnHunter",
                        version: "1.0.0",
                        informationUri: "https://vulnhunter.kingclaw.tech"
                    }
                },
                results: []
            }]
        };

        if (results && results.vulnerabilities) {
            results.vulnerabilities.forEach(vuln => {
                const result = {
                    ruleId: vuln.cwe || 'unknown',
                    message: {
                        text: vuln.explanation || vuln.description || vuln.title
                    },
                    level: this.mapSeverityToSarifLevel(vuln.severity)
                };

                if (vuln.file) {
                    result.locations = [{
                        physicalLocation: {
                            artifactLocation: {
                                uri: vuln.file
                            }
                        }
                    }];

                    if (vuln.line) {
                        result.locations[0].physicalLocation.region = {
                            startLine: parseInt(vuln.line, 10)
                        };
                    }
                }

                sarif.runs[0].results.push(result);
            });
        }

        console.log(JSON.stringify(sarif, null, 2));
    }

    mapSeverityToSarifLevel(severity) {
        const mapping = {
            'Critical': 'error',
            'High': 'error',
            'Medium': 'warning',
            'Low': 'note',
            'Info': 'note'
        };
        return mapping[severity] || 'warning';
    }

    getSummaryData(results, filesScanned) {
        const summary = {
            filesScanned,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0,
            total: 0,
            riskScore: 0
        };

        if (results && results.vulnerabilities) {
            results.vulnerabilities.forEach(vuln => {
                const severity = vuln.severity?.toLowerCase();
                if (severity === 'critical') summary.critical++;
                else if (severity === 'high') summary.high++;
                else if (severity === 'medium') summary.medium++;
                else if (severity === 'low') summary.low++;
                else if (severity === 'info') summary.info++;
            });
        }

        summary.total = summary.critical + summary.high + summary.medium + summary.low + summary.info;
        
        // Calculate risk score (0-10 scale)
        summary.riskScore = Math.min(
            (summary.critical * 4 + summary.high * 2 + summary.medium * 1 + summary.low * 0.5) / 2,
            10
        );

        return summary;
    }

    printSummary(results, filesScanned) {
        const summary = this.getSummaryData(results, filesScanned);
        
        const boxWidth = 38;
        const topBorder = '╔' + '═'.repeat(boxWidth) + '╗';
        const midBorder = '╠' + '═'.repeat(boxWidth) + '╣';
        const bottomBorder = '╚' + '═'.repeat(boxWidth) + '╝';
        
        console.log('\n' + chalk.cyan(topBorder));
        console.log(chalk.cyan('║') + chalk.bold(' VulnHunter Scan Results').padEnd(boxWidth) + chalk.cyan('║'));
        console.log(chalk.cyan(midBorder));
        
        console.log(chalk.cyan('║') + ` Files scanned: ${summary.filesScanned}`.padEnd(boxWidth) + chalk.cyan('║'));
        
        const criticalText = this.severityColors.Critical(`Critical: ${summary.critical}`);
        const highText = this.severityColors.High(`High: ${summary.high}`);
        const mediumText = this.severityColors.Medium(`Medium: ${summary.medium}`);
        
        // Note: We need to account for ANSI escape codes in padding
        const line1 = `${criticalText}  ${highText}  ${mediumText}`;
        const line1Plain = ` Critical: ${summary.critical}  High: ${summary.high}  Medium: ${summary.medium}`;
        console.log(chalk.cyan('║') + line1 + ' '.repeat(boxWidth - line1Plain.length) + chalk.cyan('║'));
        
        const lowText = this.severityColors.Low(`Low: ${summary.low}`);
        const infoText = this.severityColors.Info(`Info: ${summary.info}`);
        const line2 = `${lowText}       ${infoText}`;
        const line2Plain = ` Low: ${summary.low}       Info: ${summary.info}`;
        console.log(chalk.cyan('║') + line2 + ' '.repeat(boxWidth - line2Plain.length) + chalk.cyan('║'));
        
        const riskText = ` Risk Score: ${summary.riskScore.toFixed(1)}/10`;
        console.log(chalk.cyan('║') + riskText.padEnd(boxWidth) + chalk.cyan('║'));
        
        console.log(chalk.cyan(bottomBorder) + '\n');
    }
}

module.exports = Formatter;