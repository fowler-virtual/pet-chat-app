import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PetProfile } from '../types';
import { palette, shadow } from '../theme';
import PetAvatar from './PetAvatar';

export default function PetListCard({
  pets,
  selectedPetId,
  onSelect,
  conversationMetaByPetId,
}: {
  pets: PetProfile[];
  selectedPetId: string;
  onSelect: (petId: string) => void;
  conversationMetaByPetId: Record<string, { lastTime: string; lastText: string; unreadCount: number }>;
}) {
  return (
    <View style={styles.panelCard}>
      <Text style={styles.panelTitle}>うちの子たち</Text>
      <View style={styles.petList}>
        {pets.map((pet) => {
          const active = pet.id === selectedPetId;
          const meta = conversationMetaByPetId[pet.id];
          return (
            <Pressable key={pet.id} style={[styles.petListItem, active && styles.petListItemActive]} onPress={() => onSelect(pet.id)}>
              <PetAvatar pet={pet} size={48} />
              <View style={styles.petListText}>
                <View style={styles.petListTitleRow}>
                  <Text style={[styles.petListName, active && styles.petListNameActive]}>{pet.name}</Text>
                  {!!meta?.unreadCount && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{meta.unreadCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.petListMeta}>
                  {meta?.lastTime ? `${meta.lastTime}  ${meta.lastText || `${pet.species} / ${pet.personality}`}` : `${pet.species} / ${pet.personality}`}
                </Text>
              </View>
              <Text style={styles.petListArrow}>›</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  petListItemActive: {
    backgroundColor: palette.accentSoft,
  },
  petListText: {
    flex: 1,
    gap: 3,
  },
  petListTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  unreadBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  petListArrow: {
    color: palette.muted,
    fontSize: 24,
  },
});
