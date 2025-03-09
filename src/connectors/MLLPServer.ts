import * as net from 'net';
import { EventEmitter } from 'events';
import { HL7Parser } from '../datatypes/HL7Parser.js';
import { Logger } from '../utils/Logger.js';

/**
 * MLLPServer handles MLLP connections and processes HL7 messages
 */
export class MLLPServer extends EventEmitter {
  private server: net.Server;
  private port: number;
  private host: string;
  private logger: Logger;
  private connections: Map<string, net.Socket>;
  private debugMode: boolean;
  
  constructor(port: number, host: string = '0.0.0.0', debugMode: boolean = false) {
    super();
    this.port = port;
    this.host = host;
    this.logger = new Logger();
    this.connections = new Map();
    this.debugMode = debugMode;
    this.server = net.createServer(this.handleConnection.bind(this));
    
    this.logger.info(`Created MLLP server on ${host}:${port}, debug mode: ${debugMode}`);
  }
  
  /**
   * Start the MLLP server
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, this.host, () => {
        this.logger.info(`MLLP server listening on ${this.host}:${this.port}`);
        resolve();
      });
      
      this.server.on('error', (error) => {
        this.logger.error(`MLLP server error: ${error.message}`);
        reject(error);
      });
      
      this.server.on('connection', (socket) => {
        this.logger.info(`Connection attempt from ${socket.remoteAddress}:${socket.remotePort}`);
      });
    });
  }
  
  /**
   * Stop the MLLP server
   */
  stop(): Promise<void> {
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
        } else {
          this.logger.info('MLLP server stopped');
          resolve();
        }
      });
    });
  }
  
  /**
   * Handle a new connection
   */
  private handleConnection(socket: net.Socket): void {
    const connectionId = `${socket.remoteAddress}:${socket.remotePort}`;
    this.connections.set(connectionId, socket);
    
    this.logger.info(`New connection from ${connectionId}`);
    
    let buffer = Buffer.alloc(0);
    
    socket.on('data', (data) => {
      this.logger.info(`Received data from ${connectionId}: ${data.length} bytes`);
      
      // Append data to buffer
      buffer = Buffer.concat([buffer, data]);
      
      if (this.debugMode) {
        this.logger.info(`[MLLP: ${this.host}:${this.port}] Received data: ${data.toString('hex')}`);
        this.logger.info(`[MLLP: ${this.host}:${this.port}] Received data as string: ${data.toString()}`);
      }
      
      // Check if we have a complete message
      const startIndex = buffer.indexOf(0x0B); // VT
      const endIndex = buffer.indexOf(0x1C); // FS
      
      this.logger.info(`Buffer state: length=${buffer.length}, startIndex=${startIndex}, endIndex=${endIndex}`);
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        // Extract the message
        const messageBuffer = buffer.slice(startIndex + 1, endIndex); // Exclude VT, include content up to FS
        const messageString = messageBuffer.toString();
        
        this.logger.info(`Complete message received (${messageBuffer.length} bytes):`);
        this.logger.info(messageString);
        
        // Remove the processed message from the buffer
        buffer = buffer.slice(endIndex + 2);
        
        // Process the message
        this.processMessage(messageString, socket);
      } else {
        this.logger.info(`Incomplete message, waiting for more data. Buffer has ${buffer.length} bytes.`);
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
  private processMessage(message: string, socket: net.Socket): void {
    try {
      // Extract message control ID for ACK
      const messageControlId = this.extractMessageControlId(message);
      
      // Parse the message
      const xmlObj = HL7Parser.parseToXml(message);
      
      if (this.debugMode) {
        this.logger.info(`[MLLP: ${this.host}:${this.port}] Parsed message to XML:`);
        this.logger.info(JSON.stringify(xmlObj, null, 2));
      }
      
      // Emit the message event
      this.emit('message', xmlObj, (response: any) => {
        // If response is empty, send ACK instead
        if (!response || (typeof response === 'string' && response.trim() === '')) {
          this.logger.info(`No response provided, sending ACK for message: ${messageControlId}`);
          this.sendAck(socket, messageControlId);
        } else {
          // Send the response
          this.sendResponse(response, socket);
        }
      });
    } catch (error) {
      this.logger.error(`Error processing message: ${error}`);
      
      // Send NACK
      this.sendNack(socket, 'Error processing message');
    }
  }
  
  /**
   * Extract message control ID from HL7 message
   */
  private extractMessageControlId(message: string): string {
    try {
      // Find the MSH segment
      const lines = message.split('\n');
      const mshLine = lines.find(line => line.startsWith('MSH|'));
      
      if (!mshLine) {
        return '';
      }
      
      // Split the MSH segment by field separator
      const fields = mshLine.split('|');
      
      // Message Control ID is in field 10 (0-indexed)
      if (fields.length >= 10) {
        return fields[9];
      }
      
      return '';
    } catch (error) {
      this.logger.error(`Error extracting message control ID: ${error}`);
      return '';
    }
  }
  
  /**
   * Send an ACK response
   */
  private sendAck(socket: net.Socket, messageControlId: string): void {
    const ackMessage = this.createAckMessage(messageControlId, 'AA', '');
    
    this.logger.info(`Sending ACK for message: ${messageControlId}`);
    this.logger.info(ackMessage);
    
    this.sendResponse(ackMessage, socket);
  }
  
  /**
   * Send a NACK response
   */
  private sendNack(socket: net.Socket, errorMessage: string, messageControlId: string = ''): void {
    const nackMessage = this.createAckMessage(messageControlId, 'AE', errorMessage);
    
    this.logger.info(`Sending NACK for message: ${messageControlId}`);
    this.logger.info(nackMessage);
    
    this.sendResponse(nackMessage, socket);
  }
  
  /**
   * Send a response
   */
  private sendResponse(response: any, socket: net.Socket): void {
    try {
      let responseString: string;
      
      if (typeof response === 'string') {
        responseString = response;
      } else {
        // Convert XML object to HL7
        responseString = HL7Parser.convertToHl7(response);
      }
      
      // Add MLLP framing
      const framedResponse = HL7Parser.addMllpFraming(responseString);
      
      this.logger.info(`[MLLP: ${this.host}:${this.port}] Sending response:`);
      this.logger.info(responseString);
      
      // Send the response
      socket.write(framedResponse);
    } catch (error) {
      this.logger.error(`Error sending response: ${error}`);
    }
  }
  
  /**
   * Create an ACK message
   */
  private createAckMessage(messageControlId: string, code: string, errorMessage: string): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    
    return [
      'MSH|^~\\&|RECEIVING_APP|RECEIVING_FACILITY|SENDING_APP|SENDING_FACILITY|' + timestamp + '||ACK|' + Date.now() + '|P|2.3',
      'MSA|' + code + '|' + messageControlId + '|' + errorMessage
    ].join('\r');
  }
  
  /**
   * Set debug mode
   */
  setDebugMode(debugMode: boolean): void {
    this.debugMode = debugMode;
  }
} 