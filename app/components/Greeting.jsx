"use client";
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

function timeGreeting(h) {
    if (h < 5) return 'Доброй ночи';
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
}

const PHRASES = [
    'Какие планы на вечер?',
    'Что послушаем сегодня?',
    'Пора в наушники',
    'Твоя очередь выбирать трек',
    'Музыка под твоё настроение',
    'Поставь что-нибудь новенькое',
    'Волна уже готова',
    'Подпевай, если знаешь слова',
    'Врубай громче',
    'Пусть играют сердце',
];

export default function Greeting() {

    const [greeting, setGreeting] = useState('Добрый вечер');
    const [phrase, setPhrase] = useState('Какие планы на вечер?');

    useEffect(() => {
        const now = new Date();
        setGreeting(timeGreeting(now.getHours()));
        setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
    }, []);

    return (
        <Box sx={{ px: { xs: 2, sm: 4 }, mb: 4 }}>
            <Typography sx={{ color: '#a0a0a0', fontSize: '12px', letterSpacing: '1px', mb: 1 }}>
                ATOMGLIDE MUSIC
            </Typography>
            <Typography sx={{ color: 'white', fontSize: '32px', fontWeight: 500 }}>
                {greeting}! {phrase}
            </Typography>
        </Box>
    );
}
