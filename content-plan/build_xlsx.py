#!/usr/bin/env python3
"""Export exhaustif du catalogue AVP TCG à partir des CSV validés (artifact_tool)."""
import csv
import json
from pathlib import Path
from artifact_tool import Workbook, SpreadsheetFile
ROOT=Path(__file__).resolve().parent
OUT=ROOT / "AVP_HUNT_HIVE_TCG_30_Collections.xlsx"
SHEETS=[
 ("01_EXTENSIONS","sets.csv"),
 ("02_CARTES_ET_FOILS","printings.csv"),
 ("03_RARETES","rarities.csv"),
 ("04_BOOSTERS","booster-slots.csv"),
 ("05_PROBABILITES","rarity-odds.csv"),
 ("06_GAMMES","pack-formats.csv"),
 ("07_REFERENCE_YGO","formats-reference.csv"),
 ("08_DECKS","decks.csv"),
 ("09_DECKS_RESERVES","decklists.csv"),
 ("10_PRODUITS","products.csv"),
 ("11_SOURCE_ALIENBASE","alien-base-sources.csv"),
 ("12_CARTES_HISTORIQUES","legacy-cards.csv"),
 ("13_BACKLOG_MEDIAS","research-backlog.csv"),
 ("14_GAMEPLAY_JOUABLE","gameplay-live.csv"),
 ("15_SUIVI_DES_SETS","live-set-progress.csv"),
 ("16_DECKS_JOUABLES","decks-playable.csv"),
 ("17_LISTES_JOUABLES","decklists-playable.csv"),
]
def load(filename):
 with (ROOT/filename).open(encoding="utf-8-sig",newline="") as f:
  return list(csv.reader(f))
def main():
 manifest=json.loads((ROOT/"manifest.json").read_text(encoding="utf-8"))
 t=manifest["totals"]
 expected={"sets.csv":31,"printings.csv":t["newPrintings"]+1,"rarities.csv":15,
           "decks.csv":211,"decklists.csv":t["decklistRows"]+1,
           "products.csv":t["productSkus"]+1,"alien-base-sources.csv":653,"legacy-cards.csv":159,
           "gameplay-live.csv":manifest["implementation"]["totalPlayableCards"]+1,"live-set-progress.csv":32,
           "decks-playable.csv":manifest["implementation"]["totalDeckPresetsPlayable"]+1,
           "decklists-playable.csv":manifest["implementation"]["playableDeckCardPositions"]+1}
 for filename,n in expected.items():
  if len(load(filename))!=n: raise ValueError(f"{filename} : attendu {n} lignes")
 wb=Workbook.create();d=wb.worksheets.add("00_PILOTAGE")
 d.get_range("A1").values=[["AVP HUNT // HIVE — CATALOGUE MULTI-FORMATS"]]
 d.get_range("A1:B1").format={"fill":"#172B3B","font":{"bold":True,"color":"#FFFFFF"},"row_height":31}
 rows=[["INDICATEUR","NOMBRE"],["Extensions",t["sets"]],["Impressions proposées",t["newPrintings"]],
       ["Identités de cartes à créer",t["newGameplayCardConcepts"]],
       ["Finitions alternatives",t["alternativePrintings"]],["Raretés",t["rarities"]],
       ["Recettes de decks",t["decks"]],["Lignes decks et réserves",t["decklistRows"]],
       ["Produits",t["productSkus"]],["Sources Alien_base",t["sourceEntities"]],
       ["Cartes jouables existantes conservées",t["existingCards"]]]
 d.get_range("A3:B13").values=rows
 d.get_range("A15:B19").values=[["CATALOGUE JOUABLE","ACTIF"],
    ["Cartes disponibles",manifest["implementation"]["totalPlayableCards"]],
    ["Decks préconstruits",manifest["implementation"]["totalDeckPresetsPlayable"]],
    ["Decks de production",manifest["implementation"]["productionDecks"]],
    ["Positions réelles de cartes",manifest["implementation"]["playableDeckCardPositions"]]]
 d.get_range("A15:B15").format={"fill":"#145A63","font":{"bold":True,"color":"#FFFFFF"}}
 d.get_range("A3:B3").format={"fill":"#145A63","font":{"bold":True,"color":"#FFFFFF"}}
 d.get_range("A:A").format.column_width=39
 d.get_range("B:B").format.column_width=22
 d.get_range("D3:E10").values=[["RÈGLE","CONTENU"],["Duel AVP",30],["Starter Deck dans la boîte",45],
   ["Structure Deck dans la boîte",45],["Kit construction dans la boîte",75],
   ["Booster principal",9],["Booster de construction",7],["Booster légendaire / collector",5]]
 d.get_range("D3:E3").format={"fill":"#145A63","font":{"bold":True,"color":"#FFFFFF"}}
 d.get_range("D:D").format.column_width=34;d.get_range("E:E").format.column_width=26
 for name,filename in SHEETS:
  table=load(filename)
  if not table:raise ValueError(filename+" est vide")
  sheet=wb.worksheets.add(name)
  for start in range(0,len(table),500):
   data=table[start:start+500]
   sheet.get_range_by_indexes(start,0,len(data),len(table[0])).values=data
  sheet.get_range_by_indexes(0,0,1,len(table[0])).format={"fill":"#172B3B","font":{"bold":True,"color":"#FFFFFF"},"row_height":26}
  sheet.freeze_panes.freeze_rows(1)
  for idx,h in enumerate(table[0]):
   width=42 if any(y in h.lower() for y in ("nom","source","media","url","texte","effet","remarque","projet","note","composition","status")) else 20
   sheet.get_range_by_indexes(0,idx,1,1).format.column_width=width
 SpreadsheetFile.export_xlsx(wb).save(str(OUT))
 print("OK:",OUT,"sets",t["sets"],"impressions",t["newPrintings"])
if __name__=="__main__":main()
