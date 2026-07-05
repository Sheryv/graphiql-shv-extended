import {GraphiQL, HISTORY_PLUGIN} from 'graphiql';
import 'graphiql/style.css';
import {STORE_SELECTED, STORE_SERVERS, STORE_STATUS} from "../store.ts";
import React, {useState} from "react";
import ServerManagement from "./ServerManagement.tsx";
import {explorerPlugin as createExplorerPlugin} from '@graphiql/plugin-explorer';
import '@graphiql/plugin-explorer/style.css';
import ExportResponseAs from "./ExportResponseAs.tsx";
import ExtractEmbedJson from "./ExtractEmbedJson.tsx";
import createFetcher from "../fetcher.ts";
import ImportConfig from "./ImportConfig.tsx";
import {ToolbarButton} from "@graphiql/react";
import {exportConfig} from "../tools.ts";


let lastId: number | null = null
STORE_SELECTED.subscribe(s => {
    if (lastId != null && lastId === s) {

    } else {
        console.debug('Server changed to ', s, STORE_SERVERS.getSnapshot()[s]);
        lastId = s
    }
});
// STORE_SERVERS.subscribe(s => {
//     const selected = STORE_SELECTED.getSnapshot();
//     STORE_STATUS.getSnapshot().fetcher = createFetcher(selected)
//     lastId = selected.id
// });

const explorerPlugin = createExplorerPlugin({
    showAttribution: false,
});


function App() {
    const [dialog, setDialog] = useState(false);

    const serverIndex = STORE_SELECTED.asState()
    const list = STORE_SERVERS.asState()
    const status = STORE_STATUS.asState()

    if (!status.fetcher) {
        status.fetcher = createFetcher()
    }

    const optionchanged = (e: any) => {
        STORE_SELECTED.set(e.target.selectedIndex);
    };

    console.debug("Building App.tsx")

    return (
        <div className="wrapper">
            <div className="s-topbar">
                <div>Endpoint:&nbsp;</div>
                <select onChange={e => optionchanged(e)} value={serverIndex}>
                    {list.map((s, i) => (
                        <option key={i} value={i}>{s.name} - {s.url}</option>
                    ))}
                </select>
                <button type="button" aria-label="Configure servers"
                        title="Configure servers"
                        className="s-icon-btn" onClick={e => setDialog(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                        <path
                            d="M200-200h50.46l409.46-409.46-50.46-50.46L200-250.46V-200Zm-60 60v-135.38l527.62-527.39q9.07-8.24 20.03-12.73 10.97-4.5 23-4.5t23.3 4.27q11.28 4.27 19.97 13.58l48.85 49.46q9.31 8.69 13.27 20 3.96 11.31 3.96 22.62 0 12.07-4.12 23.03-4.12 10.97-13.11 20.04L275.38-140H140Zm620.38-570.15-50.23-50.23 50.23 50.23Zm-126.13 75.9-24.79-25.67 50.46 50.46-25.67-24.79Z"/>
                    </svg>
                </button>
                {/*<button type="button" aria-label="Open settings dialog"*/}
                {/*        title="Open settings dialog"*/}
                {/*        className="s-icon-btn" onClick={e => setDialog(true)}>*/}
                {/*    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 -2 20 24">*/}
                {/*        <path clip-rule="evenodd" fill-rule="center"*/}
                {/*            d="M9.292 1.927a1.7 1.7 0 0 1-.584-.427L7.866.575A1.741 1.741 0 0 0 4.84 1.83l.064 1.25a1.743 1.743 0 0 1-1.828 1.827l-1.245-.064A1.741 1.741 0 0 0 .575 7.876l.925.836a1.733 1.733 0 0 1 0 2.584l-.925.836a1.742 1.742 0 0 0 1.25 3.028l1.246-.064a1.74 1.74 0 0 1 1.828 1.828l-.064 1.245a1.741 1.741 0 0 0 3.031 1.256l.847-.925a1.732 1.732 0 0 1 2.584 0l.836.925a1.741 1.741 0 0 0 3.031-1.256l-.064-1.245a1.743 1.743 0 0 1 1.828-1.828l1.245.064a1.74 1.74 0 0 0 1.256-3.032l-.925-.836a1.732 1.732 0 0 1 0-2.584l.925-.836a1.742 1.742 0 0 0-1.255-3.032l-1.246.064A1.743 1.743 0 0 1 15.1 3.076l.064-1.245A1.742 1.742 0 0 0 12.133.575l-.842.925a1.73 1.73 0 0 1-2 .427M14.375 10a4.375 4.375 0 1 1-8.75 0 4.375 4.375 0 0 1 8.75 0"*/}
                {/*        ></path>*/}
                {/*    </svg>*/}
                {/*</button>*/}
                {status.lastAuthResponse ?
                    (<div className="d-flex">
                        <div>Auth:&nbsp;</div>
                        <div
                            className={`d-flex font-monospace align-items-center ${status.lastAuthResponse.success ? 'text-success-emphasis' : 'text-danger-emphasis'}`}
                            title={status.lastAuthResponse.timestampLocal}>
                            {status.lastAuthResponse.status}
                        </div>
                    </div>)
                    :
                    (<div></div>)
                }

            </div>

            <div className="s-dialog container-fluid " style={{display: dialog ? "flex" : "none"}}>
                <div className="">
                    <ServerManagement setVisible={setDialog} isVisible={dialog}/>
                </div>
            </div>


            <GraphiQL fetcher={status.fetcher} plugins={[explorerPlugin, HISTORY_PLUGIN]}>
                <GraphiQL.Toolbar>
                    {({merge, prettify, copy}) => (
                        <>
                            {prettify}
                            {merge}
                            {copy}
                            <ToolbarButton onClick={() => exportConfig()}
                                           label="Export configuration">
                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" width="24px"
                                     viewBox="0 -960 960 960" fill="currentColor" style={{opacity: 0.6}}>
                                    <path
                                        d="M172.31-180Q142-180 121-201q-21-21-21-51.31v-455.38Q100-738 121-759q21-21 51.31-21h182.3v60h-182.3q-4.62 0-8.46 3.85-3.85 3.84-3.85 8.46v455.38q0 4.62 3.85 8.46 3.84 3.85 8.46 3.85h615.38q4.62 0 8.46-3.85 3.85-3.84 3.85-8.46v-455.38q0-4.62-3.85-8.46-3.84-3.85-8.46-3.85h-182.3v-60h182.3Q818-780 839-759q21 21 21 51.31v455.38Q860-222 839-201q-21 21-51.31 21H172.31ZM480-354 293.85-540.15 336-582.31l114 114V-780h60v311.69l114-114 42.15 42.16L480-354Z"/>
                                </svg>
                            </ToolbarButton>
                            <ImportConfig/>
                        </>
                    )}
                </GraphiQL.Toolbar>
                <GraphiQL.Footer>
                    <div className="d-flex justify-content-between">
                        {status.lastResponse ?
                            (<div
                                className={`d-flex font-monospace align-items-center ${status.lastResponse.success ? 'text-success-emphasis' : 'text-danger-emphasis'}`}
                                title={status.lastResponse.timestampLocal}>
                                {status.lastResponse.status}, {status.lastResponse.duration} ms, {status.lastResponse.length && (status.lastResponse.length + ' B') || ''}
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
