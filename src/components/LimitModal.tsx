import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ItemInventory, ItemType } from '../types';
import { palette, shadow } from '../theme';

export default function LimitModal({
  visible,
  inventory,
  onUseItem,
  onClose,
}: {
  visible: boolean;
  inventory: ItemInventory;
  onUseItem: (item: ItemType) => void;
  onClose: () => void;
}) {
  const hasAnyItem = inventory.snack > 0 || inventory.meal > 0 || inventory.feast > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View style={styles.modalCard}>
          <Text style={styles.panelTitle}>今日のおはなし回数を使い切りました</Text>
          {hasAnyItem ? (
            <>
              <Text style={styles.panelLead}>アイテムを使うと、おはなしできる回数が増えます。</Text>
              <View style={styles.itemRow}>
                {inventory.snack > 0 && (
                  <Pressable style={styles.itemButton} onPress={() => { onUseItem('snack'); onClose(); }}>
                    <MaterialCommunityIcons name="cookie" size={24} color={palette.accent} />
                    <Text style={styles.itemButtonText}>おやつ</Text>
                    <Text style={styles.itemCount}>×{inventory.snack}</Text>
                    <Text style={styles.itemUseHint}>おはなし+3回</Text>
                  </Pressable>
                )}
                {inventory.meal > 0 && (
                  <Pressable style={styles.itemButton} onPress={() => { onUseItem('meal'); onClose(); }}>
                    <MaterialCommunityIcons name="food-variant" size={24} color={palette.accent} />
                    <Text style={styles.itemButtonText}>ごはん</Text>
                    <Text style={styles.itemCount}>×{inventory.meal}</Text>
                    <Text style={styles.itemUseHint}>おはなし+5回</Text>
                  </Pressable>
                )}
                {inventory.feast > 0 && (
                  <Pressable style={styles.itemButton} onPress={() => { onUseItem('feast'); onClose(); }}>
                    <MaterialCommunityIcons name="silverware-fork-knife" size={24} color={palette.accent} />
                    <Text style={styles.itemButtonText}>ごちそう</Text>
                    <Text style={styles.itemCount}>×{inventory.feast}</Text>
                    <Text style={styles.itemUseHint}>おはなし+10回</Text>
                  </Pressable>
                )}
              </View>
            </>
          ) : (
            <Text style={styles.panelLead}>
              アイテムがありません。ホーム画面で広告を見るとおやつがもらえます。
            </Text>
          )}
          <Pressable style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>閉じる</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(60,50,38,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 20,
    maxHeight: '90%',
    ...shadow.lg,
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
  itemRow: {
    flexDirection: 'row',
    gap: 8,
  },
  itemButton: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.accentSoft,
    borderRadius: 14,
    paddingVertical: 12,
  },
  itemButtonText: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: '600',
  },
  itemCount: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  itemUseHint: {
    color: palette.text,
    fontSize: 10,
  },
  secondaryButton: {
    flexDirection: 'row',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  secondaryButtonText: {
    color: palette.accent,
    fontWeight: '600',
  },
});
