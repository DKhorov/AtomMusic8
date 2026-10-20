"use client";
import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useRouter } from 'next/navigation';
import { ArrowBackRoundedIcon, PersonRoundedIcon } from './icons';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (busy || !identifier.trim() || !password) {
            setError('Укажите логин и пароль');
            return;
        }
        setBusy(true);
        setError('');
        try {
            await login(identifier.trim(), password);
            router.replace('/');
        } catch (err) {
            setError(err?.response?.data?.error || 'Не удалось войти');
            setBusy(false);
        }
    };

    const inputSx = {
        '& .MuiInputBase-root': {
            bgcolor: '#141418',
            borderRadius: '10px',
            color: '#fff',
        },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
        '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ffffff' },
        '& input:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 100px #141418 inset',
            WebkitTextFillColor: '#fff',
        },
    };

    return (
        <Box
            sx={{
                flexGrow: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none',
            }}
        >
            <Box sx={{ width: '100%', maxWidth: 360 }}>
                <Button
                    onClick={() => router.push('/')}
                    startIcon={<ArrowBackRoundedIcon />}
                    sx={{
                        color: '#a0a0a0', textTransform: 'none',
                        fontSize: '13px', fontWeight: 500,
                        mb: 2,
                        '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.04)' },
                    }}
                >
                    На главную
                </Button>

                <Box
                    component="form"
                    onSubmit={submit}
                    sx={{
                        bgcolor: '#1c1c20',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '20px',
                        boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
                        p: { xs: 2.5, sm: 3.5 },
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <Box
                            sx={{
                                width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: 'rgba(255,255,255,0.06)', color: '#a0a0a0',
                            }}
                        >
                            <PersonRoundedIcon sx={{ fontSize: 22 }} />
                        </Box>
                        <Box>
                            <Typography sx={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>Вход</Typography>
                            <Typography sx={{ color: '#939393', fontSize: '12px' }}>
                                Atom Music · AtomGlide
                            </Typography>
                        </Box>
                    </Box>

                    <TextField
                        label="Логин или email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        fullWidth
                        autoComplete="username"
                        sx={inputSx}
                        slotProps={{ inputLabel: { sx: { color: '#939393' } } }}
                    />
                    <TextField
                        label="Пароль"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        autoComplete="current-password"
                        sx={inputSx}
                        slotProps={{ inputLabel: { sx: { color: '#939393' } } }}
                    />

                    {error ? (
                        <Typography sx={{ color: '#ff6b6b', fontSize: '13px' }}>{error}</Typography>
                    ) : null}

                    <Button
                        onClick={submit}
                        variant="contained"
                        disabled={busy}
                        disableElevation
                        sx={{
                            mt: 0.5,
                            bgcolor: '#fff',
                            color: '#000',
                            borderRadius: '20px',
                            py: 1.2,
                            fontWeight: 600,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.85)' },
                            '&:disabled': { bgcolor: 'rgba(255,255,255,0.4)', color: 'rgba(0,0,0,0.6)' },
                        }}
                    >
                        {busy ? 'Входим…' : 'Войти'}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
