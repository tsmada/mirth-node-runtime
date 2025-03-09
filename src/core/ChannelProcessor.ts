import { Channel } from '../models/Channel.js';
import { Connector, ConnectorMode } from '../models/Connector.js';
import { JavaScriptExecutor } from '../runtime/JavaScriptExecutor.js';
import { Logger } from '../utils/Logger.js';

/**
 * ChannelProcessor processes messages through a channel
 */
export class ChannelProcessor {
  private channel: Channel;
  private jsExecutor: JavaScriptExecutor;
  private logger: Logger;
  private debugMode: boolean;
  
  constructor(channel: Channel, debugMode: boolean = false) {
    this.channel = channel;
    this.jsExecutor = new JavaScriptExecutor();
    this.logger = new Logger();
    this.debugMode = debugMode;
  }
  
  /**
   * Process a message through the channel
   */
  async processMessage(message: any): Promise<any> {
    try {
      if (this.debugMode) {
        this.logger.info(`[CHANNEL: ${this.channel.name}] Processing message:`);
        this.logger.info(message);
      }
      
      // Execute preprocessor script
      if (this.channel.preprocessingScript) {
        if (this.debugMode) this.logger.info(`[CHANNEL: ${this.channel.name}] Executing preprocessor script`);
        const originalMessage = JSON.stringify(message);
        message = this.jsExecutor.execute(this.channel.preprocessingScript, message);
        
        if (this.debugMode && JSON.stringify(message) !== originalMessage) {
          this.logger.info(`[CHANNEL: ${this.channel.name}] Message after preprocessor:`);
          this.logger.info(message);
        }
      }
      
      // Process source connector
      const sourceResult = await this.processConnector(this.channel.sourceConnector, message);
      
      if (!sourceResult.filtered) {
        // Message was filtered out
        if (this.debugMode) this.logger.info(`[CHANNEL: ${this.channel.name}] Message filtered out by source connector`);
        return null;
      }
      
      // Process destination connectors
      const destinationResults = await Promise.all(
        this.channel.getEnabledDestinationConnectors().map(connector => 
          this.processConnector(connector, sourceResult.message)
        )
      );
      
      // Execute postprocessor script
      if (this.channel.postprocessingScript) {
        if (this.debugMode) this.logger.info(`[CHANNEL: ${this.channel.name}] Executing postprocessor script`);
        this.jsExecutor.execute(this.channel.postprocessingScript, sourceResult.message);
      }
      
      if (this.debugMode) this.logger.info(`[CHANNEL: ${this.channel.name}] Message processing complete`);
      
      return {
        sourceResult,
        destinationResults
      };
    } catch (error) {
      this.logger.error(`Error processing message: ${error}`);
      throw error;
    }
  }
  
  /**
   * Process a message through a connector
   */
  private async processConnector(connector: Connector, message: any): Promise<{ filtered: boolean, message: any }> {
    try {
      const connectorType = connector.mode === ConnectorMode.SOURCE ? 'Source' : 'Destination';
      
      if (this.debugMode) {
        this.logger.info(`[CONNECTOR: ${connector.name}] Processing message through ${connectorType} connector`);
      }
      
      // Execute filter
      const filtered = await this.executeFilter(connector, message);
      
      if (!filtered) {
        if (this.debugMode) {
          this.logger.info(`[CONNECTOR: ${connector.name}] Message filtered out`);
        }
        return { filtered: false, message };
      }
      
      // Execute transformer
      const transformedMessage = await this.executeTransformer(connector, message);
      
      if (this.debugMode && JSON.stringify(transformedMessage) !== JSON.stringify(message)) {
        this.logger.info(`[CONNECTOR: ${connector.name}] Message after transformation:`);
        this.logger.info(transformedMessage);
      }
      
      return { filtered: true, message: transformedMessage };
    } catch (error) {
      this.logger.error(`Error processing connector ${connector.name}: ${error}`);
      throw error;
    }
  }
  
  /**
   * Execute a filter
   */
  private async executeFilter(connector: Connector, message: any): Promise<boolean> {
    const filter = connector.filter;
    
    if (!filter || filter.rules.length === 0) {
      // No filter rules, message passes through
      if (this.debugMode) {
        this.logger.info(`[FILTER: ${connector.name}] No filter rules, message passes through`);
      }
      return true;
    }
    
    try {
      if (this.debugMode) {
        this.logger.info(`[FILTER: ${connector.name}] Executing filter with ${filter.rules.length} rules`);
      }
      
      // Execute each enabled rule
      for (const rule of filter.getEnabledRules()) {
        if (this.debugMode) {
          this.logger.info(`[FILTER: ${connector.name}] Executing rule: ${rule.name || 'Unnamed'} (${rule.type})`);
        }
        
        if (rule.type === 'JavaScript') {
          const result = this.jsExecutor.execute(rule.script, message);
          
          if (this.debugMode) {
            this.logger.info(`[FILTER: ${connector.name}] Rule result: ${result}`);
          }
          
          if (result === true) {
            return true;
          }
        }
      }
      
      // No rules returned true
      if (this.debugMode) {
        this.logger.info(`[FILTER: ${connector.name}] All rules returned false, message filtered out`);
      }
      return false;
    } catch (error) {
      this.logger.error(`Error executing filter: ${error}`);
      return false;
    }
  }
  
  /**
   * Execute a transformer
   */
  private async executeTransformer(connector: Connector, message: any): Promise<any> {
    const transformer = connector.transformer;
    
    if (!transformer || transformer.steps.length === 0) {
      // No transformer steps, message passes through unchanged
      if (this.debugMode) {
        this.logger.info(`[TRANSFORMER: ${connector.name}] No transformer steps, message passes through unchanged`);
      }
      return message;
    }
    
    try {
      if (this.debugMode) {
        this.logger.info(`[TRANSFORMER: ${connector.name}] Executing transformer with ${transformer.steps.length} steps`);
      }
      
      let transformedMessage = message;
      
      // Execute each enabled step
      for (const step of transformer.getEnabledSteps()) {
        if (this.debugMode) {
          this.logger.info(`[TRANSFORMER: ${connector.name}] Executing step: ${step.name || 'Unnamed'} (${step.type})`);
        }
        
        const originalMessage = JSON.stringify(transformedMessage);
        
        if (step.type === 'JavaScript') {
          transformedMessage = this.jsExecutor.execute(step.script, transformedMessage);
        }
        
        if (this.debugMode && JSON.stringify(transformedMessage) !== originalMessage) {
          this.logger.info(`[TRANSFORMER: ${connector.name}] Message after step ${step.name || 'Unnamed'}:`);
          this.logger.info(transformedMessage);
        }
      }
      
      return transformedMessage;
    } catch (error) {
      this.logger.error(`Error executing transformer: ${error}`);
      throw error;
    }
  }
  
  /**
   * Deploy the channel
   */
  deploy(): void {
    try {
      if (this.channel.deployScript) {
        this.logger.info(`[CHANNEL: ${this.channel.name}] Executing deploy script`);
        this.jsExecutor.execute(this.channel.deployScript);
      }
    } catch (error) {
      this.logger.error(`Error deploying channel: ${error}`);
      throw error;
    }
  }
  
  /**
   * Undeploy the channel
   */
  undeploy(): void {
    try {
      if (this.channel.undeployScript) {
        this.logger.info(`[CHANNEL: ${this.channel.name}] Executing undeploy script`);
        this.jsExecutor.execute(this.channel.undeployScript);
      }
    } catch (error) {
      this.logger.error(`Error undeploying channel: ${error}`);
      throw error;
    }
  }
  
  /**
   * Set debug mode
   */
  setDebugMode(debugMode: boolean): void {
    this.debugMode = debugMode;
  }
} 