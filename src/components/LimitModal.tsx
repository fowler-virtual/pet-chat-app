import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AdRewardState, ItemInventory, ItemType, SubscriptionPlan } from '../types';
import { AD_VIEW_LIMIT, ITEM_BONUS } from '../types';
import { useThemePalette, shadow } from '../theme';
import { getTodayString } from '../lib/dateUtils';

const ITEM_EMOJI: Record<ItemType, string> = { snack: '🍪', meal: '🍚', feast: '🍽' };

const ITEM_LABELS: Record<ItemType, string> = { snack: 'おやつ', meal: 'ごはん', feast: 'ごちそう' };

const ITEMS: { type: ItemType; label: string; bonus: number }[] = [
  { type: 'snack', label: 'おやつ', bonus: 3 },
  { type: 'meal', label: 'ごはん', bonus: 5 },
  { type: 'feast', label: 'ごちそう', bonus: 10 },
];

export default function LimitModal({
  visible,
  inventory,
  plan,
  adReward,
  isAdLoading,
  remainingMessages,
  onUseItem,
  onAdReward,
  onClose,
}: {
  visible: boolean;
  inventory: ItemInventory;
  plan: SubscriptionPlan;
  adReward: AdRewardState;
  isAdLoading: boolean;
  remainingMessages: number;
  onUseItem: (item: ItemType) => void;
  onAdReward: () => void;
  onClose: () => void;
}) {
  const palette = useThemePalette();
  const [usedItem, setUsedItem] = useState<ItemType | 'ad' | null>(null);
  const hasAnyItem = inventory.snack > 0 || inventory.meal > 0 || inventory.feast > 0;
  const adToday = adReward.date === getTodayString() ? adReward.viewCount : 0;
  const adAvailable = plan === 'free' && adToday < AD_VIEW_LIMIT;
  const showResult = usedItem !== null;

  function handleUseItemLocal(type: ItemType) {
    onUseItem(type);
    setUsedItem(type);
  }

  function handleAdRewardLocal() {
    onAdReward();
    setUsedItem('ad');
  }

  function handleClose() {
    setUsedItem(null);
    onClose();
  }

  const styles = useMemo(() => StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(60,50,38,0.4)',
      justifyContent: 'center',
      padding: 24,
    },
    modalCard: {
      backgroundColor: palette.surface,
      borderRadius: 24,
      padding: 24,
      gap: 16,
      ...shadow.lg,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: palette.ink,
      textAlign: 'center',
    },
    lead: {
      fontSize: 14,
      lineHeight: 22,
      color: palette.text,
      textAlign: 'center',
    },
    talkButton: {
      backgroundColor: palette.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      ...shadow.sm,
    },
    talkButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 16,
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
      paddingVertical: 14,
    },
    itemEmoji: {
      fontSize: 28,
    },
    itemButtonDisabled: {
      opacity: 0.4,
    },
    itemLabel: {
      color: palette.ink,
      fontSize: 12,
      fontWeight: '600',
    },
    itemLabelDisabled: {
      color: palette.muted,
    },
    itemBonus: {
      color: palette.accent,
      fontSize: 12,
      fontWeight: '700',
    },
    itemBonusDisabled: {
      color: palette.muted,
    },
    itemStock: {
      color: palette.text,
      fontSize: 13,
      fontWeight: '600',
    },
    itemStockDisabled: {
      color: palette.muted,
    },
    adButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.secondary,
      borderRadius: 14,
      paddingVertical: 14,
    },
    adButtonDisabled: {
      backgroundColor: palette.chip,
    },
    adButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 14,
    },
    adButtonTextDisabled: {
      color: palette.muted,
    },
    closeButton: {
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
    },
    closeButtonText: {
      color: palette.muted,
      fontSize: 14,
    },
  }), [palette]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.modalBackdrop} onPress={handleClose} onStartShouldSetResponder={() => true}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()} onStartShouldSetResponder={() => true}>
          {showResult ? (
            <>
              <Text style={styles.title}>
                {usedItem === 'ad' ? 'おやつを獲得しました！' : `${ITEM_LABELS[usedItem!]}をあげました！`}
              </Text>
              <Text style={styles.lead}>
                {usedItem === 'ad'
                  ? 'おやつを使うとおはなしできるよ'
                  : `おはなしできる回数が${ITEM_BONUS[usedItem!]}回増えたよ！`}
              </Text>
              <Pressable style={styles.talkButton} onPress={usedItem === 'ad' ? () => setUsedItem(null) : handleClose}>
                <Text style={styles.talkButtonText}>{usedItem === 'ad' ? '閉じる' : 'おはなしする'}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>今日はいっぱいおはなししました</Text>
              <Text style={styles.lead}>
                {hasAnyItem
                  ? 'たべものを使うと、またおはなしできるよ'
                  : adAvailable
                    ? '動画を見ておやつをもらうと、またおはなしできるよ'
                    : 'また明日おはなししようね'}
              </Text>

              <View style={styles.itemRow}>
                {ITEMS.map(({ type, label, bonus }) => {
                  const count = inventory[type];
                  const disabled = count <= 0;
                  return (
                    <Pressable
                      key={type}
                      style={[styles.itemButton, disabled && styles.itemButtonDisabled]}
                      onPress={() => handleUseItemLocal(type)}
                      disabled={disabled}
                    >
                      <Text style={styles.itemEmoji}>{ITEM_EMOJI[type]}</Text>
                      <Text style={[styles.itemLabel, disabled && styles.itemLabelDisabled]}>{label}</Text>
                      <Text style={[styles.itemBonus, disabled && styles.itemBonusDisabled]}>+{bonus}回</Text>
                      <Text style={[styles.itemStock, disabled && styles.itemStockDisabled]}>×{count}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {plan === 'free' && (
                <Pressable
                  style={[styles.adButton, (!adAvailable || isAdLoading) && styles.adButtonDisabled]}
                  onPress={handleAdRewardLocal}
                  disabled={!adAvailable || isAdLoading}
                >
                  <Feather name="play-circle" size={16} color={adAvailable && !isAdLoading ? '#FFFFFF' : palette.muted} style={{ marginRight: 8 }} />
                  <Text style={[styles.adButtonText, (!adAvailable || isAdLoading) && styles.adButtonTextDisabled]}>
                    {isAdLoading ? '読み込み中...' : adAvailable ? '動画を見ておやつをもらう' : '今日の動画はすべて見ました'}
                  </Text>
                </Pressable>
              )}

              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>閉じる</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
