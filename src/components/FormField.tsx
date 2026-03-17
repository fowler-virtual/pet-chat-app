import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemePalette } from '../theme';

export function FormField({ children }: { children: React.ReactNode }) {
  const palette = useThemePalette();
  const styles = useMemo(() => StyleSheet.create({
    formField: {
      gap: 8,
    },
  }), [palette]);
  return <View style={styles.formField}>{children}</View>;
}

export function FieldLabel({ text }: { text: string }) {
  const palette = useThemePalette();
  const styles = useMemo(() => StyleSheet.create({
    fieldLabel: {
      color: palette.text,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: -2,
    },
  }), [palette]);
  return <Text style={styles.fieldLabel}>{text}</Text>;
}
