import React, { useCallback, useMemo, useRef } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
// @ts-expect-error — vendor type declarations missing in @expo/vector-icons build
import { Ionicons } from '@expo/vector-icons';

import { useAppContext } from '../context/AppContext';
import { useThemePalette, shadow } from '../theme';
import { AD_VIEW_LIMIT } from '../types';
import { getTodayString } from '../lib/dateUtils';
import { createInitialPetLine } from '../lib/petPersona';
import PetAvatar from '../components/PetAvatar';
import NoticeBanner from '../components/NoticeBanner';
import OfflineBanner from '../components/OfflineBanner';

export default function TodayScreen() {
  const palette = useThemePalette();
  const { state, dispatch, actions, dailyLimit, remainingMessages } = useAppContext();
  const { pets, inventory, adReward, notice, apiStatus, isAdLoading } = state;
  const plan = state.session?.plan ?? 'free';
  const isExhausted = remainingMessages <= 0;
  const hasAnyItem = inventory.snack > 0 || inventory.meal > 0 || inventory.feast > 0;
  const navigation = useNavigation<any>();

  const scrollRef = useRef<ScrollView>(null);
  useFocusEffect(useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []));

  const featuredPet = pets.length > 0 ? pets[0] : null;

  const todayLine = useMemo(
    () => (featuredPet ? createInitialPetLine(featuredPet) : ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [featuredPet?.id],
  );

  const isFoodNotice = notice !== null && (notice.includes('もらったよ') || notice.includes('使いました'));

  const adToday = adReward.date === getTodayString() ? adReward.viewCount : 0;
  const adRemaining = AD_VIEW_LIMIT - adToday;
  const adExhausted = adRemaining <= 0;
  const isPlusUser = plan === 'plus';
  const adAvailable = !adExhausted;

  const progressRatio = dailyLimit > 0 ? remainingMessages / dailyLimit : 0;

  const styles = useMemo(() => StyleSheet.create({
    bg: { flex: 1 },
    content: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 130,
      alignItems: 'center',
    },
    avatarArea: {
      marginTop: 8,
      marginBottom: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarRing: {
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 3,
      borderColor: 'rgba(200, 149, 108, 0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.65)',
      ...shadow.lg,
    },
    petName: {
      fontSize: 22,
      fontWeight: '700',
      color: palette.ink,
      marginBottom: 12,
    },
    bubble: {
      position: 'relative',
      backgroundColor: 'rgba(255,255,255,0.92)',
      borderRadius: 20,
      paddingHorizontal: 24,
      paddingVertical: 16,
      maxWidth: '92%',
      marginBottom: 24,
      ...shadow.md,
    },
    bubbleTail: {
      position: 'absolute',
      top: -8,
      left: '50%',
      marginLeft: -8,
      width: 0,
      height: 0,
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderBottomWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: 'rgba(255,255,255,0.92)',
    },
    bubbleText: {
      fontSize: 16,
      lineHeight: 26,
      color: palette.ink,
    },
    talkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.accent,
      borderRadius: 30,
      paddingVertical: 18,
      width: '80%',
      gap: 10,
      marginBottom: 24,
      borderBottomWidth: 4,
      borderBottomColor: 'rgba(255,255,255,0.4)',
      ...shadow.lg,
    },
    talkBtnText: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '700',
    },
    card: {
      backgroundColor: 'rgba(255,255,255,0.92)',
      borderRadius: 20,
      padding: 18,
      width: '100%',
      gap: 8,
      marginBottom: 16,
      ...shadow.sm,
    },
    remainRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      gap: 4,
    },
    remainLabel: {
      fontSize: 15,
      color: palette.ink,
      fontWeight: '600',
    },
    remainNumber: {
      fontSize: 28,
      fontWeight: '700',
      color: palette.accent,
      lineHeight: 32,
    },
    progressContainer: {
      width: '100%',
      marginTop: 4,
    },
    progressTrack: {
      width: '100%',
      height: 12,
      borderRadius: 6,
      backgroundColor: palette.chip,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 6,
      backgroundColor: palette.accent,
    },
    exhaustedHint: {
      fontSize: 13,
      color: palette.accent,
      textAlign: 'center',
      fontWeight: '600',
    },
    cardHighlight: {
      borderWidth: 2,
      borderColor: palette.accent,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: palette.ink,
    },
    cardDesc: {
      fontSize: 11,
      color: palette.muted,
    },
    itemsRow: {
      flexDirection: 'column',
      gap: 6,
    },
    itemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: palette.accentSoft,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    itemIconBox: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemEmoji: {
      fontSize: 22,
    },
    itemDisabled: {
      opacity: 0.4,
    },
    itemName: {
      fontSize: 14,
      color: palette.ink,
      fontWeight: '600',
    },
    itemBonus: {
      fontSize: 12,
      color: palette.accent,
      fontWeight: '700',
    },
    itemStock: {
      fontSize: 13,
      color: palette.text,
      fontWeight: '600',
    },
    adBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: palette.secondary,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    adBtnDisabled: {
      backgroundColor: palette.chip,
    },
    adBtnText: {
      flex: 1,
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 14,
    },
    adBtnTextDisabled: {
      color: palette.muted,
    },
    adBtnSub: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 12,
      flexShrink: 0,
    },
    foodNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: palette.accentSoft,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    foodNoticeText: {
      flex: 1,
      fontSize: 13,
      color: palette.accent,
      fontWeight: '600',
    },
    otherPetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 6,
    },
    otherPetName: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: palette.ink,
    },
  }), [palette]);

  return (
    <ImageBackground source={require('../../assets/ui/background_home.png')} style={styles.bg} resizeMode="cover">
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
        <NoticeBanner notice={isFoodNotice ? null : notice} />
        <OfflineBanner status={apiStatus} onRetry={() => void actions.retryConnection()} />

        {featuredPet && (
          <>
            {/* -------- 1. Pet avatar -------- */}
            <View style={styles.avatarArea}>
              <View style={styles.avatarRing}>
                <PetAvatar pet={featuredPet} size={120} />
              </View>
            </View>

            {/* -------- 2. Pet name -------- */}
            <Text style={styles.petName}>{featuredPet.name}</Text>

            {/* -------- 3. Speech bubble -------- */}
            <View style={styles.bubble}>
              <View style={styles.bubbleTail} />
              <Text style={styles.bubbleText}>{todayLine}</Text>
            </View>

            {/* -------- 4. Main CTA: Talk button -------- */}
            <Pressable
              style={styles.talkBtn}
              onPress={() => {
                dispatch({ type: 'SET_SELECTED_PET_ID', petId: featuredPet.id });
                navigation.navigate('Talk');
              }}
            >
              <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
              <Text style={styles.talkBtnText}>はなす</Text>
            </Pressable>

            {/* -------- 5. Remaining conversation count -------- */}
            <View style={styles.card}>
              {isExhausted ? (
                <>
                  <View style={styles.remainRow}>
                    <Text style={styles.remainLabel}>今日はいっぱいおはなししました</Text>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTrack} />
                  </View>
                  <Text style={styles.exhaustedHint}>
                    {hasAnyItem
                      ? 'たべものを使うと、またおはなしできるよ'
                      : adAvailable
                        ? (isPlusUser ? 'おやつをもらうと、またおはなしできるよ' : '動画を見ておやつをもらうと、また話せるよ')
                        : 'また明日おはなししようね'}
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.remainRow}>
                    <Text style={styles.remainLabel}>あと</Text>
                    <Text style={styles.remainNumber}>{remainingMessages}</Text>
                    <Text style={styles.remainLabel}>回おはなしできます</Text>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* -------- 6. Food items -------- */}
            <View style={[styles.card, isExhausted && hasAnyItem && styles.cardHighlight]}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>たべもの</Text>
                <Text style={styles.cardDesc}>
                  {isExhausted ? 'おはなしの回数を増やせます' : '使うとおはなしできる回数が増えます'}
                </Text>
              </View>
              <View style={styles.itemsRow}>
                <Pressable
                  style={[styles.itemCard, inventory.snack <= 0 && styles.itemDisabled]}
                  onPress={() => actions.handleUseItem('snack')}
                  disabled={inventory.snack <= 0}
                >
                  <View style={styles.itemIconBox}><Text style={styles.itemEmoji}>🍪</Text></View>
                  <Text style={styles.itemName}>おやつ</Text>
                  <Text style={styles.itemBonus}>(+3回)</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={styles.itemStock}>×{inventory.snack}</Text>
                </Pressable>
                <Pressable
                  style={[styles.itemCard, inventory.meal <= 0 && styles.itemDisabled]}
                  onPress={() => actions.handleUseItem('meal')}
                  disabled={inventory.meal <= 0}
                >
                  <View style={styles.itemIconBox}><Text style={styles.itemEmoji}>🍚</Text></View>
                  <Text style={styles.itemName}>ごはん</Text>
                  <Text style={styles.itemBonus}>(+5回)</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={styles.itemStock}>×{inventory.meal}</Text>
                </Pressable>
                <Pressable
                  style={[styles.itemCard, inventory.feast <= 0 && styles.itemDisabled]}
                  onPress={() => actions.handleUseItem('feast')}
                  disabled={inventory.feast <= 0}
                >
                  <View style={styles.itemIconBox}><Text style={styles.itemEmoji}>🍽</Text></View>
                  <Text style={styles.itemName}>ごちそう</Text>
                  <Text style={styles.itemBonus}>(+10回)</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={styles.itemStock}>×{inventory.feast}</Text>
                </Pressable>
              </View>

              {isFoodNotice && (
                <View style={styles.foodNotice}>
                  <Feather name="check-circle" size={14} color={palette.accent} />
                  <Text style={styles.foodNoticeText}>{notice}</Text>
                </View>
              )}

              {/* Ad reward / Plus skip button */}
              <Pressable
                style={[styles.adBtn, (adExhausted || isAdLoading) && styles.adBtnDisabled]}
                onPress={() => void actions.handleAdReward()}
                disabled={adExhausted || isAdLoading}
              >
                <View style={styles.itemIconBox}><Feather name={isPlusUser ? 'gift' : 'play-circle'} size={22} color={(adExhausted || isAdLoading) ? palette.muted : '#FFFFFF'} /></View>
                <Text style={[styles.adBtnText, (adExhausted || isAdLoading) && styles.adBtnTextDisabled]}>
                  {isAdLoading ? '読み込み中...'
                    : adExhausted ? (isPlusUser ? '今日はすべてもらいました' : '今日の動画はすべて見ました')
                    : isPlusUser ? 'たべものをもらう' : '動画を見ておやつをもらう'}
                </Text>
                {!adExhausted && !isAdLoading && (
                  <Text style={styles.adBtnSub}>あと{adRemaining}回</Text>
                )}
              </Pressable>
            </View>

            {/* Other pets */}
            {pets.length > 1 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>ほかの子</Text>
                {pets.filter(p => p.id !== featuredPet.id).map((pet) => (
                  <Pressable
                    key={pet.id}
                    style={styles.otherPetRow}
                    onPress={() => { dispatch({ type: 'SET_SELECTED_PET_ID', petId: pet.id }); navigation.navigate('Talk'); }}
                  >
                    <PetAvatar pet={pet} size={40} />
                    <Text style={styles.otherPetName}>{pet.name}</Text>
                    <Feather name="message-circle" size={16} color={palette.accent} />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

