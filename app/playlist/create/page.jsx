"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { useRouter } from "next/navigation";
import { api } from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";
import { PlaylistPlayRoundedIcon, AddRoundedIcon, SearchRoundedIcon } from "../../components/icons";

// Хелпер нормализации ссылки на изображение (с дефолтным фолбеком на 5.png)
const resolveImageUrl = (path) => {
    if (!path) return "/5.png";
    let clean = String(path).trim();
    if (!clean) return "/5.png";
    if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("//")) return clean;
    clean = clean.replace(/^\/+/, "");
    return clean.startsWith("storage/") ? `https://music.atomglide.com/${clean}` : `https://music.atomglide.com/storage/${clean}`;
};

// Хелпер распаковки авторов из DB2 (JSON массив или строка)
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

// Общие стили для инпутов (гарантия контрастности и читаемости)
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

export default function CreatePlaylistPage() {
    const router = useRouter();
    const { isAuthed, requestLogin } = useAuth();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [cover, setCover] = useState("");
    const [background, setBackground] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);

    const [selectedTracks, setSelectedTracks] = useState([]);
    const [allTracks, setAllTracks] = useState([]);
    const [filteredTracks, setFilteredTracks] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingTracks, setLoadingTracks] = useState(true);
    const [creating, setCreating] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
    const [mounted, setMounted] = useState(false);

    const showSnack = (message, severity = "info") => setSnackbar({ open: true, message, severity });
    const closeSnack = () => setSnackbar((prev) => ({ ...prev, open: false }));

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isAuthed) requestLogin();
    }, [isAuthed, requestLogin, mounted]);

    useEffect(() => {
        const fetchAllTracks = async () => {
            try {
                const res = await api.get("/music/list");
                const rawList = res.data.tracks || [];

                const tracks = rawList.map((t, idx) => {
                    const id = t.id ?? t.ID ?? idx;
                    const rawTitle = t.title ?? t.TITLE ?? "Без названия";
                    const rawAuthors = t.authors ?? t.AUTHORS ?? t.author ?? t.AUTHOR;
                    const rawCover = t.cover_main ?? t.COVER_MAIN ?? t.cover ?? t.COVER;

                    return {
                        id: Number(id) || id,
                        title: rawTitle,
                        author: formatAuthors(rawAuthors),
                        coverRaw: rawCover,
                        coverUrl: resolveImageUrl(rawCover),
                    };
                });

                setAllTracks(tracks);
                setFilteredTracks(tracks);
            } catch (err) {
                console.error("Ошибка загрузки треков:", err);
                showSnack("Не удалось загрузить треки из каталога", "error");
            } finally {
                setLoadingTracks(false);
            }
        };
        fetchAllTracks();
    }, []);

    useEffect(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            setFilteredTracks(allTracks);
            return;
        }
        const filtered = allTracks.filter(
            (t) => t.title.toLowerCase().includes(query) || t.author.toLowerCase().includes(query)
        );
        setFilteredTracks(filtered);
    }, [searchQuery, allTracks]);

    const toggleTrack = (trackId) => {
        setSelectedTracks((prev) =>
            prev.includes(trackId)
                ? prev.filter((id) => id !== trackId)
                : [...prev, trackId]
        );
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            showSnack("Введите название плейлиста", "error");
            return;
        }

        // Если обложка не указана вручную, берём обложку первого выбранного трека
        let finalCover = cover.trim();
        if (!finalCover && selectedTracks.length > 0) {
            const firstTrack = allTracks.find((t) => t.id === selectedTracks[0]);
            if (firstTrack && firstTrack.coverRaw) {
                finalCover = firstTrack.coverRaw;
            }
        }

        setCreating(true);
        try {
            const res = await api.post("/music/playlists", {
                title: title.trim(),
                description: description.trim(),
                cover: finalCover,
                background: background.trim(),
                isPrivate: isPrivate,
                trackIds: selectedTracks,
            });

            const created = res.data.playlist || {};
            const createdId = created.id ?? created.ID;
            const createdTitle = created.title ?? created.TITLE ?? title;

            showSnack(`Плейлист "${createdTitle}" успешно создан!`, "success");

            setTitle("");
            setDescription("");
            setCover("");
            setBackground("");
            setSelectedTracks([]);

            setTimeout(() => {
                if (createdId) {
                    router.push(`/playlist/${createdId}`);
                } else {
                    router.push("/playlist");
                }
            }, 1200);
        } catch (err) {
            console.error(err);
            showSnack(err.response?.data?.error || "Не удалось создать плейлист", "error");
        } finally {
            setCreating(false);
        }
    };

    if (!isAuthed) {
        return (
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, px: 3, textAlign: "center", color: "#FFFFFF", bgcolor: "#0D0D0E", minHeight: "100vh" }}>
                <Box sx={{ width: 110, height: 110, borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(255,255,255,0.03)" }}>
                    <PlaylistPlayRoundedIcon sx={{ fontSize: 56, color: "rgba(255,255,255,0.5)" }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: '"SF Pro Display", -apple-system, sans-serif' }}>
                    Требуется вход
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.6)", maxWidth: 400, fontFamily: '"SF Pro Text", sans-serif' }}>
                    Чтобы создавать плейлисты, нужно войти в аккаунт.
                </Typography>
                <Button
                    variant="contained"
                    size="large"
                    onClick={() => requestLogin()}
                    sx={{
                        mt: 1,
                        bgcolor: "#FFFFFF",
                        color: "#000000",
                        borderRadius: "100px",
                        px: 4,
                        py: 1.2,
                        fontWeight: 700,
                        textTransform: "none",
                        fontFamily: '"SF Pro Rounded", "SF Pro Text", sans-serif',
                        "&:hover": { bgcolor: "rgba(255,255,255,0.85)" }
                    }}
                >
                    Войти
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, overflowY: "auto", px: { xs: 2, sm: 4, md: 6 }, py: 4, maxWidth: 840, mx: "auto", width: "100%", bgcolor: "#0D0D0E", minHeight: "100vh", color: "#FFFFFF" }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, fontFamily: '"SF Pro Display", -apple-system, sans-serif' }}>
                    Создать плейлист
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontFamily: '"SF Pro Text", sans-serif' }}>
                    Заполните информацию и выберите треки из каталога.
                </Typography>
            </Box>

            {/* Карточка метаданных плейлиста */}
            <Box sx={{ mb: 3, p: 3, borderRadius: "20px", border: "1px solid rgba(255,255,255,0.12)", bgcolor: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: 2.5 }}>
                <TextField
                    fullWidth
                    label="Название плейлиста *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Например: Ночной Синтвейв"
                    {...inputStyleProps}
                />

                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Описание"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Краткое описание плейлиста (необязательно)"
                    {...inputStyleProps}
                />

                <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                    <TextField
                        fullWidth
                        label="URL или путь к обложке"
                        value={cover}
                        onChange={(e) => setCover(e.target.value)}
                        placeholder="Оставьте пустым для авто-обложки"
                        helperText="Опционально: если пусто, возьмётся обложка 1-го трека"
                        {...inputStyleProps}
                    />

                    <TextField
                        fullWidth
                        label="Фоновые обои (Background)"
                        value={background}
                        onChange={(e) => setBackground(e.target.value)}
                        placeholder="Ссылка на фон страницы"
                        helperText="Опционально: отобразится как задний фон плейлиста"
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

            {/* Заголовок выбора треков */}
            <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, fontFamily: '"SF Pro Text", sans-serif' }}>
                    Все треки ({allTracks.length})
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: { xs: "100%", sm: "auto" }, justifyContent: "space-between" }}>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontFamily: '"SF Pro Text", sans-serif' }}>
                        Выбрано: {selectedTracks.length}
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
            </Box>

            {/* Список треков */}
            {loadingTracks ? (
                <Typography sx={{ textAlign: "center", py: 4, color: "rgba(255,255,255,0.5)", fontFamily: '"SF Pro Text", sans-serif' }}>
                    Загрузка каталога треков...
                </Typography>
            ) : filteredTracks.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.15)", bgcolor: "rgba(255,255,255,0.01)" }}>
                    <Typography sx={{ mb: 1, color: "rgba(255,255,255,0.7)", fontFamily: '"SF Pro Text", sans-serif' }}>
                        Треки не найдены
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)", fontFamily: '"SF Pro Text", sans-serif' }}>
                        Попробуйте изменить поисковый запрос
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 450, overflowY: "auto", pr: 1 }}>
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
                                        label={`#${selectedTracks.indexOf(track.id) + 1}`}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontSize: "11px", height: 20, borderColor: "#FFFFFF", color: "#FFFFFF", fontFamily: '"SF Pro Text", sans-serif' }}
                                    />
                                )}
                            </Box>
                        );
                    })}
                </Box>
            )}

            <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.12)" }} />

            {/* Нижняя панель действий */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button
                    variant="outlined"
                    onClick={() => router.back()}
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
                    onClick={handleCreate}
                    disabled={creating || !title.trim()}
                    startIcon={<AddRoundedIcon />}
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
                        minWidth: 200
                    }}
                >
                    {creating ? "Создание..." : "Создать плейлист"}
                </Button>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={closeSnack} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
                <Alert onClose={closeSnack} severity={snackbar.severity} sx={{ width: "100%", minWidth: 300, borderRadius: "12px", fontFamily: '"SF Pro Text", sans-serif' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}