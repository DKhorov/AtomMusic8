// Product Name: NextJS App Product Version: 1.0 Product Type: Component Language: JavaScript File Name: src/components/UserPlaylistsSection.jsx Author: Dmitry Khorov Company Name: AtomGlide Labs Date last update: 2026-10-20
"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Link from "next/link";
import IconButton from "@mui/material/IconButton";
import { useRouter } from "next/navigation";
import { api } from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";
import { useMusic } from "../../context/MusicContext";
import {
    PlaylistPlayRoundedIcon,
    AddRoundedIcon,
    PlayArrowRoundedIcon
} from "../../components/icons";
import TrackCover from "../TrackCover";
import ScrollRow from "../ScrollRow";

const DEFAULT_COVER = "https://atomglide.of.by/storage/5.png";

const resolveImageUrl = (path) => {
    if (!path) return DEFAULT_COVER;
    let clean = String(path).trim();
    if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("//")) {
        return clean;
    }
    clean = clean.replace(/^\/+/, "");
    return clean.startsWith("storage/")
        ? `https://atomglide.of.by/${clean}`
        : `https://atomglide.of.by/storage/${clean}`;
};

export default function UserPlaylistsSection({ title = "Мои плейлисты" }) {
    const router = useRouter();
    const { isAuthed, requestLogin } = useAuth();
    const musicContext = useMusic ? useMusic() : {};
    const { playTrackNow } = musicContext;

    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPlaylists = async () => {
            if (!isAuthed) {
                setPlaylists([]);
                setLoading(false);
                return;
            }
            try {
                const res = await api.get("/music/playlists");
                const rawList = res.data.playlists || [];

                const normalized = rawList.map((pl) => {
                    const id = pl.id ?? pl.ID;
                    const plTitle = pl.title ?? pl.TITLE ?? "Без названия";
                    const rawCover = pl.cover ?? pl.COVER;
                    const count = pl.tracks_count ?? pl.TRACKS_COUNT ?? 0;

                    return {
                        id: Number(id) || id,
                        title: plTitle,
                        cover: resolveImageUrl(rawCover),
                        tracksCount: Number(count) || 0,
                    };
                });

                setPlaylists(normalized);
            } catch (err) {
                console.error("Ошибка загрузки плейлистов:", err);
            } finally {
                setLoading(false);
            }
        };

        loadPlaylists();
    }, [isAuthed]);

    const handleQuickPlay = async (e, playlistId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthed) {
            requestLogin();
            return;
        }

        try {
            const res = await api.get(`/music/playlists/${playlistId}`);
            const tracks = res.data.playlist?.tracks || [];
            if (tracks.length > 0 && playTrackNow) {
                const first = tracks[0];
                playTrackNow({
                    id: first.id ?? first.ID,
                    title: first.title ?? first.TITLE,
                    author: first.author ?? first.AUTHORS,
                    cover: resolveImageUrl(first.cover_main ?? first.COVER_MAIN ?? first.cover),
                    filePath: first.file_path ?? first.FILE_PATH
                });
            } else {
                router.push(`/playlist/${playlistId}`);
            }
        } catch {
            router.push(`/playlist/${playlistId}`);
        }
    };

    if (!isAuthed) {
        return (
            <Box sx={{ mb: 4, px: { xs: 2, sm: 4 } }}>
                <Typography sx={{ color: "#a0a0a0", fontSize: "14px", mb: 2 }}>{title}</Typography>
                <ScrollRow gap={{ xs: 1.5, sm: 2 }}>
                    <Box
                        sx={{
                            width: { xs: "38vw", sm: "180px" },
                            aspectRatio: "1 / 1",
                            borderRadius: "4px",
                            bgcolor: "#333333",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            px: 2,
                            cursor: "pointer",
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.02)" },
                        }}
                        onClick={() => requestLogin()}
                    >
                        <PlaylistPlayRoundedIcon sx={{ fontSize: 32, color: "rgba(255,255,255,0.4)", mb: 1 }} />
                        <Typography variant="body2" sx={{ color: "#fff", fontWeight: 700, mb: 0.5 }}>
                            Мои плейлисты
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>
                            Войдите в аккаунт
                        </Typography>
                    </Box>
                </ScrollRow>
            </Box>
        );
    }

    return (
        <Box sx={{ mb: 4, px: { xs: 2, sm: 4 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography sx={{ color: "#a0a0a0", fontSize: "14px" }}>{title}</Typography>
                <Link href="/playlists" style={{ textDecoration: "none" }}>
                    <Button
                        variant="outlined"
                        size="small"
                        sx={{
                            color: "#fff",
                            borderColor: "rgba(255,255,255,0.15)",
                            borderRadius: "800px",
                            textTransform: "none",
                            fontSize: "12px",
                            "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.05)" },
                        }}
                    >
                        Все плейлисты
                    </Button>
                </Link>
            </Box>

            {loading ? (
                <ScrollRow gap={{ xs: 1.5, sm: 2 }}>
                    {[...Array(5)].map((_, i) => (
                        <Box
                            key={i}
                            sx={{
                                width: { xs: "38vw", sm: "180px" },
                                aspectRatio: "1 / 1",
                                bgcolor: "#333333",
                                borderRadius: "4px",
                                flexShrink: 0,
                            }}
                        />
                    ))}
                </ScrollRow>
            ) : playlists.length === 0 ? (
                <Box
                    sx={{
                        textAlign: "center",
                        py: 4,
                        px: 2,
                        borderRadius: "4px",
                        bgcolor: "#141418",
                    }}
                >
                    <Typography color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                        У вас пока нет плейлистов
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 320, mx: "auto" }}>
                        Создайте свой первый плейлист и добавьте туда любимые треки
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddRoundedIcon />}
                        onClick={() => router.push("/playlist/create")}
                        sx={{ bgcolor: "#fff", color: "#000", fontWeight: 700, borderRadius: "20px" }}
                    >
                        Создать плейлист
                    </Button>
                </Box>
            ) : (
                <ScrollRow gap={{ xs: 1.5, sm: 2 }}>
                    {playlists.slice(0, 10).map((pl) => (
                        <Box
                            key={pl.id}
                            onClick={() => router.push(`/playlist/${pl.id}`)}
                            sx={{
                                width: { xs: "38vw", sm: "180px" },
                                minWidth: 0,
                                flexShrink: 0,
                                position: "relative",
                                display: "flex",
                                flexDirection: "column",
                                borderRadius: "4px",
                                overflow: "hidden",
                                cursor: "pointer",
                                transition: "transform 0.2s",
                                "&:hover": { transform: "scale(1.02)" },
                                "&:hover .cover-overlay": { opacity: 1 },
                            }}
                        >
                            <Box
                                sx={{
                                    position: "relative",
                                    width: "100%",
                                    aspectRatio: "1 / 1",
                                    bgcolor: "#555555",
                                    overflow: "hidden",
                                }}
                            >
                                <TrackCover src={pl.cover || DEFAULT_COVER} alt={pl.title} sizes="180px" />

                                <Box
                                    className="cover-overlay"
                                    sx={{
                                        position: "absolute",
                                        inset: 0,
                                        bgcolor: "rgba(0,0,0,0.5)",
                                        opacity: 0,
                                        transition: "opacity 0.2s",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <IconButton
                                        onClick={(e) => handleQuickPlay(e, pl.id)}
                                        sx={{
                                            color: "white",
                                            bgcolor: "rgba(255,255,255,0.2)",
                                            "&:hover": { bgcolor: "rgba(255,255,255,0.4)" },
                                        }}
                                    >
                                        <PlayArrowRoundedIcon sx={{ fontSize: 32 }} />
                                    </IconButton>
                                </Box>
                            </Box>

                            <Box sx={{ p: 1.5, width: "100%", boxSizing: "border-box" }}>
                                <Typography
                                    sx={{
                                        color: "white",
                                        fontSize: "14px",
                                        textAlign: "center",
                                        fontWeight: 600,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {pl.title}
                                </Typography>
                                <Typography
                                    sx={{
                                        color: "#939393",
                                        fontSize: "12px",
                                        whiteSpace: "nowrap",
                                        textAlign: "center",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {pl.tracksCount} {pl.tracksCount === 1 ? "трек" : pl.tracksCount < 5 ? "трека" : "треков"}
                                </Typography>
                            </Box>
                        </Box>
                    ))}

                    <Box
                        onClick={() => router.push("/playlist/create")}
                        sx={{
                            width: { xs: "38vw", sm: "180px" },
                            aspectRatio: "1 / 1",
                            borderRadius: "4px",
                            bgcolor: "#333333",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            px: 2,
                            cursor: "pointer",
                            flexShrink: 0,
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.02)" },
                        }}
                    >
                        <AddRoundedIcon sx={{ fontSize: 32, color: "rgba(255,255,255,0.4)", mb: 1 }} />
                        <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: 600 }}>
                            Создать плейлист
                        </Typography>
                    </Box>
                </ScrollRow>
            )}
        </Box>
    );
}