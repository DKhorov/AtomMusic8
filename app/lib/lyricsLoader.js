let lyricsPromise = null;

export function loadLyrics() {
    if (!lyricsPromise) {
        lyricsPromise = import('../components/lyrics').catch(() => null);
    }
    return lyricsPromise;
}
