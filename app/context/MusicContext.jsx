"use client";
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { playClick } from '../lib/sounds';
import { api } from '../lib/axios';
import { formatTrackRow } from '../lib/trackFormat';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';

const MusicContext = createContext();

let sharedAudio = null;
function getSharedAudio() {
    if (typeof window === 'undefined') return null;
    if (!sharedAudio) {
        sharedAudio = new Audio();
        sharedAudio.preload = 'auto';
    }
    return sharedAudio;
}

export function MusicProvider({ children }) {
    const [tracks, setTracks] = useState([]);
    const [queue, setQueue] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPlayerOpen, setIsPlayerOpen] = useState(false);

    const audioRef = useRef(null);
    const trackToastMutedRef = useRef(false);
    const pendingSeekRef = useRef(null);
    const currentTrackIdRef = useRef(null);
    const [trackToast, setTrackToast] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [favoriteIds, setFavoriteIds] = useState(new Set());

    const { isAuthed, requestLogin } = useAuth();
    const settings = useSettings();
    const settingsRef = useRef(settings);
    const loadedTrackIdRef = useRef(null);
    const lastErrorIdRef = useRef(null);
    const nextTrackRef = useRef(null);
    const prevTrackRef = useRef(null);

    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    const requireAuth = useCallback(() => {
        if (isAuthed) return true;
        requestLogin();
        return false;
    }, [isAuthed, requestLogin]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = getSharedAudio();
        }
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const v = typeof settings.volume === 'number' ? settings.volume : 1;
        audio.volume = Math.min(1, Math.max(0, v));
    }, [settings.volume]);

    useEffect(() => {
        let raw = null;
        try { raw = window.localStorage.getItem('atmusic:lastPlayback'); } catch {}
        if (!raw) return;
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch {}
        const saved = parsed?.track;
        if (!saved?.streamUrl) return;
        const t = Number(parsed.time);
        if (Number.isFinite(t) && t > 1) pendingSeekRef.current = { id: saved.id, time: t };
        const qTrack = { ...saved, qId: `${saved.id}-restore-${Date.now()}` };
        queueMicrotask(() => {
            setQueue([qTrack]);
            setCurrentIndex(0);
            setCurrentTrack(saved);
        });
    }, []);

    useEffect(() => {
        currentTrackIdRef.current = currentTrack?.id ?? null;
    }, [currentTrack]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const apply = () => {
            const pending = pendingSeekRef.current;
            if (!pending) return;
            pendingSeekRef.current = null;
            if (currentTrackIdRef.current !== pending.id) return;
            try {
                const d = audio.duration;
                audio.currentTime = Number.isFinite(d) && d > 0 ? Math.min(pending.time, Math.max(0, d - 0.5)) : pending.time;
            } catch {}
        };
        audio.addEventListener('loadedmetadata', apply);
        return () => audio.removeEventListener('loadedmetadata', apply);
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;
        const save = () => {
            try {
                window.localStorage.setItem('atmusic:lastPlayback', JSON.stringify({
                    track: {
                        id: currentTrack.id,
                        title: currentTrack.title,
                        author: currentTrack.author,
                        album: currentTrack.album,
                        cover: currentTrack.cover,
                        streamUrl: currentTrack.streamUrl,
                    },
                    time: audio.currentTime || 0,
                    savedAt: Date.now(),
                }));
            } catch {}
        };
        let last = 0;
        const onTime = () => {
            const now = Date.now();
            if (now - last < 1000) return;
            last = now;
            save();
        };
        audio.addEventListener('timeupdate', onTime);
        audio.addEventListener('pause', save);
        return () => {
            audio.removeEventListener('timeupdate', onTime);
            audio.removeEventListener('pause', save);
        };
    }, [currentTrack]);

    const setTrackToastMuted = useCallback((muted) => {
        trackToastMutedRef.current = !!muted;
        if (muted) setTrackToast(null);
    }, []);

    const playTrackNow = useCallback((track) => {
        if (!track || !requireAuth()) return;
        const qTrack = { ...track, qId: `${track.id}-${Date.now()}` };
        setQueue([qTrack]);
        setCurrentIndex(0);
        setCurrentTrack(track);
        setIsPlaying(true);
    }, [requireAuth]);

    const addToQueue = useCallback((track) => {
        if (!track || !requireAuth()) return;
        const qTrack = { ...track, qId: `${track.id}-${Date.now()}` };
        setQueue((prev) => {
            const newQ = [...prev, qTrack];
            if (!currentTrack) {
                setCurrentIndex(0);
                setCurrentTrack(track);
            }
            return newQ;
        });
    }, [currentTrack, requireAuth]);

    const playFromQueue = useCallback((index) => {
        if (!requireAuth()) return;
        if (queue[index]) {
            setCurrentIndex(index);
            setCurrentTrack(queue[index]);
            setIsPlaying(true);
        }
    }, [queue, requireAuth]);

    const removeFromQueue = useCallback((index) => {
        setQueue((prev) => prev.filter((_, i) => i !== index));
        if (index === currentIndex) {
            nextTrackRef.current?.();
        } else if (index < currentIndex) {
            setCurrentIndex((prev) => prev - 1);
        }
    }, [currentIndex]);

    const handleReorderQueue = useCallback((newQueue) => {
        setQueue(newQueue);
        if (currentTrack) {
            const newIdx = newQueue.findIndex((t) => t.qId === currentTrack.qId);
            if (newIdx !== -1) setCurrentIndex(newIdx);
        }
    }, [currentTrack]);

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
            return;
        }
        if (!requireAuth()) return;
        playClick();
        setIsPlaying(true);
        audio.play().catch(() => setIsPlaying(false));
    }, [isPlaying, currentTrack, requireAuth]);

    useEffect(() => {
        if (isAuthed) return;
        const audio = audioRef.current;
        if (audio && !audio.paused) {
            audio.pause();
            setIsPlaying(false);
        }
    }, [isAuthed]);

    const seek = useCallback((time) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    }, []);

    const toggleFullPlayer = useCallback((open) => {
        setIsPlayerOpen((prev) => (typeof open === 'boolean' ? open : !prev));
    }, []);

    const nextTrack = useCallback(() => {
        if (!currentTrack) return;

        if (queue.length > 0 && currentIndex < queue.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setCurrentTrack(queue[nextIdx]);
            return;
        }

        const globalIndex = tracks.findIndex((t) => t.id === currentTrack.id);

        if (globalIndex !== -1) {
            if (globalIndex < tracks.length - 1) {
                setCurrentTrack(tracks[globalIndex + 1]);
            } else if (settingsRef.current.loop !== false) {
                setCurrentTrack(tracks[0]);
            } else {
                audioRef.current?.pause();
                setIsPlaying(false);
            }
            return;
        }

        if (queue.length > 0) {
            setCurrentIndex(0);
            setCurrentTrack(queue[0]);
        }
    }, [currentTrack, currentIndex, queue, tracks]);

    const prevTrack = useCallback(() => {
        const audio = audioRef.current;
        if (audio && (audio.currentTime || 0) > 3) {
            audio.currentTime = 0;
            return;
        }

        if (currentIndex > 0) {
            const prevIdx = currentIndex - 1;
            setCurrentIndex(prevIdx);
            setCurrentTrack(queue[prevIdx]);
            return;
        }

        if (currentTrack && tracks.length > 0) {
            const globalIndex = tracks.findIndex((t) => t.id === currentTrack.id);
            if (globalIndex > 0) {
                setCurrentTrack(tracks[globalIndex - 1]);
            }
        }
    }, [currentIndex, queue, currentTrack, tracks]);

    useEffect(() => {
        nextTrackRef.current = nextTrack;
        prevTrackRef.current = prevTrack;
    }, [nextTrack, prevTrack]);

    useEffect(() => {
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
        const audio = audioRef.current;
        const ms = navigator.mediaSession;
        try {
            ms.setActionHandler('play', () => {
                if (!audio) return;
                audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
            });
            ms.setActionHandler('pause', () => {
                if (!audio) return;
                audio.pause();
                setIsPlaying(false);
            });
            ms.setActionHandler('previoustrack', () => { prevTrackRef.current?.(); });
            ms.setActionHandler('nexttrack', () => { nextTrackRef.current?.(); });
            ms.setActionHandler('seekbackward', (details) => {
                if (!audio) return;
                const delta = details?.seekOffset || 10;
                audio.currentTime = Math.max(0, (audio.currentTime || 0) - delta);
            });
            ms.setActionHandler('seekforward', (details) => {
                if (!audio) return;
                const delta = details?.seekOffset || 10;
                const pos = (audio.currentTime || 0) + delta;
                audio.currentTime = Number.isFinite(audio.duration) ? Math.min(audio.duration, pos) : pos;
            });
            ms.setActionHandler('seekto', (details) => {
                if (!audio || details?.seekTime == null) return;
                audio.currentTime = details.seekTime;
            });
        } catch {}
        return () => {
            ['play', 'pause', 'previoustrack', 'nexttrack', 'seekbackward', 'seekforward', 'seekto'].forEach((name) => {
                try { ms.setActionHandler(name, null); } catch {}
            });
        };
    }, []);

    useEffect(() => {
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
        if (typeof MediaMetadata === 'undefined' || !currentTrack) return;
        try {
            const cover = currentTrack.cover || '';
            const artworkUrl = cover.startsWith('http') ? cover : `${window.location.origin}${cover.startsWith('/') ? '' : '/'}${cover}`;
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentTrack.title || 'Без названия',
                artist: currentTrack.author || 'Неизвестен',
                album: currentTrack.album || 'Single',
                artwork: artworkUrl ? [{ src: artworkUrl, sizes: '512x512', type: 'image/png' }] : [],
            });
        } catch {}
    }, [currentTrack]);

    useEffect(() => {
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
        try {
            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        } catch {}
    }, [isPlaying]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
        const ms = navigator.mediaSession;
        if (typeof ms.setPositionState !== 'function') return;
        let last = 0;
        const update = () => {
            const now = Date.now();
            if (now - last < 1000) return;
            last = now;
            const d = audio.duration;
            if (!Number.isFinite(d) || d <= 0) return;
            try {
                ms.setPositionState({
                    duration: d,
                    playbackRate: audio.playbackRate || 1,
                    position: Math.min(Math.max(0, audio.currentTime || 0), d),
                });
            } catch {}
        };
        update();
        audio.addEventListener('timeupdate', update);
        return () => audio.removeEventListener('timeupdate', update);
    }, []);

    const reloadFavorites = useCallback(async () => {
        if (!isAuthed) {
            setFavorites([]);
            setFavoriteIds(new Set());
            return [];
        }
        try {
            const res = await api.get('/music/favorites');
            const list = (res.data.tracks || []).map(formatTrackRow);
            setFavorites(list);
            setFavoriteIds(new Set(list.map((t) => t.id)));
            return list;
        } catch {
            return [];
        }
    }, [isAuthed]);

    useEffect(() => {
        let cancelled = false;
        if (!isAuthed) {
            queueMicrotask(() => {
                if (cancelled) return;
                setFavorites([]);
                setFavoriteIds(new Set());
            });
            return () => { cancelled = true; };
        }
        (async () => {
            try {
                const res = await api.get('/music/favorites');
                if (cancelled) return;
                const list = (res.data.tracks || []).map(formatTrackRow);
                setFavorites(list);
                setFavoriteIds(new Set(list.map((t) => t.id)));
            } catch {}
        })();
        return () => { cancelled = true; };
    }, [isAuthed]);

    const toggleFavorite = useCallback(async (track) => {
        const id = track?.id;
        if (!id) return { ok: false, favorite: false };
        if (!requireAuth()) return { ok: false, favorite: false };
        const wasFav = favoriteIds.has(id);

        setFavoriteIds((prev) => {
            const next = new Set(prev);
            if (wasFav) next.delete(id); else next.add(id);
            return next;
        });
        setFavorites((prev) => (wasFav
            ? prev.filter((t) => t.id !== id)
            : [{ ...track }, ...prev]));

        try {
            if (wasFav) {
                await api.delete(`/music/favorites/${id}`);
            } else {
                await api.post(`/music/favorites/${id}`);
            }
            return { ok: true, favorite: !wasFav };
        } catch (err) {

            setFavoriteIds((prev) => {
                const next = new Set(prev);
                if (wasFav) next.add(id); else next.delete(id);
                return next;
            });
            setFavorites((prev) => (wasFav ? [{ ...track }, ...prev] : prev.filter((t) => t.id !== id)));
            console.error('Ошибка избранного:', err?.message || err);
            return { ok: false, favorite: wasFav };
        }
    }, [favoriteIds, requireAuth]);

    const clearFavorites = useCallback(async () => {
        if (!isAuthed) return;
        const ids = favorites.map((t) => t.id);
        if (ids.length === 0) return;
        setFavorites([]);
        setFavoriteIds(new Set());
        for (const id of ids) {
            try {
                await api.delete(`/music/favorites/${id}`);
            } catch {}
        }
        await reloadFavorites();
    }, [isAuthed, favorites, reloadFavorites]);

    const playFavorites = useCallback((list = null, startIndex = 0) => {
        const src = Array.isArray(list) && list.length ? list : favorites;
        if (!src.length) return;
        if (!requireAuth()) return;
        const base = Date.now();
        const qTracks = src.map((t, i) => ({ ...t, qId: `${t.id}-${base}-${i}` }));
        const idx = Math.min(Math.max(startIndex || 0, 0), qTracks.length - 1);
        setQueue(qTracks);
        setCurrentIndex(idx);
        setCurrentTrack(qTracks[idx]);
        setIsPlaying(true);
    }, [favorites, requireAuth]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;

        if (loadedTrackIdRef.current !== currentTrack.id || !audio.src) {
            loadedTrackIdRef.current = currentTrack.id;
            audio.src = currentTrack.streamUrl;
        }
        if (isPlaying && audio.paused) {
            audio.play().catch(() => setIsPlaying(false));
        }
    }, [currentTrack, isPlaying]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleError = () => {
            const id = currentTrackIdRef.current;
            if (!id) return;
            if (settingsRef.current.autoNext === false || lastErrorIdRef.current === id) {
                setIsPlaying(false);
                return;
            }
            lastErrorIdRef.current = id;
            nextTrackRef.current?.();
        };

        audio.addEventListener('error', handleError);
        return () => audio.removeEventListener('error', handleError);
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handlePlaying = () => {
            if (!currentTrack) return;
            if (trackToastMutedRef.current) return;
            setTrackToast({ track: currentTrack, key: Date.now() });
        };

        audio.addEventListener('playing', handlePlaying);
        return () => audio.removeEventListener('playing', handlePlaying);
    }, [currentTrack]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleEnded = () => {
            if (settingsRef.current.autoNext === false) {
                setIsPlaying(false);
                return;
            }
            nextTrack();
        };

        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('ended', handleEnded);
        };
    }, [nextTrack]);

    return (
        <MusicContext.Provider
            value={{
                tracks,
                setTracks,
                queue,
                currentIndex,
                currentTrack,
                isPlaying,
                isPlayerOpen,
                audioRef,
                trackToast,
                setTrackToastMuted,
                favorites,
                favoriteIds,
                reloadFavorites,
                clearFavorites,
                toggleFavorite,
                playFavorites,
                playTrackNow,
                addToQueue,
                playFromQueue,
                removeFromQueue,
                handleReorderQueue,
                togglePlay,
                seek,
                nextTrack,
                prevTrack,
                toggleFullPlayer,
            }}
        >
            {children}
        </MusicContext.Provider>
    );
}

export function useMusic() {
    return useContext(MusicContext);
}
