"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
import Dialog from '@mui/material/Dialog';
import Snackbar from '@mui/material/Snackbar';
import { ArrowBackRoundedIcon, TouchAppRoundedIcon, NotificationsRoundedIcon, SkipNextRoundedIcon, RepeatRoundedIcon, SubtitlesRoundedIcon, VolumeUpRoundedIcon, PlayCircleOutlineRoundedIcon, PlaylistPlayRoundedIcon, SwapVertRoundedIcon, SlowMotionVideoRoundedIcon, DeleteOutlineRoundedIcon } from './icons';
import { saveStoredSettings, resetStoredSettings } from '../lib/settings';
import { useSettings } from '../context/SettingsContext';

const switchSx = {
    '& .MuiSwitch-track': {
        bgcolor: 'rgba(255,255,255,0.18)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxSizing: 'border-box',
    },
    '& .MuiSwitch-switchBase': { color: 'rgba(255,255,255,0.75)' },
    '& .MuiSwitch-switchBase.Mui-checked': {
        color: '#ffffff',
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
        bgcolor: 'rgba(255,255,255,0.4)',
        border: '1px solid rgba(255,255,255,0.6)',
    },
};

const iconBoxSx = {
    width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    bgcolor: 'rgba(255,255,255,0.06)', color: '#a0a0a0', fontSize: 22,
};

function SettingRow({ icon, label, hint, checked, onChange }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.6, px: 0.5 }}>
            <Box sx={iconBoxSx}>{icon}</Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: '#fff', fontSize: '15px', fontWeight: 500 }}>{label}</Typography>
                <Typography sx={{ color: '#939393', fontSize: '12.5px', mt: 0.25 }}>{hint}</Typography>
            </Box>
            <Switch checked={checked} onChange={onChange} sx={switchSx} />
        </Box>
    );
}

function GroupTitle({ children }) {
    return (
        <Typography
            sx={{
                color: '#6f6f6f', fontSize: '11px', fontWeight: 700,
                letterSpacing: '1px', textTransform: 'uppercase',
                px: 0.5, pt: 3, pb: 1,
            }}
        >
            {children}
        </Typography>
    );
}

function Divider() {
    return <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.07)', ml: 7 }} />;
}

function SectionCard({ children }) {
    return (
        <Box
            sx={{
                bgcolor: '#141416',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '18px',
                px: { xs: 1.5, sm: 2.5 },
                py: 0.5,
            }}
        >
            {children}
        </Box>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const settings = useSettings();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [cleared, setCleared] = useState(false);

    const update = (key, value) => saveStoredSettings({ ...settings, [key]: value });

    const volume = typeof settings.volume === 'number' ? settings.volume : 1;
    const animationsOn = settings.reduceMotion !== true;

    const handleClear = () => {
        resetStoredSettings();
        setConfirmOpen(false);
        setCleared(true);
    };

    return (
        <Box
            sx={{
                flexGrow: 1,
                overflowY: 'auto',
                pt: { xs: 3, sm: 6 },
                pb: 8,
                px: { xs: 3, sm: 6 },
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none',
            }}
        >
            <Box sx={{ maxWidth: 720 }}>
                <Button
                    onClick={() => router.push('/')}
                    startIcon={<ArrowBackRoundedIcon />}
                    sx={{
                        color: '#a0a0a0', textTransform: 'none',
                        fontSize: '13px', fontWeight: 500,
                        mb: 2, ml: -1,
                        '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.04)' },
                    }}
                >
                    На главную
                </Button>

                <Typography sx={{ color: '#fff', fontSize: { xs: '26px', sm: '32px' }, fontWeight: 700, letterSpacing: '-0.5px' }}>
                    Настройки
                </Typography>
                <Typography sx={{ color: '#939393', fontSize: '13.5px', mt: 1, mb: 1 }}>
                    Всё применяется сразу — перезапускать ничего не нужно
                </Typography>

                <GroupTitle>Воспроизведение</GroupTitle>
                <SectionCard>
                    <SettingRow
                        icon={<SkipNextRoundedIcon />}
                        label="Автопереключение"
                        hint="Когда трек заканчивается — включать следующий"
                        checked={settings.autoNext !== false}
                        onChange={(e) => update('autoNext', e.target.checked)}
                    />
                    <Divider />
                    <SettingRow
                        icon={<RepeatRoundedIcon />}
                        label="Цикличная игра"
                        hint="После последнего трека начинать список заново"
                        checked={settings.loop !== false}
                        onChange={(e) => update('loop', e.target.checked)}
                    />
                    <Divider />
                    <SettingRow
                        icon={<SubtitlesRoundedIcon />}
                        label="Субтитры в плеере"
                        hint="Показывать текст песни при открытии плеера"
                        checked={settings.subtitles !== false}
                        onChange={(e) => update('subtitles', e.target.checked)}
                    />
                    <Divider />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.6, px: 0.5 }}>
                        <Box sx={iconBoxSx}><VolumeUpRoundedIcon /></Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ color: '#fff', fontSize: '15px', fontWeight: 500 }}>Громкость</Typography>
                            <Typography sx={{ color: '#939393', fontSize: '12.5px', mt: 0.25 }}>{Math.round(volume * 100)}%</Typography>
                        </Box>
                        <Slider
                            size="small"
                            value={Math.round(volume * 100)}
                            onChange={(_, val) => update('volume', val / 100)}
                            sx={{
                                width: { xs: 110, sm: 170 },
                                color: '#ffffff',
                                '& .MuiSlider-thumb': { width: 14, height: 14 },
                                '& .MuiSlider-rail': { opacity: 0.25 },
                            }}
                        />
                    </Box>
                </SectionCard>

                <GroupTitle>Интерфейс</GroupTitle>
                <SectionCard>
                    <SettingRow
                        icon={<NotificationsRoundedIcon />}
                        label="Карточка «Сейчас играет»"
                        hint="Всплывающее уведомление при включении нового трека"
                        checked={settings.trackToast !== false}
                        onChange={(e) => update('trackToast', e.target.checked)}
                    />
                    <Divider />
                    <SettingRow
                        icon={<PlayCircleOutlineRoundedIcon />}
                        label="Раздел «Поток»"
                        hint="Плитка на главной и сама лента «Поток»"
                        checked={settings.feed !== false}
                        onChange={(e) => update('feed', e.target.checked)}
                    />
                    <Divider />
                    <SettingRow
                        icon={<PlaylistPlayRoundedIcon />}
                        label="Очередь"
                        hint="Очередь в сайдбаре и кнопки «В очередь» на карточках"
                        checked={settings.queue !== false}
                        onChange={(e) => update('queue', e.target.checked)}
                    />
                    <Divider />
                    <SettingRow
                        icon={<SwapVertRoundedIcon />}
                        label="Автолистание в «Потоке»"
                        hint="Самому пролистывать ленту к играющему треку"
                        checked={settings.feedAutoscroll !== false}
                        onChange={(e) => update('feedAutoscroll', e.target.checked)}
                    />
                    <Divider />
                    <SettingRow
                        icon={<SlowMotionVideoRoundedIcon />}
                        label="Анимации"
                        hint="Пружинные анимации сайдбара, плиток и плеера. На слабых телефонах выключаются автоматически"
                        checked={animationsOn}
                        onChange={(e) => update('reduceMotion', !e.target.checked)}
                    />
                    <Divider />
                    <SettingRow
                        icon={<TouchAppRoundedIcon />}
                        label="Щелчок кнопки Play"
                        hint="Короткий звук при нажатии Play и Pause"
                        checked={settings.clickSound !== false}
                        onChange={(e) => update('clickSound', e.target.checked)}
                    />
                </SectionCard>

                <GroupTitle>Приложение</GroupTitle>
                <SectionCard>
                    <Box
                        onClick={() => setConfirmOpen(true)}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 2,
                            py: 1.6, px: 0.5, cursor: 'pointer',
                            borderRadius: '14px',
                            transition: 'background-color 0.2s ease',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                        }}
                    >
                        <Box sx={iconBoxSx}><DeleteOutlineRoundedIcon /></Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ color: '#fff', fontSize: '15px', fontWeight: 500 }}>
                                Очистить все настройки
                            </Typography>
                            <Typography sx={{ color: '#939393', fontSize: '12.5px', mt: 0.25 }}>
                                Вернуть все переключатели, громкость и оформление к значениям по умолчанию
                            </Typography>
                        </Box>
                        <Button
                            onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); }}
                            sx={{
                                color: '#fff', textTransform: 'none', fontSize: '13px',
                                fontWeight: 600, flexShrink: 0, borderRadius: '999px', px: 2,
                                border: '1px solid rgba(255,255,255,0.18)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            Очистить
                        </Button>
                    </Box>
                </SectionCard>

                <GroupTitle>О проекте</GroupTitle>
                <SectionCard>
                    <Box sx={{ px: 0.5, py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography sx={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>
                                Atom Music
                            </Typography>
                            <Box sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: '999px', px: 1.2, py: 0.2 }}>
                                <Typography sx={{ color: '#bdbdbd', fontSize: '11px', fontWeight: 600 }}>v0.1.0</Typography>
                            </Box>
                        </Box>
                        <Typography sx={{ color: '#939393', fontSize: '12.5px', mt: 1, lineHeight: 1.6 }}>
                            Музыкальный плеер с лентой «Поток», очередью, избранным и караоке-субтитрами.
                            Полный плеер в стиле Apple — отдельная версия для компьютера и для телефона,
                            метаданные трека уходят в панель управления iPhone и AirPlay.
                        </Typography>
                        <Typography sx={{ color: '#6f6f6f', fontSize: '12px', mt: 1.5 }}>
                            Next.js · React · MUI
                        </Typography>
                    </Box>
                </SectionCard>

                <Typography sx={{ color: '#666666', fontSize: '11px', letterSpacing: '0.4px', textAlign: 'center', mt: 4 }}>
                    Atom Music · AtomGlide Labs
                </Typography>
            </Box>

            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                maxWidth="xs"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            bgcolor: '#1c1c20',
                            backgroundImage: 'none',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '20px',
                            boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
                            m: 2,
                        },
                    },
                }}
            >
                <Box sx={{ p: 3 }}>
                    <Typography sx={{ color: '#fff', fontSize: '19px', fontWeight: 700 }}>
                        Очистить все настройки?
                    </Typography>
                    <Typography sx={{ color: '#939393', fontSize: '13.5px', mt: 1.2, lineHeight: 1.6 }}>
                        Все настройки приложения — переключатели, громкость и оформление — вернутся
                        к значениям по умолчанию. Уверены?
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
                        <Button
                            onClick={() => setConfirmOpen(false)}
                            sx={{
                                color: '#a0a0a0', textTransform: 'none', fontSize: '14px',
                                borderRadius: '999px', px: 2.5,
                                '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.06)' },
                            }}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={handleClear}
                            sx={{
                                bgcolor: '#ffffff', color: '#000000', textTransform: 'none',
                                fontSize: '14px', fontWeight: 600, borderRadius: '999px', px: 2.5,
                                '&:hover': { bgcolor: '#e2e2e2' },
                            }}
                        >
                            Очистить
                        </Button>
                    </Box>
                </Box>
            </Dialog>

            <Snackbar
                open={cleared}
                autoHideDuration={2400}
                onClose={() => setCleared(false)}
                message="Настройки сброшены"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{ '& .MuiSnackbarContent-root': { bgcolor: '#1c1c20', color: '#fff', fontSize: '13.5px', borderRadius: '12px' } }}
            />
        </Box>
    );
}
