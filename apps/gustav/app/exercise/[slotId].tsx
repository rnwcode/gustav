import { useLocalSearchParams } from 'expo-router';

import { ExerciseScreen } from '../../src/features/plan/ui/ExerciseScreen';

export default function ExerciseRoute() {
  const { slotId } = useLocalSearchParams<{ slotId: string }>();
  return <ExerciseScreen slotId={slotId} />;
}
