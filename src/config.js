const fs = require('fs');
const path = require('path');
const os = require('os');

class Config {
    constructor() {
        this.configDir = path.join(os.homedir(), '.vulnhunter');
        this.configFile = path.join(this.configDir, 'config.json');
        this.ensureConfigDir();
    }

    ensureConfigDir() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
    }

    getApiKey() {
        // Check environment variable first
        if (process.env.VULNHUNTER_API_KEY) {
            return process.env.VULNHUNTER_API_KEY;
        }

        // Then check config file
        if (fs.existsSync(this.configFile)) {
            try {
                const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                return config.apiKey;
            } catch (error) {
                console.error('Error reading config file:', error.message);
                return null;
            }
        }

        return null;
    }

    setApiKey(apiKey) {
        let config = {};
        
        if (fs.existsSync(this.configFile)) {
            try {
                config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
            } catch (error) {
                console.warn('Creating new config file...');
            }
        }

        config.apiKey = apiKey;

        try {
            fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving API key:', error.message);
            return false;
        }
    }

    getConfig() {
        if (fs.existsSync(this.configFile)) {
            try {
                return JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
            } catch (error) {
                return {};
            }
        }
        return {};
    }

    updateConfig(updates) {
        const config = this.getConfig();
        Object.assign(config, updates);
        
        try {
            fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
            return true;
        } catch (error) {
            console.error('Error updating config:', error.message);
            return false;
        }
    }
}

module.exports = Config;