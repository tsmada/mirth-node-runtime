import { Channel } from '../models/Channel.js';
/**
 * ChannelProcessor processes messages through a channel
 */
export declare class ChannelProcessor {
    private channel;
    private jsExecutor;
    private logger;
    constructor(channel: Channel);
    /**
     * Process a message through the channel
     */
    processMessage(message: any): Promise<any>;
    /**
     * Process a message through a connector
     */
    private processConnector;
    /**
     * Execute a filter
     */
    private executeFilter;
    /**
     * Execute a transformer
     */
    private executeTransformer;
    /**
     * Deploy the channel
     */
    deploy(): void;
    /**
     * Undeploy the channel
     */
    undeploy(): void;
}
