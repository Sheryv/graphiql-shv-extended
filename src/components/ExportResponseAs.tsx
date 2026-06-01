import React, {useEffect, useState} from "react";
import {debounce, ToolbarButton} from "@graphiql/react";
import {STORE_SETTINGS, STORE_STATUS} from "../store.ts";
import {exportResponseAsCsv} from "../tools.ts";


export interface ExportResponseAsProps {

}

const arrayPathUpdater = debounce(500, (path: string, setCsv: Function) => {
    const s = STORE_SETTINGS.getSnapshot();
    s.csvExportArrayPath = path;
    STORE_SETTINGS.update(s);
    setCsv(exportResponseAsCsv(STORE_STATUS.getSnapshot(), s))
})
const fieldPathsUpdater = debounce(500, (path: string, setCsv: Function) => {
    const s = STORE_SETTINGS.getSnapshot();
    s.csvExportFields = path.split('.').map(l => l.trim()).filter(l => l !== '');
    STORE_SETTINGS.update(s);
    setCsv(exportResponseAsCsv(STORE_STATUS.getSnapshot(), s))
})

export default function ExportResponseAs(props: ExportResponseAsProps) {
    const [open, setOpen] = useState(false);

    const [jsonArrayPath, setJsonArrayPath] = useState(STORE_SETTINGS.getSnapshot().csvExportArrayPath)
    const [jsonFieldPaths, setFieldPaths] = useState(STORE_SETTINGS.getSnapshot().csvExportFields.join(',\n'))
    const status = STORE_STATUS.asState()
    const [csv, setCsv] = useState(exportResponseAsCsv(status, STORE_SETTINGS.getSnapshot()))

    useEffect(() => {
        arrayPathUpdater(jsonArrayPath, setCsv);
    }, [jsonArrayPath]);

    useEffect(() => {
        fieldPathsUpdater(jsonFieldPaths, setCsv);
    }, [jsonFieldPaths]);

    return (
        <div>
            <ToolbarButton onClick={() => setOpen(true)}
                           label="Export reponse as CSV">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960"
                     width="24px" fill="#e3e3e3">
                    <path
                        d="M212.31-140Q182-140 161-161q-21-21-21-51.31v-535.38Q140-778 161-799q21-21 51.31-21h535.38Q778-820 799-799q21 21 21 51.31v535.38Q820-182 799-161q-21 21-51.31 21H212.31ZM450-371.92H200v159.61q0 5.39 3.46 8.85t8.85 3.46H450v-171.92Zm60 0V-200h237.69q5.39 0 8.85-3.46t3.46-8.85v-159.61H510Zm-60-60v-172.7H200v172.7h250Zm60 0h250v-172.7H510v172.7ZM200-664.61h560v-83.08q0-5.39-3.46-8.85t-8.85-3.46H212.31q-5.39 0-8.85 3.46t-3.46 8.85v83.08Z"/>
                </svg>
            </ToolbarButton>
            <div className="s-dialog s-dialog-large container-fluid " style={{display: open ? "flex" : "none"}}>
                <div className="">
                    <div className="d-flex flex-grow-1 flex-column rounded overflow-hidden">

                        <div className="p-3 d-flex justify-content-between align-items-center">
                            <h4 className="m-0">Export response as CSV</h4>
                            <button className="btn p-1" onClick={e => setOpen(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" height="1em" stroke="currentColor"
                                     stroke-width="3"
                                     viewBox="0 0 14 14">
                                    <path d="m1 1 12 12m0-12L1 13"></path>
                                </svg>
                            </button>
                        </div>


                        <div className="d-flex flex-grow-1 border-top overflow-hidden gap-3 flex-column p-3">

                            <div>
                                <label className="form-label mb-1">JSON Path to field containing array</label>
                                <input type="text" value={jsonArrayPath}
                                       onChange={e => setJsonArrayPath(e.target.value)} required
                                       className={"form-control s-form-control "}/>
                            </div>
                            <div>
                                <label className="form-label mb-1">List of comma-separated JSON Paths for each column
                                    relative to array object defined above</label>
                                <textarea value={jsonFieldPaths} className="form-control s-form-control" rows={10}
                                          onChange={e => setFieldPaths(e.target.value)}/>
                            </div>

                            <div className="flex-grow-1">
                                <label className="form-label mb-1 d-flex justify-content-between"><span
                                    className="align-self-end">Converted JSON result</span>
                                    <button className="btn btn-text">
                                        Copy to clipboard
                                    </button>
                                </label>
                                <textarea value={csv} className="flex-grow-1 form-control s-form-control h-100"
                                          readOnly={true}/>

                            </div>
                        </div>


                        <div className="p-3 d-flex border-top justify-content-end align-items-center gap-3">
                            <button className="btn btn-text" onClick={e => setOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={e => {
                            }}>Save to file
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
