export declare class ChannelProperties {
    clearGlobalChannelMap: boolean;
    messageStorageMode: string;
    encryptData: boolean;
    removeContentOnCompletion: boolean;
    removeAttachmentsOnCompletion: boolean;
    initialState: string;
    storeAttachments: boolean;
    metaDataColumns: any[];
    archiveEnabled: boolean;
    constructor();
    static fromXml(xmlObj: any): ChannelProperties;
}
