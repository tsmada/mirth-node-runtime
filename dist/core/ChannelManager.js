import { Channel } from '../models/Channel.js';
import { ChannelProcessor } from './ChannelProcessor.js';
import { MLLPServer } from '../connectors/MLLPServer.js';
import { Logger } from '../utils/Logger.js';
import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';
/**
 * ChannelManager manages channels and their processors
 */
export class ChannelManager {
    constructor() {
        this.channels = new Map();
        this.processors = new Map();
        this.servers = new Map();
        this.logger = new Logger();
    }
    /**
     * Load a channel from an XML file
     */
    loadChannelFromFile(filePath) {
        try {
            const xmlContent = fs.readFileSync(filePath, 'utf-8');
            return this.loadChannelFromXml(xmlContent);
        }
        catch (error) {
            this.logger.error(`Error loading channel from file: ${error}`);
            throw error;
        }
    }
    /**
     * Load a channel from XML content
     */
    loadChannelFromXml(xmlContent) {
        try {
            const parser = new XMLParser({
                ignoreAttributes: false,
                isArray: (name) => ['connector', 'rule', 'step'].includes(name)
            });
            const result = parser.parse(xmlContent);
            const channel = Channel.fromXml(result.channel);
            this.addChannel(channel);
            return channel;
        }
        catch (error) {
            this.logger.error(`Error parsing channel XML: ${error}`);
            throw error;
        }
    }
    /**
     * Add a channel
     */
    addChannel(channel) {
        this.channels.set(channel.id, channel);
        this.processors.set(channel.id, new ChannelProcessor(channel));
        this.logger.info(`Added channel: ${channel.name} (${channel.id})`);
    }
    /**
     * Get a channel by ID
     */
    getChannel(channelId) {
        return this.channels.get(channelId);
    }
    /**
     * Get all channels
     */
    getAllChannels() {
        return Array.from(this.channels.values());
    }
    /**
     * Deploy a channel
     */
    async deployChannel(channelId) {
        const channel = this.channels.get(channelId);
        const processor = this.processors.get(channelId);
        if (!channel || !processor) {
            throw new Error(`Channel not found: ${channelId}`);
        }
        try {
            // Execute deploy script
            processor.deploy();
            // Set up source connector
            if (channel.sourceConnector.transportName === 'TCP Listener') {
                await this.setupMllpServer(channel);
            }
            this.logger.info(`Deployed channel: ${channel.name} (${channel.id})`);
        }
        catch (error) {
            this.logger.error(`Error deploying channel: ${error}`);
            throw error;
        }
    }
    /**
     * Undeploy a channel
     */
    async undeployChannel(channelId) {
        const channel = this.channels.get(channelId);
        const processor = this.processors.get(channelId);
        if (!channel || !processor) {
            throw new Error(`Channel not found: ${channelId}`);
        }
        try {
            // Stop MLLP server if running
            const server = this.servers.get(channelId);
            if (server) {
                await server.stop();
                this.servers.delete(channelId);
            }
            // Execute undeploy script
            processor.undeploy();
            this.logger.info(`Undeployed channel: ${channel.name} (${channel.id})`);
        }
        catch (error) {
            this.logger.error(`Error undeploying channel: ${error}`);
            throw error;
        }
    }
    /**
     * Set up an MLLP server for a channel
     */
    async setupMllpServer(channel) {
        // Get port from properties
        const properties = channel.sourceConnector.properties;
        if (!properties || !properties.listenerConnectorProperties) {
            throw new Error('Missing TCP listener properties');
        }
        const port = parseInt(properties.listenerConnectorProperties.port, 10);
        const host = properties.listenerConnectorProperties.host || '0.0.0.0';
        // Create and start MLLP server
        const server = new MLLPServer(port, host);
        // Handle messages
        server.on('message', async (message, sendResponse) => {
            try {
                const processor = this.processors.get(channel.id);
                if (!processor) {
                    throw new Error(`Processor not found for channel: ${channel.id}`);
                }
                // Process the message
                const result = await processor.processMessage(message);
                // Send response
                if (result && result.sourceResult) {
                    sendResponse(result.sourceResult.message);
                }
                else {
                    sendResponse('');
                }
            }
            catch (error) {
                this.logger.error(`Error processing message: ${error}`);
                sendResponse('');
            }
        });
        await server.start();
        // Store the server
        this.servers.set(channel.id, server);
        this.logger.info(`Started MLLP server for channel ${channel.name} on ${host}:${port}`);
    }
    /**
     * Stop all servers
     */
    async stopAllServers() {
        for (const [channelId, server] of this.servers) {
            try {
                await server.stop();
                this.logger.info(`Stopped server for channel: ${channelId}`);
            }
            catch (error) {
                this.logger.error(`Error stopping server for channel ${channelId}: ${error}`);
            }
        }
        this.servers.clear();
    }
}
//# sourceMappingURL=ChannelManager.js.map