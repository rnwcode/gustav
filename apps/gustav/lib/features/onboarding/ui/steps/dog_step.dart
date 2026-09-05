import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/dog.dart';
import '../onboarding_controller.dart';
import '../onboarding_labels.dart';

class DogStep extends ConsumerStatefulWidget {
  const DogStep({super.key});

  @override
  ConsumerState<DogStep> createState() => _DogStepState();
}

class _DogStepState extends ConsumerState<DogStep> {
  late final TextEditingController _nameController;

  @override
  void initState() {
    super.initState();
    final draft = ref.read(onboardingDraftProvider);
    _nameController = TextEditingController(text: draft.dogName ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _pickDate({
    required DateTime? initial,
    required void Function(DateTime) onPicked,
  }) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial ?? now,
      firstDate: DateTime(now.year - 25),
      lastDate: now,
    );
    if (picked != null) onPicked(picked);
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'Datum wählen';
    return '${date.day.toString().padLeft(2, '0')}.'
        '${date.month.toString().padLeft(2, '0')}.'
        '${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    final draft = ref.watch(onboardingDraftProvider);
    final controller = ref.read(onboardingDraftProvider.notifier);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Der Hund', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 16),
        TextField(
          controller: _nameController,
          decoration: const InputDecoration(labelText: 'Name'),
          onChanged: (value) =>
              controller.update((d) => d.copyWith(dogName: value)),
        ),
        const SizedBox(height: 16),
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text('Geburtsdatum'),
          subtitle: Text(_formatDate(draft.birthDate)),
          onTap: () => _pickDate(
            initial: draft.birthDate,
            onPicked: (date) =>
                controller.update((d) => d.copyWith(birthDate: date)),
          ),
        ),
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text('Einzugsdatum'),
          subtitle: Text(_formatDate(draft.arrivalDate)),
          onTap: () => _pickDate(
            initial: draft.arrivalDate,
            onPicked: (date) =>
                controller.update((d) => d.copyWith(arrivalDate: date)),
          ),
        ),
        const SizedBox(height: 16),
        Text('Herkunft', style: Theme.of(context).textTheme.titleMedium),
        Wrap(
          spacing: 8,
          children: Origin.values.map((origin) {
            return ChoiceChip(
              label: Text(originLabels[origin]!),
              selected: draft.origin == origin,
              onSelected: (_) =>
                  controller.update((d) => d.copyWith(origin: origin)),
            );
          }).toList(),
        ),
      ],
    );
  }
}
