"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import { useRouter, useParams } from "next/navigation";
import { api } from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";
import { useMusic } from "../../context/MusicContext";
import {
    PlayArrowRoundedIcon,
    PauseRoundedIcon,
    DeleteRoundedIcon,
    AddRoundedIcon,
    FavoriteRoundedIcon,
    FavoriteBorderRoundedIcon,
    ArrowBackRoundedIcon
} from "../../components/icons";

// Встроенные SVG-иконки
const LockSvg = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
);

const PublicSvg = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
);

const GridViewSvg = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
    </svg>
);

const ListViewSvg = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6s-.67-1.5-1.5-1.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
    </svg>
);

// Хелпер формирования ссылок на изображения
const resolveImageUrl = (path) => {
    if (!path) return null;
    let clean = String(path).trim();
    if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("//")) {
        return clean;
    }
    clean = clean.replace(/^\/+/, "");
    return clean.startsWith("storage/")
        ? `https://music.atomglide.com/${clean}`
        : `https://music.atomglide.com/storage/${clean}`;
};

// Хелпер распаковки авторов
const formatAuthors = (raw) => {
    if (!raw) return "Неизвестный исполнитель";
    try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) return parsed.join(", ");
        return String(parsed);
    } catch {
        return String(raw);
    }
};

// Форматирование даты под стиль на фото (например: "22 01 22")
const formatDate = (dateString) => {
    if (!dateString) return "22 01 22";
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return "22 01 22";
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = String(d.getFullYear()).slice(-2);
        return `${day} ${month} ${year}`;
    } catch {
        return "22 01 22";
    }
};

export default function PlaylistDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { isAuthed, user } = useAuth();
    const {
        playTrackNow,
        currentTrack,
        isPlaying,
        favoriteIds = new Set(),
        toggleFavorite
    } = useMusic();

    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Режим отображения: 'grid' (плитки/колонки) или 'list' (список)
    const [viewMode, setViewMode] = useState("grid");

    useEffect(() => {
        const fetchPlaylist = async () => {
            try {
                const res = await api.get(`/music/playlists/${params.id}`);
                const raw = res.data.playlist || {};

                const rawCover = raw.cover ?? raw.COVER;
                const rawBg = raw.background ?? raw.BACKGROUND;
                const rawTracks = raw.tracks || [];

                const normalizedTracks = rawTracks.map((t, idx) => {
                    const trackId = Number(t.id ?? t.ID ?? idx);
                    const trackCover = t.cover_main ?? t.COVER_MAIN ?? t.cover ?? t.COVER;
                    return {
                        id: trackId,
                        title: t.title ?? t.TITLE ?? "Без названия",
                        author: formatAuthors(t.authors ?? t.AUTHORS ?? t.author ?? t.AUTHOR),
                        album: t.album ?? t.ALBUM ?? "",
                        cover: resolveImageUrl(trackCover),
                        filePath: t.file_path ?? t.FILE_PATH ?? "",
                        position: t.position ?? t.POSITION ?? idx + 1,
                        raw: t
                    };
                });

                const fallbackCover = normalizedTracks.length > 0 ? normalizedTracks[0].cover : null;

                setPlaylist({
                    id: Number(raw.id ?? raw.ID ?? params.id),
                    userId: Number(raw.user_id ?? raw.USER_ID ?? 0),
                    title: raw.title ?? raw.TITLE ?? "Мой плейлист",
                    description: raw.description ?? raw.DESCRIPTION ?? "Это описание данного плейлиста оно будет над заголовком и будет так не особо выделяться",
                    cover: resolveImageUrl(rawCover) || fallbackCover,
                    background: resolveImageUrl(rawBg),
                    isPrivate: Boolean(Number(raw.is_private ?? raw.IS_PRIVATE ?? 0)),
                    createdAt: raw.created_at ?? raw.CREATED_AT,
                    tracks: normalizedTracks
                });
            } catch (err) {
                console.error("Ошибка загрузки плейлиста:", err);
                setError(err.response?.data?.error || "Плейлист не найден или доступ ограничен");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchPlaylist();
        }
    }, [params.id]);

    const handlePlay = (track) => {
        playTrackNow(track);
    };

    const handleRemoveTrack = async (trackId) => {
        if (!confirm("Удалить трек из плейлиста?")) return;
        try {
            await api.delete(`/music/playlists/${params.id}/tracks/${trackId}`);
            setPlaylist((prev) => ({
                ...prev,
                tracks: prev.tracks.filter((t) => t.id !== trackId)
            }));
        } catch (err) {
            alert(err.response?.data?.error || "Ошибка при удалении трека");
        }
    };

    const isCurrent = (track) => currentTrack && (currentTrack.id === track.id || currentTrack.ID === track.id);

    if (loading) {
        return (
            <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "#fff" }}>
                <Typography color="text.secondary">Загрузка плейлиста...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 2, px: 3, textAlign: "center", color: "#fff" }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{error}</Typography>
                <Button variant="contained" onClick={() => router.back()} sx={{ mt: 1, bgcolor: "#fff", color: "#000" }}>
                    Назад
                </Button>
            </Box>
        );
    }

    if (!playlist) return null;

    const isOwner = user && (user.id === playlist.userId || user.ID === playlist.userId);

    return (
        <Box sx={{ position: "relative", minHeight: "100vh", width: "100%", bgcolor: "#000", color: "#fff", overflowX: "hidden" }}>
            {/* ФОН ПЛЕЙЛИСТА (ЕСЛИ ЕСТЬ) */}
            {playlist.background && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: { xs: 340, md: 460 },
                        backgroundImage: `url(${playlist.background})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        filter: "blur(32px) brightness(0.3)",
                        transform: "scale(1.1)",
                        zIndex: 0,
                        pointerEvents: "none",
                        "&::after": {
                            content: '""',
                            position: "absolute",
                            inset: 0,
                            background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, #000 100%)"
                        }
                    }}
                />
            )}
            <Box sx={{ position: "relative", zIndex: 1, px: { xs: 2.5, sm: 4, md: 6 }, py: { xs: 3, md: 5 }, maxWidth: 1080, mx: "auto", width: "100%" }}>

                <Box sx={{ mb: { xs: 4, md: 6 }, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 3, flexDirection: { xs: "column-reverse", sm: "row" } }}>
                    
                    <Box sx={{ mb: { xs: 2, md: 0 }, flexShrink: 0 }}>
                        <Button
                            onClick={() => router.push('/')}
                            startIcon={<ArrowBackRoundedIcon />}
                            sx={{
                                color: '#a0a0a0', textTransform: 'none',
                                fontSize: '13px', fontWeight: 500,
                                '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.04)' },
                            }}
                        >
                            На главную
                        </Button>
                    </Box>

                    {/* Левая часть: Описание -> Заголовок -> Метаинформация & Кнопки */}
                    <Box sx={{ flex: 1, minWidth: 0, pt: { xs: 0, sm: 1 } }}>

                        {/* Описание над заголовком (тусклый мелкий текст как на макете) */}
                        <Typography
                            variant="body2"
                            sx={{
                                color: "rgba(255,255,255,0.75)",
                                fontSize: { xs: "0.85rem", sm: "0.95rem" },
                                lineHeight: 1.4,
                                maxWidth: 380,
                                mb: { xs: 3, sm: 5 }
                            }}
                        >
                            {playlist.description || "Это описание данного плейлиста оно будет над заголовком и будет так не особо выделяться"}
                        </Typography>

                        {/* Крупный заголовок */}
                        <Typography
                            variant="h1"
                            sx={{
                                fontWeight: 600,
                                fontSize: { xs: "2.2rem", sm: "3.2rem", md: "3.8rem" },
                                lineHeight: 1.1,
                                letterSpacing: "-0.02em",
                                mb: 1.5,
                                wordBreak: "break-word"
                            }}
                        >
                            {playlist.title}
                        </Typography>

                        {/* Метаинформация: Треков N Дата создания YY MM DD */}
                        <Typography
                            variant="body2"
                            sx={{
                                color: "rgba(255,255,255,0.85)",
                                fontSize: { xs: "0.9rem", sm: "1rem" },
                                fontWeight: 400,
                                mb: 3
                            }}
                        >
                            Треков {playlist.tracks.length} &nbsp; Поддержка Digital Remastered IV
                        </Typography>

                        {/* Действия (Воспроизвести / Редактировать) */}
                        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
                            <Button
                                variant="contained"
                                size="medium"
                                onClick={() => {
                                    if (playlist.tracks.length) playTrackNow(playlist.tracks[0]);
                                }}
                                disabled={!playlist.tracks.length}
                                startIcon={<PlayArrowRoundedIcon />}
                                sx={{
                                    bgcolor: "#fff",
                                    color: "#000",
                                    fontWeight: 700,
                                    borderRadius: "24px",
                                    px: 3,
                                    py: 1,
                                    textTransform: "none",
                                    "&:hover": { bgcolor: "rgba(255,255,255,0.85)" }
                                }}
                            >
                                Воспроизвести всё
                            </Button>

                            {isAuthed && isOwner && (
                                <Button
                                    variant="outlined"
                                    size="medium"
                                    onClick={() => router.push(`/playlist/${playlist.id}/edit`)}
                                    startIcon={<AddRoundedIcon />}
                                    sx={{
                                        borderColor: "rgba(255,255,255,0.3)",
                                        color: "#fff",
                                        borderRadius: "24px",
                                        px: 2.5,
                                        py: 1,
                                        textTransform: "none",
                                        "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.08)" }
                                    }}
                                >
                                    Редактировать
                                </Button>
                            )}

                            <Chip
                                label={playlist.isPrivate ? "Приватный" : "Публичный"}
                                size="small"
                                sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 11, height: 26, px: 0.5 }}
                            />
                        </Box>
                    </Box>

                    {/* Правая часть: Квадратная обложка как на макете */}
                    <Box
                        sx={{
                            width: { xs: "100%", sm: 220, md: 260 },
                            height: { xs: "auto", sm: 220, md: 260 },
                            aspectRatio: "1/1",
                            borderRadius: "12px",
                            overflow: "hidden",
                            flexShrink: 0,
                            bgcolor: "#333",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.8)"
                        }}
                    >
                        {playlist.cover ? (
                            <Box
                                component="img"
                                src={playlist.cover}
                                alt={playlist.title}
                                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        ) : (
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", bgcolor: "#c4c4c4" }} />
                        )}
                    </Box>
                </Box>

                {/* ЗАГОЛОВОК СЕКЦИИ И ПЕРЕКЛЮЧАТЕЛЬ ВИДА (СЕТКА / СПИСОК) */}
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 500,
                            fontSize: { xs: "1.5rem", sm: "2rem" },
                            letterSpacing: "-0.01em"
                        }}
                    >
                        Все треки
                    </Typography>

                    {/* Переключатель вида */}
                    <Box sx={{ display: "flex", alignItems: "center", bgcolor: "rgba(255,255,255,0.08)", p: "3px", borderRadius: "10px", gap: 0.5 }}>
                        <Tooltip title="Сетка (по 2 на телефоне, по 4 на ПК)">
                            <IconButton
                                size="small"
                                onClick={() => setViewMode("grid")}
                                sx={{
                                    color: viewMode === "grid" ? "#fff" : "rgba(255,255,255,0.4)",
                                    bgcolor: viewMode === "grid" ? "rgba(255,255,255,0.18)" : "transparent",
                                    borderRadius: "8px",
                                    p: 1,
                                    "&:hover": { bgcolor: "rgba(255,255,255,0.25)" }
                                }}
                            >
                                <GridViewSvg />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Список">
                            <IconButton
                                size="small"
                                onClick={() => setViewMode("list")}
                                sx={{
                                    color: viewMode === "list" ? "#fff" : "rgba(255,255,255,0.4)",
                                    bgcolor: viewMode === "list" ? "rgba(255,255,255,0.18)" : "transparent",
                                    borderRadius: "8px",
                                    p: 1,
                                    "&:hover": { bgcolor: "rgba(255,255,255,0.25)" }
                                }}
                            >
                                <ListViewSvg />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* СПИСОК ТРЕКОВ / СЕТКА ПЛИТОК */}
                {playlist.tracks.length === 0 ? (
                    <Box sx={{ p: 5, textAlign: "center", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.2)", bgcolor: "rgba(255,255,255,0.02)" }}>
                        <Typography color="text.secondary" sx={{ mb: 1, fontSize: 16 }}>
                            В этом плейлисте пока нет треков
                        </Typography>
                    </Box>
                ) : viewMode === "grid" ? (
                    /* ВИД 1: СЕТКА / КОЛОНКИ (По 2 на телефоне, по 4 на ПК как на макете) */
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" },
                            gap: { xs: 2, sm: 3, md: 4 }
                        }}
                    >
                        {playlist.tracks.map((track) => {
                            const active = isCurrent(track);
                            return (
                                <Box
                                    key={track.id}
                                    onClick={() => handlePlay(track)}
                                    sx={{
                                        cursor: "pointer",
                                        group: "true",
                                        transition: "transform 0.2s ease",
                                        "&:hover": { transform: "translateY(-4px)" }
                                    }}
                                >
                                    {/* Плитка-обложка */}
                                    <Box
                                        sx={{
                                            position: "relative",
                                            width: "100%",
                                            aspectRatio: "1/1",
                                            bgcolor: "#333",
                                            borderRadius: "8px",
                                            overflow: "hidden",
                                            mb: 1.2
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={track.cover || "/placeholder-cover.png"}
                                            alt={track.title}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23333'/%3E%3C/svg%3E";
                                            }}
                                            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />

                                        {/* Кнопка Play при наведении или проигрывании */}
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                inset: 0,
                                                bgcolor: active ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.3)",
                                                display: "flex",
                                                alignItems: "center",
                                                justify: "center",
                                                opacity: active ? 1 : 0,
                                                transition: "opacity 0.2s ease",
                                                "&:hover": { opacity: 1 }
                                            }}
                                        >
                                            <IconButton
                                                sx={{
                                                    bgcolor: "#fff",
                                                    color: "#000",
                                                    "&:hover": { bgcolor: "rgba(255,255,255,0.9)", transform: "scale(1.08)" }
                                                }}
                                            >
                                                {active && isPlaying ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {/* Название и подзаголовок в стиле заглушек из макета */}
                                    <Typography
                                        noWrap
                                        variant="body2"
                                        sx={{
                                            color: active ? "#ff4f7b" : "#fff",
                                            fontWeight: 600,
                                            fontSize: "0.95rem",
                                            mb: 0.3
                                        }}
                                    >
                                        {track.title}
                                    </Typography>

                                    <Typography
                                        noWrap
                                        variant="caption"
                                        sx={{
                                            color: "rgba(255,255,255,0.5)",
                                            fontSize: "0.8rem",
                                            display: "block"
                                        }}
                                    >
                                        {track.author}
                                    </Typography>

                                    {/* Действия для авториз. пользователей */}
                                    {isAuthed && (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }} onClick={(e) => e.stopPropagation()}>
                                            {toggleFavorite && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => toggleFavorite(track)}
                                                    sx={{
                                                        p: 0.5,
                                                        color: favoriteIds.has(track.id) ? "#ff4f7b" : "rgba(255,255,255,0.4)",
                                                        "&:hover": { color: "#ff4f7b" }
                                                    }}
                                                >
                                                    {favoriteIds.has(track.id) ? <FavoriteRoundedIcon fontSize="small" /> : <FavoriteBorderRoundedIcon fontSize="small" />}
                                                </IconButton>
                                            )}

                                            {isOwner && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRemoveTrack(track.id)}
                                                    sx={{ p: 0.5, color: "rgba(255,255,255,0.4)", "&:hover": { color: "#ff4444" } }}
                                                >
                                                    <DeleteRoundedIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                ) : (
                    /* ВИД 2: СПИСОК (Строками) */
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {playlist.tracks.map((track, index) => {
                            const active = isCurrent(track);
                            return (
                                <Box
                                    key={track.id}
                                    onClick={() => handlePlay(track)}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 2,
                                        p: 1.2,
                                        borderRadius: "8px",
                                        bgcolor: active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.02)",
                                        border: `1px solid ${active ? "rgba(255,255,255,0.3)" : "transparent"}`,
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                        "&:hover": { bgcolor: "rgba(255,255,255,0.08)" }
                                    }}
                                >
                                    {/* Номер */}
                                    <Box sx={{ width: 24, textAlign: "center", color: active ? "#fff" : "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: 13 }}>
                                        {active && isPlaying ? "▶" : index + 1}
                                    </Box>

                                    {/* Обложка трека */}
                                    <Box
                                        component="img"
                                        src={track.cover || "/placeholder-cover.png"}
                                        alt=""
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' fill='%23222'/%3E%3C/svg%3E";
                                        }}
                                        sx={{ width: 44, height: 44, borderRadius: "6px", objectFit: "cover", flexShrink: 0, bgcolor: "#222" }}
                                    />

                                    {/* Название и Исполнитель */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography noWrap variant="body2" sx={{ color: "#fff", fontWeight: active ? 700 : 500 }}>
                                            {track.title}
                                        </Typography>
                                        <Typography noWrap variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                                            {track.author}
                                        </Typography>
                                    </Box>

                                    {/* Действия */}
                                    {isAuthed && (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                                            {toggleFavorite && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => toggleFavorite(track)}
                                                    sx={{
                                                        color: favoriteIds.has(track.id) ? "#ff4f7b" : "rgba(255,255,255,0.4)",
                                                        "&:hover": { color: "#ff4f7b" }
                                                    }}
                                                >
                                                    {favoriteIds.has(track.id) ? <FavoriteRoundedIcon fontSize="small" /> : <FavoriteBorderRoundedIcon fontSize="small" />}
                                                </IconButton>
                                            )}

                                            {isOwner && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRemoveTrack(track.id)}
                                                    sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#ff4444" } }}
                                                >
                                                    <DeleteRoundedIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>
        </Box>
    );
}