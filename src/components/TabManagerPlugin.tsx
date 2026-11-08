import React, { useState, useEffect } from 'react';
import { useGraphiQL, useGraphiQLActions } from '@graphiql/react';
import './TabManagerPlugin.scss'
import {ArrayStore, Store} from "../store.ts";

export interface TreeTab {
    id: string;
    name: string;
    type: 'folder' | 'tab';
    parentId: string | null;
    query?: string;
    variables?: string;
    headers?: string;
}

export const STORE_TABS = new ArrayStore<TreeTab>('graphiql-extended:tabs', [])


export function TabManagerPlugin() {
    const tabs = useGraphiQL((state) => state.tabs);
    const activeTabIndex = useGraphiQL((state) => state.activeTabIndex);
    const { addTab, closeTab, changeTab, updateActiveTabValues } = useGraphiQLActions();

    const [treeTabs, setTreeTabs] = useState<TreeTab[]>(() => {
        try {
            return STORE_TABS.getSnapshot()
        } catch {
            return [];
        }
    });

    const [isOpenTabsExpanded, setIsOpenTabsExpanded] = useState<boolean>(true);
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
    const [newFolderName, setNewFolderName] = useState('');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Drag and Drop state
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);

    // Save to LocalStorage whenever treeItems changes
    useEffect(() => {
        STORE_TABS.set(treeTabs);
    }, [treeTabs]);

    // Close 3-dots dropdown menu when clicking anywhere outside
    useEffect(() => {
        const handleOutsideClick = () => setOpenMenuId(null);
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []);

    // Auto-sync open tabs into Tree view
    useEffect(() => {
        if (!tabs || tabs.length === 0) return;

        setTreeTabs((prevItems) => {
            let updated = [...prevItems];
            let hasChanges = false;

            tabs.forEach((runtimeTab, index) => {
                const tabTitle = runtimeTab.title || `Query ${index + 1}`;
                const tabQuery = runtimeTab.query || '';

                const exists = updated.some(
                    (item) => item.type === 'tab' && item.name === tabTitle
                );

                if (!exists) {
                    hasChanges = true;
                    updated.push({
                        id: `tab-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                        name: tabTitle,
                        type: 'tab',
                        parentId: null,
                        query: tabQuery,
                        variables: runtimeTab.variables || '',
                        headers: runtimeTab.headers || '',
                    });
                }
            });

            return hasChanges ? updated : prevItems;
        });
    }, [tabs]);

    // Check if target folder is a child/descendant of the dragged item
    const isDescendant = (parentId: string, targetId: string | null): boolean => {
        if (!targetId) return false;
        let current: TreeTab | undefined = treeTabs.find((i) => i.id === targetId);
        while (current) {
            if (current.id === parentId) return true;
            current = treeTabs.find((i) => i.id === current?.parentId);
        }
        return false;
    };

    // Drag Handlers
    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.stopPropagation();
        setDraggedItemId(id);
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, targetFolderId: string | null) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedItemId || draggedItemId === targetFolderId) return;
        if (isDescendant(draggedItemId, targetFolderId)) return;

        e.dataTransfer.dropEffect = 'move';
        const targetKey = targetFolderId ?? 'ROOT';
        if (dropTargetId !== targetKey) {
            setDropTargetId(targetKey);
        }
    };

    const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        setDropTargetId(null);

        if (!draggedItemId || draggedItemId === targetFolderId) return;
        if (isDescendant(draggedItemId, targetFolderId)) return;

        handleMoveItem(draggedItemId, targetFolderId);
        setDraggedItemId(null);
    };

    const handleDragEnd = () => {
        setDraggedItemId(null);
        setDropTargetId(null);
    };

    // Move ordering (Up / Down)
    const handleMoveOrder = (id: string, direction: 'up' | 'down') => {
        setTreeTabs((prev) => {
            const item = prev.find((i) => i.id === id);
            if (!item) return prev;

            const siblings = prev.filter((i) => i.parentId === item.parentId);
            const index = siblings.findIndex((i) => i.id === id);

            if (direction === 'up' && index > 0) {
                const prevSibling = siblings[index - 1];
                const itemIdx = prev.findIndex((i) => i.id === id);
                const prevIdx = prev.findIndex((i) => i.id === prevSibling.id);

                const next = [...prev];
                const temp = next[itemIdx];
                next[itemIdx] = next[prevIdx];
                next[prevIdx] = temp;
                return next;
            }

            if (direction === 'down' && index < siblings.length - 1) {
                const nextSibling = siblings[index + 1];
                const itemIdx = prev.findIndex((i) => i.id === id);
                const nextIdx = prev.findIndex((i) => i.id === nextSibling.id);

                const next = [...prev];
                const temp = next[itemIdx];
                next[itemIdx] = next[nextIdx];
                next[nextIdx] = temp;
                return next;
            }

            return prev;
        });
    };

    // Select or Open Tab
    const handleSelectTreeTab = (item: TreeTab) => {
        if (item.type !== 'tab') return;

        const existingIndex = tabs.findIndex(
            (t) => (t.title && t.title === item.name) || (t.query && t.query === item.query)
        );

        if (existingIndex === -1) {
            addTab();
            updateActiveTabValues({
                query: item.query || '',
                variables: item.variables || '',
                headers: item.headers || '',
            });
            changeTab(activeTabIndex);
        } else {
            changeTab(existingIndex);
        }
    };

    // Folder & Item Operations
    const handleCreateFolder = (parentId: string | null = null) => {
        if (!newFolderName.trim()) return;
        const newFolder: TreeTab = {
            id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            name: newFolderName.trim(),
            type: 'folder',
            parentId,
        };
        setTreeTabs((prev) => [...prev, newFolder]);
        setNewFolderName('');
    };

    const handleMoveItem = (itemId: string, targetFolderId: string | null) => {
        setTreeTabs((prev) =>
            prev.map((item) => (item.id === itemId ? { ...item, parentId: targetFolderId } : item))
        );
    };

    const handleDeleteItem = (id: string) => {
        setTreeTabs((prev) => prev.filter((item) => item.id !== id && item.parentId !== id));
    };

    const toggleFolder = (folderId: string) => {
        setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    // Render Tree recursively
    const renderTree = (parentId: string | null = null, depth = 0) => {
        const children = treeTabs.filter((item) => item.parentId === parentId);

        return (
            <ul className={`list-unstyled mb-0 ${depth > 0 ? 'ps-3 border-start ms-2' : ''}`}>
                {children.map((item, index) => {
                    const isFolder = item.type === 'folder';
                    const isExpanded = expandedFolders[item.id];
                    const isOpenInEditor = tabs.some((t) => t.title === item.name || t.query === item.query);
                    const isDropTarget = dropTargetId === item.id;
                    const isFirst = index === 0;
                    const isLast = index === children.length - 1;

                    return (
                        <li
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => isFolder && handleDragOver(e, item.id)}
                            onDrop={(e) => isFolder && handleDrop(e, item.id)}
                            className="mb-1"
                        >
                            <div
                                className={`d-flex align-items-center justify-content-between gap-2 py-1 px-2 rounded ${
                                    isDropTarget ? 'bg-primary-subtle border border-primary' : ''
                                } ${draggedItemId === item.id ? 'opacity-50' : ''}`}
                            >
                                <div className="d-flex align-items-center gap-1 text-truncate">
                                    {isFolder ? (
                                        <button
                                            type="button"
                                            onClick={() => toggleFolder(item.id)}
                                            className="btn btn-link btn-sm text-decoration-none text-dark p-0 fw-bold border-0 text-start d-flex align-items-center gap-1"
                                        >
                      <span
                          className="text-secondary user-select-none"
                          style={{ fontSize: '9px', width: '12px', display: 'inline-block' }}
                      >
                        {isExpanded ? '▼' : '▶'}
                      </span>
                                            <span>{isExpanded ? '📂' : '📁'}</span>
                                            <span>{item.name}</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleSelectTreeTab(item)}
                                            className={`btn btn-link btn-sm text-decoration-none p-0 border-0 text-start ms-3 ${
                                                isOpenInEditor ? 'text-primary fw-bold' : 'text-body'
                                            }`}
                                        >
                                            📄 {item.name}
                                            {isOpenInEditor && (
                                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle ms-2">
                          Open
                        </span>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* 3-Dots Options Menu */}
                                <div className="position-relative">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === item.id ? null : item.id);
                                        }}
                                        className="btn btn-sm btn-link text-secondary text-decoration-none p-0 px-1 border-0 fw-bold"
                                        title="Options"
                                    >
                                        ⋮
                                    </button>

                                    {openMenuId === item.id && (
                                        <div
                                            className="dropdown-menu show dropdown-menu-end position-absolute end-0 top-100 shadow-sm py-1"
                                            style={{ zIndex: 1050, minWidth: '120px' }}
                                        >
                                            <button
                                                type="button"
                                                className="dropdown-item small d-flex align-items-center gap-2"
                                                disabled={isFirst}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMoveOrder(item.id, 'up');
                                                    setOpenMenuId(null);
                                                }}
                                            >
                                                ▲ Move Up
                                            </button>
                                            <button
                                                type="button"
                                                className="dropdown-item small d-flex align-items-center gap-2"
                                                disabled={isLast}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMoveOrder(item.id, 'down');
                                                    setOpenMenuId(null);
                                                }}
                                            >
                                                ▼ Move Down
                                            </button>
                                            <div className="dropdown-divider my-1"></div>
                                            <button
                                                type="button"
                                                className="dropdown-item small text-danger d-flex align-items-center gap-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteItem(item.id);
                                                    setOpenMenuId(null);
                                                }}
                                            >
                                                ✕ Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isFolder && isExpanded && renderTree(item.id, depth + 1)}
                        </li>
                    );
                })}
            </ul>
        );
    };

    return (
        <div className="p-3 w-100">
            {/* Top Action Bar */}
            <div className="d-flex gap-2 mb-3">
                <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => addTab()}
                >
                    + Blank Tab
                </button>
            </div>

            {/* SECTION 1: Open Tabs (Expandable) */}
            <div className="mb-4 pb-3 border-bottom">
                <div className="d-flex align-items-center justify-content-between mb-2">
                    <button
                        type="button"
                        onClick={() => setIsOpenTabsExpanded(!isOpenTabsExpanded)}
                        className="btn btn-link text-decoration-none text-secondary p-0 fw-bold text-uppercase d-flex align-items-center gap-1 border-0"
                        style={{ fontSize: '0.875rem' }}
                    >
            <span
                className="user-select-none"
                style={{ fontSize: '9px', width: '12px', display: 'inline-block' }}
            >
              {isOpenTabsExpanded ? '▼' : '▶'}
            </span>
                        <span>Open Tabs</span>
                        <span className="badge bg-secondary ms-1">{tabs.length}</span>
                    </button>
                </div>

                {isOpenTabsExpanded && (
                    <div className="list-group">
                        {tabs.map((tab, index) => (
                            <div
                                key={tab.id || index}
                                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center p-2 ${
                                    index === activeTabIndex ? 'active' : ''
                                }`}
                            >
                <span
                    onClick={() => changeTab(index)}
                    className="user-select-none flex-grow-1"
                    role="button"
                >
                  {index === activeTabIndex ? '▶ ' : ''}
                    Tab {index + 1} {tab.title ? `(${tab.title})` : ''}
                </span>
                                <button
                                    type="button"
                                    onClick={() => closeTab(index)}
                                    className={`btn btn-sm ${
                                        index === activeTabIndex ? 'btn-light text-danger' : 'btn-outline-danger'
                                    } py-0 px-2`}
                                >
                                    Close
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SECTION 2: All Tabs (Tree Explorer) */}
            <div>
                <h6 className="text-uppercase text-secondary fw-bold mb-2">
                    All Saved Tabs &amp; Folders
                </h6>

                {/* Input Group to Create Folders */}
                <div className="input-group input-group-sm mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="New folder name..."
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                    />
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => handleCreateFolder(null)}
                    >
                        + Folder
                    </button>
                </div>

                {/* Scrollable Tree View Container */}
                <div
                    onDragOver={(e) => handleDragOver(e, null)}
                    onDrop={(e) => handleDrop(e, null)}
                    className={`border rounded p-2 bg-light overflow-auto mh-100 ${
                        dropTargetId === 'ROOT' ? 'border-primary bg-primary-subtle' : ''
                    }`}
                    style={{ minHeight: '150px' }}
                >
                    {treeTabs.length === 0 ? (
                        <span className="text-muted small">No saved tabs or folders yet.</span>
                    ) : (
                        renderTree(null, 0)
                    )}
                </div>
            </div>
        </div>
    );
}
