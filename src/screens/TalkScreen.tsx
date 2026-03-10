import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { palette, shadow } from '../theme';
import NoticeBanner from '../components/NoticeBanner';
import OfflineBanner from '../components/OfflineBanner';
import PetHeaderSwitcher from '../components/PetHeaderSwitcher';
import { MessageBubble, TypingBubble } from '../components/MessageBubble';

export default function TalkScreen() {
  const { state, dispatch, actions, selectedPet, selectedMessages, remainingMessages } = useAppContext();
  const { pets, selectedPetId, input, isSending, notice, unreadCounts, apiStatus, failedMessage } = state;
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
      if (!isSending && selectedPet && input.trim()) {
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

  return (
    <KeyboardAvoidingView
      style={[styles.chatScreen, { paddingBottom: 94 + insets.bottom }]}
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
      <View style={styles.petHeaderCard}>
        <PetHeaderSwitcher
          pets={pets}
          selectedPetId={selectedPetId}
          unreadCounts={unreadCounts}
          onSelectPet={handleSelectPet}
        />
      </View>

      <ScrollView ref={messagesScrollRef} style={styles.messagesPanel} contentContainerStyle={styles.messagesPanelInner}>
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
        <View style={styles.chatComposerMain}>
          <TextInput
            style={styles.chatInput}
            placeholder={selectedPet ? `${selectedPet.name}に話しかける` : 'ペットを選択してください'}
            placeholderTextColor={palette.muted}
            value={input}
            onChangeText={(value) => dispatch({ type: 'SET_INPUT', value })}
            editable={Boolean(selectedPet)}
            multiline
            blurOnSubmit={false}
            returnKeyType="default"
            onKeyPress={handleComposerKeyPress}
            {...(webCompositionProps as object)}
          />
          <Pressable
            style={[styles.fabSend, (!input.trim() || isSending || !selectedPet) && styles.sendButtonDisabled]}
            onPress={() => void actions.handleSendMessage()}
            disabled={!input.trim() || isSending || !selectedPet}
          >
            <Text style={styles.fabSendText}>{isSending ? '...' : '送信'}</Text>
          </Pressable>
        </View>
        {input.trim().length === 0 && (
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
  );
}

const styles = StyleSheet.create({
  chatScreen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 6,
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
    backgroundColor: palette.surface,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    ...shadow.sm,
  },
  messagesPanel: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 20,
    marginTop: 0,
    marginBottom: 8,
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
  chatComposer: {
    backgroundColor: palette.surface,
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
    paddingVertical: 14,
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
});
