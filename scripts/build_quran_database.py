"""Build the immutable Quran seed asset; run when bundled source data changes."""
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'assets/data'


def build():
    ayahs = json.loads((DATA / 'quran-full-ayahs.json').read_text())
    translations = json.loads((DATA / 'quran-full-translations.json').read_text())
    tajweed = json.loads((DATA / 'quran-tajweed.json').read_text())
    assert len(ayahs) == 6236 and len(translations) == 12472
    output = DATA / 'quran-content-v1.db'
    output.unlink(missing_ok=True)
    with sqlite3.connect(output) as db:
        db.executescript('''
            CREATE TABLE ayahs (id INTEGER PRIMARY KEY, surah_id INTEGER NOT NULL,
                ayah_number INTEGER NOT NULL, text_uthmani TEXT NOT NULL,
                text_tajweed TEXT, juz INTEGER NOT NULL, hizb INTEGER NOT NULL, page INTEGER NOT NULL);
            CREATE TABLE translations (id INTEGER PRIMARY KEY, ayah_id INTEGER NOT NULL,
                language TEXT NOT NULL, translator TEXT NOT NULL, text TEXT NOT NULL);
        ''')
        db.executemany('INSERT INTO ayahs VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
            (a['id'], a['surahId'], a['ayahNumber'], a['textUthmani'],
             tajweed[f"{a['surahId']}_{a['ayahNumber']}"], a['juz'], a['hizb'], a['page'])
            for a in ayahs
        ])
        db.executemany('INSERT INTO translations VALUES (?, ?, ?, ?, ?)', [
            (t['id'], t['ayahId'], t['language'], t['translator'], t['text']) for t in translations
        ])
        assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
    print(f'Built {output.name}: {output.stat().st_size:,} bytes')


if __name__ == '__main__':
    build()
