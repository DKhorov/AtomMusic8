"use client";
import React from 'react';
import Box from '@mui/material/Box';
import {
    ArrowLeft,
    ArrowsDownUp,
    Bell,
    CaretDown,
    CaretLeft,
    CaretRight,
    CaretUp,
    Cloud,
    CloudArrowUp,
    CursorClick,
    DotsSixVertical,
    Equalizer,
    FastForward,
    GearSix,
    Heart,
    Headphones,
    Image,
    Microphone,
    MusicNote,
    Pause,
    Play,
    PlayCircle,
    Playlist,
    Plus,
    Queue,
    Repeat,
    Rewind,
    SignOut,
    SkipBack,
    SkipForward,
    Sparkle,
    SpeakerHigh,
    Subtitles,
    Trash,
    Upload,
    User,
    X,
} from '@phosphor-icons/react';

const SIZE_MAP = { small: 20, medium: 24, large: 35, inherit: '1em' };

const BASE_SX = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    verticalAlign: 'middle',
};

function makeIcon(Icon, weight) {
    function WrappedIcon({ sx, fontSize, color, style, ...rest }) {
        const size = SIZE_MAP[fontSize] ?? fontSize;

        return (
            <Box
                component="span"
                style={style}
                sx={[
                    BASE_SX,
                    size != null ? { fontSize: typeof size === 'number' ? `${size}px` : size } : null,
                    color != null ? { color } : null,
                    sx || null,
                ]}
                {...rest}
            >
                <Icon weight={weight} style={{ width: '1em', height: '1em', display: 'block' }} />
            </Box>
        );
    }

    WrappedIcon.displayName = `Icon(${Icon.displayName || 'Icon'})`;
    return WrappedIcon;
}

export const PlayArrowIcon = makeIcon(Play, 'fill');
export const PlayArrowRoundedIcon = PlayArrowIcon;
export const PauseIcon = makeIcon(Pause, 'fill');
export const PauseRoundedIcon = PauseIcon;
export const SkipNextIcon = makeIcon(SkipForward, 'fill');
export const SkipNextRoundedIcon = SkipNextIcon;
export const SkipPreviousIcon = makeIcon(SkipBack, 'fill');
export const SkipPreviousRoundedIcon = SkipPreviousIcon;
export const RewindIcon = makeIcon(Rewind, 'fill');
export const Replay10Icon = RewindIcon;
export const FastForwardIcon = makeIcon(FastForward, 'fill');
export const Forward10Icon = FastForwardIcon;
export const ArrowBackRoundedIcon = makeIcon(ArrowLeft, 'bold');
export const ExpandMoreRoundedIcon = makeIcon(CaretDown, 'bold');
export const KeyboardArrowDownIcon = ExpandMoreRoundedIcon;
export const ExpandLessRoundedIcon = makeIcon(CaretUp, 'bold');
export const PaginationPrevIcon = makeIcon(CaretLeft, 'bold');
export const PaginationNextIcon = makeIcon(CaretRight, 'bold');
export const CloseRoundedIcon = makeIcon(X, 'bold');
export const AddRoundedIcon = makeIcon(Plus, 'bold');
export const SettingsRoundedIcon = makeIcon(GearSix, 'fill');
export const PersonRoundedIcon = makeIcon(User, 'fill');
export const HeadphonesRoundedIcon = makeIcon(Headphones, 'fill');
export const FavoriteIcon = makeIcon(Heart, 'fill');
export const FavoriteRoundedIcon = FavoriteIcon;
export const FavoriteBorderIcon = makeIcon(Heart, 'regular');
export const FavoriteBorderRoundedIcon = FavoriteBorderIcon;
export const GraphicEqRoundedIcon = makeIcon(Equalizer, 'fill');
export const VolumeUpRoundedIcon = makeIcon(SpeakerHigh, 'fill');
export const TouchAppRoundedIcon = makeIcon(CursorClick, 'fill');
export const SwapVertRoundedIcon = makeIcon(ArrowsDownUp, 'bold');
export const RepeatRoundedIcon = makeIcon(Repeat, 'bold');
export const QueueMusicRoundedIcon = makeIcon(Queue, 'fill');
export const DragHandleIcon = makeIcon(DotsSixVertical, 'bold');
export const PlaylistPlayRoundedIcon = makeIcon(Playlist, 'fill');
export const PlayCircleOutlineRoundedIcon = makeIcon(PlayCircle, 'fill');
export const NotificationsRoundedIcon = makeIcon(Bell, 'fill');
export const LogoutRoundedIcon = makeIcon(SignOut, 'bold');
export const DeleteOutlineRoundedIcon = makeIcon(Trash, 'regular');
export const SlowMotionVideoRoundedIcon = makeIcon(Sparkle, 'fill');
export const SubtitlesIcon = makeIcon(Subtitles, 'fill');
export const SubtitlesRoundedIcon = SubtitlesIcon;
export const SubtitlesOutlinedIcon = makeIcon(Subtitles, 'regular');

export const UploadRoundedIcon = makeIcon(Upload, 'bold');
export const CloudUploadRoundedIcon = makeIcon(CloudArrowUp, 'bold');
export const ImageRoundedIcon = makeIcon(Image, 'bold');
export const DeleteRoundedIcon = makeIcon(Trash, 'bold');
export const MicRoundedIcon = makeIcon(Microphone, 'bold');
export const AlbumRoundedIcon = makeIcon(MusicNote, 'bold');
export const SaveRoundedIcon = makeIcon(CloudArrowUp, 'bold');
export const DragIndicatorRoundedIcon = makeIcon(DotsSixVertical, 'bold');
