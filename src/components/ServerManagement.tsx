import React, {useEffect, useRef, useState} from 'react';
import {AUTH_TYPES, OAuthFlowType, Server} from '../server.ts'; // Adjust path
import {STORE_SELECTED, STORE_SERVERS} from "../store.ts";
import './ServerManagement.scss';
import {buildOAuth, buildServer, buildTokenUrl} from "../auth-token-manager.ts";

interface HeaderRow {
    id: string;
    key: string;
    value: string;
}

interface ServerManagementProps {
    setVisible?: (value: (((prevState: boolean) => boolean) | boolean)) => void,
    isVisible?: boolean
}

export default function ServerManagement({setVisible, isVisible}: ServerManagementProps) {
    // Connect to your global store using standard signature
    const servers: Server[] = STORE_SERVERS.asState();
    const formRef = useRef<HTMLFormElement>(null);

    // UI Navigation Trackers
    const [selectedIndex, setSelectedIndex] = useState<number>(STORE_SELECTED.getSnapshot());
    let currentServer = servers[selectedIndex];

    // Form Field State Definitions
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [headers, setHeaders] = useState<HeaderRow[]>([]);

    // OAuth contextual sub-form states
    const [hasOAuth, setHasOAuth] = useState(false);
    const [flowType, setFlowType] = useState<OAuthFlowType>('direct');
    const [clientId, setClientId] = useState('');
    const [realm, setRealm] = useState('');
    const [tokenUrl, setTokenUrl] = useState('');
    const [authnUrl, setAuthnUrl] = useState('');
    const [redirectUrl, setRedirectUrl] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [placeholderForOverwrite, setPlaceholderForOverwrite] = useState('');

    useEffect(() => {
        if (isVisible) {
            setSelectedIndex(STORE_SELECTED.getSnapshot());
        }
    }, [isVisible]);

    // Synchronize state structures upon selection changes
    useEffect(() => {
        currentServer = servers[selectedIndex];
        if (currentServer) {
            setName(currentServer.name);
            setUrl(currentServer.url);

            const mappedHeaders = (currentServer.headers || []).map((headerObj, index) => {
                const [key, value] = Object.entries(headerObj)[0] || ['', ''];
                return {id: `${index}-${Date.now()}`, key, value};
            });
            setHeaders(mappedHeaders);

            if (currentServer.oauth) {
                setHasOAuth(true);
                setClientId(currentServer.oauth.clientId);
                setRealm(currentServer.oauth.realm);
                setFlowType(currentServer.oauth.flowType);
                setTokenUrl(currentServer.oauth.tokenUrl || '');
                setAuthnUrl(currentServer.oauth.authViaUIUrl || '');
                setRedirectUrl(currentServer.oauth.redirectUri || '');
                setClientSecret(currentServer.oauth.clientSecret || '');
                setUsername(currentServer.oauth.username || '');
                setPassword(currentServer.oauth.password || '');
            } else {
                setHasOAuth(false);
                setFlowType('direct');
                setClientId('');
                setRealm('');
                setTokenUrl('');
                setAuthnUrl('');
                setRedirectUrl('');
                setClientSecret('');
                setUsername('');
                setPassword('');
            }
        }
    }, [selectedIndex]);

    useEffect(() => {
        if (servers.some((s, i) => s.name === name && i !== selectedIndex)) {
            setError('This name is already used');
        } else {
            setError('');
        }
    }, [selectedIndex, name]);

    useEffect(() => {
        console.debug('update', currentServer)

        if (hasOAuth) {
            setPlaceholderForOverwrite(buildTokenUrl(buildOAuth({
                clientId,
                realm,
                flowType,
                tokenUrl: tokenUrl || undefined,
                redirectUri: redirectUrl || undefined,
                authViaUIUrl: authnUrl || undefined,
                clientSecret: clientSecret || undefined,
                username: username || undefined,
                password: password || undefined
            }), url));

        } else {
            setPlaceholderForOverwrite('')
        }
    }, [hasOAuth, url, realm, clientId]);

    // Sidebar List Manipulations
    const handleAddServer = () => {
        const base = servers[selectedIndex]
        const newServerPlaceholder = buildServer({
            name: 'New ' + base.name,
            url: base.url,
            headers: base.headers,
            oauth: base.oauth
        });
        STORE_SERVERS.addItem(newServerPlaceholder);
        setSelectedIndex(servers.length);
    };

    const handleDeleteServer = (indexToDelete: number, event: React.MouseEvent) => {
        event.stopPropagation(); // Avoid backdrop list selection updates
        if (confirm(`Are you sure you want to delete "${servers[indexToDelete].name}"?`)) {
            STORE_SERVERS.removeItemAt(indexToDelete);

            if (indexToDelete === selectedIndex) {
                setSelectedIndex(Math.max(0, indexToDelete - 1));
            } else if (indexToDelete < selectedIndex) {
                setSelectedIndex(selectedIndex - 1);
            }
        }
    };

    // HTTP Header Dynamic Row Actions
    const addHeader = () => {
        setHeaders([...headers, {id: crypto.randomUUID(), key: '', value: ''}]);
    };

    const updateHeader = (id: string, field: 'key' | 'value', value: string) => {
        setHeaders(headers.map(h => h.id === id ? {...h, [field]: value} : h));
    };

    const removeHeader = (id: string) => {
        setHeaders(headers.filter(h => h.id !== id));
    };

    // Convert states back to instantiated typed constructs
    const handleSave = (e: any) => {
        // document.getElementById('submit-server-form')?.click();

        formRef.current?.reportValidity();

        // e.preventDefault();
        const processedHeaders: Record<string, string>[] = headers
            .filter(h => h.key.trim() !== '')
            .map(h => ({[h.key]: h.value}));

        const processedOAuth = hasOAuth
            ? buildOAuth({
                clientId,
                realm,
                flowType,
                tokenUrl: tokenUrl || undefined,
                redirectUri: redirectUrl || undefined,
                authViaUIUrl: authnUrl || undefined,
                clientSecret: clientSecret || undefined,
                username: username || undefined,
                password: password || undefined
            })
            : undefined;

        if (!error && (!hasOAuth || (!!clientId && !!realm))) {
            const updatedServer = buildServer({
                name,
                url,
                headers: processedHeaders,
                oauth: processedOAuth,
                id: servers[selectedIndex].id
            });

            STORE_SERVERS.updateItem(updatedServer);

            setVisible && setVisible(false);
        }

    };

    return (
        <div className="d-flex flex-grow-1 flex-column rounded overflow-hidden">
            {/* LEFT PANEL: Sidebar */}
            <div className="p-3 d-flex justify-content-between align-items-center">
                <h4 className="m-0">Edit server configuration</h4>
                <button className="btn p-1" onClick={e => setVisible && setVisible(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="1em" stroke="currentColor" stroke-width="3"
                         viewBox="0 0 14 14">
                        <path d="m1 1 12 12m0-12L1 13"></path>
                    </svg>
                </button>
            </div>

            <div className="d-flex flex-grow-1 border-top overflow-hidden">
                <div className="bg-dark-subtle d-flex flex-column p-3 border-end overflow-hidden"
                     style={{minWidth: '20rem'}}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="text-uppercase m-0 tracking-wider text-muted">Servers</h6>
                        <button type="button" onClick={handleAddServer} className="btn btn-sm btn-success px-2 py-1">
                            + New
                        </button>
                    </div>

                    {servers.length === 0 ? (
                        <p className="text-center text-muted fs-7 my-4">No server found.</p>
                    ) : (
                        <ul className="nav nav-pills flex-column gap-1 list-unstyled m-0 p-0 overflow-y-auto overflow-x-hidden flex-nowrap">
                            {servers.map((server, idx) => (
                                <li key={server.id}>
                                    <button
                                        type="button"
                                        className={`btn w-100 d-flex justify-content-between align-items-center rounded p-2 ${selectedIndex === idx ? 'btn-secondary' : 'btn-text'}`}
                                        onClick={() => setSelectedIndex(idx)}
                                    >
                                        <span className="text-truncate me-2">{server.name || `Server ${idx + 1}`}</span>
                                        <span
                                            className="btn btn-sm btn-text s-btn-danger fs-7" aria-label="Delete"
                                            onClick={(e) => handleDeleteServer(idx, e)}
                                        >
                    ✕
                  </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* RIGHT PANEL: Dynamic Form fields wrapper */}
                <div className="flex-grow-1 p-4 overflow-auto">
                    {!currentServer ? (
                        <div
                            className="d-flex flex-column align-items-center justify-content-center text-center h-100 py-5 text-muted">
                            <h5 className="text-white">No server selected</h5>
                            {servers.length === 0 && (
                                <button type="button" onClick={handleAddServer}
                                        className="btn btn-primary">Create</button>
                            )}
                        </div>
                    ) : (
                        <form ref={formRef} className="d-flex flex-column gap-3">
                            <div>
                                <label className="form-label  mb-1">Server name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                                       className={"form-control s-form-control " + (error ? 'invalid' : '')}/>
                                {error && (<div className="invalid-feedback">{error}</div>)}
                            </div>

                            <div>
                                <label className="form-label   mb-1">Server URL</label>
                                <input type="url" value={url} onChange={e => setUrl(e.target.value)} required
                                       className="form-control s-form-control"/>
                            </div>

                            {/* Custom HTTP Headers Section */}
                            <div className="bg-dark-subtle p-3 rounded">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="m-0 text-white font-medium">HTTP header modifications</h6>
                                    <button type="button" onClick={addHeader} className="btn btn-sm btn-secondary">
                                        + Add header
                                    </button>
                                </div>

                                {headers.map((header) => (
                                    <div key={header.id} className="d-flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Header key (e.g., Authorization)"
                                            value={header.key}
                                            onChange={e => updateHeader(header.id, 'key', e.target.value)}
                                            className="form-control s-form-control"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Value string"
                                            value={header.value}
                                            onChange={e => updateHeader(header.id, 'value', e.target.value)}
                                            className="form-control s-form-control"
                                        />
                                        <button type="button" onClick={() => removeHeader(header.id)}
                                                aria-label="Delete"
                                                className="btn btn-sm btn-text s-btn-danger">
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* OAuth Toggle Checkbox */}
                            <div className="form-check my-2">
                                <input
                                    type="checkbox"
                                    id="oauthToggle"
                                    checked={hasOAuth}
                                    onChange={e => setHasOAuth(e.target.checked)}
                                    className="form-check-input s-form-control"
                                />
                                <label htmlFor="oauthToggle" className="form-check-label fw-medium text-white ms-1"
                                       style={{cursor: 'pointer'}}>
                                    Enable OAuth authentication
                                </label>
                            </div>

                            {/* Contextual Nested OAuth Area */}
                            {hasOAuth && (
                                <div className="rounded d-flex flex-column gap-3">
                                    <div className="">
                                        <label className="form-label mb-1">Type</label>
                                        <select className="form-control s-form-control"
                                                onChange={e => setFlowType(AUTH_TYPES[e.target.selectedIndex].key)}
                                                value={flowType}>
                                            {AUTH_TYPES.map((s) => (
                                                <option key={s.key} value={s.key}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="row g-2">
                                        <div className="col-6">
                                            <label className="form-label   mb-1">Client ID *</label>
                                            <input type="text" value={clientId}
                                                   onChange={e => setClientId(e.target.value)}
                                                   required className="form-control s-form-control"/>
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label   mb-1">Realm *</label>
                                            <input type="text" value={realm} onChange={e => setRealm(e.target.value)}
                                                   required className="form-control s-form-control"/>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label   mb-1">Token URL overwrite (Optional)</label>
                                        <input type="text" value={tokenUrl}
                                               onChange={e => setTokenUrl(e.target.value)}
                                               className="form-control s-form-control"
                                               placeholder={placeholderForOverwrite}/>
                                    </div>

                                    {flowType == 'standard' && (
                                        <div className="d-flex flex-column gap-3">
                                            <div>
                                                <label className="form-label   mb-1">Auth GUI URL overwrite
                                                    (Optional)</label>
                                                <input type="text" value={authnUrl}
                                                       onChange={e => setAuthnUrl(e.target.value)}
                                                       className="form-control s-form-control"/>
                                            </div>
                                            <div>
                                                <label className="form-label   mb-1">Redirect URL overwrite
                                                    (Optional)</label>
                                                <input type="text" value={redirectUrl}
                                                       onChange={e => setRedirectUrl(e.target.value)}
                                                       className="form-control s-form-control"/>
                                            </div>
                                        </div>
                                    )}

                                    {flowType == 'servicea' && (
                                        <div>
                                            <label className="form-label   mb-1">Client secret *</label>
                                            <input type="password" value={clientSecret} autoComplete="secret"
                                                   onChange={e => setClientSecret(e.target.value)} required
                                                   className="form-control s-form-control"/>
                                        </div>
                                    )}

                                    {flowType == 'direct' && (
                                        <div className="row g-2">
                                            <div className="col-6">
                                                <label className="form-label   mb-1">Username *</label>
                                                <input type="text" value={username} autoComplete="username"
                                                       onChange={e => setUsername(e.target.value)} required
                                                       className="form-control s-form-control"/>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label   mb-1">Password *</label>
                                                <input type="password" value={password} autoComplete="password"
                                                       onChange={e => setPassword(e.target.value)} required
                                                       className="form-control s-form-control"/>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>


            <div className="p-3 d-flex border-top justify-content-end align-items-center gap-3">
                <button className="btn btn-text" onClick={e => setVisible && setVisible(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={e => handleSave(e)}>Save</button>
            </div>
        </div>
    );
}
