import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function PlayerBar() {
    return (
        <Box
            sx={{
                mt: 'auto',
                width: '100%',
                height: '90px',
                bgcolor: '#121212',
                display: 'flex',
                alignItems: 'center',
                px: 4,
                justifyContent: 'space-between',
                flexShrink: 0
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                    component="img"
                    src="https://atomglide.com/1.png"
                    sx={{ width: '56px', height: '56px', borderRadius: '4px', objectFit: 'cover' }}
                />
                <Box>
                    <Typography sx={{ color: 'white', fontSize: '16px', fontWeight: 500 }}>
                        Ты ж мяне падманула (Live)
                    </Typography>
                    <Typography sx={{ color: '#a0a0a0', fontSize: '14px' }}>
                        ВИА Песняры
                    </Typography>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Typography sx={{ fontSize: '12px' }}>{"<<"}</Typography>
                </Box>
                <Box sx={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Typography sx={{ fontSize: '12px' }}>{"||"}</Typography>
                </Box>
                <Box sx={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Typography sx={{ fontSize: '12px' }}>{">>"}</Typography>
                </Box>
            </Box>
        </Box>
    );
}
