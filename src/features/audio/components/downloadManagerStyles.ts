import { StyleSheet } from 'react-native';

export const downloadManagerStyles = StyleSheet.create({
  container: {
    minHeight: 44,
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    marginStart: 8,
  },
  downloadingBox: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  downloadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  percentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(212, 167, 69, 0.25)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#D4A745',
  },
  cancelButton: {
    padding: 4,
    marginStart: 8,
  },
  controlButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginStart: 6,
  },
  controlButton: {
    padding: 6,
    borderRadius: 8,
  },
});
