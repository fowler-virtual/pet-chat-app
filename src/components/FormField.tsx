import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme';

export function FormField({ children }: { children: React.ReactNode }) {
  return <View style={styles.formField}>{children}</View>;
}

export function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

const styles = StyleSheet.create({
  formField: {
    gap: 8,
  },
  fieldLabel: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: -2,
  },
});
