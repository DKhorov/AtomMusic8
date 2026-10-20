"use client";
import React, { useMemo } from 'react';
import Box from '@mui/material/Box';

export const PALETTES = {
    gray: {
        bg: ['#222222', '#2a2a2a', '#333333', '#1c1c1c'],
        fg: ['#8c8c8c', '#a6a6a6', '#bfbfbf', '#737373'],
    },
    blue: {
        bg: ['#131d24', '#182630', '#1c2d3a', '#0f171d'],
        fg: ['#3b82f6', '#60a5fa', '#2563eb', '#93c5fd'],
    },
    pink: {
        bg: ['#2b181e', '#3d2029', '#241317', '#341b23'],
        fg: ['#f472b6', '#fb7185', '#e11d48', '#fbcfe8'],
    },
    cyan: {
        bg: ['#132328', '#182f36', '#101c20', '#1f3d47'],
        fg: ['#22d3ee', '#06b6d4', '#67e8f9', '#0891b2'],
    },
    purple: {
        bg: ['#20152b', '#2c1c3c', '#181020', '#37224c'],
        fg: ['#a855f7', '#c084fc', '#9333ea', '#e9d5ff'],
    }
};

export const PATTERNS = {
    plus: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    playlist: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0, 1, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 1, 0, 0],
    ],
    heart: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 1, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    radio: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    feed: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    expand: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
};

function pseudoRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

export function PixelHeartIcon({ isFavorite, size = 14 }) {
    const height = Math.round((size * 9) / 10);
    return (
        <svg
            viewBox="0 0 10 9"
            width={size}
            height={height}
            style={{
                shapeRendering: 'crispEdges',
                display: 'block',
                fill: isFavorite ? '#ff2a6d' : 'rgba(255, 255, 255, 0.85)',
                filter: isFavorite ? 'drop-shadow(0 0 3px rgba(255, 42, 109, 0.7))' : 'none',
                transition: 'fill 0.2s, filter 0.2s',
            }}
        >
            {isFavorite ? (
                <path d="M2,0 h2 v1 h-2z M6,0 h2 v1 h-2z M1,1 h8 v3 h-8z M2,4 h6 v1 h-6z M3,5 h4 v1 h-4z M4,6 h2 v1 h-2z" />
            ) : (
                <path d="M2,0 h2 v1 h-2z M6,0 h2 v1 h-2z M1,1 h1 v3 h-1z M8,1 h1 v3 h-1z M4,1 h2 v1 h-2z M2,4 h1 v1 h-1z M7,4 h1 v1 h-1z M3,5 h1 v1 h-1z M6,5 h1 v1 h-1z M4,6 h2 v1 h-2z" />
            )}
        </svg>
    );
}

export default function PixelCover({ type = 'playlist', color = 'purple', seed = 42 }) {
    const palette = PALETTES[color] || PALETTES.gray;
    const grid = PATTERNS[type] || PATTERNS.playlist;

    const pixels = useMemo(() => {
        const result = [];
        let index = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const isFg = grid[r][c] === 1;
                const pool = isFg ? palette.fg : palette.bg;
                const randVal = Math.floor(pseudoRandom(seed + index) * pool.length);
                result.push({ key: `${r}-${c}`, color: pool[randVal] });
                index++;
            }
        }
        return result;
    }, [grid, palette, seed]);

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gridTemplateRows: 'repeat(8, 1fr)',
                userSelect: 'none',
            }}
        >
            {pixels.map((p) => (
                <Box key={p.key} sx={{ backgroundColor: p.color, width: '100%', height: '100%' }} />
            ))}
        </Box>
    );
}
