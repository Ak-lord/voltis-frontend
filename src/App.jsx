import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Carte from './pages/Carte'
import MonQuartier from './pages/MonQuartier'
import QuartierDetail from './pages/QuartierDetail'
import Signaler from './pages/Signaler'
import Alertes from './pages/Alertes'
import { ThemeProvider } from './hooks/useTheme'

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <div className="flex flex-col" style={{ background: 'var(--bg-main)', height: '100dvh' }}>
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"               element={<MonQuartier />} />
            <Route path="/carte"          element={<Carte />} />
            <Route path="/quartier/:id"   element={<QuartierDetail />} />
            <Route path="/signaler"       element={<Signaler />} />
            <Route path="/alertes"        element={<Alertes />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
    </ThemeProvider>
  )
}
