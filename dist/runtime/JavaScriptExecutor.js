import { MirthContext } from './MirthContext.js';
/**
 * JavaScriptExecutor executes JavaScript code in a Mirth-like context
 */
export class JavaScriptExecutor {
    constructor() {
        this.context = new MirthContext();
    }
    /**
     * Execute JavaScript code in the Mirth context
     */
    execute(script, message = null, connectorMessage = null) {
        // Initialize the context with the message
        this.context.initializeWithMessage(message, connectorMessage);
        // Get the context object with all Mirth variables and functions
        const contextObj = this.context.getContext();
        // Create a function from the script
        const scriptFunction = this.createFunction(script, Object.keys(contextObj));
        try {
            // Execute the function with the context
            return scriptFunction.apply(null, Object.values(contextObj));
        }
        catch (error) {
            this.context.logger.error(`Error executing script: ${error}`);
            throw error;
        }
    }
    /**
     * Create a function from a script with the given parameter names
     */
    createFunction(script, paramNames) {
        try {
            // Create a function with the given parameter names and script body
            return new Function(...paramNames, script);
        }
        catch (error) {
            this.context.logger.error(`Error creating function: ${error}`);
            throw error;
        }
    }
    /**
     * Get the Mirth context
     */
    getContext() {
        return this.context;
    }
}
//# sourceMappingURL=JavaScriptExecutor.js.map