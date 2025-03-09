import { Logger } from '../utils/Logger.js';
/**
 * MirthContext represents the JavaScript execution context in Mirth Connect.
 * It provides access to global variables, maps, and utility functions.
 */
export class MirthContext {
    constructor() {
        this.globalMap = new Map();
        this.globalChannelMap = new Map();
        this.channelMap = new Map();
        this.connectorMap = new Map();
        this.responseMap = new Map();
        this.logger = new Logger();
        this.message = null;
        this.connectorMessage = null;
    }
    /**
     * Initialize the context with a message
     */
    initializeWithMessage(message, connectorMessage) {
        this.message = message;
        this.connectorMessage = connectorMessage;
    }
    /**
     * Clear channel-specific maps
     */
    clearChannelMaps() {
        this.channelMap.clear();
        this.connectorMap.clear();
        this.responseMap.clear();
    }
    /**
     * Get the JavaScript context object with all Mirth variables and functions
     */
    getContext() {
        return {
            // Maps
            globalMap: this.createMapProxy(this.globalMap),
            globalChannelMap: this.createMapProxy(this.globalChannelMap),
            channelMap: this.createMapProxy(this.channelMap),
            connectorMap: this.createMapProxy(this.connectorMap),
            responseMap: this.createMapProxy(this.responseMap),
            // Map accessor functions
            $g: (key, value) => this.mapAccessor(this.globalMap, key, value),
            $gc: (key, value) => this.mapAccessor(this.globalChannelMap, key, value),
            $c: (key, value) => this.mapAccessor(this.channelMap, key, value),
            $co: (key, value) => this.mapAccessor(this.connectorMap, key, value),
            $r: (key, value) => this.mapAccessor(this.responseMap, key, value),
            // Logger
            logger: this.logger,
            // Message data
            msg: this.message,
            message: this.message,
            connectorMessage: this.connectorMessage,
            // Utility functions
            validate: this.validate.bind(this),
            createSegment: this.createSegment.bind(this),
            createSegmentAfter: this.createSegmentAfter.bind(this),
            getArrayOrXmlLength: this.getArrayOrXmlLength.bind(this),
            // XML handling
            XML: this.xmlConstructor.bind(this),
            XMLList: this.xmlListConstructor.bind(this),
            // String conversion helpers
            new: {
                String: (value) => String(value),
                Boolean: (value) => Boolean(value),
                Number: (value) => Number(value)
            },
            // Type conversion helpers
            newStringOrUndefined: this.newStringOrUndefined.bind(this),
            newBooleanOrUndefined: this.newBooleanOrUndefined.bind(this),
            newNumberOrUndefined: this.newNumberOrUndefined.bind(this)
        };
    }
    /**
     * Create a proxy for a Map to make it behave like a JavaScript object
     */
    createMapProxy(map) {
        return new Proxy(map, {
            get: (target, prop) => {
                if (typeof prop === 'string') {
                    if (prop === 'get') {
                        return (key) => target.get(key);
                    }
                    else if (prop === 'put') {
                        return (key, value) => {
                            target.set(key, value);
                            return value;
                        };
                    }
                    else if (prop === 'clear') {
                        return () => target.clear();
                    }
                    else {
                        return target.get(prop);
                    }
                }
                return undefined;
            },
            set: (target, prop, value) => {
                if (typeof prop === 'string') {
                    target.set(prop, value);
                }
                return true;
            }
        });
    }
    /**
     * Map accessor function for $g, $gc, $c, $co, $r
     */
    mapAccessor(map, key, value) {
        if (arguments.length === 2) {
            return map.get(key);
        }
        else {
            map.set(key, value);
            return value;
        }
    }
    /**
     * Validate function from Mirth
     */
    validate(mapping, defaultValue, replacement) {
        let result = mapping;
        if (result === undefined || result === null || result.toString().length === 0) {
            result = defaultValue !== undefined ? defaultValue : '';
        }
        if (typeof result === 'string' || result instanceof String) {
            result = String(result);
            if (replacement !== undefined) {
                for (const [from, to] of replacement) {
                    result = result.replace(new RegExp(from, 'g'), to);
                }
            }
        }
        return result;
    }
    /**
     * Create a new XML segment
     */
    createSegment(name, msgObj, index) {
        if (arguments.length === 1) {
            return this.xmlConstructor(`<${name}></${name}>`);
        }
        if (arguments.length === 2) {
            index = 0;
        }
        if (!msgObj[name]) {
            msgObj[name] = [];
        }
        msgObj[name][index] = this.xmlConstructor(`<${name}></${name}>`);
        return msgObj[name][index];
    }
    /**
     * Create a segment after another segment
     */
    createSegmentAfter(name, segment) {
        // This is a simplified implementation
        return this.xmlConstructor(`<${name}></${name}>`);
    }
    /**
     * Get the length of an array or XML object
     */
    getArrayOrXmlLength(obj) {
        if (typeof obj === 'string' || (obj && typeof obj.length === 'function')) {
            return obj.length();
        }
        else if (obj !== undefined && obj !== null) {
            return obj.length || 0;
        }
        return 0;
    }
    /**
     * XML constructor function
     */
    xmlConstructor(xml) {
        // In a real implementation, this would parse XML and return an E4X-like object
        // For simplicity, we're using a basic implementation
        try {
            return {
                _xml: xml,
                toString: () => xml,
                toXMLString: () => xml
            };
        }
        catch (e) {
            this.logger.error('Error creating XML: ' + e);
            return { _xml: '', toString: () => '', toXMLString: () => '' };
        }
    }
    /**
     * XMLList constructor function
     */
    xmlListConstructor() {
        // Simplified implementation
        return [];
    }
    /**
     * Create a new String but leave undefined/null values alone
     */
    newStringOrUndefined(value) {
        if (value !== undefined && value !== null) {
            return String(value);
        }
        return value;
    }
    /**
     * Create a new Boolean but leave undefined/null values alone
     */
    newBooleanOrUndefined(value) {
        if (value !== undefined && value !== null) {
            return Boolean(value);
        }
        return value;
    }
    /**
     * Create a new Number but leave undefined/null values alone
     */
    newNumberOrUndefined(value) {
        if (value !== undefined && value !== null) {
            return Number(value);
        }
        return value;
    }
}
//# sourceMappingURL=MirthContext.js.map