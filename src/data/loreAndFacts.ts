/**
 * ============================================================================
 * RIFT RARITY — VERIFIED LORE, REGION, MECHANIC & POPULARITY REGISTRY
 * ============================================================================
 * Every region membership, lore fact, mechanic list, and popularity score
 * used by Rift Rarity lives in this single file for easy auditing.
 *
 * Guidelines applied:
 * - Only canonical, undisputed Runeterra lore facts are included.
 * - Where a champion has dual canonical ties (e.g., Mel: Noxus & Piltover;
 *   Kayn: Noxus-born & Ionia-trained; Samira: Shurima-born & Noxus), both
 *   regions are accepted when fair so players are never unfairly penalized.
 * - Champion IDs match Riot Data Dragon `championFull.json` (16.23.1).
 * ============================================================================
 */

export type RuneterraRegionId =
  | 'demacia'
  | 'noxus'
  | 'ionia'
  | 'piltover'
  | 'zaun'
  | 'freljord'
  | 'shurima'
  | 'shadow_isles'
  | 'bilgewater'
  | 'targon'
  | 'bandle_city'
  | 'void'
  | 'ixtal';

export interface RegionMeta {
  id: RuneterraRegionId;
  name: string;
  aliases: string[];
  color: string;
  popularity: number; // 1 = most famous, 100 = most obscure
}

export const RUNETERRA_REGIONS: RegionMeta[] = [
  { id: 'demacia', name: 'Demacia', aliases: ['demacia'], color: '#e0b44c', popularity: 8 },
  { id: 'noxus', name: 'Noxus', aliases: ['noxus'], color: '#ef4444', popularity: 10 },
  { id: 'ionia', name: 'Ionia', aliases: ['ionia', 'first lands', 'the first lands'], color: '#f472b6', popularity: 12 },
  { id: 'piltover', name: 'Piltover', aliases: ['piltover'], color: '#fbbf24', popularity: 16 },
  { id: 'zaun', name: 'Zaun', aliases: ['zaun', 'the undercity'], color: '#22c55e', popularity: 18 },
  { id: 'freljord', name: 'Freljord', aliases: ['freljord', 'the freljord'], color: '#38bdf8', popularity: 26 },
  { id: 'bilgewater', name: 'Bilgewater', aliases: ['bilgewater'], color: '#fb923c', popularity: 34 },
  { id: 'shadow_isles', name: 'Shadow Isles', aliases: ['shadow isles', 'the shadow isles', 'blessed isles'], color: '#2dd4bf', popularity: 40 },
  { id: 'shurima', name: 'Shurima', aliases: ['shurima'], color: '#eab308', popularity: 45 },
  { id: 'void', name: 'The Void', aliases: ['void', 'the void', 'icathia'], color: '#a855f7', popularity: 52 },
  { id: 'targon', name: 'Mount Targon', aliases: ['targon', 'mount targon', 'mt targon'], color: '#818cf8', popularity: 62 },
  { id: 'bandle_city', name: 'Bandle City', aliases: ['bandle city', 'bandle'], color: '#a3e635', popularity: 74 },
  { id: 'ixtal', name: 'Ixtal', aliases: ['ixtal', 'ixaocan'], color: '#10b981', popularity: 92 },
];

/**
 * Canonical Region Membership by Champion ID.
 * Sources: League of Legends Universe official region pages & 16.23.1 championFull lore.
 */
export const REGION_CHAMPIONS: Record<RuneterraRegionId, string[]> = {
  // Demacia: Kingdom of petricite and anti-mage law (plus Corvin Locke, Demacian occultist progeny)
  demacia: [
    'Fiora', 'Galio', 'Garen', 'JarvanIV', 'Kayle', 'Locke', 'Lucian', 'Lux',
    'Morgana', 'Poppy', 'Quinn', 'Shyvana', 'Sona', 'Sylas', 'Vayne', 'XinZhao',
  ],

  // Noxus: Expansionist empire of strength (includes Ambessa, Mel Medarda, Samira, Katarina, etc.)
  noxus: [
    'Ambessa', 'Briar', 'Cassiopeia', 'Darius', 'Draven', 'Katarina', 'Kled',
    'Leblanc', 'Mel', 'Mordekaiser', 'Rell', 'Riven', 'Samira', 'Sion', 'Swain',
    'Talon', 'Vladimir',
  ],

  // Ionia: The First Lands (includes Wukong, Yunara, Hwei, Sett, Lillia, Kinkou & Shadow Order)
  ionia: [
    'Ahri', 'Akali', 'Hwei', 'Irelia', 'Ivern', 'Jhin', 'Karma', 'Kayn',
    'Kennen', 'LeeSin', 'Lillia', 'MasterYi', 'MonkeyKing', 'Rakan', 'Sett',
    'Shen', 'Syndra', 'Varus', 'Xayah', 'Yasuo', 'Yone', 'Yunara', 'Zed',
  ],

  // Piltover: City of Progress (includes Heimerdinger, Orianna, Seraphine, Mel)
  piltover: [
    'Caitlyn', 'Camille', 'Ezreal', 'Heimerdinger', 'Jayce', 'Mel', 'Orianna',
    'Seraphine', 'Vi',
  ],

  // Zaun: The Undercity beneath Piltover
  zaun: [
    'Blitzcrank', 'DrMundo', 'Ekko', 'Janna', 'Jinx', 'Renata', 'Singed',
    'Twitch', 'Urgot', 'Viktor', 'Warwick', 'Zac', 'Zeri', 'Ziggs',
  ],

  // Freljord: Frozen northern wastes (includes Aurora, Udyr, Gnar, Nunu & Willump)
  freljord: [
    'Anivia', 'Ashe', 'Aurora', 'Braum', 'Gnar', 'Gragas', 'Lissandra',
    'Nunu', 'Olaf', 'Ornn', 'Sejuani', 'Trundle', 'Tryndamere', 'Udyr', 'Volibear',
  ],

  // Shurima: Desert empire & Ascended (includes K'Sante, Naafiri, Amumu, Rammus, Taliyah, Samira)
  shurima: [
    'Akshan', 'Amumu', 'Azir', 'KSante', 'Naafiri', 'Nasus', 'Rammus',
    'Renekton', 'Samira', 'Sivir', 'Taliyah', 'Xerath',
  ],

  // Shadow Isles: Ruined archipelago of the Black Mist (includes Viego, Gwen, Senna, Yorick, etc.)
  shadow_isles: [
    'Elise', 'Gwen', 'Hecarim', 'Kalista', 'Karthus', 'Maokai', 'Senna',
    'Thresh', 'Vex', 'Viego', 'Yorick',
  ],

  // Bilgewater: Lawless port city of the Blue Flame Isles
  bilgewater: [
    'Fizz', 'Gangplank', 'Graves', 'Illaoi', 'MissFortune', 'Nautilus',
    'Nilah', 'Pyke', 'TahmKench', 'TwistedFate',
  ],

  // Mount Targon: Celestial mountain of Lunari, Solari & Aspects
  targon: [
    'Aphelios', 'AurelionSol', 'Diana', 'Leona', 'Pantheon', 'Soraka',
    'Taric', 'Zoe',
  ],

  // Bandle City: Spirit-realm home of the Yordles
  bandle_city: [
    'Corki', 'Lulu', 'Rumble', 'Teemo', 'Tristana', 'Veigar', 'Yuumi',
  ],

  // The Void: Unmaking abyss and its Voidborn horrors / touched mortals
  void: [
    'Belveth', 'Chogath', 'Kaisa', 'Kassadin', 'Khazix', 'KogMaw',
    'Malzahar', 'RekSai', 'Velkoz',
  ],

  // Ixtal: Elemental jungle nation of Ixaocan (includes Milio, Qiyana, Skarner, Neeko, etc.)
  ixtal: [
    'Malphite', 'Milio', 'Neeko', 'Nidalee', 'Qiyana', 'Rengar', 'Skarner', 'Zyra',
  ],
};

/**
 * Additional Canonical Lore Groups (Verified Runeterra Lore).
 */
export const LORE_GROUPS = {
  // Yordles: Furry spirit-realm beings native to Bandle City (even if residing elsewhere)
  yordles: [
    'Amumu', 'Corki', 'Fizz', 'Gnar', 'Heimerdinger', 'Kennen', 'Kled',
    'Lulu', 'Poppy', 'Rumble', 'Teemo', 'Tristana', 'Veigar', 'Vex', 'Ziggs',
  ],

  // Darkin: Corrupted Shuriman Ascended bound within weapons (Aatrox, Rhaast/Kayn, Naafiri, Varus, Zaahen)
  darkin: ['Aatrox', 'Kayn', 'Naafiri', 'Varus', 'Zaahen'],

  // Shuriman Ascended (Sunborn) & Baccai-adjacent divine warriors of Shurima
  ascended: ['Azir', 'Nasus', 'Renekton', 'Xerath'],

  // Vastaya: Chimeric spirit-magic race of Runeterra (includes Aurora, Ahri, Rakan, Xayah, Nami, Neeko, Rengar, Sett, Wukong)
  vastaya: ['Ahri', 'Aurora', 'MonkeyKing', 'Nami', 'Neeko', 'Rakan', 'Rengar', 'Sett', 'Xayah'],

  // Champions featured as playable characters in the Arcane animated series
  arcaneCast: [
    'Ambessa', 'Caitlyn', 'Ekko', 'Heimerdinger', 'Jayce', 'Jinx',
    'Mel', 'Singed', 'Vi', 'Viktor', 'Warwick',
  ],

  // Champions with canonical sibling relationships (biological or adopted siblings)
  siblings: [
    'Cassiopeia', 'Darius', 'Draven', 'Garen', 'Jinx', 'Katarina',
    'Kayle', 'Lux', 'Morgana', 'Nasus', 'Renekton', 'Vi', 'Yasuo', 'Yone',
  ],

  // Champions who are canonical Demons or Demon-hosts/Ten Kings in Runeterra
  demons: ['Evelynn', 'Fiddlesticks', 'Nocturne', 'Swain', 'TahmKench', 'Yone'],

  // Champions who are Targonian Aspects or Celestial Hosts
  aspects: ['Diana', 'Leona', 'Pantheon', 'Taric', 'Zoe'],
};

/**
 * Curated Mechanic Ability Lists (16.23.1 Data Dragon verified spell IDs/slots).
 * Format: `${championId}:${slot}` where slot is 'P' | 'Q' | 'W' | 'E' | 'R'.
 */
export const ABILITY_MECHANICS = {
  // True Global-Range Ultimates (can hit or teleport anywhere across the entire map)
  globalUltimates: [
    'Ashe:R',       // Enchanted Crystal Arrow
    'Draven:R',     // Whirling Death
    'Ezreal:R',     // Trueshot Barrage
    'Gangplank:R',  // Cannon Barrage
    'Jinx:R',       // Super Mega Death Rocket!
    'Karthus:R',    // Requiem
    'Senna:R',      // Dawning Shadow
    'Shen:R',       // Stand United
    'Soraka:R',     // Wish
    'Briar:R',      // Certain Death (global skillshot across map)
  ],

  // Semi-Global / Long-Range Map Ultimates (very long range travel/vision ultimates)
  semiGlobalUltimates: [
    'Ashe:R', 'Briar:R', 'Draven:R', 'Ezreal:R', 'Galio:R', 'Gangplank:R',
    'Jinx:R', 'Karthus:R', 'Kled:R', 'Nocturne:R', 'Pantheon:R', 'Ryze:R',
    'Senna:R', 'Shen:R', 'Soraka:R', 'Taliyah:R', 'TwistedFate:R', 'Vex:R',
  ],

  // Abilities that block, destroy, deflect, or become untargetable to projectiles / spells
  projectileDefense: [
    'Yasuo:W',      // Wind Wall
    'Braum:E',      // Unbreakable
    'Samira:W',     // Blade Whirl
    'Mel:W',        // Rebuttal (reflects projectiles!)
    'Fiora:W',      // Riposte
    'Sivir:E',      // Spell Shield
    'Nocturne:W',   // Shroud of Darkness
    'Morgana:E',    // Black Shield
    'Malzahar:P',   // Void Shift
    'Gwen:W',       // Hallowed Mist
    'XinZhao:R',    // Crescent Guard
  ],

  // Abilities that grant Invisibility or Camouflage (Stealth)
  stealthAbilities: [
    'Akali:W',      // Twilight Shroud
    'Aurora:W',     // Across the Veil
    'Evelynn:P',    // Demon Shade
    'Kaisa:E',      // Supercharge (evolved invisibility)
    'Khazix:R',     // Void Assault
    'Leblanc:P',    // Mirror Image
    'MonkeyKing:W', // Warrior Trickster
    'Neeko:W',      // Shapesplitter
    'Pyke:W',       // Ghostwater Dive
    'Qiyana:Q',     // Brush Elemental Wrath
    'Rengar:R',     // Thrill of the Hunt
    'Senna:E',      // Curse of the Black Mist
    'Shaco:Q',      // Deceive
    'Talon:R',      // Shadow Assault
    'Teemo:P',      // Guerrilla Warfare
    'Twitch:Q',     // Ambush
    'Vayne:R',      // Final Hour (with Q)
  ],

  // Abilities that prevent death / revive / grant Invulnerability or Stasis
  deathDefyingAbilities: [
    'Anivia:P',     // Rebirth
    'Bard:R',       // Tempered Fate
    'Kayle:R',      // Divine Judgment
    'Kindred:R',    // Lamb's Respite
    'Lissandra:R',  // Frozen Tomb
    'Taric:R',      // Cosmic Radiance
    'Tryndamere:R', // Undying Rage
    'Zac:P',        // Cell Division
    'Zilean:R',     // Chronoshift
    'Akshan:W',     // Going Rogue (revives allies)
    'Renata:W',     // Bailout
  ],

  // Execute Ultimates (bonus true/missing-HP threshold instant execute)
  executeUltimates: [
    'Akali:R',      // Perfect Execution
    'Chogath:R',    // Feast
    'Darius:R',     // Noxian Guillotine
    'Evelynn:R',    // Last Caress
    'Garen:R',      // Demacian Justice
    'Jinx:R',       // Super Mega Death Rocket!
    'Pyke:R',       // Death From Below
    'Urgot:R',      // Fear Beyond Death
    'Veigar:R',     // Primordial Burst
  ],

  // Terrain-creating abilities (walls, pillars, arenas, bushes)
  terrainAbilities: [
    'Anivia:W',     // Crystallize
    'Azir:R',       // Emperor's Divide
    'Ivern:W',      // Brushmaker
    'JarvanIV:R',   // Cataclysm
    'Ornn:Q',       // Volcanic Rupture
    'Taliyah:R',    // Weaver's Wall
    'Trundle:E',    // Pillar of Ice
    'Veigar:E',     // Event Horizon
    'Yorick:W',     // Dark Procession
  ],

  // Hook / Pull / Displacement grab abilities
  hookPullAbilities: [
    'Blitzcrank:Q', // Rocket Grab
    'Darius:E',     // Apprehend
    'Kled:Q',       // Bear Trap on a Rope
    'Mordekaiser:E',// Death's Grasp
    'Nautilus:Q',   // Dredge Line
    'Pyke:Q',       // Bone Skewer
    'Renata:Q',     // Handshake
    'Sett:E',       // Facebreaker
    'Swain:E',      // Nevermove
    'Thresh:Q',     // Death Sentence
  ],
};

/**
 * Champions who transform or permanently change form / weapon kit.
 */
export const TRANSFORMING_CHAMPIONS = [
  'Belveth', 'Elise', 'Gnar', 'Hwei', 'Jayce', 'Kayn', 'Kled',
  'Nidalee', 'RekSai', 'Shyvana', 'Udyr', 'Viego',
];

/**
 * Champions with a named animal / creature companion or mount on the Rift.
 */
export const COMPANION_OR_MOUNT_CHAMPIONS = [
  'Annie',       // Tibbers
  'Aphelios',    // Alune (twin spirit)
  'Azir',        // Sand Soldiers
  'Cassiopeia',  // No, snake herself
  'Elise',       // Spiderlings
  'Fizz',        // Chomper (shark)
  'Heimerdinger',// Turrets (not creature)
  'Ivern',       // Daisy
  'Kindred',     // Lamb & Wolf
  'Kled',        // Skaarl
  'Lulu',        // Pix
  'Malzahar',    // Voidlings
  'Naafiri',     // Packmates
  'Nunu',        // Willump
  'Orianna',     // The Ball (clockwork)
  'Quinn',       // Valor
  'Rell',        // Ferromancy steed
  'Sejuani',     // Bristle
  'Swain',       // Raum / ravens
  'Yorick',      // Maiden of the Mist & Mist Walkers
  'Yuumi',       // Book
].filter((id) => !['Azir', 'Cassiopeia', 'Heimerdinger', 'Orianna'].includes(id));

/**
 * ============================================================================
 * HAND-TUNED CHAMPION POPULARITY / OBSCURITY LIST (1 .. 100)
 * ============================================================================
 * Lower score = iconic, obvious, first-thought champion (Bronze/Silver).
 * Higher score = obscure, niche, forgotten, or newer deep cut (Master..Challenger).
 */
export const CHAMPION_POPULARITY: Record<string, number> = {
  // Iconic poster faces (1 - 15)
  Yasuo: 3,
  Lux: 4,
  Jinx: 5,
  Ahri: 6,
  Ezreal: 7,
  Teemo: 8,
  LeeSin: 9,
  Zed: 10,
  Garen: 11,
  Darius: 12,
  MissFortune: 13,
  Caitlyn: 14,
  Thresh: 15,

  // Household Rift staples (16 - 35)
  Ashe: 16,
  Vi: 17,
  Ekko: 18,
  MasterYi: 19,
  Morgana: 20,
  Blitzcrank: 21,
  Katarina: 22,
  Vayne: 23,
  Akali: 24,
  Yone: 25,
  KaiSa: 26, // fallback key check below
  Kaisa: 26,
  Lucian: 27,
  Jhin: 28,
  Sylas: 29,
  Irelia: 30,
  Riven: 31,
  Draven: 32,
  Sett: 33,
  Pyke: 34,
  Viego: 35,

  // Very well-known roster (36 - 55)
  Aatrox: 36,
  Syndra: 37,
  Orianna: 38,
  Leona: 39,
  Nautilus: 40,
  Malphite: 41,
  Kayn: 42,
  Senna: 43,
  Seraphine: 44,
  Samira: 45,
  Tristana: 46,
  Fizz: 47,
  TwistedFate: 48,
  Pantheon: 49,
  Sivir: 50,
  Mordekaiser: 51,
  Nasus: 52,
  Jax: 53,
  Diana: 54,
  Viktor: 55,

  // Mid-tier familiarity (56 - 72)
  Veigar: 56,
  Annie: 57,
  Brand: 58,
  Khazix: 59,
  Rengar: 60,
  Soraka: 61,
  Lulu: 62,
  Nami: 63,
  Janna: 64,
  Karma: 65,
  Braum: 66,
  Alistair: 67,
  Alistar: 67,
  Amumu: 68,
  Warwick: 69,
  JarvanIV: 70,
  XinZhao: 71,
  Volibear: 72,
  Fiora: 72,
  Camille: 72,
  Renekton: 71,
  Ekko_alt: 18,
  Jayce: 63,
  Sona: 64,
  Shaco: 62,
  Evelynn: 64,
  Twitch: 65,
  Vladimir: 67,
  Tryndamere: 66,
  Teemo_alt: 8,
  Leblanc: 68,
  Chogath: 69,
  DrMundo: 65,
  Olaf: 70,
  Hecarim: 70,
  Graves: 66,
  Poppy: 71,
  Gnar: 71,
  Gangplank: 68,
  Swain: 69,
  Shen: 68,
  Galio: 72,
  Kayle: 70,
  Cassiopeia: 72,
  Ziggs: 71,
  Xerath: 72,
  Viktor_alt: 55,

  // Deep cuts & rarer picks (73 - 87)
  Nocturne: 73,
  Nunu: 73,
  Nidalee: 74,
  Elise: 75,
  Malzahar: 74,
  Karthus: 74,
  Ryze: 73,
  Azir: 74,
  Aphelios: 75,
  Xayah: 73,
  Rakan: 74,
  Zoe: 75,
  Neeko: 76,
  Qiyana: 77,
  Lillia: 77,
  Yuumi: 62,
  Gwen: 76,
  Vex: 78,
  Zeri: 78,
  Kassadin: 76,
  Talon: 75,
  Bard: 77,
  Kindred: 78,
  TahmKench: 79,
  AurelionSol: 77,
  Fiddlesticks: 76,
  Sejuani: 80,
  Lissandra: 80,
  Gragas: 75,
  MonkeyKing: 76,
  Sion: 77,
  Urgot: 79,
  Trundle: 78,
  Ornn: 77,
  Kennen: 81,
  Rumble: 82,
  Anivia: 80,
  Heimerdinger: 76,
  Singed: 78,
  Zac: 78,
  Maokai: 81,
  Shyvana: 82,
  Zyra: 79,
  Varus: 74,
  Velkoz: 82,
  KogMaw: 83,
  Draven_alt: 32,
  Akshan: 83,
  Briar: 82,
  Smolder: 81,
  Hwei: 83,
  Belveth: 84,
  Nilah: 85,
  KSante: 80,
  Milio: 84,
  Naafiri: 86,
  Aurora: 84,
  Ambessa: 82,
  Mel: 79,

  // Deepest Rift Vault (88 - 100)
  Corki: 88,
  Kalista: 89,
  Kled: 90,
  Quinn: 91,
  RekSai: 92,
  Rell: 91,
  Renata: 90,
  Skarner: 93,
  Taliyah: 89,
  Taric: 89,
  Udyr: 87,
  Yorick: 88,
  Zilean: 91,
  Ivern: 94,
  Illaoi: 88,
  Locke: 96,
  Yunara: 97,
  Zaahen: 98,
};

/**
 * Hand-tuned Item Popularity (1 = iconic staple everyone buys, 100 = obscure niche item).
 */
export const ITEM_POPULARITY: Record<string, number> = {
  // Ubiquitous iconic staples (5 - 25)
  '3031': 6,   // Infinity Edge
  '3089': 7,   // Rabadon's Deathcap
  '3157': 8,   // Zhonya's Hourglass
  '3078': 10,  // Trinity Force
  '3072': 12,  // Bloodthirster
  '3026': 13,  // Guardian Angel
  '3153': 14,  // Blade of The Ruined King
  '1055': 10,  // Doran's Blade
  '1056': 11,  // Doran's Ring
  '1054': 14,  // Doran's Shield
  '2003': 9,   // Health Potion
  '1001': 8,   // Boots
  '3006': 12,  // Berserker's Greaves
  '3020': 13,  // Sorcerer's Shoes
  '3047': 15,  // Plated Steelcaps
  '3111': 16,  // Mercury's Treads
  '3068': 18,  // Sunfire Aegis
  '3075': 19,  // Thornmail
  '3083': 20,  // Warmog's Armor
  '3084': 18,  // Heartsteel
  '6653': 17,  // Liandry's Torment
  '6655': 16,  // Luden's Echo
  '3071': 21,  // Black Cleaver
  '6676': 15,  // The Collector
  '6672': 20,  // Kraken Slayer
  '3142': 22,  // Youmuu's Ghostblade
  '1038': 14,  // B. F. Sword
  '1058': 16,  // Needlessly Large Rod
  '3070': 19,  // Tear of the Goddess
  '3057': 22,  // Sheen
  '3802': 23,  // Lost Chapter
  '3134': 24,  // Serrated Dirk

  // Well-known completed items (26 - 55)
  '3036': 26,  // Lord Dominik's Regards
  '3033': 30,  // Mortal Reminder
  '3046': 28,  // Phantom Dancer
  '3094': 29,  // Rapid Firecannon
  '3085': 31,  // Runaan's Hurricane
  '3087': 32,  // Statikk Shiv
  '3115': 33,  // Nashor's Tooth
  '3116': 34,  // Rylai's Crystal Scepter
  '3100': 35,  // Lich Bane
  '4645': 30,  // Shadowflame
  '3135': 28,  // Void Staff
  '3102': 38,  // Banshee's Veil
  '3065': 37,  // Spirit Visage
  '3110': 39,  // Frozen Heart
  '3143': 42,  // Randuin's Omen
  '3742': 44,  // Dead Man's Plate
  '3053': 35,  // Sterak's Gage
  '6333': 34,  // Death's Dance
  '3156': 40,  // Maw of Malmortius
  '6692': 36,  // Eclipse
  '6610': 38,  // Sundered Sky
  '6631': 41,  // Stridebreaker
  '3074': 37,  // Ravenous Hydra
  '3748': 43,  // Titanic Hydra
  '3003': 36,  // Archangel's Staff
  '3004': 37,  // Manamune
  '6657': 39,  // Rod of Ages
  '3041': 29,  // Mejai's Soulstealer
  '1082': 31,  // Dark Seal
  '2055': 27,  // Control Ward
  '3158': 33,  // Ionian Boots of Lucidity
  '3009': 35,  // Boots of Swiftness
  '6617': 42,  // Moonstone Renewer
  '2065': 46,  // Shurelya's Battlesong
  '3107': 44,  // Redemption
  '3190': 47,  // Locket of the Iron Solari
  '3504': 49,  // Ardent Censer
  '3181': 48,  // Hullbreaker
  '3508': 45,  // Essence Reaver
  '3124': 41,  // Guinsoo's Rageblade
  '3091': 46,  // Wit's End
  '6673': 43,  // Immortal Shieldbow
  '6665': 40,  // Jak'Sho, The Protean
  '3165': 42,  // Morellonomicon

  // Mid-obscurity / situational items (56 - 78)
  '3032': 60,  // Yun Tal Wildarrows
  '3095': 62,  // Stormrazor
  '6675': 63,  // Navori Flickerblade
  '3302': 65,  // Terminus
  '3118': 59,  // Malignance
  '4646': 58,  // Stormsurge
  '3137': 64,  // Cryptbloom
  '4628': 66,  // Horizon Focus
  '4629': 67,  // Cosmic Drive
  '4633': 58,  // Riftmaker
  '2503': 61,  // Blackfire Torch
  '3152': 57,  // Hextech Rocketbelt
  '3146': 62,  // Hextech Gunblade
  '6694': 60,  // Serylda's Grudge
  '6696': 64,  // Axiom Arc
  '6697': 63,  // Hubris
  '6698': 66,  // Profane Hydra
  '6699': 68,  // Voltaic Cyclosword
  '6695': 72,  // Serpent's Fang
  '3179': 71,  // Umbral Glaive
  '3814': 63,  // Edge of Night
  '3139': 69,  // Mercurial Scimitar
  '3161': 60,  // Spear of Shojin
  '3073': 70,  // Experimental Hexplate
  '2501': 73,  // Overlord's Bloodmail
  '2502': 72,  // Unending Despair
  '2504': 69,  // Kaenic Rookern
  '4401': 65,  // Force of Nature
  '6662': 61,  // Iceborn Gauntlet
  '6664': 68,  // Hollow Radiance
  '8020': 74,  // Abyssal Mask
  '8010': 75,  // Bloodletter's Curse
  '3050': 70,  // Zeke's Convergence
  '3109': 68,  // Knight's Vow
  '3222': 74,  // Mikael's Blessing
  '4005': 72,  // Imperial Mandate
  '6616': 73,  // Staff of Flowing Water
  '6620': 76,  // Echoes of Helia
  '6621': 77,  // Dawncore
  '6609': 75,  // Chempunk Chainsword
  '3119': 76,  // Winter's Approach
  '1083': 62,  // Cull
  '2031': 56,  // Refillable Potion

  // Obscure components, support quests, and Season 16 deep cuts (79 - 98)
  '3865': 78,  // World Atlas
  '3869': 83,  // Celestial Opposition
  '3870': 84,  // Dream Maker
  '3871': 81,  // Zaz'Zak's Realmspike
  '3876': 86,  // Solstice Sleigh
  '3877': 82,  // Bloodsong
  '1101': 79,  // Scorchclaw Pup
  '1102': 80,  // Gustwalker Hatchling
  '1103': 81,  // Mosstomper Seedling
  '2138': 79,  // Elixir of Iron
  '2139': 80,  // Elixir of Sorcery
  '2140': 78,  // Elixir of Wrath
  '1086': 91,  // Doran's Bow
  '1120': 92,  // Doran's Helm
  '3008': 90,  // Gluttonous Greaves
  '2510': 88,  // Dusk and Dawn
  '2512': 91,  // Fiendhunter Bolts
  '2517': 90,  // Endless Hunger
  '2520': 93,  // Bastionbreaker
  '2522': 94,  // Actualizer
  '2523': 95,  // Hexoptics C44
  '2524': 89,  // Bandlepipes
  '2525': 94,  // Protoplasm Harness
  '2526': 95,  // Whispering Circlet
  '2020': 87,  // The Brutalizer
  '2022': 89,  // Glowing Mote
  '3168': 95,  // Immortal Path
  '3170': 88,  // Swiftmarch
  '3171': 89,  // Crimson Lucidity
  '3172': 87,  // Gunmetal Greaves
  '3173': 88,  // Chainlaced Crushers
  '3174': 87,  // Armored Advance
  '3175': 89,  // Spellslinger's Shoes
  '6690': 92,  // Rectrix
  '3144': 91,  // Scout's Slingshot
  '2508': 86,  // Fated Ashes
  '2019': 90,  // Steel Sigil
  '2021': 89,  // Tunneler
  '4630': 88,  // Blighting Jewel
  '4632': 87,  // Verdant Barrier
  '4642': 86,  // Bandleglass Mirror
  '3066': 85,  // Winged Moonplate
};

export function getChampionPopularity(championId: string): number {
  return CHAMPION_POPULARITY[championId] ?? 75;
}

export function getItemPopularity(itemId: string): number {
  return ITEM_POPULARITY[itemId] ?? 74;
}
