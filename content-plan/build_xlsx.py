#!/usr/bin/env python3
"""Construire un .xlsx de revue à partir des CSV versionnés de content-plan/.
Dépendance : artifact_tool (environnement de création des tableaux).
Pas de modification des cartes du jeu ni de données sauvegardées.
"""
from pathlib import Path
import csv
from artifact_tool import Workbook, SpreadsheetFile

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "AVP_HUNT_HIVE_TCG_30_Collections.xlsx"
FILES = [
    ("01_EXTENSIONS","sets.csv"),
    ("02_CARTES_ET_FOILS","printings.csv"),
    ("03_RARETES","rarities.csv"),
    ("04_BOOSTERS","booster-slots.csv"),
    ("05_DECKS","decks.csv"),
    ("06_LISTES_30_CARTES","decklists.csv"),
    ("07_PRODUITS","products.csv"),
    ("08_SOURCE_652","alien-base-sources.csv"),
    ("09_TCG_LEGACY_158","legacy-cards.csv"),
    ("10_MEDIA_BACKLOG","research-backlog.csv"),
]
def rows(filename):
    with (ROOT / filename).open(encoding="utf-8-sig", newline="") as f:
        return list(csv.reader(f))
def main():
    book=Workbook.create()
    summary=book.worksheets.add("00_PILOTAGE")
    summary.get_range("A1").values=[["AVP // HUNT HIVE — 30 COLLECTIONS / ALIEN_BASE"]]
    summary.get_range("A1:B1").format={"fill":"#172B3B","font":{"color":"#FFFFFF","bold":True},"row_height":32}
    summary.get_range("A3:B11").values=[
       ["Indicateur","Total"],["Extensions",30],["Impressions nouvelles",3000],
       ["Identités originales proposées",2850],["Foils alternatifs",150],
       ["Raretés",14],["Decks proposés",210],["Lignes decklists",6300],
       ["Entités Alien_base importées",652]
    ]
    summary.get_range("A3:B3").format={"fill":"#145A63","font":{"color":"#FFFFFF","bold":True}}
    summary.get_range("A:A").format.column_width=36
    summary.get_range("B:B").format.column_width=26
    summary.get_range("A13:B15").values=[
      ["Source du catalogue","darknigthmare/alien_base main e65b75a6bfd1284dbac746102fdbae4fc5a3786b"],
      ["Statut","DOCUMENTATION / NON JOUE"],
      ["PR","https://github.com/darknigthmare/avp-hunt-hive-tcg/pull/4"]
    ]
    for title, fname in FILES:
       table=rows(fname)
       if not table: raise ValueError(f"Fichier CSV vide : {fname}")
       sh=book.worksheets.add(title)
       for off in range(0,len(table),600):
           section=table[off:off+600]
           sh.get_range_by_indexes(off,0,len(section),len(table[0])).values=section
       sh.get_range_by_indexes(0,0,1,len(table[0])).format={
           "fill":"#172B3B","font":{"color":"#FFFFFF","bold":True},
           "row_height":27
       }
       sh.freeze_panes.freeze_rows(1)
       for ci,h in enumerate(table[0]):
           wid=42 if any(t in h.lower() for t in ("nom","source","description","effet","media","statut","url","class")) else 18
           sh.get_range_by_indexes(0,ci,len(table),1).format.column_width=wid
    expected={"sets.csv":31,"printings.csv":3001,"rarities.csv":15,
             "decks.csv":211,"decklists.csv":6301,
             "alien-base-sources.csv":653,"legacy-cards.csv":159}
    for filename, count in expected.items():
        actual=len(rows(filename))
        if actual != count: raise ValueError(f"{filename}: attendu {count} lignes, obtenu {actual}")
    SpreadsheetFile.export_xlsx(book).save(str(OUT))
    print(f"OK : {OUT}")
if __name__=="__main__": main()
