import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/dog.dart';
import '../onboarding_controller.dart';
import '../onboarding_labels.dart';

class BreedStep extends ConsumerWidget {
  const BreedStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(onboardingDraftProvider);
    final controller = ref.read(onboardingDraftProvider.notifier);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Rasse und Größe',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),
        Text('Rassegruppe', style: Theme.of(context).textTheme.titleMedium),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: BreedGroup.values.map((group) {
            return ChoiceChip(
              label: Text(breedGroupLabels[group]!),
              selected: draft.breedGroup == group,
              onSelected: (_) =>
                  controller.update((d) => d.copyWith(breedGroup: group)),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        Text('Größenklasse', style: Theme.of(context).textTheme.titleMedium),
        Wrap(
          spacing: 8,
          children: SizeClass.values.map((size) {
            return ChoiceChip(
              label: Text(sizeClassLabels[size]!),
              selected: draft.sizeClass == size,
              onSelected: (_) =>
                  controller.update((d) => d.copyWith(sizeClass: size)),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        Text(
          'Körperbau (optional)',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: BodyType.values.map((type) {
            final selected = draft.bodyType.contains(type);
            return FilterChip(
              label: Text(bodyTypeLabels[type]!),
              selected: selected,
              onSelected: (isSelected) {
                final updated = {...draft.bodyType};
                if (isSelected) {
                  updated.add(type);
                } else {
                  updated.remove(type);
                }
                controller.update((d) => d.copyWith(bodyType: updated));
              },
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        Text(
          'Einschränkungen (optional)',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: Restriction.values.map((restriction) {
            final selected = draft.restrictions.contains(restriction);
            return FilterChip(
              label: Text(restrictionLabels[restriction]!),
              selected: selected,
              onSelected: (isSelected) {
                final updated = {...draft.restrictions};
                if (isSelected) {
                  updated.add(restriction);
                } else {
                  updated.remove(restriction);
                }
                controller.update((d) => d.copyWith(restrictions: updated));
              },
            );
          }).toList(),
        ),
      ],
    );
  }
}
