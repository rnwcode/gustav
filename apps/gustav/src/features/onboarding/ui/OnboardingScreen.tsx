import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Body, Button, Mono, Screen } from '../../../design/components';
import { ProgressDashes } from '../../../design/components/Progress';
import { spacing } from '../../../design/tokens';
import { ONBOARDING_STEP_COUNT, isStepComplete, useOnboardingStore } from '../data/onboardingStore';
import { Step1Dog } from './steps/Step1Dog';
import { Step2Origin } from './steps/Step2Origin';
import { Step3Body } from './steps/Step3Body';
import { Step4Household } from './steps/Step4Household';
import { Step5Budget } from './steps/Step5Budget';
import { Step6Review } from './steps/Step6Review';

const STEPS = [Step1Dog, Step2Origin, Step3Body, Step4Household, Step5Budget, Step6Review];

type Props = {
  /** Called once the dog + household rows are created — the caller owns
   * navigation to the day view (via generating the first plan). */
  onComplete: (dogId: string) => void;
};

export function OnboardingScreen({ onComplete }: Props) {
  const step = useOnboardingStore((s) => s.step);
  const draft = useOnboardingStore((s) => s.draft);
  const next = useOnboardingStore((s) => s.next);
  const back = useOnboardingStore((s) => s.back);
  const submitDraft = useOnboardingStore((s) => s.submitDraft);
  const submitStatus = useOnboardingStore((s) => s.submit);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const StepComponent = STEPS[step];
  const isLastStep = step === ONBOARDING_STEP_COUNT - 1;
  const canAdvance = isStepComplete(step, draft);

  async function handlePrimaryAction() {
    if (!isLastStep) {
      next();
      return;
    }
    setSubmitError(null);
    try {
      const dogId = await submitDraft();
      onComplete(dogId);
    } catch {
      setSubmitError('Das hat nicht geklappt. Bitte noch einmal versuchen.');
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <ProgressDashes total={ONBOARDING_STEP_COUNT} current={step} />
          <Mono>
            Schritt {step + 1} von {ONBOARDING_STEP_COUNT}
          </Mono>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <StepComponent />
          {isLastStep ? (
            <View style={styles.reviewAction}>
              <Button variant="primary" onPress={handlePrimaryAction} loading={submitStatus.status === 'submitting'}>
                Erste Periode erzeugen
              </Button>
              {submitError ? <Body>{submitError}</Body> : null}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button variant="ghost" onPress={back} disabled={step === 0}>
            Zurück
          </Button>
          {isLastStep ? null : (
            <Button variant="tint" flex onPress={handlePrimaryAction} disabled={!canAdvance}>
              Weiter
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  content: { padding: spacing.xl, gap: spacing.xl },
  reviewAction: { gap: spacing.sm },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    padding: spacing.xl,
  },
});
