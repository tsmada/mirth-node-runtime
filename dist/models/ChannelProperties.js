export class ChannelProperties {
    constructor() {
        this.clearGlobalChannelMap = true;
        this.messageStorageMode = 'DEVELOPMENT';
        this.encryptData = false;
        this.removeContentOnCompletion = false;
        this.removeAttachmentsOnCompletion = false;
        this.initialState = 'STARTED';
        this.storeAttachments = false;
        this.metaDataColumns = [];
        this.archiveEnabled = true;
    }
    static fromXml(xmlObj) {
        const properties = new ChannelProperties();
        if (xmlObj) {
            properties.clearGlobalChannelMap = xmlObj.clearGlobalChannelMap === 'true';
            properties.messageStorageMode = xmlObj.messageStorageMode || 'DEVELOPMENT';
            properties.encryptData = xmlObj.encryptData === 'true';
            properties.removeContentOnCompletion = xmlObj.removeContentOnCompletion === 'true';
            properties.removeAttachmentsOnCompletion = xmlObj.removeAttachmentsOnCompletion === 'true';
            properties.initialState = xmlObj.initialState || 'STARTED';
            properties.storeAttachments = xmlObj.storeAttachments === 'true';
            properties.archiveEnabled = xmlObj.archiveEnabled === 'true';
            // Parse metadata columns
            if (xmlObj.metaDataColumns && xmlObj.metaDataColumns.metaDataColumn) {
                const columns = Array.isArray(xmlObj.metaDataColumns.metaDataColumn)
                    ? xmlObj.metaDataColumns.metaDataColumn
                    : [xmlObj.metaDataColumns.metaDataColumn];
                properties.metaDataColumns = columns;
            }
        }
        return properties;
    }
}
//# sourceMappingURL=ChannelProperties.js.map