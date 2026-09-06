import { StyleSheet } from 'react-native';

export const audioPlayerStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    start: 16,
    end: 16,
    zIndex: 100,
  },
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playButtonWrapper: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D6B4E',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    marginStart: 12,
    marginEnd: 8,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(212, 167, 69, 0.25)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#D4A745',
  },
});
