import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/household.dart';
import '../onboarding_controller.dart';
import '../onboarding_labels.dart';

class HouseholdStep extends ConsumerStatefulWidget {
  const HouseholdStep({super.key});

  @override
  ConsumerState<HouseholdStep> createState() => _HouseholdStepState();
}

class _HouseholdStepState extends ConsumerState<HouseholdStep> {
  late final TextEditingController _postalCodeController;

  @override
  void initState() {
    super.initState();
    final draft = ref.read(onboardingDraftProvider);
    _postalCodeController = TextEditingController(text: draft.postalCode ?? '');
  }

  @override
  void dispose() {
    _postalCodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final draft = ref.watch(onboardingDraftProvider);
    final controller = ref.read(onboardingDraftProvider.notifier);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Zuhause', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 16),
        TextField(
          controller: _postalCodeController,
          decoration: const InputDecoration(
            labelText: 'Postleitzahl (optional)',
          ),
          keyboardType: TextInputType.number,
          onChanged: (value) => controller.update(
            (d) => d.copyWith(postalCode: value.isEmpty ? null : value),
          ),
        ),
        const SizedBox(height: 16),
        Text('Wohnsituation', style: Theme.of(context).textTheme.titleMedium),
        Wrap(
          spacing: 8,
          children: HousingType.values.map((type) {
            return ChoiceChip(
              label: Text(housingTypeLabels[type]!),
              selected: draft.housingType == type,
              onSelected: (_) =>
                  controller.update((d) => d.copyWith(housingType: type)),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        Text('Umgebung', style: Theme.of(context).textTheme.titleMedium),
        Wrap(
          spacing: 8,
          children: Surroundings.values.map((surroundings) {
            return ChoiceChip(
              label: Text(surroundingsLabels[surroundings]!),
              selected: draft.surroundings == surroundings,
              onSelected: (_) => controller.update(
                (d) => d.copyWith(surroundings: surroundings),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        Text('Erfahrung', style: Theme.of(context).textTheme.titleMedium),
        Wrap(
          spacing: 8,
          children: Experience.values.map((experience) {
            return ChoiceChip(
              label: Text(experienceLabels[experience]!),
              selected: draft.experience == experience,
              onSelected: (_) =>
                  controller.update((d) => d.copyWith(experience: experience)),
            );
          }).toList(),
        ),
      ],
    );
  }
}
