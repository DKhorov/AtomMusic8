"use client";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useRouter } from 'next/navigation';
import { ArrowBackRoundedIcon, FavoriteRoundedIcon, SettingsRoundedIcon, LogoutRoundedIcon, HeadphonesRoundedIcon, PersonRoundedIcon } from './icons';
import TrackCover from './TrackCover';
import { useMusic } from '../context/MusicContext';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
    const router = useRouter();
    const { favorites, currentTrack } = useMusic();
    const { isAuthed, user, requestLogin, logout } = useAuth();

    const username = user?.username || 'Пользователь';
    const avatarUrl = user?.avatarUrl || '/1.png';

    return (
        <Box
            sx={{
                flexGrow: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                pt: 6,
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none',
            }}
        >
            <Box sx={{ px: { xs: 3, sm: 6 }, mb: 2 }}>
                <Button
                    onClick={() => router.push('/')}
                    startIcon={<ArrowBackRoundedIcon />}
                    sx={{
                        color: '#a0a0a0', textTransform: 'none',
                        fontSize: '13px', fontWeight: 500,
                        '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.04)' },
                    }}
                >
                    На главную
                </Button>
            </Box>

            <Box sx={{ px: { xs: 3, sm: 6 }, mb: 4, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                <Box
                    sx={{
                        position: 'relative',
                        width: { xs: 96, sm: 144 },
                        height: { xs: 96, sm: 144 },
                        borderRadius: '50%',
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        bgcolor: '#1c1c20',
                    }}
                >
                    <TrackCover src={avatarUrl} alt={username} sizes="144px" />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '13px', color: '#a0a0a0', letterSpacing: '1px', mb: 1 }}>
                        МОЙ ПРОФИЛЬ
                    </Typography>
                    <Typography sx={{ color: '#fff', fontSize: { xs: '26px', sm: '40px' }, fontWeight: 800 }}>
                        {isAuthed ? username : 'Гость'}
                    </Typography>
                    {isAuthed && (
                        <Typography sx={{ color: '#a0a0a0', fontSize: '14px', mt: 1 }}>
                            {favorites.length} избранных трек(ов)
                        </Typography>
                    )}
                </Box>
            </Box>

            {!isAuthed ? (
                <Box sx={{ px: { xs: 3, sm: 6 }, py: 6, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', mx: { xs: 2, sm: 4 }, borderRadius: '16px' }}>
                    <PersonRoundedIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                    <Typography sx={{ color: '#fff', fontSize: '18px', fontWeight: 600, mb: 1 }}>
                        Войдите в аккаунт AtomGlide
                    </Typography>
                    <Typography sx={{ color: '#939393', fontSize: '14px', mb: 3 }}>
                        Профиль, избранное и настройки доступны после входа
                    </Typography>
                    <Button
                        onClick={requestLogin}
                        variant="contained"
                        disableElevation
                        sx={{
                            bgcolor: '#fff', color: '#000', borderRadius: '24px', px: 3,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.85)' },
                        }}
                    >
                        Войти
                    </Button>
                </Box>
            ) : (
                <Box sx={{ px: { xs: 2, sm: 4 }, pb: 6, display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 720, width: '100%', mx: 'auto' }}>
                    <Box
                        onClick={() => router.push('/favorites')}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 2,
                            px: 2.5, py: 2, borderRadius: '14px', cursor: 'pointer',
                            bgcolor: 'rgba(255,255,255,0.03)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                        }}
                    >
                        <FavoriteRoundedIcon sx={{ fontSize: 22, color: '#ff4f7b' }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>Избранное</Typography>
                            <Typography sx={{ color: '#939393', fontSize: '13px' }}>
                                {favorites.length > 0
                                    ? `В списке ${favorites.length} трек(ов)`
                                    : 'Список пока пуст — добавьте треки через ♥'}
                            </Typography>
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 2,
                            px: 2.5, py: 2, borderRadius: '14px',
                            bgcolor: 'rgba(255,255,255,0.03)',
                        }}
                    >
                        <HeadphonesRoundedIcon sx={{ fontSize: 22, color: 'rgba(255,255,255,0.5)' }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>Сейчас играет</Typography>
                            <Typography noWrap sx={{ color: currentTrack ? '#939393' : 'rgba(147,147,147,0.6)', fontSize: '13px' }}>
                                {currentTrack ? `${currentTrack.title} — ${currentTrack.author}` : 'Ничего не воспроизводится'}
                            </Typography>
                        </Box>
                    </Box>

                    <Box
                        onClick={() => router.push('/settings')}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 2,
                            px: 2.5, py: 2, borderRadius: '14px', cursor: 'pointer',
                            bgcolor: 'rgba(255,255,255,0.03)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                        }}
                    >
                        <SettingsRoundedIcon sx={{ fontSize: 22, color: 'rgba(255,255,255,0.5)' }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>Настройки</Typography>
                            <Typography sx={{ color: '#939393', fontSize: '13px' }}>
                                Звук кликов, уведомления и другие параметры
                            </Typography>
                        </Box>
                    </Box>

                    <Box
                        onClick={() => logout()}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 2,
                            px: 2.5, py: 2, borderRadius: '14px', cursor: 'pointer',
                            bgcolor: 'rgba(255,255,255,0.03)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                        }}
                    >
                        <LogoutRoundedIcon sx={{ fontSize: 22, color: 'rgba(255,255,255,0.5)' }} />
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>Выйти из аккаунта</Typography>
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
