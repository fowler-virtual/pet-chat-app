import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, ImageBackground, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { useThemePalette, shadow, THEME_KEYS, THEME_PREVIEW_COLORS, type ThemeKey } from '../theme';
import type { SubscriptionPlan } from '../types';
import PetAvatar from '../components/PetAvatar';
import NoticeBanner from '../components/NoticeBanner';
import OfflineBanner from '../components/OfflineBanner';

export default function SettingsScreen() {
  const palette = useThemePalette();
  const { state, dispatch, actions } = useAppContext();
  const { session, pets, selectedPetId, notice, isPlanUpdating, transferCodeInput, issuedTransferCode, isAuthenticating, apiStatus } = state;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const currentPlan = session?.plan ?? 'free';
  const petLimit = currentPlan === 'plus' ? 3 : 1;
  const petLimitReached = pets.length >= petLimit;
  const scrollRef = useRef<ScrollView>(null);
  useFocusEffect(useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []));

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
      fontSize: 13,
      lineHeight: 20,
      color: palette.text,
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
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: palette.canvas,
      marginLeft: 4,
      flexShrink: 0,
    },
    petDeleteButtonText: {
      color: palette.accent,
      fontSize: 11,
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
    legalRow: {
      flexDirection: 'row',
      gap: 12,
    },
    legalButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderRadius: 14,
      backgroundColor: palette.surfaceAlpha,
      ...shadow.sm,
    },
    legalButtonText: {
      fontSize: 11,
      color: palette.text,
      fontWeight: '600',
      flexShrink: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 40,
    },
    modalContent: {
      flex: 1,
      backgroundColor: palette.surface,
      borderRadius: 20,
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: palette.ink,
    },
    modalCloseButton: {
      padding: 4,
    },
    modalBody: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    modalText: {
      fontSize: 13,
      lineHeight: 22,
      color: palette.text,
    },
    modalSectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: palette.ink,
      marginTop: 16,
      marginBottom: 4,
    },
  }), [palette]);

  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

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
    <ScrollView ref={scrollRef} contentContainerStyle={[styles.screenContent, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
      <NoticeBanner notice={notice} />
      <OfflineBanner status={apiStatus} onRetry={() => void actions.retryConnection()} />

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
      <View style={styles.legalRow}>
        <Pressable style={styles.legalButton} onPress={() => setLegalModal('privacy')}>
          <Feather name="shield" size={14} color={palette.muted} />
          <Text style={styles.legalButtonText}>プライバシーポリシー</Text>
        </Pressable>
        <Pressable style={styles.legalButton} onPress={() => setLegalModal('terms')}>
          <Feather name="file-text" size={14} color={palette.muted} />
          <Text style={styles.legalButtonText}>利用規約</Text>
        </Pressable>
      </View>
    </ScrollView>

    <Modal visible={legalModal !== null} animationType="slide" transparent onRequestClose={() => setLegalModal(null)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{legalModal === 'privacy' ? 'プライバシーポリシー' : '利用規約'}</Text>
            <Pressable style={styles.modalCloseButton} onPress={() => setLegalModal(null)}>
              <Feather name="x" size={22} color={palette.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            {legalModal === 'privacy' ? <PrivacyPolicyContent styles={styles} /> : <TermsContent styles={styles} />}
          </ScrollView>
        </View>
      </View>
    </Modal>
    </ImageBackground>
  );
}

function PrivacyPolicyContent({ styles }: { styles: any }) {
  return (
    <>
      <Text style={styles.modalText}>最終更新日: 2026年3月9日</Text>
      <Text style={styles.modalText}>
        「かいぬしとおはなし」（以下「本アプリ」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。
      </Text>
      <Text style={styles.modalSectionTitle}>1. 収集する情報</Text>
      <Text style={styles.modalText}>
        ・ペットのプロフィール情報（名前、種類、性格など）{'\n'}
        ・会話データ{'\n'}
        ・画像データ（ペットのアイコン）{'\n'}
        ・利用状況データ（ログイン日時、会話回数）{'\n'}
        ・広告パートナー（Google AdMob等）がデバイス識別子等を収集する場合があります
      </Text>
      <Text style={styles.modalSectionTitle}>2. 情報の利用目的</Text>
      <Text style={styles.modalText}>
        ・本アプリの機能提供{'\n'}
        ・データのバックアップおよび引き継ぎ{'\n'}
        ・AIによる会話応答の生成{'\n'}
        ・サービスの改善{'\n'}
        ・広告の表示
      </Text>
      <Text style={styles.modalSectionTitle}>3. 情報の第三者提供</Text>
      <Text style={styles.modalText}>
        ・AIサービスプロバイダー（OpenAI）に会話内容を送信します。個人を特定する情報は含まれません。{'\n'}
        ・広告パートナーに匿名化されたデバイス情報を共有する場合があります。{'\n'}
        ・法令に基づく場合を除き、第三者に提供しません。
      </Text>
      <Text style={styles.modalSectionTitle}>4. データの保管と削除</Text>
      <Text style={styles.modalText}>
        ・ログインしない場合、データは端末内にのみ保存されます。{'\n'}
        ・ペットのデータは「お別れする」機能でいつでも削除できます。{'\n'}
        ・サーバー上の全データ削除はお問い合わせください。
      </Text>
      <Text style={styles.modalSectionTitle}>5. お問い合わせ</Text>
      <Text style={styles.modalText}>yuta.ramone1648+petapp@gmail.com</Text>
    </>
  );
}

function TermsContent({ styles }: { styles: any }) {
  return (
    <>
      <Text style={styles.modalText}>最終更新日: 2026年3月9日</Text>
      <Text style={styles.modalText}>
        本利用規約は、「かいぬしとおはなし」（以下「本アプリ」）の利用条件を定めるものです。
      </Text>
      <Text style={styles.modalSectionTitle}>1. サービス概要</Text>
      <Text style={styles.modalText}>
        本アプリは、ユーザーが登録したペットのプロフィールに基づき、AIがペットになりきって会話を行うエンターテインメントアプリです。
      </Text>
      <Text style={styles.modalSectionTitle}>2. AIによる会話について</Text>
      <Text style={styles.modalText}>
        ・AIの応答は実際のペットの意思や感情を反映するものではありません。{'\n'}
        ・医療・飼育に関する専門的なアドバイスとして使用しないでください。
      </Text>
      <Text style={styles.modalSectionTitle}>3. 料金プラン</Text>
      <Text style={styles.modalText}>
        ・Freeプラン: ペット1匹、1日5回おはなし{'\n'}
        ・Plusプラン（月額480円）: ペット3匹、1日50回おはなし{'\n'}
        ・アイテム: おやつ(+3回)、ごはん(+5回)、ごちそう(+10回)
      </Text>
      <Text style={styles.modalSectionTitle}>4. 免責事項</Text>
      <Text style={styles.modalText}>
        ・本アプリは「現状のまま」提供されます。{'\n'}
        ・AIの応答に起因する損害について責任を負いません。{'\n'}
        ・端末の故障等によるデータ消失について責任を負いません。
      </Text>
      <Text style={styles.modalSectionTitle}>5. お問い合わせ</Text>
      <Text style={styles.modalText}>yuta.ramone1648+petapp@gmail.com</Text>
    </>
  );
}

