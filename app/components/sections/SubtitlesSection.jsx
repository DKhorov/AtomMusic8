"use client";
import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { PlayArrowRoundedIcon } from '../icons';
import TrackCover from '../TrackCover';
import QueueClearDialog from '../QueueClearDialog';
import ScrollRow from '../ScrollRow';
import { useMusic } from '../../context/MusicContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const SUBTITLE_KEYWORDS = [
    'chicago',
    'bohemian rhapsody',
    'great pretender',
    'no tomorrow',
    'and i love her',
    'strawberry',
    'standing',
    'dirty diana',
    'flashing lights',
    'let it happen',
];

export default function SubtitlesSection({ title }) {
    const { tracks, queue, playTrackNow, addToQueue } = useMusic();
    const { isAuthed, requestLogin } = useAuth();
    const settings = useSettings();
    const [pendingTrack, setPendingTrack] = useState(null);

    const subtitleTracks = tracks.filter((t) => {
        const name = t.title?.toLowerCase() || '';
        return SUBTITLE_KEYWORDS.some((kw) => name.includes(kw));
    });

    const handlePlayNow = (track) => {
        if (!isAuthed) { requestLogin(); return; }
        if (settings.queue !== false && queue.length > 1) {
            setPendingTrack(track);
            return;
        }
        playTrackNow(track);
    };

    return (
        <Box sx={{ mb: 4, px: { xs: 2, sm: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Typography sx={{ color: '#a0a0a0', fontSize: '14px' }}>{title} Digital Remastered</Typography>
            </Box>

            <ScrollRow gap={{ xs: 1.5, sm: 2 }}>
                {subtitleTracks.length > 0 ? (
                    subtitleTracks.map((track) => (
                        <Box
                            key={track.id}
                            onClick={() => handlePlayNow(track)}
                            sx={{
                                width: { xs: '38vw', sm: '180px' },
                                minWidth: 0,
                                flexShrink: 0,
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

                                <Typography
                                    sx={{
                                        position: 'absolute', top: 8, left: 8,
                                        color: '#ffffff', fontSize: '12px', fontWeight: 700,
                                        letterSpacing: '0.3px',
                                        textShadow: '0 1px 6px rgba(0,0,0,0.8)',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    DR 4
                                </Typography>

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
                                        justifyContent: 'center',
                                    }}
                                >
                                    <IconButton
                                        onClick={(e) => { e.stopPropagation(); handlePlayNow(track); }}
                                        sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' } }}
                                    >
                                        <PlayArrowRoundedIcon sx={{ fontSize: 32 }} />
                                    </IconButton>
                                </Box>
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
                    <Typography sx={{ color: '#666666', fontSize: '13px', py: 2, flexShrink: 0 }}>
                        Здесь появятся треки с субтитрами — поставь песню с текстом, и она окажется в этом разделе
                    </Typography>
                )}
            </ScrollRow>

            <QueueClearDialog
                track={pendingTrack}
                queueCount={queue.length}
                open={Boolean(pendingTrack)}
                onCancel={() => setPendingTrack(null)}
                onConfirm={() => { if (pendingTrack) playTrackNow(pendingTrack); setPendingTrack(null); }}
                onEnqueue={() => { if (pendingTrack) addToQueue(pendingTrack); setPendingTrack(null); }}
            />
        </Box>
    );
}
