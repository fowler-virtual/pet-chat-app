import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, shadow } from '../theme';

export default React.memo(function NoticeBanner({ notice }: { notice: string | null }) {
  if (!notice) {
    return null;
  }

  return (
    <View style={styles.noticeCard}>
      <Text style={styles.noticeText}>{notice}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
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
});
