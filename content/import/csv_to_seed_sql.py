#!/usr/bin/env python3
"""Regenerates infra/supabase/seed/{rasse,skill,aktivitaet}.sql from the CSVs
in this directory. Run after editing any of the three CSVs so the seed SQL
stays in sync — see ../../infra/supabase/seed/README.md for what these
seeds are for, and README.md in this directory for the data's origin and
limitations.

Usage: python3 content/import/csv_to_seed_sql.py   (from the repo root)
"""

import csv
from pathlib import Path
from typing import Optional

REPO = Path(__file__).resolve().parents[2]
IMPORT_DIR = REPO / 'content' / 'import'
SEED_DIR = REPO / 'infra' / 'supabase' / 'seed'

HEADER = """-- {title}
--
-- Generiert aus content/import/{src} per csv_to_seed_sql.py -- siehe dort
-- (README) fuer Herkunft und Einschraenkungen der Daten. `on conflict do
-- nothing`: erneutes Ausfuehren (z. B. nach `supabase db reset`)
-- dupliziert nichts.

"""


def sql_str(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sql_value(cell: str, col_type: str) -> str:
    if cell == '':
        return 'NULL'
    if col_type in ('bool', 'int'):
        return cell
    if col_type == 'jsonb':
        return sql_str(cell) + '::jsonb'
    # 'text' und 'text[]' (Postgres-Array-Literal wie {"a","b"}, als
    # String uebergeben -- Postgres castet selbst anhand der Zielspalte)
    return sql_str(cell)


def build_insert(table: str, columns: list[tuple[str, str]], rows: list[dict], conflict_col: str) -> str:
    col_names = ', '.join(c for c, _ in columns)
    value_lines = [
        '  (' + ', '.join(sql_value(row[c], t) for c, t in columns) + ')'
        for row in rows
    ]
    return (
        f'insert into {table} ({col_names}) values\n'
        + ',\n'.join(value_lines)
        + f'\non conflict ({conflict_col}) do nothing;'
    )


def write_seed(csv_name: str, table: str, columns: list, skip_ids_prefixed: Optional[str] = None):
    with open(IMPORT_DIR / csv_name, encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    if skip_ids_prefixed:
        rows = [r for r in rows if not r['id'].startswith(skip_ids_prefixed)]
    sql = HEADER.format(title=table, src=csv_name) + build_insert(table, columns, rows, 'id') + '\n'
    (SEED_DIR / f'{table}.sql').write_text(sql, encoding='utf-8')
    print(f'{table}.sql: {len(rows)} Zeilen')


# Die neun gruppe_*-Platzhalter legt 0003_rasse.sql selbst per Migration an.
write_seed('rasse.csv', 'rasse', [
    ('id', 'text'), ('name', 'text'), ('rassegruppe', 'text'),
], skip_ids_prefixed='gruppe_')

write_seed('skill.csv', 'skill', [
    ('id', 'text'), ('name', 'text'), ('kategorie', 'text'),
    ('voraussetzungen', 'text[]'), ('min_alter_wochen', 'int'),
    ('ist_kernskill', 'bool'), ('zielstufen', 'jsonb'), ('beschreibung', 'text'),
])

write_seed('aktivitaet.csv', 'aktivitaet', [
    ('id', 'text'), ('titel', 'text'), ('satz', 'text'), ('typ', 'text'),
    ('trainiert_skill', 'text'), ('bedarf', 'jsonb'), ('belastung', 'int'),
    ('dauer_min', 'int'), ('dauer_max', 'int'), ('ort', 'text'),
    ('fuer_ablenkung', 'jsonb'), ('ist_auffrischung', 'bool'),
    ('hitzetauglich', 'bool'), ('regentauglich', 'bool'), ('dunkeltauglich', 'bool'),
    ('gelenkbelastend', 'bool'), ('saisonfenster', 'jsonb'), ('equipment', 'text[]'),
    ('zweite_person', 'bool'), ('min_alter_wochen', 'int'), ('max_alter_wochen', 'int'),
    ('eignung', 'jsonb'), ('varianzgruppe', 'text'), ('sperrfrist_tage', 'int'),
    ('illustration', 'text'), ('anleitung', 'text[]'), ('erfolgskriterium', 'text'),
    ('haeufige_fehler', 'text[]'), ('troubleshooting', 'jsonb'),
])
