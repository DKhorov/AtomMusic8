"use client";
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { PlayArrowRoundedIcon, AddRoundedIcon } from '../icons';
import TrackCover from '../TrackCover';
import { PixelHeartIcon } from '../PixelCover';
import QueueClearDialog from '../QueueClearDialog';
import ScrollRow from '../ScrollRow';
import { useSettings } from '../../context/SettingsContext';
import { api } from '../../lib/axios';
import { useMusic } from '../../context/MusicContext';
import { useAuth } from '../../context/AuthContext';
import { formatTrackRow } from '../../lib/trackFormat';

// Пиксельная кнопка с компактной аккуратной рамкой и анимацией
function PixelFavoriteButton({ isFavorite, onClick }) {
    const [animate, setAnimate] = useState(false);

    const handleClick = (e) => {
        setAnimate(true);
        setTimeout(() => setAnimate(false), 450);
        onClick(e);
    };

    return (
        <Box
            component="button"
            onClick={handleClick}
            title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
            sx={{
                position: 'absolute',
                right: 6,
                bottom: 6,
                width: '24px',
                height: '24px',
                p: 0,
                m: 0,
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isFavorite ? 'rgba(20, 10, 15, 0.75)' : 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(3px)',
                borderRadius: '1px',
                boxShadow: isFavorite
                    ? '0 0 0 1px #ff2a6d, 1px 1px 0px rgba(0,0,0,0.85)'
                    : '0 0 0 1px rgba(255,255,255,0.25), 1px 1px 0px rgba(0,0,0,0.85)',
                transition: 'all 0.15s ease',
                '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.85)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 0 0 1px #ff2a6d, 1.5px 1.5px 0px rgba(0,0,0,0.9)',
                },
                '&:active': {
                    transform: 'translate(1px, 1px)',
                    boxShadow: '0 0 0 1px #ff2a6d',
                },
                animation: animate ? 'pixelHeartPop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
                '@keyframes pixelHeartPop': {
                    '0%': { transform: 'scale(1)' },
                    '35%': { transform: 'scale(1.35) rotate(-8deg)' },
                    '70%': { transform: 'scale(0.88) rotate(4deg)' },
                    '100%': { transform: 'scale(1) rotate(0deg)' },
                }
            }}
        >
            <PixelHeartIcon isFavorite={isFavorite} />
        </Box>
    );
}

export default function SectionGrid({ title }) {
    const { tracks, setTracks, queue, playTrackNow, addToQueue, favoriteIds, toggleFavorite } = useMusic();
    const { isAuthed, requestLogin } = useAuth();
    const settings = useSettings();
    const [pendingTrack, setPendingTrack] = useState(null);

    const handleHeart = (event, track) => {
        event.stopPropagation();
        if (!isAuthed) { requestLogin(); return; }
        toggleFavorite(track);
    };

    const handlePlayNow = (track) => {
        if (!isAuthed) { requestLogin(); return; }
        if (settings.queue !== false && queue.length > 1) {
            setPendingTrack(track);
            return;
        }
        playTrackNow(track);
    };

    const confirmReplaceQueue = () => {
        if (pendingTrack) playTrackNow(pendingTrack);
        setPendingTrack(null);
    };

    const enqueueInstead = () => {
        if (pendingTrack) addToQueue(pendingTrack);
        setPendingTrack(null);
    };

    useEffect(() => {
        const fetchMusic = async () => {
            try {
                const res = await api.get("/music/list");
                setTracks((res.data.tracks || []).map(formatTrackRow));
            } catch (err) {
                console.error("Ошибка получения музыки:", err?.message || err);
            }
        };
        fetchMusic();
    }, [setTracks]);

    return (
        <Box sx={{ mb: 4, px: { xs: 2, sm: 4 } }}>
            <Typography sx={{ color: '#a0a0a0', fontSize: '14px', mb: 2 }}>{title}</Typography>
            <ScrollRow gap={{ xs: 1.5, sm: 2 }}>
                {tracks.length > 0 ? (
                    tracks.map((track) => (
                        <Box
                            key={track.id}
                            onClick={() => handlePlayNow(track)}
                            sx={{
                                width: { xs: '38vw', sm: '180px' },
                                minWidth: 0,
                                flexShrink: 0,
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.02)' },
                                '&:hover .cover-overlay': { opacity: 1 },
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'relative',
                                    width: '100%',
                                    aspectRatio: '1 / 1',
                                    bgcolor: '#555555',
                                    overflow: 'hidden',
                                }}
                            >
                                <TrackCover src={track.cover} alt={track.title} sizes="180px" />

                                <Box
                                    className="cover-overlay"
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        bgcolor: 'rgba(0,0,0,0.5)',
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <IconButton
                                        onClick={(e) => { e.stopPropagation(); handlePlayNow(track); }}
                                        sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' } }}
                                    >
                                        <PlayArrowRoundedIcon sx={{ fontSize: 32 }} />
                                    </IconButton>

                                    {settings.queue !== false && (
                                        <IconButton
                                            onClick={(e) => { e.stopPropagation(); addToQueue(track); }}
                                            sx={{ position: 'absolute', top: 4, right: 4, color: 'white', bgcolor: 'rgba(0,0,0,0.4)', p: 0.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                                        >
                                            <AddRoundedIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    )}
                                </Box>

                                {/* Пиксельная кнопка добавления в избранное */}
                                <PixelFavoriteButton
                                    isFavorite={favoriteIds.has(track.id)}
                                    onClick={(e) => handleHeart(e, track)}
                                />
                            </Box>

                            <Box sx={{ p: 1.5, width: '100%', boxSizing: 'border-box' }}>
                                <Typography sx={{ color: 'white', fontSize: '14px', textAlign:'center', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {track.title}
                                </Typography>
                                <Typography sx={{ color: '#939393', fontSize: '12px', whiteSpace: 'nowrap', textAlign:'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {track.author}
                                </Typography>
                            </Box>
                        </Box>
                    ))
                ) : (
                    [...Array(8)].map((_, i) => (
                        <Box key={i} sx={{ width: { xs: '38vw', sm: '180px' }, aspectRatio: '1 / 1', bgcolor: '#333333', borderRadius: '4px', flexShrink: 0 }} />
                    ))
                )}
            </ScrollRow>

            <QueueClearDialog
                track={pendingTrack}
                queueCount={queue.length}
                open={Boolean(pendingTrack)}
                onCancel={() => setPendingTrack(null)}
                onConfirm={confirmReplaceQueue}
                onEnqueue={enqueueInstead}
            />
        </Box>
    );
}