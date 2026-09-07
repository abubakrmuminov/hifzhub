import React, { useMemo } from 'react';
import { Text, StyleSheet, type TextStyle, type StyleProp } from 'react-native';
import { useTheme } from '@/shared/theme';

export interface HighlightedTextProps {
  text: string;
  highlight: string;
  style?: StyleProp<TextStyle>;
  highlightStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const HighlightedText: React.FC<HighlightedTextProps> = React.memo(
  ({ text, highlight, style, highlightStyle, numberOfLines }) => {
    const { colors } = useTheme();

    const parts = useMemo(() => {
      const trimmed = highlight.trim();
      if (!trimmed || trimmed.length < 2 || !text) {
        return [{ text, isMatch: false }];
      }

      // Split multiple search keywords
      const words = trimmed
        .split(/\s+/)
        .filter((w) => w.length >= 2)
        .map(escapeRegExp);

      if (words.length === 0) {
        return [{ text, isMatch: false }];
      }

      const regex = new RegExp(`(${words.join('|')})`, 'gi');
      const chunks = text.split(regex);

      return chunks.map((chunk) => {
        const isMatch = words.some(
          (w) => chunk.toLowerCase() === w.toLowerCase()
        );
        return { text: chunk, isMatch };
      });
    }, [text, highlight]);

    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {parts.map((part, index) => {
          if (!part.isMatch) {
            return <React.Fragment key={index}>{part.text}</React.Fragment>;
          }
          return (
            <Text
              key={index}
              style={[
                styles.highlight,
                {
                  backgroundColor: colors.primary + '25',
                  color: colors.primary,
                },
                highlightStyle,
              ]}
            >
              {part.text}
            </Text>
          );
        })}
      </Text>
    );
  }
);

const styles = StyleSheet.create({
  highlight: {
    fontWeight: '700',
    borderRadius: 3,
  },
});
