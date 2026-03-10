import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { PetProfile } from '../types';
import { palette } from '../theme';

export default React.memo(function PetAvatar({ pet, size = 56 }: { pet: PetProfile; size?: number }) {
  if (pet.avatarUri?.startsWith('icon:')) {
    const iconName = pet.avatarUri.slice(5);
    return (
      <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
        <MaterialCommunityIcons name={iconName as keyof typeof MaterialCommunityIcons.glyphMap} size={size * 0.55} color={palette.accent} />
      </View>
    );
  }

  if (pet.avatarUri) {
    return <Image source={{ uri: pet.avatarUri }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />;
  }

  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <MaterialCommunityIcons name="paw" size={size * 0.5} color={palette.muted} />
    </View>
  );
});

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: palette.chip,
  },
  avatarFallback: {
    backgroundColor: palette.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
