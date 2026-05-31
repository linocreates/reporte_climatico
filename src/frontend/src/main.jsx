import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import ClimaApp from './ClimaApp'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClimaApp />
  </StrictMode>,
)
