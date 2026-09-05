import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/supabase_providers.dart';
import 'onboarding_repository.dart';

final onboardingRepositoryProvider = Provider<OnboardingRepository>((ref) {
  return OnboardingRepository(ref.watch(supabaseClientProvider));
});

/// Whether the signed-in owner already has a dog — decides whether the app
/// shows onboarding or the current period (`app/app.dart`).
final existingDogIdProvider = FutureProvider.autoDispose<String?>((ref) {
  return ref.watch(onboardingRepositoryProvider).findExistingDogId();
});
