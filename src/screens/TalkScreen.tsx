import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { AD_VIEW_LIMIT } from '../types';
import { getTodayString } from '../lib/dateUtils';
import { useThemePalette, shadow } from '../theme';
import NoticeBanner from '../components/NoticeBanner';
import OfflineBanner from '../components/OfflineBanner';
import PetHeaderSwitcher from '../components/PetHeaderSwitcher';
import { MessageBubble, TypingBubble } from '../components/MessageBubble';

export default function TalkScreen() {
  const palette = useThemePalette();
  const { state, dispatch, actions, selectedPet, selectedMessages, remainingMessages } = useAppContext();
  const { pets, selectedPetId, input, isSending, notice, unreadCounts, apiStatus, failedMessage, inventory, adReward } = state;
  const plan = state.session?.plan ?? 'free';
  const isExhausted = remainingMessages <= 0;
  const hasAnyItem = inventory.snack > 0 || inventory.meal > 0 || inventory.feast > 0;
  const adToday = adReward.date === getTodayString() ? adReward.viewCount : 0;
  const adAvailable = plan === 'free' && adToday < AD_VIEW_LIMIT;
  const insets = useSafeAreaInsets();
  const messagesScrollRef = useRef<ScrollView | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  const messages = selectedMessages;

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesScrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [messages, isSending, selectedPet?.id]);

  function handleComposerKeyPress(event: unknown) {
    if (Platform.OS !== 'web') return;
    const webEvent = event as {
      preventDefault?: () => void;
      nativeEvent?: { key?: string; shiftKey?: boolean; isComposing?: boolean };
    };
    if (
      webEvent.nativeEvent?.key === 'Enter' &&
      !webEvent.nativeEvent.shiftKey &&
      !webEvent.nativeEvent.isComposing &&
      !isComposing
    ) {
      webEvent.preventDefault?.();
      if (!isSending && selectedPet && input.trim() && !isExhausted) {
        void actions.handleSendMessage();
      }
    }
  }

  function handleCompositionStart() {
    if (Platform.OS === 'web') setIsComposing(true);
  }
  function handleCompositionEnd() {
    if (Platform.OS === 'web') setIsComposing(false);
  }

  const webCompositionProps =
    Platform.OS === 'web'
      ? ({ onCompositionStart: handleCompositionStart, onCompositionEnd: handleCompositionEnd } as const)
      : {};

  const handleLongPress = useCallback(
    (msg: import('../types').ChatMessage) => {
      if (selectedPet) {
        dispatch({ type: 'SET_MESSAGE_ACTION_STATE', state: { petId: selectedPet.id, message: msg } });
      }
    },
    [selectedPet, dispatch],
  );

  const handleSelectPet = useCallback(
    (petId: string) => dispatch({ type: 'SET_SELECTED_PET_ID', petId }),
    [dispatch],
  );

  const styles = useMemo(() => StyleSheet.create({
    background: {
      flex: 1,
    },
    chatScreen: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 108,
      gap: 0,
    },
    resendBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#FFF3F0',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 6,
    },
    resendText: {
      flex: 1,
      fontSize: 13,
      color: palette.danger,
      fontWeight: '500',
    },
    resendButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: palette.danger,
    },
    resendButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    lowRemainingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: palette.secondarySoft,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 6,
    },
    lowRemainingText: {
      fontSize: 13,
      color: palette.secondary,
      fontWeight: '500',
    },
    petHeaderCard: {
      backgroundColor: palette.surfaceAlpha,
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 8,
      ...shadow.sm,
    },
    messagesPanel: {
      flex: 1,
      backgroundColor: palette.surfaceAlpha,
      borderRadius: 20,
      marginTop: 0,
      marginBottom: 10,
      ...shadow.sm,
    },
    messagesPanelInner: {
      padding: 14,
      paddingBottom: 20,
    },
    emptyText: {
      color: palette.text,
      textAlign: 'center',
      paddingVertical: 40,
    },
    exhaustedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: palette.accentSoft,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 2,
    },
    exhaustedBannerText: {
      flex: 1,
      fontSize: 13,
      color: palette.accent,
      fontWeight: '500',
    },
    chatComposer: {
      backgroundColor: palette.surfaceAlpha,
      borderRadius: 22,
      padding: 10,
      gap: 8,
      ...shadow.md,
    },
    chatComposerMain: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
    },
    chatInput: {
      flex: 1,
      minHeight: 48,
      maxHeight: 120,
      backgroundColor: palette.canvas,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: palette.ink,
      fontSize: 15,
    },
    fabSend: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: palette.accent,
    },
    fabSendText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15,
    },
    sendButtonDisabled: {
      opacity: 0.4,
    },
    composerPromptRow: {
      gap: 8,
      paddingHorizontal: 2,
      paddingTop: 2,
    },
    composerPromptChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: palette.accentSoft,
    },
    composerPromptChipText: {
      color: palette.accent,
      fontSize: 12,
      fontWeight: '600',
    },
  }), [palette]);

  return (
    <ImageBackground source={require('../../assets/ui/background_chat.png')} style={styles.background} resizeMode="cover">
    <KeyboardAvoidingView
      style={[styles.chatScreen, { paddingBottom: 86 + insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 + insets.bottom : 0}
    >
      <NoticeBanner notice={notice} />
      <OfflineBanner status={apiStatus} onRetry={() => void actions.retryConnection()} />
      {failedMessage && failedMessage.petId === selectedPetId && (
        <View style={styles.resendBanner}>
          <Feather name="alert-triangle" size={14} color={palette.danger} />
          <Text style={styles.resendText}>送信に失敗しました</Text>
          <Pressable style={styles.resendButton} onPress={() => void actions.retrySendMessage()}>
            <Text style={styles.resendButtonText}>再送</Text>
          </Pressable>
        </View>
      )}
      {remainingMessages <= 3 && remainingMessages > 0 && (
        <View style={styles.lowRemainingBanner}>
          <Feather name="alert-circle" size={14} color={palette.warning} />
          <Text style={styles.lowRemainingText}>
            今日はあと{remainingMessages}回おはなしできるよ
          </Text>
        </View>
      )}
      {pets.length > 1 && (
        <View style={styles.petHeaderCard}>
          <PetHeaderSwitcher
            pets={pets}
            selectedPetId={selectedPetId}
            unreadCounts={unreadCounts}
            onSelectPet={handleSelectPet}
          />
        </View>
      )}

      <ScrollView ref={messagesScrollRef} style={styles.messagesPanel} contentContainerStyle={styles.messagesPanelInner} showsVerticalScrollIndicator={false}>
        {selectedPet ? (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                pet={selectedPet}
                message={message}
                onLongPress={handleLongPress}
              />
            ))}
            {isSending && <TypingBubble pet={selectedPet} />}
          </>
        ) : (
          <Text style={styles.emptyText}>先にペットを選択してください。</Text>
        )}
      </ScrollView>

      <View style={styles.chatComposer}>
        {isExhausted && (
          <Pressable
            style={styles.exhaustedBanner}
            onPress={() => dispatch({ type: 'SET_SHOW_LIMIT_MODAL', value: true })}
          >
            <Feather name="info" size={14} color={palette.accent} />
            <Text style={styles.exhaustedBannerText}>
              {hasAnyItem
                ? '今日はここまで。たべものを使ってね'
                : adAvailable
                  ? '今日はここまで。動画でおやつをもらうと話せるよ'
                  : '今日はここまで。また明日おはなししようね'}
            </Text>
            {(hasAnyItem || adAvailable) && <Feather name="chevron-right" size={14} color={palette.accent} />}
          </Pressable>
        )}
        <View style={styles.chatComposerMain}>
          <TextInput
            style={styles.chatInput}
            placeholder={isExhausted ? (hasAnyItem ? 'たべものを使うと話せるよ' : adAvailable ? 'おやつがあると話せるよ' : 'また明日おはなししようね') : selectedPet ? `${selectedPet.name}に話しかける` : 'ペットを選択してください'}
            placeholderTextColor={palette.muted}
            value={input}
            onChangeText={(value) => dispatch({ type: 'SET_INPUT', value })}
            editable={Boolean(selectedPet)}
            multiline
            blurOnSubmit={Platform.OS !== 'web'}
            returnKeyType={Platform.OS === 'web' ? 'default' : 'send'}
            onSubmitEditing={Platform.OS !== 'web' ? () => {
              if (!isSending && selectedPet && input.trim() && !isExhausted) {
                void actions.handleSendMessage();
              }
            } : undefined}
            onKeyPress={handleComposerKeyPress}
            {...(webCompositionProps as object)}
          />
          <Pressable
            style={[styles.fabSend, (!input.trim() || isSending || !selectedPet || isExhausted) && styles.sendButtonDisabled]}
            onPress={() => void actions.handleSendMessage()}
            disabled={!input.trim() || isSending || !selectedPet || isExhausted}
          >
            <Text style={styles.fabSendText}>{isSending ? '...' : '送信'}</Text>
          </Pressable>
        </View>
        {input.trim().length === 0 && !isExhausted && !isSending && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.composerPromptRow}>
            {['おはよう', 'ただいま', '何してるの？'].map((chip) => (
              <Pressable key={chip} style={styles.composerPromptChip} onPress={() => void actions.handleSendMessage(chip)}>
                <Text style={styles.composerPromptChipText}>{chip}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
    </ImageBackground>
  );
}

