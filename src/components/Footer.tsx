import ExtractEmbedJson from "./ExtractEmbedJson.tsx";
import ExportResponseAs from "./ExportResponseAs.tsx";
import {STORE_STATUS} from "../store.ts";
import React from "react";

export function Footer() {
    const status = STORE_STATUS.asState()

    return (
        <div className="d-flex justify-content-between">
            {/*{status.lastResponse ?*/}
            {/*    (<div*/}
            {/*        className={`d-flex font-monospace align-items-center ${status.lastResponse.success ? 'text-success-emphasis' : 'text-danger-emphasis'}`}*/}
            {/*        title={status.lastResponse.timestampLocal}>*/}
            {/*        {status.lastResponse.status}, {status.lastResponse.duration} ms, {status.lastResponse.length && (status.lastResponse.length + ' B') || ''}*/}
            {/*    </div>)*/}
            {/*    :*/}
            {/*    (<div></div>)*/}
            {/*}*/}


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
            <div className="d-flex">
                <ExtractEmbedJson/>
                <ExportResponseAs/>
            </div>
        </div>
    )
}
