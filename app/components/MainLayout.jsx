import Box from '@mui/material/Box';
import Sidebar from './Sidebar';
import ApplePlayer from './ApplePlayer';
import TrackNotification from './TrackNotification';
import { MusicProvider } from '../context/MusicContext';
import { SettingsProvider } from '../context/SettingsContext';
import { AuthProvider } from '../context/AuthContext';

export default function MainLayout({ children }) {
    return (
        <SettingsProvider>
            <AuthProvider>
                <MusicProvider>
                    <Box
                        sx={{
                            display: "flex",
                            height: "100vh",
                            width: "100vw",
                            overflow: "hidden",
                            p: 1.5,
                            pb: { xs: 'calc(78px + env(safe-area-inset-bottom, 0px))', sm: 1.5 },
                            gap: 1.5,
                            boxSizing: "border-box",
                            bgcolor: "#121212"
                        }}
                    >
                        <Sidebar />
                        <Box
                            sx={{
                                bgcolor: '#0a0a0a',
                                width: '100%',
                                height: '100%',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}
                        >
                            {children}
                        </Box>

                        <ApplePlayer />

                        <TrackNotification />
                    </Box>
                </MusicProvider>
            </AuthProvider>
        </SettingsProvider>
    );
}
