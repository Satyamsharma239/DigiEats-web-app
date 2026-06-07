import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './redux/store.js'
import { GoogleOAuthProvider } from '@react-oauth/google' // Yeh nayi line add hui hai

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Provider store={store}>
      {/* Google Provider ko App ke upar wrap kar diya */}
      <GoogleOAuthProvider clientId="984815675908-hfs1e4pgb4e393begc4779oih083ot94.apps.googleusercontent.com">
        <App />
      </GoogleOAuthProvider>
    </Provider>
  </BrowserRouter>
)