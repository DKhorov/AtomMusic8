"use client";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { PlayArrowRoundedIcon, ArrowBackRoundedIcon, GraphicEqRoundedIcon, ExpandLessRoundedIcon, ExpandMoreRoundedIcon, SkipPreviousRoundedIcon, SkipNextRoundedIcon } from './icons';
import TrackCover from './TrackCover';
import PixelCover, { PixelHeartIcon } from './PixelCover';
import { useMusic } from '../context/MusicContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/axios';
import { formatTrackRow } from '../lib/trackFormat';
import { playClick } from '../lib/sounds';
import { saveStoredSettings } from '../lib/settings';
import { loadLyrics } from '../lib/lyricsLoader';

function resolveLyrics(track, mod) {
    if (Array.isArray(track?.lyrics) && track.lyrics.length > 0) return track.lyrics;
    if (!mod) return null;
    const name = (track?.title || '').toLowerCase();
    if (name.includes('chicago')) return mod.chicago;
    if (name.includes('bohemian rhapsody')) return mod.bohemianRhapsodyLyricsRu;
    if (name.includes('let it happen')) return mod.letItHappen;
    if (name.includes('flashing lights')) return mod.flashingLights;
    return null;
}

function fmt(sec) {
    if (!sec || Number.isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

function FeedNavButton({ label, onClick, children }) {
    return (
        <Box
            className="perf-glass"
            role="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.14)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#fff',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background-color 0.2s ease, transform 0.15s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
                '&:active': { transform: 'scale(0.9)' },
            }}
        >
            {children}
        </Box>
    );
}

const ShortCard = memo(function ShortCard({ track, active, heavy, isPlaying, unlocked, time, duration, liked, onToggle, onLike, onStart, lyricsMod }) {
    const lyrics = useMemo(() => resolveLyrics(track, lyricsMod), [track, lyricsMod]);
    const activeLine = useMemo(() => {
        if (!lyrics || lyrics.length === 0) return -1;
        let idx = -1;
        for (let i = 0; i < lyrics.length; i++) {
            if (lyrics[i].time <= time + 0.15) idx = i;
            else break;
        }
        return idx;
    }, [lyrics, time]);

    const visible = lyrics ? lyrics.slice(Math.max(0, activeLine - 1), Math.max(0, activeLine) + 2) : [];
    const shift = Math.max(0, activeLine - 1);
    const progress = duration > 0 ? Math.min(1, time / duration) : 0;
    const isCurrent = active && unlocked;

    return (
        <Box
            className="feed-card"
            sx={{
                position: 'relative',
                height: '100%',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
            }}
        >
            {heavy ? (
                <Box
                    className="perf-blur"
                    sx={{
                        position: 'absolute',
                        inset: -40,
                        backgroundImage: `url(${track.cover})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(48px) brightness(0.45) saturate(1.6)',
                        transform: active && isPlaying ? 'scale(1.08)' : 'scale(1.02)',
                        transition: 'transform 1.2s ease',
                    }}
                />
            ) : (
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#0d0d0d' }} />
            )}
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.88) 100%)' }} />

            <Box
                onClick={unlocked ? onToggle : onStart}
                sx={{ position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 1 }}
            />

            <Box sx={{ position: 'relative', zIndex: 2, flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <Box
                    sx={{
                        position: 'relative',
                        width: 'min(52vh, 62vw)',
                        aspectRatio: '1 / 1',
                        borderRadius: '18px',
                        overflow: 'hidden',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
                        transform: isCurrent && isPlaying ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.97)',
                        transition: 'transform 0.5s ease',
                    }}
                >
                    <TrackCover src={track.cover} alt={track.title} sizes="360px" />
                </Box>
            </Box>

            {isCurrent && !isPlaying && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, pointerEvents: 'none' }}>
                    <PlayArrowRoundedIcon sx={{ fontSize: 110, color: 'rgba(255,255,255,0.85)', filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.6))' }} />
                </Box>
            )}

            {lyrics && (
                <Box sx={{ position: 'absolute', left: 0, right: 24, bottom: 184, px: 3, zIndex: 4, pointerEvents: 'none' }}>
                    {visible.map((line, i) => {
                        const realIdx = shift + i;
                        const isActive = realIdx === activeLine;
                        return (
                            <Typography
                                key={`${line.time}-${i}`}
                                sx={{
                                    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.45)',
                                    fontSize: isActive ? '1.5rem' : '1.15rem',
                                    fontWeight: isActive ? 800 : 600,
                                    lineHeight: 1.3,
                                    mb: 0.6,
                                    textShadow: isActive ? '0 2px 18px rgba(0,0,0,0.65)' : 'none',
                                }}
                            >
                                {typeof line === 'string' ? line : line.text}
                            </Typography>
                        );
                    })}
                </Box>
            )}

            <Box sx={{ position: 'relative', zIndex: 5, px: 3, pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.6, bgcolor: 'rgba(255,255,255,0.14)', borderRadius: '999px', px: 1.2, py: 0.4, backdropFilter: 'blur(10px)' }}>
                        <GraphicEqRoundedIcon sx={{ fontSize: 14, color: '#fff' }} />
                        <Typography sx={{ color: '#fff', fontSize: '11px', letterSpacing: '0.4px' }}>
                            Оригинальный звук · Atom Music
                        </Typography>
                    </Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
                        {track.album || 'Single'}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ color: '#fff', fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.2 }}>
                            {track.title}
                        </Typography>
                        <Typography noWrap sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
                            {track.author}
                        </Typography>
                    </Box>

                    <Box
                        onClick={(e) => { e.stopPropagation(); onLike(track); }}
                        title={liked ? 'Убрать из избранного' : 'Добавить в избранное'}
                        sx={{
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 0.5,
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease',
                            '&:active': { transform: 'scale(0.86)' },
                        }}
                    >
                        <PixelHeartIcon isFavorite={liked} size={30} />
                        <Typography sx={{ color: liked ? '#ff2a6d' : 'rgba(255,255,255,0.75)', fontSize: '11px', fontWeight: 600, transition: 'color 0.2s ease' }}>
                            Избранное
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, mt: 1.2 }}>
                    <Box sx={{ flexGrow: 1, height: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
                        <Box sx={{ width: `${progress * 100}%`, height: '100%', bgcolor: '#fff', transition: 'width 0.2s linear' }} />
                    </Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(time)} / {fmt(duration)}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
});

export default function MusicFeed() {
    const {
        tracks, setTracks, isPlaying, togglePlay, playTrackNow,
        favoriteIds, toggleFavorite, audioRef, setTrackToastMuted, currentTrack,
    } = useMusic();
    const { isAuthed, requestLogin } = useAuth();
    const settings = useSettings();

    const [index, setIndex] = useState(0);
    const [unlocked, setUnlocked] = useState(false);
    const [time, setTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [favOnly, setFavOnly] = useState(false);
    const [lyricsMod, setLyricsMod] = useState(null);

    useEffect(() => {
        let alive = true;
        loadLyrics().then((m) => { if (alive && m) setLyricsMod(m); });
        return () => { alive = false; };
    }, []);

    const scrollerRef = useRef(null);
    const pendingT = useRef(null);
    const lastIndex = useRef(-1);
    const indexRef = useRef(0);
    const scrollTimer = useRef(null);
    const alignedOnce = useRef(false);

    const list = useMemo(
        () => (favOnly ? tracks.filter((t) => favoriteIds.has(t.id)) : tracks),
        [favOnly, tracks, favoriteIds]
    );

    useEffect(() => {
        if (!isAuthed) return;
        if (tracks.length > 0) return;
        let alive = true;
        api.get('/music/list')
            .then((res) => {
                if (!alive) return;
                setTracks((res.data.tracks || []).map(formatTrackRow));
            })
            .catch(() => {});
        return () => { alive = false; };
    }, [tracks.length, setTracks, isAuthed]);

    useEffect(() => {
        setTrackToastMuted(true);
        return () => setTrackToastMuted(false);
    }, [setTrackToastMuted]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t = Number(params.get('t'));
        if (Number.isFinite(t) && t > 0) pendingT.current = t;
        if (params.get('fav') === '1') queueMicrotask(() => setFavOnly(true));
    }, []);

    useEffect(() => {
        indexRef.current = index;
    }, [index]);

    useEffect(() => () => { if (scrollTimer.current) clearTimeout(scrollTimer.current); }, []);

    useEffect(() => {
        if (!unlocked) return;
        const audio = audioRef?.current;
        if (!audio) return;
        const id = setInterval(() => {
            setTime(audio.currentTime || 0);
            setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        }, 200);
        return () => clearInterval(id);
    }, [unlocked, audioRef, index]);

    const applyPendingSeek = useCallback(() => {
        if (pendingT.current == null) return;
        const t = pendingT.current;
        pendingT.current = null;
        setTimeout(() => {
            const audio = audioRef?.current;
            if (!audio || !Number.isFinite(t)) return;
            const set = () => { try { audio.currentTime = t; } catch {} };
            if (audio.readyState >= 1) set();
            else audio.addEventListener('loadedmetadata', set, { once: true });
        }, 400);
    }, [audioRef]);

    const startFeed = useCallback(() => {
        const track = list[index];
        if (!track) return;
        playClick();
        lastIndex.current = index;
        setUnlocked(true);
        playTrackNow(track);
        applyPendingSeek();
    }, [list, index, playTrackNow, applyPendingSeek]);

    const scrollTo = useCallback((next) => {
        const container = scrollerRef.current;
        if (!container) return;
        const clamped = Math.max(0, Math.min(list.length - 1, next));
        container.scrollTo({ top: clamped * container.clientHeight, behavior: 'smooth' });
        indexRef.current = clamped;
        setIndex(clamped);
    }, [list.length]);

    const handleScroll = useCallback(() => {
        const container = scrollerRef.current;
        if (!container) return;
        const next = Math.round(container.scrollTop / container.clientHeight);
        if (scrollTimer.current) clearTimeout(scrollTimer.current);
        scrollTimer.current = setTimeout(() => {
            scrollTimer.current = null;
            setIndex((prev) => (prev === next ? prev : next));
        }, 140);
    }, []);

    useEffect(() => {
        const id = currentTrack?.id;
        if (!id || list.length === 0) return;
        const first = !alignedOnce.current;
        alignedOnce.current = true;
        const idx = list.findIndex((t) => t.id === id);
        if (idx === -1) {
            if (settings.feedAutoscroll !== false && favOnly && unlocked && list.length > 0) {
                const target = (indexRef.current + 1) % list.length;
                lastIndex.current = target;
                indexRef.current = target;
                setIndex(target);
                playTrackNow(list[target]);
                const container = scrollerRef.current;
                if (container) container.scrollTo({ top: target * container.clientHeight, behavior: 'smooth' });
            }
            return;
        }
        if (idx === indexRef.current) return;
        if (!first && settings.feedAutoscroll === false) return;
        lastIndex.current = idx;
        indexRef.current = idx;
        setIndex(idx);
        const container = scrollerRef.current;
        if (container) container.scrollTo({ top: idx * container.clientHeight, behavior: 'smooth' });
    }, [currentTrack, list, favOnly, unlocked, playTrackNow, settings.feedAutoscroll]);

    useEffect(() => {
        if (!unlocked) return;
        if (index === lastIndex.current) return;
        const track = list[index];
        if (!track) return;
        lastIndex.current = index;
        playTrackNow(track);
        applyPendingSeek();
    }, [index, unlocked, list, playTrackNow, applyPendingSeek]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); scrollTo(indexRef.current + 1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); scrollTo(indexRef.current - 1); }
            else if (e.key === ' ') { e.preventDefault(); if (unlocked) togglePlay(); else startFeed(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [scrollTo, togglePlay, unlocked, startFeed]);

    const handleLike = useCallback((track) => {
        if (!isAuthed) { requestLogin(); return; }
        const removing = favoriteIds.has(track.id);
        if (favOnly && removing) {
            const idx = list.findIndex((t) => t.id === track.id);
            const nextList = list.filter((t) => t.id !== track.id);
            toggleFavorite(track);
            if (idx === -1) return;
            const target = Math.min(idx, Math.max(0, nextList.length - 1));
            const next = nextList[target];
            if (next && unlocked) {
                lastIndex.current = target;
                indexRef.current = target;
                setIndex(target);
                playTrackNow(next);
                const container = scrollerRef.current;
                if (container) container.scrollTo({ top: target * container.clientHeight, behavior: 'smooth' });
            } else if (!next && isPlaying) {
                togglePlay();
            }
            return;
        }
        toggleFavorite(track);
    }, [isAuthed, requestLogin, favoriteIds, favOnly, list, unlocked, playTrackNow, togglePlay, isPlaying, toggleFavorite]);

    if (!isAuthed) {
        return (
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, color: '#fff', px: 3, textAlign: 'center' }}>
                <Box sx={{ width: 110, height: 110, borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <PixelCover type="feed" color="purple" seed={63} />
                </Box>
                <Typography sx={{ fontSize: '19px', fontWeight: 800 }}>
                    Войдите в аккаунт
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '13.5px', maxWidth: 400, lineHeight: 1.6 }}>
                    «Поток», очередь и избранное доступны после входа в аккаунт.
                </Typography>
                <Box
                    onClick={() => requestLogin()}
                    sx={{
                        cursor: 'pointer',
                        bgcolor: '#fff',
                        color: '#000',
                        borderRadius: '999px',
                        px: 3,
                        py: 1.1,
                        fontWeight: 700,
                        fontSize: '14px',
                        mt: 1,
                        '&:active': { transform: 'scale(0.97)' },
                    }}
                >
                    Войти
                </Box>
            </Box>
        );
    }

    if (settings.feed === false) {
        return (
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, color: '#fff', px: 3, textAlign: 'center' }}>
                <Box sx={{ width: 110, height: 110, borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <PixelCover type="feed" color="purple" seed={63} />
                </Box>
                <Typography sx={{ fontSize: '19px', fontWeight: 800 }}>
                    Поток выключен
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '13.5px', maxWidth: 400, lineHeight: 1.6 }}>
                    Лента «Поток» отключена в настройках. Включи её, чтобы листать треки как в ленте.
                </Typography>
                <Box
                    onClick={() => saveStoredSettings({ ...settings, feed: true })}
                    sx={{
                        cursor: 'pointer',
                        bgcolor: '#fff',
                        color: '#000',
                        borderRadius: '999px',
                        px: 3,
                        py: 1.1,
                        fontWeight: 700,
                        fontSize: '14px',
                        mt: 1,
                        '&:active': { transform: 'scale(0.97)' },
                    }}
                >
                    Включить Поток
                </Box>
                <Box
                    component={Link}
                    href="/"
                    sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textDecoration: 'none', mt: 0.5, '&:hover': { color: '#fff' } }}
                >
                    На главную
                </Box>
            </Box>
        );
    }

    if (list.length === 0) {
        const loading = tracks.length === 0;
        return (
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, color: '#fff' }}>
                <Box sx={{ width: 120, height: 120, borderRadius: '18px', bgcolor: '#1c1c20', animation: loading ? 'pulse 1.4s ease-in-out infinite' : 'none', '@keyframes pulse': { from: { opacity: 0.5 }, to: { opacity: 1 } } }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', textAlign: 'center', px: 3 }}>
                    {loading ? 'Загружаю ленту…' : favOnly ? 'В избранном пока пусто — ставь ♥ в ленте или на главной' : 'В ленте пока нет треков'}
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, minHeight: 0, position: 'relative', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, pt: 1.5, pointerEvents: 'none' }}>
                <Box
                    component={Link}
                    href={favOnly ? '/favorites' : '/'}
                    sx={{
                        pointerEvents: 'auto',
                        position: 'absolute',
                        left: 16,
                        top: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.6,
                        textDecoration: 'none',
                        color: 'rgba(255,255,255,0.92)',
                        fontSize: '13px',
                        fontWeight: 600,
                        px: 1.4,
                        py: 0.7,
                        borderRadius: '999px',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.14)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        transition: 'background-color 0.2s ease',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                    }}
                >
                    <ArrowBackRoundedIcon sx={{ fontSize: 16 }} />
                    {favOnly ? 'К избранному' : 'На главную'}
                </Box>
                <Typography
                    sx={{
                        mt: 1,
                        fontSize: { xs: '12px', sm: '14px' },
                        fontWeight: 900,
                        letterSpacing: { xs: '0.2em', sm: '0.32em' },
                        textTransform: 'uppercase',
                        background: 'linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.45) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    {favOnly ? 'Избранное' : 'Поток'}
                </Typography>
            </Box>

            <Box
                ref={scrollerRef}
                onScroll={handleScroll}
                sx={{
                    height: '100%',
                    overflowY: 'auto',
                    scrollSnapType: 'y mandatory',
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none',
                }}
            >
                {list.map((track, i) => (
                    <ShortCard
                        key={`${track.id}-${i}`}
                        track={track}
                        active={i === index}
                        heavy={Math.abs(i - index) <= 1}
                        isPlaying={i === index ? isPlaying : false}
                        unlocked={unlocked}
                        time={i === index ? time : 0}
                        duration={i === index ? duration : 0}
                        liked={favoriteIds.has(track.id)}
                        onToggle={togglePlay}
                        onLike={handleLike}
                        onStart={startFeed}
                        lyricsMod={lyricsMod}
                    />
                ))}
            </Box>

            <Box
                sx={{
                    position: 'absolute',
                    right: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 12,
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2.5,
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FeedNavButton label="Вверх по ленте" onClick={() => scrollTo(indexRef.current - 1)}>
                        <ExpandLessRoundedIcon sx={{ fontSize: 26 }} />
                    </FeedNavButton>
                    <FeedNavButton label="Вниз по ленте" onClick={() => scrollTo(indexRef.current + 1)}>
                        <ExpandMoreRoundedIcon sx={{ fontSize: 26 }} />
                    </FeedNavButton>
                </Box>
                <Box sx={{ width: 22, height: 1, bgcolor: 'rgba(255,255,255,0.2)' }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FeedNavButton label="Предыдущий трек" onClick={() => scrollTo(indexRef.current - 1)}>
                        <SkipPreviousRoundedIcon sx={{ fontSize: 24 }} />
                    </FeedNavButton>
                    <FeedNavButton label="Следующий трек" onClick={() => scrollTo(indexRef.current + 1)}>
                        <SkipNextRoundedIcon sx={{ fontSize: 24 }} />
                    </FeedNavButton>
                </Box>
            </Box>

            {!unlocked && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, pointerEvents: 'none' }}>
                    <Box
                        onClick={startFeed}
                        sx={{
                            pointerEvents: 'auto',
                            cursor: 'pointer',
                            px: 3, py: 1.4,
                            borderRadius: '999px',
                            bgcolor: 'rgba(255,255,255,0.92)',
                            color: '#000',
                            fontWeight: 700,
                            fontSize: '15px',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                        }}
                    >
                        Начать
                    </Box>
                </Box>
            )}

            {unlocked && (
                <Box sx={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', zIndex: 9, color: 'rgba(255,255,255,0.45)', fontSize: '11px', pointerEvents: 'none' }}>
                    свайп<Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}> / ↑ ↓</Box> — следующий трек · тап — пауза · {index + 1} из {list.length}
                </Box>
            )}
        </Box>
    );
}
