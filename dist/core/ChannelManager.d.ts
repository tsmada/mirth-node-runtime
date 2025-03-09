import { Channel } from '../models/Channel.js';
/**
 * ChannelManager manages channels and their processors
 */
export declare class ChannelManager {
    private channels;
    private processors;
    private servers;
    private logger;
    constructor();
    /**
     * Load a channel from an XML file
     */
    loadChannelFromFile(filePath: string): Channel;
    /**
     * Load a channel from XML content
     */
    loadChannelFromXml(xmlContent: string): Channel;
    /**
     * Add a channel
     */
    addChannel(channel: Channel): void;
    /**
     * Get a channel by ID
     */
    getChannel(channelId: string): Channel | undefined;
    /**
     * Get all channels
     */
    getAllChannels(): Channel[];
    /**
     * Deploy a channel
     */
    deployChannel(channelId: string): Promise<void>;
    /**
     * Undeploy a channel
     */
    undeployChannel(channelId: string): Promise<void>;
    /**
     * Set up an MLLP server for a channel
     */
    private setupMllpServer;
    /**
     * Stop all servers
     */
    stopAllServers(): Promise<void>;
}
