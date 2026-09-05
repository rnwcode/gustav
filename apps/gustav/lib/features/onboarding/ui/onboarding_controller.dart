import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/onboarding_providers.dart';
import '../data/onboarding_repository.dart';
import '../domain/onboarding_draft.dart';

class OnboardingController extends StateNotifier<OnboardingDraft> {
  OnboardingController() : super(const OnboardingDraft());

  void update(OnboardingDraft Function(OnboardingDraft draft) updater) {
    state = updater(state);
  }
}

final onboardingDraftProvider =
    StateNotifierProvider.autoDispose<OnboardingController, OnboardingDraft>(
      (ref) => OnboardingController(),
    );

/// Current page in the multi-step form.
final onboardingStepProvider = StateProvider.autoDispose<int>((ref) => 0);

class OnboardingSubmission extends StateNotifier<AsyncValue<void>> {
  OnboardingSubmission(this._repository) : super(const AsyncValue.data(null));

  final OnboardingRepository _repository;

  Future<bool> submit(OnboardingDraft draft) async {
    state = const AsyncValue.loading();
    try {
      await _repository.createDog(draft.toDog());
      await _repository.createHousehold(draft.toHousehold());
      state = const AsyncValue.data(null);
      return true;
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
      return false;
    }
  }
}

final onboardingSubmissionProvider =
    StateNotifierProvider.autoDispose<OnboardingSubmission, AsyncValue<void>>(
      (ref) => OnboardingSubmission(ref.watch(onboardingRepositoryProvider)),
    );
