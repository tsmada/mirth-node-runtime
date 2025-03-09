import { ChannelDefinition } from '../models/ChannelDefinition.js';
import { Channel } from '../models/Channel.js';
import { Connector, ConnectorMode } from '../models/Connector.js';
import { Filter } from '../models/Filter.js';
import { Rule } from '../models/Rule.js';
import { Transformer } from '../models/Transformer.js';
import { Step } from '../models/Step.js';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Converts TypeScript channel definitions to Mirth Connect compatible formats
 */
export class ChannelConverter {
  /**
   * Convert a TypeScript channel definition to a Channel object
   */
  static toChannel(definition: ChannelDefinition): Channel {
    const channelId = uuidv4();
    const channel = new Channel(channelId);
    
    // Set basic properties
    channel.name = definition.name;
    channel.description = definition.description || '';
    channel.enabled = true;
    
    // Set scripts
    if (definition.preprocessor) {
      channel.preprocessingScript = this.functionToScript(definition.preprocessor);
    }
    
    if (definition.postprocessor) {
      channel.postprocessingScript = this.functionToScript(definition.postprocessor);
    }
    
    if (definition.onDeploy) {
      channel.deployScript = this.functionToScript(definition.onDeploy);
    }
    
    if (definition.onUndeploy) {
      channel.undeployScript = this.functionToScript(definition.onUndeploy);
    }
    
    // Set up source connector
    const sourceConnector = new Connector('sourceConnector');
    sourceConnector.mode = ConnectorMode.SOURCE;
    sourceConnector.transportName = definition.sourceProperties?.type || 'TCP Listener';
    sourceConnector.properties = definition.sourceProperties?.properties || {
      listenerConnectorProperties: {
        host: '0.0.0.0',
        port: '6661'
      }
    };
    
    // Set up source filter
    if (definition.sourceFilter) {
      const filter = new Filter();
      const rule = new Rule();
      rule.name = 'Source Filter';
      rule.type = 'JavaScript';
      rule.script = this.functionToScript(definition.sourceFilter);
      filter.rules.push(rule);
      sourceConnector.filter = filter;
    }
    
    // Set up source transformer
    if (definition.sourceTransformer) {
      const transformer = new Transformer();
      const step = new Step();
      step.name = 'Source Transformer';
      step.type = 'JavaScript';
      step.script = this.functionToScript(definition.sourceTransformer);
      transformer.steps.push(step);
      sourceConnector.transformer = transformer;
    }
    
    channel.sourceConnector = sourceConnector;
    
    // Set up destination connectors
    if (definition.destinations) {
      let index = 0;
      for (const [name, dest] of Object.entries(definition.destinations)) {
        const connector = new Connector(name);
        connector.mode = ConnectorMode.DESTINATION;
        connector.transportName = dest.type || 'File Writer';
        connector.properties = dest.properties || {};
        
        // Set up destination filter
        if (dest.filter) {
          const filter = new Filter();
          const rule = new Rule();
          rule.name = `${name} Filter`;
          rule.type = 'JavaScript';
          rule.script = this.functionToScript(dest.filter);
          filter.rules.push(rule);
          connector.filter = filter;
        }
        
        // Set up destination transformer
        if (dest.transformer) {
          const transformer = new Transformer();
          const step = new Step();
          step.name = `${name} Transformer`;
          step.type = 'JavaScript';
          step.script = this.functionToScript(dest.transformer);
          transformer.steps.push(step);
          connector.transformer = transformer;
        }
        
        channel.destinationConnectors.push(connector);
        index++;
      }
    }
    
    return channel;
  }
  
  /**
   * Convert a TypeScript function to a JavaScript script string
   */
  private static functionToScript(func: Function): string {
    // Convert the function to a string
    let script = func.toString();
    
    // Remove arrow function syntax if present
    script = script.replace(/^\s*\([^)]*\)\s*=>\s*/, '');
    
    // If it's a single expression arrow function, wrap it in a return statement
    if (!script.includes('return') && !script.includes('{')) {
      script = `return ${script}`;
    }
    
    // If it's not wrapped in curly braces, wrap it
    if (!script.startsWith('{')) {
      script = `{ ${script} }`;
    }
    
    return script;
  }
  
  /**
   * Save a channel to an XML file
   */
  static saveChannelToFile(definition: ChannelDefinition, filePath: string): void {
    const channel = this.toChannel(definition);
    const xml = channel.toXml();
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(filePath, xml);
  }
  
  /**
   * Compile TypeScript channels to JavaScript
   */
  static compileChannel(definition: ChannelDefinition, outputDir: string): void {
    const outputPath = path.join(outputDir, `${definition.name.replace(/\s+/g, '-')}.js`);
    
    // Create a JavaScript representation of the channel
    let jsCode = `// Generated from TypeScript channel: ${definition.name}\n\n`;
    
    // Add source filter
    if (definition.sourceFilter) {
      jsCode += `function sourceFilter(msg, logger) {\n`;
      jsCode += `  ${definition.sourceFilter.toString().replace(/^\([^)]*\)\s*=>\s*/, '').replace(/^\{\s*|\s*\}$/g, '')}\n`;
      jsCode += `}\n\n`;
    }
    
    // Add source transformer
    if (definition.sourceTransformer) {
      jsCode += `function sourceTransformer(msg, logger) {\n`;
      jsCode += `  ${definition.sourceTransformer.toString().replace(/^\([^)]*\)\s*=>\s*/, '').replace(/^\{\s*|\s*\}$/g, '')}\n`;
      jsCode += `}\n\n`;
    }
    
    // Add preprocessor
    if (definition.preprocessor) {
      jsCode += `function preprocessor(msg, logger) {\n`;
      jsCode += `  ${definition.preprocessor.toString().replace(/^\([^)]*\)\s*=>\s*/, '').replace(/^\{\s*|\s*\}$/g, '')}\n`;
      jsCode += `}\n\n`;
    }
    
    // Add postprocessor
    if (definition.postprocessor) {
      jsCode += `function postprocessor(msg, logger) {\n`;
      jsCode += `  ${definition.postprocessor.toString().replace(/^\([^)]*\)\s*=>\s*/, '').replace(/^\{\s*|\s*\}$/g, '')}\n`;
      jsCode += `}\n\n`;
    }
    
    // Add deploy script
    if (definition.onDeploy) {
      jsCode += `function onDeploy(logger) {\n`;
      jsCode += `  ${definition.onDeploy.toString().replace(/^\([^)]*\)\s*=>\s*/, '').replace(/^\{\s*|\s*\}$/g, '')}\n`;
      jsCode += `}\n\n`;
    }
    
    // Add undeploy script
    if (definition.onUndeploy) {
      jsCode += `function onUndeploy(logger) {\n`;
      jsCode += `  ${definition.onUndeploy.toString().replace(/^\([^)]*\)\s*=>\s*/, '').replace(/^\{\s*|\s*\}$/g, '')}\n`;
      jsCode += `}\n\n`;
    }
    
    // Add destination functions
    if (definition.destinations) {
      for (const [name, dest] of Object.entries(definition.destinations)) {
        // Add destination filter
        if (dest.filter) {
          jsCode += `function ${name.replace(/\s+/g, '')}Filter(msg, logger) {\n`;
          jsCode += `  ${dest.filter.toString().replace(/^\([^)]*\)\s*=>\s*/, '').replace(/^\{\s*|\s*\}$/g, '')}\n`;
          jsCode += `}\n\n`;
        }
        
        // Add destination transformer
        if (dest.transformer) {
          jsCode += `function ${name.replace(/\s+/g, '')}Transformer(msg, logger) {\n`;
          jsCode += `  ${dest.transformer.toString().replace(/^\([^)]*\)\s*=>\s*/, '').replace(/^\{\s*|\s*\}$/g, '')}\n`;
          jsCode += `}\n\n`;
        }
      }
    }
    
    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(outputPath, jsCode);
  }
} 