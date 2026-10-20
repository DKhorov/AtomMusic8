"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import IconButton from "@mui/material/IconButton";
import Slide from "@mui/material/Slide";
import { PlayArrowIcon, PauseIcon, SkipPreviousIcon, SkipNextIcon, SubtitlesIcon, SubtitlesOutlinedIcon, KeyboardArrowDownIcon, FavoriteIcon, FavoriteBorderIcon, Replay10Icon, Forward10Icon } from './icons';
import { useMusic } from "../context/MusicContext";
import { useSettings } from "../context/SettingsContext";

import { loadLyrics } from "../lib/lyricsLoader";

import { DEFAULT_COVER } from "../lib/trackFormat";
const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif";

const formatTime = (sec) => {
    if (!sec || isNaN(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
};

const LINE_LEAD = 0.25;

function buildLine(line, nextTime) {
    const time = line.time ?? 0;
    const lineEnd = typeof nextTime === "number" ? nextTime : time + 5;

    if (Array.isArray(line.words) && line.words.length > 0) {
        const words = line.words.map((w, k) => {
            const start = typeof w.start === "number" ? w.start : time;
            const nextStart = line.words[k + 1]?.start;
            const end = typeof nextStart === "number" ? nextStart : Math.min(lineEnd, start + 3);
            return { word: String(w.word ?? w.text ?? ""), start, end: Math.max(end, start + 0.05) };
        });
        return { time, text: line.text ?? words.map((w) => w.word).join(" "), words };
    }

    const text = String(line.text ?? "").trim();
    const tokens = text.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return { time, text: "", words: [] };

    const weights = tokens.map((t) => t.length + 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const available = Math.max(lineEnd - time - 0.2, 0.5);
    const span = Math.min(available, Math.max(1.2, totalWeight * 0.07));

    let acc = time;
    const words = tokens.map((t, k) => {
        const dur = (weights[k] / totalWeight) * span;
        const w = { word: t, start: acc, end: acc + dur };
        acc += dur;
        return w;
    });
    return { time, text, words };
}

export const LyricsView = ({ lyrics, currentTime = 0, onSeek, audioRef, isMobileView = false, compact = false }) => {
    const scrollRef = useRef(null);
    const lineRefs = useRef([]);
    const wordEls = useRef({});
    const animRef = useRef(0);
    const activeRef = useRef(-1);
    const timeRef = useRef(0);
    const userTimer = useRef(null);
    const freeScrollRef = useRef(false);

    const [activeIndex, setActiveIndex] = useState(0);
    const [freeScroll, setFreeScroll] = useState(false);
    const [boxH, setBoxH] = useState(500);

    timeRef.current = currentTime;

    const isTimed = useMemo(
        () => Array.isArray(lyrics) && lyrics.length > 0 && typeof lyrics[0] === "object" && "time" in lyrics[0],
        [lyrics]
    );

    const lineData = useMemo(() => {
        if (!isTimed) return [];
        return lyrics.map((l, i) => buildLine(l, lyrics[i + 1]?.time));
    }, [lyrics, isTimed]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el || typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(() => setBoxH(el.clientHeight || 500));
        ro.observe(el);
        setBoxH(el.clientHeight || 500);
        return () => ro.disconnect();
    }, [isTimed, lyrics]);

    const anchor = boxH * (isMobileView ? 0.3 : 0.36);

    const animateScrollTo = useCallback((top, duration = 750) => {
        const c = scrollRef.current;
        if (!c) return;
        cancelAnimationFrame(animRef.current);
        const start = c.scrollTop;
        const delta = top - start;
        if (Math.abs(delta) < 1) return;
        const t0 = performance.now();
        const step = (now) => {
            const k = Math.min(1, (now - t0) / duration);
            const eased = 1 - Math.pow(1 - k, 4);
            c.scrollTop = start + delta * eased;
            if (k < 1) animRef.current = requestAnimationFrame(step);
        };
        animRef.current = requestAnimationFrame(step);
    }, []);

    const scrollToActive = useCallback(
        (idx, duration) => {
            const el = lineRefs.current[idx];
            if (!el) return;
            animateScrollTo(Math.max(0, el.offsetTop - anchor), duration);
        },
        [anchor, animateScrollTo]
    );

    useEffect(() => {
        activeRef.current = -1;
        setActiveIndex(0);
        lineRefs.current = [];
        wordEls.current = {};
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [lyrics]);

    useEffect(() => {
        if (!isTimed || lineData.length === 0) return;
        let raf;
        const tick = () => {
            const t = audioRef?.current ? audioRef.current.currentTime || 0 : timeRef.current;
            const probe = t + LINE_LEAD;

            let lo = 0, hi = lineData.length - 1, idx = 0;
            while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                if (lineData[mid].time <= probe) { idx = mid; lo = mid + 1; }
                else hi = mid - 1;
            }
            if (idx !== activeRef.current) {

                const prevEls = wordEls.current[activeRef.current];
                const prevWords = lineData[activeRef.current]?.words;
                if (prevEls && prevWords) {
                    for (let k = 0; k < prevWords.length; k++) {
                        const el = prevEls[k];
                        if (el) { el.style.color = "#ffffff"; el.__sung = true; }
                    }
                }
                activeRef.current = idx;

                const newEls = wordEls.current[idx];
                const newWords = lineData[idx]?.words;
                if (newEls && newWords) {
                    for (let k = 0; k < newWords.length; k++) {
                        const el = newEls[k];
                        if (!el) continue;
                        const sung = t >= newWords[k].start;
                        el.__sung = sung;
                        el.style.transition = "none";
                        el.style.color = sung ? "#ffffff" : "rgba(255,255,255,0.35)";
                        el.style.textShadow = sung ? "0 0 14px rgba(255,255,255,0.4)" : "none";
                    }
                    requestAnimationFrame(() => {
                        if (!wordEls.current[idx]) return;
                        for (let k = 0; k < newWords.length; k++) {
                            const el = wordEls.current[idx][k];
                            if (el) el.style.transition = "";
                        }
                    });
                }

                setActiveIndex(idx);
            }

            const els = wordEls.current[idx];
            const words = lineData[idx]?.words;
            if (els && words) {
                for (let k = 0; k < words.length; k++) {
                    const el = els[k];
                    if (!el) continue;
                    const sung = t >= words[k].start;
                    if (el.__sung === sung) continue;
                    el.__sung = sung;
                    el.style.color = sung ? "#ffffff" : "rgba(255,255,255,0.35)";
                    el.style.textShadow = sung ? "0 0 14px rgba(255,255,255,0.4)" : "none";
                }
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [isTimed, lineData, audioRef]);

    useEffect(() => {
        if (!isTimed || freeScrollRef.current) return;
        scrollToActive(activeIndex, activeIndex === 0 ? 400 : 750);
    }, [activeIndex, isTimed, scrollToActive, boxH]);

    const handleUserScroll = () => {
        cancelAnimationFrame(animRef.current);
        freeScrollRef.current = true;
        setFreeScroll(true);
        clearTimeout(userTimer.current);
        userTimer.current = setTimeout(() => {
            freeScrollRef.current = false;
            setFreeScroll(false);
            scrollToActive(activeRef.current < 0 ? 0 : activeRef.current, 800);
        }, 3000);
    };
    useEffect(() => () => { clearTimeout(userTimer.current); cancelAnimationFrame(animRef.current); }, []);

    if (!lyrics || lyrics.length === 0) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.5 }}>
                <Typography sx={{ fontSize: "16px", fontWeight: 600, fontFamily: FONT }}>Текст песни недоступен</Typography>
            </Box>
        );
    }

    const fontSize = compact ? "1.15rem" : isMobileView ? "1.7rem" : "clamp(1.9rem, 3vw, 2.9rem)";
    const align = isMobileView ? "center" : "left";

    if (!isTimed) {
        return (
            <Box
                sx={{
                    width: "100%",
                    height: "100%",
                    overflowY: "auto",
                    px: isMobileView ? 2 : 3,
                    py: compact ? 1.5 : 4,
                    fontFamily: FONT,
                    textAlign: align,
                    "&::-webkit-scrollbar": { display: "none" },
                    WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 6%, #000 94%, transparent 100%)",
                    maskImage: "linear-gradient(to bottom, transparent 0, #000 6%, #000 94%, transparent 100%)",
                }}
            >
                {lyrics.map((line, idx) => (
                    <Typography
                        key={idx}
                        sx={{ fontSize: compact ? "0.95rem" : isMobileView ? "1.25rem" : "1.6rem", fontWeight: 700, lineHeight: 1.35, color: "rgba(255,255,255,0.85)", mb: compact ? 0.8 : 2.2, fontFamily: FONT }}
                    >
                        {typeof line === "string" ? line : line.text}
                    </Typography>
                ))}
            </Box>
        );
    }

    return (
        <Box
            ref={scrollRef}
            onWheel={handleUserScroll}
            onTouchMove={handleUserScroll}
            sx={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflowY: "auto",
                overflowX: "hidden",
                fontFamily: FONT,
                "&::-webkit-scrollbar": { display: "none" },
                scrollbarWidth: "none",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 9%, #000 82%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, transparent 0, #000 9%, #000 82%, transparent 100%)",
            }}
        >
            <Box sx={{ height: anchor }} />

            {lineData.map((line, i) => {
                const dist = Math.abs(i - activeIndex);
                const isActive = i === activeIndex;
                const blur = freeScroll || isActive ? 0 : Math.min(1 + dist * 0.9, 5);
                const opacity = isActive ? 1 : freeScroll ? 0.55 : Math.max(0.5 - (dist - 1) * 0.08, 0.2);

                return (
                    <Box
                        key={`${line.time}-${i}`}
                        ref={(el) => { lineRefs.current[i] = el; }}
                        onClick={() => onSeek && onSeek(line.time)}
                        sx={{
                            boxSizing: "border-box",
                            width: "100%",
                            px: isMobileView ? 1.5 : 2,
                            py: compact ? "4px" : "10px",
                            my: compact ? "1px" : "2px",
                            borderRadius: "14px",
                            cursor: "pointer",
                            textAlign: align,
                            transformOrigin: isMobileView ? "center center" : "left center",
                            transform: isActive ? "scale(1)" : "scale(0.93)",
                            opacity,
                            filter: blur ? `blur(${blur}px)` : "none",
                            transition: "background-color 0.15s ease",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.08)", filter: "none", opacity: isActive ? 1 : 0.8 },
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: isMobileView ? "center" : "flex-start",
                                fontSize,
                                fontWeight: 800,
                                lineHeight: 1.22,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {line.words.length === 0 ? (
                                <Box component="span" sx={{ color: "rgba(255,255,255,0.5)" }}>♪</Box>
                            ) : (
                                line.words.map((w, k) => (
                                    <Box
                                        key={k}
                                        component="span"
                                        ref={(el) => {
                                            if (!wordEls.current[i]) wordEls.current[i] = [];
                                            wordEls.current[i][k] = el;
                                        }}
                                        sx={{
                                            display: "inline-block",
                                            whiteSpace: "pre",
                                            mr: "0.27em",
                                            color: isActive
                                                ? (currentTime >= w.start ? "#ffffff" : "rgba(255,255,255,0.35)")
                                                : "#ffffff",
                                            transition: "color 0.35s ease, text-shadow 0.35s ease",
                                        }}
                                    >
                                        {w.word}
                                    </Box>
                                ))
                            )}
                        </Box>
                    </Box>
                );
            })}

            <Box sx={{ height: boxH * 0.7 }} />
        </Box>
    );
};

export default function ApplePlayer() {
    const {
        currentTrack: track,
        isPlaying,
        togglePlay: onTogglePlay,
        nextTrack: onNext,
        prevTrack: onPrev,
        audioRef,
        seek: onSeek,
        isPlayerOpen: isOpen,
        toggleFullPlayer,
        favoriteIds,
        toggleFavorite,
    } = useMusic();
    const settings = useSettings();

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [dragValue, setDragValue] = useState(null);
    const [lyricsOverride, setLyricsOverride] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        let frameId;
        let last = -1;
        let lastDur = -1;
        const update = () => {
            const a = audioRef?.current;
            if (a) {
                const t = a.currentTime || 0;
                if (Math.abs(t - last) >= 0.2) {
                    last = t;
                    setCurrentTime(t);
                }
                const d = a.duration || 0;
                if (d !== lastDur) {
                    lastDur = d;
                    setDuration(d);
                }
            }
            frameId = requestAnimationFrame(update);
        };
        frameId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(frameId);
    }, [audioRef, isOpen]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const [swipeY, setSwipeY] = useState(0);
    const swipeYRef = useRef(0);
    const touchStartY = useRef(0);
    const swipingRef = useRef(false);

    const handleTouchStart = useCallback((e) => {
        const target = e.target;
        if (target?.closest?.(".MuiSlider-root") || target?.closest?.(".mobile-lyrics-zone")) return;
        touchStartY.current = e.touches[0].clientY;
        swipingRef.current = true;
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!swipingRef.current) return;
        const diff = e.touches[0].clientY - touchStartY.current;
        if (diff > 0) {
            swipeYRef.current = diff;
            setSwipeY(diff);
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (!swipingRef.current) return;
        swipingRef.current = false;
        if (swipeYRef.current > 140) {
            toggleFullPlayer(false);
            setTimeout(() => {
                swipeYRef.current = 0;
                setSwipeY(0);
            }, 350);
        } else {
            swipeYRef.current = 0;
            setSwipeY(0);
        }
    }, [toggleFullPlayer]);

    const [lyricsMod, setLyricsMod] = useState(null);

    useEffect(() => {
        if (!isOpen || lyricsMod) return;
        let alive = true;
        loadLyrics().then((m) => { if (alive && m) setLyricsMod(m); });
        return () => { alive = false; };
    }, [isOpen, lyricsMod]);

    const resolvedLyrics = useMemo(() => {
        if (!track) return [];
        const title = track.title?.toLowerCase() || "";
        const lx = lyricsMod;

        if (lx) {
            if (title.includes("chicago")) return lx.chicago;
            if (title.includes("bohemian rhapsody")) return lx.bohemianRhapsodyLyricsRu;
            if (title.includes("great pretender")) return lx.greatPretenderLyricsRu;
            if (title.includes("no tomorrow")) return lx.loveMeLikeNoTomorrowLyrics;
            if (title.includes("and i love her")) return lx.andILoveHerLyricsRu;
            if (title.includes("strawberry")) return lx.strawberryFieldsLyrics;
            if (title.includes("standing")) return lx.stillStandingLyrics;
            if (title.includes("dirty diana")) return lx.dianaOriginal;
            if (title.includes("flashing lights")) return lx.flashingLights;
            if (title.includes("let it happen")) return lx.letItHappen;
        }

        return track.lyrics || [];
    }, [track, lyricsMod]);

    if (!isOpen || !track) return null;

    const sliderValue = dragValue !== null ? dragValue : currentTime;
    const hasLyrics = resolvedLyrics && resolvedLyrics.length > 0;
    const isFav = favoriteIds.has(track.id);
    const showLyrics = lyricsOverride === null ? settings.subtitles !== false : lyricsOverride;

    const handleLike = (e) => {
        e.stopPropagation();
        toggleFavorite(track);
    };

    const showLyricsCol = showLyrics && hasLyrics;
    const lyricsOnly = isMobile && showLyricsCol;

    const coverBlock = (
        <Box
            component="img"
            src={track.cover || DEFAULT_COVER}
            alt={track.title}
            sx={{
                width: "min(100%, 46vh)",
                aspectRatio: "1 / 1",
                borderRadius: "14px",
                boxShadow: "0 30px 70px rgba(0,0,0,0.55)",
                objectFit: "cover",
                alignSelf: "center",
            }}
        />
    );

    const titleBlock = (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
            {lyricsOnly && (
                <Box
                    component="img"
                    src={track.cover || DEFAULT_COVER}
                    alt=""
                    sx={{ width: 52, height: 52, borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                />
            )}
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap sx={{ fontSize: lyricsOnly ? "16px" : "20px", fontWeight: 700, lineHeight: 1.2, fontFamily: FONT }}>
                    {track.title}
                </Typography>
                <Typography noWrap sx={{ fontSize: lyricsOnly ? "13px" : "15px", color: "rgba(255,255,255,0.6)", mt: 0.3, fontFamily: FONT }}>
                    {track.author}
                </Typography>
            </Box>
            <Typography
                noWrap
                title={track.album || "Single"}
                sx={{
                    flexShrink: 0,
                    maxWidth: lyricsOnly ? "28%" : "38%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: lyricsOnly ? "12px" : "14px",
                    color: "rgba(255,255,255,0.6)",
                    textAlign: "right",
                    fontFamily: FONT,
                }}
            >
                {track.album || "Single"}
            </Typography>
        </Box>
    );

    const progressBlock = (
        <Box sx={{ width: "100%" }}>
            <Slider
                size="small"
                value={sliderValue}
                min={0}
                max={duration || 1}
                onChange={(_, val) => setDragValue(val)}
                onChangeCommitted={(_, val) => {
                    onSeek && onSeek(val);
                    setDragValue(null);
                }}
                sx={{
                    color: "rgba(255,255,255,0.9)",
                    height: 4,
                    p: "10px 0",
                    "& .MuiSlider-rail": { opacity: 0.25 },
                    "& .MuiSlider-thumb": { width: 0, height: 0, transition: "0.15s" },
                    "&:hover .MuiSlider-thumb, & .MuiSlider-thumb.Mui-active": { width: 12, height: 12, boxShadow: "none" },
                }}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: -0.5 }}>
                <Typography sx={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", fontVariantNumeric: "tabular-nums" }}>
                    {formatTime(sliderValue)}
                </Typography>
                <Typography sx={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", fontVariantNumeric: "tabular-nums" }}>
                    -{formatTime(duration - sliderValue)}
                </Typography>
            </Box>
        </Box>
    );

    const controlsBlock = (
        <Box sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <IconButton onClick={onPrev} sx={{ color: "#fff" }}>
                <SkipPreviousIcon sx={{ fontSize: 38 }} />
            </IconButton>
            <IconButton onClick={onTogglePlay} sx={{ color: "#fff" }}>
                {isPlaying ? <PauseIcon sx={{ fontSize: 56 }} /> : <PlayArrowIcon sx={{ fontSize: 56 }} />}
            </IconButton>
            <IconButton onClick={onNext} sx={{ color: "#fff" }}>
                <SkipNextIcon sx={{ fontSize: 38 }} />
            </IconButton>
        </Box>
    );

    const lyricsBlock = (
        <Box sx={{ width: "100%", height: "100%", minHeight: 0 }}>
            <LyricsView
                lyrics={resolvedLyrics}
                currentTime={currentTime}
                audioRef={audioRef}
                onSeek={onSeek}
                isMobileView={isMobile}
            />
        </Box>
    );

    return (
        <Slide direction="up" in={isOpen} timeout={isMobile ? 400 : 300}>
            <Box
                sx={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 9999,
                    width: "100%",
                    height: isMobile ? "100dvh" : "auto",
                    bgcolor: isMobile ? "#000" : "transparent",
                    color: "#ffffff",
                    overflow: "hidden",
                    userSelect: isMobile ? "none" : "auto",
                    display: isMobile ? "block" : "flex",
                    flexDirection: "column",
                    p: isMobile ? 0 : 4,
                    boxSizing: "border-box",
                    fontFamily: FONT,
                }}
            >
                {isMobile ? (
                    <Box
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        sx={{
                            position: "absolute",
                            inset: 0,
                            transform: `translateY(${swipeY}px)`,
                            transition: swipeY === 0 ? "transform 0.3s cubic-bezier(0.33, 1, 0.68, 1)" : "none",
                        }}
                    >
                        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: "55%", zIndex: 1 }}>
                            <IconButton
                                className="perf-glass"
                                onClick={() => toggleFullPlayer(false)}
                                sx={{
                                    position: "absolute",
                                    top: "calc(env(safe-area-inset-top) + 12px)",
                                    left: 16,
                                    zIndex: 10,
                                    color: "#fff",
                                    bgcolor: "rgba(0,0,0,0.4)",
                                    backdropFilter: "blur(20px)",
                                    "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
                                }}
                            >
                                <KeyboardArrowDownIcon sx={{ fontSize: 30 }} />
                            </IconButton>

                            {hasLyrics && (
                                <IconButton
                                    className="perf-glass"
                                    onClick={() => setLyricsOverride(!showLyrics)}
                                    sx={{
                                        position: "absolute",
                                        top: "calc(env(safe-area-inset-top) + 12px)",
                                        right: 16,
                                        zIndex: 10,
                                        color: showLyrics ? "#fff" : "rgba(255,255,255,0.5)",
                                        bgcolor: "rgba(0,0,0,0.4)",
                                        backdropFilter: "blur(20px)",
                                    }}
                                >
                                    {showLyrics ? <SubtitlesIcon /> : <SubtitlesOutlinedIcon />}
                                </IconButton>
                            )}

                            <Box
                                component="img"
                                src={track.cover || DEFAULT_COVER}
                                alt=""
                                sx={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center" }}
                            />

                            {hasLyrics && showLyrics && (
                                <Box
                                    className="mobile-lyrics-zone perf-glass"
                                    sx={{
                                        position: "absolute",
                                        bottom: 12,
                                        left: 12,
                                        right: 12,
                                        height: "150px",
                                        zIndex: 5,
                                        borderRadius: "20px",
                                        bgcolor: "rgba(0,0,0,0.38)",
                                        backdropFilter: "blur(16px)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        overflow: "hidden",
                                    }}
                                >
                                    <LyricsView lyrics={resolvedLyrics} currentTime={currentTime} audioRef={audioRef} onSeek={onSeek} isMobileView compact />
                                </Box>
                            )}
                        </Box>

                        <Box
                            sx={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: "48%",
                                background: "linear-gradient(180deg, #1f1f1f 0%, #0a0a0a 100%)",
                                borderTopLeftRadius: "32px",
                                borderTopRightRadius: "32px",
                                zIndex: 2,
                                px: 3,
                                pt: 3,
                                pb: "calc(env(safe-area-inset-bottom) + 16px)",
                                display: "flex",
                                flexDirection: "column",
                                boxShadow: "0px -12px 40px rgba(0,0,0,0.25)",
                            }}
                        >
                            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
                                <Box sx={{ minWidth: 0, flex: 1, pr: 2 }}>
                                    <Typography noWrap sx={{ color: "#fff", fontSize: "18px", fontWeight: 500, mt: 0.5 }}>
                                        {track.author}
                                    </Typography>
                                </Box>

                                <IconButton
                                    onClick={handleLike}
                                    sx={{
                                        bgcolor: "rgba(255,255,255,0.12)",
                                        color: isFav ? "#ff2d55" : "#fff",
                                        width: 46,
                                        height: 46,
                                        transition: "transform 0.2s",
                                        "&:active": { transform: "scale(0.9)" },
                                    }}
                                >
                                    {isFav ? <FavoriteIcon sx={{ color: "#ff2d55" }} /> : <FavoriteBorderIcon sx={{ color: "#fff" }} />}
                                </IconButton>
                            </Box>

                            <Box sx={{ mt: "auto" }}>
                                <Typography noWrap sx={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 400, mb: 0.5 }}>
                                    {track.album || "Single"}
                                </Typography>
                                <Typography noWrap sx={{ fontWeight: 800, color: "#fff", fontSize: "28px", lineHeight: 1.1, letterSpacing: "-0.5px", mb: 2 }}>
                                    {track.title}
                                </Typography>

                                <Box sx={{ width: "100%", mt: 1, mb: 1.5 }}>
                                    <Slider
                                        size="small"
                                        value={sliderValue}
                                        min={0}
                                        max={duration || 1}
                                        onChange={(_, val) => setDragValue(val)}
                                        onChangeCommitted={(_, val) => { onSeek && onSeek(val); setDragValue(null); }}
                                        sx={{
                                            color: "#fff",
                                            height: 4,
                                            padding: "10px 0",
                                            "& .MuiSlider-thumb": { width: 12, height: 12, backgroundColor: "#fff", "&::before": { boxShadow: "none" }, "&:hover, &.Mui-active": { width: 14, height: 14 } },
                                            "& .MuiSlider-track": { border: "none", opacity: 0.9 },
                                            "& .MuiSlider-rail": { opacity: 0.2, backgroundColor: "#fff" },
                                        }}
                                    />
                                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: -0.5 }}>
                                        <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                                            {formatTime(sliderValue)}
                                        </Typography>
                                        <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                                            {formatTime(duration)}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mt: "auto" }}>
                                    <IconButton onClick={onPrev} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.12)", width: 44, height: 44 }}>
                                        <SkipPreviousIcon sx={{ fontSize: 26 }} />
                                    </IconButton>

                                    <IconButton onClick={() => onSeek && onSeek(Math.max(currentTime - 10, 0))} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.12)", width: 44, height: 44 }}>
                                        <Replay10Icon sx={{ fontSize: 22 }} />
                                    </IconButton>

                                    <Box
                                        onClick={onTogglePlay}
                                        sx={{
                                            flex: 1,
                                            height: 52,
                                            bgcolor: "#fff",
                                            borderRadius: "26px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
                                            transition: "all 0.2s ease-in-out",
                                            "&:active": { opacity: 0.8, transform: "scale(0.97)" },
                                        }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#111" }}>
                                            {isPlaying ? <PauseIcon sx={{ fontSize: 22 }} /> : <PlayArrowIcon sx={{ fontSize: 22 }} />}
                                            <Typography sx={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.2px" }}>
                                                {isPlaying ? "Пауза" : "Слушать"}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <IconButton onClick={() => onSeek && onSeek(Math.min(currentTime + 10, duration))} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.12)", width: 44, height: 44 }}>
                                        <Forward10Icon sx={{ fontSize: 22 }} />
                                    </IconButton>

                                    <IconButton onClick={onNext} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.12)", width: 44, height: 44 }}>
                                        <SkipNextIcon sx={{ fontSize: 26 }} />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <>
                <Box
                    className="perf-blur-player"
                    sx={{
                        position: "absolute",
                        inset: -60,
                        zIndex: -2,
                        backgroundImage: `url(${track?.cover || DEFAULT_COVER})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        filter: "blur(60px) brightness(0.5) saturate(1.7)",
                        transform: "scale(1.15)",
                        transition: "background-image 0.6s ease",
                    }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        zIndex: -1,
                        background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%)",
                    }}
                />

                <Box sx={{ display: "flex", justifyContent: "center", width: "100%", zIndex: 10, flexShrink: 0, pb: 1 }}>
                    <Box
                        onClick={() => toggleFullPlayer(false)}
                        sx={{
                            width: "42px",
                            height: "5px",
                            backgroundColor: "rgba(255, 255, 255, 0.4)",
                            borderRadius: "10px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.8)", width: "80px" },
                        }}
                    />
                </Box>

                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            display: "grid",
                            gridTemplateColumns: showLyricsCol ? "minmax(340px, 440px) minmax(0, 1fr)" : "minmax(340px, 440px)",
                            columnGap: "clamp(32px, 6vw, 96px)",
                            justifyContent: "center",
                            width: "100%",
                            maxWidth: "1500px",
                            mx: "auto",
                            alignItems: "center",
                            zIndex: 2,
                        }}
                    >
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, width: "100%" }}>
                            {coverBlock}
                            {titleBlock}
                            {progressBlock}
                            {controlsBlock}
                        </Box>

                        {showLyricsCol && <Box sx={{ height: "100%", minHeight: 0 }}>{lyricsBlock}</Box>}
                    </Box>

                <IconButton
                    className="perf-glass"
                    onClick={() => setLyricsOverride(!showLyrics)}
                    disabled={!hasLyrics}
                    sx={{
                        position: "absolute",
                        right: 28,
                        bottom: 28,
                        zIndex: 11,
                        color: "#fff",
                        bgcolor: showLyricsCol ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)",
                        backdropFilter: "blur(12px)",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.38)" },
                    }}
                >
                    {showLyricsCol ? <SubtitlesIcon /> : <SubtitlesOutlinedIcon />}
                </IconButton>
                    </>
                )}
            </Box>
        </Slide>
    );
}
