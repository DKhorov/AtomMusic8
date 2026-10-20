"use client";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import { useRouter } from 'next/navigation';
import { ArrowBackRoundedIcon, PlayArrowRoundedIcon, FavoriteRoundedIcon, FavoriteBorderRoundedIcon, HeadphonesRoundedIcon, GraphicEqRoundedIcon, DeleteOutlineRoundedIcon } from './icons';
import Image from 'next/image';
import TrackCover from './TrackCover';
import { useMusic } from '../context/MusicContext';
import { useAuth } from '../context/AuthContext';

function pluralN(n, one, few, many) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
}

export default function FavoritesPage() {
    const router = useRouter();
    const { favorites, favoriteIds, toggleFavorite, playFavorites, clearFavorites, currentTrack, isPlaying } = useMusic();
    const { isAuthed, requestLogin } = useAuth();

    const playAll = () => playFavorites(favorites, 0);

    const playOne = (idx) => playFavorites(favorites, idx);

    const handleHeart = (e, track) => {
        e.stopPropagation();
        if (!isAuthed) { requestLogin(); return; }
        toggleFavorite(track);
    };

    const count = favorites.length;

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
                        borderRadius: '16px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxShadow: '0 8px 32px rgba(255,79,123,0.15)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        bgcolor: '#1c1c20',
                    }}
                >
                    <Image
                        src="/2.png"
                        alt="Избранное"
                        fill
                        sizes="144px"
                        draggable={false}
                        style={{ objectFit: 'cover' }}
                    />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '13px', color: '#a0a0a0', letterSpacing: '1px', mb: 1 }}>
                        ПЛЕЙЛИСТ
                    </Typography>
                    <Typography sx={{ color: '#fff', fontSize: { xs: '26px', sm: '40px' }, fontWeight: 800 }}>
                        Мои любимые треки
                    </Typography>
                    <Typography sx={{ color: '#a0a0a0', fontSize: '14px', mt: 1 }}>
                        {isAuthed
                            ? `${count} ${pluralN(count, 'трек', 'трека', 'треков')}`
                            : 'Требуется вход в аккаунт'}
                    </Typography>
                </Box>
            </Box>

            {isAuthed && count > 0 && (
                <Box sx={{ px: { xs: 3, sm: 6 }, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button
                        onClick={playAll}
                        startIcon={<PlayArrowRoundedIcon />}
                        variant="contained"
                        disableElevation
                        sx={{
                            bgcolor: '#fff', color: '#000',
                            borderRadius: '24px', px: 3, py: 1.2, fontWeight: 600,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.85)' },
                        }}
                    >
                        Включить всё
                    </Button>

                    <Button
                        onClick={() => router.push('/feed?fav=1')}
                        startIcon={<GraphicEqRoundedIcon />}
                        sx={{
                            color: '#fff',
                            borderRadius: '24px', px: 3, py: 1.2, fontWeight: 600,
                            border: '1px solid rgba(255,255,255,0.25)',
                            '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.06)' },
                        }}
                    >
                        Поток избранных
                    </Button>

                    <Button
                        onClick={clearFavorites}
                        startIcon={<DeleteOutlineRoundedIcon />}
                        sx={{
                            color: '#fff',
                            borderRadius: '24px', px: 3, py: 1.2, fontWeight: 600,
                            border: '1px solid rgba(255,255,255,0.25)',
                            '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.06)' },
                        }}
                    >
                        Очистить всё
                    </Button>
                </Box>
            )}

            {!isAuthed ? (
                <Box sx={{ px: { xs: 3, sm: 6 }, py: 6, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', mx: { xs: 2, sm: 4 }, borderRadius: '16px' }}>
                    <FavoriteRoundedIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
                    <Typography sx={{ color: '#fff', fontSize: '18px', fontWeight: 600, mb: 1 }}>
                        Войдите в аккаунт AtomGlide
                    </Typography>
                    <Typography sx={{ color: '#939393', fontSize: '14px', mb: 3 }}>
                        Избранные треки хранятся в вашем профиле
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
            ) : count === 0 ? (
                <Box sx={{ px: { xs: 3, sm: 6 }, py: 6, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', mx: { xs: 2, sm: 4 }, borderRadius: '16px' }}>
                    <HeadphonesRoundedIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                    <Typography sx={{ color: '#fff', fontSize: '18px', fontWeight: 600, mb: 1 }}>
                        Здесь пока пусто
                    </Typography>
                    <Typography sx={{ color: '#939393', fontSize: '14px' }}>
                        Добавляйте треки через ♥ на карточках на главной — они появятся здесь
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ px: { xs: 2, sm: 4 }, pb: 6 }}>
                    {favorites.map((track, idx) => {
                        const isCurrent = currentTrack?.id === track.id;
                        return (
                            <Box
                                key={`${track.id}-${idx}`}
                                onClick={() => playOne(idx)}
                                sx={{
                                    display: 'flex', alignItems: 'center', gap: 2,
                                    px: 2, py: 1.25, borderRadius: '12px', cursor: 'pointer',
                                    bgcolor: isCurrent ? 'rgba(255,255,255,0.06)' : 'transparent',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                                }}
                            >
                                {isCurrent && isPlaying ? (
                                    <FavoriteRoundedIcon sx={{ fontSize: 18, color: '#ff4f7b', flexShrink: 0, ml: 1 }} />
                                ) : (
                                    <Typography sx={{ color: '#7a7a7a', fontSize: '13px', width: 20, textAlign: 'right' }}>
                                        {idx + 1}
                                    </Typography>
                                )}

                                <Box
                                    sx={{
                                        position: 'relative',
                                        width: 48,
                                        height: 48,
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        bgcolor: '#1e1e1e',
                                    }}
                                >
                                    <TrackCover src={track.cover} alt="" sizes="48px" />
                                </Box>

                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography noWrap sx={{ color: '#fff', fontSize: '14.5px', fontWeight: isCurrent ? 700 : 500, opacity: isCurrent ? 1 : 0.85 }}>
                                        {track.title}
                                    </Typography>
                                    <Typography noWrap sx={{ color: '#939393', fontSize: '12.5px' }}>
                                        {track.author}
                                    </Typography>
                                </Box>

                                <IconButton
                                    size="small"
                                    aria-label={favoriteIds.has(track.id) ? 'Убрать из избранного' : 'Добавить в избранное'}
                                    onClick={(e) => handleHeart(e, track)}
                                >
                                    {favoriteIds.has(track.id)
                                        ? <FavoriteRoundedIcon sx={{ color: '#ff4f7b', fontSize: 19 }} />
                                        : <FavoriteBorderRoundedIcon sx={{ color: '#7a7a7a', fontSize: 19, '&:hover': { color: '#fff' } }} />}
                                </IconButton>

                                <IconButton
                                    size="small"
                                    aria-label="Включить"
                                    onClick={(e) => { e.stopPropagation(); playOne(idx); }}
                                    sx={{ color: '#939393', '&:hover': { color: '#fff' } }}
                                >
                                    <PlayArrowRoundedIcon />
                                </IconButton>
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}
