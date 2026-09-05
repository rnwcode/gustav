/// Build-time configuration — never hardcoded secrets, always passed in via
/// `--dart-define` (see `infra/supabase/.env.example` for where the values
/// come from). The anon key is meant to ship in the client (Project
/// Settings → API); the service-role key never does and has no place here.
class Env {
  const Env._();

  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'http://127.0.0.1:54321',
  );

  static const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );
}
