import 'package:flutter/material.dart';

import '../../periode/domain/weekly_plan.dart';
import '../../periode/ui/reason_labels.dart';

class TagScreen extends StatelessWidget {
  const TagScreen({super.key, required this.slot});

  final PlanSlot slot;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(slot.title ?? 'Dieser Tag')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (slot.isEmpty)
              const Text('Heute ist bewusst nichts geplant.')
            else ...[
              if (slot.sentence != null) Text(slot.sentence!),
              const SizedBox(height: 16),
            ],
            Text(
              reasonKindLabels[slot.reason.kind] ?? '',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}
