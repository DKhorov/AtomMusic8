/*
 * Product Name: AtomGlide Music
 * Product Version: 1.2.5
 * Product Type: Web Application Component
 * Language: JavaScript (React / Next.js)
 * File Name: UploadPage.jsx
 * Author: Dmitry Khorov
 * Company Name: AtomGlide Labs
 * Date last update: 2026-10-20
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import { api } from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import {
    UploadRoundedIcon,
    CloudUploadRoundedIcon,
    ImageRoundedIcon,
    DeleteRoundedIcon,
    PlayArrowRoundedIcon,
    PauseRoundedIcon,
    AddRoundedIcon,
    CloseRoundedIcon,
    SaveRoundedIcon,
} from "../components/icons";

const STORAGE_KEY = "atmusic:upload:form";

function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        if (typeof window === "undefined") return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? { ...initialValue, ...JSON.parse(item) } : initialValue;
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

function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function parseFilename(filename) {
    const cleanName = filename.replace(/\.[^/.]+$/, "");
    if (cleanName.includes(" - ")) {
        const parts = cleanName.split(" - ");
        return {
            artist: parts[0].trim(),
            title: parts.slice(1).join(" - ").trim(),
        };
    }
    return {
        artist: "",
        title: cleanName.trim(),
    };
}

export default function UploadPage() {
    const { isAuthed, loading, requestLogin } = useAuth();
    const [mounted, setMounted] = useState(false);

    const [dragActive, setDragActive] = useState(false);
    const [tracks, setTracks] = useState([]);
    const [albumCover, setAlbumCover] = useState(null);
    const [albumCoverPreview, setAlbumCoverPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
    const [albumTitle, setAlbumTitle] = useState("");
    const [albumArtist, setAlbumArtist] = useState("");
    const [playingTrackId, setPlayingTrackId] = useState(null);

    const fileInputRef = useRef(null);
    const coverInputRef = useRef(null);
    const audioMetadataRef = useRef(null);
    const activeAudioRef = useRef(null);

    const [formData, setFormData] = useLocalStorage(STORAGE_KEY, {
        defaultArtist: "",
        defaultAlbum: "",
        defaultGenre: "",
    });

    const showSnack = (message, severity = "info") => setSnackbar({ open: true, message, severity });
    const closeSnack = () => setSnackbar((prev) => ({ ...prev, open: false }));

    // Фиксируем факт монтирования в браузере
    useEffect(() => {
        setMounted(true);
    }, []);

    // Безопасная проверка авторизации БЕЗ мгновенного выбрасывания
    useEffect(() => {
        if (!mounted || loading) return;

        // Проверяем наличие токена напрямую
        const hasToken = typeof window !== "undefined" && (
            Boolean(localStorage.getItem("accessToken")) ||
            Boolean(localStorage.getItem("refreshToken"))
        );

        // Редиректим только если загрузка завершена, токенов точно нет и пользователь не авторизован
        if (!isAuthed && !hasToken && requestLogin) {
            requestLogin();
        }
    }, [isAuthed, loading, mounted, requestLogin]);

    const loadAudioMetadata = (file) => {
        return new Promise((resolve) => {
            if (!audioMetadataRef.current) audioMetadataRef.current = new Audio();
            const audio = audioMetadataRef.current;
            const objectUrl = URL.createObjectURL(file);
            audio.src = objectUrl;
            audio.onloadedmetadata = () => {
                resolve(audio.duration);
                URL.revokeObjectURL(objectUrl);
            };
            audio.onerror = () => {
                resolve(0);
                URL.revokeObjectURL(objectUrl);
            };
        });
    };

    const addFiles = (files) => {
        const audioFiles = files.filter(
            (f) => f.type.startsWith("audio/") || /\.(mp3|flac|wav|m4a|ogg|aac)$/i.test(f.name)
        );
        if (audioFiles.length === 0) {
            showSnack("Поддерживаются только аудиофайлы (mp3, flac, wav, m4a, ogg, aac)", "error");
            return;
        }
        setTracks((prev) => {
            const existingNames = new Set(prev.map((t) => t.file.name));
            const newTracks = audioFiles
                .filter((f) => !existingNames.has(f.name))
                .map((file) => {
                    const parsed = parseFilename(file.name);
                    return {
                        id: `${file.name}-${Date.now()}-${Math.random()}`,
                        file,
                        title: parsed.title,
                        artist: parsed.artist || albumArtist || formData.defaultArtist || "",
                        album: albumTitle || formData.defaultAlbum || "",
                        genre: formData.defaultGenre || "",
                        cover: null,
                        coverPreview: null,
                        duration: 0,
                        error: null,
                    };
                });
            return [...prev, ...newTracks];
        });
        if (audioFiles.length > 0) showSnack(`Добавлено треков: ${audioFiles.length}`, "success");
    };

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    }, []);

    const handleFileSelect = (e) => {
        if (e.target.files) addFiles(Array.from(e.target.files));
        e.target.value = "";
    };

    const handleCoverSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith("image/")) {
                showSnack("Обложка должна быть изображением", "error");
                return;
            }
            setAlbumCover(file);
            setAlbumCoverPreview(URL.createObjectURL(file));
        }
    };

    const updateTrack = (id, field, value) => {
        setTracks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, [field]: value, error: null } : t))
        );
    };

    const removeTrack = (id) => {
        setTracks((prev) => {
            const track = prev.find((t) => t.id === id);
            if (track?.coverPreview) URL.revokeObjectURL(track.coverPreview);
            return prev.filter((t) => t.id !== id);
        });
        if (playingTrackId === id) {
            if (activeAudioRef.current) activeAudioRef.current.pause();
            setPlayingTrackId(null);
        }
    };

    const handleTrackCoverSelect = (id, file) => {
        if (!file.type.startsWith("image/")) {
            showSnack("Обложка должна быть изображением", "error");
            return;
        }
        const preview = URL.createObjectURL(file);
        setTracks((prev) =>
            prev.map((t) =>
                t.id === id ? { ...t, cover: file, coverPreview: preview, error: null } : t
            )
        );
    };

    const handleTogglePlay = (track) => {
        if (playingTrackId === track.id) {
            if (activeAudioRef.current) activeAudioRef.current.pause();
            setPlayingTrackId(null);
            return;
        }
        if (activeAudioRef.current) activeAudioRef.current.pause();
        const audio = new Audio(URL.createObjectURL(track.file));
        activeAudioRef.current = audio;
        setPlayingTrackId(track.id);
        audio.play().catch(() => setPlayingTrackId(null));
        audio.onended = () => setPlayingTrackId(null);
    };

    const applyGlobalToAll = () => {
        setTracks((prev) =>
            prev.map((t) => ({
                ...t,
                artist: albumArtist || t.artist,
                album: albumTitle || t.album,
                genre: formData.defaultGenre || t.genre,
            }))
        );
        showSnack("Метаданные применены ко всем трекам", "info");
    };

    useEffect(() => {
        tracks.forEach((track) => {
            if (!track.duration && track.file) {
                loadAudioMetadata(track.file).then((dur) => {
                    updateTrack(track.id, "duration", dur);
                });
            }
        });
    }, [tracks]);

    const validateTracks = () => {
        let valid = true;
        setTracks((prev) =>
            prev.map((t) => {
                if (!t.title.trim()) {
                    valid = false;
                    return { ...t, error: "Название обязательно" };
                }
                if (!t.artist.trim()) {
                    valid = false;
                    return { ...t, error: "Исполнитель обязателен" };
                }
                if (!t.file) {
                    valid = false;
                    return { ...t, error: "Файл отсутствует" };
                }
                if (t.file.size > 40 * 1024 * 1024) {
                    valid = false;
                    return { ...t, error: "Размер файла превышает лимит сервера (макс. 40 МБ)" };
                }
                return { ...t, error: null };
            })
        );
        return valid;
    };

    const uploadSingleFile = async (file, category, onProgress) => {
        const formDataPayload = new FormData();
        formDataPayload.append("file", file);
        const res = await api.post(`/upload/${category}`, formDataPayload, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (e) => {
                if (e.total && onProgress) {
                    onProgress(Math.round((e.loaded * 100) / e.total));
                }
            },
        });
        return res.data.files[0].savedName;
    };

    const handleUpload = async () => {
        if (!isAuthed) {
            if (requestLogin) requestLogin();
            return;
        }
        if (tracks.length === 0) {
            showSnack("Добавьте хотя бы один трек", "error");
            return;
        }
        if (!validateTracks()) {
            showSnack("Заполните обязательные поля у всех треков (макс. 40 МБ)", "error");
            return;
        }

        setUploading(true);
        setProgress(0);
        showSnack("Загрузка аудиофайлов...", "info");

        try {
            const audioNames = [];
            const totalTracks = tracks.length;

            for (let i = 0; i < totalTracks; i++) {
                const track = tracks[i];
                const savedName = await uploadSingleFile(track.file, "audio", (p) => {
                    const currentWeight = 50 / totalTracks;
                    const baseProgress = (i / totalTracks) * 50;
                    setProgress(Math.round(baseProgress + (p * currentWeight) / 100));
                });
                audioNames.push(savedName);
            }

            setProgress(50);
            showSnack("Загрузка обложек...", "info");

            let albumCoverName = "";
            if (albumCover) {
                const coverSaved = await uploadSingleFile(albumCover, "image");
                albumCoverName = `/storage/${coverSaved}`;
            }

            const trackCoverNames = [];
            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i];
                if (track.cover) {
                    const coverSaved = await uploadSingleFile(track.cover, "image");
                    trackCoverNames[i] = `/storage/${coverSaved}`;
                } else {
                    trackCoverNames[i] = albumCoverName || "";
                }
            }

            setProgress(80);
            showSnack("Сохранение в базу данных...", "info");

            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i];
                const authors = [track.artist.trim()];
                const genres = [track.genre.trim() || formData.defaultGenre.trim() || "General"];
                const cover = trackCoverNames[i] || albumCoverName || "";
                const album = track.album.trim() || albumTitle.trim() || "";

                await api.post("/music", {
                    title: track.title.trim(),
                    authors,
                    genres,
                    album,
                    coverMain: cover,
                    coverPlayer: cover,
                    filePath: audioNames[i],
                    duration: track.duration || 0,
                });
            }

            setProgress(100);
            showSnack(`Успешно загружено ${tracks.length} трек${tracks.length > 1 ? "ов" : ""}!`, "success");

            setTracks([]);
            setAlbumCover(null);
            setAlbumCoverPreview(null);
            setAlbumTitle("");
            setAlbumArtist("");

            if (typeof window !== "undefined") {
                window.localStorage.removeItem(STORAGE_KEY);
            }
            setFormData({
                defaultArtist: tracks[0]?.artist || "",
                defaultAlbum: "",
                defaultGenre: "",
            });

            setTimeout(() => {
                if (typeof window !== "undefined") window.location.reload();
            }, 1500);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || err.message || "Ошибка загрузки";
            showSnack(`Ошибка: ${msg}`, "error");
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const clearAll = () => {
        tracks.forEach((t) => {
            if (t.coverPreview) URL.revokeObjectURL(t.coverPreview);
        });
        if (albumCoverPreview) URL.revokeObjectURL(albumCoverPreview);
        if (activeAudioRef.current) activeAudioRef.current.pause();
        setPlayingTrackId(null);
        setTracks([]);
        setAlbumCover(null);
        setAlbumCoverPreview(null);
        setAlbumTitle("");
        setAlbumArtist("");
        showSnack("Форма очищена", "info");
    };

    // Если данные еще инициализируются
    if (!mounted || loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", color: "#fff" }}>
                <Typography color="text.secondary">Проверка авторизации...</Typography>
            </Box>
        );
    }

    // Если не авторизован после полной проверки
    if (!isAuthed) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "70vh",
                    px: 2,
                    color: "#fff",
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        maxWidth: 400,
                        width: "100%",
                        borderRadius: 3,
                        bgcolor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        textAlign: "center",
                    }}
                >
                    <CloudUploadRoundedIcon sx={{ fontSize: 48, color: "rgba(255,255,255,0.7)", mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        Требуется вход
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                        Авторизуйтесь в системе AtomGlide Music для загрузки треков.
                    </Typography>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={() => requestLogin && requestLogin()}
                        sx={{
                            bgcolor: "#fff",
                            color: "#000",
                            fontWeight: 700,
                            borderRadius: 2,
                            "&:hover": { bgcolor: "rgba(255,255,255,0.85)" },
                        }}
                    >
                        Войти
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                maxWidth: 900,
                mx: "auto",
                width: "100%",
                px: { xs: 2, sm: 3 },
                py: 3,
                color: "#fff",
            }}
        >
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                    Загрузка треков
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Перетащите аудиофайлы или выберите их с компьютера.
                </Typography>
            </Box>

            {uploading && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: 2,
                        bgcolor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                    }}
                >
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            Загрузка на сервер...
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {progress}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: "rgba(255,255,255,0.1)",
                            "& .MuiLinearProgress-bar": { bgcolor: "#fff" },
                        }}
                    />
                </Paper>
            )}

            <Box
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                    border: `2px dashed ${dragActive ? "#fff" : "rgba(255,255,255,0.2)"}`,
                    borderRadius: 3,
                    p: 4,
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    bgcolor: dragActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                    mb: 3,
                    "&:hover": {
                        borderColor: "rgba(255,255,255,0.5)",
                        bgcolor: "rgba(255,255,255,0.04)",
                    },
                }}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="audio/*"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                />
                <CloudUploadRoundedIcon
                    sx={{
                        fontSize: 44,
                        color: dragActive ? "#fff" : "rgba(255,255,255,0.4)",
                        mb: 1,
                    }}
                />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {dragActive ? "Отпустите файлы" : "Перетащите аудиофайлы сюда"}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    MP3, FLAC, WAV, M4A, OGG до 40 МБ
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                    }}
                    startIcon={<AddRoundedIcon />}
                    sx={{
                        color: "#fff",
                        borderColor: "rgba(255,255,255,0.3)",
                        borderRadius: 2,
                        "&:hover": { borderColor: "#fff" },
                    }}
                >
                    Выбрать файлы
                </Button>
            </Box>

            {tracks.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Выбранные треки
                            </Typography>
                            <Chip
                                label={tracks.length}
                                size="small"
                                sx={{
                                    bgcolor: "rgba(255,255,255,0.1)",
                                    color: "#fff",
                                    height: 20,
                                }}
                            />
                        </Box>
                        <Button
                            variant="text"
                            size="small"
                            onClick={clearAll}
                            startIcon={<CloseRoundedIcon />}
                            sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#f44336" } }}
                        >
                            Очистить список
                        </Button>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        {tracks.map((track, idx) => (
                            <TrackRowItem
                                key={track.id}
                                track={track}
                                index={idx + 1}
                                isPlaying={playingTrackId === track.id}
                                onTogglePlay={() => handleTogglePlay(track)}
                                onUpdate={updateTrack}
                                onRemove={removeTrack}
                                onCoverSelect={handleTrackCoverSelect}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 3,
                    bgcolor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                    Общие метаданные альбома
                </Typography>
                <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap", alignItems: "flex-start" }}>
                    <Box
                        onClick={() => coverInputRef.current?.click()}
                        sx={{
                            width: 110,
                            height: 110,
                            borderRadius: 2,
                            border: `2px dashed ${albumCover ? "transparent" : "rgba(255,255,255,0.2)"}`,
                            bgcolor: "rgba(255,255,255,0.03)",
                            position: "relative",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            "&:hover": { borderColor: "rgba(255,255,255,0.5)" },
                        }}
                    >
                        <input
                            type="file"
                            ref={coverInputRef}
                            accept="image/*"
                            onChange={handleCoverSelect}
                            style={{ display: "none" }}
                        />
                        {albumCoverPreview ? (
                            <Box
                                component="img"
                                src={albumCoverPreview}
                                alt="Обложка"
                                sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 1.5 }}
                            />
                        ) : (
                            <Box sx={{ textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                                <ImageRoundedIcon sx={{ fontSize: 28 }} />
                                <Typography variant="caption" display="block">
                                    Обложка
                                </Typography>
                            </Box>
                        )}
                        {albumCover && (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setAlbumCover(null);
                                    setAlbumCoverPreview(null);
                                }}
                                sx={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    bgcolor: "rgba(0,0,0,0.7)",
                                    color: "#fff",
                                }}
                            >
                                <CloseRoundedIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        )}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: 1.5 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Название альбома"
                            value={albumTitle}
                            onChange={(e) => setAlbumTitle(e.target.value)}
                            sx={{
                                "& .MuiOutlinedInput-root": { borderRadius: 2 },
                                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
                                "& .MuiInputBase-input": { color: "#fff" },
                            }}
                        />
                        <TextField
                            fullWidth
                            size="small"
                            label="Исполнитель альбома"
                            value={albumArtist}
                            onChange={(e) => setAlbumArtist(e.target.value)}
                            sx={{
                                "& .MuiOutlinedInput-root": { borderRadius: 2 },
                                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
                                "& .MuiInputBase-input": { color: "#fff" },
                            }}
                        />
                        <Box sx={{ display: "flex", gap: 1.5 }}>
                            <TextField
                                size="small"
                                label="Жанр по умолчанию"
                                value={formData.defaultGenre}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, defaultGenre: e.target.value }))
                                }
                                sx={{
                                    flex: 1,
                                    "& .MuiOutlinedInput-root": { borderRadius: 2 },
                                    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
                                    "& .MuiInputBase-input": { color: "#fff" },
                                }}
                            />
                            {tracks.length > 0 && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={applyGlobalToAll}
                                    sx={{
                                        borderRadius: 2,
                                        borderColor: "rgba(255,255,255,0.2)",
                                        color: "rgba(255,255,255,0.8)",
                                    }}
                                >
                                    Применить
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button
                    variant="outlined"
                    onClick={clearAll}
                    disabled={uploading || tracks.length === 0}
                    sx={{
                        borderColor: "rgba(255,255,255,0.2)",
                        color: "rgba(255,255,255,0.8)",
                        borderRadius: 2,
                    }}
                >
                    Очистить
                </Button>
                <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={uploading || tracks.length === 0}
                    startIcon={uploading ? <SaveRoundedIcon /> : <UploadRoundedIcon />}
                    sx={{
                        bgcolor: "#fff",
                        color: "#000",
                        fontWeight: 700,
                        borderRadius: 2,
                        px: 3,
                        "&:hover": { bgcolor: "rgba(255,255,255,0.85)" },
                    }}
                >
                    {uploading ? `Загрузка (${progress}%)` : "Опубликовать"}
                </Button>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={closeSnack}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={closeSnack} severity={snackbar.severity} sx={{ borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

function TrackRowItem({
                          track,
                          index,
                          isPlaying,
                          onTogglePlay,
                          onUpdate,
                          onRemove,
                          onCoverSelect,
                      }) {
    const trackCoverInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onCoverSelect(track.id, e.target.files[0]);
        }
        e.target.value = "";
    };

    return (
        <Paper
            elevation={0}
            sx={{
                display: "flex",
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                border: "1px solid rgba(255,255,255,0.08)",
                bgcolor: "rgba(255,255,255,0.02)",
                alignItems: "center",
                flexWrap: "wrap",
            }}
        >
            <Typography
                sx={{
                    width: 20,
                    textAlign: "center",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "13px",
                }}
            >
                {index}
            </Typography>

            <IconButton
                size="small"
                onClick={onTogglePlay}
                sx={{
                    bgcolor: isPlaying ? "#fff" : "rgba(255,255,255,0.08)",
                    color: isPlaying ? "#000" : "#fff",
                }}
            >
                {isPlaying ? <PauseRoundedIcon sx={{ fontSize: 20 }} /> : <PlayArrowRoundedIcon sx={{ fontSize: 20 }} />}
            </IconButton>

            <Box sx={{ flex: 1, minWidth: 180, display: "flex", gap: 1 }}>
                <TextField
                    fullWidth
                    size="small"
                    label="Название"
                    value={track.title}
                    onChange={(e) => onUpdate(track.id, "title", e.target.value)}
                    error={!!track.error}
                    sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                        "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
                        "& .MuiInputBase-input": { color: "#fff" },
                    }}
                />
                <TextField
                    fullWidth
                    size="small"
                    label="Исполнитель"
                    value={track.artist}
                    onChange={(e) => onUpdate(track.id, "artist", e.target.value)}
                    sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                        "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
                        "& .MuiInputBase-input": { color: "#fff" },
                    }}
                />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                    {formatFileSize(track.file.size)}
                </Typography>
                {track.duration > 0 && (
                    <Chip
                        label={formatDuration(track.duration)}
                        size="small"
                        variant="outlined"
                        sx={{
                            height: 20,
                            fontSize: "11px",
                            borderColor: "rgba(255,255,255,0.2)",
                            color: "rgba(255,255,255,0.7)",
                        }}
                    />
                )}

                <input
                    type="file"
                    ref={trackCoverInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                />

                {track.coverPreview ? (
                    <Box sx={{ position: "relative", width: 28, height: 28, borderRadius: 1, overflow: "hidden" }}>
                        <Box component="img" src={track.coverPreview} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <IconButton
                            size="small"
                            onClick={() => onUpdate(track.id, "cover", null)}
                            sx={{ position: "absolute", top: 0, right: 0, bgcolor: "rgba(0,0,0,0.7)", color: "#fff", p: "1px" }}
                        >
                            <CloseRoundedIcon sx={{ fontSize: 10 }} />
                        </IconButton>
                    </Box>
                ) : (
                    <IconButton
                        size="small"
                        onClick={() => trackCoverInputRef.current?.click()}
                        sx={{ color: "rgba(255,255,255,0.5)" }}
                    >
                        <ImageRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                )}

                <IconButton
                    size="small"
                    onClick={() => onRemove(track.id)}
                    sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#f44336" } }}
                >
                    <DeleteRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>
        </Paper>
    );
}