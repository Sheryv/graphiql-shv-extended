export interface Item {
    id: string;
}

export interface Indexable {
    [index: string]: any;
}

export interface Settings {
    csvExportArrayPath: string;
    csvExportFields: string[];
    extractEmbedJsonPath: string;
}

interface ResponseStatus {
    status: string;
    success: boolean;
    body: string;
    timestamp: number;
    timestampLocal: string;
}

export interface State {
    lastResponse?: ResponseStatus;
}


export const SETTINGS_DEFAULT: Settings = {
    csvExportArrayPath: '',
    csvExportFields: [],
    extractEmbedJsonPath: ''
}
