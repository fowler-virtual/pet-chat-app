import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { useThemePalette, shadow } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

export default function MemoryScreen() {
  const palette = useThemePalette();
  const { state } = useAppContext();
  const { pets, messagesByPetId } = state;

  const memoryRows = pets
    .flatMap((pet) =>
      (messagesByPetId[pet.id] ?? []).map((message) => ({
        petName: pet.name,
        text: message.text,
        time: message.time,
        sender: message.sender,
      })),
    )
    .slice(-12)
    .reverse();

  const styles = useMemo(() => StyleSheet.create({
    screenContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 120,
      gap: 20,
    },
    panelCard: {
      backgroundColor: palette.surface,
      borderRadius: 20,
      padding: 20,
      gap: 14,
      ...shadow.md,
    },
    panelTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.ink,
    },
    panelLead: {
      fontSize: 13,
      lineHeight: 20,
      color: palette.text,
    },
    memoryList: {
      gap: 10,
    },
    memoryItem: {
      backgroundColor: palette.surface,
      borderRadius: 16,
      padding: 16,
      gap: 4,
      ...shadow.sm,
    },
    memoryTitle: {
      color: palette.ink,
      fontSize: 15,
      fontWeight: '700',
    },
    memoryMeta: {
      color: palette.muted,
      fontSize: 11,
    },
    memoryText: {
      color: palette.text,
      lineHeight: 19,
      fontSize: 13,
    },
    emptyText: {
      color: palette.text,
      textAlign: 'center',
      paddingVertical: 40,
    },
  }), [palette]);

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <ScreenHeader title="思い出" subtitle="会話から生まれた最近の思い出や関係の蓄積を見る画面です。" />
      <View style={styles.panelCard}>
        <Text style={styles.panelTitle}>最近の思い出</Text>
        <Text style={styles.panelLead}>今は会話履歴をそのまま表示しています。将来は要約とアルバムに発展させます。</Text>
        <View style={styles.memoryList}>
          {memoryRows.length > 0 ? (
            memoryRows.map((row, index) => (
              <View key={`${row.petName}-${row.time}-${index}`} style={styles.memoryItem}>
                <Text style={styles.memoryTitle}>{row.petName}</Text>
                <Text style={styles.memoryMeta}>{row.time} / {row.sender === 'pet' ? 'ペット' : '飼い主'}</Text>
                <Text style={styles.memoryText}>{row.text}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>会話が増えると、ここに思い出がたまります。</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

