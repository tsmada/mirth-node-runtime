import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/Logger.js';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
const logger = new Logger();
/**
 * Compile a TypeScript channel to JavaScript
 */
async function compileChannel() {
    try {
        // Get command line arguments
        const args = process.argv.slice(2);
        if (args.length < 1) {
            logger.error('Usage: npm run compile-channel <channel-file.ts>');
            process.exit(1);
        }
        const inputFile = args[0];
        const outputFile = args[1] || inputFile.replace('.ts', '.xml');
        logger.info(`Compiling ${inputFile} to ${outputFile}`);
        // Read the TypeScript file
        const tsContent = fs.readFileSync(inputFile, 'utf-8');
        // Extract channel configuration and scripts
        const channelConfig = extractChannelConfig(tsContent);
        // Read the template XML file
        const templatePath = path.join(process.cwd(), 'templates', 'channel-template.xml');
        let templateXml = '';
        if (fs.existsSync(templatePath)) {
            templateXml = fs.readFileSync(templatePath, 'utf-8');
        }
        else {
            // Use a basic template if no template file exists
            templateXml = `
        <channel version="3.1.0">
          <id>${channelConfig.id || generateUUID()}</id>
          <name>${channelConfig.name || 'New Channel'}</name>
          <description>${channelConfig.description || ''}</description>
          <enabled>true</enabled>
          <revision>1</revision>
          <sourceConnector version="3.1.0">
            <metaDataId>0</metaDataId>
            <name>sourceConnector</name>
            <transportName>TCP Listener</transportName>
            <mode>SOURCE</mode>
            <enabled>true</enabled>
            <waitForPrevious>true</waitForPrevious>
          </sourceConnector>
          <destinationConnectors></destinationConnectors>
          <preprocessingScript></preprocessingScript>
          <postprocessingScript></postprocessingScript>
          <deployScript></deployScript>
          <undeployScript></undeployScript>
        </channel>
      `;
        }
        // Parse the template XML
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            textNodeName: '#text',
            parseAttributeValue: true,
            parseTagValue: true
        });
        const xmlObj = parser.parse(templateXml);
        // Update the XML object with the extracted configuration
        updateXmlWithConfig(xmlObj, channelConfig);
        // Convert back to XML
        const builder = new XMLBuilder({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            textNodeName: '#text',
            format: true
        });
        const outputXml = builder.build(xmlObj);
        // Write the output file
        fs.writeFileSync(outputFile, outputXml);
        logger.info(`Successfully compiled ${inputFile} to ${outputFile}`);
    }
    catch (error) {
        logger.error(`Error compiling channel: ${error}`);
        process.exit(1);
    }
}
/**
 * Extract channel configuration and scripts from TypeScript code
 */
function extractChannelConfig(tsContent) {
    // This is a simplified implementation
    // In a real implementation, you would parse the TypeScript code
    // and extract the channel configuration and scripts
    const config = {
        id: extractValue(tsContent, 'id'),
        name: extractValue(tsContent, 'name'),
        description: extractValue(tsContent, 'description'),
        scripts: {
            preprocessor: extractScript(tsContent, 'preprocessor'),
            postprocessor: extractScript(tsContent, 'postprocessor'),
            deploy: extractScript(tsContent, 'deploy'),
            undeploy: extractScript(tsContent, 'undeploy')
        },
        sourceConnector: {
            filter: extractScript(tsContent, 'sourceFilter'),
            transformer: extractScript(tsContent, 'sourceTransformer')
        },
        destinationConnectors: []
    };
    // Extract destination connectors from destinations array
    const destinationsRegex = /destinations\s*:\s*\[\s*{([^}]*)}\s*\]/s;
    const destinationsMatch = tsContent.match(destinationsRegex);
    if (destinationsMatch && destinationsMatch[1]) {
        const destinationsContent = destinationsMatch[1];
        // Extract name from the destinations content
        const nameRegex = /name\s*:\s*['"]([^'"]+)['"]/;
        const nameMatch = destinationsContent.match(nameRegex);
        const name = nameMatch ? nameMatch[1] : 'Destination';
        config.destinationConnectors.push({
            name,
            filter: extractScript(destinationsContent, 'filter'),
            transformer: extractScript(destinationsContent, 'transformer')
        });
    }
    return config;
}
/**
 * Extract a value from TypeScript code
 */
function extractValue(content, key) {
    const regex = new RegExp(`${key}\\s*:\\s*['"]([^'"]+)['"]`);
    const match = content.match(regex);
    return match ? match[1] : '';
}
/**
 * Extract a script from TypeScript code
 */
function extractScript(content, scriptType) {
    const regex = new RegExp(`${scriptType}\\s*\\(\\s*\\)\\s*{([\\s\\S]*?)}`);
    const match = content.match(regex);
    return match ? match[1].trim() : '';
}
/**
 * Update XML object with extracted configuration
 */
function updateXmlWithConfig(xmlObj, config) {
    // Update channel properties
    if (config.id)
        xmlObj.channel.id = config.id;
    if (config.name)
        xmlObj.channel.name = config.name;
    if (config.description)
        xmlObj.channel.description = config.description;
    // Update scripts
    if (config.scripts.preprocessor) {
        xmlObj.channel.preprocessingScript = config.scripts.preprocessor;
    }
    if (config.scripts.postprocessor) {
        xmlObj.channel.postprocessingScript = config.scripts.postprocessor;
    }
    if (config.scripts.deploy) {
        xmlObj.channel.deployScript = config.scripts.deploy;
    }
    if (config.scripts.undeploy) {
        xmlObj.channel.undeployScript = config.scripts.undeploy;
    }
    // Update source connector
    if (config.sourceConnector.filter) {
        if (!xmlObj.channel.sourceConnector.filter) {
            xmlObj.channel.sourceConnector.filter = { rules: { rule: [] } };
        }
        xmlObj.channel.sourceConnector.filter.rules.rule.push({
            sequenceNumber: 0,
            name: 'Filter',
            type: 'JavaScript',
            script: config.sourceConnector.filter,
            operator: 'NONE',
            enabled: true
        });
    }
    if (config.sourceConnector.transformer) {
        if (!xmlObj.channel.sourceConnector.transformer) {
            xmlObj.channel.sourceConnector.transformer = { steps: { step: [] } };
        }
        xmlObj.channel.sourceConnector.transformer.steps.step.push({
            sequenceNumber: 0,
            name: 'Transformer',
            type: 'JavaScript',
            script: config.sourceConnector.transformer,
            enabled: true
        });
    }
    // Update destination connectors
    if (config.destinationConnectors.length > 0) {
        if (!xmlObj.channel.destinationConnectors) {
            xmlObj.channel.destinationConnectors = { connector: [] };
        }
        for (let i = 0; i < config.destinationConnectors.length; i++) {
            const dest = config.destinationConnectors[i];
            const connector = {
                metaDataId: i + 1,
                name: dest.name,
                transportName: 'File Writer',
                mode: 'DESTINATION',
                enabled: true,
                waitForPrevious: true
            };
            if (dest.filter) {
                connector.filter = {
                    rules: {
                        rule: [{
                                sequenceNumber: 0,
                                name: 'Filter',
                                type: 'JavaScript',
                                script: dest.filter,
                                operator: 'NONE',
                                enabled: true
                            }]
                    }
                };
            }
            if (dest.transformer) {
                connector.transformer = {
                    steps: {
                        step: [{
                                sequenceNumber: 0,
                                name: 'Transformer',
                                type: 'JavaScript',
                                script: dest.transformer,
                                enabled: true
                            }]
                    }
                };
            }
            xmlObj.channel.destinationConnectors.connector.push(connector);
        }
    }
}
/**
 * Generate a UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
// Run the compiler
compileChannel();
//# sourceMappingURL=compile-channel.js.map