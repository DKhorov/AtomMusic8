"use client";
import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Pagination from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';
import { PlayArrowRoundedIcon, GraphicEqRoundedIcon, FavoriteRoundedIcon, FavoriteBorderRoundedIcon, AddRoundedIcon, PaginationPrevIcon, PaginationNextIcon } from '../icons';
import TrackCover from '../TrackCover';
import QueueClearDialog from '../QueueClearDialog';
import { useMusic } from '../../context/MusicContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const PER_PAGE = 10;

export default function AllTracksSection({ title }) {
    const { tracks, queue, playTrackNow, addToQueue, favoriteIds, toggleFavorite, currentTrack, isPlaying } = useMusic();
    const { isAuthed, requestLogin } = useAuth();
    const settings = useSettings();
    const [page, setPage] = useState(1);
    const [pendingTrack, setPendingTrack] = useState(null);

    const pageCount = Math.max(1, Math.ceil(tracks.length / PER_PAGE));
    const safePage = Math.min(page, pageCount);
    const slice = tracks.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

    const handlePlayNow = (track) => {
        if (!isAuthed) { requestLogin(); return; }
        if (settings.queue !== false && queue.length > 1) {
            setPendingTrack(track);
            return;
        }
        playTrackNow(track);
    };

    const confirmReplaceQueue = () => {
        playTrackNow(pendingTrack);
        setPendingTrack(null);
    };

    const enqueueInstead = () => {
        if (pendingTrack) addToQueue(pendingTrack);
        setPendingTrack(null);
    };

    const handleHeart = (e, track) => {
        e.stopPropagation();
        if (!isAuthed) { requestLogin(); return; }
        toggleFavorite(track);
    };

    return (
        <Box sx={{ mb: 4, px: { xs: 2, sm: 4 } }}>
            <Typography sx={{ color: '#a0a0a0', fontSize: '14px', mb: 2 }}>{title}</Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {slice.map((track, i) => {
                    const globalIdx = (safePage - 1) * PER_PAGE + i;
                    const isCurrent = currentTrack?.id === track.id;
                    const isFav = favoriteIds.has(track.id);

                    return (
                        <Box
                            key={`${track.id}-${globalIdx}`}
                            onClick={() => handlePlayNow(track)}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 2,
                                px: 2, py: 1, borderRadius: '10px', cursor: 'pointer',
                                bgcolor: isCurrent ? 'rgba(255,255,255,0.06)' : 'transparent',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                                '&:hover .row-actions': { opacity: 1 },
                            }}
                        >
                            <Box sx={{ width: 22, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                                {isCurrent && isPlaying ? (
                                    <GraphicEqRoundedIcon sx={{ fontSize: 18, color: '#fff' }} />
                                ) : (
                                    <Typography sx={{ color: '#7a7a7a', fontSize: '13px' }}>
                                        {globalIdx + 1}
                                    </Typography>
                                )}
                            </Box>

                            <Box
                                sx={{
                                    position: 'relative', width: 44, height: 44,
                                    borderRadius: '8px', overflow: 'hidden',
                                    flexShrink: 0, bgcolor: '#1e1e1e',
                                }}
                            >
                                <TrackCover src={track.cover} alt="" sizes="44px" />
                            </Box>

                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography noWrap sx={{ color: '#fff', fontSize: '14.5px', fontWeight: isCurrent ? 700 : 500, opacity: isCurrent ? 1 : 0.85 }}>
                                    {track.title}
                                </Typography>
                                <Typography noWrap sx={{ color: '#939393', fontSize: '12.5px' }}>
                                    {track.author}
                                </Typography>
                            </Box>

                            <Typography
                                noWrap
                                title={track.album || 'Single'}
                                sx={{
                                    display: { xs: 'none', md: 'block' },
                                    width: 180, flexShrink: 0,
                                    color: '#8a8a8a', fontSize: '13px',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}
                            >
                                {track.album || 'Single'}
                            </Typography>

                            <Box className="row-actions" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, transition: 'opacity 0.2s' }}>
                                <IconButton
                                    size="small"
                                    aria-label={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
                                    title={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
                                    onClick={(e) => handleHeart(e, track)}
                                >
                                    {isFav
                                        ? <FavoriteRoundedIcon sx={{ color: '#ff4f7b', fontSize: 19 }} />
                                        : <FavoriteBorderRoundedIcon sx={{ color: '#7a7a7a', fontSize: 19, '&:hover': { color: '#fff' } }} />}
                                </IconButton>
                                {settings.queue !== false && (
                                    <IconButton
                                        size="small"
                                        aria-label="В очередь"
                                        title="В очередь"
                                        onClick={(e) => { e.stopPropagation(); addToQueue(track); }}
                                        sx={{ color: '#7a7a7a', '&:hover': { color: '#fff' } }}
                                    >
                                        <AddRoundedIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                )}
                                <IconButton
                                    size="small"
                                    aria-label="Включить"
                                    title="Включить"
                                    onClick={(e) => { e.stopPropagation(); handlePlayNow(track); }}
                                    sx={{ color: '#7a7a7a', '&:hover': { color: '#fff' } }}
                                >
                                    <PlayArrowRoundedIcon />
                                </IconButton>
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            {pageCount > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination
                        count={pageCount}
                        page={safePage}
                        onChange={(_, p) => setPage(p)}
                        shape="rounded"
                        renderItem={(item) => (
                            <PaginationItem
                                {...item}
                                slots={{ previous: PaginationPrevIcon, next: PaginationNextIcon }}
                            />
                        )}
                        sx={{
                            '& .MuiPaginationItem-root': {
                                color: 'rgba(255,255,255,0.7)',
                                borderColor: 'rgba(255,255,255,0.15)',
                            },
                            '& .MuiPaginationItem-root:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                            '& .Mui-selected': {
                                bgcolor: '#ffffff !important',
                                color: '#000 !important',
                                fontWeight: 700,
                            },
                        }}
                    />
                </Box>
            )}

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
