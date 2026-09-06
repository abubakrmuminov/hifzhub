import { useState, useCallback, useMemo } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePlayer } from './usePlayer';
import { RECITERS } from '../services/trackPlayer';

export const useMiniPlayer = () => {
  const { t } = useTranslation();
  const player = usePlayer();
  const { isPlaying, position, duration, currentTrack, play, pause, seekTo } = player;
  const [progressBarWidth, setProgressBarWidth] = useState<number>(1);

  const reciterName = useMemo(() => {
    if (!currentTrack?.reciter) return '';
    for (const [key, id] of Object.entries(RECITERS)) {
      if (id === currentTrack.reciter || key === currentTrack.reciter) {
        return t(`reciters.${key}`, { defaultValue: key });
      }
    }
    return currentTrack.reciter;
  }, [currentTrack?.reciter, t]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      void pause();
    } else {
      void play();
    }
  }, [isPlaying, pause, play]);

  const handleProgressLayout = useCallback((e: LayoutChangeEvent) => {
    setProgressBarWidth(e.nativeEvent.layout.width || 1);
  }, []);

  const handleProgressPress = useCallback(
    (e: any) => {
      if (!duration || duration <= 0) return;
      const touchX = e.nativeEvent.locationX ?? 0;
      const ratio = Math.max(0, Math.min(1, touchX / progressBarWidth));
      void seekTo(ratio * duration);
    },
    [duration, progressBarWidth, seekTo]
  );

  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;
  const progressPercent = `${Math.round(progressRatio * 100)}%` as const;

  return {
    ...player,
    t,
    reciterName,
    handlePlayPause,
    handleProgressLayout,
    handleProgressPress,
    progressPercent,
  };
};
