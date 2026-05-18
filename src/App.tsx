// Entspricht Android: AppNavigation + Screen sealed class
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { settingsRepository } from '@/repositories/settingsRepository'
import SetupPage from '@/pages/SetupPage'
import RoomListPage from '@/pages/RoomListPage'
import ChatListPage from '@/pages/ChatListPage'
import ConversationPage from '@/pages/ConversationPage'
import SettingsPage from '@/pages/SettingsPage'

function RequireSetup({ children }: { children: React.ReactNode }) {
    if (!settingsRepository.isSetupComplete()) {
        return <Navigate to="/setup" replace />
    }
    return <>{children}</>
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/setup" element={<SetupPage />} />
                <Route
                    path="/rooms"
                    element={
                        <RequireSetup>
                            <RoomListPage />
                        </RequireSetup>
                    }
                />
                <Route
                    path="/rooms/:roomId"
                    element={
                        <RequireSetup>
                            <ChatListPage />
                        </RequireSetup>
                    }
                />
                <Route
                    path="/chat/:chatId"
                    element={
                        <RequireSetup>
                            <ConversationPage />
                        </RequireSetup>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <RequireSetup>
                            <SettingsPage />
                        </RequireSetup>
                    }
                />
                {/* Default redirect */}
                <Route
                    path="*"
                    element={
                        <Navigate
                            to={settingsRepository.isSetupComplete() ? '/rooms' : '/setup'}
                            replace
                        />
                    }
                />
            </Routes>
        </BrowserRouter>
    )
}
