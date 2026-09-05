import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { onboardingRepository } from '../src/features/onboarding/data/onboardingRepository';
import { usePlanStore } from '../src/features/plan/data/planStore';
import { Body, Mono, Screen } from '../src/design/components';
import { useTheme } from '../src/design/useTheme';
import { useSessionStore } from '../src/state/sessionStore';

/**
 * Decides where the app opens: onboarding if there's no dog yet, otherwise
 * today's plan — generating one first if the current period hasn't been
 * planned yet. A plan is generated at most once per period (CLAUDE.md,
 * Regel 10), so this redirect only ever calls generate-plan when needed.
 */
export default function Index() {
  const router = useRouter();
  const { colors } = useTheme();
  const sessionStatus = useSessionStore((s) => s.status);
  const ensureSignedIn = useSessionStore((s) => s.ensureSignedIn);
  const loadOrGeneratePlan = usePlanStore((s) => s.loadOrGeneratePlan);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      await ensureSignedIn();
      try {
        const dogId = await onboardingRepository.findExistingDogId();
        if (!dogId) {
          router.replace('/onboarding');
          return;
        }
        await loadOrGeneratePlan(dogId);
        router.replace('/day');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'unknown error');
      }
    })();
  }, [ensureSignedIn, loadOrGeneratePlan, router]);

  return (
    <Screen style={{ alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      {error ? (
        <Body>{error}</Body>
      ) : (
        <>
          <ActivityIndicator color={colors.accent} />
          <Mono>{sessionStatus === 'loading' ? 'Verbinde …' : 'Lädt …'}</Mono>
        </>
      )}
    </Screen>
  );
}
