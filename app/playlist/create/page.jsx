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
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useMusic } from "../../context/MusicContext";
import { PlaylistPlayRoundedIcon, AddRoundedIcon } from "../../components/icons";

const PLAYLISTS_KEY = "atmusic:playlists";

function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        if (typeof window === "undefined") return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== "undefined") {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}

export default function CreatePlaylistPage() {
    const router = useRouter();
    const { isAuthed, requestLogin } = useAuth();
    const { favorites } = useMusic();
    const [, setPlaylists] = useLocalStorage(PLAYLISTS_KEY, []);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedTracks, setSelectedTracks] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    const showSnack = (message, severity = "info") => setSnackbar({ open: true, message, severity });
    const closeSnack = () => setSnackbar((prev) => ({ ...prev, open: false }));

    useEffect(() => {
        if (!isAuthed) requestLogin();
    }, [isAuthed, requestLogin]);

    const toggleTrack = (trackId) => {
        setSelectedTracks((prev) =>
            prev.includes(trackId)
                ? prev.filter((id) => id !== trackId)
                : [...prev, trackId]
        );
    };

    const handleCreate = () => {
        if (!title.trim()) { showSnack("Введите название плейлиста", "error"); return; }
        if (selectedTracks.length === 0) { showSnack("Добавьте хотя бы один трек", "error"); return; }

        const newPlaylist = {
            id: `pl-${Date.now()}`,
            title: title.trim(),
            description: description.trim(),
            trackIds: [...selectedTracks],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        setPlaylists((prev) => [...prev, newPlaylist]);
        showSnack(`Плейлист "${newPlaylist.title}" создан!`, "success");

        setTitle("");
        setDescription("");
        setSelectedTracks([]);

        setTimeout(() => router.push("/profile"), 1500);
    };

    if (!isAuthed) {
        return (
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, px: 3, textAlign: "center", color: "#fff" }}>
                <Box sx={{ width: 110, height: 110, borderRadius: "18px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <PlaylistPlayRoundedIcon sx={{ fontSize: 56, color: "rgba(255,255,255,0.5)", mx: "auto", my: "auto", display: "block" }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Требуется вход</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.6)", maxWidth: 400 }}>Чтобы создавать плейлисты, нужно войти в аккаунт.</Typography>
                <Button variant="contained" size="large" onClick={() => requestLogin()} sx={{ mt: 1, bgcolor: "#fff", color: "#000" }}>
                    Войти
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, overflowY: "auto", px: { xs: 2, sm: 4, md: 6 }, py: 4, maxWidth: 800, mx: "auto", width: "100%" }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Создать плейлист</Typography>
                <Typography color="text.secondary">Соберите любимые треки в один плейлист. Трек должен быть в избранном.</Typography>
            </Box>

            <Box sx={{ mb: 3, p: 3, borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", bgcolor: "rgba(255,255,255,0.02)" }}>
                <TextField
                    fullWidth
                    label="Название плейлиста *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Например: Вечерний чип"
                    sx={{ mb: 2, "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "rgba(255,255,255,0.2)" }, "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" }, "&.Mui-focused fieldset": { borderColor: "#fff" } }} }
                />
                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Описание"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Краткое описание плейлиста (необязательно)"
                    sx={{ "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "rgba(255,255,255,0.2)" }, "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" }, "&.Mui-focused fieldset": { borderColor: "#fff" } }} }
                />
            </Box>

            <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Треки из избранного ({favorites.length})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Выбрано: {selectedTracks.length}
                </Typography>
            </Box>

            {favorites.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.2)" }}>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>В избранном пока нет треков</Typography>
                    <Typography variant="body2" color="text.secondary">Добавьте треки в избранное на странице треков или в потоке, затем вернитесь сюда.</Typography>
                </Box>
            ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 400, overflowY: "auto", pr: 1 }}>
                    {favorites.map((track) => {
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
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    border: `1px solid ${isSelected ? "#fff" : "rgba(255,255,255,0.1)"}`,
                                    bgcolor: isSelected ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                                    transition: "all 0.15s",
                                    "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                                }}
                            >
                                <Box sx={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${isSelected ? "#fff" : "rgba(255,255,255,0.4)"}`, bgcolor: isSelected ? "#fff" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    {isSelected && <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#000" }} />}
                                </Box>
                                <Box component="img" src={track.cover} alt="" sx={{ width: 44, height: 44, borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography noWrap variant="body2" sx={{ color: "#fff", fontWeight: isSelected ? 600 : 400 }}>{track.title}</Typography>
                                    <Typography noWrap variant="caption" color="text.secondary">{track.author}</Typography>
                                </Box>
                                {isSelected && (
                                    <Chip
                                        label={`#${selectedTracks.indexOf(track.id) + 1}`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{ fontSize: "10px", height: 20, borderColor: "#fff", color: "#fff" }}
                                    />
                                )}
                            </Box>
                        );
                    })}
                </Box>
            )}

            <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.12)" }} />

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button variant="outlined" onClick={() => router.back()}>
                    Отмена
                </Button>
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleCreate}
                    disabled={!title.trim() || selectedTracks.length === 0}
                    startIcon={<AddRoundedIcon />}
                    sx={{ bgcolor: "#fff", color: "#000", "&:hover": { bgcolor: "rgba(255,255,255,0.9)" }, minWidth: 200 }}
                >
                    Создать плейлист
                </Button>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={closeSnack} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
                <Alert onClose={closeSnack} severity={snackbar.severity} sx={{ width: "100%", minWidth: 300 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}