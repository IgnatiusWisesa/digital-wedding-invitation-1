import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import { AdminLogin } from './pages/admin/Login'
import { AdminDashboard } from './pages/admin/Dashboard'
import { ChooseDashboard } from './pages/admin/ChooseDashboard'
import { RegDashboard } from './pages/admin/RegDashboard'
import { ProtectedRoute } from './components/admin/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Camera } from './pages/Camera'
import { LiveAlbum } from './pages/LiveAlbum'
import { InvitePage } from './pages/InvitePage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
        <BrowserRouter basename={import.meta.env.BASE_URL?.replace(/\/$/, '') || ''}>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/two" element={<App />} />
                <Route path="/three" element={<App />} />
                <Route path="/four" element={<App />} />
                <Route path="/five" element={<App />} />
                <Route path="/six" element={<App />} />
                <Route path="/seven" element={<App />} />
                <Route path="/eight" element={<App />} />
                <Route path="/nine" element={<App />} />
                <Route path="/ten" element={<App />} />
                <Route path="/eleven" element={<App />} />
                <Route path="/twelve" element={<App />} />
                <Route path="/thirteen" element={<App />} />
                <Route path="/fourteen" element={<App />} />
                <Route path="/fifteen" element={<App />} />
                <Route path="/sixteen" element={<App />} />
                <Route path="/seventeen" element={<App />} />
                <Route path="/eighteen" element={<App />} />
                <Route path="/nineteen" element={<App />} />
                <Route path="/twenty" element={<App />} />
                <Route path="/invite/:token" element={<InvitePage />} />
                <Route path="/snap" element={<Camera />} />
                <Route path="/live-album" element={<LiveAlbum />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                    path="/admin/choose"
                    element={
                        <ProtectedRoute>
                            <ChooseDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/reg/:desk"
                    element={
                        <ProtectedRoute>
                            <RegDashboard />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    </ErrorBoundary>
)
