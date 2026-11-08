import { createRoot } from 'react-dom/client';
import 'graphiql/setup-workers/vite';
import App from './components/App';
import './index.scss'



const root = createRoot(document.getElementById('graphiql')!);
root.render(<App />);
