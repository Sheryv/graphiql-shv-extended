import React, {useEffect, useState} from "react";
import ReactDOM from "react-dom";
import {STORE_SELECTED, STORE_SERVERS, STORE_STATUS} from "../store.ts";
import ServerManagement from "./ServerManagement.tsx";
import {Server} from "../server.ts";


export default function TopbarPortal() {

    console.log("create TopbarPortal");

    const [mountNode, setMountNode] = useState<Element | null>(null);
    const [dialog, setDialog] = useState(false);

    const serverIndex = STORE_SELECTED.asState()
    const list = STORE_SERVERS.asState()
    const status = STORE_STATUS.asState()


    function format(s: Server){
        return s.name.padEnd(20, '\u00A0') + ' - ' + s.url
    }

    const optionchanged = (e: any) => {
        STORE_SELECTED.set(e.target.selectedIndex);
    };

    useEffect(() => {
        // 1. Locate the container element in GraphiQL (e.g., header or toolbar)
        const container = document.querySelector('.graphiql-top-bar');

        if (container) {
            setMountNode(container);
        }
    }, []);

    if (!mountNode) return null;

    // 4. Portal your React content directly into the inserted wrapper node
    return ReactDOM.createPortal(
        <div className={'s-topbar-inline'}>
            <select name={'environment'} style={{whiteSpace: 'pre'}} onChange={e => optionchanged(e)} value={serverIndex}>
                {list.map((s, i) => (
                    <option key={i} value={i}>{format(s)}</option>
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
            <div className="s-dialog container-fluid " style={{display: dialog ? "flex" : "none"}}>
                <div className="">
                    <ServerManagement setVisible={setDialog} isVisible={dialog}/>
                </div>
            </div>
        </div>,
        mountNode
    );
};
