import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette, shadow } from '../theme';
import { ITEM_BONUS } from '../types';
import type { ItemType, ItemInventory } from '../types';

const ITEM_ICON: Record<ItemType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  snack: 'cookie',
  meal: 'food-variant',
  feast: 'silverware-fork-knife',
};

const ITEM_LABEL: Record<ItemType, string> = {
  snack: 'おやつ',
  meal: 'ごはん',
  feast: 'ごちそう',
};

interface Props {
  itemType: ItemType | null;
  inventory: ItemInventory;
  onConfirm: () => void;
  onClose: () => void;
}

export default function UseItemConfirmModal({ itemType, inventory, onConfirm, onClose }: Props) {
  return (
    <Modal visible={Boolean(itemType)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modal} onPress={() => {}}>
          {itemType && (
            <>
              <MaterialCommunityIcons name={ITEM_ICON[itemType]} size={48} color={palette.accent} />
              <Text style={styles.title}>{ITEM_LABEL[itemType]}を使いますか？</Text>
              <Text style={styles.message}>
                おはなしできる回数が{ITEM_BONUS[itemType]}回増えます{'\n'}（のこり {inventory[itemType]}個 → {inventory[itemType] - 1}個）
              </Text>
              <Pressable style={[styles.primaryButton, { alignSelf: 'stretch' }]} onPress={onConfirm}>
                <Text style={styles.primaryButtonText}>使う</Text>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>やめる</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(60,50,38,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 14,
    ...shadow.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.ink,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: palette.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: palette.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadow.sm,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: palette.muted,
    fontSize: 14,
  },
});
