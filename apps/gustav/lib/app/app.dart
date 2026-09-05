import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/onboarding/data/onboarding_providers.dart';
import '../features/onboarding/ui/onboarding_screen.dart';
import '../features/periode/ui/periode_screen.dart';
import 'supabase_providers.dart';
import 'theme.dart';

class GustavApp extends StatelessWidget {
  const GustavApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gustav',
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      home: const _AppRoot(),
    );
  }
}

/// Decides between sign-in, onboarding and the current period — the app has
/// no other routing, per the fixed entry order in `docs/bauplan.md` (Phase 2):
/// Onboarding → Plan erzeugen → Plan zeigen.
class _AppRoot extends ConsumerWidget {
  const _AppRoot();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final signedIn = ref.watch(ensureSignedInProvider);

    return signedIn.when(
      loading: () => const _Loading(),
      error: (error, stackTrace) => _Error(message: '$error'),
      data: (_) => const _OnboardingGate(),
    );
  }
}

class _OnboardingGate extends ConsumerWidget {
  const _OnboardingGate();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final existingDogId = ref.watch(existingDogIdProvider);

    return existingDogId.when(
      loading: () => const _Loading(),
      error: (error, stackTrace) => _Error(message: '$error'),
      data: (dogId) {
        if (dogId == null) {
          return OnboardingScreen(
            onDone: () => ref.invalidate(existingDogIdProvider),
          );
        }
        return PeriodeScreen(dogId: dogId);
      },
    );
  }
}

class _Loading extends StatelessWidget {
  const _Loading();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}

class _Error extends StatelessWidget {
  const _Error({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text('Das hat nicht geklappt: $message'),
        ),
      ),
    );
  }
}
