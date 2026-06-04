import React, {useEffect, useState} from "react";
import {debounce, ToolbarButton} from "@graphiql/react";
import {STORE_SETTINGS, STORE_STATUS} from "../store.ts";
import {extractEmbedJson, handleFileDownload} from "../tools.ts";
import CodeViewer from "./CodeViewer.tsx";


export interface ExtractEmbedJsonProps {

}

const pathUpdater = debounce(500, (path: string, callback: (text: string, error?: string) => void) => {
    const s = STORE_SETTINGS.getSnapshot();
    s.extractEmbedJsonPath = path;
    STORE_SETTINGS.set(s);

    let [result, error] = extractEmbedJson(STORE_STATUS.getSnapshot(), s);
    callback(result || '', error || undefined)
})

export default function ExtractEmbedJson(props: ExtractEmbedJsonProps) {
    const [open, setOpen] = useState(false);
    const [jsonPath, setJsonPath] = useState(STORE_SETTINGS.getSnapshot().extractEmbedJsonPath)
    const [extracted, setExtracted] = useState('')
    const [error, setError] = useState('')

    const callback = (text: string, error?: string) => {
        setExtracted(text)
        setError(error ?? '')
    }

    const copy = (e: any) => {
        navigator.clipboard.writeText(extracted).then(() => {
        });
    }

    useEffect(() => {
        if (open) {
            pathUpdater(jsonPath, callback)
        } else {
            setExtracted('')
        }
    }, [jsonPath, open]);

    const handleDownload = () => {
        const prefix = STORE_STATUS.getSnapshot().lastResponse?.operationName && STORE_STATUS.getSnapshot().lastResponse?.operationName + '_' || ''
        let time = new Date().toLocaleTimeString().replaceAll(':', '-').replaceAll(' ', '');
        handleFileDownload(extracted, 'embedded_' + prefix + jsonPath.replaceAll(/\W+/g, '-') + '_' + time + '.json', 'appliction/json');
    };

    return (
        <div>
            <ToolbarButton onClick={() => setOpen(true)}
                           label="Extract embed JSON and deserialize">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960"
                     width="24px" fill="#e3e3e3">
                    <path
                        d="M480-480Zm267.69 340H428.46q-12.75 0-21.37-8.63-8.63-8.63-8.63-21.38 0-12.76 8.63-21.37 8.62-8.62 21.37-8.62h319.23q4.62 0 8.46-3.85 3.85-3.84 3.85-8.46v-535.38q0-4.62-3.85-8.46-3.84-3.85-8.46-3.85H212.31q-4.62 0-8.46 3.85-3.85 3.84-3.85 8.46v126.15q0 12.75-8.63 21.38-8.63 8.62-21.38 8.62-12.76 0-21.37-8.62-8.62-8.63-8.62-21.38v-126.15Q140-778 161-799q21-21 51.31-21h535.38Q778-820 799-799q21 21 21 51.31v535.38Q820-182 799-161q-21 21-51.31 21ZM130-100q-12.75 0-21.37-8.63-8.63-8.63-8.63-21.38 0-12.76 8.63-21.37Q117.25-160 130-160h75.08q-48-20.69-78.08-64.63t-30.08-99.6q0-74.68 52.58-127.15 52.58-52.46 127.42-52.46 12.75 0 21.38 8.62 8.62 8.63 8.62 21.39 0 12.75-8.62 21.37-8.63 8.61-21.38 8.61-49.61 0-84.8 34.89-35.2 34.88-35.2 85.16 0 42.63 26.5 75.42t67.35 41.54v-73.93q0-12.75 8.63-21.37 8.63-8.63 21.38-8.63 12.76 0 21.37 8.63 8.62 8.62 8.62 21.37v144.61q0 15.37-10.4 25.76-10.39 10.4-25.76 10.4H130Zm298.46-190H520q12.75 0 21.37-8.63 8.63-8.63 8.63-21.38 0-12.76-8.63-21.37Q532.75-350 520-350h-91.54q-12.75 0-21.37 8.63-8.63 8.63-8.63 21.38 0 12.76 8.63 21.37 8.62 8.62 21.37 8.62Zm0-160H640q12.75 0 21.37-8.63 8.63-8.63 8.63-21.38 0-12.76-8.63-21.37Q652.75-510 640-510H428.46q-12.75 0-21.37 8.63-8.63 8.63-8.63 21.38 0 12.76 8.63 21.37 8.62 8.62 21.37 8.62ZM320-610h320q12.75 0 21.37-8.63 8.63-8.63 8.63-21.38 0-12.76-8.63-21.37Q652.75-670 640-670H320q-12.75 0-21.37 8.63-8.63 8.63-8.63 21.38 0 12.76 8.63 21.37Q307.25-610 320-610Z"/>
                </svg>
            </ToolbarButton>
            <div className="s-dialog s-dialog-large container-fluid " style={{display: open ? "flex" : "none"}}>
                <div className="">
                    <div className="d-flex flex-grow-1 flex-column rounded overflow-hidden">

                        <div className="p-3 d-flex justify-content-between align-items-center">
                            <h4 className="m-0">Extract embed JSON and deserialize</h4>
                            <button className="btn p-1" onClick={e => setOpen(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" height="1em" stroke="currentColor"
                                     stroke-width="3"
                                     viewBox="0 0 14 14">
                                    <path d="m1 1 12 12m0-12L1 13"></path>
                                </svg>
                            </button>
                        </div>


                        <div className="d-flex flex-grow-1 border-top overflow-hidden gap-3 flex-column p-3">
                            <div className="small">
                                This panel allows converting string values that are embedded JSON objects to array of that objects after deserialization
                            </div>
                            <div>
                                <label className="form-label mb-1">JSON Path to field containing embedded JSON. Wildcard char
                                    '*' is supported and it matches any character (e.g.:
                                    data.edges; data.*.edges)</label>
                                <input type="text" value={jsonPath} onChange={e => setJsonPath(e.target.value)} required
                                       className={"form-control s-form-control font-monospace"}/>
                            </div>

                            <div className="flex-grow-1 d-flex flex-column">
                                <div className=" mb-1 d-flex justify-content-between">
                                    <label className="form-label align-self-end">Converted JSON result</label>
                                    <button className="btn btn-text" onClick={copy}>
                                        Copy to clipboard
                                    </button>
                                </div>
                                <div className="flex-grow-1 overflow-hidden s-code-viewer">
                                    <CodeViewer content={extracted} language="json" height="60vh"></CodeViewer>
                                </div>

                                {/*    <textarea value={extracted} className="flex-grow-1 form-control s-form-control h-100 font-monospace"*/}
                                {/*              readOnly={true}>*/}

                                {/*</textarea>*/}
                            </div>
                        </div>


                        <div className="p-3 d-flex border-top justify-content-between align-items-center gap-3">
                            <div className="d-flex align-items-center text-danger-emphasis">
                                {error && 'Processing problem: ' + error || ''}
                            </div>
                            <div className="d-flex gap-3">
                                <button className="btn btn-text" onClick={e => setOpen(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={e => handleDownload()}>Save to file
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
