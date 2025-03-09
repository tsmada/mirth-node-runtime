import { JavaScriptExecutor } from '../runtime/JavaScriptExecutor.js';
import { Logger } from '../utils/Logger.js';
/**
 * ChannelProcessor processes messages through a channel
 */
export class ChannelProcessor {
    constructor(channel) {
        this.channel = channel;
        this.jsExecutor = new JavaScriptExecutor();
        this.logger = new Logger();
    }
    /**
     * Process a message through the channel
     */
    async processMessage(message) {
        try {
            // Execute preprocessor script
            if (this.channel.preprocessingScript) {
                this.logger.info('Executing preprocessor script');
                message = this.jsExecutor.execute(this.channel.preprocessingScript, message);
            }
            // Process source connector
            const sourceResult = await this.processConnector(this.channel.sourceConnector, message);
            if (!sourceResult.filtered) {
                // Message was filtered out
                this.logger.info('Message filtered out by source connector');
                return null;
            }
            // Process destination connectors
            const destinationResults = await Promise.all(this.channel.getEnabledDestinationConnectors().map(connector => this.processConnector(connector, sourceResult.message)));
            // Execute postprocessor script
            if (this.channel.postprocessingScript) {
                this.logger.info('Executing postprocessor script');
                this.jsExecutor.execute(this.channel.postprocessingScript, sourceResult.message);
            }
            return {
                sourceResult,
                destinationResults
            };
        }
        catch (error) {
            this.logger.error(`Error processing message: ${error}`);
            throw error;
        }
    }
    /**
     * Process a message through a connector
     */
    async processConnector(connector, message) {
        try {
            // Execute filter
            const filtered = await this.executeFilter(connector, message);
            if (!filtered) {
                return { filtered: false, message };
            }
            // Execute transformer
            const transformedMessage = await this.executeTransformer(connector, message);
            return { filtered: true, message: transformedMessage };
        }
        catch (error) {
            this.logger.error(`Error processing connector ${connector.name}: ${error}`);
            throw error;
        }
    }
    /**
     * Execute a filter
     */
    async executeFilter(connector, message) {
        const filter = connector.filter;
        if (!filter || filter.rules.length === 0) {
            // No filter rules, message passes through
            return true;
        }
        try {
            // Execute each enabled rule
            for (const rule of filter.getEnabledRules()) {
                if (rule.type === 'JavaScript') {
                    const result = this.jsExecutor.execute(rule.script, message);
                    if (result === true) {
                        return true;
                    }
                }
            }
            // No rules returned true
            return false;
        }
        catch (error) {
            this.logger.error(`Error executing filter: ${error}`);
            return false;
        }
    }
    /**
     * Execute a transformer
     */
    async executeTransformer(connector, message) {
        const transformer = connector.transformer;
        if (!transformer || transformer.steps.length === 0) {
            // No transformer steps, message passes through unchanged
            return message;
        }
        try {
            let transformedMessage = message;
            // Execute each enabled step
            for (const step of transformer.getEnabledSteps()) {
                if (step.type === 'JavaScript') {
                    transformedMessage = this.jsExecutor.execute(step.script, transformedMessage);
                }
            }
            return transformedMessage;
        }
        catch (error) {
            this.logger.error(`Error executing transformer: ${error}`);
            throw error;
        }
    }
    /**
     * Deploy the channel
     */
    deploy() {
        try {
            if (this.channel.deployScript) {
                this.logger.info('Executing deploy script');
                this.jsExecutor.execute(this.channel.deployScript);
            }
        }
        catch (error) {
            this.logger.error(`Error deploying channel: ${error}`);
            throw error;
        }
    }
    /**
     * Undeploy the channel
     */
    undeploy() {
        try {
            if (this.channel.undeployScript) {
                this.logger.info('Executing undeploy script');
                this.jsExecutor.execute(this.channel.undeployScript);
            }
        }
        catch (error) {
            this.logger.error(`Error undeploying channel: ${error}`);
            throw error;
        }
    }
}
//# sourceMappingURL=ChannelProcessor.js.map