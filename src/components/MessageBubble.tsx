import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ChatMessage, PetProfile } from '../types';
import { palette } from '../theme';
import PetAvatar from './PetAvatar';

export const MessageBubble = React.memo(function MessageBubble({
  pet,
  message,
  onLongPress,
}: {
  pet: PetProfile;
  message: ChatMessage;
  onLongPress: (message: ChatMessage) => void;
}) {
  const owner = message.sender === 'owner';
  return (
    <View style={[styles.messageRow, owner ? styles.messageRowOwner : styles.messageRowPet]}>
      {!owner && <PetAvatar pet={pet} size={34} />}
      <View style={styles.messageColumn}>
        {!owner && <Text style={styles.senderName}>{pet.name}</Text>}
        <Pressable onLongPress={() => onLongPress(message)}>
          <View style={[styles.bubble, owner ? styles.ownerBubble : styles.petBubble]}>
            <Text style={[styles.bubbleText, owner && styles.ownerBubbleText]}>{message.text}</Text>
          </View>
        </Pressable>
        <Text style={styles.messageTime}>{message.time}</Text>
      </View>
    </View>
  );
});

export const TypingBubble = React.memo(function TypingBubble({ pet }: { pet: PetProfile }) {
  return (
    <View style={styles.messageRow}>
      <PetAvatar pet={pet} size={34} />
      <View style={styles.messageColumn}>
        <Text style={styles.senderName}>{pet.name}</Text>
        <View style={[styles.bubble, styles.petBubble, styles.typingBubble]}>
          <View style={styles.typingDots}>
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  messageRowOwner: {
    justifyContent: 'flex-end',
  },
  messageRowPet: {
    justifyContent: 'flex-start',
  },
  messageColumn: {
    maxWidth: '80%',
    gap: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.text,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  petBubble: {
    backgroundColor: palette.petBubble,
    borderTopLeftRadius: 6,
  },
  ownerBubble: {
    backgroundColor: palette.ownerBubble,
    borderTopRightRadius: 6,
  },
  bubbleText: {
    color: palette.ink,
    lineHeight: 21,
    fontSize: 15,
  },
  ownerBubbleText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 11,
    color: palette.muted,
  },
  typingBubble: {
    minWidth: 76,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: palette.secondary,
    opacity: 0.6,
  },
});
