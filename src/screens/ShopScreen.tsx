import React, { useCallback, useMemo, useRef } from 'react';
import { ImageBackground, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { useThemePalette, shadow } from '../theme';
import { ITEM_BONUS, type ItemType } from '../types';
import { ITEM_PRICES } from '../lib/iapService';
import NoticeBanner from '../components/NoticeBanner';

const ITEM_PACK_QTY = 5;

const ITEMS: { type: ItemType; label: string; emoji: string }[] = [
  { type: 'snack', label: 'おやつ', emoji: '🍪' },
  { type: 'meal', label: 'ごはん', emoji: '🍚' },
  { type: 'feast', label: 'ごちそう', emoji: '🍽' },
];

export default function ShopScreen() {
  const palette = useThemePalette();
  const { state, actions } = useAppContext();
  const { session, notice, isPlanUpdating, isPurchasing, inventory } = state;
  const insets = useSafeAreaInsets();
  const currentPlan = session?.plan ?? 'free';
  const scrollRef = useRef<ScrollView>(null);
  useFocusEffect(useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []));

  const styles = useMemo(() => StyleSheet.create({
    background: { flex: 1 },
    content: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 120,
      gap: 20,
    },
    card: {
      backgroundColor: palette.surfaceAlpha,
      borderRadius: 20,
      padding: 20,
      gap: 14,
      ...shadow.md,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.ink,
    },
    // Plan section
    planCard: {
      backgroundColor: palette.accentSoft,
      borderRadius: 12,
      padding: 14,
      gap: 4,
    },
    planName: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.accent,
    },
    planDesc: {
      fontSize: 13,
      color: palette.text,
      lineHeight: 18,
    },
    plusBenefits: { gap: 2, marginTop: 4 },
    plusBenefitItem: {
      fontSize: 14,
      color: palette.accent,
      fontWeight: '600',
    },
    upgradeButton: {
      backgroundColor: palette.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center' as const,
    },
    upgradeButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    manageButton: {
      backgroundColor: palette.surface,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center' as const,
    },
    manageButtonText: {
      color: palette.accent,
      fontSize: 14,
      fontWeight: '600',
    },
    disabledButton: { opacity: 0.5 },
    // Item section
    itemCard: {
      backgroundColor: palette.surface,
      borderRadius: 14,
      padding: 16,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 14,
    },
    itemIconBox: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: palette.surfaceAlpha,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    itemInfo: { flex: 1, gap: 2 },
    itemName: {
      fontSize: 16,
      fontWeight: '700',
      color: palette.ink,
    },
    itemMeta: {
      fontSize: 12,
      color: palette.text,
      lineHeight: 18,
    },
    itemStock: {
      fontSize: 12,
      color: palette.accent,
      fontWeight: '600',
    },
    buyButton: {
      backgroundColor: palette.accent,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 16,
      alignItems: 'center' as const,
      minWidth: 90,
    },
    buyButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    buyButtonPrice: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 11,
      marginTop: 2,
    },
  }), [palette]);

  return (
    <ImageBackground source={require('../../assets/ui/background_settings.png')} style={styles.background} resizeMode="cover">
      <ScrollView ref={scrollRef} contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <NoticeBanner notice={notice} />

        {/* プラン */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>プラン</Text>
          {currentPlan === 'free' ? (
            <>
              <View style={styles.planCard}>
                <Text style={styles.planName}>Freeプラン</Text>
                <Text style={styles.planDesc}>1日5回までおはなしできます</Text>
              </View>
              <View style={styles.plusBenefits}>
                <Text style={styles.plusBenefitItem}>Plusプランの特典</Text>
                <Text style={styles.planDesc}>  ・ 広告なし</Text>
                <Text style={styles.planDesc}>  ・ ペット3匹まで登録</Text>
                <Text style={styles.planDesc}>  ・ 1日50回おはなし</Text>
              </View>
              <Pressable
                style={[styles.upgradeButton, isPlanUpdating && styles.disabledButton]}
                onPress={() => void actions.handlePlanUpgrade('plus')}
                disabled={isPlanUpdating}
              >
                <Text style={styles.upgradeButtonText}>
                  {isPlanUpdating ? '処理中...' : 'Plusにアップグレード（480円/月）'}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.planCard}>
                <Text style={styles.planName}>Plusプラン</Text>
                <Text style={styles.planDesc}>広告なし・ペット3匹・1日50回おはなし</Text>
              </View>
              <Pressable
                style={styles.manageButton}
                onPress={() => {
                  const url = Platform.OS === 'ios'
                    ? 'https://apps.apple.com/account/subscriptions'
                    : 'https://play.google.com/store/account/subscriptions';
                  void Linking.openURL(url);
                }}
              >
                <Text style={styles.manageButtonText}>サブスクリプションを管理</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* たべもの */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>たべもの</Text>
          <Text style={styles.planDesc}>
            たべものを使うと、ボーナスでもっとおはなしできます
          </Text>
          {ITEMS.map(({ type, label, emoji }) => (
            <View key={type} style={styles.itemCard}>
              <View style={styles.itemIconBox}>
                <Text style={{ fontSize: 24 }}>{emoji}</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{label} {ITEM_PACK_QTY}個</Text>
                <Text style={styles.itemMeta}>1個で +{ITEM_BONUS[type]}回おはなし</Text>
                <Text style={styles.itemStock}>いま {inventory[type]}個もっています</Text>
              </View>
              <Pressable
                style={[styles.buyButton, isPurchasing && styles.disabledButton]}
                onPress={() => void actions.handlePurchaseItem(type)}
                disabled={isPurchasing}
              >
                <Text style={styles.buyButtonText}>
                  {isPurchasing ? '処理中' : '購入する'}
                </Text>
                {!isPurchasing && (
                  <Text style={styles.buyButtonPrice}>{ITEM_PRICES[type]}</Text>
                )}
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}
