import {Item} from "./types.ts";

export type OAuthFlowType = 'direct' | 'standard' | 'servicea';

export const AUTH_TYPES: { key: OAuthFlowType, name: string }[] = [
    {key: 'standard', name: 'Standard flow via GUI'},
    {key: 'direct', name: 'Direct access'},
    {key: 'servicea', name: 'Service account'}
];

export interface OAuth {
    clientId: string,
    realm: string,
    flowType: OAuthFlowType    ,
    tokenUrl?: string,
    redirectUri?: string,
    authViaUIUrl?: string,
    clientSecret?: string,
    username?: string,
    password?: string

}

export interface Server extends Item {
    name: string,
    url: string,
    headers?: Record<string, string>[],
    oauth?: OAuth,
    id: string
}
