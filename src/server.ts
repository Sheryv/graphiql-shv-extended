import {Item} from "./types.ts";

export type OAuthFlowType = 'direct' | 'standard' | 'servicea';

export class OAuth {
    constructor(public clientId: string,
                public realm: string,
                public flowType: OAuthFlowType = 'direct',
                public tokenUrl?: string,
                public redirectUri?: string,
                public authViaUIUrl?: string,
                public clientSecret?: string,
                public username?: string,
                public password?: string) {
    }

    buildTokenUrl(baseUrl: string) {
        return this.tokenUrl ?? baseUrl.replace(/\/graphql$/, '') + `/auth/realms/${this.realm}/protocol/openid-connect/token`;
    }

    // Computes the Keycloak login page URL for standard flow
    buildAuthUrl(baseUrl: string) {
        const base = this.authViaUIUrl ??  this.tokenUrl?.replace(/\/token$/, '/auth') ?? baseUrl.replace(/\/graphql$/, '') + `/auth/realms/${this.realm}/protocol/openid-connect/auth`;
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri || window.location.origin,
            response_type: 'code',
            scope: 'openid'
        });
        return `${base}?${params.toString()}`;
    }
}

export class Server implements Item {

    constructor(
        public name: string,
        public url: string,
        public headers: Record<string, string>[] = [],
        public oauth: OAuth | null = null,
        public id: string = Math.random().toString(36).substring(2, 8)
    ) {
    }


}
