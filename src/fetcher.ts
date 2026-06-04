import {Server} from "./server.ts";
import {Fetcher} from "@graphiql/toolkit";
import {FetcherOpts, FetcherParams} from "@graphiql/toolkit/src/create-fetcher/types.ts";
import {getValidToken} from "./auth-token-manager.ts";
import {STORE_STATUS} from "./store.ts";


export default function createFetcher(server: Server): Fetcher {
    console.log('Fetcher created for ' + server.name);

    return async (graphQLParams: FetcherParams, fetcherOpts?: FetcherOpts) => {
        let now = new Date();
        try {
            const headers = {
                Accept: 'application/graphql-response+json, application/json;q=0.9',
                'Content-Type': 'application/json',

            } as Record<string, string>;


            for (let header of server.headers) {
                headers[header.name] = header.value;
            }

            if (server.oauth) {
                try {
                    const token = await getValidToken(server);
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }
                } catch (error) {
                    console.error("OAuth authentication error:", error);
                    // Depending on requirements, you might want to throw or fallback silently
                    throw error;
                }
            }

            now = new Date();
            const response = await fetch(server.url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(graphQLParams),
            });
            let contentLength = response.headers.get('content-length');

            const json = await response.json();

            const duration = Date.now() - now.valueOf();
            now = new Date();
            STORE_STATUS.setSome({
                lastResponse: {
                    body: json,
                    status: response.status + ' ' + response.statusText,
                    success: response.ok,
                    operationName: graphQLParams.operationName || undefined,
                    length: contentLength && Number(contentLength) || undefined,
                    duration: duration,
                    timestamp: now.valueOf(),
                    timestampLocal: now.toLocaleString()
                }
            })

            return json;
        } catch (error) {
            const duration = Date.now() - now.valueOf();
            now = new Date();
            STORE_STATUS.setSome({
                lastResponse: {
                    body: '' + error,
                    status: 'ERROR',
                    success: false,
                    duration: duration,
                    timestamp: now.valueOf(),
                    timestampLocal: now.toLocaleString()
                }
            })
        }
    }
}
