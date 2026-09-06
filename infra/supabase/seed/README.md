# Seeds

Reproduzierbare Ausgangszustände für lokale Entwicklung und Staging.

- `entwicklung.sql` — ein Testnutzer mit drei Hunden in verschiedenen
  Lebensphasen (Welpe 11 Wochen, Junghund in der Pubertät, erwachsen mit
  allem gefestigt). Deckt die Fälle ab, die man beim Entwickeln ständig sieht.

Der Content selbst (`aktivitaet`/`skill`) wird nicht hier geseedet, sondern
direkt in der DB gepflegt (Supabase Studio/SQL) — kein Import aus Dateien
(CLAUDE.md, Regel 5).
