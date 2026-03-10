import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme';

export default function ScreenHeader({
  title,
  subtitle,
  avatar,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  avatar?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <View style={[styles.screenHeader, compact && styles.screenHeaderCompact]}>
      {avatar && <View style={styles.screenHeaderAvatar}>{avatar}</View>}
      <View style={styles.screenHeaderTextWrap}>
        <Text style={[styles.screenTitle, compact && styles.screenTitleCompact]}>{title}</Text>
        {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  screenHeaderCompact: {
    minHeight: 44,
  },
  screenHeaderAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenHeaderTextWrap: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.ink,
    letterSpacing: -0.5,
  },
  screenTitleCompact: {
    fontSize: 22,
  },
  screenSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.text,
  },
});
