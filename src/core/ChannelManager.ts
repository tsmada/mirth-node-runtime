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
  private channels: Map<string, Channel>;
  private processors: Map<string, ChannelProcessor>;
  private servers: Map<string, MLLPServer>;
  private logger: Logger;
  private debugMode: boolean;
  
  constructor(debugMode: boolean = false) {
    this.channels = new Map();
    this.processors = new Map();
    this.servers = new Map();
    this.logger = new Logger();
    this.debugMode = debugMode;
  }
  
  /**
   * Load a channel from an XML file
   */
  loadChannelFromFile(filePath: string): Channel {
    try {
      const xmlContent = fs.readFileSync(filePath, 'utf-8');
      return this.loadChannelFromXml(xmlContent);
    } catch (error) {
      this.logger.error(`Error loading channel from file: ${error}`);
      throw error;
    }
  }
  
  /**
   * Load a channel from XML content
   */
  loadChannelFromXml(xmlContent: string): Channel {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        isArray: (name) => ['connector', 'rule', 'step'].includes(name)
      });
      
      const result = parser.parse(xmlContent);
      const channel = Channel.fromXml(result.channel);
      
      this.addChannel(channel);
      
      return channel;
    } catch (error) {
      this.logger.error(`Error parsing channel XML: ${error}`);
      throw error;
    }
  }
  
  /**
   * Add a channel
   */
  addChannel(channel: Channel): void {
    this.channels.set(channel.id, channel);
    const processor = new ChannelProcessor(channel, this.debugMode);
    this.processors.set(channel.id, processor);
    
    this.logger.info(`Added channel: ${channel.name} (${channel.id})`);
  }
  
  /**
   * Get a channel by ID
   */
  getChannel(channelId: string): Channel | undefined {
    return this.channels.get(channelId);
  }
  
  /**
   * Get all channels
   */
  getAllChannels(): Channel[] {
    return Array.from(this.channels.values());
  }
  
  /**
   * Deploy a channel
   */
  async deployChannel(channelId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    const processor = this.processors.get(channelId);
    
    if (!channel || !processor) {
      throw new Error(`Channel not found: ${channelId}`);
    }
    
    try {
      this.logger.info(`Starting deployment of channel: ${channel.name} (${channel.id})`);
      
      // Execute deploy script
      processor.deploy();
      
      // Set up source connector
      if (channel.sourceConnector.transportName === 'TCP Listener') {
        this.logger.info(`Setting up TCP Listener for channel: ${channel.name}`);
        await this.setupMllpServer(channel);
      } else {
        this.logger.info(`Channel ${channel.name} does not use TCP Listener (using ${channel.sourceConnector.transportName})`);
      }
      
      this.logger.info(`Deployed channel: ${channel.name} (${channel.id})`);
    } catch (error) {
      this.logger.error(`Error deploying channel: ${error}`);
      throw error;
    }
  }
  
  /**
   * Undeploy a channel
   */
  async undeployChannel(channelId: string): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Error undeploying channel: ${error}`);
      throw error;
    }
  }
  
  /**
   * Set up an MLLP server for a channel
   */
  private async setupMllpServer(channel: Channel): Promise<void> {
    // Get port from properties
    const properties = channel.sourceConnector.properties;
    
    if (!properties || !properties.listenerConnectorProperties) {
      throw new Error('Missing TCP listener properties');
    }
    
    const port = parseInt(properties.listenerConnectorProperties.port, 10);
    const host = properties.listenerConnectorProperties.host || '0.0.0.0';
    
    this.logger.info(`Setting up MLLP server for channel ${channel.name} on ${host}:${port}`);
    
    // Create and start MLLP server
    const server = new MLLPServer(port, host, this.debugMode);
    
    // Handle messages
    server.on('message', async (message: any, sendResponse: (response: any) => void) => {
      try {
        this.logger.info(`Received message for channel: ${channel.name}`);
        
        const processor = this.processors.get(channel.id);
        
        if (!processor) {
          throw new Error(`Processor not found for channel: ${channel.id}`);
        }
        
        // Process the message
        const result = await processor.processMessage(message);
        
        // Send response
        if (result && result.sourceResult) {
          this.logger.info(`Sending response for channel: ${channel.name}`);
          sendResponse(result.sourceResult.message);
        } else {
          // Even if the message was filtered out, we still need to send an ACK
          this.logger.info(`Message was filtered out or no response to send for channel: ${channel.name}`);
          // Pass empty string to trigger the ACK in MLLPServer
          sendResponse('');
        }
      } catch (error) {
        this.logger.error(`Error processing message: ${error}`);
        // Pass empty string to trigger NACK in MLLPServer
        sendResponse('');
      }
    });
    
    try {
      await server.start();
      this.logger.info(`Started MLLP server for channel ${channel.name} on ${host}:${port}`);
    } catch (error) {
      this.logger.error(`Failed to start MLLP server: ${error}`);
      throw error;
    }
    
    // Store the server
    this.servers.set(channel.id, server);
  }
  
  /**
   * Stop all servers
   */
  async stopAllServers(): Promise<void> {
    for (const [channelId, server] of this.servers) {
      try {
        await server.stop();
        this.logger.info(`Stopped server for channel: ${channelId}`);
      } catch (error) {
        this.logger.error(`Error stopping server for channel ${channelId}: ${error}`);
      }
    }
    
    this.servers.clear();
  }
  
  /**
   * Set debug mode
   */
  setDebugMode(debugMode: boolean): void {
    this.debugMode = debugMode;
    
    // Update debug mode for all processors
    for (const processor of this.processors.values()) {
      processor.setDebugMode(debugMode);
    }
    
    // Update debug mode for all servers
    for (const server of this.servers.values()) {
      server.setDebugMode(debugMode);
    }
  }
} 