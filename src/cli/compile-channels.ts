#!/usr/bin/env node

import { ChannelConverter } from '../utils/ChannelConverter.js';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { fileURLToPath } from 'url';

// Get the source and output directories
const sourceDir = process.argv[2] || './src/channels';
const outputDir = process.argv[3] || './dist/channels';
const xmlOutputDir = process.argv[4] || './channels';

console.log(`Compiling TypeScript channels from ${sourceDir} to ${outputDir}`);

// Find all TypeScript channel files
const channelFiles = glob.sync(`${sourceDir}/**/*.ts`);

if (channelFiles.length === 0) {
  console.log('No channel files found');
  process.exit(0);
}

console.log(`Found ${channelFiles.length} channel files`);

// Process each channel file
async function processChannels() {
  for (const file of channelFiles) {
    try {
      console.log(`Processing ${file}`);
      
      // Import the channel definition using dynamic import
      const fileUrl = `file://${path.resolve(file)}`;
      const module = await import(fileUrl);
      
      // Find the channel definition in the module
      let channelDefinition = null;
      for (const key in module) {
        if (typeof module[key] === 'object' && module[key].name) {
          channelDefinition = module[key];
          break;
        }
      }
      
      if (!channelDefinition) {
        console.log(`No channel definition found in ${file}`);
        continue;
      }
      
      // Generate JavaScript file
      const jsOutputPath = path.join(outputDir, path.basename(file, '.ts') + '.js');
      ChannelConverter.compileChannel(channelDefinition, outputDir);
      console.log(`Generated JavaScript: ${jsOutputPath}`);
      
      // Generate XML file
      const xmlOutputPath = path.join(xmlOutputDir, channelDefinition.name.replace(/\s+/g, '-') + '.xml');
      ChannelConverter.saveChannelToFile(channelDefinition, xmlOutputPath);
      console.log(`Generated XML: ${xmlOutputPath}`);
    } catch (error) {
      console.error(`Error processing ${file}: ${error}`);
    }
  }
}

// Run the async function
processChannels().then(() => {
  console.log('Channel compilation complete');
}); 