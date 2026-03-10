import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAppContext } from '../context/AppContext';
import { palette, shadow } from '../theme';
import type { PetProfile } from '../types';
import { genderOptions } from '../data/constants';
import PetAvatar from '../components/PetAvatar';
import ScreenHeader from '../components/ScreenHeader';
import { FormField, FieldLabel } from '../components/FormField';

export default function PetDetailScreen() {
  const { state, actions } = useAppContext();
  const { pets, isSavingPet } = state;
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const petId = route.params?.petId as string | undefined;
  const pet = petId ? (pets.find((p) => p.id === petId) ?? null) : null;
  const isNew = !pet;

  const [draft, setDraft] = useState<PetProfile>(
    pet ?? {
      id: '',
      name: '',
      nickname: '',
      species: '',
      gender: '' as PetProfile['gender'],
      personality: '',
      firstPerson: '',
      ownerCall: '',
      tone: '',
      avatarUri: '',
      sessionKey: '',
    },
  );

  useEffect(() => {
    if (pet) setDraft(pet);
  }, [pet]);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setDraft({ ...draft, avatarUri: result.assets[0]?.uri ?? '' });
    }
  }

  const canSubmit = Boolean(draft.name.trim() && draft.species.trim() && draft.personality.trim());

  return (
    <ScrollView contentContainerStyle={[styles.screenContent, { paddingBottom: 48 + insets.bottom }]}>
      <ScreenHeader title={isNew ? '新しいペットを追加' : draft.name} />

      <View style={styles.detailHero}>
        <Pressable style={styles.avatarEditor} onPress={() => void pickImage()}>
          <PetAvatar pet={draft} size={92} />
          <View style={styles.avatarCameraBadge}>
            <Text style={styles.avatarCameraBadgeText}>📷</Text>
          </View>
        </Pressable>
        <View style={styles.detailHeroText}>
          <Text style={styles.detailHeroMeta}>{draft.species || '種類未設定'} / {draft.gender}</Text>
        </View>
      </View>

      <View style={styles.panelCard}>
        <FormField>
          <FieldLabel text="名前" />
          <TextInput
            style={styles.input}
            value={draft.name}
            onChangeText={(value) => setDraft({ ...draft, name: value })}
            placeholder="例: むぎ / コタ / ピノ"
            placeholderTextColor={palette.muted}
          />
          <FieldLabel text="あだ名" />
          <TextInput
            style={styles.input}
            value={draft.nickname}
            onChangeText={(value) => setDraft({ ...draft, nickname: value })}
            placeholder="例: むーちゃん / こっちゃん / ぴーちゃん"
            placeholderTextColor={palette.muted}
          />
        </FormField>

        <FormField>
          <FieldLabel text="ペットの種類" />
          <TextInput
            style={styles.input}
            value={draft.species}
            onChangeText={(value) => setDraft({ ...draft, species: value })}
            placeholder="例: 猫 / 犬 / うさぎ / 文鳥 / ハムスター"
            placeholderTextColor={palette.muted}
          />
          <FieldLabel text="性別" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {genderOptions.map((gender) => (
              <Pressable
                key={gender}
                onPress={() => setDraft({ ...draft, gender })}
                style={[styles.optionChip, draft.gender === gender && styles.optionChipActive]}
              >
                <Text style={[styles.optionChipText, draft.gender === gender && styles.optionChipTextActive]}>{gender}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <FieldLabel text="性格" />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={draft.personality}
            onChangeText={(value) => setDraft({ ...draft, personality: value })}
            multiline
            placeholder="例: 人見知りだけど家では甘えん坊。朝は元気で夜は眠そう。"
            placeholderTextColor={palette.muted}
          />
        </FormField>

        <FormField>
          <FieldLabel text="一人称" />
          <TextInput
            style={styles.input}
            value={draft.firstPerson}
            onChangeText={(value) => setDraft({ ...draft, firstPerson: value })}
            placeholder="例: ぼく / わたし / むぎ / おれ"
            placeholderTextColor={palette.muted}
          />
          <FieldLabel text="ユーザの呼び方" />
          <TextInput
            style={styles.input}
            value={draft.ownerCall}
            onChangeText={(value) => setDraft({ ...draft, ownerCall: value })}
            placeholder="例: ママ / パパ / おねえちゃん / ごしゅじん"
            placeholderTextColor={palette.muted}
          />
          <FieldLabel text="口調" />
          <TextInput
            style={styles.input}
            value={draft.tone}
            onChangeText={(value) => setDraft({ ...draft, tone: value })}
            placeholder="例: タメ口で短め。少しツンデレ。たまに甘える。"
            placeholderTextColor={palette.muted}
          />
        </FormField>

        <Pressable
          style={[styles.primaryButton, (!canSubmit || isSavingPet) && styles.disabledButton]}
          onPress={async () => {
            let saved: boolean;
            if (isNew) {
              const id = `pet-${Date.now()}`;
              const newPet: PetProfile = {
                ...draft,
                id,
                nickname: draft.nickname.trim() || draft.name.trim(),
                firstPerson: draft.firstPerson.trim() || draft.name.trim(),
                ownerCall: draft.ownerCall.trim() || '飼い主さん',
                sessionKey: `pet:${id}:main`,
              };
              saved = await actions.handleAddPet(newPet);
            } else {
              saved = await actions.handleSavePet(draft);
            }
            if (saved) {
              navigation.goBack();
            }
          }}
          disabled={!canSubmit || isSavingPet}
        >
          <Text style={styles.primaryButtonText}>{isSavingPet ? '保存中…' : isNew ? 'この内容で登録' : '変更を保存'}</Text>
        </Pressable>
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
  detailHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    ...shadow.md,
  },
  detailHeroText: {
    gap: 4,
  },
  detailHeroMeta: {
    color: palette.text,
  },
  avatarEditor: {
    alignSelf: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  avatarCameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: palette.accent,
    borderWidth: 2,
    borderColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCameraBadgeText: {
    fontSize: 14,
  },
  panelCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    ...shadow.md,
  },
  input: {
    backgroundColor: palette.canvas,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: palette.ink,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  chipsRow: {
    gap: 10,
    paddingVertical: 2,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: palette.chip,
  },
  optionChipActive: {
    backgroundColor: palette.accent,
  },
  optionChipText: {
    color: palette.ink,
    fontWeight: '600',
  },
  optionChipTextActive: {
    color: '#FFFFFF',
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
  disabledButton: {
    opacity: 0.4,
  },
});
