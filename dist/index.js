import { ChannelManager } from './core/ChannelManager.js';
import { Logger } from './utils/Logger.js';
import * as path from 'path';
import * as fs from 'fs';
const logger = new Logger();
const channelManager = new ChannelManager();
/**
 * Start the application
 */
async function start() {
    try {
        logger.info('Starting Mirth Node.js Runtime');
        // Load channels from the channels directory
        const channelsDir = path.join(process.cwd(), 'channels');
        if (fs.existsSync(channelsDir)) {
            const files = fs.readdirSync(channelsDir);
            for (const file of files) {
                if (file.endsWith('.xml')) {
                    const filePath = path.join(channelsDir, file);
                    logger.info(`Loading channel from ${filePath}`);
                    const channel = channelManager.loadChannelFromFile(filePath);
                    if (channel.enabled) {
                        logger.info(`Deploying channel: ${channel.name}`);
                        await channelManager.deployChannel(channel.id);
                    }
                }
            }
        }
        else {
            logger.info('Channels directory not found, creating it');
            fs.mkdirSync(channelsDir);
        }
        // Load test-channel.xml if it exists
        const testChannelPath = path.join(process.cwd(), 'test-channel.xml');
        if (fs.existsSync(testChannelPath)) {
            logger.info('Loading test channel');
            const channel = channelManager.loadChannelFromFile(testChannelPath);
            if (channel.enabled) {
                logger.info(`Deploying test channel: ${channel.name}`);
                await channelManager.deployChannel(channel.id);
            }
        }
        logger.info('Mirth Node.js Runtime started');
        // Handle shutdown
        process.on('SIGINT', async () => {
            logger.info('Shutting down...');
            await channelManager.stopAllServers();
            process.exit(0);
        });
    }
    catch (error) {
        logger.error(`Error starting application: ${error}`);
        process.exit(1);
    }
}
// Start the application
start();
//# sourceMappingURL=index.js.map