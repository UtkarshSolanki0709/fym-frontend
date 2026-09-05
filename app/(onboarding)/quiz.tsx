import { StepShell } from '@/components/onboarding/StepShell';
import { Button } from '@/components/ui/button';
import { Illustration } from '@/components/ui/illustration';
import { Text } from '@/components/ui/text';
import { ApiError, setOnboardingStep, updateQuiz } from '@/lib/api/client';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Pressable, View } from 'react-native';

const QUESTIONS = [
  { id: 'q1', text: 'I recharge alone more than in a crowd' },
  { id: 'q2', text: 'Plans > spontaneity' },
  { id: 'q3', text: 'I text back fast' },
  { id: 'q4', text: 'Big feelings, soft voice' },
  { id: 'q5', text: 'Ambition is attractive' },
  { id: 'q6', text: 'I want something serious' },
];

export default function QuizScreen() {
  const [idx, setIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const q = QUESTIONS[idx];

  const pick = (value: number) => {
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    if (idx < QUESTIONS.length - 1) {
      setIdx(idx + 1);
    } else {
      void finish(next);
    }
  };

  const finish = async (finalAnswers: Record<string, number>) => {
    setBusy(true);
    setError(undefined);
    try {
      const payload = QUESTIONS.map((qq) => ({
        question_id: qq.id,
        value: finalAnswers[qq.id] ?? 3,
      }));
      await updateQuiz(payload);
      await setOnboardingStep('complete');
      router.replace('/(tabs)/discovery' as Href);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Quiz save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      <StepShell
        step="quiz"
        title={`Question ${idx + 1} of ${QUESTIONS.length}`}
        subtitle={q.text}
        footer={
          error ? (
            <View>
              <Text className="mb-2 font-jakarta-bold text-sm text-red-500">{error}</Text>
              <Button size="lg" disabled={busy} onPress={() => finish(answers)}>
                <Text>Retry</Text>
              </Button>
            </View>
          ) : null
        }
      >
        <View className="mb-4 flex-row items-center gap-3 rounded-card border-brutal border-fym-ink bg-fym-pastel-yellow p-3">
          <Illustration name="pineappleUpsideDownCake" size={36} />
          <View className="flex-1">
            <Text className="font-jakarta-bold text-xs uppercase tracking-wide text-fym-ink">
              Vibe Check · {idx + 1} of {QUESTIONS.length}
            </Text>
            <Text className="font-jakarta text-xs text-fym-text-muted">
              Answer intuitively — no right or wrong answers.
            </Text>
          </View>
        </View>

        <View className="gap-3">
          {[1, 2, 3, 4, 5].map((v) => (
            <Pressable
              key={v}
              disabled={busy}
              onPress={() => pick(v)}
              className="rounded-card border border-border bg-white px-4 py-4"
            >
              <Text className="font-jakarta-bold text-fym-ink">
                {v === 1
                  ? '1 — Disagree'
                  : v === 5
                    ? '5 — Agree'
                    : String(v)}
              </Text>
            </Pressable>
          ))}
        </View>
      </StepShell>
    </>
  );
}
