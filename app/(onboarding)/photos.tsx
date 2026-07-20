import { StepShell } from '@/components/onboarding/StepShell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ApiError, setOnboardingStep, uploadPhoto } from '@/lib/api/client';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Pressable, View } from 'react-native';

export default function PhotosScreen() {
  const [photos, setPhotos] = React.useState<{ id: string; url: string }[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const pick = async () => {
    if (busy || photos.length >= 6) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;
    setBusy(true);
    setError(undefined);
    try {
      const res = await uploadPhoto(result.assets[0].base64);
      setPhotos((prev) => [...prev, res]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const next = async () => {
    await setOnboardingStep('photos');
    router.push('/(onboarding)/interests' as Href);
  };

  return (
    <>
      <StatusBar style="dark" />
      <StepShell
        step="photos"
        title={"Add your\nphotos"}
        subtitle="Up to six. The first one is your main profile photo."
        footer={
          <View className="gap-2">
            {error ? (
              <Text className="font-jakarta-bold text-sm text-red-500">{error}</Text>
            ) : null}
            <Button size="lg" disabled={busy || photos.length === 0} onPress={next}>
              <Text>{busy ? 'Uploading…' : photos.length === 0 ? 'Skip for now' : `Next (${photos.length} added)`}</Text>
            </Button>
          </View>
        }
      >
        <View className="flex-row flex-wrap gap-3">
          {photos.map((p, i) => (
            <View key={p.id} className="h-28 w-[30%] overflow-hidden rounded-card border border-border">
              <Image source={{ uri: p.url }} className="h-full w-full" contentFit="cover" />
              {i === 0 ? (
                <View className="absolute bottom-0 left-0 right-0 bg-fym-coral px-1 py-0.5">
                  <Text className="text-center font-jakarta-bold text-[9px] uppercase text-white">
                    Main
                  </Text>
                </View>
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