import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/weekday.dart';
import '../onboarding_controller.dart';
import '../onboarding_labels.dart';

class BudgetStep extends ConsumerStatefulWidget {
  const BudgetStep({super.key});

  @override
  ConsumerState<BudgetStep> createState() => _BudgetStepState();
}

class _BudgetStepState extends ConsumerState<BudgetStep> {
  late final TextEditingController _weekdayController;
  late final TextEditingController _weekendController;
  late final TextEditingController _equipmentController;

  @override
  void initState() {
    super.initState();
    final draft = ref.read(onboardingDraftProvider);
    _weekdayController = TextEditingController(
      text: draft.weekdayTimeBudgetMinutes?.toString() ?? '',
    );
    _weekendController = TextEditingController(
      text: draft.weekendTimeBudgetMinutes?.toString() ?? '',
    );
    _equipmentController = TextEditingController(
      text: draft.equipment.join(', '),
    );
  }

  @override
  void dispose() {
    _weekdayController.dispose();
    _weekendController.dispose();
    _equipmentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final draft = ref.watch(onboardingDraftProvider);
    final controller = ref.read(onboardingDraftProvider.notifier);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Zeit und Training',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _weekdayController,
          decoration: const InputDecoration(
            labelText: 'Zeitbudget Werktag (Minuten)',
          ),
          keyboardType: TextInputType.number,
          onChanged: (value) => controller.update(
            (d) => d.copyWith(weekdayTimeBudgetMinutes: int.tryParse(value)),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _weekendController,
          decoration: const InputDecoration(
            labelText: 'Zeitbudget Wochenende (Minuten)',
          ),
          keyboardType: TextInputType.number,
          onChanged: (value) => controller.update(
            (d) => d.copyWith(weekendTimeBudgetMinutes: int.tryParse(value)),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Bevorzugte Trainingstage (optional)',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        Wrap(
          spacing: 8,
          children: Weekday.values.map((day) {
            final selected = draft.trainingDays.contains(day);
            return FilterChip(
              label: Text(weekdayLabels[day]!),
              selected: selected,
              onSelected: (isSelected) {
                final updated = {...draft.trainingDays};
                if (isSelected) {
                  updated.add(day);
                } else {
                  updated.remove(day);
                }
                controller.update((d) => d.copyWith(trainingDays: updated));
              },
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        Text('Planungstag', style: Theme.of(context).textTheme.titleMedium),
        Wrap(
          spacing: 8,
          children: Weekday.values.map((day) {
            return ChoiceChip(
              label: Text(weekdayLabels[day]!),
              selected: draft.planningDay == day,
              onSelected: (_) =>
                  controller.update((d) => d.copyWith(planningDay: day)),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Text(
              'Personen im Haushalt',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const Spacer(),
            IconButton(
              icon: const Icon(Icons.remove_circle_outline),
              onPressed: draft.householdSize > 1
                  ? () => controller.update(
                      (d) => d.copyWith(householdSize: d.householdSize - 1),
                    )
                  : null,
            ),
            Text('${draft.householdSize}'),
            IconButton(
              icon: const Icon(Icons.add_circle_outline),
              onPressed: () => controller.update(
                (d) => d.copyWith(householdSize: d.householdSize + 1),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _equipmentController,
          decoration: const InputDecoration(
            labelText: 'Equipment (optional, Komma-getrennt)',
          ),
          onChanged: (value) => controller.update(
            (d) => d.copyWith(
              equipment: value
                  .split(',')
                  .map((e) => e.trim())
                  .where((e) => e.isNotEmpty)
                  .toList(),
            ),
          ),
        ),
      ],
    );
  }
}
