import {ConfigExport, GraphiqlTab, Indexable, Settings, State} from "./types.ts";
import {STORE_SERVERS} from "./store.ts";
import {buildServer} from "./auth-token-manager.ts";


export function isObject(item: any) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

export default function mergeDeep<T extends Indexable>(target: T, source: T): T {
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(target, {[key]: source[key]});
                else {
                    (target as any)[key] = mergeDeep(target[key], source[key]);
                }
            } else {
                Object.assign(target, {[key]: source[key]});
            }
        });
    }
    return source;
}

export function exportResponseAsCsv(state: State, settings: Settings): [string | null, string | null] {
    if (!state.lastResponse || !state.lastResponse.body) {
        return [null, "Empty response body; Execute some request"]

    }
    if (!settings.csvExportArrayPath) {
        return [null, "JSON array path is empty"]
    }

    if ((state.lastResponse && !state.lastResponse.success)) {
        return [null, "Last request failed"]
    }

    function anyToString(obj: any): string {
        if (Array.isArray(obj) || isObject(obj)) {
            return JSON.stringify(obj);
        }
        if (obj == null) {
            return '?'
        }
        return '' + obj;
    }

    try {
        const resp = typeof state.lastResponse.body == 'string' ? JSON.parse(state.lastResponse.body) : state.lastResponse.body;

        const records = getByPath(resp, settings.csvExportArrayPath)
        if (!Array.isArray(records)) {
            return [null, `Object pointed by path '${settings.csvExportArrayPath}' is not array`]
        }
        if (records.length == 0) {
            return ['', 'No records found in response body'];
        }

        const fields = (settings.csvExportFields?.length ?? 0) > 0 ? settings.csvExportFields : Object.keys(records[0]);
        const rows = records
            .map((record: any) => {
                return fields.map(field => {
                    return getByPath(record, field);
                });
            })
            .map((cells: any[]) => cells.map(anyToString).join(';'))
        let header = fields.map(f => f.replaceAll(/[.\s-]+/g, '_')).join(';');
        rows.unshift(header);
        return [rows.join("\n"), null];
    } catch (e) {
        console.error(e);
        return [null, "Details: " + e]
    }
}

export function extractEmbedJson(state: State, settings: Settings): [string | null, string | null] {
    if (!state.lastResponse || !state.lastResponse.body) {
        return [null, "Empty response body; Execute some request"];
    }

    if (!settings.extractEmbedJsonPath) {
        return [null, "JSON path to embedded field is empty"]
    }


    const resp = typeof state.lastResponse.body == 'string' ? JSON.parse(state.lastResponse.body) : state.lastResponse.body;
    const extracted = getByPath(resp, settings.extractEmbedJsonPath)
    let result = extracted;
    if (Array.isArray(extracted)) {
        result = extracted.filter(s => !!s).map(e => JSON.parse(e));
    }

    return [JSON.stringify(result, null, 2), null];
}


export function handleFileDownload(content: string, filename: string, type: string) {
    const blob = new Blob([content], {type: `${type};charset=utf-8`});

    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl);
};

function getByPath(obj: Indexable, path: string): any {
    if (!path) return obj;

    path = path.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    path = path.replace(/^\./, ''); // strip a leading dot
    const keys = path.split('.');

    const matchingValues = (key: string | RegExp, obj: any) => {
        if (typeof key === 'string') {
            return obj[key];
        }
        return Object.keys(obj).filter(k => key.test(k)).map(k => obj[k])[0];
    };


    return keys
        .map(k => {
            if (k.includes('*')) {
                return new RegExp(k.replaceAll('*', '.*'));
            }
            return k;
        })
        .reduce((current, key) => {
            // If the current accumulation is null or undefined, stop traversing
            if (current == null) return undefined;

            // If we encounter an array, map over each item to extract the key
            if (Array.isArray(current)) {
                return current.flatMap(item => (item != null ? matchingValues(key, item) : undefined));
            }

            // Otherwise, access the property normally
            return matchingValues(key, current);
        }, obj);
}

export function exportConfig() {
    const date = new Date();
    const tabs = (JSON.parse(localStorage.getItem('graphiql:tabState') || '{}'))['tabs'] as GraphiqlTab[];
    const data: ConfigExport = {
        time: date.toISOString(),
        tabs: tabs || [],
        servers: STORE_SERVERS.getSnapshot() || []
    }

    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    handleFileDownload(
        JSON.stringify(data, null, 2),
        `graphiql-extended-config_${date.toISOString().split('T')[0]}_${h}-${m}-${s}.json`,
        'appliction/json'
    )
}

export function importConfig(content: string, replace: boolean) {
    const config: ConfigExport = JSON.parse(content)
    const servers = (config.servers || []).map(e => buildServer(e));
    const tabs: GraphiqlTab[] = [];
    for (let i = 0; i < config.tabs?.length || 0; i++) {
        let tab = config.tabs[i];
        if (tab && tab.id && tab.title) {
            tab = Object.assign({
                variables: '',
                query: ''
            }, tab);

            tabs.push(tab);
        } else {
            console.error(`Incorrect tab object with id ${tab?.id} at index ${i}`);
        }
    }

    for (let server of servers) {
        STORE_SERVERS.updateItem(server)
    }

    const currentTabWrapper = (JSON.parse(localStorage.getItem('graphiql:tabState') || '{}')) as {
        tabs: GraphiqlTab[]
    };
    if (replace) {
        // STORE_SERVERS.set(servers);
        currentTabWrapper.tabs = tabs
    } else {

        let newTabs = [...currentTabWrapper.tabs]
        tabs.forEach((imported, i) => {
            const matching = currentTabWrapper.tabs.find(t => t.id === imported.id)
            if (matching) {
                matching.query = matching.query + '\n\n# Imported\n\n' + imported.query;
                matching.variables = imported.variables;
                matching.headers = imported.headers;
            } else {
                newTabs.push(imported);
            }
        })
        currentTabWrapper.tabs = newTabs;
    }
    localStorage.setItem('graphiql:tabState', JSON.stringify(currentTabWrapper));
    window.location.reload();
}
