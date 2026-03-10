import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, shadow } from '../theme';
import type { PetProfile } from '../types';
import PetAvatar from './PetAvatar';

interface Props {
  pet: PetProfile | null;
  step: 1 | 2;
  onNextStep: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function FarewellModal({ pet, step, onNextStep, onConfirm, onClose }: Props) {
  return (
    <Modal visible={Boolean(pet)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modal} onPress={() => {}}>
          {pet && (
            <>
              <PetAvatar pet={pet} size={64} />
              {step === 1 ? (
                <>
                  <Text style={styles.title}>{pet.name}とお別れしますか？</Text>
                  <Text style={styles.message}>
                    お別れすると{pet.name}との会話履歴もすべて消えてしまいます。
                  </Text>
                  <Pressable style={styles.dangerButton} onPress={onNextStep}>
                    <Text style={styles.dangerButtonText}>お別れする</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.title}>本当にお別れしますか？</Text>
                  <Text style={styles.message}>
                    この操作は取り消せません。{'\n'}{pet.name}との思い出がすべて消えてしまいます。
                  </Text>
                  <Pressable style={styles.dangerButton} onPress={onConfirm}>
                    <Text style={styles.dangerButtonText}>{pet.name}にさよならする</Text>
                  </Pressable>
                </>
              )}
              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>やっぱりやめる</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(60,50,38,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 14,
    ...shadow.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.ink,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: palette.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  dangerButton: {
    backgroundColor: palette.danger,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: palette.muted,
    fontSize: 14,
  },
});
