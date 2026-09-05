import { StepShell } from '@/components/onboarding/StepShell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ApiError, deletePhoto, resolveMediaUrl, setOnboardingStep, uploadPhoto } from '@/lib/api/client';
import { loadUserProfile, setPhotos as persistProfilePhotos } from '@/lib/userProfile';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

type PhotoItem = {
  id: string;
  url: string;
  localUri?: string;
  uploading?: boolean;
};

export default function PhotosScreen() {
  const [photos, setPhotos] = React.useState<PhotoItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  React.useEffect(() => {
    loadUserProfile()
      .then((p) => {
        if (p.photos && p.photos.length > 0) {
          const real = p.photos.filter((x) => !x.id.startsWith('demo-'));
          if (real.length > 0) {
            setPhotos(
              real.map((x) => ({
                id: x.id,
                url: resolveMediaUrl(x.url),
                localUri: x.url.startsWith('file:') ? x.url : undefined,
              }))
            );
          }
        }
      })
      .catch(() => undefined);
  }, []);

  const pick = async () => {
    if (busy || photos.length >= 6) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.8,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset || !asset.base64) return;
    const base64 = asset.base64;
    const tempId = `temp-${Date.now()}`;
    const localUri = asset.uri;

    // Show preview immediately on screen!
    setPhotos((prev) => [...prev, { id: tempId, url: localUri, localUri, uploading: true }]);
    setBusy(true);
    setError(undefined);
    try {
      const res = await uploadPhoto(base64);
      const uploadedUrl = resolveMediaUrl(res.url);
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === tempId
            ? { id: res.id, url: uploadedUrl, localUri, uploading: false }
            : p
        )
      );
      try {
        const current = await loadUserProfile();
        const existing = (current.photos ?? []).filter((x) => !x.id.startsWith('demo-'));
        await persistProfilePhotos([...existing, { id: res.id, url: uploadedUrl }]);
      } catch {
        /* best-effort local sync */
      }
    } catch (e) {
      setPhotos((prev) => prev.filter((p) => p.id !== tempId));
      setError(e instanceof ApiError ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async (id: string, index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    try {
      const current = await loadUserProfile();
      const existing = (current.photos ?? []).filter((x) => x.id !== id);
      await persistProfilePhotos(existing);
    } catch {
      /* best-effort local sync */
    }
    if (!id.startsWith('temp-') && !id.startsWith('local-')) {
      try {
        await deletePhoto(id);
      } catch {
        /* best-effort */
      }
    }
  };

  const next = async () => {
    await setOnboardingStep('photos');
    router.push('/(onboarding)/liveness' as Href);
  };

  return (
    <>
      <StatusBar style="dark" />
      <StepShell
        step="photos"
        title={"Add your\nphotos"}
        subtitle="Up to six. The first one is your main profile photo. Add at least one — the face check next compares itself against these."
        footer={
          <View className="gap-2">
            {error ? (
              <Text className="font-jakarta-bold text-sm text-red-500">{error}</Text>
            ) : null}
            <Button size="lg" disabled={busy || photos.length === 0} onPress={next}>
              <Text>
                {busy
                  ? 'Uploading…'
                  : photos.length === 0
                    ? 'Add at least one photo'
                    : `Next: face check (${photos.length} added)`}
              </Text>
            </Button>
          </View>
        }
      >
        <View className="flex-row flex-wrap gap-3">
          {photos.map((p, i) => (
            <View key={p.id} className="relative h-28 w-[30%] overflow-hidden rounded-card border border-border bg-slate-100">
              <Image
                source={{ uri: p.localUri || resolveMediaUrl(p.url) }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={200}
              />
              {p.uploading && (
                <View className="absolute inset-0 items-center justify-center bg-black/40">
                  <ActivityIndicator color="#FFFFFF" size="small" />
                </View>
              )}
              {i === 0 && !p.uploading ? (
                <View className="absolute bottom-0 left-0 right-0 bg-fym-coral px-1 py-0.5">
                  <Text className="text-center font-jakarta-bold text-[9px] uppercase text-white">
                    Main
                  </Text>
                </View>
              ) : null}
              {!p.uploading ? (
                <Pressable
                  onPress={() => void removePhoto(p.id, i)}
                  className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-black/60 active:opacity-70"
                  accessibilityLabel="Remove photo"
                >
                  <X size={12} color="#FFFFFF" />
                </Pressable>
              ) : null}
            </View>
          ))}
          {photos.length < 6 ? (
            <Pressable
              onPress={pick}
              disabled={busy}
              className="h-28 w-[30%] items-center justify-center rounded-card border border-dashed border-border bg-white active:opacity-70"
            >
              <Text className="font-jakarta-bold text-2xl text-fym-text-muted">+</Text>
            </Pressable>
          ) : null}
        </View>
      </StepShell>
    </>
  );
}