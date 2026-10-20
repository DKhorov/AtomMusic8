import Box from '@mui/material/Box';
import Greeting from './components/Greeting';
import PlaylistsSection from './components/sections/PlaylistsSection';
import UserPlaylistsSection from './components/sections/UserPlaylistsSection';
import WaveSection from './components/sections/WaveSection';
import SubtitlesSection from './components/sections/SubtitlesSection';
import AllTracksSection from './components/sections/AllTracksSection';

export default function Page() {
  return (
        <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              pt: 6,
              '&::-webkit-scrollbar': { display: 'none' }
            }}
        >
          <Greeting />

          <PlaylistsSection title="Главная" />
          <UserPlaylistsSection title="Мои плейлисты" />
          <WaveSection title="Твоя волна" />
          <SubtitlesSection title="Треки с субтитрами" />
          <AllTracksSection title="Все треки" />
        </Box>
  );
}
