import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import App from './App.jsx'
import axios from 'axios';

// --- Global Axios Configuration ---
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
// ----------------------------------

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
