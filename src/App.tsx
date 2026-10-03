import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import RateCard from './pages/RateCard'
import Proposals from './pages/Proposals'
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"
import { AppHeader } from "./components/AppHeader"

export default function App() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rate-card" element={<RateCard />} />
        <Route path="/proposals" element={<Proposals />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
