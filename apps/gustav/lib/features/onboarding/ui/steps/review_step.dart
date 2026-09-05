import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../onboarding_controller.dart';
import '../onboarding_labels.dart';

class ReviewStep extends ConsumerWidget {
  const ReviewStep({super.key, required this.onSubmitted});

  final VoidCallback onSubmitted;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(onboardingDraftProvider);
    final submission = ref.watch(onboardingSubmissionProvider);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Übersicht', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 16),
        Text(
          '${draft.dogName ?? '—'}, '
          '${breedGroupLabels[draft.breedGroup] ?? '—'}, '
          '${sizeClassLabels[draft.sizeClass] ?? '—'}',
        ),
        const SizedBox(height: 4),
        Text(
          '${housingTypeLabels[draft.housingType] ?? '—'}, '
          '${surroundingsLabels[draft.surroundings] ?? '—'}',
        ),
        const SizedBox(height: 4),
        Text(
          'Werktags ${draft.weekdayTimeBudgetMinutes ?? '—'} min, '
          'am Wochenende ${draft.weekendTimeBudgetMinutes ?? '—'} min',
        ),
        const SizedBox(height: 24),
        if (submission.hasError)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Text(
              'Das hat nicht geklappt: ${submission.error}',
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ),
        FilledButton(
          onPressed: draft.isComplete && !submission.isLoading
              ? () async {
                  final ok = await ref
                      .read(onboardingSubmissionProvider.notifier)
                      .submit(draft);
                  if (ok) onSubmitted();
                }
              : null,
          child: submission.isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Anlegen'),
        ),
        if (!draft.isComplete)
          const Padding(
            padding: EdgeInsets.only(top: 8),
            child: Text('Bitte alle vorherigen Schritte ausfüllen.'),
          ),
      ],
    );
  }
}
