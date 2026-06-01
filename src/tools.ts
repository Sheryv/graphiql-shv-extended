import {Indexable, Settings, State} from "./types.ts";


export function isObject(item: Object) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

export default function mergeDeep<T extends Indexable>(target: T, source: Indexable): T {
    let output: T = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, {[key]: source[key]});
                else {
                    // @ts-ignore
                    output[key] = mergeDeep(target[key], source[key]);
                }
            } else {
                Object.assign(output, {[key]: source[key]});
            }
        });
    }
    return output;
}

export function exportResponseAsCsv(state: State, settings: Settings): string {
    if (!state.lastResponse?.body || !settings.csvExportArrayPath) {
        return '';
    }

    function anyToString(obj: any): string {
        if (Array.isArray(obj) || isObject(obj)) {
            JSON.stringify(obj);
        }
        return '' + obj;
    }


    const resp = JSON.parse(state.lastResponse?.body)

    const records = getByPath(resp, settings.csvExportArrayPath)
    if (Array.isArray(records)) {
        throw new Error("Provided array path is incorrect")
    }
    const rows = records
        .map((record: any) => {
            const fields = settings.csvExportFields ?? Object.keys(record)
            return fields.map(field => {
                return getByPath(record, field);
            });
        })
        .map((cells: any[]) => cells.map(anyToString).join(';'))
    return rows.join("\n");
}

export function extractEmbedJson(state: State, settings: Settings): any {
    if (!state.lastResponse?.body) {
        return undefined;
    }

    const resp = JSON.parse(state.lastResponse?.body)
    const extracted = getByPath(resp, settings.extractEmbedJsonPath)
    return JSON.stringify(extracted);
}


function getByPath(obj: Indexable, path: string): any {
    if (!path) return obj;

    path = path.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    path = path.replace(/^\./, ''); // strip a leading dot
    const keys = path.split('.');

    return keys.reduce((current, key) => {
        // If the current accumulation is null or undefined, stop traversing
        if (current == null) return undefined;

        // If we encounter an array, map over each item to extract the key
        if (Array.isArray(current)) {
            return current.map(item => (item != null ? item[key] : undefined));
        }

        // Otherwise, access the property normally
        return current[key];
    }, obj);
}
