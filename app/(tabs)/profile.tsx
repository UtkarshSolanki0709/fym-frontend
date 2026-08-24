import { ScreenEnter } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { ApiError, deletePhoto, uploadPhoto } from '@/lib/api/client';
import { hasSession } from '@/lib/api/session';
import {
  getUserProfile,
  loadUserProfile,
  PROMPT_SUGGESTIONS,
  setPhotos,
  setPrompts,
  subscribeUserProfile,
  type ProfilePhoto,
  type ProfilePrompt,
  type UserProfile,
} from '@/lib/userProfile';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  Plus,
  Settings,
  Trash2,
  Zap,
} from 'lucide-react-native';
import * as React from 'react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INK = '#14213D';
const MAX_PHOTOS = 6;
const MAX_PROMPTS = 4;

const brutalShadow = {
  shadowColor: INK,
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 3,
} as const;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [pressedEdit, setPressedEdit] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<number | null>(null);
  const [draftQ, setDraftQ] = useState('');
  const [draftA, setDraftA] = useState('');

  React.useEffect(() => {
    void loadUserProfile().then(setProfile);
    return subscribeUserProfile(() => setProfile(getUserProfile()));
  }, []);

  const openEdit = () => router.push('/edit-profile' as Href);
  const openSettings = () => router.push('/settings' as Href);

  const photos = profile.photos;
  const prompts = profile.prompts;

  const movePhoto = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    const tmp = next[index]!;
    next[index] = next[j]!;
    next[j] = tmp;
    await setPhotos(next);
  };

  const replacePhoto = async (index: number) => {
    if (photoBusy) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setPhotoBusy(true);
    try {
      let next: ProfilePhoto;
      if (asset.base64 && (await hasSession())) {
        try {
          const old = photos[index];
          const uploaded = await uploadPhoto(asset.base64);
          if (old && !old.id.startsWith('demo-') && !old.id.startsWith('local-')) {
            try {
              await deletePhoto(old.id);
            } catch {
              /* keep going */
            }
          }
          next = uploaded;
        } catch (e) {
          Alert.alert(
            'Upload failed',
            e instanceof ApiError ? e.message : 'Using local preview only',
          );
          next = {
            id: `local-${Date.now()}`,
            url: asset.uri,
          };
        }
      } else {
        next = {
          id: `local-${Date.now()}`,
          url: asset.uri,
        };
      }
      const list = [...photos];
      list[index] = next;
      await setPhotos(list);
    } finally {
      setPhotoBusy(false);
    }
  };

  const addPhoto = async () => {
    if (photoBusy || photos.length >= MAX_PHOTOS) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setPhotoBusy(true);
    try {
      let item: ProfilePhoto;
      if (asset.base64 && (await hasSession())) {
        try {
          item = await uploadPhoto(asset.base64);
        } catch {
          item = { id: `local-${Date.now()}`, url: asset.uri };
        }
      } else {
        item = { id: `local-${Date.now()}`, url: asset.uri };
      }
      await setPhotos([...photos, item]);
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = (index: number) => {
    if (photos.length <= 1) {
      Alert.alert('Keep one photo', 'You need at least one photo on your profile.');
      return;
    }
    const photo = photos[index]!;
    Alert.alert('Remove photo?', 'This slot will be deleted from your profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            if (
              (await hasSession()) &&
              !photo.id.startsWith('demo-') &&
              !photo.id.startsWith('local-')
            ) {
              try {
                await deletePhoto(photo.id);
              } catch {
                /* still drop local */
              }
            }
            await setPhotos(photos.filter((_, i) => i !== index));
          })();
        },
      },
    ]);
  };

  const startEditPrompt = (i: number) => {
    const p = prompts[i];
    if (!p) return;
    setEditingPrompt(i);
    setDraftQ(p.question);
    setDraftA(p.answer);
  };

  const savePrompt = async () => {
    if (editingPrompt == null) return;
    if (!draftQ.trim() || !draftA.trim()) {
      Alert.alert('Fill both fields', 'Question and answer are required.');
      return;
    }
    const next = [...prompts];
    next[editingPrompt] = { question: draftQ.trim(), answer: draftA.trim() };
    await setPrompts(next);
    setEditingPrompt(null);
  };

  const addPrompt = async () => {
    if (prompts.length >= MAX_PROMPTS) {
      Alert.alert('Limit reached', `Up to ${MAX_PROMPTS} prompts.`);
      return;
    }
    const used = new Set(prompts.map((p) => p.question));
    const q =
      PROMPT_SUGGESTIONS.find((s) => !used.has(s)) ?? 'Something I want you to know…';
    const next: ProfilePrompt[] = [
      ...prompts,
      { question: q, answer: 'Tap edit to write your answer.' },
    ];
    await setPrompts(next);
    setEditingPrompt(next.length - 1);
    setDraftQ(q);
    setDraftA('');
  };

  const removePrompt = (index: number) => {
    Alert.alert('Remove prompt?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void setPrompts(prompts.filter((_, i) => i !== index));
          if (editingPrompt === index) setEditingPrompt(null);
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-fym-surface">
      <StatusBar style="dark" />

      <View
        className="flex-row items-center justify-between border-b-brutal border-fym-ink bg-fym-surface px-gutter"
        style={{ paddingTop: insets.top, paddingBottom: 8 }}
      >
        <Pressable
          onPress={() => router.push('/(tabs)/discovery' as Href)}
          accessibilityLabel="Go to discovery"
          className="p-2"
        >
          <Zap size={24} color={INK} />
        </Pressable>
        <Text className="font-display-extrabold text-2xl uppercase tracking-tighter text-fym-ink">
          You
        </Text>
        <Pressable onPress={openSettings} accessibilityLabel="Open settings" className="p-2">
          <Settings size={24} color={INK} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="px-gutter pb-36"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenEnter variant="down" className="items-center py-8">
          <View className="relative mb-4">
            <View
              className="h-28 w-28 overflow-hidden rounded-full border-brutal border-fym-ink"
              style={brutalShadow}
            >
              <Image
                source={{ uri: profile.photo_url }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            </View>
            <Pressable
              onPress={openEdit}
              onPressIn={() => setPressedEdit(true)}
              onPressOut={() => setPressedEdit(false)}
              accessibilityLabel="Edit profile details"
              className="absolute bottom-0 right-0 z-20 rounded-full border-brutal border-fym-ink bg-fym-mint p-2"
              style={
                pressedEdit
                  ? { transform: [{ translateX: 2 }, { translateY: 2 }] }
                  : brutalShadow
              }
            >
              <Edit3 size={16} color={INK} />
            </Pressable>
          </View>
          <Text className="font-display-extrabold text-2xl tracking-tight text-fym-ink">
            {profile.display_name}
            {profile.age != null ? `, ${profile.age}` : ''}
          </Text>
          <Text className="mt-1 font-jakarta text-sm text-fym-text-muted">
            {profile.bio || profile.location || 'Add a bio from Edit details'}
          </Text>
          <Pressable
            onPress={openEdit}
            className="mt-3 rounded-full border-brutal border-fym-ink bg-fym-pastel-lavender px-5 py-2"
            style={brutalShadow}
          >
            <Text className="font-jakarta-bold text-xs text-fym-ink">Edit details</Text>
          </Pressable>
        </ScreenEnter>

        {/* Photos */}
        <Card brutal contentClassName="bg-fym-cream p-4">
          <View className="mb-3 flex-row items-center justify-between border-b-2 border-fym-ink pb-2">
            <Text className="font-jakarta-extrabold text-sm uppercase tracking-wide text-fym-ink">
              Photos
            </Text>
            <Text className="font-jakarta-bold text-[10px] uppercase text-fym-text-muted">
              {photos.length}/{MAX_PHOTOS} · first is main
            </Text>
          </View>
          {photoBusy ? (
            <ActivityIndicator color={INK} className="my-4" />
          ) : null}
          <View className="flex-row flex-wrap gap-3">
            {photos.map((p, i) => (
              <View
                key={p.id}
                className="w-[47%] overflow-hidden rounded-card border-brutal border-fym-ink bg-white"
                style={brutalShadow}
              >
                <Pressable onPress={() => void replacePhoto(i)} accessibilityLabel="Replace photo">
                  <View className="relative aspect-[3/4] w-full">
                    <Image
                      source={{ uri: p.url }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                    {i === 0 ? (
                      <View className="absolute left-1 top-1 rounded-pill bg-fym-coral px-2 py-0.5">
                        <Text className="font-jakarta-bold text-[9px] uppercase text-white">
                          Main
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
                <View className="flex-row items-center justify-between border-t border-border px-1 py-1">
                  <Pressable
                    onPress={() => void movePhoto(i, -1)}
                    disabled={i === 0}
                    className="p-1.5 opacity-100 disabled:opacity-30"
                    accessibilityLabel="Move photo earlier"
                  >
                    <ChevronUp size={18} color={INK} />
                  </Pressable>
                  <Pressable
                    onPress={() => void movePhoto(i, 1)}
                    disabled={i === photos.length - 1}
                    className="p-1.5"
                    accessibilityLabel="Move photo later"
                  >
                    <ChevronDown size={18} color={INK} />
                  </Pressable>
                  <Pressable
                    onPress={() => void replacePhoto(i)}
                    className="p-1.5"
                    accessibilityLabel="Replace photo"
                  >
                    <Edit3 size={16} color={INK} />
                  </Pressable>
                  <Pressable
                    onPress={() => removePhoto(i)}
                    className="p-1.5"
                    accessibilityLabel="Remove photo"
                  >
                    <Trash2 size={16} color="#B91C1C" />
                  </Pressable>
                </View>
              </View>
            ))}
            {photos.length < MAX_PHOTOS ? (
              <Pressable
                onPress={() => void addPhoto()}
                disabled={photoBusy}
                className="w-[47%] items-center justify-center rounded-card border border-dashed border-fym-ink bg-white py-12 active:opacity-70"
                style={{ minHeight: 160 }}
              >
                <Plus size={28} color={INK} />
                <Text className="mt-1 font-jakarta-bold text-xs uppercase text-fym-text-muted">
                  Add photo
                </Text>
              </Pressable>
            ) : null}
          </View>
          <Text className="mt-3 font-jakarta text-xs text-fym-text-muted">
            Tap a photo to replace. Use arrows to reorder. First slot is your ace photo.
          </Text>
        </Card>

        {/* Prompts */}
        <View className="mt-6">
          <Card brutal reverse contentClassName="bg-fym-pastel-lavender p-4">
            <View className="mb-3 flex-row items-center justify-between border-b-2 border-fym-ink pb-2">
              <Text className="font-jakarta-extrabold text-sm uppercase tracking-wide text-fym-ink">
                Prompts
              </Text>
              <Text className="font-jakarta-bold text-[10px] uppercase text-fym-text-muted">
                {prompts.length}/{MAX_PROMPTS}
              </Text>
            </View>

            <View className="gap-3">
              {prompts.map((p, i) => (
                <View
                  key={`${p.question}-${i}`}
                  className="rounded-card border-brutal border-fym-ink bg-white p-3"
                  style={brutalShadow}
                >
                  {editingPrompt === i ? (
                    <View className="gap-2">
                      <Input
                        label="Question"
                        value={draftQ}
                        onChangeText={setDraftQ}
                        placeholder="Prompt question"
                      />
                      <Input
                        label="Your answer"
                        value={draftA}
                        onChangeText={setDraftA}
                        placeholder="Write something real"
                      />
                      <View className="flex-row gap-2">
                        <View className="flex-1">
                          <Button variant="secondary" onPress={() => setEditingPrompt(null)}>
                            <Text>Cancel</Text>
                          </Button>
                        </View>
                        <View className="flex-1">
                          <Button onPress={() => void savePrompt()}>
                            <Text>Save</Text>
                          </Button>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <>
                      <Text className="font-jakarta-bold text-[10px] uppercase text-fym-coral">
                        {p.question}
                      </Text>
                      <Text className="mt-1 font-jakarta text-sm text-fym-ink">{p.answer}</Text>
                      <View className="mt-2 flex-row gap-2">
                        <Pressable
                          onPress={() => startEditPrompt(i)}
                          className="rounded-full border border-fym-ink bg-fym-mint px-3 py-1.5"
                        >
                          <Text className="font-jakarta-bold text-[10px] uppercase text-fym-ink">
                            Edit
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => removePrompt(i)}
                          className="rounded-full border border-fym-ink bg-white px-3 py-1.5"
                        >
                          <Text className="font-jakarta-bold text-[10px] uppercase text-fym-ink">
                            Remove
                          </Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              ))}
            </View>

            {prompts.length < MAX_PROMPTS ? (
              <View className="mt-4">
                <Button variant="secondary" onPress={() => void addPrompt()}>
                  <Text>Add prompt</Text>
                </Button>
              </View>
            ) : null}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
