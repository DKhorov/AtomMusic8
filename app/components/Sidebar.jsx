"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Reorder, useReducedMotion, useDragControls } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { keyframes } from '@mui/system';
import { PlayArrowRoundedIcon, PauseRoundedIcon, SkipPreviousRoundedIcon, SkipNextRoundedIcon, CloseRoundedIcon, SettingsRoundedIcon, QueueMusicRoundedIcon, DragHandleIcon } from './icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useMusic } from '../context/MusicContext';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_COVER } from '../lib/trackFormat';
import PixelCover from './PixelCover';

const W_COLLAPSED = 50;
const W_EXPANDED = 240;

const OVERLAY_MODE = true;

const EASE_OUT = [0.22, 1, 0.36, 1];
const SPRING_WIDTH = { type: 'spring', stiffness: 320, damping: 38, mass: 1 };
const SPRING_PLAY = { type: 'spring', stiffness: 420, damping: 32, mass: 0.9 };

const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

const formatTime = (sec) => {
    if (!sec || !Number.isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
};

const CoverImage = ({ src }) => {
    const url = src || DEFAULT_COVER;
    return (
        <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', bgcolor: '#1e1e1e' }}>
            <AnimatePresence initial={false}>
                <motion.img
                    key={url}
                    src={url}
                    alt=""
                    draggable={false}
                    onError={(e) => { if (e.currentTarget.src !== DEFAULT_COVER) e.currentTarget.src = DEFAULT_COVER; }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}

                    exit={{ opacity: 0.999, transition: { duration: 0.5 } }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </AnimatePresence>
        </Box>
    );
};

const CircleButton = ({ onClick, children, active = false, pulse = false, label, size = 36 }) => (
    <motion.div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onClick?.(e); }
        }}
        initial={false}
        animate={{
            backgroundColor: active ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0)',
            color: active ? '#000000' : '#ffffff',
            borderColor: active ? 'rgba(217,217,217,0)' : 'rgba(217,217,217,1)',
        }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={{
            position: 'relative',
            width: size,
            height: size,
            borderRadius: '50%',
            borderWidth: 2,
            borderStyle: 'solid',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: 'pointer',
            outline: 'none',
            boxSizing: 'border-box',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
        }}
    >
        {pulse && (
            <motion.span
                aria-hidden
                animate={{ scale: [1, 1.5], opacity: [0.55, 0] }}
                transition={{ duration: 1.7, repeat: Infinity, ease: 'easeOut' }}
                style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: '2px solid #ffffff', pointerEvents: 'none' }}
            />
        )}
        {children}
    </motion.div>
);

const CIRC = 263.89;

const PlayPauseWithRing = ({ size = 48 }) => {
    const { isPlaying, togglePlay, audioRef, seek } = useMusic();
    const [isDragging, setIsDragging] = useState(false);
    const ringRef = useRef(null);
    const arcRef = useRef(null);
    const draggingRef = useRef(false);
    const dragProgressRef = useRef(0);
    const lastSeekRef = useRef(0);

    const setArc = (p) => {
        if (arcRef.current) arcRef.current.style.strokeDashoffset = String(CIRC * (1 - p));
    };

    useEffect(() => {
        let frameId;
        const update = () => {
            const a = audioRef?.current;
            if (a && !draggingRef.current) {
                const d = a.duration;
                const p = Number.isFinite(d) && d > 0 ? (a.currentTime || 0) / d : 0;
                setArc(Math.min(1, Math.max(0, p)));
            }
            frameId = requestAnimationFrame(update);
        };
        frameId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(frameId);
    }, [audioRef]);

    const getProgressFromPointer = useCallback((clientX, clientY) => {
        const rect = ringRef.current.getBoundingClientRect();
        const x = clientX - (rect.left + rect.width / 2);
        const y = clientY - (rect.top + rect.height / 2);
        let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;
        return angle / 360;
    }, []);

    const applySeek = useCallback((p, force = false) => {
        const a = audioRef?.current;
        if (!a || !seek) return;
        const d = a.duration;
        const safe = Number.isFinite(d) && d > 0 ? d : 1;
        const now = performance.now();
        if (force || now - lastSeekRef.current > 90) {
            lastSeekRef.current = now;
            seek(p * safe);
        }
    }, [audioRef, seek]);

    const handlePointerDown = (e) => {
        e.stopPropagation();
        if (!ringRef.current) return;

        const rect = ringRef.current.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        if (Math.hypot(dx, dy) < (rect.width / 2) * 0.75) return;

        draggingRef.current = true;
        setIsDragging(true);
        const p = getProgressFromPointer(e.clientX, e.clientY);
        dragProgressRef.current = p;
        setArc(p);
        applySeek(p, true);
    };

    useEffect(() => {
        if (!isDragging) return;
        const move = (e) => {
            const p = getProgressFromPointer(e.clientX, e.clientY);
            dragProgressRef.current = p;
            setArc(p);
            applySeek(p);
        };
        const up = () => {
            applySeek(dragProgressRef.current, true);
            draggingRef.current = false;
            setIsDragging(false);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
        };
    }, [isDragging, getProgressFromPointer, applySeek]);

    return (
        <Box
            ref={ringRef}
            onPointerDown={handlePointerDown}
            sx={{
                position: 'relative', width: size, height: size,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, touchAction: 'none',
            }}
        >
            <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)', pointerEvents: 'none' }}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={isDragging ? 9 : 6} style={{ transition: 'stroke-width 0.2s ease' }} />
                <circle
                    ref={arcRef}
                    cx="50" cy="50" r="42" fill="none" stroke="#ffffff"
                    strokeWidth={isDragging ? 9 : 6}
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-width 0.2s ease' }}
                />
            </svg>
            <motion.div
                role="button"
                aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                initial={false}
                whileTap={{ scale: 0.88 }}
                transition={{ duration: 0.18 }}
                style={{
                    width: size - 12, height: size - 12, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', zIndex: 1, backgroundColor: 'rgba(255,255,255,0.05)',
                    overflow: 'hidden', WebkitTapHighlightColor: 'transparent',
                }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                        key={isPlaying ? 'pause' : 'play'}
                        initial={{ scale: 0.4, opacity: 0, rotate: -45 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.4, opacity: 0, rotate: 45 }}
                        transition={{ duration: 0.14 }}
                        style={{ display: 'flex' }}
                    >
                        {isPlaying ? <PauseRoundedIcon sx={{ fontSize: 22 }} /> : <PlayArrowRoundedIcon sx={{ fontSize: 22 }} />}
                    </motion.span>
                </AnimatePresence>
            </motion.div>
        </Box>
    );
};

const PlaybackTimeDisplay = () => {
    const { audioRef } = useMusic();
    const [label, setLabel] = useState("0:00 / 0:00");

    useEffect(() => {
        const tick = () => {
            const a = audioRef?.current;
            const next = a ? `${formatTime(a.currentTime)} / ${formatTime(a.duration)}` : "0:00 / 0:00";
            setLabel((prev) => (prev === next ? prev : next));
        };
        tick();
        const id = setInterval(tick, 250);
        return () => clearInterval(id);
    }, [audioRef]);

    return (
        <Typography sx={{ color: '#666666', fontSize: '11px', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>
            {label}
        </Typography>
    );
};

const TrackInfo = ({ track, align = 'center' }) => (
    <AnimatePresence mode="wait" initial={false}>
        <motion.div
            key={track ? (track.qId ?? track.id ?? track.title) : 'empty'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ width: '100%', minWidth: 0, textAlign: align }}
        >
            <Typography noWrap sx={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>
                {track ? track.title : 'Очередь пуста'}
            </Typography>
            <Typography noWrap sx={{ color: '#a0a0a0', fontSize: '12px' }}>
                {track ? track.author : 'Выберите трек'}
            </Typography>
        </motion.div>
    </AnimatePresence>
);

const trackWord = (n) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'трек';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'трека';
    return 'треков';
};

const MobileQueueRow = ({ track, idx, isActive, isPlaying, onPlay, onRemove }) => {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            value={track}
            dragListener={false}
            dragControls={dragControls}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
            whileDrag={{ scale: 1.03, zIndex: 5, cursor: 'grabbing' }}
            style={{ listStyle: 'none', position: 'relative', touchAction: 'pan-y', paddingBottom: 6 }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, pl: 0.5, pr: 0.5 }}>
                <CircleButton
                    label={`Играть: ${track.title}`}
                    active={isActive}
                    pulse={isActive && isPlaying}
                    onClick={(e) => { e.stopPropagation(); onPlay(idx); }}
                >
                    <Typography sx={{ fontSize: '18px', fontFamily: 'arial', fontWeight: 900, lineHeight: 1, color: 'inherit' }}>
                        {idx + 1}
                    </Typography>
                </CircleButton>

                <Box
                    onClick={() => onPlay(idx)}
                    sx={{
                        flex: 1, minWidth: 0, display: 'flex', alignItems: 'center',
                        border: '1px solid', borderColor: isActive ? 'white' : 'rgba(255,255,255,0.55)',
                        bgcolor: isActive ? 'white' : 'transparent',
                        borderRadius: '20px', pl: 1.5, pr: 0.5, py: 0.4, cursor: 'pointer',
                    }}
                >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ color: isActive ? 'black' : 'white', fontSize: '13px', fontWeight: 500, transition: 'color 0.25s ease' }}>
                            {track.title}
                        </Typography>
                        <Typography noWrap sx={{ color: isActive ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.45)', fontSize: '11px' }}>
                            {track.author}
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        aria-label="Убрать из очереди"
                        onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                        sx={{ color: isActive ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', p: 0.5 }}
                    >
                        <CloseRoundedIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                </Box>

                <Box
                    onPointerDown={(e) => { e.preventDefault(); dragControls.start(e); }}
                    sx={{ touchAction: 'none', color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', px: 0.25, cursor: 'grab' }}
                >
                    <DragHandleIcon sx={{ fontSize: 20 }} />
                </Box>
            </Box>
        </Reorder.Item>
    );
};

const MobileQueueSheet = ({ open, onClose, queue, currentIndex, isPlaying, onPlay, onRemove, onReorder, reduceMotion }) => {
    const sheetControls = useDragControls();

    useEffect(() => {
        if (typeof document === 'undefined') return undefined;
        if (!open) return undefined;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previous; };
    }, [open]);

    const transition = reduceMotion
        ? { duration: 0 }
        : { type: 'spring', stiffness: 320, damping: 34, mass: 0.9 };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        key="queue-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.22 }}
                        onClick={onClose}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1400 }}
                    />
                    <motion.div
                        key="queue-sheet"
                        drag="y"
                        dragListener={false}
                        dragControls={sheetControls}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.4 }}
                        onDragEnd={(e, info) => {
                            if (info.offset.y > 110 || info.velocity.y > 700) onClose();
                        }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={transition}
                        style={{
                            position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1401,
                            backgroundColor: '#161618',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '22px 22px 0 0',
                            boxShadow: '0 -16px 48px rgba(0,0,0,0.6)',
                            display: 'flex', flexDirection: 'column',
                            maxHeight: '72dvh',
                            overflow: 'hidden',
                            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                        }}
                    >
                        <Box
                            onPointerDown={(e) => sheetControls.start(e)}
                            sx={{ touchAction: 'none', cursor: 'grab', pt: 1.25, pb: 1, px: 2, flexShrink: 0 }}
                        >
                            <Box sx={{ width: 40, height: 4, borderRadius: '999px', bgcolor: 'rgba(255,255,255,0.22)', mx: 'auto' }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0 }}>
                                    <Typography sx={{ color: '#fff', fontSize: '17px', fontWeight: 700 }}>Очередь</Typography>
                                    <Typography noWrap sx={{ color: '#7a7a7a', fontSize: '12px' }}>
                                        {queue.length > 0 ? `${queue.length} ${trackWord(queue.length)}` : 'пусто'}
                                    </Typography>
                                </Box>
                                <IconButton
                                    aria-label="Закрыть очередь"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={onClose}
                                    sx={{
                                        color: 'rgba(255,255,255,0.6)',
                                        bgcolor: 'rgba(255,255,255,0.06)',
                                        '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' },
                                    }}
                                >
                                    <CloseRoundedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Box>
                        </Box>

                        <Box
                            component={motion.div}
                            layoutScroll
                            sx={{
                                overflowY: 'auto', flex: 1, minHeight: 0,
                                px: 1.5, pb: 2,
                                WebkitOverflowScrolling: 'touch',
                                '&::-webkit-scrollbar': { display: 'none' },
                                scrollbarWidth: 'none',
                            }}
                        >
                            {queue.length === 0 ? (
                                <Box sx={{ py: 5, textAlign: 'center' }}>
                                    <Typography sx={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>
                                        Очередь пуста
                                    </Typography>
                                    <Typography sx={{ color: '#7a7a7a', fontSize: '12.5px', mt: 0.75, px: 3, lineHeight: 1.5 }}>
                                        Включи трек из «Волны», ленты или поиска — он появится здесь
                                    </Typography>
                                </Box>
                            ) : (
                                <Reorder.Group
                                    axis="y"
                                    values={queue}
                                    onReorder={onReorder}
                                    style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%', display: 'flex', flexDirection: 'column' }}
                                >
                                    <AnimatePresence initial={false}>
                                        {queue.map((track, idx) => (
                                            <MobileQueueRow
                                                key={track.qId}
                                                track={track}
                                                idx={idx}
                                                isActive={idx === currentIndex}
                                                isPlaying={isPlaying}
                                                onPlay={onPlay}
                                                onRemove={onRemove}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </Reorder.Group>
                            )}
                        </Box>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default function Sidebar() {
    const [pinned, setPinned] = useState(false);
    const [queueOpen, setQueueOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const systemReduced = useReducedMotion();
    const settings = useSettings();
    const reduceMotion = Boolean(systemReduced) || settings.reduceMotion === true;
    const router = useRouter();

    const {
        queue, currentIndex, currentTrack, isPlaying, nextTrack, prevTrack,
        playFromQueue, removeFromQueue, handleReorderQueue, toggleFullPlayer
    } = useMusic();
    const { isAuthed, user } = useAuth();
    const avatarUrl = user?.avatarUrl || '/1.png';

    const isExpanded = pinned;

    const queueDragging = useRef(false);
    const listRef = useRef(null);
    const panelRef = useRef(null);

    const tWidth = reduceMotion ? { duration: 0 } : SPRING_WIDTH;
    const tPlay = reduceMotion ? { duration: 0 } : SPRING_PLAY;

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!pinned) return;
        const handleOutside = (e) => {
            const panel = panelRef.current;
            if (!panel || !(e.target instanceof Node)) return;

            if (e.target.closest?.('.MuiDialog-root')) return;
            if (!panel.contains(e.target)) {
                setPinned(false);
            }
        };
        document.addEventListener('pointerdown', handleOutside);
        return () => document.removeEventListener('pointerdown', handleOutside);
    }, [pinned]);

    useEffect(() => {
        const q = queue?.[currentIndex];
        const root = listRef.current;
        if (!q || !root) return;
        const sel = `[data-qid="${typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(String(q.qId)) : q.qId}"]`;
        const el = root.querySelector(sel);
        if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [currentIndex, queue?.length]);

    if (!mounted) {
        return <Box sx={{ width: W_COLLAPSED, height: '100%', flexShrink: 0, bgcolor: '#121212' }} />;
    }

    if (isMobile) {
        return (
            <>
                <motion.div
                    initial={{ y: 90, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.45, ease: EASE_OUT }}
                    style={{
                        position: 'fixed', bottom: 0, left: 0, right: 0,
                        height: 'calc(68px + env(safe-area-inset-bottom, 0px))',
                        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                        boxSizing: 'border-box',
                        backgroundColor: '#121212',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        paddingLeft: 16, paddingRight: 16, zIndex: 1300,
                    }}
                >
                    <motion.div
                        onClick={() => toggleFullPlayer(true)}
                        whileTap={{ scale: 0.97 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden', marginRight: 10, cursor: 'pointer', flex: 1, minWidth: 0 }}
                    >
                        {currentTrack && (
                            <Box sx={{ width: 40, height: 40, borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                                <CoverImage src={currentTrack.cover} />
                            </Box>
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <TrackInfo track={currentTrack} align="left" />
                        </Box>
                    </motion.div>

                    <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                        <CircleButton label="Предыдущий" onClick={(e) => { e.stopPropagation(); prevTrack(); }}>
                            <SkipPreviousRoundedIcon sx={{ fontSize: 20 }} />
                        </CircleButton>
                        <PlayPauseWithRing size={44} />
                        <CircleButton label="Следующий" onClick={(e) => { e.stopPropagation(); nextTrack(); }}>
                            <SkipNextRoundedIcon sx={{ fontSize: 20 }} />
                        </CircleButton>

                        {settings.queue !== false && (
                            <Box sx={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
                                <CircleButton
                                    label="Очередь"
                                    onClick={(e) => { e.stopPropagation(); setQueueOpen(true); }}
                                >
                                    <QueueMusicRoundedIcon sx={{ fontSize: 20 }} />
                                </CircleButton>
                                {queue.length > 0 && (
                                    <Box
                                        sx={{
                                            position: 'absolute', top: -4, right: -4,
                                            minWidth: 17, height: 17, px: 0.5,
                                            borderRadius: '999px', bgcolor: '#fff', color: '#000',
                                            fontSize: '10px', fontWeight: 700, lineHeight: 1,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: '2px solid #121212', boxSizing: 'content-box',
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        {queue.length}
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                </motion.div>

                <MobileQueueSheet
                    open={queueOpen}
                    onClose={() => setQueueOpen(false)}
                    queue={queue}
                    currentIndex={currentIndex}
                    isPlaying={isPlaying}
                    onPlay={(idx) => { playFromQueue(idx); setQueueOpen(false); }}
                    onRemove={removeFromQueue}
                    onReorder={handleReorderQueue}
                    reduceMotion={reduceMotion}
                />
            </>
        );
    }

    const itemDelay = (idx) => (isExpanded && !reduceMotion ? 0.04 + Math.min(idx, 8) * 0.025 : 0);

    return (
        <Box
            sx={{
                position: 'relative',
                height: '100%',
                flexShrink: 0,
                width: OVERLAY_MODE ? W_COLLAPSED : 'auto',
            }}
        >
            <motion.div
                ref={panelRef}
                initial={false}
                animate={{
                    width: isExpanded ? W_EXPANDED : W_COLLAPSED,
                    boxShadow: isExpanded && OVERLAY_MODE ? '12px 0 48px rgba(0,0,0,0.65)' : '0px 0 0px rgba(0,0,0,0)',
                }}
                transition={tWidth}
                onClick={() => setPinned((p) => !p)}
                style={{
                    position: OVERLAY_MODE ? 'absolute' : 'relative',
                    top: 0, left: 0, bottom: 0,
                    height: '100%',
                    zIndex: 20,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    paddingTop: 8, paddingBottom: 8,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    backgroundColor: '#121212',
                    borderRadius: 12,
                    cursor: 'pointer',
                    willChange: 'width',
                }}
            >
                <Box
                    ref={listRef}
                    sx={{
                        display: 'flex', flexDirection: 'column', width: '100%',
                        overflowY: 'auto', overflowX: 'hidden', minHeight: 0,
                        '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: '7px', pr: 1, mb: 1.5, flexShrink: 0 }}>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <Box
                                component="img"
                                src="https://music.atomglide.com/7.png"
                                alt="cover"
                                sx={{
                                    width: 25,
                                    height: 25,
                                    display: 'block',
                                    animation: 'spin 8s linear infinite',
                                    animationPlayState: isPlaying ? 'running' : 'paused',
                                    '@keyframes spin': {
                                        '0%': { transform: 'rotate(0deg)' },
                                        '100%': { transform: 'rotate(360deg)' },
                                    },
                                }}
                            />
                        </Box>
                        <motion.div
                            initial={false}
                            animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -10 }}
                            transition={{ duration: 0.28, delay: itemDelay(0), ease: EASE_OUT }}
                            style={{ minWidth: 0, whiteSpace: 'nowrap' }}
                        >
                            <Typography sx={{ color: 'white', fontSize: '15px', fontWeight: 600, lineHeight: 1.2 }}>Atom Music</Typography>
                            <Typography sx={{ color: '#7a7a7a', fontSize: '11px', lineHeight: 1.2 }}>
                               AtomGlide Labs
                            </Typography>
                        </motion.div>
                        <motion.div
                            initial={false}
                            animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -10 }}
                            transition={{ duration: 0.28, delay: itemDelay(0), ease: EASE_OUT }}
                            style={{ marginLeft: 'auto', pointerEvents: isExpanded ? 'auto' : 'none' }}
                        >
                            <IconButton
                                size="small"
                                aria-label="Настройки сайта"
                                onClick={(e) => { e.stopPropagation(); router.push('/settings'); }}
                                sx={{ color: 'rgba(255,255,255,0.5)', bgcolor: 'transparent', '&:active': { color: '#fff' } }}
                            >
                                <SettingsRoundedIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                        </motion.div>
                    </Box>

                    {(queue.length === 0 || settings.queue === false) && (
                        <Box sx={{ px: 1, pb: 1, flexShrink: 0 }}>
                            {[
                                { id: 'add', label: 'Добавить трек', type: 'plus', color: 'gray', seed: 10, to: '/upload' },
                                { id: 'new', label: 'Создать плейлист', type: 'playlist', color: 'blue', seed: 25, to: '/playlist/create' },
                                { id: 'fav', label: 'Избранное', type: 'heart', color: 'pink', seed: 88, to: '/favorites' },
                                { id: 'live', label: 'Трансляция', type: 'radio', color: 'cyan', seed: 44, to: '/broadcast' },
                                { id: 'profile', label: isAuthed ? 'Мой профиль' : 'Войдите в аккаунт', avatar: avatarUrl, to: '/profile' },
                            ].map((tile) => (
                                <Box
                                    key={tile.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (tile.to) router.push(tile.to);
                                    }}
                                    title={tile.label}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 1.5,
                                        pl: '7px', pr: 1, py: 0.8,
                                        mt: 0.6,
                                        borderRadius: '8px',
                                        cursor: tile.to ? 'pointer' : 'default',
                                        pointerEvents: isExpanded ? 'auto' : 'none',
                                        '&:hover': tile.to ? { bgcolor: 'rgba(255,255,255,0.05)' } : undefined,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 28, height: 28, borderRadius: '6px',
                                            flexShrink: 0, overflow: 'hidden',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                            backgroundColor: '#1e1e1e',
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        {tile.avatar ? (
                                            <Box
                                                component="img"
                                                src={tile.avatar}
                                                alt=""
                                                draggable={false}
                                                onError={(e) => {
                                                    if (e.currentTarget.dataset.f) return;
                                                    e.currentTarget.dataset.f = '1';
                                                    e.currentTarget.src = '/1.png';
                                                }}
                                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <PixelCover type={tile.type} color={tile.color} seed={tile.seed} />
                                        )}
                                    </Box>
                                    <motion.div
                                        initial={false}
                                        animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -10 }}
                                        transition={{ duration: 0.28, ease: EASE_OUT }}
                                        style={{ minWidth: 0, whiteSpace: 'nowrap' }}
                                    >
                                        <Typography noWrap sx={{ color: 'white', fontSize: '12.5px', fontWeight: 500, lineHeight: 1.3 }}>
                                            {tile.label}
                                        </Typography>
                                    </motion.div>
                                </Box>
                            ))}
                        </Box>
                    )}

                    {settings.queue !== false && (
                    <Reorder.Group
                        axis="y"
                        values={queue}
                        onReorder={handleReorderQueue}
                        style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                        <AnimatePresence initial={false}>
                            {queue.map((track, idx) => {
                                const isActive = idx === currentIndex;
                                const playItem = (e) => {
                                    e.stopPropagation();
                                    if (queueDragging.current) return;
                                    playFromQueue(idx);
                                };

                                return (
                                    <Reorder.Item
                                        key={track.qId}
                                        value={track}
                                        data-qid={track.qId}
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8, height: 0, paddingBottom: 0, transition: { duration: 0.22, ease: 'easeIn' } }}
                                        transition={{ duration: 0.3, ease: EASE_OUT }}
                                        whileDrag={{ scale: 1.04, zIndex: 5, cursor: 'grabbing' }}
                                        onDragStart={() => { queueDragging.current = true; }}
                                        onDragEnd={() => { setTimeout(() => { queueDragging.current = false; }, 60); }}
                                        style={{ width: '100%', paddingBottom: 12, position: 'relative', listStyle: 'none' }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', pl: '7px', pr: 1, boxSizing: 'border-box' }}>
                                            <CircleButton
                                                label={`Играть: ${track.title}`}
                                                active={isActive}
                                                pulse={isActive && isPlaying}
                                                onClick={playItem}
                                            >
                                                <Typography sx={{ fontSize: '18px', fontFamily: 'arial', fontWeight: 900, lineHeight: 1, color: 'inherit' }}>
                                                    {idx + 1}
                                                </Typography>
                                            </CircleButton>

                                            <motion.div
                                                initial={false}
                                                animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -12 }}
                                                transition={{ duration: 0.28, delay: itemDelay(idx + 1), ease: EASE_OUT }}
                                                style={{ flex: 1, minWidth: 0, pointerEvents: isExpanded ? 'auto' : 'none' }}
                                                aria-hidden={!isExpanded}
                                            >
                                                <Box
                                                    onClick={playItem}
                                                    sx={{
                                                        display: 'flex', alignItems: 'center',
                                                        border: '1px solid', borderColor: isActive ? 'white' : 'rgba(255,255,255,0.85)',
                                                        bgcolor: isActive ? 'white' : 'transparent',
                                                        borderRadius: '20px', pl: 1.5, pr: 0.5, py: 0.5,
                                                    }}
                                                >
                                                    <Typography
                                                        noWrap
                                                        sx={{ color: isActive ? 'black' : 'white', fontSize: '12px', mr: 0.5, flex: 1, minWidth: 0, transition: 'color 0.25s ease' }}
                                                    >
                                                        {track.title}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Убрать из очереди"
                                                        onClick={(e) => { e.stopPropagation(); removeFromQueue(idx); }}
                                                        sx={{
                                                            color: isActive ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', p: 0.5,
                                                            bgcolor: 'transparent',
                                                        }}
                                                    >
                                                        <CloseRoundedIcon sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                </Box>
                                            </motion.div>
                                        </Box>
                                    </Reorder.Item>
                                );
                            })}
                        </AnimatePresence>
                    </Reorder.Group>
                    )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', pt: 2, flexShrink: 0 }}>
                    {currentTrack && (
                        <motion.div
                            initial={false}
                            animate={{
                                width: isExpanded ? 160 : 36,
                                height: isExpanded ? 160 : 36,
                                borderRadius: isExpanded ? 10 : 4,
                                marginBottom: isExpanded ? 12 : 24,
                            }}
                            transition={tWidth}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={(e) => { e.stopPropagation(); toggleFullPlayer(true); }}
                            style={{ overflow: 'hidden', cursor: 'pointer', flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.45)' }}
                        >
                            <CoverImage src={currentTrack.cover} />
                        </motion.div>
                    )}

                    <Box
                        sx={{
                            display: 'grid',
                            width: '100%',
                            gridTemplateRows: isExpanded ? '1fr' : '0fr',
                            opacity: isExpanded ? 1 : 0,
                            transition: reduceMotion
                                ? 'none'
                                : `grid-template-rows 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity ${isExpanded ? '0.35s 0.08s' : '0.15s'} ease`,
                        }}
                    >
                        <Box sx={{ minHeight: 0, overflow: 'hidden' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', px: 2, pb: 2, gap: 0.5 }}>
                                <TrackInfo track={currentTrack} />
                                <PlaybackTimeDisplay />
                            </Box>
                        </Box>
                    </Box>

                    <motion.div
                        initial={false}
                        animate={{ height: isExpanded ? 48 : 152 }}
                        transition={tWidth}
                        style={{ position: 'relative', width: '100%' }}
                    >
                        <motion.div
                            initial={false}
                            animate={{ x: isExpanded ? 44 : 7, y: isExpanded ? 6 : 0 }}
                            transition={tPlay}
                            style={{ position: 'absolute', top: 0, left: 0 }}
                        >
                            <CircleButton label="Предыдущий" onClick={(e) => { e.stopPropagation(); prevTrack(); }}>
                                <SkipPreviousRoundedIcon sx={{ fontSize: 20 }} />
                            </CircleButton>
                        </motion.div>

                        <motion.div
                            initial={false}
                            animate={{ x: isExpanded ? 96 : 1, y: isExpanded ? 0 : 52 }}
                            transition={tPlay}
                            style={{ position: 'absolute', top: 0, left: 0 }}
                        >
                            <PlayPauseWithRing size={48} />
                        </motion.div>

                        <motion.div
                            initial={false}
                            animate={{ x: isExpanded ? 160 : 7, y: isExpanded ? 6 : 116 }}
                            transition={tPlay}
                            style={{ position: 'absolute', top: 0, left: 0 }}
                        >
                            <CircleButton label="Следующий" onClick={(e) => { e.stopPropagation(); nextTrack(); }}>
                                <SkipNextRoundedIcon sx={{ fontSize: 20 }} />
                            </CircleButton>
                        </motion.div>
                    </motion.div>
                </Box>
            </motion.div>
        </Box>
    );
}
