"use client";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { PlayArrowRoundedIcon, QueueMusicRoundedIcon } from './icons';

function pluralTracks(n) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return 'трек';
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'трека';
    return 'треков';
}

export default function QueueClearDialog({ track, queueCount, open, onCancel, onConfirm, onEnqueue }) {
    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="xs"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        bgcolor: '#1c1c20',
                        backgroundImage: 'none',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
                    },
                },
            }}
        >
            <DialogTitle sx={{ color: '#fff', fontSize: '17px', fontWeight: 600, pb: 1 }}>
                Очистить очередь?
            </DialogTitle>
            <DialogContent sx={{ pb: 1 }}>
                <DialogContentText sx={{ color: '#a0a0a0', fontSize: '14px' }}>
                    Если включить «{track?.title}», текущая очередь из {queueCount} {pluralTracks(queueCount)} заменится этим треком.
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 2.5, pb: 2 }}>
                <Button onClick={onCancel} sx={{ color: '#a0a0a0', '&:hover': { color: '#fff' } }}>
                    Отмена
                </Button>
                <Button
                    onClick={onEnqueue}
                    startIcon={<QueueMusicRoundedIcon />}
                    sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                >
                    В очередь
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    startIcon={<PlayArrowRoundedIcon />}
                    disableElevation
                    sx={{
                        bgcolor: '#fff', color: '#000',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.85)' },
                        borderRadius: '20px',
                    }}
                >
                    Включить
                </Button>
            </DialogActions>
        </Dialog>
    );
}
