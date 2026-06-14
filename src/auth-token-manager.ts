import {OAuth, Server} from "./server.ts";

interface TokenStorage {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number; // Timestamp in ms
}


export function buildServer(defaults: Omit<Server, 'id'>): Server {
    const d: Server = {
        name: defaults.name,
        url: defaults.url,
        headers: [],
        id: Math.random().toString(36).substring(2, 8),
    }

    return Object.assign(d, defaults);
}

export function buildOAuth(defaults: OAuth): OAuth {
    const d: OAuth = {
        clientId: defaults.clientId,
        realm: defaults.realm,
        flowType: 'direct',
    }

    return Object.assign(d, defaults);
}


// Helper to decode JWT expiration without bringing in a heavy library
function isTokenExpired(tokenData: TokenStorage | null): boolean {
    if (!tokenData || !tokenData.accessToken) return true;

    const buffer = 15000;

    // 1. Primary Check: Use the stored timestamp (Fast)
    if (tokenData.expiresAt) {
        return tokenData.expiresAt < (Date.now() + buffer);
    }

    // 2. Fallback Check: Parse the JWT if the timestamp is somehow missing (Safe)
    try {
        const base64Url = tokenData.accessToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        return (payload.exp * 1000) < (Date.now() + buffer);
    } catch {
        return true; // If parsing fails, treat it as expired/invalid
    }
}


export function buildTokenUrl(oath: OAuth, baseUrl: string) {
    return oath.tokenUrl || baseUrl.replace(/\/graphql$/, '') + `/auth/realms/${oath.realm}/protocol/openid-connect/token`;
}

// Computes the Keycloak login page URL for standard flow
function buildAuthUrl(oath: OAuth, baseUrl: string) {
    const base = oath.authViaUIUrl || oath.tokenUrl?.replace(/\/token$/, '/auth') || baseUrl.replace(/\/graphql$/, '') + `/auth/realms/${oath.realm}/protocol/openid-connect/auth`;
    const params = new URLSearchParams({
        client_id: oath.clientId,
        redirect_uri: oath.redirectUri || window.location.origin,
        response_type: 'code',
        scope: 'openid'
    });
    return `${base}?${params.toString()}`;
}

export async function getValidToken(server: Server): Promise<TokenStorage | null> {
    const oauth = server.oauth;
    if (!oauth) return null;

    const storageKey = `graphiql-extended:token_${server.id}`;
    const storedDataStr = localStorage.getItem(storageKey);
    let tokenData: TokenStorage | null = storedDataStr ? JSON.parse(storedDataStr) : null;

    // 1. Check if we already have a valid access token
    if (tokenData && !isTokenExpired(tokenData)) {
        return tokenData;
    }

    const tokenUrl = buildTokenUrl(oauth, server.url);

    // 2. Try to refresh the token if we have a refresh token
    if (tokenData?.refreshToken && isTokenExpired(tokenData)) {
        try {
            const body = new URLSearchParams({
                client_id: oauth.clientId,
                grant_type: 'refresh_token',
                refresh_token: tokenData.refreshToken,
            });
            if (oauth.clientSecret) body.append('client_secret', oauth.clientSecret);

            const res = await fetch(tokenUrl, {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: body.toString(),
            });

            if (res.ok) {
                const data = await res.json();
                const updatedData: TokenStorage = {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token || tokenData.refreshToken,
                    expiresAt: Date.now() + (data.expires_in * 1000)
                };
                localStorage.setItem(storageKey, JSON.stringify(updatedData));
                return updatedData;
            }
        } catch (e) {
            console.error("Failed to refresh token, falling back to full authentication", e);
        }
    }

    // 3. Authenticate from scratch based on selected Flow Type
    if (oauth.flowType === 'direct' || oauth.flowType === 'servicea') {

        let body: URLSearchParams;
        if (oauth.flowType === 'direct') {

            // Direct Access Grant Flow
            if (!oauth.username || !oauth.password) {
                throw new Error("Username and password are required for Direct Access flow.");
            }

            body = new URLSearchParams({
                client_id: oauth.clientId,
                grant_type: 'password',
                username: oauth.username,
                password: oauth.password,
                scope: 'openid',
            });
        } else {
            if (!oauth.clientSecret) {
                throw new Error("Client secret is required for ServiceAccount flow.");
            }

            body = new URLSearchParams({
                client_id: oauth.clientId,
                grant_type: 'client_credentials',
                client_secret: oauth.clientSecret,
                scope: 'openid',
            });
        }

        const res = await fetch(tokenUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: body.toString(),
        });

        if (!res.ok) throw new Error(`OIDC ${oauth.flowType} auth failed: ${res.statusText}`);

        const data = await res.json();
        const newData: TokenStorage = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: Date.now() + (data.expires_in * 1000)
        };
        localStorage.setItem(storageKey, JSON.stringify(newData));
        return newData;

    } else if (oauth.flowType === 'standard') {
        // Standard Flow (Authorization Code)
        // Check if we are returning from Keycloak with a 'code' in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            // Exchange code for tokens
            const body = new URLSearchParams({
                client_id: oauth.clientId,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: oauth.redirectUri || window.location.origin,
            });
            // if (oauth.clientSecret) body.append('client_secret', oauth.clientSecret);

            // Clear the code from URL immediately so refreshes don't break
            window.history.replaceState({}, document.title, window.location.pathname);

            const res = await fetch(tokenUrl, {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: body.toString(),
            });

            if (!res.ok) throw new Error(`OIDC code exchange failed: ${res.statusText}`);

            const data = await res.json();
            const newData: TokenStorage = {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: Date.now() + (data.expires_in * 1000)
            };
            localStorage.setItem(storageKey, JSON.stringify(newData));
            return newData;
        } else {
            // No token, no code in URL: Redirect user to Keycloak login page
            window.location.href = buildAuthUrl(oauth, server.url);
            // Block execution while redirect happens
            await new Promise(() => {

            })
            return null;
        }
    }

    return null;
}
