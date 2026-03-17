import { forwardRef, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemePalette } from '../theme';

interface QuoteCardProps {
  petName: string;
  species: string;
  quote: string;
  dateLabel?: string;
}

const speciesEmoji: Record<string, string> = {
  猫: '🐱',
  犬: '🐶',
  鳥: '🐦',
};

const QuoteCard = forwardRef<View, QuoteCardProps>(function QuoteCard(
  { petName, species, quote, dateLabel },
  ref,
) {
  const palette = useThemePalette();
  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: palette.secondary,
      borderRadius: 20,
      padding: 24,
      gap: 16,
      minHeight: 180,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    emojiCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emoji: {
      fontSize: 18,
    },
    petName: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    quote: {
      color: '#FFFFFF',
      fontSize: 20,
      lineHeight: 30,
      fontWeight: '700',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    date: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 12,
      fontWeight: '500',
    },
    hashtag: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 12,
      fontWeight: '700',
    },
  }), [palette]);

  const emoji = speciesEmoji[species] ?? '🐾';
  const today =
    dateLabel ??
    new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.emojiCircle}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <Text style={styles.petName}>{petName}</Text>
      </View>
      <Text style={styles.quote}>「{quote}」</Text>
      <View style={styles.footer}>
        <Text style={styles.date}>{today}</Text>
        <Text style={styles.hashtag}>#うちの子語録</Text>
      </View>
    </View>
  );
});

export default QuoteCard;

