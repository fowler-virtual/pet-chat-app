import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemePalette, shadow } from '../theme';

export default React.memo(function NoticeBanner({ notice }: { notice: string | null }) {
  const palette = useThemePalette();
  const styles = useMemo(() => StyleSheet.create({
    noticeCard: {
      backgroundColor: palette.accentSoft,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...shadow.sm,
    },
    noticeText: {
      color: palette.ink,
      lineHeight: 20,
      fontSize: 13,
    },
  }), [palette]);

  if (!notice) {
    return null;
  }

  return (
    <View style={styles.noticeCard}>
      <Text style={styles.noticeText}>{notice}</Text>
    </View>
  );
});
