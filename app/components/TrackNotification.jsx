"use client";
import { useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Slide from '@mui/material/Slide';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { CloseRoundedIcon, GraphicEqRoundedIcon } from './icons';
import { useMusic } from '../context/MusicContext';
import { useSettings } from '../context/SettingsContext';

const AUTO_HIDE_MS = 4000;

export default function TrackNotification() {
    const { trackToast, toggleFullPlayer } = useMusic();
    const settings = useSettings();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [seenKey, setSeenKey] = useState(null);
    const [openKey, setOpenKey] = useState(null);

    const enabled = settings.trackToast !== false && !isMobile;

    if (trackToast && trackToast.key !== seenKey) {
        setSeenKey(trackToast.key);
        setOpenKey(trackToast.key);
    }

    const open = Boolean(trackToast) && openKey === trackToast.key && enabled;
    const shown = trackToast?.track;

    return (
        <Snackbar
            key={trackToast?.key}
            open={open}
            autoHideDuration={AUTO_HIDE_MS}
            onClose={() => setOpenKey(null)}
            slots={{ transition: Slide }}
            slotProps={{ transition: { direction: 'left', timeout: 300, appear: true } }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{
                bottom: { xs: 16, sm: 24 },
                mb: '10px',
                zIndex: 1600,
            }}
        >
            <Box
                className="perf-glass"
                onClick={() => { setOpenKey(null); toggleFullPlayer(true); }}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    width: { xs: '86vw', sm: 340 },
                    p: 1.25,
                    borderRadius: '16px',
                    bgcolor: 'rgba(28, 28, 32, 0.92)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
                    color: '#fff',
                    cursor: 'pointer',
                }}
            >
                <Box
                    component="img"
                    src={shown?.cover}
                    alt={shown?.title || ''}
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '10px',
                        objectFit: 'cover',
                        flexShrink: 0,
                    }}
                />

                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <GraphicEqRoundedIcon sx={{ fontSize: 14, color: '#fff' }} />
                        <Typography sx={{ fontSize: '11px', color: '#a0a0a0', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                            Сейчас играет
                        </Typography>
                    </Box>
                    <Typography noWrap sx={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>
                        {shown?.title}
                    </Typography>
                    <Typography noWrap sx={{ fontSize: '13px', color: '#a0a0a0' }}>
                        {shown?.author}
                    </Typography>
                </Box>

                <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); setOpenKey(null); }}
                    aria-label="Закрыть уведомление"
                    sx={{ color: 'rgba(255,255,255,0.55)', '&:hover': { color: '#fff' }, flexShrink: 0 }}
                >
                    <CloseRoundedIcon fontSize="small" />
                </IconButton>
            </Box>
        </Snackbar>
    );
}
