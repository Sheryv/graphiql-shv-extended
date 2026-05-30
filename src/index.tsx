import { createRoot } from 'react-dom/client';
import App from './components/App';
import './index.scss'


// import * as monaco from 'monaco-editor';
//
// // 1. Import the workers using Vite's native ?worker suffix
// import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
// import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
// import GraphQLWorker from './monacoeditorwork/graphql.worker..bundle.js'
// // Note: Depending on what GraphQL package you are using alongside Monaco,
// // the import path for the GraphQL worker might vary.
// // A common one is 'monaco-graphql':
// // import GraphqlWorker from 'monaco-graphql/esm/graphql.worker?worker';
//
// // 2. Define the MonacoEnvironment on the global scope
// // We extend the Window object type to prevent TypeScript errors
// declare global {
//     interface Window {
//         MonacoEnvironment: monaco.Environment;
//     }
// }
//
// self.MonacoEnvironment = {
//     // The getWorker function routes Monaco to the correct worker based on the language
//     getWorker(_workerId: string, label: string): Worker {
//         if (label === 'json') {
//             return new JsonWorker();
//         }
//
//         if (label === 'graphql') {
//             // Uncomment if you have your graphql worker imported above
//             return new GraphQLWorker();
//         //     'monaco-graphql/esm/graphql.worker.js'
//         }
//
//         // The default fallback is the core editor worker
//         return new EditorWorker();
//     }
// };


self["MonacoEnvironment"] = (function (paths: Record<string, string>) {
    return {
        globalAPI: false,
        getWorkerUrl : function (moduleId, label) {
            var result =  paths[label];
            if (/^((http:)|(https:)|(file:)|(\/\/))/.test(result)) {
                var currentUrl = String(window.location);
                var currentOrigin = currentUrl.substr(0, currentUrl.length - window.location.hash.length - window.location.search.length - window.location.pathname.length);
                if (result.substring(0, currentOrigin.length) !== currentOrigin) {
                    var js = '/*' + label + '*/importScripts("' + result + '");';
                    var blob = new Blob([js], { type: 'application/javascript' });
                    return URL.createObjectURL(blob);
                }
            }
            return result;
        }
    };
})({
    "editorWorkerService": "/monacoeditorwork/editor.worker.bundle.js",
    "json": "/monacoeditorwork/json.worker.bundle.js",
    "graphql": "/monacoeditorwork/graphql.worker..bundle.js"
});


const root = createRoot(document.getElementById('graphiql')!);
root.render(<App />);
