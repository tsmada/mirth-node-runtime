import { Logger } from '../utils/Logger.js';
/**
 * MirthContext represents the JavaScript execution context in Mirth Connect.
 * It provides access to global variables, maps, and utility functions.
 */
export declare class MirthContext {
    private globalMap;
    private globalChannelMap;
    private channelMap;
    private connectorMap;
    private responseMap;
    logger: Logger;
    private message;
    private connectorMessage;
    constructor();
    /**
     * Initialize the context with a message
     */
    initializeWithMessage(message: any, connectorMessage: any): void;
    /**
     * Clear channel-specific maps
     */
    clearChannelMaps(): void;
    /**
     * Get the JavaScript context object with all Mirth variables and functions
     */
    getContext(): Record<string, any>;
    /**
     * Create a proxy for a Map to make it behave like a JavaScript object
     */
    private createMapProxy;
    /**
     * Map accessor function for $g, $gc, $c, $co, $r
     */
    private mapAccessor;
    /**
     * Validate function from Mirth
     */
    private validate;
    /**
     * Create a new XML segment
     */
    private createSegment;
    /**
     * Create a segment after another segment
     */
    private createSegmentAfter;
    /**
     * Get the length of an array or XML object
     */
    private getArrayOrXmlLength;
    /**
     * XML constructor function
     */
    private xmlConstructor;
    /**
     * XMLList constructor function
     */
    private xmlListConstructor;
    /**
     * Create a new String but leave undefined/null values alone
     */
    private newStringOrUndefined;
    /**
     * Create a new Boolean but leave undefined/null values alone
     */
    private newBooleanOrUndefined;
    /**
     * Create a new Number but leave undefined/null values alone
     */
    private newNumberOrUndefined;
}
