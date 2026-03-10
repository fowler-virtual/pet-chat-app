import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { palette, shadow } from '../theme';
import { AD_VIEW_LIMIT } from '../types';
import { createInitialPetLine } from '../lib/petPersona';
import { daysSince } from '../lib/dateUtils';
import PetAvatar from '../components/PetAvatar';
import NoticeBanner from '../components/NoticeBanner';
import OfflineBanner from '../components/OfflineBanner';
import QuoteCard from '../components/QuoteCard';
import { shareQuoteAsImage } from '../lib/shareQuote';

export default function TodayScreen() {
  const { state, dispatch, actions } = useAppContext();
  const { pets, userStats, inventory, adReward, notice, apiStatus } = state;
  const plan = state.session?.plan ?? 'free';
  const navigation = useNavigation<any>();

  const quoteCardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

  const featuredPet = useMemo(
    () => (pets.length > 0 ? pets[Math.floor(Math.random() * pets.length)] : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pets.length],
  );

  const todayLine = useMemo(
    () => (featuredPet ? createInitialPetLine(featuredPet) : ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [featuredPet?.id],
  );

  const daysActive = daysSince(userStats.firstOpenDate);

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <NoticeBanner notice={notice} />
      <OfflineBanner status={apiStatus} onRetry={() => void actions.retryConnection()} />

      {featuredPet ? (
        <>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowLarge} />
            <View style={styles.heroGlowSmall} />
            <Text style={styles.eyebrow}>今のきもち</Text>
            <View style={styles.todayHeroIdentity}>
              <PetAvatar pet={featuredPet} size={48} />
              <Text style={styles.todayPetName}>{featuredPet.name}</Text>
            </View>
            <Text style={styles.todayHeroLine}>{todayLine}</Text>
            <Pressable
              style={styles.heroShareButton}
              disabled={isSharing}
              onPress={async () => {
                setIsSharing(true);
                try {
                  await shareQuoteAsImage(quoteCardRef, featuredPet.name, todayLine);
                } catch {
                  // sharing cancelled or failed — silent
                } finally {
                  setIsSharing(false);
                }
              }}
            >
              <Feather name="share" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.heroShareButtonText}>
                {isSharing ? 'シェア中…' : 'シェア'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.hiddenCapture}>
            <QuoteCard
              ref={quoteCardRef}
              petName={featuredPet.name}
              species={featuredPet.species}
              quote={todayLine}
            />
          </View>

          {pets.map((pet) => (
            <View key={pet.id} style={styles.profileCard}>
              <PetAvatar pet={pet} size={56} />
              <View style={styles.profileCardText}>
                <Text style={styles.profileCardName}>{pet.name}</Text>
                <Text style={styles.profileCardMeta}>{pet.species} ・ {pet.gender}</Text>
              </View>
              <Pressable style={styles.profileTalkButton} onPress={() => { dispatch({ type: 'SET_SELECTED_PET_ID', petId: pet.id }); navigation.navigate('Talk'); }}>
                <Text style={styles.profileTalkButtonText}>話す</Text>
              </Pressable>
            </View>
          ))}

          {plan === 'free' && (
            <View style={styles.featureCard}>
              <Text style={styles.inventoryTitle}>たべもの</Text>
              <Text style={styles.inventoryHeading}>使うとおはなしできる回数が増えます</Text>
              <View style={styles.inventoryRow}>
                <Pressable
                  style={[styles.inventoryItem, inventory.snack <= 0 && styles.disabledButton]}
                  onPress={() => actions.handleUseItem('snack')}
                  disabled={inventory.snack <= 0}
                >
                  <MaterialCommunityIcons name="cookie" size={20} color={palette.accent} />
                  <Text style={styles.inventoryLabel}>おやつ</Text>
                  <Text style={styles.inventoryCount}>×{inventory.snack}</Text>
                  <Text style={styles.inventoryUse}>使う（+3回）</Text>
                </Pressable>
                <Pressable
                  style={[styles.inventoryItem, inventory.meal <= 0 && styles.disabledButton]}
                  onPress={() => actions.handleUseItem('meal')}
                  disabled={inventory.meal <= 0}
                >
                  <MaterialCommunityIcons name="food-variant" size={20} color={palette.accent} />
                  <Text style={styles.inventoryLabel}>ごはん</Text>
                  <Text style={styles.inventoryCount}>×{inventory.meal}</Text>
                  <Text style={styles.inventoryUse}>使う（+5回）</Text>
                </Pressable>
                <Pressable
                  style={[styles.inventoryItem, inventory.feast <= 0 && styles.disabledButton]}
                  onPress={() => actions.handleUseItem('feast')}
                  disabled={inventory.feast <= 0}
                >
                  <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={palette.accent} />
                  <Text style={styles.inventoryLabel}>ごちそう</Text>
                  <Text style={styles.inventoryCount}>×{inventory.feast}</Text>
                  <Text style={styles.inventoryUse}>使う（+10回）</Text>
                </Pressable>
              </View>
              {(() => {
                const remaining = AD_VIEW_LIMIT - adReward.viewCount;
                const exhausted = remaining <= 0;
                return (
                  <Pressable
                    style={[styles.adRewardButton, exhausted && styles.adRewardButtonDisabled]}
                    onPress={() => void actions.handleAdReward()}
                    disabled={exhausted}
                  >
                    <Feather name="play-circle" size={18} color={exhausted ? palette.muted : '#FFFFFF'} style={{ marginRight: 6 }} />
                    <Text style={[styles.adRewardButtonText, exhausted && styles.adRewardButtonTextDisabled]}>
                      {exhausted
                        ? '今日の広告はすべて見ました'
                        : `広告を見ておやつをもらう（のこり${remaining}回）`}
                    </Text>
                  </Pressable>
                );
              })()}
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.loginStreak}</Text>
              <Text style={styles.statLabel}>連続ログイン</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.totalMessagesSent}</Text>
              <Text style={styles.statLabel}>おしゃべり</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{daysActive}</Text>
              <Text style={styles.statLabel}>日目</Text>
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowLarge} />
            <View style={styles.heroGlowSmall} />
            <Text style={styles.eyebrow}>WELCOME</Text>
            <Text style={styles.heroTitle}>最初の1匹をつくる</Text>
            <Text style={styles.heroSubtitle}>名前、種類、性格だけで会話を始められます。</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.todaySectionLabel}>はじめる</Text>
            <Text style={styles.todaySectionText}>最初の1匹をつくると、ここが毎日の入口になります。</Text>
            <View style={styles.startSteps}>
              <View style={styles.startStepCard}>
                <Text style={styles.startStepNumber}>1</Text>
                <Text style={styles.startStepText}>名前と種類を決める</Text>
              </View>
              <View style={styles.startStepCard}>
                <Text style={styles.startStepNumber}>2</Text>
                <Text style={styles.startStepText}>性格を選ぶ</Text>
              </View>
              <View style={styles.startStepCard}>
                <Text style={styles.startStepNumber}>3</Text>
                <Text style={styles.startStepText}>写真はあとからでOK</Text>
              </View>
            </View>
            <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.primaryButtonText}>最初の1匹を追加する</Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
    gap: 20,
  },
  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: palette.secondary,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 24,
    gap: 12,
    ...shadow.lg,
  },
  heroGlowLarge: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    opacity: 0.10,
  },
  heroGlowSmall: {
    position: 'absolute',
    bottom: -40,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    opacity: 0.06,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 21,
    fontSize: 14,
  },
  todayHeroIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  todayPetName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  todayHeroLine: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 34,
    fontWeight: '700',
    marginTop: 4,
  },
  heroShareButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 4,
  },
  heroShareButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  hiddenCapture: {
    position: 'absolute',
    left: -9999,
    top: -9999,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 16,
    ...shadow.md,
  },
  profileCardText: {
    flex: 1,
    gap: 3,
  },
  profileCardName: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  profileCardMeta: {
    color: palette.text,
    fontSize: 13,
  },
  profileTalkButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: palette.accent,
  },
  profileTalkButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  featureCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    ...shadow.md,
  },
  inventoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.ink,
  },
  inventoryHeading: {
    fontSize: 12,
    color: palette.text,
    marginBottom: 8,
  },
  inventoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inventoryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.accentSoft,
    borderRadius: 14,
    paddingVertical: 12,
  },
  inventoryLabel: {
    fontSize: 12,
    color: palette.ink,
    fontWeight: '600',
  },
  inventoryCount: {
    color: palette.text,
    fontSize: 13,
  },
  inventoryUse: {
    color: palette.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  adRewardButton: {
    flexDirection: 'row',
    backgroundColor: palette.secondary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adRewardButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  adRewardButtonDisabled: {
    backgroundColor: palette.chip,
  },
  adRewardButtonTextDisabled: {
    color: palette.muted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.surface,
    borderRadius: 16,
    paddingVertical: 16,
    ...shadow.sm,
  },
  statValue: {
    color: palette.accent,
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: palette.text,
    fontSize: 11,
    fontWeight: '600',
  },
  todaySectionLabel: {
    color: palette.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  todaySectionText: {
    color: palette.ink,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  startSteps: {
    gap: 10,
  },
  startStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...shadow.sm,
  },
  startStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
    backgroundColor: palette.accent,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    overflow: 'hidden',
  },
  startStepText: {
    color: palette.ink,
    fontWeight: '600',
    flex: 1,
    fontSize: 15,
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
  disabledButton: {
    opacity: 0.4,
  },
});
