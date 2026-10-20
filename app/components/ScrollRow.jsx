"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';

const FADE_BG = '#0a0a0a';

export default function ScrollRow({ children, gap = 2, fadeWidth = 56, sx }) {
    const scrollRef = useRef(null);
    const [edges, setEdges] = useState({ left: false, right: false });

    const update = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        const left = el.scrollLeft > 2;
        const right = max > 2 && el.scrollLeft < max - 2;
        setEdges((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const frame = requestAnimationFrame(update);
        el.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        const mutations = typeof MutationObserver !== 'undefined' ? new MutationObserver(update) : null;
        if (mutations) mutations.observe(el, { childList: true });
        const size = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
        if (size) size.observe(el);
        return () => {
            cancelAnimationFrame(frame);
            el.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
            if (mutations) mutations.disconnect();
            if (size) size.disconnect();
        };
    }, [update]);

    return (
        <Box sx={{ position: 'relative', ...sx }}>
            <Box
                ref={scrollRef}
                sx={{
                    display: 'flex',
                    gap,
                    overflowX: 'auto',
                    pb: 1,
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                }}
            >
                {children}
            </Box>
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: fadeWidth,
                    zIndex: 2,
                    pointerEvents: 'none',
                    opacity: edges.left ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    background: `linear-gradient(to right, ${FADE_BG} 10%, rgba(10,10,10,0))`,
                }}
            />
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: 0,
                    width: fadeWidth,
                    zIndex: 2,
                    pointerEvents: 'none',
                    opacity: edges.right ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    background: `linear-gradient(to left, ${FADE_BG} 10%, rgba(10,10,10,0))`,
                }}
            />
        </Box>
    );
}
