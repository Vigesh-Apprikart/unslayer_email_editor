import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import EditorPage from './pages/EditorPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <EditorPage />
  </StrictMode>,
)
