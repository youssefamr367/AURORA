import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// @ts-ignore
import {disableReactDevTools} from "@fvilers/disable-react-devtools";

if (import.meta.env.PROD) disableReactDevTools();
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

