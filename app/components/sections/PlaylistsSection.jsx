"use client";
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import TrackCover from '../TrackCover';
import PixelCover from '../PixelCover';
import ScrollRow from '../ScrollRow';
import { useAuth } from '../../context/AuthContext';
import { useMusic } from '../../context/MusicContext';
import { useSettings } from '../../context/SettingsContext';

function PlaylistTile({ label, onClick, clickable, children }) {
    return (
        <Box sx={{ flexShrink: 0, width: { xs: '38vw', sm: '180px' }, minWidth: 0 }}>
            <Box
                onClick={onClick}
                title={label}
                sx={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1 / 1',
                    bgcolor: '#222222',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    cursor: clickable ? 'pointer' : 'default',
                    transition: clickable ? 'transform 0.2s' : 'none',
                    ...(clickable ? { '&:hover': { transform: 'scale(1.03)' } } : {}),
                }}
            >
                {children}
            </Box>
            <Box sx={{ p: { xs: 1, sm: 1.5 }, width: '100%', boxSizing: 'border-box' }}>
                <Typography noWrap sx={{ color: 'white', fontSize: { xs: '13px', sm: '14px' }, textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {label}
                </Typography>
            </Box>
        </Box>
    );
}

export default function TrackGrid({ title }) {
    const router = useRouter();
    const { isAuthed, user } = useAuth();
    const { currentTrack, toggleFullPlayer } = useMusic();
    const settings = useSettings();
    const avatarUrl = user?.avatarUrl || '/1.png';

    return (
        <Box sx={{ mb: 4, px: { xs: 2, sm: 4 } }}>
            <Typography sx={{ color: '#a0a0a0', fontSize: '14px', mb: 2 }}>{title}</Typography>
            <ScrollRow gap={{ xs: 1.5, sm: 3 }}>
                {/* Добавить трек */}
                <PlaylistTile
                    label="Добавить трек"
                    clickable
                    onClick={() => router.push('/upload')}
                >
                    <PixelCover type="plus" color="gray" seed={10} />
                </PlaylistTile>

                {/* Создать плейлист (новая кнопка рядом) */}
                <PlaylistTile
                    label="Создать плейлист"
                    clickable
                    onClick={() => router.push('/playlist/create')}
                >
                    <PixelCover type="playlist" color="blue" seed={25} />
                </PlaylistTile>

                {/* Избранное */}
                <PlaylistTile
                    label="Избранное"
                    clickable
                    onClick={() => router.push('/favorites')}
                >
                    <PixelCover type="heart" color="pink" seed={88} />
                </PlaylistTile>

                {currentTrack && (
                    <PlaylistTile
                        label="Перейти к треку"
                        clickable
                        onClick={() => toggleFullPlayer(true)}
                    >
                        <PixelCover type="expand" color="cyan" seed={52} />
                    </PlaylistTile>
                )}

                {settings.feed !== false && (
                    <PlaylistTile
                        label="Поток"
                        clickable
                        onClick={() => router.push('/feed')}
                    >
                        <PixelCover type="feed" color="purple" seed={63} />
                    </PlaylistTile>
                )}

                {/* Мой профиль */}
                <PlaylistTile
                    label="Мой профиль"
                    clickable
                    onClick={() => router.push('/profile')}
                >
                    <TrackCover src={avatarUrl} alt={isAuthed ? (user?.username || 'Профиль') : 'Аватар'} sizes="180px" />
                </PlaylistTile>
            </ScrollRow>
        </Box>
    );
}