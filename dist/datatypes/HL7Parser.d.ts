/**
 * HL7Parser parses HL7 messages into XML format
 */
export declare class HL7Parser {
    /**
     * Parse an HL7 message into an XML object
     */
    static parseToXml(hl7Message: string): any;
    /**
     * Convert an XML object back to an HL7 message
     */
    static convertToHl7(xmlObj: any): string;
    /**
     * Remove MLLP framing characters from an HL7 message
     */
    static removeMllpFraming(message: string): string;
    /**
     * Add MLLP framing characters to an HL7 message
     */
    static addMllpFraming(message: string): string;
}
