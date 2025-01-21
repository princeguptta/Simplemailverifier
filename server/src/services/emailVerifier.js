// src/services/emailVerifier.js
const dns = require('dns').promises;
const net = require('net');
const NodeCache = require('node-cache');

class EmailVerifier {
    constructor() {
        this.cache = new NodeCache({ stdTTL: 86400 }); // 24 hour cache
        this.ipAddresses = [
            process.env.IP_ADDRESS_1,
            process.env.IP_ADDRESS_2,
            process.env.IP_ADDRESS_3
        ].filter(Boolean); // Remove any undefined IPs
        this.currentIpIndex = 0;
    }

    async verifyEmail(email) {
        // Check cache first
        const cached = this.cache.get(email);
        if (cached) return cached;

        const result = {
            email,
            valid: false,
            checks: {
                syntax: false,
                mx: false,
                smtp: false
            },
            details: {}
        };

        // Step 1: Syntax Check
        result.checks.syntax = this.validateSyntax(email);
        if (!result.checks.syntax) {
            return this.finalizeResult(result);
        }

        const domain = email.split('@')[1];

        try {
            // Step 2: MX Record Check
            const mxRecords = await dns.resolveMx(domain);
            result.checks.mx = mxRecords.length > 0;
            result.details.mx_records = mxRecords;

            if (result.checks.mx) {
                // Step 3: SMTP Verification
                const smtpResult = await this.verifySmtp(email, mxRecords[0].exchange);
                result.checks.smtp = smtpResult.valid;
                result.details.smtp = smtpResult.details;
            }
        } catch (error) {
            result.details.error = error.message;
        }

        return this.finalizeResult(result);
    }

    validateSyntax(email) {
        const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return regex.test(email);
    }

    async verifySmtp(email, mxServer) {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            let response = '';
            
            // Get the current IP for SMTP commands
            const sourceIP = this.ipAddresses[this.currentIpIndex];
            this.currentIpIndex = (this.currentIpIndex + 1) % this.ipAddresses.length;

            const commands = [
                `HELO ${sourceIP}\r\n`,
                `MAIL FROM:<verify@${sourceIP}>\r\n`,
                `RCPT TO:<${email}>\r\n`,
                'QUIT\r\n'
            ];
            let currentCommand = 0;

            // Set up socket timeout
            socket.setTimeout(10000); // 10 second timeout

            // Connect to the SMTP server
            socket.connect(25, mxServer);

            socket.on('connect', () => {
                // Start sending commands after connection
                socket.write(commands[currentCommand]);
                currentCommand++;
            });

            socket.on('data', (data) => {
                response += data.toString();
                // Check if we received a positive response (starts with 2xx or 3xx)
                if (/^[23]\d{2}/.test(data.toString()) && currentCommand < commands.length) {
                    socket.write(commands[currentCommand]);
                    currentCommand++;
                }
            });

            socket.on('error', (err) => {
                console.error('SMTP Error:', err);
                socket.destroy();
                resolve({ 
                    valid: false, 
                    details: `Connection failed: ${err.message}` 
                });
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve({ 
                    valid: false, 
                    details: 'Connection timeout' 
                });
            });

            socket.on('close', () => {
                // Analyze SMTP response
                const isValid = !response.includes('550') && // User unknown
                              !response.includes('501') && // Syntax error
                              !response.includes('503') && // Bad sequence
                              response.includes('250');    // Success response
                
                resolve({ 
                    valid: isValid, 
                    details: response 
                });
            });
        });
    }

    finalizeResult(result) {
        // Set overall validity based on all checks
        result.valid = Object.values(result.checks).every(v => v);
        
        // Add timestamp
        result.timestamp = new Date().toISOString();
        
        // Cache the result
        this.cache.set(result.email, result);
        
        return result;
    }
}

// Export the class
module.exports = EmailVerifier;