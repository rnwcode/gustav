import { useRouter } from 'expo-router';

import { usePlanStore } from '../src/features/plan/data/planStore';
import { OnboardingScreen } from '../src/features/onboarding/ui/OnboardingScreen';

export default function OnboardingRoute() {
  const router = useRouter();
  const loadOrGeneratePlan = usePlanStore((s) => s.loadOrGeneratePlan);

  return (
    <OnboardingScreen
      onComplete={async (dogId) => {
        await loadOrGeneratePlan(dogId);
        router.replace('/day');
      }}
    />
  );
}
