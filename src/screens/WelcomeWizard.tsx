import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { palette } from '../theme';
import type { PetProfile } from '../types';
import { genderOptions, SPECIES_OPTIONS, OWNER_CALL_OPTIONS, FIRST_PERSON_OPTIONS, TONE_OPTIONS, AVATAR_ICONS } from '../data/constants';

export default function WelcomeWizard() {
  const { dispatch, actions } = useAppContext();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [species, setSpecies] = useState('');
  const [speciesCustom, setSpeciesCustom] = useState('');
  const [gender, setGender] = useState<PetProfile['gender'] | ''>('');
  const [personality, setPersonality] = useState('');
  const [firstPerson, setFirstPerson] = useState('');
  const [firstPersonCustom, setFirstPersonCustom] = useState('');
  const [ownerCall, setOwnerCall] = useState('');
  const [tone, setTone] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [avatarIcon, setAvatarIcon] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const resolvedSpecies = species === 'その他' ? speciesCustom.trim() : species;
  const displayName = name.trim() || 'ペット';
  const resolvedFirstPerson = firstPerson === 'その他' ? firstPersonCustom.trim() : firstPerson;
  const [ownerCallCustom, setOwnerCallCustom] = useState('');
  const resolvedOwnerCall = ownerCall === 'その他' ? ownerCallCustom.trim() : ownerCall;

  async function pickAvatarImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0]?.uri ?? '');
      setAvatarIcon('');
    }
  }

  const steps = [
    {
      question: 'ペットのお名前を教えてください',
      placeholder: '例: むぎ、コタ、ピノ',
      canNext: name.trim().length > 0,
    },
    {
      question: `${displayName}を普段なんて呼んでいますか？`,
      hint: 'お名前と同じならそのまま「つぎへ」を押してください',
      placeholder: `例: むーちゃん、こっちゃん`,
      canNext: true,
    },
    {
      question: `${displayName}のアイコンを選んでください`,
      hint: '写真をアップロードすることもできます',
      canNext: avatarIcon.length > 0 || avatarUri.length > 0,
    },
    {
      question: `${displayName}はどんな動物ですか？`,
      canNext: resolvedSpecies.length > 0,
    },
    {
      question: `${displayName}の性別は？`,
      canNext: gender !== '',
    },
    {
      question: `${displayName}はどんな性格ですか？`,
      placeholder: '例: 甘えん坊で少しツンデレ、人見知りだけど慣れると甘える',
      canNext: personality.trim().length > 0,
    },
    {
      question: `${displayName}は自分のことをなんて言いますか？`,
      canNext: resolvedFirstPerson.length > 0,
    },
    {
      question: `${displayName}はあなたのことをなんて呼ぶ？`,
      canNext: resolvedOwnerCall.length > 0,
    },
    {
      question: `${displayName}はどんな話し方をしますか？`,
      canNext: tone.length > 0,
    },
  ];

  const current = steps[step];

  async function handleComplete() {
    setIsCreating(true);
    const id = `pet-${Date.now()}`;
    const trimmedName = name.trim();
    const pet: PetProfile = {
      id,
      name: trimmedName,
      nickname: nickname.trim() || trimmedName,
      species: resolvedSpecies,
      gender: gender as PetProfile['gender'],
      personality: personality.trim(),
      firstPerson: resolvedFirstPerson || trimmedName,
      ownerCall: resolvedOwnerCall || '飼い主さん',
      tone,
      avatarUri: avatarUri || (avatarIcon ? `icon:${avatarIcon}` : ''),
      sessionKey: `pet:${id}:main`,
    };
    const ok = await actions.handleAddPet(pet);
    setIsCreating(false);
    if (ok) {
      dispatch({ type: 'SET_SHOW_WELCOME', value: false });
    }
  }

  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <View style={[styles.welcomeScreen, { paddingBottom: 32 + insets.bottom }]}>
        <View style={styles.welcomeContent}>
          <MaterialCommunityIcons name="paw" size={64} color={palette.accent} />
          <Text style={styles.welcomeTitle}>ペットとおはなし</Text>
          <Text style={styles.welcomeSubtitle}>
            あなたのペットがおしゃべりの相手に{'\n'}なってくれるアプリです
          </Text>
        </View>
        <View style={styles.welcomeActions}>
          <Pressable style={styles.primaryButton} onPress={() => setStarted(true)}>
            <Text style={styles.primaryButtonText}>ペットを登録する</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => dispatch({ type: 'SET_SHOW_WELCOME', value: false })}>
            <Text style={styles.secondaryButtonText}>アカウントをお持ちの方はログイン</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.welcomeScreen, { paddingBottom: 32 + insets.bottom }]}>
      <View style={styles.wizardProgress}>
        <Text style={styles.wizardStep}>{step + 1} / {steps.length}</Text>
      </View>

      <View style={styles.wizardBody}>
        <Text style={styles.wizardQuestion}>{current?.question}</Text>
        {current?.hint && <Text style={styles.wizardHint}>{current.hint}</Text>}

        {step === 0 && (
          <TextInput
            style={styles.wizardInput}
            value={name}
            onChangeText={setName}
            placeholder={current?.placeholder}
            placeholderTextColor={palette.muted}
            autoFocus
          />
        )}

        {step === 1 && (
          <TextInput
            style={styles.wizardInput}
            value={nickname}
            onChangeText={setNickname}
            placeholder={current?.placeholder}
            placeholderTextColor={palette.muted}
            autoFocus
          />
        )}

        {step === 2 && (
          <View style={styles.wizardAvatarSection}>
            <View style={styles.wizardAvatarPreview}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.wizardAvatarImage} />
              ) : avatarIcon ? (
                <MaterialCommunityIcons name={avatarIcon as keyof typeof MaterialCommunityIcons.glyphMap} size={48} color={palette.accent} />
              ) : (
                <MaterialCommunityIcons name="help-circle-outline" size={48} color={palette.muted} />
              )}
            </View>
            <View style={styles.wizardChips}>
              {AVATAR_ICONS.map((item) => (
                <Pressable
                  key={item.icon}
                  style={[styles.wizardIconChip, avatarIcon === item.icon && !avatarUri && styles.wizardChipActive]}
                  onPress={() => { setAvatarIcon(item.icon); setAvatarUri(''); }}
                >
                  <MaterialCommunityIcons name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={24} color={avatarIcon === item.icon && !avatarUri ? palette.accent : palette.text} />
                  <Text style={[styles.wizardIconChipLabel, avatarIcon === item.icon && !avatarUri && styles.wizardChipTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.secondaryButton} onPress={() => void pickAvatarImage()}>
              <Feather name="camera" size={16} color={palette.accent} style={{ marginRight: 6 }} />
              <Text style={styles.secondaryButtonText}>写真をアップロード</Text>
            </Pressable>
          </View>
        )}

        {step === 3 && (
          <View style={styles.wizardChips}>
            {SPECIES_OPTIONS.map((s) => (
              <Pressable
                key={s}
                style={[styles.wizardChip, species === s && styles.wizardChipActive]}
                onPress={() => setSpecies(s)}
              >
                <Text style={[styles.wizardChipText, species === s && styles.wizardChipTextActive]}>{s}</Text>
              </Pressable>
            ))}
            {species === 'その他' && (
              <TextInput
                style={styles.wizardInput}
                value={speciesCustom}
                onChangeText={setSpeciesCustom}
                placeholder="どんな動物ですか？"
                placeholderTextColor={palette.muted}
                autoFocus
              />
            )}
          </View>
        )}

        {step === 4 && (
          <View style={styles.wizardChips}>
            {genderOptions.map((g) => (
              <Pressable
                key={g}
                style={[styles.wizardChip, gender === g && styles.wizardChipActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.wizardChipText, gender === g && styles.wizardChipTextActive]}>{g}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {step === 5 && (
          <TextInput
            style={[styles.wizardInput, styles.textArea]}
            value={personality}
            onChangeText={setPersonality}
            placeholder={current?.placeholder}
            placeholderTextColor={palette.muted}
            multiline
            autoFocus
          />
        )}

        {step === 6 && (
          <View style={styles.wizardChips}>
            {[...FIRST_PERSON_OPTIONS, 'その他'].map((fp) => (
              <Pressable
                key={fp}
                style={[styles.wizardChip, firstPerson === fp && styles.wizardChipActive]}
                onPress={() => setFirstPerson(fp)}
              >
                <Text style={[styles.wizardChipText, firstPerson === fp && styles.wizardChipTextActive]}>{fp}</Text>
              </Pressable>
            ))}
            {firstPerson === 'その他' && (
              <TextInput
                style={styles.wizardInput}
                value={firstPersonCustom}
                onChangeText={setFirstPersonCustom}
                placeholder={`例: ${name.trim() || 'むぎ'}、おいら`}
                placeholderTextColor={palette.muted}
                autoFocus
              />
            )}
          </View>
        )}

        {step === 7 && (
          <View style={styles.wizardChips}>
            {[...OWNER_CALL_OPTIONS, 'その他'].map((o) => (
              <Pressable
                key={o}
                style={[styles.wizardChip, ownerCall === o && styles.wizardChipActive]}
                onPress={() => setOwnerCall(o)}
              >
                <Text style={[styles.wizardChipText, ownerCall === o && styles.wizardChipTextActive]}>{o}</Text>
              </Pressable>
            ))}
            {ownerCall === 'その他' && (
              <TextInput
                style={styles.wizardInput}
                value={ownerCallCustom}
                onChangeText={setOwnerCallCustom}
                placeholder="例: おとうさん、なっちゃん"
                placeholderTextColor={palette.muted}
                autoFocus
              />
            )}
          </View>
        )}

        {step === 8 && (
          <View style={styles.wizardChips}>
            {TONE_OPTIONS.map((t) => (
              <Pressable
                key={t}
                style={[styles.wizardChip, tone === t && styles.wizardChipActive]}
                onPress={() => setTone(t)}
              >
                <Text style={[styles.wizardChipText, tone === t && styles.wizardChipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.welcomeActions}>
        {step < steps.length - 1 ? (
          <Pressable
            style={[styles.primaryButton, !current?.canNext && styles.disabledButton]}
            onPress={() => setStep(step + 1)}
            disabled={!current?.canNext}
          >
            <Text style={styles.primaryButtonText}>つぎへ</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.primaryButton, (!current?.canNext || isCreating) && styles.disabledButton]}
            onPress={() => void handleComplete()}
            disabled={!current?.canNext || isCreating}
          >
            <Text style={styles.primaryButtonText}>{isCreating ? '登録中…' : `${displayName}を登録する`}</Text>
          </Pressable>
        )}

        {step > 0 ? (
          <Pressable style={styles.welcomeLoginLink} onPress={() => setStep(step - 1)}>
            <Text style={styles.welcomeLoginText}>もどる</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.welcomeLoginLink} onPress={() => setStarted(false)}>
            <Text style={styles.welcomeLoginText}>もどる</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeScreen: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 48,
  },
  welcomeContent: {
    alignItems: 'center',
    gap: 16,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: palette.ink,
    marginTop: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: palette.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  welcomeActions: {
    gap: 12,
    alignItems: 'stretch',
  },
  welcomeLoginLink: {
    paddingVertical: 8,
  },
  welcomeLoginText: {
    fontSize: 14,
    color: palette.muted,
    textDecorationLine: 'underline',
  },
  wizardProgress: {
    alignItems: 'center',
    paddingTop: 12,
  },
  wizardStep: {
    fontSize: 13,
    color: palette.muted,
    fontWeight: '600',
  },
  wizardBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  wizardQuestion: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.ink,
    textAlign: 'center',
    lineHeight: 30,
  },
  wizardHint: {
    fontSize: 13,
    color: palette.muted,
    textAlign: 'center',
    marginTop: -8,
  },
  wizardInput: {
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: palette.ink,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  wizardChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  wizardChip: {
    backgroundColor: palette.chip,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  wizardChipActive: {
    backgroundColor: palette.accentSoft,
    borderColor: palette.accent,
  },
  wizardChipText: {
    fontSize: 15,
    color: palette.text,
    fontWeight: '500',
  },
  wizardChipTextActive: {
    color: palette.accent,
    fontWeight: '700',
  },
  wizardAvatarSection: {
    alignItems: 'center',
    gap: 16,
  },
  wizardAvatarPreview: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: palette.chip,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wizardAvatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  wizardIconChip: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.chip,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  wizardIconChipLabel: {
    fontSize: 11,
    color: palette.text,
  },
  primaryButton: {
    backgroundColor: palette.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
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
});
