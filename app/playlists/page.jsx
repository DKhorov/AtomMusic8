"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Chip from "@mui/material/Chip";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import {
    PlaylistPlayRoundedIcon,
    AddRoundedIcon,
    DeleteRoundedIcon,
    EditRoundedIcon,
    ChevronRightRoundedIcon
} from "../components/icons";

// Встроенные SVG-иконки замка и глобуса (чтобы не зависеть от внешних импортов)
const LockSvg = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
);

const PublicSvg = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
);

// Хелпер формирования правильного URL для обложки
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

export default function PlaylistsPage() {
    const router = useRouter();
    const { isAuthed, loading: authLoading, requestLogin } = useAuth();
    const [mounted, setMounted] = useState(false);

    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);

    // Состояния для быстрого создания
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newCover, setNewCover] = useState("");
    const [newBackground, setNewBackground] = useState("");
    const [newIsPrivate, setNewIsPrivate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadPlaylists = async () => {
        try {
            const res = await api.get("/music/playlists");
            const rawList = res.data.playlists || [];

            // Нормализация данных из IBM DB2
            const normalized = rawList.map((pl) => ({
                id: Number(pl.id ?? pl.ID),
                title: pl.title ?? pl.TITLE ?? "Без названия",
                description: pl.description ?? pl.DESCRIPTION ?? "",
                cover: resolveImageUrl(pl.cover ?? pl.COVER),
                background: resolveImageUrl(pl.background ?? pl.BACKGROUND),
                tracksCount: Number(pl.tracks_count ?? pl.TRACKS_COUNT ?? 0),
                isPrivate: Boolean(Number(pl.is_private ?? pl.IS_PRIVATE ?? 0)),
            }));

            setPlaylists(normalized);
        } catch (err) {
            console.error("Ошибка загрузки плейлистов:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlaylists();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        const cleanTitle = newTitle.trim();
        if (!cleanTitle) return;

        setCreating(true);
        setError("");
        try {
            await api.post("/music/playlists", {
                title: cleanTitle,
                description: newDescription.trim(),
                cover: newCover.trim(),
                background: newBackground.trim(),
                isPrivate: newIsPrivate,
            });

            setShowCreate(false);
            setNewTitle("");
            setNewDescription("");
            setNewCover("");
            setNewBackground("");
            setNewIsPrivate(false);

            await loadPlaylists();
        } catch (err) {
            setError(err.response?.data?.error || "Не удалось создать плейлист");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Удалить этот плейлист?")) return;
        try {
            await api.delete(`/music/playlists/${id}`);
            await loadPlaylists();
        } catch (err) {
            alert(err.response?.data?.error || "Ошибка при удалении плейлиста");
        }
    };

    // Ожидание завершения проверки авторизации
    if (!mounted || authLoading) {
        return (
            <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "#fff" }}>
                <Typography color="text.secondary">Загрузка...</Typography>
            </Box>
        );
    }

    if (!isAuthed) {
        return (
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, px: 3, textAlign: "center", color: "#fff", minHeight: "60vh" }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Требуется вход</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.6)", maxWidth: 400 }}>
                    Чтобы управлять своими коллекциями, войдите в аккаунт.
                </Typography>
                <Button variant="contained" size="large" onClick={() => requestLogin && requestLogin()} sx={{ mt: 1, bgcolor: "#fff", color: "#000", fontWeight: 700 }}>
                    Войти
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, overflowY: "auto", px: { xs: 2, sm: 4, md: 6 }, py: 4, maxWidth: 900, mx: "auto", width: "100%" }}>
            {/* ШАПКА СТРАНИЦЫ */}
            <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Мои плейлисты</Typography>
                    <Typography color="text.secondary">Создавайте и управляйте своими музыкальными коллекциями</Typography>
                </Box>

            </Box>

            {/* БЫСТРАЯ ФОРМА СОЗДАНИЯ */}
            {showCreate && (
                <Box
                    component="form"
                    onSubmit={handleCreate}
                    sx={{
                        mb: 4,
                        p: 3,
                        borderRadius: "16px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        bgcolor: "rgba(255,255,255,0.03)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Создание плейлиста</Typography>

                    <TextField
                        fullWidth
                        label="Название плейлиста *"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Например: Любимая музыка"
                        required
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
                                "&.Mui-focused fieldset": { borderColor: "#fff" },
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Описание"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Краткое описание (необязательно)"
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
                                "&.Mui-focused fieldset": { borderColor: "#fff" },
                            },
                        }}
                    />

                    <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="URL обложки"
                            value={newCover}
                            onChange={(e) => setNewCover(e.target.value)}
                            placeholder="Оставьте пустым или вставьте ссылку"
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                                },
                            }}
                        />

                        <TextField
                            fullWidth
                            size="small"
                            label="URL фона (обоев)"
                            value={newBackground}
                            onChange={(e) => setNewBackground(e.target.value)}
                            placeholder="Обои страницы плейлиста"
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                                },
                            }}
                        />
                    </Box>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={newIsPrivate}
                                onChange={(e) => setNewIsPrivate(e.target.checked)}
                                sx={{
                                    "& .MuiSwitch-switchBase.Mui-checked": { color: "#fff" },
                                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#fff" },
                                }}
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Приватный плейлист</Typography>
                                <Typography variant="caption" color="text.secondary">Будет виден только вам</Typography>
                            </Box>
                        }
                    />

                    {error && <Typography color="error" sx={{ fontSize: 13 }}>{error}</Typography>}

                    <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", pt: 1 }}>
                        <Button variant="outlined" onClick={() => setShowCreate(false)} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}>
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={creating || !newTitle.trim()}
                            startIcon={<AddRoundedIcon />}
                            sx={{ bgcolor: "#fff", color: "#000", fontWeight: 700 }}
                        >
                            {creating ? "Создание..." : "Создать"}
                        </Button>
                    </Box>
                </Box>
            )}

            {/* СПИСОК ПЛЕЙЛИСТОВ */}
            {loading ? (
                <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>Загрузка плейлистов...</Typography>
            ) : playlists.length === 0 ? (
                <Box sx={{ p: 5, textAlign: "center", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.2)", bgcolor: "rgba(255,255,255,0.01)" }}>
                    <PlaylistPlayRoundedIcon sx={{ fontSize: 48, color: "rgba(255,255,255,0.3)", mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Плейлистов пока нет</Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>Создайте свой первый плейлист и добавляйте туда треки</Typography>
                    <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => router.push("/playlist/create")} sx={{ bgcolor: "#fff", color: "#000", fontWeight: 700 }}>
                        Создать с выбором треков
                    </Button>
                </Box>
            ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {playlists.map((pl) => (
                        <Link key={pl.id} href={`/playlist/${pl.id}`} style={{ textDecoration: "none" }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2.5,
                                    p: 2,
                                    borderRadius: "16px",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    bgcolor: "rgba(255,255,255,0.02)",
                                    transition: "all 0.2s ease",
                                    cursor: "pointer",
                                    "&:hover": {
                                        bgcolor: "rgba(255,255,255,0.06)",
                                        borderColor: "rgba(255,255,255,0.2)",
                                        transform: "translateY(-2px)",
                                    },
                                }}
                            >
                                {/* Квадратная обложка */}
                                <Box
                                    sx={{
                                        width: 72,
                                        height: 72,
                                        borderRadius: "12px",
                                        overflow: "hidden",
                                        flexShrink: 0,
                                        bgcolor: "#1a1a1a",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                >
                                    {pl.cover ? (
                                        <Box
                                            component="img"
                                            src={resolveImageUrl(pl?.cover || pl?.COVER)}
                                            alt={pl?.title || pl?.TITLE || "Обложка плейлиста"}
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = "/5.png";
                                            }}
                                            sx={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                bgcolor: "#1E1E1E"
                                            }}
                                        />                                    ) : (
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.3)" }}>
                                            <PlaylistPlayRoundedIcon sx={{ fontSize: 32 }} />
                                        </Box>
                                    )}
                                </Box>

                                {/* Информация о плейлисте */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                        <Typography noWrap variant="h6" sx={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem" }}>
                                            {pl.title}
                                        </Typography>
                                        <Chip
                                            label={pl.isPrivate ? "Приватный" : "Публичный"}
                                            size="small"
                                            sx={{ height: 20, fontSize: 10, bgcolor: "rgba(255,255,255,0.08)", color: "#fff" }}
                                        />
                                    </Box>

                                    {pl.description && (
                                        <Typography noWrap variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb: 0.5 }}>
                                            {pl.description}
                                        </Typography>
                                    )}

                                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
                                        {pl.tracksCount} {pl.tracksCount === 1 ? "трек" : pl.tracksCount < 5 ? "трека" : "треков"}
                                    </Typography>
                                </Box>

                                {/* Действия */}
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            router.push(`/playlist/${pl.id}/edit`);
                                        }}
                                        sx={{ color: "rgba(255,255,255,0.5)", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }}
                                    >
                                        <EditRoundedIcon fontSize="small" />
                                    </IconButton>

                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDelete(pl.id);
                                        }}
                                        sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#ff4444", bgcolor: "rgba(244,67,54,0.15)" } }}
                                    >
                                        <DeleteRoundedIcon fontSize="small" />
                                    </IconButton>

                                    <ChevronRightRoundedIcon sx={{ color: "rgba(255,255,255,0.3)", ml: 0.5 }} />
                                </Box>
                            </Box>
                        </Link>
                    ))}
                </Box>
            )}
        </Box>
    );
}