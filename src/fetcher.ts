import {Server} from "./server.ts";
import {createTransport} from "@graphiql/toolkit";
import {findCurrentServer, STORE_STATUS} from "./store.ts";
import {Transport, TransportRequest, TransportResponse} from "@graphiql/toolkit/src/create-transport/types.ts";
import {getValidToken} from "./auth-token-manager.ts";


async function* mapper(
    mapper: (r: TransportResponse) => TransportResponse = r => r,
    iter: AsyncIterable<TransportResponse>): AsyncIterable<TransportResponse> {
    for await (const req of iter) {
        yield mapper(req)
    }
}


async function addAuth(server: Server, req: TransportRequest, requestStart: Date): Promise<TransportRequest> {
    if (server.oauth) {
        try {
            const tokenData = await getValidToken(server);
            if (tokenData) {
                const {accessToken, expiresAt} = tokenData;
                if (req.headers) {
                    req.headers['Authorization'] = `Bearer ${accessToken}`;
                } else {
                    throw Error(`headers field not found in request object ${req}`)
                }
                STORE_STATUS.setSome({
                    lastAuthResponse: {
                        status: `Token OK, expires at ${new Date(expiresAt).toTimeString()} sec.`,
                        success: true,
                        timestampLocal: requestStart.toLocaleString()
                    }
                })
            } else {
                STORE_STATUS.setSome({
                    lastAuthResponse: {
                        status: `No token fetched, see console`,
                        success: false,
                        timestampLocal: requestStart.toLocaleString()
                    }
                })
            }
        } catch (error) {
            console.error("OAuth authentication error:", error);
            STORE_STATUS.setSome({
                lastAuthResponse: {
                    status: `Error fetching token, see console (${error})`,
                    success: false,
                    timestampLocal: requestStart.toLocaleString()
                }
            })
        }
    } else {
        STORE_STATUS.setSome({
            lastAuthResponse: undefined
        })
    }
    return req
}

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
        send(request: TransportRequest) {

            let now = new Date();
            const server: Server = findCurrentServer();

            const req = {...request};
            req.headers = {...req.headers};

            for (let header of server.headers || []) {
                req.headers[header.name] = header.value;
            }
            try {
                const resolver = transport.send(request)

                if ('return' in resolver) {
                    const iterator = (transport.send(request) as AsyncIterableIterator<TransportResponse>)

                    return mapper(r => {
                        STORE_STATUS.setSome({
                            lastResponse: {
                                body: r.body,
                                status: r.status + ' ' + r.statusText,
                                success: r.ok,
                                operationName: '',
                                length: r.size.response,
                                duration: r.timing.totalMs,
                                timestamp: now.valueOf(),
                                timestampLocal: now.toLocaleString()
                            }
                        })
                        return r;
                    }, iterator)
                } else {
                    return addAuth(server, req, now)
                        .then(() => resolver as Promise<TransportResponse>)
                        .then(r => {
                            STORE_STATUS.setSome({
                                lastResponse: {
                                    body: r.body,
                                    status: r.status + ' ' + r.statusText,
                                    success: r.ok,
                                    operationName: '',
                                    length: r.size.response,
                                    duration: r.timing.totalMs,
                                    timestamp: now.valueOf(),
                                    timestampLocal: now.toLocaleString()
                                }
                            })
                            return r;
                        });
                }

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
        }
    }
}

