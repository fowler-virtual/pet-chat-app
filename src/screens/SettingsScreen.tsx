import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { palette, shadow } from '../theme';
import type { SubscriptionPlan } from '../types';
import PetAvatar from '../components/PetAvatar';
import NoticeBanner from '../components/NoticeBanner';

export default function SettingsScreen() {
  const { state, dispatch, actions } = useAppContext();
  const { session, pets, selectedPetId, notice, isPlanUpdating, emailInput, isAuthenticating } = state;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const currentPlan = session?.plan ?? 'free';

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
    <ScrollView contentContainerStyle={[styles.screenContent, { paddingBottom: 120 + insets.bottom }]}>
      <NoticeBanner notice={notice} />

      <View style={styles.panelCard}>
        <Text style={styles.panelTitle}>プラン</Text>
        <View style={styles.planCurrentRow}>
          <Text style={styles.planCurrentLabel}>現在のプラン</Text>
          <Text style={styles.planCurrentValue}>{currentPlan === 'plus' ? 'Plus' : 'Free'}</Text>
        </View>
        {currentPlan === 'free' ? (
          <>
            <Pressable
              style={[styles.primaryButton, !session && styles.disabledButton]}
              onPress={() => onUpgrade('plus')}
              disabled={!session || isPlanUpdating}
            >
              <Text style={styles.primaryButtonText}>
                {isPlanUpdating ? '処理中…' : 'Plus にアップグレード（480円/月）'}
              </Text>
            </Pressable>
            {!session && (
              <Text style={styles.planLoginHint}>アップグレードにはログインが必要です</Text>
            )}
          </>
        ) : (
          <Text style={styles.inlineMeta}>広告なし・ペット3匹・50回/日・画像認識</Text>
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
                  <Text style={styles.petDeleteButtonText}>お別れする</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.inlineMeta}>まだペットがいません。</Text>
        )}
        <Pressable style={styles.secondaryButton} onPress={onAddPet}>
          <Text style={styles.secondaryButtonText}>新しいペットを追加する</Text>
        </Pressable>
      </View>

      <View style={styles.panelCard}>
        <Text style={styles.panelTitle}>アカウント</Text>
        {session ? (
          <>
            <Text style={styles.inlineMeta}>{session.email}</Text>
            <Pressable style={styles.logoutButton} onPress={actions.handleLogout}>
              <Text style={styles.logoutButtonText}>ログアウト</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.panelLead}>ログインすると、データのバックアップや機種変更時の引き継ぎができます。</Text>
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              placeholderTextColor={palette.muted}
              value={emailInput}
              onChangeText={(value) => dispatch({ type: 'SET_EMAIL_INPUT', value })}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Pressable style={styles.primaryButton} onPress={() => void actions.handleSignIn()} disabled={isAuthenticating || !emailInput.trim()}>
              <Text style={styles.primaryButtonText}>{isAuthenticating ? 'ログイン中…' : 'ログイン'}</Text>
            </Pressable>
          </>
        )}
      </View>
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
  planCurrentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planCurrentLabel: {
    color: palette.text,
    fontSize: 14,
  },
  planCurrentValue: {
    color: palette.accent,
    fontSize: 18,
    fontWeight: '700',
  },
  planLoginHint: {
    fontSize: 12,
    color: palette.muted,
    marginTop: 4,
  },
  inlineMeta: {
    fontSize: 12,
    lineHeight: 18,
    color: palette.muted,
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
    backgroundColor: palette.surface,
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
    color: palette.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: palette.canvas,
  },
  logoutButtonText: {
    color: palette.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: palette.canvas,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: palette.ink,
  },
});
