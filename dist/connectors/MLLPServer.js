import * as net from 'net';
import { EventEmitter } from 'events';
import { HL7Parser } from '../datatypes/HL7Parser.js';
import { Logger } from '../utils/Logger.js';
/**
 * MLLPServer handles MLLP connections and processes HL7 messages
 */
export class MLLPServer extends EventEmitter {
    constructor(port, host = '0.0.0.0') {
        super();
        this.port = port;
        this.host = host;
        this.logger = new Logger();
        this.connections = new Map();
        this.server = net.createServer(this.handleConnection.bind(this));
    }
    /**
     * Start the MLLP server
     */
    start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, this.host, () => {
                this.logger.info(`MLLP server listening on ${this.host}:${this.port}`);
                resolve();
            });
            this.server.on('error', (error) => {
                this.logger.error(`MLLP server error: ${error.message}`);
                reject(error);
            });
        });
    }
    /**
     * Stop the MLLP server
     */
    stop() {
        return new Promise((resolve, reject) => {
            // Close all connections
            for (const [id, socket] of this.connections) {
                socket.destroy();
                this.connections.delete(id);
            }
            this.server.close((error) => {
                if (error) {
                    this.logger.error(`Error stopping MLLP server: ${error.message}`);
                    reject(error);
                }
                else {
                    this.logger.info('MLLP server stopped');
                    resolve();
                }
            });
        });
    }
    /**
     * Handle a new connection
     */
    handleConnection(socket) {
        const connectionId = `${socket.remoteAddress}:${socket.remotePort}`;
        this.connections.set(connectionId, socket);
        this.logger.info(`New connection from ${connectionId}`);
        let buffer = Buffer.alloc(0);
        socket.on('data', (data) => {
            // Append data to buffer
            buffer = Buffer.concat([buffer, data]);
            // Check if we have a complete message
            const startIndex = buffer.indexOf(0x0B); // VT
            const endIndex = buffer.indexOf(0x1C); // FS
            if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                // Extract the message
                const messageBuffer = buffer.slice(startIndex, endIndex + 2); // Include FS and CR
                const messageString = messageBuffer.toString();
                // Remove the processed message from the buffer
                buffer = buffer.slice(endIndex + 2);
                // Process the message
                this.processMessage(messageString, socket);
            }
        });
        socket.on('close', () => {
            this.logger.info(`Connection closed: ${connectionId}`);
            this.connections.delete(connectionId);
        });
        socket.on('error', (error) => {
            this.logger.error(`Socket error: ${error.message}`);
        });
    }
    /**
     * Process an HL7 message
     */
    processMessage(message, socket) {
        try {
            // Parse the message
            const xmlObj = HL7Parser.parseToXml(message);
            // Emit the message event
            this.emit('message', xmlObj, (response) => {
                // Send the response
                this.sendResponse(response, socket);
            });
        }
        catch (error) {
            this.logger.error(`Error processing message: ${error}`);
            // Send NACK
            this.sendNack(socket, 'Error processing message');
        }
    }
    /**
     * Send an ACK response
     */
    sendAck(socket, messageControlId) {
        const ackMessage = this.createAckMessage(messageControlId, 'AA', '');
        this.sendResponse(ackMessage, socket);
    }
    /**
     * Send a NACK response
     */
    sendNack(socket, errorMessage, messageControlId = '') {
        const nackMessage = this.createAckMessage(messageControlId, 'AE', errorMessage);
        this.sendResponse(nackMessage, socket);
    }
    /**
     * Send a response
     */
    sendResponse(response, socket) {
        try {
            let responseString;
            if (typeof response === 'string') {
                responseString = response;
            }
            else {
                // Convert XML object to HL7
                responseString = HL7Parser.convertToHl7(response);
            }
            // Add MLLP framing
            const framedResponse = HL7Parser.addMllpFraming(responseString);
            // Send the response
            socket.write(framedResponse);
        }
        catch (error) {
            this.logger.error(`Error sending response: ${error}`);
        }
    }
    /**
     * Create an ACK message
     */
    createAckMessage(messageControlId, code, errorMessage) {
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
        return [
            'MSH|^~\\&|RECEIVING_APP|RECEIVING_FACILITY|SENDING_APP|SENDING_FACILITY|' + timestamp + '||ACK|' + messageControlId + '|P|2.3',
            'MSA|' + code + '|' + messageControlId + '|' + errorMessage
        ].join('\r');
    }
}
//# sourceMappingURL=MLLPServer.js.map