import {Fetcher} from "@graphiql/toolkit";

export interface Indexable {
    [index: string]: any;
}

export interface Item extends Indexable {
    id: string;
}

export interface Settings {
    csvExportArrayPath: string;
    csvExportFields: string[];
    extractEmbedJsonPath: string;
}

interface ResponseStatus {
    status: string;
    success: boolean;
    body: any;
    duration: number;
    length?: number;
    operationName?: string;
    timestamp: number;
    timestampLocal: string;
}

export interface State {
    lastResponse?: ResponseStatus;
    fetcher?: Fetcher;
}


export const SETTINGS_DEFAULT: Settings = {
    csvExportArrayPath: '',
    csvExportFields: [],
    extractEmbedJsonPath: ''
}
