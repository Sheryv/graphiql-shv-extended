import React, {useEffect, useRef} from 'react';
// Import directly from the local bundled monaco-editor package
import * as monaco from 'monaco-editor';

interface CodeViewerProps {
    content: string;
    language?: string;
    height?: string;
}

export default function CodeViewer({content, height = '350px', language = 'json'}: CodeViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // 1. Initialize the vanilla Monaco Editor instance
        editorRef.current = monaco.editor.create(containerRef.current, {
            value: content,
            language: language,
            theme: 'vs-dark',
            readOnly: true,
            minimap: {enabled: false},
            automaticLayout: true, // Resizes correctly if the window or panel moves
            domReadOnly: true,
            scrollBeyondLastLine: false,
            fontSize: 15,
            fontFamily: '"Fira Code", Consolas, "Courier New", monospace'
        });

        // 2. Cleanup: Destroy the editor instance when the component unmounts
        return () => {
            if (editorRef.current) {
                editorRef.current.dispose();
            }
        };
    }, []); // Empty dependency array ensures this only runs ONCE on mount

    // 3. Keep the editor in sync if the 'data' prop updates dynamically
    useEffect(() => {
        if (editorRef.current) {
            const currentSelection = editorRef.current.getSelection();
            editorRef.current.setValue(content);
            // Restore selection/scroll position if needed, otherwise it resets to top
            if (currentSelection) editorRef.current.setSelection(currentSelection);
        }
    }, [content]);

    return (
        <div
            ref={containerRef}
            style={{
                height,
                width: '100%',
                overflow: 'hidden'
            }}
        />
    );
}
