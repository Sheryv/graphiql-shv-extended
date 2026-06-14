import {Server} from "./server.ts";
import {Fetcher} from "@graphiql/toolkit";
import {FetcherOpts, FetcherParams} from "@graphiql/toolkit/src/create-fetcher/types.ts";
import {getValidToken} from "./auth-token-manager.ts";
import {findCurrentServer, STORE_STATUS} from "./store.ts";


export default function createFetcher(): Fetcher {
    console.log('Fetcher created');

    return async (graphQLParams: FetcherParams, fetcherOpts?: FetcherOpts) => {
        let now = new Date();
        try {
            const server: Server = findCurrentServer();

            const headers = {
                Accept: 'application/graphql-response+json, application/json;q=0.9',
                'Content-Type': 'application/json',

            } as Record<string, string>;


            for (let header of server.headers || []) {
                headers[header.name] = header.value;
            }

            if (server.oauth) {
                try {
                    const tokenData = await getValidToken(server);
                    if (tokenData) {
                        const {accessToken, expiresAt} = tokenData;
                        headers['Authorization'] = `Bearer ${accessToken}`;
                        STORE_STATUS.setSome({
                            lastAuthResponse: {
                                status: `Token OK, expires in ${(expiresAt - now.valueOf()) / 1000} sec.`,
                                success: true,
                                timestampLocal: now.toLocaleString()
                            }
                        })
                    } else {
                        STORE_STATUS.setSome({
                            lastAuthResponse: {
                                status: `No token fetched, see console`,
                                success: false,
                                timestampLocal: now.toLocaleString()
                            }
                        })
                    }
                } catch (error) {
                    console.error("OAuth authentication error:", error);
                    STORE_STATUS.setSome({
                        lastAuthResponse: {
                            status: `Error fetching token, see console (${error})`,
                            success: false,
                            timestampLocal: now.toLocaleString()
                        }
                    })
                }
            } else {
                STORE_STATUS.setSome({
                    lastAuthResponse: undefined
                })
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
