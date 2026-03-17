import React, { useMemo } from 'react';
import { Alert, ImageBackground, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { useThemePalette, shadow, THEME_KEYS, THEME_PREVIEW_COLORS, type ThemeKey } from '../theme';
import type { SubscriptionPlan } from '../types';
import PetAvatar from '../components/PetAvatar';
import NoticeBanner from '../components/NoticeBanner';

export default function SettingsScreen() {
  const palette = useThemePalette();
  const { state, dispatch, actions } = useAppContext();
  const { session, pets, selectedPetId, notice, isPlanUpdating, transferCodeInput, issuedTransferCode, isAuthenticating } = state;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const currentPlan = session?.plan ?? 'free';
  const petLimit = currentPlan === 'plus' ? 3 : 1;
  const petLimitReached = pets.length >= petLimit;

  const styles = useMemo(() => StyleSheet.create({
    background: {
      flex: 1,
    },
    screenContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 120,
      gap: 20,
    },
    panelCard: {
      backgroundColor: palette.surfaceAlpha,
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
    currentPlanCard: {
      backgroundColor: palette.accentSoft,
      borderRadius: 12,
      padding: 14,
      gap: 4,
    },
    currentPlanName: {
      fontSize: 16,
      fontWeight: '700',
      color: palette.accent,
    },
    currentPlanDesc: {
      fontSize: 13,
      color: palette.text,
      lineHeight: 20,
    },
    inlineMeta: {
      fontSize: 12,
      lineHeight: 18,
      color: palette.muted,
    },
    plusSectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: palette.accent,
    },
    plusBenefitList: {
      gap: 6,
      paddingLeft: 8,
    },
    plusBenefitItem: {
      fontSize: 14,
      color: palette.text,
      lineHeight: 22,
    },
    managePlanButton: {
      paddingVertical: 10,
      alignItems: 'center',
    },
    managePlanButtonText: {
      color: palette.muted,
      fontSize: 13,
      textDecorationLine: 'underline',
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
    disabledButton: {
      opacity: 0.4,
    },
    petList: {
      gap: 10,
    },
    petListItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 0,
      padding: 14,
      borderRadius: 16,
      backgroundColor: palette.surfaceAlpha,
      ...shadow.sm,
    },
    petListItemTap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    petListItemActive: {
      backgroundColor: palette.accentSoft,
    },
    petListText: {
      flex: 1,
      gap: 3,
    },
    petListName: {
      color: palette.ink,
      fontWeight: '700',
      fontSize: 16,
    },
    petListNameActive: {
      color: palette.accent,
    },
    petListMeta: {
      color: palette.text,
      lineHeight: 18,
      fontSize: 12,
    },
    petDeleteButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: palette.canvas,
      marginLeft: 8,
    },
    petDeleteButtonText: {
      color: palette.accent,
      fontSize: 12,
      fontWeight: '600',
    },
    input: {
      backgroundColor: palette.canvas,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: palette.ink,
      letterSpacing: 2,
    },
    divider: {
      height: 1,
      backgroundColor: palette.border,
    },
    cautionText: {
      fontSize: 11,
      color: palette.danger,
    },
    codeDisplay: {
      alignItems: 'center',
      gap: 6,
      padding: 16,
      backgroundColor: palette.accentSoft,
      borderRadius: 14,
    },
    codeLabel: {
      fontSize: 12,
      color: palette.text,
    },
    codeText: {
      fontSize: 28,
      fontWeight: '700',
      color: palette.accent,
      letterSpacing: 4,
      fontVariant: ['tabular-nums'],
    },
    codeHint: {
      fontSize: 11,
      color: palette.muted,
      textAlign: 'center',
    },
    themeCard: {
      backgroundColor: palette.surfaceAlpha,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...shadow.sm,
    },
    themeTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.ink,
      marginBottom: 8,
    },
    themeRow: {
      flexDirection: 'row',
      gap: 14,
      justifyContent: 'center',
    },
    themeCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 3,
      borderColor: 'transparent',
    },
    themeCircleActive: {
      borderColor: palette.muted,
    },
  }), [palette]);

  function onOpenPet(petId: string) {
    dispatch({ type: 'SET_SELECTED_PET_ID', petId });
    navigation.getParent()?.navigate('PetDetail', { petId });
  }

  function onAddPet() {
    navigation.getParent()?.navigate('PetDetail', {});
  }

  function onUpgrade(plan: SubscriptionPlan) {
    void actions.handlePlanUpgrade(plan);
  }

  return (
    <ImageBackground source={require('../../assets/ui/background_settings.png')} style={styles.background} resizeMode="cover">
    <ScrollView contentContainerStyle={[styles.screenContent, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
      <NoticeBanner notice={notice} />

      <View style={styles.panelCard}>
        <Text style={styles.panelTitle}>現在のプラン</Text>
        {currentPlan === 'free' ? (
          <>
            <View style={styles.currentPlanCard}>
              <Text style={styles.currentPlanName}>Freeプラン</Text>
              <Text style={styles.currentPlanDesc}>1日5回までおはなしできます</Text>
            </View>
            <Text style={styles.plusSectionTitle}>Plusプランの特典</Text>
            <View style={styles.plusBenefitList}>
              <Text style={styles.plusBenefitItem}>✓ 広告なし</Text>
              <Text style={styles.plusBenefitItem}>✓ ペット3匹まで登録</Text>
              <Text style={styles.plusBenefitItem}>✓ 1日50回おはなし</Text>
            </View>
            <Pressable
              style={[styles.primaryButton, isPlanUpdating && styles.disabledButton]}
              onPress={() => onUpgrade('plus')}
              disabled={isPlanUpdating}
            >
              <Text style={styles.primaryButtonText}>
                {isPlanUpdating ? '処理中…' : 'Plus にアップグレード（480円/月）'}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.currentPlanCard}>
              <Text style={styles.currentPlanName}>Plusプラン</Text>
              <Text style={styles.currentPlanDesc}>広告なし・ペット3匹・1日50回おはなし</Text>
            </View>
            <Pressable
              style={styles.managePlanButton}
              onPress={() => {
                const url = Platform.OS === 'ios'
                  ? 'https://apps.apple.com/account/subscriptions'
                  : 'https://play.google.com/store/account/subscriptions';
                void Linking.openURL(url);
              }}
            >
              <Text style={styles.managePlanButtonText}>サブスクリプションを管理</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.panelCard}>
        <Text style={styles.panelTitle}>ペット管理</Text>
        {pets.length > 0 ? (
          <View style={styles.petList}>
            {pets.map((pet) => (
              <View key={pet.id} style={[styles.petListItem, pet.id === selectedPetId && styles.petListItemActive]}>
                <Pressable style={styles.petListItemTap} onPress={() => onOpenPet(pet.id)}>
                  <PetAvatar pet={pet} size={44} />
                  <View style={styles.petListText}>
                    <Text style={[styles.petListName, pet.id === selectedPetId && styles.petListNameActive]}>{pet.name}</Text>
                    <Text style={styles.petListMeta}>{pet.species} ・ {pet.gender}</Text>
                  </View>
                </Pressable>
                <Pressable
                  style={styles.petDeleteButton}
                  onPress={() => actions.handleDeletePet(pet.id)}
                >
                  <Text style={styles.petDeleteButtonText}>おわかれする</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.inlineMeta}>まだペットがいません。</Text>
        )}
        {petLimitReached ? (
          <Text style={styles.inlineMeta}>
            {currentPlan === 'free' ? 'Plusプランにすると3匹までおむかえできます' : 'ペットは3匹までです'}
          </Text>
        ) : (
          <Pressable style={styles.primaryButton} onPress={onAddPet}>
            <Text style={styles.primaryButtonText}>新しいペットをおむかえする</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.themeCard}>
        <Text style={styles.themeTitle}>カラー</Text>
        <View style={styles.themeRow}>
          {THEME_KEYS.map((key) => (
            <Pressable
              key={key}
              style={[
                styles.themeCircle,
                { backgroundColor: THEME_PREVIEW_COLORS[key] },
                state.themeKey === key && styles.themeCircleActive,
              ]}
              onPress={() => dispatch({ type: 'SET_THEME', key })}
            />
          ))}
        </View>
      </View>

      <View style={styles.panelCard}>
        <Text style={styles.panelTitle}>データの引き継ぎ</Text>
        <Text style={styles.panelLead}>機種変更やデータの復元に使えます。</Text>

        <Pressable
          style={[styles.primaryButton, isAuthenticating && styles.disabledButton]}
          onPress={() => void actions.handleIssueTransferCode()}
          disabled={isAuthenticating}
        >
          <Text style={styles.primaryButtonText}>{isAuthenticating ? '発行中…' : '引き継ぎコードを発行'}</Text>
        </Pressable>

        {issuedTransferCode && (
          <View style={styles.codeDisplay}>
            <Text style={styles.codeLabel}>引き継ぎコード</Text>
            <Text style={styles.codeText}>{issuedTransferCode}</Text>
            <Text style={styles.codeHint}>このコードを新しい端末で入力してください（24時間有効）</Text>
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.panelLead}>引き継ぎコードをお持ちの方</Text>
        <Text style={styles.cautionText}>※ 引き継ぐと、この端末のデータは上書きされます</Text>
        <TextInput
          style={styles.input}
          placeholder="例: A3K9M2X7"
          placeholderTextColor={palette.muted}
          value={transferCodeInput}
          onChangeText={(value) => dispatch({ type: 'SET_TRANSFER_CODE_INPUT', value: value.toUpperCase() })}
          autoCapitalize="characters"
          maxLength={8}
        />
        <Pressable
          style={[styles.secondaryButton, (isAuthenticating || !transferCodeInput.trim()) && styles.disabledButton]}
          onPress={() => {
            Alert.alert(
              'データの引き継ぎ',
              'この端末のデータは上書きされます。よろしいですか？',
              [
                { text: 'キャンセル', style: 'cancel' },
                { text: '引き継ぐ', style: 'destructive', onPress: () => void actions.handleRedeemTransferCode() },
              ],
            );
          }}
          disabled={isAuthenticating || !transferCodeInput.trim()}
        >
          <Text style={styles.secondaryButtonText}>{isAuthenticating ? '引き継ぎ中…' : 'データを引き継ぐ'}</Text>
        </Pressable>
      </View>
    </ScrollView>
    </ImageBackground>
  );
}

