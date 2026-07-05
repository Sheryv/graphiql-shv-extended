import React, {useState} from "react";
import {ToolbarButton} from "@graphiql/react";
import {importConfig} from "../tools.ts";


export interface ImportConfigProps {

}


export default function ImportConfig(props: ImportConfigProps) {
    const [open, setOpen] = useState(false);

    const [file, setFile] = useState<File | null>(null)
    const [replace, setReplace] = useState(false)
    const [error, setError] = useState('')


    const handleImport = () => {
        if (file) {
            setError('');
            try {
                const reader = new FileReader();
                reader.addEventListener('load', (event) => {
                    let content = event.target?.result + '';
                    try {
                        importConfig(content, true);
                        console.debug("Imported successfully.");
                        setOpen(false)
                    } catch (e) {
                        console.error(e);
                        setError(e + '');
                    }
                });
                reader.readAsText(file, 'UTF-8');
            } catch (e) {
                console.error(e);
                setError(e + '');
            }
        }
    };

    return (
        <div>
            <ToolbarButton onClick={() => setOpen(true)}
                           label="Import configuration">
                <svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px"
                     fill="currentColor" style={{opacity: 0.6}}>
                    <path
                        d="M450-328.46v-336l-98.61 98.61-42.16-43.38L480-780l170.77 170.77-42.16 43.38L510-664.46v336h-60ZM252.31-180Q222-180 201-201q-21-21-21-51.31v-108.46h60v108.46q0 4.62 3.85 8.46 3.84 3.85 8.46 3.85h455.38q4.62 0 8.46-3.85 3.85-3.84 3.85-8.46v-108.46h60v108.46Q780-222 759-201q-21 21-51.31 21H252.31Z"/>
                </svg>

            </ToolbarButton>
            <div className="s-dialog container-fluid " style={{display: open ? "flex" : "none"}}>
                <div className="">
                    <div className="d-flex flex-grow-1 flex-column rounded overflow-hidden">

                        <div className="p-3 d-flex justify-content-between align-items-center">
                            <h4 className="m-0">Import configuration</h4>
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
                                This panel allows importing configuration of opened tabs and defined servers from JSON
                                file
                            </div>
                            <div>
                                <label className="form-label mb-1">File to import</label>
                                <input type="file" accept=".json"
                                       onChange={e => setFile(e.target?.files?.[0] || null)} required
                                       className={"form-control s-form-control font-monospace"}/>
                            </div>
                            {/*<div>*/}
                            {/*    <input*/}
                            {/*        type="checkbox"*/}
                            {/*        id="replaceToggle"*/}
                            {/*        checked={replace}*/}
                            {/*        onChange={e => setReplace(e.target.checked)}*/}
                            {/*        className="form-check-input s-form-control"*/}
                            {/*    />*/}
                            {/*    <label htmlFor="replaceToggle" className="form-check-label text-white ms-1"*/}
                            {/*           style={{cursor: 'pointer'}}>*/}
                            {/*        Check to replace current config, otherwise it will be merged*/}
                            {/*    </label>*/}
                            {/*</div>*/}
                            <div className="d-flex align-items-center text-danger-emphasis">
                                {error && 'Processing problem: ' + error || ''}
                            </div>
                        </div>


                        <div className="p-3 d-flex border-top justify-content-between align-items-center gap-3">
                            <div></div>
                            <div className="d-flex gap-3">
                                <button className="btn btn-text" onClick={e => setOpen(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={e => handleImport()}
                                        disabled={file == null}>Import
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
