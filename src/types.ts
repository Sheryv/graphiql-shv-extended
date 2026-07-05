import {Fetcher} from "@graphiql/toolkit";
import {Server} from "./server.ts";

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
    lastAuthResponse?: {
        status: string;
        success: boolean;
        timestampLocal: string;
    };
    fetcher?: Fetcher;
}


export const SETTINGS_DEFAULT: Settings = {
    csvExportArrayPath: '',
    csvExportFields: [],
    extractEmbedJsonPath: ''
}

export interface GraphiqlTab {
    id: string;
    hash?: string;
    title: string;
    query: string;
    variables: string;
    headers?: any,
    operationName?: string;
    response?: string;
}

export interface ConfigExport {
    time: string;
    tabs: GraphiqlTab[];
    servers: Server[];
}
