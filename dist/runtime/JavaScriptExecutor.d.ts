import { MirthContext } from './MirthContext.js';
/**
 * JavaScriptExecutor executes JavaScript code in a Mirth-like context
 */
export declare class JavaScriptExecutor {
    private context;
    constructor();
    /**
     * Execute JavaScript code in the Mirth context
     */
    execute(script: string, message?: any, connectorMessage?: any): any;
    /**
     * Create a function from a script with the given parameter names
     */
    private createFunction;
    /**
     * Get the Mirth context
     */
    getContext(): MirthContext;
}
