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

CONTENT_LOCALE = 'de'  # the only maintained language so far (CLAUDE.md, section Sprache)

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
    # 'text' and 'text[]' (Postgres array literal like {"a","b"}, passed as
    # a string — Postgres casts it itself based on the target column)
    return sql_str(cell)


def build_insert(table: str, columns: list[tuple[str, str]], rows: list[dict], conflict_cols: str) -> str:
    col_names = ', '.join(c for c, _ in columns)
    value_lines = [
        '  (' + ', '.join(sql_value(row[c], t) for c, t in columns) + ')'
        for row in rows
    ]
    return (
        f'insert into {table} ({col_names}) values\n'
        + ',\n'.join(value_lines)
        + f'\non conflict ({conflict_cols}) do nothing;'
    )


def write_seed(
    csv_name: str,
    table: str,
    columns: list,
    skip_ids_prefixed: Optional[str] = None,
    text_table: Optional[str] = None,
    text_id_column: Optional[str] = None,
    text_columns: Optional[list] = None,
):
    """Writes `table`.sql. When `text_table` is given, user-visible text
    columns move into that table instead — one row per (id, locale), with
    `locale` fixed to CONTENT_LOCALE — while `columns` describes everything
    that stays language-neutral on `table` itself (0002_content.sql)."""
    with open(IMPORT_DIR / csv_name, encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    if skip_ids_prefixed:
        rows = [r for r in rows if not r['id'].startswith(skip_ids_prefixed)]

    sql = HEADER.format(title=table, src=csv_name) + build_insert(table, columns, rows, 'id') + '\n'

    if text_table is not None:
        text_col_defs = [(text_id_column, 'text'), ('locale', 'text')] + text_columns
        text_rows = [{**row, text_id_column: row['id'], 'locale': CONTENT_LOCALE} for row in rows]
        sql += '\n' + build_insert(
            text_table, text_col_defs, text_rows, f'{text_id_column}, locale',
        ) + '\n'

    (SEED_DIR / f'{table}.sql').write_text(sql, encoding='utf-8')
    print(f'{table}.sql: {len(rows)} Zeilen' + (f' (+ {text_table})' if text_table else ''))


# The nine group placeholders are created by 0003_rasse.sql itself, via migration.
write_seed('rasse.csv', 'breed', [
    ('id', 'text'), ('name', 'text'), ('breed_group', 'text'),
], skip_ids_prefixed='gruppe_')

write_seed(
    'skill.csv', 'skill', [
        ('id', 'text'), ('category', 'text'),
        ('prerequisites', 'text[]'), ('min_age_weeks', 'int'),
        ('is_core_skill', 'bool'), ('target_levels', 'jsonb'),
    ],
    text_table='skill_text', text_id_column='skill_id', text_columns=[
        ('name', 'text'), ('description', 'text'),
    ],
)

write_seed(
    'aktivitaet.csv', 'activity', [
        ('id', 'text'), ('type', 'text'),
        ('trains_skill', 'text'), ('needs', 'jsonb'), ('arousal', 'int'),
        ('duration_min', 'int'), ('duration_max', 'int'), ('location', 'text'),
        ('for_distraction', 'jsonb'), ('is_refresher', 'bool'),
        ('heat_suitable', 'bool'), ('rain_suitable', 'bool'), ('darkness_suitable', 'bool'),
        ('joint_straining', 'bool'), ('seasonal_window', 'jsonb'), ('equipment', 'text[]'),
        ('second_person', 'bool'), ('min_age_weeks', 'int'), ('max_age_weeks', 'int'),
        ('suitability', 'jsonb'), ('variance_group', 'text'), ('cooldown_days', 'int'),
        ('illustration', 'text'),
    ],
    text_table='activity_text', text_id_column='activity_id', text_columns=[
        ('title', 'text'), ('sentence', 'text'), ('instructions', 'text[]'),
        ('success_criterion', 'text'), ('common_mistakes', 'text[]'), ('troubleshooting', 'jsonb'),
    ],
)
