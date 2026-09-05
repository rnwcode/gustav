import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'onboarding_controller.dart';
import 'steps/breed_step.dart';
import 'steps/budget_step.dart';
import 'steps/dog_step.dart';
import 'steps/household_step.dart';
import 'steps/review_step.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key, required this.onDone});

  final VoidCallback onDone;

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _pageController = PageController();

  static const _stepCount = 5;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _goTo(int step) {
    ref.read(onboardingStepProvider.notifier).state = step;
    _pageController.animateToPage(
      step,
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final step = ref.watch(onboardingStepProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Neuer Hund')),
      body: Column(
        children: [
          LinearProgressIndicator(value: (step + 1) / _stepCount),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              onPageChanged: (index) =>
                  ref.read(onboardingStepProvider.notifier).state = index,
              children: [
                const DogStep(),
                const BreedStep(),
                const HouseholdStep(),
                const BudgetStep(),
                ReviewStep(onSubmitted: widget.onDone),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(
                  onPressed: step > 0 ? () => _goTo(step - 1) : null,
                  child: const Text('Zurück'),
                ),
                if (step < _stepCount - 1)
                  FilledButton(
                    onPressed: () => _goTo(step + 1),
                    child: const Text('Weiter'),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
