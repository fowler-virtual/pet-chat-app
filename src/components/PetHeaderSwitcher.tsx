import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PetProfile } from '../types';
import { palette } from '../theme';
import PetAvatar from './PetAvatar';

export default React.memo(function PetHeaderSwitcher({
  pets,
  selectedPetId,
  unreadCounts,
  onSelectPet,
}: {
  pets: PetProfile[];
  selectedPetId: string;
  unreadCounts: Record<string, number>;
  onSelectPet: (petId: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petHeaderSwitcher}>
      {pets.map((pet) => {
        const active = pet.id === selectedPetId;
        return (
          <Pressable
            key={pet.id}
            style={[styles.petHeaderItem, active && styles.petHeaderItemActive]}
            onPress={() => onSelectPet(pet.id)}
          >
            <View style={styles.petHeaderAvatarWrap}>
              <PetAvatar pet={pet} size={40} />
              {!!unreadCounts[pet.id] && (
                <View style={styles.petHeaderUnreadBadge}>
                  <Text style={styles.petHeaderUnreadBadgeText}>{unreadCounts[pet.id]}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.petHeaderName, active && styles.petHeaderNameActive]} numberOfLines={1}>
              {pet.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  petHeaderSwitcher: {
    gap: 6,
    paddingVertical: 0,
  },
  petHeaderItem: {
    width: 62,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    opacity: 0.5,
  },
  petHeaderItemActive: {
    opacity: 1,
  },
  petHeaderAvatarWrap: {
    position: 'relative',
  },
  petHeaderUnreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
  },
  petHeaderUnreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  petHeaderName: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: '600',
  },
  petHeaderNameActive: {
    color: palette.accent,
    fontWeight: '700',
  },
});
