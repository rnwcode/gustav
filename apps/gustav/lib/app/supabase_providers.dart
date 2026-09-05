import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// The Supabase client — never holds business logic (CLAUDE.md, Architecture
/// section). The app only calls Edge Functions and reads/writes state rows
/// that RLS already scopes to the signed-in user.
final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

/// The current auth state, so the UI can react to sign-in/sign-out.
final authStateProvider = StreamProvider<AuthState>((ref) {
  final client = ref.watch(supabaseClientProvider);
  return client.auth.onAuthStateChange;
});

/// Ensures a session exists before the rest of the app runs. Anonymous for
/// now — a real account only happens at purchase (`docs/bauplan.md`, Phase
/// 3). Requires anonymous sign-ins enabled on the Supabase project.
final ensureSignedInProvider = FutureProvider<Session>((ref) async {
  final client = ref.watch(supabaseClientProvider);
  final existing = client.auth.currentSession;
  if (existing != null) return existing;

  final response = await client.auth.signInAnonymously();
  final session = response.session;
  if (session == null) {
    throw StateError('anonymous sign-in did not return a session');
  }
  return session;
});
