import { EventEmitter } from 'events';
/**
 * MLLPServer handles MLLP connections and processes HL7 messages
 */
export declare class MLLPServer extends EventEmitter {
    private server;
    private port;
    private host;
    private logger;
    private connections;
    constructor(port: number, host?: string);
    /**
     * Start the MLLP server
     */
    start(): Promise<void>;
    /**
     * Stop the MLLP server
     */
    stop(): Promise<void>;
    /**
     * Handle a new connection
     */
    private handleConnection;
    /**
     * Process an HL7 message
     */
    private processMessage;
    /**
     * Send an ACK response
     */
    private sendAck;
    /**
     * Send a NACK response
     */
    private sendNack;
    /**
     * Send a response
     */
    private sendResponse;
    /**
     * Create an ACK message
     */
    private createAckMessage;
}
