# Mirth Node.js Runtime

A Node.js TypeScript runtime for Mirth Connect that allows you to develop, test, and deploy Mirth channels using modern JavaScript and TypeScript.

## Overview

This project provides a hybrid JavaScript execution context that simulates the Mirth Connect runtime in a Node.js environment. It allows developers to write Mirth channel code in TypeScript with full IDE support, then compile and deploy it to Mirth Connect.

## Features

- Write Mirth channel code in TypeScript with full IDE support
- Test channels locally without deploying to Mirth Connect
- Compile TypeScript channels to Mirth-compatible JavaScript
- Deploy channels directly to Mirth Connect
- Support for MLLP and other connectors
- Maintain compatibility with Mirth Connect's JavaScript environment

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mirth-node-runtime.git

# Install dependencies
cd mirth-node-runtime
npm install

# Build the project
npm run build
```

## Usage

### Running the Runtime

To start the runtime in development mode:

```bash
npm run dev
```

This will start the runtime and load any channels in the `channels` directory or the `test-channel.xml` file in the project root.

### Creating a Channel

Create a new TypeScript file in the `src/channels` directory:

```typescript
/**
 * Sample Mirth Channel in TypeScript
 */
export const channel = {
  id: "sample-channel-ts",
  name: "Sample TypeScript Channel",
  description: "A sample channel created in TypeScript",
  
  /**
   * Preprocessor script
   */
  preprocessor() {
    // This script executes once when a message is received
    logger.info("Preprocessing message");
    return message;
  },
  
  /**
   * Source filter
   */
  sourceFilter() {
    if (msg['MSH'] != '') {
      logger.info('Message has MSH segment, passing filter');
      return true;
    }
    
    logger.info('Message does not have MSH segment, filtering out');
    return false;
  },
  
  /**
   * Source transformer
   */
  sourceTransformer() {
    logger.info("Transforming source message");
    logger.info(msg);
    return msg;
  },
  
  /**
   * Destination 1: File Writer
   */
  destination("File Writer") {
    /**
     * Destination filter
     */
    filter() {
      logger.info("Checking destination filter");
      return true;
    },
    
    /**
     * Destination transformer
     */
    transformer() {
      logger.info("Transforming for destination");
      return msg;
    }
  },
  
  /**
   * Postprocessor script
   */
  postprocessor() {
    // This script executes once after a message has been processed
    logger.info("Postprocessing message");
    return;
  },
  
  /**
   * Deploy script
   */
  deploy() {
    // This script executes once when the channel is deployed
    logger.info("Deploying channel");
    $gc('deployTime', new Date().toISOString());
    return;
  },
  
  /**
   * Undeploy script
   */
  undeploy() {
    // This script executes once when the channel is undeployed
    logger.info("Undeploying channel");
    return;
  }
};
```

### Compiling a Channel

To compile a TypeScript channel to a Mirth-compatible XML file:

```bash
npm run compile-channel src/channels/sample-channel.ts
```

This will create a `sample-channel.xml` file that can be imported into Mirth Connect.

### Deploying a Channel

To deploy a channel directly to Mirth Connect:

```bash
npm run deploy-channel sample-channel.xml https://localhost:8443 admin admin
```

Or set environment variables:

```bash
export MIRTH_URL=https://localhost:8443
export MIRTH_USERNAME=admin
export MIRTH_PASSWORD=admin
npm run deploy-channel sample-channel.xml
```

## Architecture

### Hybrid JavaScript Execution Context

The runtime creates a JavaScript execution context that mimics the Mirth Connect environment. It provides the same global variables, functions, and objects that are available in Mirth Connect, such as:

- `logger` for logging
- `msg` for accessing the current message
- `globalMap`, `globalChannelMap`, `channelMap`, `connectorMap`, and `responseMap` for storing data
- `$g`, `$gc`, `$c`, `$co`, and `$r` for accessing maps
- XML handling functions

### JavaScript Compatibility

The runtime ensures compatibility between the Node.js environment and Mirth Connect's JavaScript environment by:

- Using a proxy-based approach to simulate Mirth's Java objects
- Providing the same API for accessing message data and maps
- Handling XML in a way that's compatible with Mirth's E4X-like syntax

### Channel Components

The runtime supports all the components of a Mirth channel:

- Source and destination connectors
- Filters and transformers
- Preprocessor, postprocessor, deploy, and undeploy scripts
- Message formats (HL7, XML, JSON)

### Developer Experience Improvements

The runtime enhances the developer experience by:

- Allowing the use of modern JavaScript (ESNext) and TypeScript
- Providing full IDE support with code completion and type checking
- Enabling local testing without deploying to Mirth Connect
- Supporting debugging and telemetry

## Testing

To run the tests:

```bash
npm test
```

## License

This project is licensed under the ISC License. 