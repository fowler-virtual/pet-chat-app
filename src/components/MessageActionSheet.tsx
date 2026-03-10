import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import QuoteCard from './QuoteCard';
import { shareQuoteAsImage } from '../lib/shareQuote';
import type { ChatMessage } from '../types';
import { palette } from '../theme';

export default function MessageActionSheet({
  visible,
  message,
  petName,
  petSpecies,
  onClose,
  onReuse,
  onDelete,
}: {
  visible: boolean;
  message: ChatMessage | null;
  petName: string;
  petSpecies: string;
  onClose: () => void;
  onReuse: () => void;
  onDelete: () => void;
}) {
  const shareCardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const isPetMessage = message?.sender === 'pet';

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheetCard} onPress={() => {}}>
          <Text style={styles.sheetTitle}>メッセージ操作</Text>
          <Text style={styles.sheetPreview}>{message?.text ?? ''}</Text>
          {isPetMessage ? (
            <>
              <View style={styles.sheetQuoteCardWrapper}>
                <QuoteCard
                  ref={shareCardRef}
                  petName={petName}
                  species={petSpecies}
                  quote={message?.text ?? ''}
                />
              </View>
              <Pressable
                style={styles.sheetButton}
                disabled={isSharing}
                onPress={async () => {
                  if (!message) return;
                  setIsSharing(true);
                  try {
                    await shareQuoteAsImage(shareCardRef, petName, message.text);
                    onClose();
                  } catch {
                    // sharing cancelled or failed
                  } finally {
                    setIsSharing(false);
                  }
                }}
              >
                <Text style={[styles.sheetButtonText, { color: palette.accent }]}>
                  {isSharing ? 'シェア中…' : 'このひとことをシェア'}
                </Text>
              </Pressable>
            </>
          ) : null}
          <Pressable style={styles.sheetButton} onPress={onReuse}>
            <Text style={styles.sheetButtonText}>入力欄へ入れる</Text>
          </Pressable>
          <Pressable style={styles.sheetButton} onPress={onDelete}>
            <Text style={[styles.sheetButtonText, styles.sheetButtonDanger]}>このメッセージを削除</Text>
          </Pressable>
          <Pressable style={styles.sheetCancel} onPress={onClose}>
            <Text style={styles.sheetCancelText}>閉じる</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
    gap: 10,
  },
  sheetTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  sheetPreview: {
    color: palette.text,
    lineHeight: 20,
  },
  sheetQuoteCardWrapper: {
    marginVertical: 8,
    transform: [{ scale: 0.85 }],
  },
  sheetButton: {
    backgroundColor: palette.canvas,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  sheetButtonText: {
    color: palette.ink,
    fontWeight: '600',
  },
  sheetButtonDanger: {
    color: palette.danger,
  },
  sheetCancel: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetCancelText: {
    color: palette.muted,
    fontWeight: '600',
  },
});
