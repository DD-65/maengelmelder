import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />

    {/*  Allows for toast notifications to be displayed globally */}
    <ToastContainer 
      position="bottom-center" // Position of the toast notifications
      autoClose={3000} // Auto close after 3 seconds
      hideProgressBar={false} // Show progress bar
      newestOnTop={false} // Newest toast on top
      closeOnClick // Close on click
      rtl={false} // Right-to-left layout
      pauseOnFocusLoss // Pause on focus loss
      draggable // Allow dragging to dismiss
      pauseOnHover // Pause on hover
      theme="dark" // Use dark theme
      toastClassName="glass-toast" // Custom class for styling the toast notifications
    />
    
  </StrictMode>,
)
