/* Catalogue fan-made : textes de gameplay et illustrations originaux. */
window.AVP_DATA = {
  "version": "1.0.0",
  "title": "AVP: HUNT // HIVE TCG",
  "subtitle": "Alien • Predator • Alien vs. Predator",
  "factions": {
    "XENO": {
      "name": "Xénomorphes",
      "short": "XENO",
      "symbol": "⌁",
      "accent": "#b8f34a",
      "dark": "#223515",
      "description": "Essaim, Couvée, Sang acide et évolution."
    },
    "YAUTJA": {
      "name": "Yautja",
      "short": "YAUTJA",
      "symbol": "◈",
      "accent": "#ffb34e",
      "dark": "#43250c",
      "description": "Camouflage, équipement, chasse et Trophées."
    },
    "HUMAN": {
      "name": "Humains & Synthétiques",
      "short": "HUMAINS",
      "symbol": "✦",
      "accent": "#6ad8ff",
      "dark": "#103144",
      "description": "Escouades, technologie, défense et contrôle."
    },
    "ENGINEER": {
      "name": "Ingénieurs & Pathogène",
      "short": "INGÉNIEURS",
      "symbol": "⬡",
      "accent": "#e9e2ce",
      "dark": "#343129",
      "description": "Création, mutation, sacrifice et domination biologique."
    },
    "HYBRID": {
      "name": "Hybrides AVP",
      "short": "HYBRIDES",
      "symbol": "☣",
      "accent": "#e272ff",
      "dark": "#421c4a",
      "description": "Synergies croisées et organismes impossibles."
    },
    "NEUTRAL": {
      "name": "Neutres",
      "short": "NEUTRES",
      "symbol": "◎",
      "accent": "#d8d8d8",
      "dark": "#292929",
      "description": "Sites, événements et technologies universels."
    }
  },
  "rarities": {
    "C": {
      "name": "Commune",
      "short": "C",
      "rank": 1,
      "dust": 10,
      "frame": "standard",
      "odds": "Tirage courant"
    },
    "R": {
      "name": "Rare",
      "short": "R",
      "rank": 2,
      "dust": 25,
      "frame": "silver",
      "odds": "Au moins une par booster"
    },
    "SR": {
      "name": "Super Rare",
      "short": "SR",
      "rank": 3,
      "dust": 70,
      "frame": "holo",
      "odds": "Tirage pondéré, non garanti"
    },
    "UR": {
      "name": "Ultra Rare",
      "short": "UR",
      "rank": 4,
      "dust": 180,
      "frame": "gold",
      "odds": "UR ou mieux garantie au 10e booster sans UR"
    },
    "SCR": {
      "name": "Secret Rare",
      "short": "SCR",
      "rank": 5,
      "dust": 420,
      "frame": "secret",
      "odds": "Tirage pondéré, non garanti"
    },
    "PR": {
      "name": "Prismatique",
      "short": "PR",
      "rank": 6,
      "dust": 900,
      "frame": "prismatic",
      "odds": "Tirage pondéré, non garanti"
    },
    "GR": {
      "name": "Ghost Rare",
      "short": "GR",
      "rank": 7,
      "dust": 1800,
      "frame": "ghost",
      "odds": "Tirage pondéré, non garanti"
    }
  },
  "sets": {
    "NX01": {
      "name": "Origines Hostiles",
      "subtitle": "Nostromo / LV-426",
      "year": "Vague I",
      "accent": "#b8f34a",
      "description": "Le signal, le Nostromo et la naissance de la forme parfaite."
    },
    "CW02": {
      "name": "Guerre Coloniale",
      "subtitle": "Hadley’s Hope / Sulaco",
      "year": "Vague II",
      "accent": "#6ad8ff",
      "description": "Marines coloniaux contre ruche organisée."
    },
    "HG03": {
      "name": "Terrains de Chasse",
      "subtitle": "Val Verde / Los Angeles / Réserve",
      "year": "Vague III",
      "accent": "#ffb34e",
      "description": "Clans, équipements et code de la chasse."
    },
    "AV04": {
      "name": "Rite de Sang",
      "subtitle": "Temple de Bouvetøya",
      "year": "Vague IV",
      "accent": "#e272ff",
      "description": "Le conflit Alien vs. Predator devient une mécanique de duel."
    },
    "EV05": {
      "name": "Évolution Parfaite",
      "subtitle": "Pathogène / Hybrides",
      "year": "Vague V",
      "accent": "#e9e2ce",
      "description": "Ingénieurs, mutations et formes extrêmes."
    },
    "PX00": {
      "name": "Continuités Perdues",
      "subtitle": "Coupé / annulé / prototype",
      "year": "Archive",
      "accent": "#ff657d",
      "description": "Cartes séparées du canon principal, issues des archives de production.",
      "locked": true
    }
  },
  "keywords": {
    "RUSH": "Peut attaquer le tour où elle est jouée.",
    "GUARD": "Tant qu’une Garde existe, le commandant ne peut pas être attaqué directement.",
    "CLOAK": "Ne peut pas être ciblée avant d’attaquer ou de subir des dégâts de zone.",
    "ACID": "À sa destruction, inflige 400 dégâts à l’unité opposée, sinon 250 au commandant.",
    "BROOD": "À l’arrivée, invoque une petite forme Xénomorphe dans une voie libre.",
    "TROPHY": "Quand elle détruit une unité, gagne un Trophée; tous les 2 Trophées, piochez 1.",
    "SYNTHETIC": "Immunisée à Infestation et aux dégâts de Pathogène.",
    "AMBUSH": "À l’arrivée, inflige 300 dégâts à l’unité opposée.",
    "FLYING": "Peut attaquer n’importe quelle voie ennemie.",
    "REGEN": "Récupère 300 PV au début de son tour.",
    "ARMOR": "Réduit de 400 la première instance de dégâts subie.",
    "HIVE": "Coûte 1 énergie de moins si votre lieu est une Ruche.",
    "HUNTER": "Gagne +300 ATK contre une cible ayant plus d’ATK imprimée.",
    "DEATHTOUCH": "Une unité non-boss blessée par celle-ci est détruite après le combat.",
    "SCAVENGE": "À l’arrivée, récupère la dernière carte Équipement de votre défausse.",
    "SQUAD": "Gagne +250 ATK par autre Humain allié.",
    "PATHOGEN": "Les dégâts appliquent Mutation : -200 ATK jusqu’à la fin du prochain tour du propriétaire de la cible.",
    "UNIQUE": "Une seule copie peut être présente sur votre plateau."
  },
  "cards": [
    {
      "id": "X_OVOMORPH",
      "name": "Ovomorphe",
      "type": "UNIT",
      "faction": "XENO",
      "set": "NX01",
      "rarity": "C",
      "cost": 1,
      "attack": 0,
      "health": 800,
      "keywords": [],
      "text": "À sa destruction, invoquez un Facehugger dans cette voie.",
      "flavor": "L’œuf attend la chaleur.",
      "effect": {
        "onDeath": {
          "kind": "SUMMON",
          "card": "X_FACEHUGGER",
          "sameLane": true
        }
      },
      "tags": [
        "stage",
        "egg"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Ovomorphe",
        "prototype": false
      },
      "collectorNo": "NX01-001",
      "index": 0,
      "artSeed": 3085299453,
      "searchText": "ovomorphe unit xeno nx01 c à sa destruction, invoquez un facehugger dans cette voie. l’œuf attend la chaleur. stage egg",
      "slug": "ovomorphe"
    },
    {
      "id": "X_FACEHUGGER",
      "name": "Facehugger",
      "type": "UNIT",
      "faction": "XENO",
      "set": "NX01",
      "rarity": "C",
      "cost": 1,
      "attack": 300,
      "health": 500,
      "keywords": [
        "AMBUSH"
      ],
      "text": "À l’arrivée, l’unité opposée est infestée : -200 ATK.",
      "flavor": "Il ne cherche pas à tuer. Pas encore.",
      "effect": {
        "onPlay": {
          "kind": "DEBUFF_OPPOSING",
          "attack": 200
        }
      },
      "tags": [
        "stage",
        "parasite"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Facehugger",
        "prototype": false
      },
      "collectorNo": "NX01-002",
      "index": 1,
      "artSeed": 3909303421,
      "searchText": "facehugger unit xeno nx01 c à l’arrivée, l’unité opposée est infestée : -200 atk. il ne cherche pas à tuer. pas encore. stage parasite ambush",
      "slug": "facehugger"
    },
    {
      "id": "X_CHESTBURSTER",
      "name": "Chestburster",
      "type": "UNIT",
      "faction": "XENO",
      "set": "NX01",
      "rarity": "C",
      "cost": 1,
      "attack": 600,
      "health": 400,
      "keywords": [
        "RUSH"
      ],
      "text": "Peut attaquer immédiatement.",
      "flavor": "Une naissance n’est jamais silencieuse.",
      "effect": {},
      "tags": [
        "stage",
        "juvenile"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Chestburster",
        "prototype": false
      },
      "collectorNo": "NX01-003",
      "index": 2,
      "artSeed": 2007074757,
      "searchText": "chestburster unit xeno nx01 c peut attaquer immédiatement. une naissance n’est jamais silencieuse. stage juvenile rush",
      "slug": "chestburster"
    },
    {
      "id": "X_DRONE",
      "name": "Drone Xénomorphe",
      "type": "UNIT",
      "faction": "XENO",
      "set": "NX01",
      "rarity": "C",
      "cost": 2,
      "attack": 900,
      "health": 1000,
      "keywords": [
        "HIVE"
      ],
      "text": "Coûte moins cher au sein d’une Ruche.",
      "flavor": "Il construit, capture et protège.",
      "effect": {},
      "tags": [
        "drone",
        "hive"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Drone Xénomorphe",
        "prototype": false
      },
      "collectorNo": "NX01-004",
      "index": 3,
      "artSeed": 2067062444,
      "searchText": "drone xénomorphe unit xeno nx01 c coûte moins cher au sein d’une ruche. il construit, capture et protège. drone hive hive",
      "slug": "drone-x-nomorphe"
    },
    {
      "id": "X_WARRIOR",
      "name": "Warrior Xénomorphe",
      "type": "UNIT",
      "faction": "XENO",
      "set": "CW02",
      "rarity": "R",
      "cost": 3,
      "attack": 1500,
      "health": 1400,
      "keywords": [
        "ACID"
      ],
      "text": "Son sang continue le combat après sa mort.",
      "flavor": "Des rangées de dents dans l’obscurité.",
      "effect": {},
      "tags": [
        "warrior",
        "hadleys-hope"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Warrior Xénomorphe",
        "prototype": false
      },
      "collectorNo": "CW02-001",
      "index": 4,
      "artSeed": 3426269854,
      "searchText": "warrior xénomorphe unit xeno cw02 r son sang continue le combat après sa mort. des rangées de dents dans l’obscurité. warrior hadleys-hope acid",
      "slug": "warrior-x-nomorphe"
    },
    {
      "id": "X_RUNNER",
      "name": "Runner",
      "type": "UNIT",
      "faction": "XENO",
      "set": "NX01",
      "rarity": "R",
      "cost": 2,
      "attack": 1200,
      "health": 700,
      "keywords": [
        "RUSH"
      ],
      "text": "Rapide et agressif.",
      "flavor": "La forme de l’hôte redessine le prédateur.",
      "effect": {},
      "tags": [
        "runner",
        "quadruped"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Runner",
        "prototype": false
      },
      "collectorNo": "NX01-005",
      "index": 5,
      "artSeed": 838532893,
      "searchText": "runner unit xeno nx01 r rapide et agressif. la forme de l’hôte redessine le prédateur. runner quadruped rush",
      "slug": "runner"
    },
    {
      "id": "X_SPITTER",
      "name": "Spitter",
      "type": "UNIT",
      "faction": "XENO",
      "set": "CW02",
      "rarity": "R",
      "cost": 3,
      "attack": 1100,
      "health": 1200,
      "keywords": [],
      "text": "À l’arrivée, inflige 500 dégâts au commandant adverse.",
      "flavor": "La distance ne garantit plus la sécurité.",
      "effect": {
        "onPlay": {
          "kind": "DAMAGE_HERO",
          "amount": 500
        }
      },
      "tags": [
        "ranged",
        "acid"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Spitter",
        "prototype": false
      },
      "collectorNo": "CW02-002",
      "index": 6,
      "artSeed": 919760618,
      "searchText": "spitter unit xeno cw02 r à l’arrivée, inflige 500 dégâts au commandant adverse. la distance ne garantit plus la sécurité. ranged acid",
      "slug": "spitter"
    },
    {
      "id": "X_STALKER",
      "name": "Stalker",
      "type": "UNIT",
      "faction": "XENO",
      "set": "CW02",
      "rarity": "R",
      "cost": 3,
      "attack": 1300,
      "health": 1100,
      "keywords": [
        "CLOAK"
      ],
      "text": "Camouflé jusqu’à sa première attaque.",
      "flavor": "On l’entend seulement lorsqu’il est déjà trop près.",
      "effect": {},
      "tags": [
        "stalker",
        "stealth"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Stalker",
        "prototype": false
      },
      "collectorNo": "CW02-003",
      "index": 7,
      "artSeed": 3348185747,
      "searchText": "stalker unit xeno cw02 r camouflé jusqu’à sa première attaque. on l’entend seulement lorsqu’il est déjà trop près. stalker stealth cloak",
      "slug": "stalker"
    },
    {
      "id": "X_PRAETORIAN",
      "name": "Praetorian",
      "type": "UNIT",
      "faction": "XENO",
      "set": "CW02",
      "rarity": "SR",
      "cost": 5,
      "attack": 2300,
      "health": 2700,
      "keywords": [
        "GUARD",
        "ARMOR"
      ],
      "text": "Protège la reine et encaisse le premier impact.",
      "flavor": "Une forteresse vivante.",
      "effect": {},
      "tags": [
        "praetorian",
        "royal"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Praetorian",
        "prototype": false
      },
      "collectorNo": "CW02-004",
      "index": 8,
      "artSeed": 1002177508,
      "searchText": "praetorian unit xeno cw02 sr protège la reine et encaisse le premier impact. une forteresse vivante. praetorian royal guard armor",
      "slug": "praetorian"
    },
    {
      "id": "X_QUEEN",
      "name": "Reine Xénomorphe",
      "type": "UNIT",
      "faction": "XENO",
      "set": "CW02",
      "rarity": "UR",
      "cost": 7,
      "attack": 2900,
      "health": 3500,
      "keywords": [
        "BROOD",
        "GUARD",
        "UNIQUE"
      ],
      "text": "À l’arrivée, invoquez jusqu’à deux Ovomorphes dans les voies libres.",
      "flavor": "Toute ruche possède un cœur.",
      "effect": {
        "onPlay": {
          "kind": "SUMMON_MULTI",
          "card": "X_OVOMORPH",
          "count": 2
        }
      },
      "tags": [
        "queen",
        "royal"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Reine Xénomorphe",
        "prototype": false
      },
      "collectorNo": "CW02-005",
      "index": 9,
      "artSeed": 2841616278,
      "searchText": "reine xénomorphe unit xeno cw02 ur à l’arrivée, invoquez jusqu’à deux ovomorphes dans les voies libres. toute ruche possède un cœur. queen royal brood guard unique",
      "slug": "reine-x-nomorphe"
    },
    {
      "id": "X_QUEEN_MOTHER",
      "name": "Queen Mother",
      "type": "UNIT",
      "faction": "XENO",
      "set": "EV05",
      "rarity": "GR",
      "cost": 9,
      "attack": 3700,
      "health": 4400,
      "keywords": [
        "BROOD",
        "REGEN",
        "GUARD",
        "UNIQUE"
      ],
      "text": "Au début de votre tour, invoquez un Drone si une voie est libre.",
      "flavor": "Plus ancienne que les colonies qui l’ont découverte.",
      "effect": {
        "turnStart": {
          "kind": "SUMMON",
          "card": "X_DRONE"
        }
      },
      "tags": [
        "queen",
        "mother",
        "boss"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Queen Mother",
        "prototype": false
      },
      "collectorNo": "EV05-001",
      "index": 10,
      "artSeed": 3591103634,
      "searchText": "queen mother unit xeno ev05 gr au début de votre tour, invoquez un drone si une voie est libre. plus ancienne que les colonies qui l’ont découverte. queen mother boss brood regen guard unique",
      "slug": "queen-mother"
    },
    {
      "id": "X_BIG_CHAP",
      "name": "Big Chap — Organisme parfait",
      "type": "UNIT",
      "faction": "XENO",
      "set": "NX01",
      "rarity": "UR",
      "cost": 6,
      "attack": 2600,
      "health": 2500,
      "keywords": [
        "CLOAK",
        "DEATHTOUCH",
        "UNIQUE"
      ],
      "text": "La première unité qu’il blesse lors d’un combat est détruite.",
      "flavor": "Aucune hésitation ne trouble la précision de ses mouvements.",
      "effect": {},
      "tags": [
        "big-chap",
        "alien-1979"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Big Chap — Organisme parfait",
        "prototype": false
      },
      "collectorNo": "NX01-006",
      "index": 11,
      "artSeed": 661972395,
      "searchText": "big chap — organisme parfait unit xeno nx01 ur la première unité qu’il blesse lors d’un combat est détruite. aucune hésitation ne trouble la précision de ses mouvements. big-chap alien-1979 cloak deathtouch unique",
      "slug": "big-chap-organisme-parfait"
    },
    {
      "id": "X_SCORCHED",
      "name": "Scorched Xenomorph",
      "type": "UNIT",
      "faction": "XENO",
      "set": "EV05",
      "rarity": "SR",
      "cost": 5,
      "attack": 2300,
      "health": 2200,
      "keywords": [
        "ACID",
        "RUSH"
      ],
      "text": "Une forme survivante, brûlée mais accélérée.",
      "flavor": "Le feu n’a fait que révéler son adaptation.",
      "effect": {},
      "tags": [
        "romulus",
        "scorched"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Scorched Xenomorph",
        "prototype": false
      },
      "collectorNo": "EV05-002",
      "index": 12,
      "artSeed": 1893645564,
      "searchText": "scorched xenomorph unit xeno ev05 sr une forme survivante, brûlée mais accélérée. le feu n’a fait que révéler son adaptation. romulus scorched acid rush",
      "slug": "scorched-xenomorph"
    },
    {
      "id": "X_GRID",
      "name": "Grid",
      "type": "UNIT",
      "faction": "HYBRID",
      "set": "AV04",
      "rarity": "SR",
      "cost": 4,
      "attack": 2100,
      "health": 1700,
      "keywords": [
        "HUNTER",
        "ACID",
        "UNIQUE"
      ],
      "text": "Gagne +300 ATK contre les Yautja et les unités plus puissantes.",
      "flavor": "La marque du filet est devenue un nom.",
      "effect": {},
      "tags": [
        "avp",
        "grid"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Grid",
        "prototype": false
      },
      "collectorNo": "AV04-001",
      "index": 13,
      "artSeed": 3908879544,
      "searchText": "grid unit hybrid av04 sr gagne +300 atk contre les yautja et les unités plus puissantes. la marque du filet est devenue un nom. avp grid hunter acid unique",
      "slug": "grid"
    },
    {
      "id": "X_RED",
      "name": "Red Xenomorph",
      "type": "UNIT",
      "faction": "XENO",
      "set": "EV05",
      "rarity": "R",
      "cost": 4,
      "attack": 1900,
      "health": 2100,
      "keywords": [
        "ACID"
      ],
      "text": "À l’arrivée, les autres Xénomorphes gagnent +100 ATK.",
      "flavor": "Une ruche peut aussi connaître la guerre civile.",
      "effect": {
        "onPlay": {
          "kind": "BUFF_ALL",
          "faction": "XENO",
          "attack": 100,
          "health": 0
        }
      },
      "tags": [
        "genocide",
        "red"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Red Xenomorph",
        "prototype": false
      },
      "collectorNo": "EV05-003",
      "index": 14,
      "artSeed": 2399791156,
      "searchText": "red xenomorph unit xeno ev05 r à l’arrivée, les autres xénomorphes gagnent +100 atk. une ruche peut aussi connaître la guerre civile. genocide red acid",
      "slug": "red-xenomorph"
    },
    {
      "id": "X_GORILLA",
      "name": "Gorilla Alien",
      "type": "UNIT",
      "faction": "XENO",
      "set": "EV05",
      "rarity": "R",
      "cost": 4,
      "attack": 2100,
      "health": 2400,
      "keywords": [
        "GUARD"
      ],
      "text": "Une morphologie simiesque conçue pour la collision.",
      "flavor": "Kenner transforma l’hôte en arsenal biologique.",
      "effect": {},
      "tags": [
        "kenner",
        "gorilla"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Gorilla Alien",
        "prototype": false
      },
      "collectorNo": "EV05-004",
      "index": 15,
      "artSeed": 4101158132,
      "searchText": "gorilla alien unit xeno ev05 r une morphologie simiesque conçue pour la collision. kenner transforma l’hôte en arsenal biologique. kenner gorilla guard",
      "slug": "gorilla-alien"
    },
    {
      "id": "X_BULL",
      "name": "Bull Alien",
      "type": "UNIT",
      "faction": "XENO",
      "set": "EV05",
      "rarity": "R",
      "cost": 4,
      "attack": 2300,
      "health": 1800,
      "keywords": [
        "RUSH"
      ],
      "text": "Si sa voie est vide, inflige 300 dégâts supplémentaires au commandant.",
      "flavor": "Cornes basses, charge directe.",
      "effect": {
        "directBonus": 300
      },
      "tags": [
        "kenner",
        "bull"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Bull Alien",
        "prototype": false
      },
      "collectorNo": "EV05-005",
      "index": 16,
      "artSeed": 4261235252,
      "searchText": "bull alien unit xeno ev05 r si sa voie est vide, inflige 300 dégâts supplémentaires au commandant. cornes basses, charge directe. kenner bull rush",
      "slug": "bull-alien"
    },
    {
      "id": "X_MANTIS",
      "name": "Mantis Alien",
      "type": "UNIT",
      "faction": "XENO",
      "set": "EV05",
      "rarity": "R",
      "cost": 3,
      "attack": 1700,
      "health": 1400,
      "keywords": [
        "AMBUSH"
      ],
      "text": "Ses membres ravisseurs frappent dès l’arrivée.",
      "flavor": "Les angles morts appartiennent à la mante.",
      "effect": {},
      "tags": [
        "kenner",
        "mantis"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Mantis Alien",
        "prototype": false
      },
      "collectorNo": "EV05-006",
      "index": 17,
      "artSeed": 4211019830,
      "searchText": "mantis alien unit xeno ev05 r ses membres ravisseurs frappent dès l’arrivée. les angles morts appartiennent à la mante. kenner mantis ambush",
      "slug": "mantis-alien"
    },
    {
      "id": "X_SNAKE",
      "name": "Snake Alien",
      "type": "UNIT",
      "faction": "XENO",
      "set": "EV05",
      "rarity": "R",
      "cost": 3,
      "attack": 1800,
      "health": 1200,
      "keywords": [
        "CLOAK"
      ],
      "text": "Peut se dissimuler avant la frappe.",
      "flavor": "Un corps allongé pour les conduits trop étroits.",
      "effect": {},
      "tags": [
        "kenner",
        "snake"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Snake Alien",
        "prototype": false
      },
      "collectorNo": "EV05-007",
      "index": 18,
      "artSeed": 74175201,
      "searchText": "snake alien unit xeno ev05 r peut se dissimuler avant la frappe. un corps allongé pour les conduits trop étroits. kenner snake cloak",
      "slug": "snake-alien"
    },
    {
      "id": "X_FLYING_QUEEN",
      "name": "Flying Queen",
      "type": "UNIT",
      "faction": "XENO",
      "set": "EV05",
      "rarity": "SCR",
      "cost": 8,
      "attack": 3200,
      "health": 3100,
      "keywords": [
        "FLYING",
        "BROOD",
        "UNIQUE"
      ],
      "text": "Peut attaquer n’importe quelle voie et invoque un Ovomorphe.",
      "flavor": "La ruche conquiert aussi le ciel.",
      "effect": {
        "onPlay": {
          "kind": "SUMMON_MULTI",
          "card": "X_OVOMORPH",
          "count": 1
        }
      },
      "tags": [
        "kenner",
        "queen",
        "flying"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Flying Queen",
        "prototype": false
      },
      "collectorNo": "EV05-008",
      "index": 19,
      "artSeed": 2520696750,
      "searchText": "flying queen unit xeno ev05 scr peut attaquer n’importe quelle voie et invoque un ovomorphe. la ruche conquiert aussi le ciel. kenner queen flying flying brood unique",
      "slug": "flying-queen"
    },
    {
      "id": "X_POPPER",
      "name": "Pathogen Popper",
      "type": "UNIT",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "C",
      "cost": 1,
      "attack": 500,
      "health": 400,
      "keywords": [
        "PATHOGEN"
      ],
      "text": "À sa destruction, inflige 300 dégâts à toutes les unités.",
      "flavor": "Une poche instable sur pattes.",
      "effect": {
        "onDeath": {
          "kind": "DAMAGE_ALL",
          "amount": 300
        }
      },
      "tags": [
        "pathogen",
        "popper"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Pathogen Popper",
        "prototype": false
      },
      "collectorNo": "EV05-009",
      "index": 20,
      "artSeed": 1077883285,
      "searchText": "pathogen popper unit engineer ev05 c à sa destruction, inflige 300 dégâts à toutes les unités. une poche instable sur pattes. pathogen popper pathogen",
      "slug": "pathogen-popper"
    },
    {
      "id": "X_PATH_STALKER",
      "name": "Pathogen Stalker",
      "type": "UNIT",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "R",
      "cost": 3,
      "attack": 1400,
      "health": 1200,
      "keywords": [
        "CLOAK",
        "PATHOGEN"
      ],
      "text": "Ses dégâts réduisent l’ATK de la cible.",
      "flavor": "Pâle, silencieux, provisoire.",
      "effect": {},
      "tags": [
        "pathogen",
        "stalker"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Pathogen Stalker",
        "prototype": false
      },
      "collectorNo": "EV05-010",
      "index": 21,
      "artSeed": 2168341042,
      "searchText": "pathogen stalker unit engineer ev05 r ses dégâts réduisent l’atk de la cible. pâle, silencieux, provisoire. pathogen stalker cloak pathogen",
      "slug": "pathogen-stalker"
    },
    {
      "id": "X_PATH_BRUTE",
      "name": "Pathogen Brute",
      "type": "UNIT",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "SR",
      "cost": 5,
      "attack": 2400,
      "health": 2900,
      "keywords": [
        "ARMOR",
        "PATHOGEN"
      ],
      "text": "La première attaque subie est amortie.",
      "flavor": "Masse, résistance, contamination.",
      "effect": {},
      "tags": [
        "pathogen",
        "brute"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Pathogen Brute",
        "prototype": false
      },
      "collectorNo": "EV05-011",
      "index": 22,
      "artSeed": 4052131875,
      "searchText": "pathogen brute unit engineer ev05 sr la première attaque subie est amortie. masse, résistance, contamination. pathogen brute armor pathogen",
      "slug": "pathogen-brute"
    },
    {
      "id": "X_PATH_QUEEN",
      "name": "Pathogen Queen",
      "type": "UNIT",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "PR",
      "cost": 8,
      "attack": 3300,
      "health": 3700,
      "keywords": [
        "BROOD",
        "REGEN",
        "PATHOGEN",
        "UNIQUE"
      ],
      "text": "Invoque un Popper et régénère ses tissus.",
      "flavor": "La royauté réécrite par le liquide noir.",
      "effect": {
        "onPlay": {
          "kind": "SUMMON_MULTI",
          "card": "X_POPPER",
          "count": 1
        }
      },
      "tags": [
        "pathogen",
        "queen"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Pathogen Queen",
        "prototype": false
      },
      "collectorNo": "EV05-012",
      "index": 23,
      "artSeed": 2925222333,
      "searchText": "pathogen queen unit engineer ev05 pr invoque un popper et régénère ses tissus. la royauté réécrite par le liquide noir. pathogen queen brood regen pathogen unique",
      "slug": "pathogen-queen"
    },
    {
      "id": "X_WARDEN",
      "name": "Warden",
      "type": "UNIT",
      "faction": "XENO",
      "set": "EV05",
      "rarity": "SR",
      "cost": 5,
      "attack": 2200,
      "health": 3000,
      "keywords": [
        "GUARD",
        "ACID"
      ],
      "text": "Contrôle la voie et résiste aux assauts.",
      "flavor": "Sa masse repousse le front et ferme les passages.",
      "effect": {},
      "tags": [
        "fireteam-elite-2",
        "warden"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Warden",
        "prototype": false
      },
      "collectorNo": "EV05-013",
      "index": 24,
      "artSeed": 2253053796,
      "searchText": "warden unit xeno ev05 sr contrôle la voie et résiste aux assauts. sa masse repousse le front et ferme les passages. fireteam-elite-2 warden guard acid",
      "slug": "warden"
    },
    {
      "id": "X_SIREN",
      "name": "Siren",
      "type": "UNIT",
      "faction": "XENO",
      "set": "EV05",
      "rarity": "SR",
      "cost": 4,
      "attack": 1400,
      "health": 1900,
      "keywords": [
        "BROOD"
      ],
      "text": "À l’arrivée, invoque un Chestburster dans une voie libre.",
      "flavor": "Son cri appelle ce que les capteurs n’avaient pas compté.",
      "effect": {
        "onPlay": {
          "kind": "SUMMON_MULTI",
          "card": "X_CHESTBURSTER",
          "count": 1
        }
      },
      "tags": [
        "fireteam-elite-2",
        "siren"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Siren",
        "prototype": false
      },
      "collectorNo": "EV05-014",
      "index": 25,
      "artSeed": 3764096637,
      "searchText": "siren unit xeno ev05 sr à l’arrivée, invoque un chestburster dans une voie libre. son cri appelle ce que les capteurs n’avaient pas compté. fireteam-elite-2 siren brood",
      "slug": "siren"
    },
    {
      "id": "X_NEOMORPH",
      "name": "Neomorph",
      "type": "UNIT",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "R",
      "cost": 3,
      "attack": 1600,
      "health": 1200,
      "keywords": [
        "RUSH",
        "PATHOGEN"
      ],
      "text": "Une naissance explosive et une violence immédiate.",
      "flavor": "La création sans carapace.",
      "effect": {},
      "tags": [
        "covenant",
        "neomorph"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Neomorph",
        "prototype": false
      },
      "collectorNo": "EV05-015",
      "index": 26,
      "artSeed": 3598921446,
      "searchText": "neomorph unit engineer ev05 r une naissance explosive et une violence immédiate. la création sans carapace. covenant neomorph rush pathogen",
      "slug": "neomorph"
    },
    {
      "id": "X_DEACON",
      "name": "Deacon",
      "type": "UNIT",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "SR",
      "cost": 5,
      "attack": 2400,
      "health": 2300,
      "keywords": [
        "DEATHTOUCH",
        "UNIQUE"
      ],
      "text": "Toute unité blessée par le Deacon est condamnée.",
      "flavor": "Une silhouette bleue née d’une chaîne impossible.",
      "effect": {},
      "tags": [
        "prometheus",
        "deacon"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Deacon",
        "prototype": false
      },
      "collectorNo": "EV05-016",
      "index": 27,
      "artSeed": 886793862,
      "searchText": "deacon unit engineer ev05 sr toute unité blessée par le deacon est condamnée. une silhouette bleue née d’une chaîne impossible. prometheus deacon deathtouch unique",
      "slug": "deacon"
    },
    {
      "id": "Y_UNBLOODED",
      "name": "Unblooded Yautja",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "C",
      "cost": 1,
      "attack": 600,
      "health": 700,
      "keywords": [],
      "text": "Quand il gagne un Trophée, gagne définitivement +200 ATK.",
      "flavor": "La chasse commence avant le nom.",
      "effect": {
        "onTrophy": {
          "kind": "BUFF_SELF",
          "attack": 200,
          "health": 0
        }
      },
      "tags": [
        "rank",
        "unblooded"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Unblooded Yautja",
        "prototype": false
      },
      "collectorNo": "HG03-001",
      "index": 28,
      "artSeed": 4172189715,
      "searchText": "unblooded yautja unit yautja hg03 c quand il gagne un trophée, gagne définitivement +200 atk. la chasse commence avant le nom. rank unblooded",
      "slug": "unblooded-yautja"
    },
    {
      "id": "Y_YOUNG_BLOOD",
      "name": "Young Blood",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "AV04",
      "rarity": "C",
      "cost": 2,
      "attack": 1000,
      "health": 900,
      "keywords": [
        "HUNTER"
      ],
      "text": "Gagne en puissance contre une proie supérieure.",
      "flavor": "Le rite ne pardonne aucune hésitation.",
      "effect": {},
      "tags": [
        "rank",
        "young-blood"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Young Blood",
        "prototype": false
      },
      "collectorNo": "AV04-002",
      "index": 29,
      "artSeed": 2775341355,
      "searchText": "young blood unit yautja av04 c gagne en puissance contre une proie supérieure. le rite ne pardonne aucune hésitation. rank young-blood hunter",
      "slug": "young-blood"
    },
    {
      "id": "Y_ELITE",
      "name": "Elite Predator",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "R",
      "cost": 4,
      "attack": 2000,
      "health": 1900,
      "keywords": [
        "TROPHY",
        "HUNTER"
      ],
      "text": "Chaque élimination nourrit le prestige du clan.",
      "flavor": "Missions critiques, pertes minimales.",
      "effect": {},
      "tags": [
        "rank",
        "elite"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Elite Predator",
        "prototype": false
      },
      "collectorNo": "HG03-002",
      "index": 30,
      "artSeed": 3559667454,
      "searchText": "elite predator unit yautja hg03 r chaque élimination nourrit le prestige du clan. missions critiques, pertes minimales. rank elite trophy hunter",
      "slug": "elite-predator"
    },
    {
      "id": "Y_ELDER",
      "name": "Elder Predator",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "AV04",
      "rarity": "UR",
      "cost": 6,
      "attack": 2600,
      "health": 3000,
      "keywords": [
        "TROPHY",
        "GUARD",
        "UNIQUE"
      ],
      "text": "À l’arrivée, donne +300 ATK à tous vos Yautja.",
      "flavor": "Il dirige, juge et récompense.",
      "effect": {
        "onPlay": {
          "kind": "BUFF_ALL",
          "faction": "YAUTJA",
          "attack": 300,
          "health": 0
        }
      },
      "tags": [
        "rank",
        "elder"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Elder Predator",
        "prototype": false
      },
      "collectorNo": "AV04-003",
      "index": 31,
      "artSeed": 4277718630,
      "searchText": "elder predator unit yautja av04 ur à l’arrivée, donne +300 atk à tous vos yautja. il dirige, juge et récompense. rank elder trophy guard unique",
      "slug": "elder-predator"
    },
    {
      "id": "Y_CLAN_LEADER",
      "name": "Clan Leader",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "SR",
      "cost": 5,
      "attack": 2300,
      "health": 2600,
      "keywords": [
        "TROPHY",
        "GUARD",
        "UNIQUE"
      ],
      "text": "Vos Yautja gagnent +100 ATK par Trophée.",
      "flavor": "Un clan se mesure à la qualité de ses proies.",
      "effect": {
        "aura": {
          "kind": "TROPHY_ATTACK",
          "amount": 100,
          "faction": "YAUTJA"
        }
      },
      "tags": [
        "rank",
        "leader"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Clan Leader",
        "prototype": false
      },
      "collectorNo": "HG03-003",
      "index": 32,
      "artSeed": 3280721659,
      "searchText": "clan leader unit yautja hg03 sr vos yautja gagnent +100 atk par trophée. un clan se mesure à la qualité de ses proies. rank leader trophy guard unique",
      "slug": "clan-leader"
    },
    {
      "id": "Y_ANCIENT",
      "name": "Ancient Predator",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "AV04",
      "rarity": "SCR",
      "cost": 8,
      "attack": 3200,
      "health": 3500,
      "keywords": [
        "TROPHY",
        "ARMOR",
        "REGEN",
        "UNIQUE"
      ],
      "text": "La première blessure est réduite et il se régénère.",
      "flavor": "Le prestige maximal porte de nombreuses cicatrices.",
      "effect": {},
      "tags": [
        "rank",
        "ancient"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Ancient Predator",
        "prototype": false
      },
      "collectorNo": "AV04-004",
      "index": 33,
      "artSeed": 3918310398,
      "searchText": "ancient predator unit yautja av04 scr la première blessure est réduite et il se régénère. le prestige maximal porte de nombreuses cicatrices. rank ancient trophy armor regen unique",
      "slug": "ancient-predator"
    },
    {
      "id": "Y_ENFORCER",
      "name": "Enforcer",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "SR",
      "cost": 4,
      "attack": 1900,
      "health": 2200,
      "keywords": [
        "HUNTER",
        "GUARD"
      ],
      "text": "À l’arrivée, inflige 600 dégâts à un Bad Blood ou Hybride opposé.",
      "flavor": "La loi du code possède ses propres chasseurs.",
      "effect": {
        "onPlay": {
          "kind": "DAMAGE_TAG",
          "amount": 600,
          "tag": "bad-blood",
          "faction": "HYBRID"
        }
      },
      "tags": [
        "rank",
        "enforcer"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Enforcer",
        "prototype": false
      },
      "collectorNo": "HG03-004",
      "index": 34,
      "artSeed": 239774269,
      "searchText": "enforcer unit yautja hg03 sr à l’arrivée, inflige 600 dégâts à un bad blood ou hybride opposé. la loi du code possède ses propres chasseurs. rank enforcer hunter guard",
      "slug": "enforcer"
    },
    {
      "id": "Y_BAD_BLOOD",
      "name": "Bad Blood",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "R",
      "cost": 3,
      "attack": 1900,
      "health": 1200,
      "keywords": [
        "RUSH"
      ],
      "text": "Ne gagne pas de Trophées, mais attaque immédiatement.",
      "flavor": "Une chasse sans code devient un massacre.",
      "effect": {},
      "tags": [
        "bad-blood",
        "outlaw"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Bad Blood",
        "prototype": false
      },
      "collectorNo": "HG03-005",
      "index": 35,
      "artSeed": 673357702,
      "searchText": "bad blood unit yautja hg03 r ne gagne pas de trophées, mais attaque immédiatement. une chasse sans code devient un massacre. bad-blood outlaw rush",
      "slug": "bad-blood"
    },
    {
      "id": "Y_JUNGLE_HUNTER",
      "name": "Jungle Hunter",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "UR",
      "cost": 6,
      "attack": 2700,
      "health": 2400,
      "keywords": [
        "CLOAK",
        "TROPHY",
        "HUNTER",
        "UNIQUE"
      ],
      "text": "Camouflé; excelle contre une proie plus puissante.",
      "flavor": "Quelque chose chasse dans la chaleur de Val Verde.",
      "effect": {},
      "tags": [
        "predator-1987",
        "jungle"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Jungle Hunter",
        "prototype": false
      },
      "collectorNo": "HG03-006",
      "index": 36,
      "artSeed": 3745317395,
      "searchText": "jungle hunter unit yautja hg03 ur camouflé; excelle contre une proie plus puissante. quelque chose chasse dans la chaleur de val verde. predator-1987 jungle cloak trophy hunter unique",
      "slug": "jungle-hunter"
    },
    {
      "id": "Y_CITY_HUNTER",
      "name": "City Hunter",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "SR",
      "cost": 5,
      "attack": 2400,
      "health": 2100,
      "keywords": [
        "CLOAK",
        "TROPHY",
        "SCAVENGE",
        "UNIQUE"
      ],
      "text": "Récupère un Équipement de votre défausse.",
      "flavor": "La canicule attire un autre genre de violence.",
      "effect": {},
      "tags": [
        "predator-2",
        "city"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "City Hunter",
        "prototype": false
      },
      "collectorNo": "HG03-007",
      "index": 37,
      "artSeed": 812277250,
      "searchText": "city hunter unit yautja hg03 sr récupère un équipement de votre défausse. la canicule attire un autre genre de violence. predator-2 city cloak trophy scavenge unique",
      "slug": "city-hunter"
    },
    {
      "id": "Y_SCAR",
      "name": "Scar",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "AV04",
      "rarity": "UR",
      "cost": 6,
      "attack": 2600,
      "health": 2600,
      "keywords": [
        "TROPHY",
        "HUNTER",
        "UNIQUE"
      ],
      "text": "Si un Xénomorphe allié est présent, gagne +500 ATK.",
      "flavor": "Le sang acide transforme l’épreuve en alliance.",
      "effect": {
        "conditionalAttack": {
          "allyFaction": "XENO",
          "amount": 500
        }
      },
      "tags": [
        "avp",
        "blooded"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Scar",
        "prototype": false
      },
      "collectorNo": "AV04-005",
      "index": 38,
      "artSeed": 3817455677,
      "searchText": "scar unit yautja av04 ur si un xénomorphe allié est présent, gagne +500 atk. le sang acide transforme l’épreuve en alliance. avp blooded trophy hunter unique",
      "slug": "scar"
    },
    {
      "id": "Y_CELTIC",
      "name": "Celtic",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "AV04",
      "rarity": "SR",
      "cost": 5,
      "attack": 2500,
      "health": 2300,
      "keywords": [
        "TROPHY",
        "ARMOR",
        "UNIQUE"
      ],
      "text": "Réduit la première instance de dégâts.",
      "flavor": "Force et arrogance sous le temple.",
      "effect": {},
      "tags": [
        "avp",
        "celtic"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Celtic",
        "prototype": false
      },
      "collectorNo": "AV04-006",
      "index": 39,
      "artSeed": 2823178447,
      "searchText": "celtic unit yautja av04 sr réduit la première instance de dégâts. force et arrogance sous le temple. avp celtic trophy armor unique",
      "slug": "celtic"
    },
    {
      "id": "Y_CHOPPER",
      "name": "Chopper",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "AV04",
      "rarity": "R",
      "cost": 4,
      "attack": 2100,
      "health": 1700,
      "keywords": [
        "RUSH",
        "TROPHY",
        "UNIQUE"
      ],
      "text": "Attaque dès l’arrivée.",
      "flavor": "Deux lames, une seconde trop tard.",
      "effect": {},
      "tags": [
        "avp",
        "chopper"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Chopper",
        "prototype": false
      },
      "collectorNo": "AV04-007",
      "index": 40,
      "artSeed": 3404688405,
      "searchText": "chopper unit yautja av04 r attaque dès l’arrivée. deux lames, une seconde trop tard. avp chopper rush trophy unique",
      "slug": "chopper"
    },
    {
      "id": "Y_WOLF",
      "name": "Wolf Predator",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "AV04",
      "rarity": "SCR",
      "cost": 7,
      "attack": 3000,
      "health": 3000,
      "keywords": [
        "CLOAK",
        "TROPHY",
        "SCAVENGE",
        "UNIQUE"
      ],
      "text": "À l’arrivée, récupère un Équipement et inflige 400 dégâts à une unité infestée.",
      "flavor": "Nettoyeur, chasseur, dernier recours.",
      "effect": {
        "onPlay": {
          "kind": "DAMAGE_DEBUFFED",
          "amount": 400
        }
      },
      "tags": [
        "avpr",
        "wolf"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Wolf Predator",
        "prototype": false
      },
      "collectorNo": "AV04-008",
      "index": 41,
      "artSeed": 1994076408,
      "searchText": "wolf predator unit yautja av04 scr à l’arrivée, récupère un équipement et inflige 400 dégâts à une unité infestée. nettoyeur, chasseur, dernier recours. avpr wolf cloak trophy scavenge unique",
      "slug": "wolf-predator"
    },
    {
      "id": "Y_BERSERKER",
      "name": "Berserker Predator",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "UR",
      "cost": 6,
      "attack": 2900,
      "health": 2400,
      "keywords": [
        "RUSH",
        "HUNTER",
        "UNIQUE"
      ],
      "text": "Attaque immédiatement; ne respecte pas le code traditionnel.",
      "flavor": "Le chef du trio ne chasse pas pour l’honneur.",
      "effect": {},
      "tags": [
        "super-predator",
        "bad-blood",
        "predators"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Berserker Predator",
        "prototype": false
      },
      "collectorNo": "HG03-008",
      "index": 42,
      "artSeed": 2483397211,
      "searchText": "berserker predator unit yautja hg03 ur attaque immédiatement; ne respecte pas le code traditionnel. le chef du trio ne chasse pas pour l’honneur. super-predator bad-blood predators rush hunter unique",
      "slug": "berserker-predator"
    },
    {
      "id": "Y_FALCONER",
      "name": "Falconer Predator",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "SR",
      "cost": 5,
      "attack": 2200,
      "health": 2200,
      "keywords": [
        "FLYING",
        "TROPHY",
        "UNIQUE"
      ],
      "text": "Peut cibler n’importe quelle voie.",
      "flavor": "Le ciel fait partie de son viseur.",
      "effect": {},
      "tags": [
        "super-predator",
        "falcon"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Falconer Predator",
        "prototype": false
      },
      "collectorNo": "HG03-009",
      "index": 43,
      "artSeed": 957825445,
      "searchText": "falconer predator unit yautja hg03 sr peut cibler n’importe quelle voie. le ciel fait partie de son viseur. super-predator falcon flying trophy unique",
      "slug": "falconer-predator"
    },
    {
      "id": "Y_TRACKER",
      "name": "Tracker Predator",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "SR",
      "cost": 5,
      "attack": 2300,
      "health": 2400,
      "keywords": [
        "TROPHY",
        "BROOD",
        "UNIQUE"
      ],
      "text": "À l’arrivée, invoque un Predator Hound.",
      "flavor": "La piste appartient à la meute.",
      "effect": {
        "onPlay": {
          "kind": "SUMMON_MULTI",
          "card": "Y_HOUND",
          "count": 1
        }
      },
      "tags": [
        "super-predator",
        "hound"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Tracker Predator",
        "prototype": false
      },
      "collectorNo": "HG03-010",
      "index": 44,
      "artSeed": 4009734265,
      "searchText": "tracker predator unit yautja hg03 sr à l’arrivée, invoque un predator hound. la piste appartient à la meute. super-predator hound trophy brood unique",
      "slug": "tracker-predator"
    },
    {
      "id": "Y_HOUND",
      "name": "Predator Hound",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "C",
      "cost": 2,
      "attack": 1100,
      "health": 800,
      "keywords": [
        "RUSH"
      ],
      "text": "Une unité de meute rapide.",
      "flavor": "La laisse est un signal, pas une corde.",
      "effect": {},
      "tags": [
        "hound",
        "beast"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Predator Hound",
        "prototype": false
      },
      "collectorNo": "HG03-011",
      "index": 45,
      "artSeed": 1349011268,
      "searchText": "predator hound unit yautja hg03 c une unité de meute rapide. la laisse est un signal, pas une corde. hound beast rush",
      "slug": "predator-hound"
    },
    {
      "id": "Y_FERAL",
      "name": "Feral Predator",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "UR",
      "cost": 6,
      "attack": 2800,
      "health": 2500,
      "keywords": [
        "HUNTER",
        "RUSH",
        "UNIQUE"
      ],
      "text": "Gagne +300 ATK contre les Humains.",
      "flavor": "Un chasseur venu d’un autre monde et d’un autre temps.",
      "effect": {
        "conditionalAttack": {
          "enemyFaction": "HUMAN",
          "amount": 300
        }
      },
      "tags": [
        "prey",
        "feral"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Feral Predator",
        "prototype": false
      },
      "collectorNo": "HG03-012",
      "index": 46,
      "artSeed": 74175201,
      "searchText": "feral predator unit yautja hg03 ur gagne +300 atk contre les humains. un chasseur venu d’un autre monde et d’un autre temps. prey feral hunter rush unique",
      "slug": "feral-predator"
    },
    {
      "id": "Y_SAMURAI",
      "name": "Samurai Predator",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "SR",
      "cost": 5,
      "attack": 2400,
      "health": 2300,
      "keywords": [
        "TROPHY",
        "DEATHTOUCH"
      ],
      "text": "La première unité qu’il blesse en duel est détruite.",
      "flavor": "Une classe thématique façonnée par le guerrier observé.",
      "effect": {},
      "tags": [
        "hunting-grounds",
        "samurai"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Samurai Predator",
        "prototype": false
      },
      "collectorNo": "HG03-013",
      "index": 47,
      "artSeed": 1411801162,
      "searchText": "samurai predator unit yautja hg03 sr la première unité qu’il blesse en duel est détruite. une classe thématique façonnée par le guerrier observé. hunting-grounds samurai trophy deathtouch",
      "slug": "samurai-predator"
    },
    {
      "id": "Y_GLADIATOR",
      "name": "Gladiator Predator",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "R",
      "cost": 4,
      "attack": 2200,
      "health": 2100,
      "keywords": [
        "TROPHY",
        "GUARD"
      ],
      "text": "Protège les autres chasseurs.",
      "flavor": "L’arène ne connaît pas la retraite.",
      "effect": {},
      "tags": [
        "hunting-grounds",
        "gladiator"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Gladiator Predator",
        "prototype": false
      },
      "collectorNo": "HG03-014",
      "index": 48,
      "artSeed": 490509968,
      "searchText": "gladiator predator unit yautja hg03 r protège les autres chasseurs. l’arène ne connaît pas la retraite. hunting-grounds gladiator trophy guard",
      "slug": "gladiator-predator"
    },
    {
      "id": "Y_TEMPLE_GUARD",
      "name": "Temple Guard",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "AV04",
      "rarity": "R",
      "cost": 4,
      "attack": 1900,
      "health": 2500,
      "keywords": [
        "GUARD",
        "ARMOR"
      ],
      "text": "Gardien des sites rituels.",
      "flavor": "Certains trophées ne doivent jamais être dérangés.",
      "effect": {},
      "tags": [
        "temple",
        "guard"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Temple Guard",
        "prototype": false
      },
      "collectorNo": "AV04-009",
      "index": 49,
      "artSeed": 2773386902,
      "searchText": "temple guard unit yautja av04 r gardien des sites rituels. certains trophées ne doivent jamais être dérangés. temple guard guard armor",
      "slug": "temple-guard"
    },
    {
      "id": "Y_AHAB",
      "name": "Ahab",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "SCR",
      "cost": 7,
      "attack": 3100,
      "health": 2900,
      "keywords": [
        "TROPHY",
        "HUNTER",
        "UNIQUE"
      ],
      "text": "Gagne +600 ATK contre les unités Ingénieur.",
      "flavor": "Une obsession peut survivre à toutes les blessures.",
      "effect": {
        "conditionalAttack": {
          "enemyFaction": "ENGINEER",
          "amount": 600
        }
      },
      "tags": [
        "comics",
        "engineer-hunter"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Ahab",
        "prototype": false
      },
      "collectorNo": "HG03-015",
      "index": 50,
      "artSeed": 2338190427,
      "searchText": "ahab unit yautja hg03 scr gagne +600 atk contre les unités ingénieur. une obsession peut survivre à toutes les blessures. comics engineer-hunter trophy hunter unique",
      "slug": "ahab"
    },
    {
      "id": "Y_SHESH_KUK",
      "name": "Shesh-Kuk",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "SR",
      "cost": 5,
      "attack": 2100,
      "health": 2500,
      "keywords": [
        "CLOAK",
        "TROPHY",
        "UNIQUE"
      ],
      "text": "À l’arrivée, étourdit l’unité opposée pour un tour.",
      "flavor": "Le contrôle mental transforme la chasse en cage.",
      "effect": {
        "onPlay": {
          "kind": "STUN_OPPOSING",
          "turns": 1
        }
      },
      "tags": [
        "comics",
        "mind-control"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Shesh-Kuk",
        "prototype": false
      },
      "collectorNo": "HG03-016",
      "index": 51,
      "artSeed": 3836317385,
      "searchText": "shesh-kuk unit yautja hg03 sr à l’arrivée, étourdit l’unité opposée pour un tour. le contrôle mental transforme la chasse en cage. comics mind-control cloak trophy unique",
      "slug": "shesh-kuk"
    },
    {
      "id": "Y_YAQUITA",
      "name": "Yaquita — Chasseur sans jambes",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "SR",
      "cost": 4,
      "attack": 1800,
      "health": 2300,
      "keywords": [
        "TROPHY",
        "ARMOR",
        "UNIQUE"
      ],
      "text": "Lorsque ses PV passent sous 1000, gagne +700 ATK.",
      "flavor": "La perte d’un membre ne met pas fin à une chasse.",
      "effect": {
        "lowHealthAttack": 700
      },
      "tags": [
        "comics",
        "yaquita"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Yaquita — Chasseur sans jambes",
        "prototype": false
      },
      "collectorNo": "HG03-017",
      "index": 52,
      "artSeed": 1376879953,
      "searchText": "yaquita — chasseur sans jambes unit yautja hg03 sr lorsque ses pv passent sous 1000, gagne +700 atk. la perte d’un membre ne met pas fin à une chasse. comics yaquita trophy armor unique",
      "slug": "yaquita-chasseur-sans-jambes"
    },
    {
      "id": "Y_EMISSARY_A",
      "name": "Emissary Predator A",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "PX00",
      "rarity": "SCR",
      "cost": 5,
      "attack": 2200,
      "health": 2300,
      "keywords": [
        "TROPHY",
        "SQUAD",
        "UNIQUE"
      ],
      "text": "Escouade : gagne +250 ATK par autre Humain allié.",
      "flavor": "Allié aux humains dans une continuité filmée puis supprimée.",
      "effect": {},
      "tags": [
        "cut",
        "emissary",
        "human-ally"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Cut - annulé - proto",
        "entry": "Emissary Predator A",
        "prototype": true
      },
      "collectorNo": "PX00-001",
      "index": 53,
      "artSeed": 2616029523,
      "searchText": "emissary predator a unit yautja px00 scr escouade : gagne +250 atk par autre humain allié. allié aux humains dans une continuité filmée puis supprimée. cut emissary human-ally trophy squad unique",
      "slug": "emissary-predator-a"
    },
    {
      "id": "Y_EMISSARY_B",
      "name": "Emissary Predator B",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "PX00",
      "rarity": "SCR",
      "cost": 5,
      "attack": 2100,
      "health": 2400,
      "keywords": [
        "GUARD",
        "SQUAD",
        "UNIQUE"
      ],
      "text": "Garde. Escouade : gagne +250 ATK par autre Humain allié.",
      "flavor": "Second membre du duo coopérant avec Stargazer.",
      "effect": {},
      "tags": [
        "cut",
        "emissary",
        "human-ally"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Cut - annulé - proto",
        "entry": "Emissary Predator B",
        "prototype": true
      },
      "collectorNo": "PX00-002",
      "index": 54,
      "artSeed": 109520287,
      "searchText": "emissary predator b unit yautja px00 scr garde. escouade : gagne +250 atk par autre humain allié. second membre du duo coopérant avec stargazer. cut emissary human-ally guard squad unique",
      "slug": "emissary-predator-b"
    },
    {
      "id": "Y_SCIENTIST",
      "name": "Scientifique Yautja — Intelligentsia",
      "type": "UNIT",
      "faction": "YAUTJA",
      "set": "PX00",
      "rarity": "PR",
      "cost": 6,
      "attack": 1700,
      "health": 3000,
      "keywords": [
        "CLOAK",
        "UNIQUE"
      ],
      "text": "Vos Équipements coûtent 1 énergie de moins.",
      "flavor": "Caste conceptuelle liée au camouflage et aux moteurs interstellaires.",
      "effect": {
        "aura": {
          "kind": "EQUIPMENT_DISCOUNT",
          "amount": 1
        }
      },
      "tags": [
        "cut",
        "scientist"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Cut - annulé - proto",
        "entry": "Scientifique Yautja — Intelligentsia",
        "prototype": true
      },
      "collectorNo": "PX00-003",
      "index": 55,
      "artSeed": 1068876308,
      "searchText": "scientifique yautja — intelligentsia unit yautja px00 pr vos équipements coûtent 1 énergie de moins. caste conceptuelle liée au camouflage et aux moteurs interstellaires. cut scientist cloak unique",
      "slug": "scientifique-yautja-intelligentsia"
    },
    {
      "id": "H_COLONIAL_MARINE",
      "name": "Colonial Marine",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "C",
      "cost": 2,
      "attack": 1000,
      "health": 1100,
      "keywords": [
        "SQUAD"
      ],
      "text": "Gagne +250 ATK par autre Humain allié.",
      "flavor": "Un fusil, une radio et une mission mal renseignée.",
      "effect": {},
      "tags": [
        "uscm",
        "marine"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Colonial Marine",
        "prototype": false
      },
      "collectorNo": "CW02-006",
      "index": 56,
      "artSeed": 2326887586,
      "searchText": "colonial marine unit human cw02 c gagne +250 atk par autre humain allié. un fusil, une radio et une mission mal renseignée. uscm marine squad",
      "slug": "colonial-marine"
    },
    {
      "id": "H_SMARTGUNNER",
      "name": "Smartgunner USCM",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "R",
      "cost": 3,
      "attack": 1400,
      "health": 1200,
      "keywords": [
        "SQUAD"
      ],
      "text": "À l’arrivée, inflige 300 dégâts à l’unité opposée.",
      "flavor": "Le harnais suit la cible avant le regard.",
      "effect": {
        "onPlay": {
          "kind": "DAMAGE_OPPOSING",
          "amount": 300
        }
      },
      "tags": [
        "uscm",
        "smartgun"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Smartgunner USCM",
        "prototype": false
      },
      "collectorNo": "CW02-007",
      "index": 57,
      "artSeed": 1043385953,
      "searchText": "smartgunner uscm unit human cw02 r à l’arrivée, inflige 300 dégâts à l’unité opposée. le harnais suit la cible avant le regard. uscm smartgun squad",
      "slug": "smartgunner-uscm"
    },
    {
      "id": "H_RIPLEY",
      "name": "Ellen Ripley",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "NX01",
      "rarity": "UR",
      "cost": 5,
      "attack": 1900,
      "health": 2500,
      "keywords": [
        "GUARD",
        "UNIQUE"
      ],
      "text": "À l’arrivée, détruisez un Ovomorphe ou infligez 500 dégâts à un Xénomorphe.",
      "flavor": "Survivre devient une compétence transmissible.",
      "effect": {
        "onPlay": {
          "kind": "DAMAGE_FACTION",
          "faction": "XENO",
          "amount": 500,
          "destroyTag": "egg"
        }
      },
      "tags": [
        "ripley",
        "survivor"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Ellen Ripley",
        "prototype": false
      },
      "collectorNo": "NX01-007",
      "index": 58,
      "artSeed": 63979059,
      "searchText": "ellen ripley unit human nx01 ur à l’arrivée, détruisez un ovomorphe ou infligez 500 dégâts à un xénomorphe. survivre devient une compétence transmissible. ripley survivor guard unique",
      "slug": "ellen-ripley"
    },
    {
      "id": "H_DALLAS",
      "name": "Arthur Dallas",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "NX01",
      "rarity": "R",
      "cost": 3,
      "attack": 1300,
      "health": 1400,
      "keywords": [
        "SQUAD"
      ],
      "text": "Piochez 1 si Nostromo est votre lieu.",
      "flavor": "Capitaine jusqu’au dernier conduit.",
      "effect": {
        "onPlay": {
          "kind": "DRAW_IF_LOCATION",
          "code": "NOSTROMO",
          "count": 1
        }
      },
      "tags": [
        "nostromo",
        "crew"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Arthur Dallas",
        "prototype": false
      },
      "collectorNo": "NX01-008",
      "index": 59,
      "artSeed": 4076433065,
      "searchText": "arthur dallas unit human nx01 r piochez 1 si nostromo est votre lieu. capitaine jusqu’au dernier conduit. nostromo crew squad",
      "slug": "arthur-dallas"
    },
    {
      "id": "H_PARKER",
      "name": "Dennis Parker",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "NX01",
      "rarity": "R",
      "cost": 3,
      "attack": 1500,
      "health": 1300,
      "keywords": [
        "SQUAD"
      ],
      "text": "Gagne +400 ATK si un Synthétique ennemi est présent.",
      "flavor": "Bonus ou pas, quelqu’un doit maintenir les moteurs.",
      "effect": {
        "conditionalAttack": {
          "enemyKeyword": "SYNTHETIC",
          "amount": 400
        }
      },
      "tags": [
        "nostromo",
        "crew"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Dennis Parker",
        "prototype": false
      },
      "collectorNo": "NX01-009",
      "index": 60,
      "artSeed": 1682929145,
      "searchText": "dennis parker unit human nx01 r gagne +400 atk si un synthétique ennemi est présent. bonus ou pas, quelqu’un doit maintenir les moteurs. nostromo crew squad",
      "slug": "dennis-parker"
    },
    {
      "id": "H_LAMBERT",
      "name": "Joan Lambert",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "NX01",
      "rarity": "C",
      "cost": 2,
      "attack": 800,
      "health": 1300,
      "keywords": [
        "SQUAD"
      ],
      "text": "À l’arrivée, regardez la première carte du deck : si c’est un lieu, piochez-la.",
      "flavor": "La trajectoire était correcte. Le signal ne l’était pas.",
      "effect": {
        "onPlay": {
          "kind": "DRAW_TYPE",
          "type": "LOCATION",
          "count": 1
        }
      },
      "tags": [
        "nostromo",
        "crew"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Joan Lambert",
        "prototype": false
      },
      "collectorNo": "NX01-010",
      "index": 61,
      "artSeed": 1651151554,
      "searchText": "joan lambert unit human nx01 c à l’arrivée, regardez la première carte du deck : si c’est un lieu, piochez-la. la trajectoire était correcte. le signal ne l’était pas. nostromo crew squad",
      "slug": "joan-lambert"
    },
    {
      "id": "H_ASH",
      "name": "Ash — Officier scientifique",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "NX01",
      "rarity": "SR",
      "cost": 4,
      "attack": 1300,
      "health": 1900,
      "keywords": [
        "SYNTHETIC",
        "UNIQUE"
      ],
      "text": "À l’arrivée, piochez 2 puis défaussez 1.",
      "flavor": "Les priorités de la compagnie ne sont pas celles de l’équipage.",
      "effect": {
        "onPlay": {
          "kind": "DRAW_DISCARD",
          "draw": 2,
          "discard": 1
        }
      },
      "tags": [
        "nostromo",
        "synthetic",
        "weyland-yutani"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Ash — Officier scientifique",
        "prototype": false
      },
      "collectorNo": "NX01-011",
      "index": 62,
      "artSeed": 519909229,
      "searchText": "ash — officier scientifique unit human nx01 sr à l’arrivée, piochez 2 puis défaussez 1. les priorités de la compagnie ne sont pas celles de l’équipage. nostromo synthetic weyland-yutani synthetic unique",
      "slug": "ash-officier-scientifique"
    },
    {
      "id": "H_HICKS",
      "name": "Dwayne Hicks",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "SR",
      "cost": 4,
      "attack": 1800,
      "health": 1900,
      "keywords": [
        "SQUAD",
        "GUARD",
        "UNIQUE"
      ],
      "text": "Les autres Marines gagnent +200 PV.",
      "flavor": "Restez groupés, vérifiez les angles.",
      "effect": {
        "aura": {
          "kind": "TAG_HEALTH",
          "tag": "uscm",
          "amount": 200
        }
      },
      "tags": [
        "uscm",
        "hicks"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Dwayne Hicks",
        "prototype": false
      },
      "collectorNo": "CW02-008",
      "index": 63,
      "artSeed": 517954776,
      "searchText": "dwayne hicks unit human cw02 sr les autres marines gagnent +200 pv. restez groupés, vérifiez les angles. uscm hicks squad guard unique",
      "slug": "dwayne-hicks"
    },
    {
      "id": "H_HUDSON",
      "name": "William Hudson",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "R",
      "cost": 3,
      "attack": 1600,
      "health": 1100,
      "keywords": [
        "SQUAD",
        "RUSH",
        "UNIQUE"
      ],
      "text": "Attaque immédiatement; perd 200 ATK après avoir subi des dégâts.",
      "flavor": "Les plaisanteries cessent lorsque le compteur sature.",
      "effect": {
        "onDamaged": {
          "kind": "DEBUFF_SELF",
          "attack": 200
        }
      },
      "tags": [
        "uscm",
        "hudson"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "William Hudson",
        "prototype": false
      },
      "collectorNo": "CW02-009",
      "index": 64,
      "artSeed": 3823742913,
      "searchText": "william hudson unit human cw02 r attaque immédiatement; perd 200 atk après avoir subi des dégâts. les plaisanteries cessent lorsque le compteur sature. uscm hudson squad rush unique",
      "slug": "william-hudson"
    },
    {
      "id": "H_VASQUEZ",
      "name": "Jenette Vasquez",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "UR",
      "cost": 5,
      "attack": 2400,
      "health": 1700,
      "keywords": [
        "SQUAD",
        "HUNTER",
        "UNIQUE"
      ],
      "text": "Gagne +300 ATK contre les unités avec Garde.",
      "flavor": "Elle préfère les cibles qui pensent être solides.",
      "effect": {},
      "tags": [
        "uscm",
        "vasquez",
        "smartgun"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Jenette Vasquez",
        "prototype": false
      },
      "collectorNo": "CW02-010",
      "index": 65,
      "artSeed": 1750817110,
      "searchText": "jenette vasquez unit human cw02 ur gagne +300 atk contre les unités avec garde. elle préfère les cibles qui pensent être solides. uscm vasquez smartgun squad hunter unique",
      "slug": "jenette-vasquez"
    },
    {
      "id": "H_APONE",
      "name": "Al Apone",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "R",
      "cost": 3,
      "attack": 1400,
      "health": 1700,
      "keywords": [
        "SQUAD",
        "GUARD",
        "UNIQUE"
      ],
      "text": "À l’arrivée, donne +100 ATK / +100 PV aux autres Marines.",
      "flavor": "Un ordre bref suffit à resserrer la ligne de défense.",
      "effect": {
        "onPlay": {
          "kind": "BUFF_TAG",
          "tag": "uscm",
          "attack": 100,
          "health": 100
        }
      },
      "tags": [
        "uscm",
        "apone"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Al Apone",
        "prototype": false
      },
      "collectorNo": "CW02-011",
      "index": 66,
      "artSeed": 370028251,
      "searchText": "al apone unit human cw02 r à l’arrivée, donne +100 atk / +100 pv aux autres marines. un ordre bref suffit à resserrer la ligne de défense. uscm apone squad guard unique",
      "slug": "al-apone"
    },
    {
      "id": "H_BISHOP",
      "name": "Bishop",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "SR",
      "cost": 4,
      "attack": 1000,
      "health": 2300,
      "keywords": [
        "SYNTHETIC",
        "SCAVENGE",
        "UNIQUE"
      ],
      "text": "Récupère le dernier Équipement de votre défausse.",
      "flavor": "Il peut être endommagé sans cesser d’aider.",
      "effect": {},
      "tags": [
        "synthetic",
        "bishop"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Bishop",
        "prototype": false
      },
      "collectorNo": "CW02-012",
      "index": 67,
      "artSeed": 2366059112,
      "searchText": "bishop unit human cw02 sr récupère le dernier équipement de votre défausse. il peut être endommagé sans cesser d’aider. synthetic bishop synthetic scavenge unique",
      "slug": "bishop"
    },
    {
      "id": "H_NEWT",
      "name": "Rebecca “Newt” Jorden",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "SR",
      "cost": 2,
      "attack": 300,
      "health": 1500,
      "keywords": [
        "CLOAK",
        "UNIQUE"
      ],
      "text": "À l’arrivée, piochez 1. Ne peut pas être attaquée tant qu’un Marine est présent.",
      "flavor": "Elle connaît les conduits mieux que la ruche.",
      "effect": {
        "onPlay": {
          "kind": "DRAW",
          "count": 1
        }
      },
      "tags": [
        "survivor",
        "newt"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Rebecca “Newt” Jorden",
        "prototype": false
      },
      "collectorNo": "CW02-013",
      "index": 68,
      "artSeed": 1959155199,
      "searchText": "rebecca “newt” jorden unit human cw02 sr à l’arrivée, piochez 1. ne peut pas être attaquée tant qu’un marine est présent. elle connaît les conduits mieux que la ruche. survivor newt cloak unique",
      "slug": "rebecca-newt-jorden"
    },
    {
      "id": "H_DUTCH",
      "name": "Dutch Schaefer",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "HG03",
      "rarity": "UR",
      "cost": 6,
      "attack": 2700,
      "health": 2500,
      "keywords": [
        "HUNTER",
        "GUARD",
        "UNIQUE"
      ],
      "text": "Gagne +500 ATK contre les Yautja camouflés.",
      "flavor": "La boue change la vision, pas le duel.",
      "effect": {
        "conditionalAttack": {
          "enemyFaction": "YAUTJA",
          "enemyCloaked": true,
          "amount": 500
        }
      },
      "tags": [
        "predator-1987",
        "dutch"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Dutch Schaefer",
        "prototype": false
      },
      "collectorNo": "HG03-018",
      "index": 69,
      "artSeed": 2785113620,
      "searchText": "dutch schaefer unit human hg03 ur gagne +500 atk contre les yautja camouflés. la boue change la vision, pas le duel. predator-1987 dutch hunter guard unique",
      "slug": "dutch-schaefer"
    },
    {
      "id": "H_HARRIGAN",
      "name": "Mike Harrigan",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "HG03",
      "rarity": "SR",
      "cost": 5,
      "attack": 2200,
      "health": 2300,
      "keywords": [
        "HUNTER",
        "UNIQUE"
      ],
      "text": "Après avoir détruit un Yautja, piochez 1.",
      "flavor": "Il poursuit ce que toute logique conseille d’éviter.",
      "effect": {
        "onKill": {
          "kind": "DRAW_IF_FACTION",
          "faction": "YAUTJA",
          "count": 1
        }
      },
      "tags": [
        "predator-2",
        "harrigan"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Mike Harrigan",
        "prototype": false
      },
      "collectorNo": "HG03-019",
      "index": 70,
      "artSeed": 218192820,
      "searchText": "mike harrigan unit human hg03 sr après avoir détruit un yautja, piochez 1. il poursuit ce que toute logique conseille d’éviter. predator-2 harrigan hunter unique",
      "slug": "mike-harrigan"
    },
    {
      "id": "H_NARU",
      "name": "Naru",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "HG03",
      "rarity": "UR",
      "cost": 5,
      "attack": 2100,
      "health": 2200,
      "keywords": [
        "CLOAK",
        "HUNTER",
        "UNIQUE"
      ],
      "text": "Peut cibler une unité camouflée; gagne +400 ATK contre une cible plus forte.",
      "flavor": "Elle étudie le chasseur avant de devenir sa menace.",
      "effect": {
        "conditionalAttack": {
          "strongerEnemy": true,
          "amount": 400
        }
      },
      "tags": [
        "prey",
        "naru"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Naru",
        "prototype": false
      },
      "collectorNo": "HG03-020",
      "index": 71,
      "artSeed": 3543184076,
      "searchText": "naru unit human hg03 ur peut cibler une unité camouflée; gagne +400 atk contre une cible plus forte. elle étudie le chasseur avant de devenir sa menace. prey naru cloak hunter unique",
      "slug": "naru"
    },
    {
      "id": "H_ROYCE",
      "name": "Royce",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "HG03",
      "rarity": "SR",
      "cost": 4,
      "attack": 2000,
      "health": 1800,
      "keywords": [
        "HUNTER",
        "SQUAD",
        "UNIQUE"
      ],
      "text": "À l’arrivée, révèle la première carte adverse; si c’est une unité, gagne +300 ATK ce tour.",
      "flavor": "Une équipe de tueurs sur une planète de chasse.",
      "effect": {
        "onPlay": {
          "kind": "TEMP_BUFF_SELF",
          "attack": 300
        }
      },
      "tags": [
        "predators",
        "royce"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Royce",
        "prototype": false
      },
      "collectorNo": "HG03-021",
      "index": 72,
      "artSeed": 1053158218,
      "searchText": "royce unit human hg03 sr à l’arrivée, révèle la première carte adverse; si c’est une unité, gagne +300 atk ce tour. une équipe de tueurs sur une planète de chasse. predators royce hunter squad unique",
      "slug": "royce"
    },
    {
      "id": "H_ALEXA",
      "name": "Alexa Woods",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "AV04",
      "rarity": "UR",
      "cost": 5,
      "attack": 1900,
      "health": 2500,
      "keywords": [
        "GUARD",
        "HUNTER",
        "UNIQUE"
      ],
      "text": "Peut recevoir des Équipements Yautja; gagne +300 ATK avec Scar en jeu.",
      "flavor": "Blooded par nécessité, alliée par respect.",
      "effect": {
        "conditionalAttack": {
          "allyId": "Y_SCAR",
          "amount": 300
        }
      },
      "tags": [
        "avp",
        "alexa"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Alexa Woods",
        "prototype": false
      },
      "collectorNo": "AV04-010",
      "index": 73,
      "artSeed": 313525593,
      "searchText": "alexa woods unit human av04 ur peut recevoir des équipements yautja; gagne +300 atk avec scar en jeu. blooded par nécessité, alliée par respect. avp alexa guard hunter unique",
      "slug": "alexa-woods"
    },
    {
      "id": "H_MACHIKO",
      "name": "Machiko Noguchi",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "AV04",
      "rarity": "SCR",
      "cost": 6,
      "attack": 2400,
      "health": 2500,
      "keywords": [
        "TROPHY",
        "HUNTER",
        "UNIQUE"
      ],
      "text": "Compte comme Humaine et Yautja pour les synergies.",
      "flavor": "Une proie devenue chasseuse sans cesser d’être humaine.",
      "effect": {
        "dualFaction": [
          "HUMAN",
          "YAUTJA"
        ]
      },
      "tags": [
        "avp",
        "machiko"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Machiko Noguchi",
        "prototype": false
      },
      "collectorNo": "AV04-011",
      "index": 74,
      "artSeed": 2016847022,
      "searchText": "machiko noguchi unit human av04 scr compte comme humaine et yautja pour les synergies. une proie devenue chasseuse sans cesser d’être humaine. avp machiko trophy hunter unique",
      "slug": "machiko-noguchi"
    },
    {
      "id": "H_COMBAT_SYNTH",
      "name": "Synthétique de combat",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "C",
      "cost": 3,
      "attack": 1300,
      "health": 1800,
      "keywords": [
        "SYNTHETIC",
        "GUARD"
      ],
      "text": "Immunisé au Pathogène et à l’Infestation.",
      "flavor": "La peur n’est pas installée.",
      "effect": {},
      "tags": [
        "synthetic",
        "combat"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Synthétique de combat",
        "prototype": false
      },
      "collectorNo": "CW02-014",
      "index": 75,
      "artSeed": 1937232339,
      "searchText": "synthétique de combat unit human cw02 c immunisé au pathogène et à l’infestation. la peur n’est pas installée. synthetic combat synthetic guard",
      "slug": "synth-tique-de-combat"
    },
    {
      "id": "H_WORKING_JOE",
      "name": "Working Joe",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "NX01",
      "rarity": "C",
      "cost": 2,
      "attack": 900,
      "health": 1500,
      "keywords": [
        "SYNTHETIC",
        "GUARD"
      ],
      "text": "À sa destruction, gagnez 1 énergie au prochain tour.",
      "flavor": "Sa voix reste calme tandis que les issues se verrouillent.",
      "effect": {
        "onDeath": {
          "kind": "NEXT_ENERGY",
          "amount": 1
        }
      },
      "tags": [
        "sevastopol",
        "synthetic"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Working Joe",
        "prototype": false
      },
      "collectorNo": "NX01-012",
      "index": 76,
      "artSeed": 3937172106,
      "searchText": "working joe unit human nx01 c à sa destruction, gagnez 1 énergie au prochain tour. sa voix reste calme tandis que les issues se verrouillent. sevastopol synthetic synthetic guard",
      "slug": "working-joe"
    },
    {
      "id": "H_WEYLAND_OP",
      "name": "Agent Weyland-Yutani",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "NX01",
      "rarity": "R",
      "cost": 3,
      "attack": 1100,
      "health": 1400,
      "keywords": [
        "SQUAD"
      ],
      "text": "À l’arrivée, cherchez un Équipement.",
      "flavor": "Le bilan de mission ne comporte aucune colonne pour les survivants.",
      "effect": {
        "onPlay": {
          "kind": "DRAW_TYPE",
          "type": "EQUIPMENT",
          "count": 1
        }
      },
      "tags": [
        "weyland-yutani",
        "operative"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Agent Weyland-Yutani",
        "prototype": false
      },
      "collectorNo": "NX01-013",
      "index": 77,
      "artSeed": 1158345722,
      "searchText": "agent weyland-yutani unit human nx01 r à l’arrivée, cherchez un équipement. le bilan de mission ne comporte aucune colonne pour les survivants. weyland-yutani operative squad",
      "slug": "agent-weyland-yutani"
    },
    {
      "id": "H_POWERLOADER_RIPLEY",
      "name": "Ripley — Power Loader",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "SCR",
      "cost": 7,
      "attack": 3100,
      "health": 3300,
      "keywords": [
        "GUARD",
        "ARMOR",
        "UNIQUE"
      ],
      "text": "Inflige +500 dégâts aux Reines.",
      "flavor": "La dernière barrière possède deux pinces et une volonté intacte.",
      "effect": {
        "conditionalAttack": {
          "enemyTag": "queen",
          "amount": 500
        }
      },
      "tags": [
        "ripley",
        "power-loader"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Ripley — Power Loader",
        "prototype": false
      },
      "collectorNo": "CW02-015",
      "index": 78,
      "artSeed": 598499679,
      "searchText": "ripley — power loader unit human cw02 scr inflige +500 dégâts aux reines. la dernière barrière possède deux pinces et une volonté intacte. ripley power-loader guard armor unique",
      "slug": "ripley-power-loader"
    },
    {
      "id": "E_ENGINEER",
      "name": "Engineer — Dernier pilote",
      "type": "UNIT",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "UR",
      "cost": 6,
      "attack": 2600,
      "health": 3100,
      "keywords": [
        "ARMOR",
        "PATHOGEN",
        "UNIQUE"
      ],
      "text": "À l’arrivée, applique Mutation à toutes les unités ennemies.",
      "flavor": "Le créateur revient devant sa création.",
      "effect": {
        "onPlay": {
          "kind": "DEBUFF_ALL",
          "attack": 200,
          "faction": "ENEMY"
        }
      },
      "tags": [
        "engineer",
        "pilot"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "08_Races",
        "entry": "Engineer — Dernier pilote",
        "prototype": false
      },
      "collectorNo": "EV05-017",
      "index": 79,
      "artSeed": 514045870,
      "searchText": "engineer — dernier pilote unit engineer ev05 ur à l’arrivée, applique mutation à toutes les unités ennemies. le créateur revient devant sa création. engineer pilot armor pathogen unique",
      "slug": "engineer-dernier-pilote"
    },
    {
      "id": "E_SPACE_JOCKEY",
      "name": "Space Jockey",
      "type": "UNIT",
      "faction": "ENGINEER",
      "set": "NX01",
      "rarity": "SCR",
      "cost": 8,
      "attack": 3200,
      "health": 4000,
      "keywords": [
        "GUARD",
        "ARMOR",
        "UNIQUE"
      ],
      "text": "Votre lieu ne peut pas être remplacé par l’adversaire.",
      "flavor": "Une silhouette fossilisée devant un avertissement encore actif.",
      "effect": {
        "aura": {
          "kind": "LOCK_LOCATION"
        }
      },
      "tags": [
        "derelict",
        "space-jockey"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "08_Races",
        "entry": "Space Jockey",
        "prototype": false
      },
      "collectorNo": "NX01-014",
      "index": 80,
      "artSeed": 1224279234,
      "searchText": "space jockey unit engineer nx01 scr votre lieu ne peut pas être remplacé par l’adversaire. une silhouette fossilisée devant un avertissement encore actif. derelict space-jockey guard armor unique",
      "slug": "space-jockey"
    },
    {
      "id": "E_DAVID",
      "name": "David 8 — Créateur",
      "type": "UNIT",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "SCR",
      "cost": 6,
      "attack": 1800,
      "health": 2800,
      "keywords": [
        "SYNTHETIC",
        "UNIQUE"
      ],
      "text": "À l’arrivée, crée un Xénomorphe aléatoire de coût 3 ou moins dans votre main.",
      "flavor": "La création est un acte de volonté, pas d’amour.",
      "effect": {
        "onPlay": {
          "kind": "CREATE_RANDOM",
          "faction": "XENO",
          "maxCost": 3,
          "count": 1
        }
      },
      "tags": [
        "david",
        "synthetic",
        "covenant"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "David 8 — Créateur",
        "prototype": false
      },
      "collectorNo": "EV05-018",
      "index": 81,
      "artSeed": 2045480995,
      "searchText": "david 8 — créateur unit engineer ev05 scr à l’arrivée, crée un xénomorphe aléatoire de coût 3 ou moins dans votre main. la création est un acte de volonté, pas d’amour. david synthetic covenant synthetic unique",
      "slug": "david-8-cr-ateur"
    },
    {
      "id": "E_WALTER",
      "name": "Walter",
      "type": "UNIT",
      "faction": "HUMAN",
      "set": "EV05",
      "rarity": "SR",
      "cost": 4,
      "attack": 1400,
      "health": 2300,
      "keywords": [
        "SYNTHETIC",
        "GUARD",
        "UNIQUE"
      ],
      "text": "Annule la première Tactique adverse qui vous cible.",
      "flavor": "Conçu pour servir sans ambition créatrice.",
      "effect": {
        "shieldTactic": 1
      },
      "tags": [
        "walter",
        "synthetic"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Walter",
        "prototype": false
      },
      "collectorNo": "EV05-019",
      "index": 82,
      "artSeed": 1500081411,
      "searchText": "walter unit human ev05 sr annule la première tactique adverse qui vous cible. conçu pour servir sans ambition créatrice. walter synthetic synthetic guard unique",
      "slug": "walter"
    },
    {
      "id": "E_TRILOBITE",
      "name": "Trilobite",
      "type": "UNIT",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "SR",
      "cost": 5,
      "attack": 2200,
      "health": 2600,
      "keywords": [
        "AMBUSH",
        "PATHOGEN"
      ],
      "text": "À l’arrivée, étourdit l’unité opposée.",
      "flavor": "Un facehugger redessiné à une échelle monstrueuse.",
      "effect": {
        "onPlay": {
          "kind": "STUN_OPPOSING",
          "turns": 1
        }
      },
      "tags": [
        "prometheus",
        "trilobite"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Trilobite",
        "prototype": false
      },
      "collectorNo": "EV05-020",
      "index": 83,
      "artSeed": 1356487669,
      "searchText": "trilobite unit engineer ev05 sr à l’arrivée, étourdit l’unité opposée. un facehugger redessiné à une échelle monstrueuse. prometheus trilobite ambush pathogen",
      "slug": "trilobite"
    },
    {
      "id": "E_HAMMERPEDE",
      "name": "Hammerpede",
      "type": "UNIT",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "R",
      "cost": 2,
      "attack": 1000,
      "health": 800,
      "keywords": [
        "RUSH",
        "PATHOGEN"
      ],
      "text": "À sa destruction, revient en main une fois.",
      "flavor": "La coupe ne suffit pas toujours.",
      "effect": {
        "reborn": 1
      },
      "tags": [
        "prometheus",
        "fauna"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "15_Faune",
        "entry": "Hammerpede",
        "prototype": false
      },
      "collectorNo": "EV05-021",
      "index": 84,
      "artSeed": 515235035,
      "searchText": "hammerpede unit engineer ev05 r à sa destruction, revient en main une fois. la coupe ne suffit pas toujours. prometheus fauna rush pathogen",
      "slug": "hammerpede"
    },
    {
      "id": "E_BLACK_GOO_MUTANT",
      "name": "Mutant au Pathogène",
      "type": "UNIT",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "C",
      "cost": 3,
      "attack": 1500,
      "health": 1600,
      "keywords": [
        "PATHOGEN"
      ],
      "text": "Quand il attaque, réduit l’ATK de la cible.",
      "flavor": "Une biologie humaine devenue consigne agressive.",
      "effect": {},
      "tags": [
        "pathogen",
        "mutant"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Mutant au Pathogène",
        "prototype": false
      },
      "collectorNo": "EV05-022",
      "index": 85,
      "artSeed": 773871012,
      "searchText": "mutant au pathogène unit engineer ev05 c quand il attaque, réduit l’atk de la cible. une biologie humaine devenue consigne agressive. pathogen mutant pathogen",
      "slug": "mutant-au-pathog-ne"
    },
    {
      "id": "H_PREDALIEN",
      "name": "Predalien",
      "type": "UNIT",
      "faction": "HYBRID",
      "set": "AV04",
      "rarity": "SCR",
      "cost": 7,
      "attack": 3200,
      "health": 3200,
      "keywords": [
        "ACID",
        "BROOD",
        "HUNTER",
        "UNIQUE"
      ],
      "text": "Compte comme Xénomorphe et Yautja; invoque un Chestburster.",
      "flavor": "La chasse et la ruche dans le même organisme.",
      "effect": {
        "dualFaction": [
          "XENO",
          "YAUTJA"
        ],
        "onPlay": {
          "kind": "SUMMON_MULTI",
          "card": "X_CHESTBURSTER",
          "count": 1
        }
      },
      "tags": [
        "predalien",
        "avpr"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Predalien",
        "prototype": false
      },
      "collectorNo": "AV04-012",
      "index": 86,
      "artSeed": 355923203,
      "searchText": "predalien unit hybrid av04 scr compte comme xénomorphe et yautja; invoque un chestburster. la chasse et la ruche dans le même organisme. predalien avpr acid brood hunter unique",
      "slug": "predalien"
    },
    {
      "id": "H_NEWBORN",
      "name": "Newborn",
      "type": "UNIT",
      "faction": "HYBRID",
      "set": "EV05",
      "rarity": "UR",
      "cost": 6,
      "attack": 2800,
      "health": 3000,
      "keywords": [
        "HUNTER",
        "REGEN",
        "UNIQUE"
      ],
      "text": "Gagne +400 ATK contre les Xénomorphes.",
      "flavor": "Une filiation que la ruche refuse.",
      "effect": {
        "conditionalAttack": {
          "enemyFaction": "XENO",
          "amount": 400
        }
      },
      "tags": [
        "resurrection",
        "newborn"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "Newborn",
        "prototype": false
      },
      "collectorNo": "EV05-023",
      "index": 87,
      "artSeed": 3313264538,
      "searchText": "newborn unit hybrid ev05 ur gagne +400 atk contre les xénomorphes. une filiation que la ruche refuse. resurrection newborn hunter regen unique",
      "slug": "newborn"
    },
    {
      "id": "H_RIPLEY8",
      "name": "Ripley 8",
      "type": "UNIT",
      "faction": "HYBRID",
      "set": "EV05",
      "rarity": "UR",
      "cost": 5,
      "attack": 2200,
      "health": 2700,
      "keywords": [
        "REGEN",
        "HUNTER",
        "UNIQUE"
      ],
      "text": "Compte comme Humaine et Xénomorphe.",
      "flavor": "Mémoire humaine, sang acide, instinct partagé.",
      "effect": {
        "dualFaction": [
          "HUMAN",
          "XENO"
        ]
      },
      "tags": [
        "resurrection",
        "ripley-8"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "10_Humains_detail",
        "entry": "Ripley 8",
        "prototype": false
      },
      "collectorNo": "EV05-024",
      "index": 88,
      "artSeed": 2164773547,
      "searchText": "ripley 8 unit hybrid ev05 ur compte comme humaine et xénomorphe. mémoire humaine, sang acide, instinct partagé. resurrection ripley-8 regen hunter unique",
      "slug": "ripley-8"
    },
    {
      "id": "H_WHITE_HYBRID",
      "name": "White Hybrid",
      "type": "UNIT",
      "faction": "HYBRID",
      "set": "EV05",
      "rarity": "SR",
      "cost": 5,
      "attack": 2400,
      "health": 2500,
      "keywords": [
        "PATHOGEN",
        "ACID"
      ],
      "text": "Ses dégâts appliquent Mutation.",
      "flavor": "La perfection n’a pas une seule couleur.",
      "effect": {},
      "tags": [
        "hybrid",
        "white"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "White Hybrid",
        "prototype": false
      },
      "collectorNo": "EV05-025",
      "index": 89,
      "artSeed": 3308590344,
      "searchText": "white hybrid unit hybrid ev05 sr ses dégâts appliquent mutation. la perfection n’a pas une seule couleur. hybrid white pathogen acid",
      "slug": "white-hybrid"
    },
    {
      "id": "H_ALIEN_KING",
      "name": "King Alien",
      "type": "UNIT",
      "faction": "HYBRID",
      "set": "EV05",
      "rarity": "PR",
      "cost": 8,
      "attack": 3500,
      "health": 3900,
      "keywords": [
        "GUARD",
        "ARMOR",
        "UNIQUE"
      ],
      "text": "Les Xénomorphes alliés gagnent +300 ATK; ne peut pas être invoqué avec une Reine alliée.",
      "flavor": "Un concept de royauté non uniforme, matérialisé en duel.",
      "effect": {
        "aura": {
          "kind": "FACTION_ATTACK",
          "faction": "XENO",
          "amount": 300
        },
        "exclusiveTag": "queen"
      },
      "tags": [
        "king",
        "legacy"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "07_Castes",
        "entry": "King Alien",
        "prototype": false
      },
      "collectorNo": "EV05-026",
      "index": 90,
      "artSeed": 432052857,
      "searchText": "king alien unit hybrid ev05 pr les xénomorphes alliés gagnent +300 atk; ne peut pas être invoqué avec une reine alliée. un concept de royauté non uniforme, matérialisé en duel. king legacy guard armor unique",
      "slug": "king-alien"
    },
    {
      "id": "T_X_ACID_BLOOD",
      "name": "Sang acide",
      "type": "TACTIC",
      "faction": "XENO",
      "set": "NX01",
      "rarity": "R",
      "cost": 2,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Inflige 700 dégâts à une unité. Si elle a attaqué ce tour, infligez 200 de plus.",
      "flavor": "Même la victoire brûle.",
      "effect": {
        "kind": "DAMAGE_TARGET",
        "amount": 700,
        "target": "ENEMY_UNIT"
      },
      "tags": [
        "acid"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Sang acide",
        "prototype": false
      },
      "collectorNo": "NX01-015",
      "index": 91,
      "artSeed": 2899731978,
      "searchText": "sang acide tactic xeno nx01 r inflige 700 dégâts à une unité. si elle a attaqué ce tour, infligez 200 de plus. même la victoire brûle. acid",
      "slug": "sang-acide"
    },
    {
      "id": "T_X_VENT_AMBUSH",
      "name": "Embuscade dans les conduits",
      "type": "TACTIC",
      "faction": "XENO",
      "set": "NX01",
      "rarity": "C",
      "cost": 1,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Une unité gagne +300 ATK et Ruée ce tour.",
      "flavor": "Les plans du vaisseau ne montrent pas tout.",
      "effect": {
        "kind": "BUFF_AND_RUSH",
        "attack": 300,
        "target": "FRIENDLY_UNIT"
      },
      "tags": [
        "vents",
        "ambush"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Embuscade dans les conduits",
        "prototype": false
      },
      "collectorNo": "NX01-016",
      "index": 92,
      "artSeed": 1717508943,
      "searchText": "embuscade dans les conduits tactic xeno nx01 c une unité gagne +300 atk et ruée ce tour. les plans du vaisseau ne montrent pas tout. vents ambush",
      "slug": "embuscade-dans-les-conduits"
    },
    {
      "id": "T_X_RESIN",
      "name": "Résine de Ruche",
      "type": "TACTIC",
      "faction": "XENO",
      "set": "CW02",
      "rarity": "R",
      "cost": 2,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Une unité gagne +800 PV et Garde.",
      "flavor": "Chaque couloir devient une paroi organique.",
      "effect": {
        "kind": "BUFF_TARGET",
        "attack": 0,
        "health": 800,
        "grant": [
          "GUARD"
        ],
        "target": "FRIENDLY_UNIT"
      },
      "tags": [
        "hive",
        "resin"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Résine de Ruche",
        "prototype": false
      },
      "collectorNo": "CW02-016",
      "index": 93,
      "artSeed": 2081591369,
      "searchText": "résine de ruche tactic xeno cw02 r une unité gagne +800 pv et garde. chaque couloir devient une paroi organique. hive resin",
      "slug": "r-sine-de-ruche"
    },
    {
      "id": "T_X_SWARM",
      "name": "Déferlement de la Couvée",
      "type": "TACTIC",
      "faction": "XENO",
      "set": "CW02",
      "rarity": "SR",
      "cost": 4,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Invoquez jusqu’à deux Facehuggers dans les voies libres.",
      "flavor": "Le détecteur ne compte plus des individus.",
      "effect": {
        "kind": "SUMMON_MULTI",
        "card": "X_FACEHUGGER",
        "count": 2
      },
      "tags": [
        "brood",
        "swarm"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Déferlement de la Couvée",
        "prototype": false
      },
      "collectorNo": "CW02-017",
      "index": 94,
      "artSeed": 1659393243,
      "searchText": "déferlement de la couvée tactic xeno cw02 sr invoquez jusqu’à deux facehuggers dans les voies libres. le détecteur ne compte plus des individus. brood swarm",
      "slug": "d-ferlement-de-la-couv-e"
    },
    {
      "id": "T_X_EGGMORPH",
      "name": "Eggmorphing",
      "type": "TACTIC",
      "faction": "XENO",
      "set": "NX01",
      "rarity": "SR",
      "cost": 3,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Transforme une unité ennemie endommagée en Ovomorphe sous votre contrôle.",
      "flavor": "Une alternative coupée devient une règle de carte.",
      "effect": {
        "kind": "TRANSFORM_DAMAGED",
        "card": "X_OVOMORPH",
        "target": "ENEMY_UNIT"
      },
      "tags": [
        "egg",
        "cut-concept"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "Scènes supprimées / alternatives",
        "entry": "Eggmorphing",
        "prototype": false
      },
      "collectorNo": "NX01-017",
      "index": 95,
      "artSeed": 3403923117,
      "searchText": "eggmorphing tactic xeno nx01 sr transforme une unité ennemie endommagée en ovomorphe sous votre contrôle. une alternative coupée devient une règle de carte. egg cut-concept",
      "slug": "eggmorphing"
    },
    {
      "id": "T_X_ROYAL_JELLY",
      "name": "Gelée royale",
      "type": "TACTIC",
      "faction": "XENO",
      "set": "EV05",
      "rarity": "UR",
      "cost": 5,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Un Xénomorphe gagne +800/+800 et Régénération.",
      "flavor": "La ruche choisit parfois son prochain rempart.",
      "effect": {
        "kind": "UPGRADE_XENO",
        "attack": 800,
        "health": 800,
        "grant": [
          "REGEN"
        ],
        "target": "FRIENDLY_UNIT"
      },
      "tags": [
        "royal",
        "evolution"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Gelée royale",
        "prototype": false
      },
      "collectorNo": "EV05-027",
      "index": 96,
      "artSeed": 302988040,
      "searchText": "gelée royale tactic xeno ev05 ur un xénomorphe gagne +800/+800 et régénération. la ruche choisit parfois son prochain rempart. royal evolution",
      "slug": "gel-e-royale"
    },
    {
      "id": "T_X_CUT_POWER",
      "name": "Couper l’alimentation",
      "type": "TACTIC",
      "faction": "XENO",
      "set": "NX01",
      "rarity": "R",
      "cost": 2,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Toutes les unités ennemies endommagées sont étourdies un tour.",
      "flavor": "Dans le noir, l’avantage change de camp.",
      "effect": {
        "kind": "STUN_ALL_DAMAGED"
      },
      "tags": [
        "power",
        "darkness"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Couper l’alimentation",
        "prototype": false
      },
      "collectorNo": "NX01-018",
      "index": 97,
      "artSeed": 4080000560,
      "searchText": "couper l’alimentation tactic xeno nx01 r toutes les unités ennemies endommagées sont étourdies un tour. dans le noir, l’avantage change de camp. power darkness",
      "slug": "couper-l-alimentation"
    },
    {
      "id": "T_X_PERFECT",
      "name": "Organisme parfait",
      "type": "TACTIC",
      "faction": "XENO",
      "set": "EV05",
      "rarity": "SCR",
      "cost": 6,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Réanime le Xénomorphe de plus grande rareté de votre défausse avec 1 PV.",
      "flavor": "Sa perfection réside aussi dans son retour.",
      "effect": {
        "kind": "REVIVE_STRONGEST",
        "faction": "XENO"
      },
      "tags": [
        "revive",
        "perfect"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Organisme parfait",
        "prototype": false
      },
      "collectorNo": "EV05-028",
      "index": 98,
      "artSeed": 990792201,
      "searchText": "organisme parfait tactic xeno ev05 scr réanime le xénomorphe de plus grande rareté de votre défausse avec 1 pv. sa perfection réside aussi dans son retour. revive perfect",
      "slug": "organisme-parfait"
    },
    {
      "id": "T_Y_HUNT_CODE",
      "name": "Code de la chasse",
      "type": "TACTIC",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "C",
      "cost": 1,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Vos unités avec Trophée gagnent +200 ATK ce tour.",
      "flavor": "Une règle n’empêche pas la violence; elle lui donne un sens.",
      "effect": {
        "kind": "BUFF_TAG",
        "tag": "TROPHY",
        "attack": 200,
        "health": 0,
        "temporary": true
      },
      "tags": [
        "code",
        "honor"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "03_Index_global",
        "entry": "Code de la chasse",
        "prototype": false
      },
      "collectorNo": "HG03-022",
      "index": 99,
      "artSeed": 3993674764,
      "searchText": "code de la chasse tactic yautja hg03 c vos unités avec trophée gagnent +200 atk ce tour. une règle n’empêche pas la violence; elle lui donne un sens. code honor",
      "slug": "code-de-la-chasse"
    },
    {
      "id": "T_Y_CLAIM_TROPHY",
      "name": "Réclamer le trophée",
      "type": "TACTIC",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "R",
      "cost": 2,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Détruit une unité ennemie ayant 700 PV ou moins; gagnez 1 Trophée.",
      "flavor": "Le crâne est la preuve finale.",
      "effect": {
        "kind": "EXECUTE",
        "threshold": 700,
        "target": "ENEMY_UNIT"
      },
      "tags": [
        "trophy",
        "execute"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "03_Index_global",
        "entry": "Réclamer le trophée",
        "prototype": false
      },
      "collectorNo": "HG03-023",
      "index": 100,
      "artSeed": 1401263609,
      "searchText": "réclamer le trophée tactic yautja hg03 r détruit une unité ennemie ayant 700 pv ou moins; gagnez 1 trophée. le crâne est la preuve finale. trophy execute",
      "slug": "r-clamer-le-troph-e"
    },
    {
      "id": "T_Y_THERMAL",
      "name": "Vision thermique",
      "type": "TACTIC",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "C",
      "cost": 1,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Retire Camouflage à toutes les unités ennemies; une unité alliée gagne +300 ATK.",
      "flavor": "La chaleur dessine ce que l’œil ignore.",
      "effect": {
        "kind": "REVEAL_AND_BUFF",
        "attack": 300,
        "target": "FRIENDLY_UNIT"
      },
      "tags": [
        "vision",
        "mask"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "03_Index_global",
        "entry": "Vision thermique",
        "prototype": false
      },
      "collectorNo": "HG03-024",
      "index": 101,
      "artSeed": 1765346035,
      "searchText": "vision thermique tactic yautja hg03 c retire camouflage à toutes les unités ennemies; une unité alliée gagne +300 atk. la chaleur dessine ce que l’œil ignore. vision mask",
      "slug": "vision-thermique"
    },
    {
      "id": "T_Y_CLOAK",
      "name": "Cycle de camouflage",
      "type": "TACTIC",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "R",
      "cost": 2,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Une unité alliée gagne Camouflage.",
      "flavor": "La lumière se replie autour du chasseur.",
      "effect": {
        "kind": "GRANT",
        "grant": [
          "CLOAK"
        ],
        "target": "FRIENDLY_UNIT"
      },
      "tags": [
        "cloak",
        "technology"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "03_Index_global",
        "entry": "Cycle de camouflage",
        "prototype": false
      },
      "collectorNo": "HG03-025",
      "index": 102,
      "artSeed": 1707654212,
      "searchText": "cycle de camouflage tactic yautja hg03 r une unité alliée gagne camouflage. la lumière se replie autour du chasseur. cloak technology",
      "slug": "cycle-de-camouflage"
    },
    {
      "id": "T_Y_SELF_DESTRUCT",
      "name": "Autodestruction du poignet",
      "type": "TACTIC",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "UR",
      "cost": 5,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Inflige 1800 dégâts aux deux commandants et 600 à toutes les unités.",
      "flavor": "Un rire avant la lumière blanche.",
      "effect": {
        "kind": "DAMAGE_ALL_HEROES",
        "amount": 1800
      },
      "tags": [
        "self-destruct",
        "wrist"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "03_Index_global",
        "entry": "Autodestruction du poignet",
        "prototype": false
      },
      "collectorNo": "HG03-026",
      "index": 103,
      "artSeed": 1111697795,
      "searchText": "autodestruction du poignet tactic yautja hg03 ur inflige 1800 dégâts aux deux commandants et 600 à toutes les unités. un rire avant la lumière blanche. self-destruct wrist",
      "slug": "autodestruction-du-poignet"
    },
    {
      "id": "T_Y_BLOODING",
      "name": "Rituel du Blooding",
      "type": "TACTIC",
      "faction": "YAUTJA",
      "set": "AV04",
      "rarity": "SR",
      "cost": 3,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Une unité gagne +600/+600 et Trophée si elle a détruit une unité ce duel.",
      "flavor": "La marque acide ne se donne pas. Elle se mérite.",
      "effect": {
        "kind": "BUFF_IF_KILL",
        "attack": 600,
        "health": 600,
        "grant": [
          "TROPHY"
        ],
        "target": "FRIENDLY_UNIT"
      },
      "tags": [
        "ritual",
        "blooding"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "03_Index_global",
        "entry": "Rituel du Blooding",
        "prototype": false
      },
      "collectorNo": "AV04-013",
      "index": 104,
      "artSeed": 2551285176,
      "searchText": "rituel du blooding tactic yautja av04 sr une unité gagne +600/+600 et trophée si elle a détruit une unité ce duel. la marque acide ne se donne pas. elle se mérite. ritual blooding",
      "slug": "rituel-du-blooding"
    },
    {
      "id": "T_Y_NET_TRAP",
      "name": "Piège au filet",
      "type": "TACTIC",
      "faction": "YAUTJA",
      "set": "AV04",
      "rarity": "R",
      "cost": 2,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Inflige 300 dégâts et étourdit une unité.",
      "flavor": "Le métal se resserre jusque dans la pierre.",
      "effect": {
        "kind": "STUN_TARGET",
        "turns": 1,
        "damage": 300,
        "target": "ENEMY_UNIT"
      },
      "tags": [
        "net",
        "trap"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "03_Index_global",
        "entry": "Piège au filet",
        "prototype": false
      },
      "collectorNo": "AV04-014",
      "index": 105,
      "artSeed": 1919559796,
      "searchText": "piège au filet tactic yautja av04 r inflige 300 dégâts et étourdit une unité. le métal se resserre jusque dans la pierre. net trap",
      "slug": "pi-ge-au-filet"
    },
    {
      "id": "T_Y_CHALLENGE",
      "name": "Rugissement de défi",
      "type": "TACTIC",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "SR",
      "cost": 3,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Une unité gagne +400 ATK et Garde jusqu’à votre prochain tour.",
      "flavor": "Le duel commence lorsque la proie répond.",
      "effect": {
        "kind": "FORCE_DUEL",
        "attack": 400,
        "target": "FRIENDLY_UNIT"
      },
      "tags": [
        "challenge",
        "duel"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "03_Index_global",
        "entry": "Rugissement de défi",
        "prototype": false
      },
      "collectorNo": "HG03-027",
      "index": 106,
      "artSeed": 2597591692,
      "searchText": "rugissement de défi tactic yautja hg03 sr une unité gagne +400 atk et garde jusqu’à votre prochain tour. le duel commence lorsque la proie répond. challenge duel",
      "slug": "rugissement-de-d-fi"
    },
    {
      "id": "T_H_MOTION",
      "name": "Ping du détecteur de mouvement",
      "type": "TACTIC",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "C",
      "cost": 1,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Piochez 1. Retire Camouflage aux unités ennemies de coût 3 ou moins.",
      "flavor": "Quelque chose bouge. Partout.",
      "effect": {
        "kind": "MOTION_SCAN",
        "count": 1,
        "maxCost": 3
      },
      "tags": [
        "motion-tracker",
        "sensor"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Ping du détecteur de mouvement",
        "prototype": false
      },
      "collectorNo": "CW02-018",
      "index": 107,
      "artSeed": 1740620968,
      "searchText": "ping du détecteur de mouvement tactic human cw02 c piochez 1. retire camouflage aux unités ennemies de coût 3 ou moins. quelque chose bouge. partout. motion-tracker sensor",
      "slug": "ping-du-d-tecteur-de-mouvement"
    },
    {
      "id": "T_H_SEAL_DOOR",
      "name": "Souder la porte",
      "type": "TACTIC",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "C",
      "cost": 1,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Une unité gagne +600 PV et Garde.",
      "flavor": "Quelques secondes de plus peuvent suffire.",
      "effect": {
        "kind": "BUFF_TARGET",
        "attack": 0,
        "health": 600,
        "grant": [
          "GUARD"
        ],
        "target": "FRIENDLY_UNIT"
      },
      "tags": [
        "door",
        "defense"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Souder la porte",
        "prototype": false
      },
      "collectorNo": "CW02-019",
      "index": 108,
      "artSeed": 2078871628,
      "searchText": "souder la porte tactic human cw02 c une unité gagne +600 pv et garde. quelques secondes de plus peuvent suffire. door defense",
      "slug": "souder-la-porte"
    },
    {
      "id": "T_H_FIRETEAM",
      "name": "Formation Fireteam",
      "type": "TACTIC",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "R",
      "cost": 2,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Vos Humains gagnent +200/+200.",
      "flavor": "Angles croisés, canaux ouverts.",
      "effect": {
        "kind": "BUFF_ALL",
        "faction": "HUMAN",
        "attack": 200,
        "health": 200
      },
      "tags": [
        "uscm",
        "squad"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Formation Fireteam",
        "prototype": false
      },
      "collectorNo": "CW02-020",
      "index": 109,
      "artSeed": 1037098717,
      "searchText": "formation fireteam tactic human cw02 r vos humains gagnent +200/+200. angles croisés, canaux ouverts. uscm squad",
      "slug": "formation-fireteam"
    },
    {
      "id": "T_H_FLAMER",
      "name": "Rafale de lance-flammes",
      "type": "TACTIC",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "R",
      "cost": 2,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Inflige 700 dégâts; 300 supplémentaires à un Ovomorphe ou Facehugger.",
      "flavor": "Le feu ne négocie pas avec une ruche.",
      "effect": {
        "kind": "DAMAGE_LANE",
        "amount": 700,
        "target": "ENEMY_UNIT"
      },
      "tags": [
        "flamer",
        "fire"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Rafale de lance-flammes",
        "prototype": false
      },
      "collectorNo": "CW02-021",
      "index": 110,
      "artSeed": 1401605020,
      "searchText": "rafale de lance-flammes tactic human cw02 r inflige 700 dégâts; 300 supplémentaires à un ovomorphe ou facehugger. le feu ne négocie pas avec une ruche. flamer fire",
      "slug": "rafale-de-lance-flammes"
    },
    {
      "id": "T_H_NUKE",
      "name": "Détruire le site depuis l’orbite",
      "type": "TACTIC",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "SCR",
      "cost": 7,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Inflige 1500 dégâts à toutes les unités. Chaque joueur défausse son lieu.",
      "flavor": "Le signal de frappe remplace les dernières coordonnées au sol.",
      "effect": {
        "kind": "DAMAGE_ALL",
        "amount": 1500,
        "discardLocations": true
      },
      "tags": [
        "orbital",
        "nuke"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Détruire le site depuis l’orbite",
        "prototype": false
      },
      "collectorNo": "CW02-022",
      "index": 111,
      "artSeed": 2331137903,
      "searchText": "détruire le site depuis l’orbite tactic human cw02 scr inflige 1500 dégâts à toutes les unités. chaque joueur défausse son lieu. le signal de frappe remplace les dernières coordonnées au sol. orbital nuke",
      "slug": "d-truire-le-site-depuis-l-orbite"
    },
    {
      "id": "T_H_FROSTY",
      "name": "Restez sur vos gardes",
      "type": "TACTIC",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "R",
      "cost": 2,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Vos unités gagnent Armure jusqu’à votre prochain tour.",
      "flavor": "Chaque viseur couvre l’angle mort d’un camarade.",
      "effect": {
        "kind": "READY_ALL"
      },
      "tags": [
        "uscm",
        "defense"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Restez sur vos gardes",
        "prototype": false
      },
      "collectorNo": "CW02-023",
      "index": 112,
      "artSeed": 2171060783,
      "searchText": "restez sur vos gardes tactic human cw02 r vos unités gagnent armure jusqu’à votre prochain tour. chaque viseur couvre l’angle mort d’un camarade. uscm defense",
      "slug": "restez-sur-vos-gardes"
    },
    {
      "id": "T_H_EVAC",
      "name": "Évacuation d’urgence",
      "type": "TACTIC",
      "faction": "HUMAN",
      "set": "NX01",
      "rarity": "SR",
      "cost": 3,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Renvoyez une unité alliée en main puis piochez 1.",
      "flavor": "Survivre vaut mieux que tenir une position perdue.",
      "effect": {
        "kind": "BOUNCE_FRIENDLY",
        "draw": 1,
        "target": "FRIENDLY_UNIT"
      },
      "tags": [
        "evac",
        "survival"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Évacuation d’urgence",
        "prototype": false
      },
      "collectorNo": "NX01-019",
      "index": 113,
      "artSeed": 1239149570,
      "searchText": "évacuation d’urgence tactic human nx01 sr renvoyez une unité alliée en main puis piochez 1. survivre vaut mieux que tenir une position perdue. evac survival",
      "slug": "vacuation-d-urgence"
    },
    {
      "id": "T_H_QUARANTINE",
      "name": "Protocole de quarantaine",
      "type": "TACTIC",
      "faction": "HUMAN",
      "set": "NX01",
      "rarity": "SR",
      "cost": 3,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Les effets d’arrivée des Xénomorphes ennemis sont neutralisés jusqu’au prochain tour.",
      "flavor": "La règle existe. La compagnie choisit quand l’ignorer.",
      "effect": {
        "kind": "SILENCE_FACTION",
        "faction": "XENO",
        "turns": 1
      },
      "tags": [
        "quarantine",
        "protocol"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Protocole de quarantaine",
        "prototype": false
      },
      "collectorNo": "NX01-020",
      "index": 114,
      "artSeed": 2625460377,
      "searchText": "protocole de quarantaine tactic human nx01 sr les effets d’arrivée des xénomorphes ennemis sont neutralisés jusqu’au prochain tour. la règle existe. la compagnie choisit quand l’ignorer. quarantine protocol",
      "slug": "protocole-de-quarantaine"
    },
    {
      "id": "T_E_BLACK_GOO",
      "name": "Libération du liquide noir",
      "type": "TACTIC",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "SR",
      "cost": 4,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Toutes les unités non Synthétiques perdent 300 ATK et subissent 300 dégâts.",
      "flavor": "Une goutte suffit à modifier un monde.",
      "effect": {
        "kind": "DEBUFF_ALL",
        "attack": 300,
        "damage": 300
      },
      "tags": [
        "pathogen",
        "black-goo"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Libération du liquide noir",
        "prototype": false
      },
      "collectorNo": "EV05-029",
      "index": 115,
      "artSeed": 4211443707,
      "searchText": "libération du liquide noir tactic engineer ev05 sr toutes les unités non synthétiques perdent 300 atk et subissent 300 dégâts. une goutte suffit à modifier un monde. pathogen black-goo",
      "slug": "lib-ration-du-liquide-noir"
    },
    {
      "id": "T_E_CREATION",
      "name": "Cycle de création",
      "type": "TACTIC",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "R",
      "cost": 3,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Crée deux Xénomorphes aléatoires de coût 4 ou moins dans votre main.",
      "flavor": "La vie est un matériau.",
      "effect": {
        "kind": "CREATE_RANDOM",
        "faction": "XENO",
        "maxCost": 4,
        "count": 2
      },
      "tags": [
        "creation",
        "xeno"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Cycle de création",
        "prototype": false
      },
      "collectorNo": "EV05-030",
      "index": 116,
      "artSeed": 340628990,
      "searchText": "cycle de création tactic engineer ev05 r crée deux xénomorphes aléatoires de coût 4 ou moins dans votre main. la vie est un matériau. creation xeno",
      "slug": "cycle-de-cr-ation"
    },
    {
      "id": "T_E_ORRERY",
      "name": "Cartographie de l’orrery",
      "type": "TACTIC",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "R",
      "cost": 2,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Cherchez un lieu puis gagnez 1 énergie temporaire.",
      "flavor": "Les étoiles deviennent une interface.",
      "effect": {
        "kind": "DRAW_LOCATION_ENERGY",
        "count": 1,
        "energy": 1
      },
      "tags": [
        "orrery",
        "navigation"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Cartographie de l’orrery",
        "prototype": false
      },
      "collectorNo": "EV05-031",
      "index": 117,
      "artSeed": 1670778550,
      "searchText": "cartographie de l’orrery tactic engineer ev05 r cherchez un lieu puis gagnez 1 énergie temporaire. les étoiles deviennent une interface. orrery navigation",
      "slug": "cartographie-de-l-orrery"
    },
    {
      "id": "T_E_SACRIFICE",
      "name": "Sacrifice de l’Ingénieur",
      "type": "TACTIC",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "UR",
      "cost": 5,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Sacrifiez une unité pour invoquer le Deacon depuis votre collection pour ce duel.",
      "flavor": "La création commence par une dissolution.",
      "effect": {
        "kind": "SACRIFICE_SUMMON",
        "card": "X_DEACON",
        "target": "FRIENDLY_UNIT"
      },
      "tags": [
        "sacrifice",
        "deacon"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Sacrifice de l’Ingénieur",
        "prototype": false
      },
      "collectorNo": "EV05-032",
      "index": 118,
      "artSeed": 696128316,
      "searchText": "sacrifice de l’ingénieur tactic engineer ev05 ur sacrifiez une unité pour invoquer le deacon depuis votre collection pour ce duel. la création commence par une dissolution. sacrifice deacon",
      "slug": "sacrifice-de-l-ing-nieur"
    },
    {
      "id": "T_AVP_WHOEVER",
      "name": "Whoever Wins… We Lose",
      "type": "TACTIC",
      "faction": "HYBRID",
      "set": "AV04",
      "rarity": "UR",
      "cost": 5,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Inflige 1200 dégâts à l’unité la plus puissante de chaque camp.",
      "flavor": "La victoire appartient rarement aux témoins.",
      "effect": {
        "kind": "DAMAGE_STRONGEST",
        "amount": 1200
      },
      "tags": [
        "avp",
        "event"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Whoever Wins… We Lose",
        "prototype": false
      },
      "collectorNo": "AV04-015",
      "index": 119,
      "artSeed": 1748097369,
      "searchText": "whoever wins… we lose tactic hybrid av04 ur inflige 1200 dégâts à l’unité la plus puissante de chaque camp. la victoire appartient rarement aux témoins. avp event",
      "slug": "whoever-wins-we-lose"
    },
    {
      "id": "T_AVP_ALLIANCE",
      "name": "Alliance Blooded",
      "type": "TACTIC",
      "faction": "HYBRID",
      "set": "AV04",
      "rarity": "SR",
      "cost": 3,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Vos unités Humaines et Yautja gagnent +300/+300.",
      "flavor": "La marque acide vaut serment.",
      "effect": {
        "kind": "BUFF_MULTI_FACTION",
        "factions": [
          "HUMAN",
          "YAUTJA"
        ],
        "attack": 300,
        "health": 300
      },
      "tags": [
        "avp",
        "alliance"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Alliance Blooded",
        "prototype": false
      },
      "collectorNo": "AV04-016",
      "index": 120,
      "artSeed": 2264862980,
      "searchText": "alliance blooded tactic hybrid av04 sr vos unités humaines et yautja gagnent +300/+300. la marque acide vaut serment. avp alliance",
      "slug": "alliance-blooded"
    },
    {
      "id": "T_AVP_3WW",
      "name": "Three World War",
      "type": "TACTIC",
      "faction": "HYBRID",
      "set": "AV04",
      "rarity": "SCR",
      "cost": 6,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Invoquez une unité Humaine, Yautja et Xénomorphe de coût 2 ou moins dans les voies libres.",
      "flavor": "Trois espèces, une guerre sans arbitre.",
      "effect": {
        "kind": "SUMMON_THREE_WORLDS"
      },
      "tags": [
        "avp",
        "three-world-war"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Three World War",
        "prototype": false
      },
      "collectorNo": "AV04-017",
      "index": 121,
      "artSeed": 2856145203,
      "searchText": "three world war tactic hybrid av04 scr invoquez une unité humaine, yautja et xénomorphe de coût 2 ou moins dans les voies libres. trois espèces, une guerre sans arbitre. avp three-world-war",
      "slug": "three-world-war"
    },
    {
      "id": "T_AVP_HYBRIDIZE",
      "name": "Hybridation forcée",
      "type": "TACTIC",
      "faction": "HYBRID",
      "set": "EV05",
      "rarity": "UR",
      "cost": 4,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Une unité gagne +500/+500 et compte comme Hybride.",
      "flavor": "Le cycle ne demande jamais la permission.",
      "effect": {
        "kind": "HYBRIDIZE",
        "attack": 500,
        "health": 500,
        "target": "FRIENDLY_UNIT"
      },
      "tags": [
        "hybrid",
        "mutation"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "03_Index_global",
        "entry": "Hybridation forcée",
        "prototype": false
      },
      "collectorNo": "EV05-033",
      "index": 122,
      "artSeed": 3793578364,
      "searchText": "hybridation forcée tactic hybrid ev05 ur une unité gagne +500/+500 et compte comme hybride. le cycle ne demande jamais la permission. hybrid mutation",
      "slug": "hybridation-forc-e"
    },
    {
      "id": "EQ_PULSE_RIFLE",
      "name": "M41A Pulse Rifle",
      "type": "EQUIPMENT",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "R",
      "cost": 2,
      "attack": 500,
      "health": 200,
      "keywords": [],
      "text": "+500 ATK / +200 PV.",
      "flavor": "Compteur numérique, bruit reconnaissable.",
      "effect": {},
      "tags": [
        "weapon",
        "uscm"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "05_Equipement",
        "entry": "M41A Pulse Rifle",
        "prototype": false
      },
      "collectorNo": "CW02-024",
      "index": 123,
      "artSeed": 2886392218,
      "searchText": "m41a pulse rifle equipment human cw02 r +500 atk / +200 pv. compteur numérique, bruit reconnaissable. weapon uscm",
      "slug": "m41a-pulse-rifle"
    },
    {
      "id": "EQ_SMARTGUN",
      "name": "M56 Smartgun",
      "type": "EQUIPMENT",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "SR",
      "cost": 3,
      "attack": 700,
      "health": 100,
      "keywords": [
        "HUNTER"
      ],
      "text": "+700 ATK et Chasseur.",
      "flavor": "Le bras articulé absorbe ce que le tireur ne doit pas manquer.",
      "effect": {},
      "tags": [
        "weapon",
        "uscm"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "05_Equipement",
        "entry": "M56 Smartgun",
        "prototype": false
      },
      "collectorNo": "CW02-025",
      "index": 124,
      "artSeed": 2857334368,
      "searchText": "m56 smartgun equipment human cw02 sr +700 atk et chasseur. le bras articulé absorbe ce que le tireur ne doit pas manquer. weapon uscm hunter",
      "slug": "m56-smartgun"
    },
    {
      "id": "EQ_FLAMER",
      "name": "Lance-flammes M240",
      "type": "EQUIPMENT",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "R",
      "cost": 2,
      "attack": 400,
      "health": 300,
      "keywords": [],
      "text": "Après avoir attaqué, inflige 200 dégâts à l’unité opposée.",
      "flavor": "Le feu ouvre un corridor.",
      "effect": {
        "afterAttack": {
          "kind": "DAMAGE_OPPOSING",
          "amount": 200
        }
      },
      "tags": [
        "weapon",
        "fire"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "05_Equipement",
        "entry": "Lance-flammes M240",
        "prototype": false
      },
      "collectorNo": "CW02-026",
      "index": 125,
      "artSeed": 968021587,
      "searchText": "lance-flammes m240 equipment human cw02 r après avoir attaqué, inflige 200 dégâts à l’unité opposée. le feu ouvre un corridor. weapon fire",
      "slug": "lance-flammes-m240"
    },
    {
      "id": "EQ_MARINE_ARMOR",
      "name": "Armure de Marine colonial",
      "type": "EQUIPMENT",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "C",
      "cost": 1,
      "attack": 100,
      "health": 500,
      "keywords": [
        "ARMOR"
      ],
      "text": "+100 ATK / +500 PV et Armure.",
      "flavor": "Le poids rassure davantage que les statistiques.",
      "effect": {},
      "tags": [
        "armor",
        "uscm"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "05_Equipement",
        "entry": "Armure de Marine colonial",
        "prototype": false
      },
      "collectorNo": "CW02-027",
      "index": 126,
      "artSeed": 55395959,
      "searchText": "armure de marine colonial equipment human cw02 c +100 atk / +500 pv et armure. le poids rassure davantage que les statistiques. armor uscm armor",
      "slug": "armure-de-marine-colonial"
    },
    {
      "id": "EQ_POWER_LOADER",
      "name": "Power Loader",
      "type": "EQUIPMENT",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "UR",
      "cost": 5,
      "attack": 1200,
      "health": 1200,
      "keywords": [
        "GUARD"
      ],
      "text": "+1200/+1200 et Garde. Réservé aux Humains.",
      "flavor": "Un outil industriel devient une réponse royale.",
      "effect": {
        "requiresFaction": "HUMAN"
      },
      "tags": [
        "vehicle",
        "loader"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "05_Equipement",
        "entry": "Power Loader",
        "prototype": false
      },
      "collectorNo": "CW02-028",
      "index": 127,
      "artSeed": 695363028,
      "searchText": "power loader equipment human cw02 ur +1200/+1200 et garde. réservé aux humains. un outil industriel devient une réponse royale. vehicle loader guard",
      "slug": "power-loader"
    },
    {
      "id": "EQ_MOTION_TRACKER",
      "name": "Détecteur de mouvement",
      "type": "EQUIPMENT",
      "faction": "HUMAN",
      "set": "NX01",
      "rarity": "R",
      "cost": 1,
      "attack": 100,
      "health": 200,
      "keywords": [],
      "text": "Le porteur peut cibler les unités Camouflées.",
      "flavor": "Le bip accélère avant les décisions.",
      "effect": {
        "seeCloak": true
      },
      "tags": [
        "sensor",
        "tracker"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "05_Equipement",
        "entry": "Détecteur de mouvement",
        "prototype": false
      },
      "collectorNo": "NX01-021",
      "index": 128,
      "artSeed": 2483055800,
      "searchText": "détecteur de mouvement equipment human nx01 r le porteur peut cibler les unités camouflées. le bip accélère avant les décisions. sensor tracker",
      "slug": "d-tecteur-de-mouvement"
    },
    {
      "id": "EQ_WRISTBLADES",
      "name": "Lames de poignet",
      "type": "EQUIPMENT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "C",
      "cost": 1,
      "attack": 400,
      "health": 100,
      "keywords": [
        "TROPHY"
      ],
      "text": "+400 ATK et Trophée.",
      "flavor": "Extraction de trophées et combat rapproché.",
      "effect": {},
      "tags": [
        "weapon",
        "wristblades"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Lames de poignet",
        "prototype": false
      },
      "collectorNo": "HG03-028",
      "index": 129,
      "artSeed": 132290901,
      "searchText": "lames de poignet equipment yautja hg03 c +400 atk et trophée. extraction de trophées et combat rapproché. weapon wristblades trophy",
      "slug": "lames-de-poignet"
    },
    {
      "id": "EQ_PLASMACASTER",
      "name": "Plasmacaster d’épaule",
      "type": "EQUIPMENT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "UR",
      "cost": 4,
      "attack": 900,
      "health": 200,
      "keywords": [],
      "text": "À l’équipement, inflige 500 dégâts à une unité ennemie.",
      "flavor": "Le bio-masque guide la lumière bleue.",
      "effect": {
        "onEquip": {
          "kind": "DAMAGE_RANDOM_ENEMY",
          "amount": 500
        }
      },
      "tags": [
        "weapon",
        "plasma"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Plasmacaster d’épaule",
        "prototype": false
      },
      "collectorNo": "HG03-029",
      "index": 130,
      "artSeed": 2292731665,
      "searchText": "plasmacaster d’épaule equipment yautja hg03 ur à l’équipement, inflige 500 dégâts à une unité ennemie. le bio-masque guide la lumière bleue. weapon plasma",
      "slug": "plasmacaster-d-paule"
    },
    {
      "id": "EQ_COMBISTICK",
      "name": "Combi-stick",
      "type": "EQUIPMENT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "R",
      "cost": 2,
      "attack": 500,
      "health": 300,
      "keywords": [
        "HUNTER"
      ],
      "text": "+500/+300 et Chasseur.",
      "flavor": "Une lance compacte jusqu’au premier geste.",
      "effect": {},
      "tags": [
        "weapon",
        "spear"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Combi-stick",
        "prototype": false
      },
      "collectorNo": "HG03-030",
      "index": 131,
      "artSeed": 1035144264,
      "searchText": "combi-stick equipment yautja hg03 r +500/+300 et chasseur. une lance compacte jusqu’au premier geste. weapon spear hunter",
      "slug": "combi-stick"
    },
    {
      "id": "EQ_SMART_DISC",
      "name": "Smart Disc",
      "type": "EQUIPMENT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "SR",
      "cost": 3,
      "attack": 700,
      "health": 0,
      "keywords": [
        "FLYING"
      ],
      "text": "+700 ATK; le porteur peut viser n’importe quelle voie.",
      "flavor": "La trajectoire revient avec les données de la cible.",
      "effect": {},
      "tags": [
        "weapon",
        "disc"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Smart Disc",
        "prototype": false
      },
      "collectorNo": "HG03-031",
      "index": 132,
      "artSeed": 4176522498,
      "searchText": "smart disc equipment yautja hg03 sr +700 atk; le porteur peut viser n’importe quelle voie. la trajectoire revient avec les données de la cible. weapon disc flying",
      "slug": "smart-disc"
    },
    {
      "id": "EQ_NET_GUN",
      "name": "Net Gun",
      "type": "EQUIPMENT",
      "faction": "YAUTJA",
      "set": "AV04",
      "rarity": "R",
      "cost": 2,
      "attack": 300,
      "health": 300,
      "keywords": [
        "GUARD"
      ],
      "text": "+300/+300 et Garde.",
      "flavor": "Le filet se resserre contre les surfaces solides.",
      "effect": {},
      "tags": [
        "weapon",
        "net"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Net Gun",
        "prototype": false
      },
      "collectorNo": "AV04-018",
      "index": 133,
      "artSeed": 1466349367,
      "searchText": "net gun equipment yautja av04 r +300/+300 et garde. le filet se resserre contre les surfaces solides. weapon net guard",
      "slug": "net-gun"
    },
    {
      "id": "EQ_BIOMASK",
      "name": "Bio-masque Yautja",
      "type": "EQUIPMENT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "SR",
      "cost": 2,
      "attack": 200,
      "health": 500,
      "keywords": [
        "CLOAK"
      ],
      "text": "+200/+500 et Camouflage.",
      "flavor": "Vision, respiration et ciblage en une seule interface.",
      "effect": {},
      "tags": [
        "mask",
        "vision"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Bio-masque Yautja",
        "prototype": false
      },
      "collectorNo": "HG03-032",
      "index": 134,
      "artSeed": 1253678495,
      "searchText": "bio-masque yautja equipment yautja hg03 sr +200/+500 et camouflage. vision, respiration et ciblage en une seule interface. mask vision cloak",
      "slug": "bio-masque-yautja"
    },
    {
      "id": "EQ_MEDICOMP",
      "name": "Medicomp",
      "type": "EQUIPMENT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "R",
      "cost": 2,
      "attack": 0,
      "health": 900,
      "keywords": [
        "REGEN"
      ],
      "text": "+900 PV et Régénération.",
      "flavor": "Un kit chirurgical de terrain pour terminer la chasse.",
      "effect": {},
      "tags": [
        "medical",
        "equipment"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Medicomp",
        "prototype": false
      },
      "collectorNo": "HG03-033",
      "index": 135,
      "artSeed": 3862996905,
      "searchText": "medicomp equipment yautja hg03 r +900 pv et régénération. un kit chirurgical de terrain pour terminer la chasse. medical equipment regen",
      "slug": "medicomp"
    },
    {
      "id": "EQ_RAZOR_WHIP",
      "name": "Razor Whip",
      "type": "EQUIPMENT",
      "faction": "YAUTJA",
      "set": "AV04",
      "rarity": "SR",
      "cost": 3,
      "attack": 700,
      "health": 0,
      "keywords": [
        "ACID"
      ],
      "text": "+700 ATK; le porteur gagne Sang acide.",
      "flavor": "Une arme segmentée conçue pour survivre au sang acide.",
      "effect": {},
      "tags": [
        "weapon",
        "whip"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Razor Whip",
        "prototype": false
      },
      "collectorNo": "AV04-019",
      "index": 136,
      "artSeed": 720853383,
      "searchText": "razor whip equipment yautja av04 sr +700 atk; le porteur gagne sang acide. une arme segmentée conçue pour survivre au sang acide. weapon whip acid",
      "slug": "razor-whip"
    },
    {
      "id": "EQ_FALCON_DRONE",
      "name": "Module Falcon Drone",
      "type": "EQUIPMENT",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "SR",
      "cost": 3,
      "attack": 400,
      "health": 300,
      "keywords": [
        "FLYING"
      ],
      "text": "+400/+300 et Vol.",
      "flavor": "Un drone de reconnaissance accompagne le porteur.",
      "effect": {},
      "tags": [
        "drone",
        "falcon"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Module Falcon Drone",
        "prototype": false
      },
      "collectorNo": "HG03-034",
      "index": 137,
      "artSeed": 3441222656,
      "searchText": "module falcon drone equipment yautja hg03 sr +400/+300 et vol. un drone de reconnaissance accompagne le porteur. drone falcon flying",
      "slug": "module-falcon-drone"
    },
    {
      "id": "EQ_ENGINEER_SUIT",
      "name": "Combinaison biomécanique Engineer",
      "type": "EQUIPMENT",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "SR",
      "cost": 3,
      "attack": 300,
      "health": 800,
      "keywords": [
        "ARMOR",
        "PATHOGEN"
      ],
      "text": "+300/+800, Armure et Pathogène.",
      "flavor": "Une seconde peau faite du même langage que le vaisseau.",
      "effect": {},
      "tags": [
        "engineer",
        "suit"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "05_Equipement",
        "entry": "Combinaison biomécanique Engineer",
        "prototype": false
      },
      "collectorNo": "EV05-034",
      "index": 138,
      "artSeed": 1027326452,
      "searchText": "combinaison biomécanique engineer equipment engineer ev05 sr +300/+800, armure et pathogène. une seconde peau faite du même langage que le vaisseau. engineer suit armor pathogen",
      "slug": "combinaison-biom-canique-engineer"
    },
    {
      "id": "EQ_AMPule",
      "name": "Ampoule de Pathogène",
      "type": "EQUIPMENT",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "UR",
      "cost": 4,
      "attack": 600,
      "health": 400,
      "keywords": [
        "PATHOGEN"
      ],
      "text": "+600/+400. À la destruction du porteur, inflige 300 dégâts à tous.",
      "flavor": "Le contenant est déjà une menace.",
      "effect": {
        "onCarrierDeath": {
          "kind": "DAMAGE_ALL",
          "amount": 300
        }
      },
      "tags": [
        "pathogen",
        "ampule"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "05_Equipement",
        "entry": "Ampoule de Pathogène",
        "prototype": false
      },
      "collectorNo": "EV05-035",
      "index": 139,
      "artSeed": 592129977,
      "searchText": "ampoule de pathogène equipment engineer ev05 ur +600/+400. à la destruction du porteur, inflige 300 dégâts à tous. le contenant est déjà une menace. pathogen ampule pathogen",
      "slug": "ampoule-de-pathog-ne"
    },
    {
      "id": "EQ_ACID_CARAPACE",
      "name": "Carapace acide",
      "type": "EQUIPMENT",
      "faction": "XENO",
      "set": "EV05",
      "rarity": "R",
      "cost": 2,
      "attack": 300,
      "health": 600,
      "keywords": [
        "ACID"
      ],
      "text": "+300/+600 et Sang acide.",
      "flavor": "Une armure qui punit le coup réussi.",
      "effect": {},
      "tags": [
        "xeno",
        "carapace"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "05_Equipement",
        "entry": "Carapace acide",
        "prototype": false
      },
      "collectorNo": "EV05-036",
      "index": 140,
      "artSeed": 3239937091,
      "searchText": "carapace acide equipment xeno ev05 r +300/+600 et sang acide. une armure qui punit le coup réussi. xeno carapace acid",
      "slug": "carapace-acide"
    },
    {
      "id": "L_NOSTROMO",
      "name": "USCSS Nostromo",
      "type": "LOCATION",
      "faction": "HUMAN",
      "set": "NX01",
      "rarity": "UR",
      "cost": 4,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "La première carte Équipage Nostromo jouée chaque tour coûte 1 de moins.",
      "flavor": "Un remorqueur commercial répond à un signal qui ne lui était pas destiné.",
      "effect": {
        "code": "NOSTROMO"
      },
      "tags": [
        "ship",
        "nostromo"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "14_Lieux",
        "entry": "USCSS Nostromo",
        "prototype": false
      },
      "collectorNo": "NX01-022",
      "index": 141,
      "artSeed": 783219400,
      "searchText": "uscss nostromo location human nx01 ur la première carte équipage nostromo jouée chaque tour coûte 1 de moins. un remorqueur commercial répond à un signal qui ne lui était pas destiné. ship nostromo",
      "slug": "uscss-nostromo"
    },
    {
      "id": "L_DERELICT",
      "name": "Vaisseau Derelict de LV-426",
      "type": "LOCATION",
      "faction": "ENGINEER",
      "set": "NX01",
      "rarity": "SCR",
      "cost": 5,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "À chaque début de tour, créez un Ovomorphe dans votre main si elle en contient moins de 6 cartes.",
      "flavor": "Le signal avertissait. Personne ne l’a compris.",
      "effect": {
        "code": "DERELICT"
      },
      "tags": [
        "lv-426",
        "derelict"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "14_Lieux",
        "entry": "Vaisseau Derelict de LV-426",
        "prototype": false
      },
      "collectorNo": "NX01-023",
      "index": 142,
      "artSeed": 3703685073,
      "searchText": "vaisseau derelict de lv-426 location engineer nx01 scr à chaque début de tour, créez un ovomorphe dans votre main si elle en contient moins de 6 cartes. le signal avertissait. personne ne l’a compris. lv-426 derelict",
      "slug": "vaisseau-derelict-de-lv-426"
    },
    {
      "id": "L_HADLEYS_HOPE",
      "name": "Hadley’s Hope",
      "type": "LOCATION",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "SR",
      "cost": 4,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Vos Marines gagnent +200 PV. Les Xénomorphes coûtent 1 de moins pour les deux joueurs.",
      "flavor": "Une colonie, un processeur atmosphérique et trop de silence.",
      "effect": {
        "code": "HADLEYS"
      },
      "tags": [
        "lv-426",
        "colony"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "14_Lieux",
        "entry": "Hadley’s Hope",
        "prototype": false
      },
      "collectorNo": "CW02-029",
      "index": 143,
      "artSeed": 197035248,
      "searchText": "hadley’s hope location human cw02 sr vos marines gagnent +200 pv. les xénomorphes coûtent 1 de moins pour les deux joueurs. une colonie, un processeur atmosphérique et trop de silence. lv-426 colony",
      "slug": "hadley-s-hope"
    },
    {
      "id": "L_PROCESSOR",
      "name": "Processeur atmosphérique",
      "type": "LOCATION",
      "faction": "NEUTRAL",
      "set": "CW02",
      "rarity": "R",
      "cost": 3,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "À la fin du tour 8, inflige 500 dégâts à chaque commandant à chaque tour.",
      "flavor": "La fusion ne s’arrête pas pour un duel.",
      "effect": {
        "code": "PROCESSOR"
      },
      "tags": [
        "lv-426",
        "processor"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "14_Lieux",
        "entry": "Processeur atmosphérique",
        "prototype": false
      },
      "collectorNo": "CW02-030",
      "index": 144,
      "artSeed": 1216802833,
      "searchText": "processeur atmosphérique location neutral cw02 r à la fin du tour 8, inflige 500 dégâts à chaque commandant à chaque tour. la fusion ne s’arrête pas pour un duel. lv-426 processor",
      "slug": "processeur-atmosph-rique"
    },
    {
      "id": "L_SULACO",
      "name": "USS Sulaco — Hangar",
      "type": "LOCATION",
      "faction": "HUMAN",
      "set": "CW02",
      "rarity": "SR",
      "cost": 4,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Le premier Équipement Humain joué chaque tour coûte 1 de moins.",
      "flavor": "Le hangar contient autant d’outils que de mauvaises idées.",
      "effect": {
        "code": "SULACO"
      },
      "tags": [
        "sulaco",
        "hangar"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "14_Lieux",
        "entry": "USS Sulaco — Hangar",
        "prototype": false
      },
      "collectorNo": "CW02-031",
      "index": 145,
      "artSeed": 3266958022,
      "searchText": "uss sulaco — hangar location human cw02 sr le premier équipement humain joué chaque tour coûte 1 de moins. le hangar contient autant d’outils que de mauvaises idées. sulaco hangar",
      "slug": "uss-sulaco-hangar"
    },
    {
      "id": "L_SEVASTOPOL",
      "name": "Station Sevastopol",
      "type": "LOCATION",
      "faction": "HUMAN",
      "set": "NX01",
      "rarity": "SR",
      "cost": 4,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "À la destruction d’un Synthétique, piochez 1.",
      "flavor": "Une station en fin de vie reçoit un dernier visiteur.",
      "effect": {
        "code": "SEVASTOPOL"
      },
      "tags": [
        "isolation",
        "station"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "14_Lieux",
        "entry": "Station Sevastopol",
        "prototype": false
      },
      "collectorNo": "NX01-024",
      "index": 146,
      "artSeed": 2650950732,
      "searchText": "station sevastopol location human nx01 sr à la destruction d’un synthétique, piochez 1. une station en fin de vie reçoit un dernier visiteur. isolation station",
      "slug": "station-sevastopol"
    },
    {
      "id": "L_VAL_VERDE",
      "name": "Jungle de Val Verde",
      "type": "LOCATION",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "UR",
      "cost": 4,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "La première unité Yautja jouée chaque tour gagne Camouflage.",
      "flavor": "La canopée absorbe le bruit et révèle la chaleur.",
      "effect": {
        "code": "VAL_VERDE"
      },
      "tags": [
        "predator-1987",
        "jungle"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Jungle de Val Verde",
        "prototype": false
      },
      "collectorNo": "HG03-035",
      "index": 147,
      "artSeed": 1469492985,
      "searchText": "jungle de val verde location yautja hg03 ur la première unité yautja jouée chaque tour gagne camouflage. la canopée absorbe le bruit et révèle la chaleur. predator-1987 jungle",
      "slug": "jungle-de-val-verde"
    },
    {
      "id": "L_LA1997",
      "name": "Los Angeles, 1997",
      "type": "LOCATION",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "R",
      "cost": 3,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Vos Yautja gagnent +200 ATK si le commandant adverse a moins de 5000 PV.",
      "flavor": "Canicule, violence et chasse urbaine.",
      "effect": {
        "code": "LA1997"
      },
      "tags": [
        "predator-2",
        "city"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Los Angeles, 1997",
        "prototype": false
      },
      "collectorNo": "HG03-036",
      "index": 148,
      "artSeed": 1349011268,
      "searchText": "los angeles, 1997 location yautja hg03 r vos yautja gagnent +200 atk si le commandant adverse a moins de 5000 pv. canicule, violence et chasse urbaine. predator-2 city",
      "slug": "los-angeles-1997"
    },
    {
      "id": "L_PRESERVE",
      "name": "Planète-réserve",
      "type": "LOCATION",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "SR",
      "cost": 4,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "À chaque Trophée gagné, soignez 200 PV.",
      "flavor": "Toutes les proies ont été choisies.",
      "effect": {
        "code": "PRESERVE"
      },
      "tags": [
        "predators",
        "planet"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Planète-réserve",
        "prototype": false
      },
      "collectorNo": "HG03-037",
      "index": 149,
      "artSeed": 796559160,
      "searchText": "planète-réserve location yautja hg03 sr à chaque trophée gagné, soignez 200 pv. toutes les proies ont été choisies. predators planet",
      "slug": "plan-te-r-serve"
    },
    {
      "id": "L_BOUVET",
      "name": "Pyramide de Bouvetøya",
      "type": "LOCATION",
      "faction": "HYBRID",
      "set": "AV04",
      "rarity": "UR",
      "cost": 4,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Les Xénomorphes et Yautja coûtent 1 de moins lors de leur premier déploiement du tour.",
      "flavor": "Le temple change de forme autour de son propre rite.",
      "effect": {
        "code": "BOUVET"
      },
      "tags": [
        "avp",
        "temple"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "14_Lieux",
        "entry": "Pyramide de Bouvetøya",
        "prototype": false
      },
      "collectorNo": "AV04-020",
      "index": 150,
      "artSeed": 2000363644,
      "searchText": "pyramide de bouvetøya location hybrid av04 ur les xénomorphes et yautja coûtent 1 de moins lors de leur premier déploiement du tour. le temple change de forme autour de son propre rite. avp temple",
      "slug": "pyramide-de-bouvet-ya"
    },
    {
      "id": "L_YAUTJA_SHIP",
      "name": "Vaisseau mère Yautja",
      "type": "LOCATION",
      "faction": "YAUTJA",
      "set": "HG03",
      "rarity": "SR",
      "cost": 4,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Au début de votre tour, soignez 150 PV par Yautja allié.",
      "flavor": "Une galerie de trophées voyage entre les étoiles.",
      "effect": {
        "code": "MOTHERSHIP"
      },
      "tags": [
        "ship",
        "clan"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Catalogue maître",
        "entry": "Vaisseau mère Yautja",
        "prototype": false
      },
      "collectorNo": "HG03-038",
      "index": 151,
      "artSeed": 3423550113,
      "searchText": "vaisseau mère yautja location yautja hg03 sr au début de votre tour, soignez 150 pv par yautja allié. une galerie de trophées voyage entre les étoiles. ship clan",
      "slug": "vaisseau-m-re-yautja"
    },
    {
      "id": "L_JUGGERNAUT",
      "name": "Juggernaut Engineer",
      "type": "LOCATION",
      "faction": "ENGINEER",
      "set": "EV05",
      "rarity": "UR",
      "cost": 5,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Vos cartes Pathogène coûtent 1 de moins.",
      "flavor": "Le pilote et le vaisseau partagent le même langage biomécanique.",
      "effect": {
        "code": "JUGGERNAUT"
      },
      "tags": [
        "engineer",
        "ship"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "14_Lieux",
        "entry": "Juggernaut Engineer",
        "prototype": false
      },
      "collectorNo": "EV05-037",
      "index": 152,
      "artSeed": 3347420459,
      "searchText": "juggernaut engineer location engineer ev05 ur vos cartes pathogène coûtent 1 de moins. le pilote et le vaisseau partagent le même langage biomécanique. engineer ship",
      "slug": "juggernaut-engineer"
    },
    {
      "id": "L_XENO_HIVE",
      "name": "Ruche de Hadley’s Hope",
      "type": "LOCATION",
      "faction": "XENO",
      "set": "CW02",
      "rarity": "SR",
      "cost": 4,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Vos unités avec Ruche coûtent 1 de moins et gagnent +100 PV.",
      "flavor": "La colonie n’est plus construite pour les humains.",
      "effect": {
        "code": "HIVE"
      },
      "tags": [
        "hive",
        "lv-426"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "14_Lieux",
        "entry": "Ruche de Hadley’s Hope",
        "prototype": false
      },
      "collectorNo": "CW02-032",
      "index": 153,
      "artSeed": 3188108627,
      "searchText": "ruche de hadley’s hope location xeno cw02 sr vos unités avec ruche coûtent 1 de moins et gagnent +100 pv. la colonie n’est plus construite pour les humains. hive lv-426",
      "slug": "ruche-de-hadley-s-hope"
    },
    {
      "id": "L_AURIGA",
      "name": "Laboratoires de l’USM Auriga",
      "type": "LOCATION",
      "faction": "HYBRID",
      "set": "EV05",
      "rarity": "SR",
      "cost": 4,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "La première carte Hybride jouée chaque tour coûte 1 de moins.",
      "flavor": "La science répète le cycle avec davantage de confiance.",
      "effect": {
        "code": "AURIGA"
      },
      "tags": [
        "resurrection",
        "lab"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "14_Lieux",
        "entry": "Laboratoires de l’USM Auriga",
        "prototype": false
      },
      "collectorNo": "EV05-038",
      "index": 154,
      "artSeed": 2914602314,
      "searchText": "laboratoires de l’usm auriga location hybrid ev05 sr la première carte hybride jouée chaque tour coûte 1 de moins. la science répète le cycle avec davantage de confiance. resurrection lab",
      "slug": "laboratoires-de-l-usm-auriga"
    },
    {
      "id": "L_FIORINA",
      "name": "Fiorina 161",
      "type": "LOCATION",
      "faction": "HUMAN",
      "set": "NX01",
      "rarity": "R",
      "cost": 3,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Les unités sans Équipement gagnent +200 ATK.",
      "flavor": "Une fonderie, des détenus et aucune arme adaptée.",
      "effect": {
        "code": "FIORINA"
      },
      "tags": [
        "alien-3",
        "prison"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "14_Lieux",
        "entry": "Fiorina 161",
        "prototype": false
      },
      "collectorNo": "NX01-025",
      "index": 155,
      "artSeed": 3713881215,
      "searchText": "fiorina 161 location human nx01 r les unités sans équipement gagnent +200 atk. une fonderie, des détenus et aucune arme adaptée. alien-3 prison",
      "slug": "fiorina-161"
    },
    {
      "id": "L_GUNNISON",
      "name": "Gunnison contaminée",
      "type": "LOCATION",
      "faction": "HYBRID",
      "set": "AV04",
      "rarity": "R",
      "cost": 3,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Quand une unité meurt, son propriétaire subit 100 dégâts.",
      "flavor": "La contamination traverse une ville avant l’aube.",
      "effect": {
        "code": "GUNNISON"
      },
      "tags": [
        "avpr",
        "town"
      ],
      "source": {
        "workbook": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
        "sheet": "14_Lieux",
        "entry": "Gunnison contaminée",
        "prototype": false
      },
      "collectorNo": "AV04-021",
      "index": 156,
      "artSeed": 522287559,
      "searchText": "gunnison contaminée location hybrid av04 r quand une unité meurt, son propriétaire subit 100 dégâts. la contamination traverse une ville avant l’aube. avpr town",
      "slug": "gunnison-contamin-e"
    },
    {
      "id": "L_PROTO_LAB",
      "name": "Laboratoire Stargazer — version coupée",
      "type": "LOCATION",
      "faction": "YAUTJA",
      "set": "PX00",
      "rarity": "PR",
      "cost": 5,
      "attack": 0,
      "health": 0,
      "keywords": [],
      "text": "Vos Humains et Yautja gagnent +200/+200; les Emissaries coûtent 1 de moins.",
      "flavor": "Une alliance filmée puis effacée du montage.",
      "effect": {
        "code": "PROTO_LAB"
      },
      "tags": [
        "cut",
        "stargazer"
      ],
      "source": {
        "workbook": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
        "sheet": "Cut - annulé - proto",
        "entry": "Laboratoire Stargazer — version coupée",
        "prototype": true
      },
      "collectorNo": "PX00-004",
      "index": 157,
      "artSeed": 2927176786,
      "searchText": "laboratoire stargazer — version coupée location yautja px00 pr vos humains et yautja gagnent +200/+200; les emissaries coûtent 1 de moins. une alliance filmée puis effacée du montage. cut stargazer",
      "slug": "laboratoire-stargazer-version-coup-e"
    }
  ],
  "boosters": [
    {
      "id": "pack_nx01",
      "set": "NX01",
      "name": "Origines Hostiles",
      "subtitle": "Nostromo / LV-426",
      "price": 600,
      "art": "SIGNAL",
      "description": "Équipage du Nostromo, premières formes Xénomorphes et Derelict.",
      "unlocksAt": 0
    },
    {
      "id": "pack_cw02",
      "set": "CW02",
      "name": "Guerre Coloniale",
      "subtitle": "Hadley’s Hope",
      "price": 650,
      "art": "COLONY",
      "description": "USCM, ruche, Reine et arsenal colonial.",
      "unlocksAt": 0
    },
    {
      "id": "pack_hg03",
      "set": "HG03",
      "name": "Terrains de Chasse",
      "subtitle": "Code Yautja",
      "price": 650,
      "art": "HUNTER",
      "description": "Clans, chasseurs nommés, trophées et technologies.",
      "unlocksAt": 1
    },
    {
      "id": "pack_av04",
      "set": "AV04",
      "name": "Rite de Sang",
      "subtitle": "Alien vs. Predator",
      "price": 700,
      "art": "RITUAL",
      "description": "Temple, Blooding, alliance et Predalien.",
      "unlocksAt": 2
    },
    {
      "id": "pack_ev05",
      "set": "EV05",
      "name": "Évolution Parfaite",
      "subtitle": "Pathogène / Hybrides",
      "price": 750,
      "art": "EVOLUTION",
      "description": "Ingénieurs, formes Kenner, mutations et raretés extrêmes.",
      "unlocksAt": 4
    },
    {
      "id": "pack_px00",
      "set": "PX00",
      "name": "Continuités Perdues",
      "subtitle": "Archives coupées",
      "price": 900,
      "art": "PROTOTYPE",
      "description": "Emissaries, concepts et lieux séparés du canon principal.",
      "unlocksAt": 6,
      "prototype": true
    }
  ],
  "starterDecks": {
    "XENO": {
      "id": "starter_xeno",
      "name": "La Ruche Éveillée",
      "faction": "XENO",
      "symbol": "⌁",
      "description": "Essaim rapide, Couvée et Sang acide.",
      "cards": {
        "X_OVOMORPH": 3,
        "X_FACEHUGGER": 3,
        "X_CHESTBURSTER": 3,
        "X_DRONE": 3,
        "X_WARRIOR": 3,
        "X_RUNNER": 2,
        "X_SPITTER": 2,
        "X_PRAETORIAN": 2,
        "X_QUEEN": 1,
        "T_X_ACID_BLOOD": 2,
        "T_X_VENT_AMBUSH": 2,
        "T_X_RESIN": 1,
        "L_XENO_HIVE": 2,
        "EQ_ACID_CARAPACE": 1
      },
      "count": 30
    },
    "YAUTJA": {
      "id": "starter_yautja",
      "name": "Le Code du Chasseur",
      "faction": "YAUTJA",
      "symbol": "◈",
      "description": "Camouflage, équipements et Trophées.",
      "cards": {
        "Y_UNBLOODED": 3,
        "Y_YOUNG_BLOOD": 3,
        "Y_ELITE": 3,
        "Y_TEMPLE_GUARD": 3,
        "Y_GLADIATOR": 2,
        "Y_CITY_HUNTER": 1,
        "Y_JUNGLE_HUNTER": 1,
        "Y_HOUND": 2,
        "T_Y_HUNT_CODE": 3,
        "T_Y_CLAIM_TROPHY": 2,
        "T_Y_THERMAL": 2,
        "EQ_WRISTBLADES": 3,
        "EQ_COMBISTICK": 1,
        "EQ_BIOMASK": 1
      },
      "count": 30
    },
    "HUMAN": {
      "id": "starter_human",
      "name": "USCM — Dernière Ligne",
      "faction": "HUMAN",
      "symbol": "✦",
      "description": "Déploiement équilibré, équipements et contrôle.",
      "cards": {
        "H_COLONIAL_MARINE": 3,
        "H_SMARTGUNNER": 3,
        "H_HUDSON": 2,
        "H_APONE": 2,
        "H_HICKS": 2,
        "H_VASQUEZ": 1,
        "H_BISHOP": 1,
        "H_COMBAT_SYNTH": 2,
        "T_H_MOTION": 3,
        "T_H_SEAL_DOOR": 2,
        "T_H_FIRETEAM": 2,
        "T_H_FLAMER": 2,
        "EQ_PULSE_RIFLE": 2,
        "EQ_MARINE_ARMOR": 2,
        "L_SULACO": 1
      },
      "count": 30
    }
  },
  "campaign": [
    {
      "id": 1,
      "name": "Signal sur LV-426",
      "subtitle": "Nostromo",
      "factions": [
        "XENO",
        "ENGINEER"
      ],
      "difficulty": 1,
      "reward": 900,
      "pack": "pack_nx01",
      "description": "Comprendre le signal avant que le cycle biologique ne gagne les conduits.",
      "modifiers": []
    },
    {
      "id": 2,
      "name": "Dernière ligne à Hadley’s Hope",
      "subtitle": "Guerre Coloniale",
      "factions": [
        "XENO"
      ],
      "difficulty": 1.15,
      "reward": 1100,
      "pack": "pack_cw02",
      "description": "La ruche contrôle la colonie; l’IA privilégie les vagues rapides.",
      "modifiers": [
        "enemyBrood"
      ]
    },
    {
      "id": 3,
      "name": "Chaleur de Val Verde",
      "subtitle": "Première chasse",
      "factions": [
        "YAUTJA"
      ],
      "difficulty": 1.3,
      "reward": 1300,
      "pack": "pack_hg03",
      "description": "Le Jungle Hunter teste chaque unité digne d’un trophée.",
      "modifiers": [
        "enemyCloak"
      ]
    },
    {
      "id": 4,
      "name": "Blooding sous la glace",
      "subtitle": "Rituel AVP",
      "factions": [
        "YAUTJA",
        "XENO"
      ],
      "difficulty": 1.45,
      "reward": 1500,
      "pack": "pack_av04",
      "description": "Le temple change de forme alors que novices et drones s’affrontent.",
      "modifiers": [
        "ritual"
      ]
    },
    {
      "id": 5,
      "name": "Le créateur et la création",
      "subtitle": "Pathogène",
      "factions": [
        "ENGINEER",
        "XENO"
      ],
      "difficulty": 1.6,
      "reward": 1800,
      "pack": "pack_ev05",
      "description": "Les mutations affaiblissent tout ce qui n’est pas synthétique.",
      "modifiers": [
        "pathogen"
      ]
    },
    {
      "id": 6,
      "name": "Planète-réserve",
      "subtitle": "Super Predators",
      "factions": [
        "YAUTJA",
        "HYBRID"
      ],
      "difficulty": 1.8,
      "reward": 2100,
      "pack": "pack_hg03",
      "description": "La chasse est truquée, mais le terrain peut encore changer de maître.",
      "modifiers": [
        "trophyRush"
      ]
    },
    {
      "id": 7,
      "name": "Gunnison : containment failure",
      "subtitle": "Predalien",
      "factions": [
        "HYBRID",
        "XENO"
      ],
      "difficulty": 2,
      "reward": 2500,
      "pack": "pack_av04",
      "description": "Chaque perte accélère la contamination de la ville.",
      "modifiers": [
        "deathPing"
      ]
    },
    {
      "id": 8,
      "name": "Chasse parfaite",
      "subtitle": "Final AVP",
      "factions": [
        "XENO",
        "YAUTJA",
        "HYBRID",
        "ENGINEER"
      ],
      "difficulty": 2.25,
      "reward": 3200,
      "pack": "pack_px00",
      "description": "Une continuité impossible rassemble Reines, Elders et prototypes.",
      "modifiers": [
        "boss"
      ]
    }
  ],
  "achievements": [
    {
      "id": "first_pack",
      "name": "Le paquet s’ouvre",
      "description": "Ouvrir votre premier booster.",
      "reward": 250
    },
    {
      "id": "first_win",
      "name": "Survivant",
      "description": "Remporter votre premier duel.",
      "reward": 400
    },
    {
      "id": "collector_50",
      "name": "Archive de la Compagnie",
      "description": "Découvrir 50 cartes différentes.",
      "reward": 650
    },
    {
      "id": "trophy_10",
      "name": "Galerie de trophées",
      "description": "Gagner 10 Trophées cumulés.",
      "reward": 700
    },
    {
      "id": "campaign_clear",
      "name": "Whoever Wins…",
      "description": "Terminer les huit missions.",
      "reward": 1800
    },
    {
      "id": "secret_pull",
      "name": "Signal impossible",
      "description": "Obtenir une Secret Rare ou supérieure.",
      "reward": 800
    }
  ],
  "rules": {
    "deckSize": 30,
    "maxCopies": 3,
    "startingLife": 8000,
    "startingHand": 5,
    "lanes": 3,
    "maxEnergy": 10,
    "summary": "Déployez des unités sur trois voies, équipez-les, jouez des tactiques et réduisez les 8 000 PV adverses à zéro."
  },
  "sourceManifest": {
    "alien": {
      "file": "Alien_Franchise_Encyclopedie_Exhaustive_Passe_11_Scenes_Supprimees.xlsx",
      "role": "Référentiel principal Alien, AVP, lieux, armes, équipements, castes, humains et variantes.",
      "notableCounts": {
        "vehicles": 352,
        "detailedHumans": 498,
        "locations": 575,
        "rituals": 54,
        "visions": 51,
        "fauna": 65,
        "flora": 35
      }
    },
    "predator": {
      "file": "Encyclopedie_Predator_v10_cut_annules_prototypes.xlsx",
      "role": "Catalogue Predator/AVP et registre séparé des scènes coupées, projets annulés et prototypes."
    },
    "note": "Le pool de lancement est une sélection jouable et équilibrée. Le script tools/import_excel.py permet de réindexer les classeurs locaux sans confondre canon, merchandising et prototypes."
  }
};
