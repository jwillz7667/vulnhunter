const axios = require('axios');

class Scanner {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrls = [
            'http://134.199.142.165:8300/api',
            'https://vulnhunter.kingclaw.tech/api'
        ];
    }

    async makeRequest(endpoint, data, method = 'POST') {
        const headers = {};
        if (this.apiKey) {
            headers['X-API-Key'] = this.apiKey;
        }
        headers['Content-Type'] = 'application/json';

        let lastError = null;
        
        for (const baseUrl of this.baseUrls) {
            try {
                const response = await axios({
                    method,
                    url: `${baseUrl}${endpoint}`,
                    headers,
                    data,
                    timeout: 30000 // 30 second timeout
                });
                
                return response.data;
            } catch (error) {
                lastError = error;
                
                // Only abort on auth errors (401/403/429) — other errors should try fallback
                if (error.response && [401, 403, 429].includes(error.response.status)) {
                    throw error;
                }
                
                // Continue to next URL for network errors
                continue;
            }
        }
        
        throw lastError;
    }

    async scanCode(code, language = null, filename = null) {
        if (!this.apiKey) {
            throw new Error('API key not found. Please run "vulnhunter auth <api-key>" or "vulnhunter register <email>" to get started.');
        }

        const data = {
            code,
            language,
            filename
        };

        try {
            const result = await this.makeRequest('/scan', data);
            return result;
        } catch (error) {
            if (error.response) {
                if (error.response.status === 401) {
                    throw new Error('Invalid API key. Please check your key or register for a new one.');
                } else if (error.response.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                } else if (error.response.data && error.response.data.error) {
                    throw new Error(error.response.data.error);
                }
            }
            
            throw new Error(`Scan failed: ${error.message}`);
        }
    }

    async registerUser(email) {
        try {
            const result = await this.makeRequest('/register', { email });
            return result;
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                throw new Error(error.response.data.error);
            }
            throw new Error(`Registration failed: ${error.message}`);
        }
    }

    detectLanguageFromFile(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        
        const languageMap = {
            'js': 'JavaScript',
            'jsx': 'JavaScript',
            'ts': 'TypeScript',
            'tsx': 'TypeScript',
            'py': 'Python',
            'sol': 'Solidity',
            'go': 'Go',
            'rb': 'Ruby',
            'java': 'Java',
            'php': 'PHP',
            'rs': 'Rust',
            'c': 'C',
            'cpp': 'C++',
            'cc': 'C++',
            'cxx': 'C++',
            'h': 'C',
            'hpp': 'C++'
        };

        return languageMap[ext] || null;
    }
}

module.exports = Scanner;