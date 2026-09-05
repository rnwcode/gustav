import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tag/ui/tag_screen.dart';
import '../data/plan_providers.dart';
import '../domain/weekly_plan.dart';
import 'reason_labels.dart';

class PeriodeScreen extends ConsumerWidget {
  const PeriodeScreen({super.key, required this.dogId});

  final String dogId;

  String _weekdayName(DateTime date) {
    const names = [
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Samstag',
      'Sonntag',
    ];
    return names[date.weekday - 1];
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final planAsync = ref.watch(currentPlanProvider(dogId));

    return Scaffold(
      appBar: AppBar(title: const Text('Diese Periode')),
      body: planAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text('Der Plan konnte nicht geladen werden: $error'),
          ),
        ),
        data: (plan) => _PlanList(plan: plan, weekdayName: _weekdayName),
      ),
    );
  }
}

class _PlanList extends StatelessWidget {
  const _PlanList({required this.plan, required this.weekdayName});

  final WeeklyPlan plan;
  final String Function(DateTime) weekdayName;

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: plan.slots.length,
      itemBuilder: (context, index) {
        final slot = plan.slots[index];
        return ListTile(
          title: Text(weekdayName(slot.date)),
          subtitle: Text(
            slot.isEmpty
                ? reasonKindLabels[slot.reason.kind] ?? 'Frei'
                : slot.title ?? slot.activityId ?? '—',
          ),
          onTap: () => Navigator.of(context)
              .push(MaterialPageRoute(builder: (_) => TagScreen(slot: slot))),
        );
      },
    );
  }
}
