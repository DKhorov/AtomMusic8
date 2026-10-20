// Product Name: NextJS App Product Version: 1.0 Product Type: Component Language: JavaScript File Name: src/components/SectionGrid.jsx Author: User Company Name: N/A Date last update: 2026-10-20
"use client";
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import { PlayArrowRoundedIcon, AddRoundedIcon, PlaylistPlayRoundedIcon } from '../icons';
import TrackCover from '../TrackCover';
import { PixelHeartIcon } from '../PixelCover';
import QueueClearDialog from '../QueueClearDialog';
import ScrollRow from '../ScrollRow';
import { useSettings } from '../../context/SettingsContext';
import { api } from '../../lib/axios';
import { useMusic } from '../../context/MusicContext';
import { useAuth } from '../../context/AuthContext';
import { formatTrackRow } from '../../lib/trackFormat';
import { useRouter } from 'next/navigation';

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
            sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                outline: 'none',
                p: 0,
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    transform: 'scale(1.2)',
                },
                '&:active': {
                    transform: 'scale(0.9)',
                },
                '@keyframes heartPulse': {
                    '0%': { transform: 'scale(1)' },
                    '30%': { transform: 'scale(1.35)' },
                    '60%': { transform: 'scale(0.85)' },
                    '100%': { transform: 'scale(1)' },
                }
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: animate ? 'heartPulse 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
                    filter: isFavorite ? 'drop-shadow(0px 0px 8px #ff4f7b)' : 'drop-shadow(0px 0px 4px rgba(0,0,0,0.7))',
                    transition: 'filter 0.3s ease',
                }}
            >
                <PixelHeartIcon isFavorite={isFavorite} size={22} />
            </Box>
        </Box>
    );
}

export default function SectionGrid({ title }) {
    const { tracks, setTracks, queue, playTrackNow, addToQueue, favoriteIds, toggleFavorite } = useMusic();
    const { isAuthed, requestLogin } = useAuth();
    const settings = useSettings();
    const router = useRouter();
    const [pendingTrack, setPendingTrack] = useState(null);
    const [playlistMenuAnchor, setPlaylistMenuAnchor] = useState(null);
    const [trackForPlaylist, setTrackForPlaylist] = useState(null);
    const [playlists, setPlaylists] = useState([]);
    const [loadingPlaylists, setLoadingPlaylists] = useState(false);

    const loadPlaylists = async () => {
        if (!isAuthed) return;
        setLoadingPlaylists(true);
        try {
            const res = await api.get("/music/playlists");
            setPlaylists(res.data.playlists || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingPlaylists(false);
        }
    };

    const openPlaylistMenu = (event, track) => {
        event.stopPropagation();
        if (!isAuthed) { requestLogin(); return; }
        setTrackForPlaylist(track);
        setPlaylistMenuAnchor(event.currentTarget);
        loadPlaylists();
    };

    const addToPlaylist = async (playlistId) => {
        if (!trackForPlaylist) return;
        try {
            await api.post(`/music/playlists/${playlistId}/tracks`, { trackId: trackForPlaylist.id });
            setPlaylistMenuAnchor(null);
            setTrackForPlaylist(null);
        } catch (err) {
            console.error(err);
        }
    };

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

                                    {isAuthed && (
                                        <IconButton
                                            onClick={(e) => openPlaylistMenu(e, track)}
                                            sx={{ position: 'absolute', top: 4, left: 4, color: 'white', bgcolor: 'rgba(0,0,0,0.4)', p: 0.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                                        >
                                            <PlaylistPlayRoundedIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    )}
                                </Box>

                                <PixelFavoriteButton
                                    isFavorite={favoriteIds.has(track.id)}
                                    onClick={(e) => handleHeart(e, track)}
                                />
                            </Box>

                            <Box sx={{ p: 1.5, width: '100%', boxSizing: 'border-box' }}>
                                <Typography sx={{ color: 'white', fontSize: '14px', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {track.title}
                                </Typography>
                                <Typography sx={{ color: '#939393', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

            <Menu
                anchorEl={playlistMenuAnchor}
                open={Boolean(playlistMenuAnchor)}
                onClose={() => { setPlaylistMenuAnchor(null); setTrackForPlaylist(null); }}
                sx={{ '& .MuiPaper-root': { bgcolor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)' } }}
            >
                {loadingPlaylists ? (
                    <MenuItem disabled sx={{ color: '#fff', px: 2, py: 1 }}>Загрузка...</MenuItem>
                ) : playlists.length === 0 ? (
                    <MenuItem disabled sx={{ color: '#fff', px: 2, py: 1 }}>Нет плейлистов. <Button size="small" onClick={() => { setPlaylistMenuAnchor(null); router.push('/playlist/create'); }}>Создать</Button></MenuItem>
                ) : (
                    <>
                        {playlists.map((pl) => (
                            <MenuItem
                                key={pl.id}
                                onClick={() => addToPlaylist(pl.id)}
                                sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                            >
                                {pl.title} ({pl.tracks_count || 0})
                            </MenuItem>
                        ))}
                    </>
                )}
            </Menu>
        </Box>
    );
}