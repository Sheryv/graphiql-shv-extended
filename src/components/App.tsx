import {GraphiQL, HISTORY_PLUGIN} from 'graphiql';
import 'graphiql/style.css';
import {Fetcher} from '@graphiql/toolkit';
import type {FetcherOpts, FetcherParams} from "@graphiql/toolkit/src/create-fetcher/types.ts";
import {Server} from "../server.ts";
import {STORE_SELECTED, STORE_SERVERS, STORE_SETTINGS, STORE_STATUS} from "../store.ts";
import {useState} from "react";
import ServerManagement from "./ServerManagement.tsx";
import {getValidToken} from "../auth-token-manager.ts";
import {ToolbarButton} from '@graphiql/react';

import {explorerPlugin as createExplorerPlugin} from '@graphiql/plugin-explorer';
import '@graphiql/plugin-explorer/style.css';
import ExportResponseAs from "./ExportResponseAs.tsx";
import ExtractEmbedJson from "./ExtractEmbedJson.tsx";


function createFetcher(server: Server): Fetcher {
    return async (graphQLParams: FetcherParams, fetcherOpts?: FetcherOpts) => {
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

        const response = await fetch(server.url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(graphQLParams),
        });
        return response.json();
    }
}


function App() {
    const server = STORE_SELECTED.asState()
    const list = STORE_SERVERS.asState()
    const status = STORE_STATUS.asState()
    const settings = STORE_SETTINGS.asState()

    let fetcher = createFetcher(server);
    let lastId: string | null = null
    STORE_SELECTED.subscribe(s => {
        if (lastId && lastId == s.id) {

        } else {
            console.log('server changed to ', s);

            fetcher = createFetcher(s)
            lastId = s.id
        }
    });
    STORE_SERVERS.subscribe(s => {
        fetcher = createFetcher(server)
        lastId = server.id
    });

    const [dialog, setDialog] = useState(false);

    const optionchanged = (e: any) => {
        console.log(list[e.target.selectedIndex]);
        STORE_SELECTED.update(list[e.target.selectedIndex]);
    };
    const explorerPlugin = createExplorerPlugin({
        showAttribution: false,
    });

    const btn = (<ToolbarButton
        onClick={() => console.log("clicked")}
        label="Dropdown"
    >^</ToolbarButton>)

    return (
        <div className="wrapper">
            <div className="s-topbar">
                <div>Endpoint:&nbsp;</div>
                <select onChange={e => optionchanged(e)} value={server.id}>
                    {list.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} - {s.url}</option>
                    ))}
                </select>
                <button type="button" aria-label="Open settings dialog"
                        className="s-icon-btn" onClick={e => setDialog(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 21 20"
                         aria-hidden="true">
                        <path fill="currentColor" fill-rule="evenodd"
                              d="M9.292 1.927a1.7 1.7 0 0 1-.584-.427L7.866.575A1.741 1.741 0 0 0 4.84 1.83l.064 1.25a1.743 1.743 0 0 1-1.828 1.827l-1.245-.064A1.741 1.741 0 0 0 .575 7.876l.925.836a1.733 1.733 0 0 1 0 2.584l-.925.836a1.742 1.742 0 0 0 1.25 3.028l1.246-.064a1.74 1.74 0 0 1 1.828 1.828l-.064 1.245a1.741 1.741 0 0 0 3.031 1.256l.847-.925a1.732 1.732 0 0 1 2.584 0l.836.925a1.741 1.741 0 0 0 3.031-1.256l-.064-1.245a1.743 1.743 0 0 1 1.828-1.828l1.245.064a1.74 1.74 0 0 0 1.256-3.032l-.925-.836a1.732 1.732 0 0 1 0-2.584l.925-.836a1.742 1.742 0 0 0-1.255-3.032l-1.246.064A1.743 1.743 0 0 1 15.1 3.076l.064-1.245A1.742 1.742 0 0 0 12.133.575l-.842.925a1.73 1.73 0 0 1-2 .427M14.375 10a4.375 4.375 0 1 1-8.75 0 4.375 4.375 0 0 1 8.75 0"
                              clip-rule="evenodd"></path>
                    </svg>
                </button>


            </div>

            <div className="s-dialog container-fluid " style={{display: dialog ? "flex" : "none"}}>
                <div className="">
                    <ServerManagement dialog={setDialog}/>
                </div>
            </div>


            <GraphiQL fetcher={fetcher} plugins={[explorerPlugin, HISTORY_PLUGIN]}>
                <GraphiQL.Footer>
                    <div className="d-flex justify-content-between">
                        {status.lastResponse ?
                            (<div
                                className={`d-flex align-items-center ${status.lastResponse.success ? 'text-success-emphasis' : 'text-danger-emphasis'}`}
                                aria-label={status.lastResponse.timestampLocal}>
                                {status.lastResponse.status}
                            </div>)
                            :
                            (<div></div>)
                        }
                        <div className="d-flex">
                            <ExtractEmbedJson/>
                            <ExportResponseAs/>
                        </div>
                    </div>
                </GraphiQL.Footer>


            </GraphiQL>
        </div>
    );
}

export default App;
