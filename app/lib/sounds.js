"use client";

let audioCtx = null;

function getCtx() {
    if (typeof window === "undefined") return null;
    if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
}

export function playClick() {
    try {

        const stored = typeof window !== "undefined" ? window.localStorage.getItem("atmusic:settings") : null;
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.clickSound === false) return;
        }
    } catch {}
    try {
        const ctx = getCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(1900, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.04);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    } catch {}
}
