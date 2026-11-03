#!/usr/bin/env python3
"""Check the committed Excel against its sources, without an authoring dependency.

This reads OOXML with the Python standard library. It does not rewrite the file
or pretend to recalculate Excel formulas; cached totals are compared with the
executed game catalogue and the builder's recorded recalculation evidence.
"""
import argparse
import csv
import hashlib
import json
import os
from pathlib import Path
import posixpath
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
import zipfile

NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
CSV_SHEETS = [
    ("01_EXTENSIONS", "sets.csv"), ("02_CARTES_ET_FOILS", "printings.csv"),
    ("03_RARETES", "rarities.csv"), ("04_BOOSTERS", "booster-slots.csv"),
    ("05_PROBABILITES", "rarity-odds.csv"), ("06_GAMMES", "pack-formats.csv"),
    ("07_REFERENCE_YGO", "formats-reference.csv"), ("08_DECKS", "decks.csv"),
    ("09_DECKS_RESERVES", "decklists.csv"), ("10_PRODUITS", "products.csv"),
    ("11_SOURCE_ALIENBASE", "alien-base-sources.csv"),
    ("12_CARTES_HISTORIQUES", "legacy-cards.csv"),
    ("13_BACKLOG_MEDIAS", "research-backlog.csv"),
    ("14_GAMEPLAY_JOUABLE", "gameplay-live.csv"),
    ("15_SUIVI_DES_SETS", "live-set-progress.csv"),
    ("16_DECKS_JOUABLES", "decks-playable.csv"),
    ("17_LISTES_JOUABLES", "decklists-playable.csv"),
    ("18_CARTES_ASYMETRIQUES", "asymmetric-cards.csv"),
    ("19_DECKS_ASYMETRIQUES", "asymmetric-decks.csv"),
    ("20_LISTES_ASYMETRIQUES", "asymmetric-decklists.csv"),
    ("21_REGLES_ASYMETRIQUES", "asymmetric-mechanics.csv"),
    ("27_ARSENAL_COUVERTURE", "coverage-arsenal.csv"),
    ("28_RUCHE_COUVERTURE", "coverage-hive.csv"),
    ("29_DECKS_COMPLEMENTS", "complete-decks.csv"),
    ("30_LISTES_COMPLEMENTS", "complete-decklists.csv"),
    ("31_COUVERTURE_DOMAINES", "coverage-domains.csv"),
]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def cell_address(row, column):
    letters = ""
    while column:
        column, remainder = divmod(column - 1, 26)
        letters = chr(65 + remainder) + letters
    return f"{letters}{row}"


def typed_value(value, header):
    if value == "":
        return None
    if not re.search(r"ID$|^ID|^No$|Code|^Set$|^Raret", header, re.I):
        if re.fullmatch(r"-?(?:0|[1-9]\d*)(?:\.\d+)?", value):
            return float(value) if "." in value else int(value)
    return "'" + value if value.startswith("=") else value


def read_workbook(path):
    with zipfile.ZipFile(path) as archive:
        require(archive.testzip() is None, "Excel ZIP integrity failure")
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            for entry in ET.fromstring(archive.read("xl/sharedStrings.xml")):
                shared.append("".join(node.text or "" for node in entry.iter(f"{{{NS['s']}}}t")))
        relationships = {
            row.attrib["Id"]: row.attrib["Target"]
            for row in ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        }
        book = ET.fromstring(archive.read("xl/workbook.xml"))
        sheets, formulas = {}, {}
        for entry in book.findall("s:sheets/s:sheet", NS):
            name = entry.attrib["name"]
            target = relationships[entry.attrib[f"{{{REL}}}id"]]
            sheet_path = target.lstrip("/") if target.startswith("/") else posixpath.normpath("xl/" + target)
            sheet = ET.fromstring(archive.read(sheet_path))
            values, expressions = {}, {}
            for cell in sheet.findall("s:sheetData/s:row/s:c", NS):
                address, kind = cell.attrib["r"], cell.attrib.get("t")
                require(kind != "e", f"Excel error in {name}!{address}")
                value_node, formula_node = cell.find("s:v", NS), cell.find("s:f", NS)
                value = value_node.text if value_node is not None else None
                if kind == "s":
                    value = shared[int(value)]
                elif kind == "inlineStr":
                    value = "".join(t.text or "" for t in cell.findall(".//s:t", NS))
                elif value is not None and kind not in ("str", "d"):
                    value = float(value) if any(c in value for c in ".eE") else int(value)
                values[address] = value
                if formula_node is not None:
                    expressions[address] = formula_node.text
            sheets[name], formulas[name] = values, expressions
        tables = {}
        for filename in archive.namelist():
            if re.fullmatch(r"xl/tables/table\d+\.xml", filename):
                table = ET.fromstring(archive.read(filename))
                tables[table.attrib["name"]] = table.attrib["ref"]
        return sheets, formulas, tables


def read_runtime(root):
    script = r"""
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=process.argv[1],ctx=vm.createContext({window:{},Intl,Date,Math});
const modules=JSON.parse(fs.readFileSync(path.join(root,'content-plan/runtime-modules.json'),'utf8'));
for(const name of modules.data)
  new vm.Script(fs.readFileSync(path.join(root,'src',name+'.js'),'utf8'),{filename:name+'.js'}).runInContext(ctx,{timeout:15000});
const d=ctx.window.AVP_DATA;
process.stdout.write(JSON.stringify({cards:d.cards,decks:d.expansionDecks,boosters:d.boosters,
  rarities:d.rarities,effects:Object.fromEntries(d.cards.map(c=>[c.id,JSON.stringify(c.effect||{})]))}));
"""
    result = subprocess.run([os.environ.get("CODEX_PRIMARY_RUNTIME_NODE", "node"), "-e", script, str(root)],
                            check=True, capture_output=True, text=True)
    return json.loads(result.stdout)


def verify(root):
    manifest = json.loads((root / "content-plan/manifest.json").read_text())
    modules = json.loads((root / "content-plan/runtime-modules.json").read_text())
    report_path = root / "reports/qa" / f"workbook-validation-{manifest['date']}.json"
    report = json.loads(report_path.read_text())
    workbook_path = root / manifest["implementation"]["catalogueWorkbook"]
    require(report["xlsxSha256"] == digest(workbook_path), "Excel differs from its validation report; rebuild the catalogue")
    require(report["authoringSourceHash"] == digest(root / "content-plan/build_xlsx.mjs"), "Excel builder changed; rebuild the catalogue")
    required_sources = {"content-plan/manifest.json", "content-plan/runtime-modules.json", "content-plan/complete-cards.csv", "src/collection.js"}
    required_sources.update("src/" + name + ".js" for name in modules["data"] + modules["rules"])
    required_sources.update("content-plan/" + file for _, file in CSV_SHEETS)
    require(required_sources <= report["sourceHashes"].keys(), "Workbook report is missing source fingerprints")
    for name, expected in report["sourceHashes"].items():
        require(digest(root / name) == expected, f"Workbook source changed: {name}; rebuild the catalogue")
    require(report["sourceAlienBase"] == manifest["alienBaseMain"], "Alien_base snapshot mismatch")

    sheets, formulas, tables = read_workbook(workbook_path)
    require(len(sheets) == manifest["implementation"]["catalogueWorkbookSheets"] == report["sheetCount"], "Worksheet count mismatch")
    require(set(sheets) == {"00_PILOTAGE", *report["sheets"]}, "Worksheet names mismatch")
    checked_cells = 0
    for name, filename in CSV_SHEETS:
        with (root / "content-plan" / filename).open(newline="", encoding="utf-8-sig") as stream:
            rows = list(csv.reader(stream))
        require(len(rows) - 1 == report["sheets"][name]["records"], f"Row count mismatch: {name}")
        for row_index, row in enumerate(rows, 1):
            for col_index, raw in enumerate(row, 1):
                expected = raw if row_index == 1 else typed_value(raw, rows[0][col_index - 1])
                address = cell_address(row_index, col_index)
                require(sheets[name].get(address) == expected, f"CSV mismatch in {name}!{address}")
                checked_cells += 1

    for name, info in report["sheets"].items():
        expected_ref = "A1:" + cell_address(info["records"] + 1, info["columns"])
        require(tables.get("Catalogue" + name[:2]) == expected_ref, f"Filter table range mismatch: {name}")

    runtime = read_runtime(root)
    cards = {card["id"]: card for card in runtime["cards"]}
    for name in ("14_GAMEPLAY_JOUABLE", "18_CARTES_ASYMETRIQUES"):
        values, info = sheets[name], report["sheets"][name]
        headers = {values.get(cell_address(1, col)): col for col in range(1, info["columns"] + 1)}
        for row in range(2, info["records"] + 2):
            card_id = values.get(f"A{row}")
            require(card_id in cards, f"Unknown card in {name}!A{row}")
            card = cards[card_id]
            complete_rules = {
                "Texte de règle": card.get("text") or "", "Mots-clés": ", ".join(card.get("keywords", [])),
                "Effet complet": runtime["effects"][card_id], "Numéro de collection": card.get("collectorNo") or "",
            }
            for header, expected in complete_rules.items():
                address = cell_address(row, headers[header])
                require((values.get(address) or "") == expected, f"Runtime rule mismatch in {name}!{address}")

    deck_sheet = sheets["22_DECKS_COMPLETS"]
    positions = 0
    for row, deck in enumerate(runtime["decks"], 2):
        main, reserve = sum(deck["cards"].values()), sum(deck.get("reserve", {}).values())
        require(deck_sheet.get(f"A{row}") == deck["id"], f"Deck identity mismatch at row {row}")
        require([deck_sheet.get(f"{col}{row}") for col in "FGH"] == [main, reserve, main + reserve],
                f"Deck size mismatch: {deck['id']}")
        positions += main + reserve
    require(report["positions"] == positions == manifest["implementation"]["totalPlayableDeckCardPositions"], "Total positions mismatch")
    require(report["cards"] == len(cards) and report["decks"] == len(runtime["decks"]), "Runtime catalogue count mismatch")
    require(report["boosters"] == len(runtime["boosters"]) and report["activeRarities"] == len(runtime["rarities"]), "Active product count mismatch")

    totals = [len(cards), len(runtime["decks"]), len(runtime["boosters"]), len(runtime["rarities"]),
              manifest["totals"]["existingCards"], sum(c["id"].startswith("MX_") for c in cards.values()),
              sum(d["id"].startswith("asym_") for d in runtime["decks"]), positions,
              report["compatibilities"], report["hiveCombinations"], manifest["totals"]["sourceEntities"]]
    for row, expected in enumerate(totals, 6):
        require(sheets["00_PILOTAGE"].get(f"C{row}") == expected, f"Summary cache mismatch in C{row}")
    for address in [f"C{row}" for row in range(6, 17) if row not in (8, 9)]:
        require(formulas["00_PILOTAGE"].get(address), f"Summary formula missing: {address}")
    for row, faction in enumerate(["HUMAN", "XENO", "YAUTJA", "ENGINEER", "HYBRID", "NEUTRAL"], 20):
        require(sheets["00_PILOTAGE"].get(f"C{row}") == sum(c["faction"] == faction for c in cards.values()),
                f"Faction card summary mismatch in C{row}")
        require(sheets["00_PILOTAGE"].get(f"D{row}") == sum(d["faction"] == faction for d in runtime["decks"]),
                f"Faction deck summary mismatch in D{row}")
        require(formulas["00_PILOTAGE"].get(f"C{row}") and formulas["00_PILOTAGE"].get(f"D{row}"),
                f"Faction formulas missing at row {row}")
    require("Actif03" in tables and "Actif04" in tables, "Active rarities/boosters tables missing")
    return {"status": "PASS", "sheets": len(sheets), "cards": len(cards), "decks": len(runtime["decks"]),
            "positions": positions, "csvCellsCompared": checked_cells, "sourceFingerprints": len(report["sourceHashes"]),
            "xlsxSha256": report["xlsxSha256"]}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent)
    args = parser.parse_args()
    try:
        print(json.dumps(verify(args.root.resolve()), ensure_ascii=False))
    except (ValueError, OSError, KeyError, ET.ParseError, zipfile.BadZipFile, subprocess.CalledProcessError) as error:
        print(f"Catalogue verification failed: {error}", file=sys.stderr)
        sys.exit(1)
