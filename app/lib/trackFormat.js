export const DEFAULT_COVER = "/5.png";

export function normalizeImageUrl(filePath) {
    if (!filePath) return DEFAULT_COVER;
    let url = filePath;
    url = url.replace("http://localhost:3001", "").replace("https://localhost:3001", "");
    url = url.replace("https://api.atomglide.of.by", "").replace("http://api.atomglide.of.by", "");
    url = url.replace("https://atomglide.com", "").replace("http://atomglide.com", "").replace("https://www.atomglide.com", "");
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (!url.startsWith("/")) url = "/" + url;
    if (!url.startsWith("/storage/")) url = "/storage" + url;
    return `https://atomglide.of.by${url}`;
}

export function formatTrackRow(t) {
    const trackId = t.ID || t.id || t.Id || 0;

    let author = "Неизвестен";
    const genresRaw = t.GENRES || t.genres || t.Genres;
    const authorsRaw = t.AUTHORS || t.authors || t.Authors;
    
    // В БД genres содержит исполнителя, authors — жанр
    try { author = JSON.parse(genresRaw).join(", "); } catch {}
    if (author === "Неизвестен") {
        try { author = JSON.parse(authorsRaw).join(", "); }
        catch { author = genresRaw || authorsRaw || "Неизвестен"; }
    }

    const cover = normalizeImageUrl(
        t.COVER_MAIN || t.coverMain || t.CoverMain || (trackId ? `https://atomglide.of.by/api/music/cover/${trackId}` : "")
    );

    return {
        id: trackId,
        title: t.TITLE || t.title || t.Title || "Без названия",
        author,
        album: t.ALBUM || t.album || t.Album || "Single",
        cover,
        streamUrl: `https://atomglide.of.by/api/music/stream/${trackId}`,
    };
}
