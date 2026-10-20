"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import InputAdornment from "@mui/material/InputAdornment";
import Chip from "@mui/material/Chip";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { api } from "../../../lib/axios";
import { useAuth } from "../../../context/AuthContext";
import {
    CloseRoundedIcon,
    SaveRoundedIcon,
    DeleteRoundedIcon,
    SearchRoundedIcon
} from "../../../components/icons";

// Хелпер формирования правильного URL для картинок (с фолбеком на 5.png)
const resolveImageUrl = (path) => {
    if (!path) return "/5.png";
    let clean = String(path).trim();
    if (!clean) return "/5.png";
    if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("//")) {
        return clean;
    }
    clean = clean.replace(/^\/+/, "");
    return clean.startsWith("storage/")
        ? `https://music.atomglide.com/${clean}`
        : `https://music.atomglide.com/storage/${clean}`;
};

// Хелпер распаковки авторов (JSON-массив DB2 или строка)
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

// Общие стили для инпутов (гарантия видимости текста и лейблов)
const inputStyleProps = {
    InputLabelProps: {
        sx: {
            color: "rgba(255, 255, 255, 0.7)",
            fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
            "&.Mui-focused": { color: "#FFFFFF" }
        }
    },
    FormHelperTextProps: {
        sx: {
            color: "rgba(255, 255, 255, 0.45)",
            fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif'
        }
    },
    sx: {
        "& .MuiInputBase-input": {
            color: "#FFFFFF",
            fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: 15,
        },
        "& .MuiOutlinedInput-root": {
            bgcolor: "rgba(255, 255, 255, 0.04)",
            borderRadius: "12px",
            "& fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
            "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.4)" },
            "&.Mui-focused fieldset": { borderColor: "#FFFFFF" },
        },
    }
};

export default function EditPlaylistPage() {
    const router = useRouter();
    const params = useParams();
    const { isAuthed, loading: authLoading, requestLogin } = useAuth();
    const [mounted, setMounted] = useState(false);

    const [playlist, setPlaylist] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [cover, setCover] = useState("");
    const [background, setBackground] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);

    const [initialTrackIds, setInitialTrackIds] = useState([]);
    const [selectedTracks, setSelectedTracks] = useState([]);
    const [availableTracks, setAvailableTracks] = useState([]);
    const [filteredTracks, setFilteredTracks] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    // Безопасная проверка авторизации
    useEffect(() => {
        if (!mounted || authLoading) return;
        const hasToken = typeof window !== "undefined" && (
            Boolean(localStorage.getItem("accessToken")) ||
            Boolean(localStorage.getItem("refreshToken"))
        );
        if (!isAuthed && !hasToken && requestLogin) {
            requestLogin();
        }
    }, [isAuthed, authLoading, mounted, requestLogin]);

    useEffect(() => {
        if (!params.id) return;

        const fetchData = async () => {
            try {
                const [plRes, tracksRes] = await Promise.all([
                    api.get(`/music/playlists/${params.id}`),
                    api.get("/music/list")
                ]);

                const rawPl = plRes.data.playlist || {};
                const currentTracks = (rawPl.tracks || []).map((t, idx) => Number(t.id ?? t.ID ?? idx));

                setPlaylist(rawPl);
                setTitle(rawPl.title ?? rawPl.TITLE ?? "");
                setDescription(rawPl.description ?? rawPl.DESCRIPTION ?? "");
                setCover(rawPl.cover ?? rawPl.COVER ?? "");
                setBackground(rawPl.background ?? rawPl.BACKGROUND ?? "");
                setIsPrivate(Boolean(Number(rawPl.is_private ?? rawPl.IS_PRIVATE ?? 0)));

                setInitialTrackIds(currentTracks);
                setSelectedTracks(currentTracks);

                const rawList = tracksRes.data.tracks || [];
                const allTracks = rawList.map((t, idx) => {
                    const validId = Number(t.id ?? t.ID);
                    const rawCover = t.cover_main ?? t.COVER_MAIN ?? t.cover ?? t.COVER;
                    return {
                        id: !isNaN(validId) && validId > 0 ? validId : idx + 1,
                        title: t.title ?? t.TITLE ?? "Без названия",
                        author: formatAuthors(t.authors ?? t.AUTHORS ?? t.author ?? t.AUTHOR),
                        coverUrl: resolveImageUrl(rawCover),
                    };
                });

                setAvailableTracks(allTracks);
                setFilteredTracks(allTracks);
            } catch (err) {
                console.error("Ошибка загрузки:", err);
                setError(err.response?.data?.error || "Ошибка загрузки плейлиста");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.id]);

    useEffect(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            setFilteredTracks(availableTracks);
            return;
        }
        const filtered = availableTracks.filter(
            (t) => t.title.toLowerCase().includes(query) || t.author.toLowerCase().includes(query)
        );
        setFilteredTracks(filtered);
    }, [searchQuery, availableTracks]);

    const toggleTrack = (trackId) => {
        setSelectedTracks((prev) =>
            prev.includes(trackId)
                ? prev.filter((id) => id !== trackId)
                : [...prev, trackId]
        );
    };

    const handleSave = async () => {
        const cleanTitle = title.trim();
        if (!cleanTitle) {
            setError("Введите название плейлиста");
            return;
        }

        setSaving(true);
        setError("");
        setStatusText("Сохранение настроек...");

        try {
            await api.put(`/music/playlists/${params.id}`, {
                title: cleanTitle,
                description: description.trim(),
                cover: cover.trim(),
                background: background.trim(),
                isPrivate: isPrivate,
            });

            const toRemove = initialTrackIds.filter((id) => !selectedTracks.includes(id));
            const toAdd = selectedTracks.filter((id) => !initialTrackIds.includes(id));

            if (toRemove.length > 0 || toAdd.length > 0) {
                setStatusText("Синхронизация треков...");

                for (const trId of toRemove) {
                    await api.delete(`/music/playlists/${params.id}/tracks/${trId}`).catch(() => {});
                }

                for (const trId of toAdd) {
                    await api.post(`/music/playlists/${params.id}/tracks`, { trackId: Number(trId) }).catch(() => {});
                }
            }

            router.push(`/playlist/${params.id}`);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Ошибка сохранения плейлиста");
            setSaving(false);
            setStatusText("");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Удалить этот плейлист безвозвратно?")) return;
        try {
            await api.delete(`/music/playlists/${params.id}`);
            router.push("/");
        } catch (err) {
            alert(err.response?.data?.error || "Не удалось удалить плейлист");
        }
    };

    if (!mounted || authLoading || loading) {
        return (
            <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "#fff", bgcolor: "#0D0D0E" }}>
                <Typography color="text.secondary" sx={{ fontFamily: '"SF Pro Text", sans-serif' }}>
                    Загрузка данных...
                </Typography>
            </Box>
        );
    }

    if (!isAuthed) {
        return (
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, px: 3, textAlign: "center", color: "#fff", bgcolor: "#0D0D0E", minHeight: "100vh" }}>
                <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: '"SF Pro Display", sans-serif' }}>
                    Требуется вход
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => requestLogin && requestLogin()}
                    sx={{
                        bgcolor: "#FFFFFF",
                        color: "#000000",
                        borderRadius: "100px",
                        px: 4,
                        py: 1.2,
                        fontWeight: 700,
                        fontFamily: '"SF Pro Rounded", "SF Pro Text", sans-serif',
                        "&:hover": { bgcolor: "rgba(255,255,255,0.85)" }
                    }}
                >
                    Войти
                </Button>
            </Box>
        );
    }

    if (error && !playlist) {
        return (
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, px: 3, textAlign: "center", color: "#fff", bgcolor: "#0D0D0E", minHeight: "100vh" }}>
                <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: '"SF Pro Display", sans-serif' }}>{error}</Typography>
                <Button
                    variant="contained"
                    onClick={() => router.push("/")}
                    sx={{
                        mt: 2,
                        bgcolor: "#FFFFFF",
                        color: "#000000",
                        borderRadius: "100px",
                        px: 4,
                        py: 1.2,
                        fontWeight: 700,
                        fontFamily: '"SF Pro Rounded", "SF Pro Text", sans-serif'
                    }}
                >
                    На главную
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, overflowY: "auto", px: { xs: 2, sm: 4, md: 6 }, py: 4, maxWidth: 840, mx: "auto", width: "100%", bgcolor: "#0D0D0E", minHeight: "100vh", color: "#FFFFFF" }}>
            {/* Панель действий вверху */}
            <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link href={`/playlist/${params.id}`} style={{ textDecoration: "none" }}>
                    <Button
                        variant="outlined"
                        startIcon={<CloseRoundedIcon />}
                        sx={{
                            color: "#FFFFFF",
                            borderColor: "rgba(255,255,255,0.25)",
                            borderRadius: "100px",
                            px: 2.5,
                            py: 0.8,
                            textTransform: "none",
                            fontFamily: '"SF Pro Rounded", "SF Pro Text", sans-serif',
                            fontWeight: 600,
                            "&:hover": { borderColor: "#FFFFFF", bgcolor: "rgba(255,255,255,0.08)" }
                        }}
                    >
                        Отмена
                    </Button>
                </Link>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDelete}
                    startIcon={<DeleteRoundedIcon />}
                    disabled={saving}
                    sx={{
                        borderRadius: "100px",
                        px: 2.5,
                        py: 0.8,
                        textTransform: "none",
                        fontFamily: '"SF Pro Rounded", "SF Pro Text", sans-serif',
                        fontWeight: 600
                    }}
                >
                    Удалить плейлист
                </Button>
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, fontFamily: '"SF Pro Display", -apple-system, sans-serif' }}>
                Редактировать плейлист
            </Typography>

            {/* Карточка метаданных */}
            <Box sx={{ mb: 3, p: 3, borderRadius: "20px", border: "1px solid rgba(255,255,255,0.12)", bgcolor: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: 2.5 }}>
                <TextField
                    fullWidth
                    label="Название плейлиста *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    {...inputStyleProps}
                />

                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Описание"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Описание (необязательно)"
                    {...inputStyleProps}
                />

                <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                    <TextField
                        fullWidth
                        label="URL или путь к обложке"
                        value={cover}
                        onChange={(e) => setCover(e.target.value)}
                        placeholder="Ссылка на обложку"
                        helperText="Опционально: отобразится как квадратная обложка"
                        {...inputStyleProps}
                    />

                    <TextField
                        fullWidth
                        label="Фоновые обои (Background)"
                        value={background}
                        onChange={(e) => setBackground(e.target.value)}
                        placeholder="Ссылка на задний фон"
                        helperText="Опционально: отобразится как обои страницы"
                        {...inputStyleProps}
                    />
                </Box>

                <FormControlLabel
                    control={
                        <Switch
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                            sx={{
                                "& .MuiSwitch-switchBase.Mui-checked": { color: "#FFFFFF" },
                                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#FFFFFF" },
                            }}
                        />
                    }
                    label={
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: '"SF Pro Text", sans-serif' }}>
                                Приватный плейлист
                            </Typography>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontFamily: '"SF Pro Text", sans-serif' }}>
                                Будет виден только вам
                            </Typography>
                        </Box>
                    }
                />
            </Box>

            {/* Выбор треков */}
            <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, fontFamily: '"SF Pro Text", sans-serif' }}>
                    Выбрано треков: {selectedTracks.length}
                </Typography>
                <TextField
                    size="small"
                    placeholder="Поиск по названию или исполнителю..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    {...inputStyleProps}
                    sx={{
                        ...inputStyleProps.sx,
                        width: { xs: "100%", sm: 280 },
                    }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchRoundedIcon sx={{ color: "rgba(255,255,255,0.5)", fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            </Box>

            {filteredTracks.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center", color: "rgba(255,255,255,0.5)", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.15)", fontFamily: '"SF Pro Text", sans-serif' }}>
                    Треки не найдены
                </Box>
            ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 420, overflowY: "auto", pr: 1 }}>
                    {filteredTracks.map((track) => {
                        const isSelected = selectedTracks.includes(track.id);
                        return (
                            <Box
                                key={track.id}
                                onClick={() => toggleTrack(track.id)}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    p: 1.5,
                                    borderRadius: "12px",
                                    cursor: "pointer",
                                    border: `1px solid ${isSelected ? "#FFFFFF" : "rgba(255,255,255,0.08)"}`,
                                    bgcolor: isSelected ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                                    transition: "all 0.15s ease",
                                    "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: "50%",
                                        border: `2px solid ${isSelected ? "#FFFFFF" : "rgba(255,255,255,0.4)"}`,
                                        bgcolor: isSelected ? "#FFFFFF" : "transparent",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    {isSelected && <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#000000" }} />}
                                </Box>

                                <Box
                                    component="img"
                                    src={track.coverUrl || "/5.png"}
                                    alt=""
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/5.png";
                                    }}
                                    sx={{ width: 44, height: 44, borderRadius: "8px", objectFit: "cover", flexShrink: 0, bgcolor: "#1E1E1E" }}
                                />

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography noWrap variant="body2" sx={{ color: "#FFFFFF", fontWeight: isSelected ? 600 : 400, fontFamily: '"SF Pro Text", sans-serif' }}>
                                        {track.title}
                                    </Typography>
                                    <Typography noWrap variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontFamily: '"SF Pro Text", sans-serif' }}>
                                        {track.author}
                                    </Typography>
                                </Box>

                                {isSelected && (
                                    <Chip
                                        label="В плейлисте"
                                        size="small"
                                        variant="outlined"
                                        sx={{ borderColor: "#FFFFFF", color: "#FFFFFF", fontSize: 10, height: 20, fontFamily: '"SF Pro Text", sans-serif' }}
                                    />
                                )}
                            </Box>
                        );
                    })}
                </Box>
            )}

            {error && (
                <Typography color="error" sx={{ mt: 2, fontSize: 14, fontFamily: '"SF Pro Text", sans-serif' }}>
                    {error}
                </Typography>
            )}

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", pt: 3 }}>
                <Button
                    variant="outlined"
                    onClick={() => router.push(`/playlist/${params.id}`)}
                    disabled={saving}
                    sx={{
                        color: "#FFFFFF",
                        borderColor: "rgba(255,255,255,0.3)",
                        borderRadius: "100px",
                        px: 3,
                        py: 1,
                        textTransform: "none",
                        fontFamily: '"SF Pro Rounded", "SF Pro Text", sans-serif',
                        fontWeight: 600,
                        "&:hover": { borderColor: "#FFFFFF", bgcolor: "rgba(255,255,255,0.08)" }
                    }}
                >
                    Отмена
                </Button>
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleSave}
                    disabled={saving || !title.trim()}
                    startIcon={<SaveRoundedIcon />}
                    sx={{
                        bgcolor: "#FFFFFF",
                        color: "#000000",
                        borderRadius: "100px",
                        px: 4,
                        py: 1,
                        fontWeight: 700,
                        textTransform: "none",
                        fontFamily: '"SF Pro Rounded", "SF Pro Text", sans-serif',
                        "&:hover": { bgcolor: "rgba(255,255,255,0.85)" },
                        "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.4)" },
                        minWidth: 200,
                    }}
                >
                    {saving ? (statusText || "Сохранение...") : "Сохранить изменения"}
                </Button>
            </Box>
        </Box>
    );
}