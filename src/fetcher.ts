import {Server} from "./server.ts";
import {createTransport} from "@graphiql/toolkit";
import {getValidToken} from "./auth-token-manager.ts";
import {findCurrentServer, STORE_STATUS} from "./store.ts";
import {Transport, TransportRequest, TransportResponse} from "@graphiql/toolkit/src/create-transport/types.ts";
import type {FetcherParams} from "@graphiql/toolkit/src/create-fetcher/types.ts";
import {map, pipe, pipeAsync} from "iter-ops";


export default function createTransportWrapper(): Transport {
    console.log('Fetcher created');
    const transport = createTransport({
        url: findCurrentServer().url,

    });



    return {
        url: transport.url,
        method: transport.method,
        supportedMethods: transport.supportedMethods,
        methodOverride: transport.methodOverride,
        setMethod: transport.setMethod,
        subscribe: transport.subscribe,
        async send(request: TransportRequest) {


            let now = new Date();
            const server: Server = findCurrentServer();

            const req = {...request};
            req.headers = {...req.headers};

            for (let header of server.headers || []) {
                req.headers[header.name] = header.value;
            }
            try {
                if (server.oauth) {
                    try {
                        const tokenData = await getValidToken(server);
                        if (tokenData) {
                            const {accessToken, expiresAt} = tokenData;
                            req.headers['Authorization'] = `Bearer ${accessToken}`;
                            STORE_STATUS.setSome({
                                lastAuthResponse: {
                                    status: `Token OK, expires at ${new Date(expiresAt).toTimeString()} sec.`,
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


                // const response = pipeAsync(
                //     (transport.send(request) as AsyncIterable<TransportResponse>),
                //     map(r => {
                //         STORE_STATUS.setSome({
                //             lastResponse: {
                //                 body: r.body,
                //                 status: r.status + ' ' + r.statusText,
                //                 success: r.ok,
                //                 operationName: '',
                //                 length: r.size.response,
                //                 duration: r.timing.totalMs,
                //                 timestamp: now.valueOf(),
                //                 timestampLocal: now.toLocaleString()
                //             }
                //         })
                //         return r
                //     })
                // )

                return transport.send(request);
            } catch (error) {
                console.error("Request error:", error);

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
                throw error;
            }

            //
            // try {
            //     const params: FetcherParams = {
            //         query: request.query,
            //         operationName: request.operationName ?? undefined,
            //         variables: request.variables,
            //         extensions: request.extensions,
            //     };
            //     const server: Server = findCurrentServer();
            //
            //     const headers = {
            //         Accept: 'application/graphql-response+json, application/json;q=0.9',
            //         'Content-Type': 'application/json',
            //         ...request?.headers
            //
            //     } as Record<string, string>;
            //
            //
            //     for (let header of server.headers || []) {
            //         headers[header.name] = header.value;
            //     }
            //
            //
            //     now = new Date();
            //     const requestBody = JSON.stringify(params);
            //     const response = await fetch(server.url, {
            //         method: 'POST',
            //         headers: headers,
            //         body: requestBody,
            //     });
            //     let contentLength = response.headers.get('content-length');
            //
            //     const json = await response.json();
            //
            //     const duration = Date.now() - now.valueOf();
            //     now = new Date();
            //     STORE_STATUS.setSome({
            //         lastResponse: {
            //             body: json,
            //             status: response.status + ' ' + response.statusText,
            //             success: response.ok,
            //             operationName: request?.operationName || undefined,
            //             length: contentLength && Number(contentLength) || undefined,
            //             duration: duration,
            //             timestamp: now.valueOf(),
            //             timestampLocal: now.toLocaleString()
            //         }
            //     })
            //
            //     const res: TransportResponse = {
            //         ok: true,
            //         body: json,
            //         status: response.status,
            //         statusText: response.statusText,
            //         size: {
            //             request: requestBody.length,
            //             response: contentLength && Number(contentLength) || undefined,
            //         },
            //         timing: {
            //             totalMs: duration
            //         }
            //     }
            //
            //     return res;
            // } catch (error) {
            //     const duration = Date.now() - now.valueOf();
            //     now = new Date();
            //     STORE_STATUS.setSome({
            //         lastResponse: {
            //             body: '' + error,
            //             status: 'ERROR',
            //             success: false,
            //             duration: duration,
            //             timestamp: now.valueOf(),
            //             timestampLocal: now.toLocaleString()
            //         }
            //     })
            //     throw error;
            // }
        }
    }
}

