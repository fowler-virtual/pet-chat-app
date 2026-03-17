import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemePalette } from '../theme';

interface Props {
  status: 'checking' | 'online' | 'offline';
  onRetry?: () => void;
}

export default React.memo(function OfflineBanner({ status, onRetry }: Props) {
  const palette = useThemePalette();
  const styles = useMemo(() => StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#FFF3F0',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginHorizontal: 20,
      marginTop: 8,
    },
    text: {
      flex: 1,
      fontSize: 13,
      color: palette.danger,
      fontWeight: '500',
    },
    retryButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: palette.danger,
    },
    retryText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
  }), [palette]);

  if (status !== 'offline') return null;

  return (
    <View style={styles.banner}>
      <Feather name="wifi-off" size={14} color={palette.danger} />
      <Text style={styles.text}>サーバーに接続できません</Text>
      {onRetry && (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>再接続</Text>
        </Pressable>
      )}
    </View>
  );
});
