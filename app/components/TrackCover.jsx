"use client";
import { useState } from 'react';
import Image from 'next/image';
import { DEFAULT_COVER } from '../lib/trackFormat';

export default function TrackCover({ src, alt = '', sizes = '128px', style = {} }) {
    const [broken, setBroken] = useState(false);

    const url = broken || !src ? DEFAULT_COVER : src;

    return (
        <Image
            key={`${src || 'default'}-${broken ? 'fallback' : 'src'}`}
            src={url}
            alt={alt}
            fill
            unoptimized
            sizes={sizes}
            draggable={false}
            onError={() => setBroken(true)}
            style={{ objectFit: 'cover', width: '100%', height: '100%', ...style }}
        />
    );
}
