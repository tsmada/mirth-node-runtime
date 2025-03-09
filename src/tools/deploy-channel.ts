import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { Logger } from '../utils/Logger.js';

const logger = new Logger();

/**
 * Deploy a channel to Mirth Connect
 */
async function deployChannel() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
      logger.error('Usage: npm run deploy-channel <channel-file.xml> [mirth-url] [username] [password]');
      process.exit(1);
    }
    
    const channelFile = args[0];
    const mirthUrl = args[1] || process.env.MIRTH_URL || 'https://localhost:8443';
    const username = args[2] || process.env.MIRTH_USERNAME || 'admin';
    const password = args[3] || process.env.MIRTH_PASSWORD || 'admin';
    
    logger.info(`Deploying ${channelFile} to ${mirthUrl}`);
    
    // Read the channel XML file
    const channelXml = fs.readFileSync(channelFile, 'utf-8');
    
    // Deploy the channel
    const result = await deployToMirth(mirthUrl, username, password, channelXml);
    
    logger.info(`Deployment result: ${result}`);
  } catch (error) {
    logger.error(`Error deploying channel: ${error}`);
    process.exit(1);
  }
}

/**
 * Deploy a channel to Mirth Connect
 */
async function deployToMirth(mirthUrl: string, username: string, password: string, channelXml: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Parse the URL
    const url = new URL(mirthUrl);
    const protocol = url.protocol === 'https:' ? https : http;
    
    // Create the request options
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/api/channels',
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Content-Length': Buffer.byteLength(channelXml),
        'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
      },
      rejectUnauthorized: false // Allow self-signed certificates
    };
    
    // Send the request
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP error ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    // Write the channel XML to the request
    req.write(channelXml);
    req.end();
  });
}

// Run the deployment
deployChannel(); 