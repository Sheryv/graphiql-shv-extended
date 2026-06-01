import { createRoot } from 'react-dom/client';
import App from './components/App';
import './index.scss'



const root = createRoot(document.getElementById('graphiql')!);
root.render(<App />);
