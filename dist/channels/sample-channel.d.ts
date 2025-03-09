/**
 * Sample Mirth Channel in TypeScript
 */
export declare const channel: {
    id: string;
    name: string;
    description: string;
    /**
     * Preprocessor script
     */
    preprocessor(): any;
    /**
     * Source filter
     */
    sourceFilter(): boolean;
    /**
     * Source transformer
     */
    sourceTransformer(): any;
    /**
     * Destination configurations
     */
    destinations: {
        name: string;
        /**
         * Destination filter
         */
        filter(): boolean;
        /**
         * Destination transformer
         */
        transformer(): any;
    }[];
    /**
     * Postprocessor script
     */
    postprocessor(): void;
    /**
     * Deploy script
     */
    deploy(): void;
    /**
     * Undeploy script
     */
    undeploy(): void;
};
