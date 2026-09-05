-- Zweite Hälfte von local_auth_stub.sql — läuft NACH den Migrationen,
-- weil GRANT auf noch nicht existierende Tabellen nichts bewirkt. Nur für
-- lokale/CI-Testläufe, siehe local_auth_stub.sql.

grant all on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
