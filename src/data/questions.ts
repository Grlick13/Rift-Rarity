import type {
  QuestionCategory,
  RiftChampion,
  RiftData,
  RiftItem,
  RiftSkin,
  RiftSpell,
  TriviaQuestion,
  ValidAnswerEntry,
} from '../types/game';
import {
  getChampionSplashUrl,
  getChampionSquareUrl,
  getItemIconUrl,
  getSpellIconUrl,
} from '../services/ddragon';
import {
  ABILITY_MECHANICS,
  COMPANION_OR_MOUNT_CHAMPIONS,
  LORE_GROUPS,
  REGION_CHAMPIONS,
  RUNETERRA_REGIONS,
  TRANSFORMING_CHAMPIONS,
  getChampionPopularity,
  getItemPopularity,
  type RuneterraRegionId,
} from './loreAndFacts';
import {
  getAbilityAliases,
  getChampionAliases,
  getItemAliases,
  normalizeAnswerText,
} from '../utils/matching';

function anOrA(word: string): string {
  return /^[aeiou]/i.test(word.trim()) ? `an ${word}` : `a ${word}`;
}

function championToAnswer(
  c: RiftChampion,
  data: RiftData,
  popularityOverride?: Record<string, number>
): ValidAnswerEntry {
  return {
    id: c.id,
    displayName: c.name,
    subtitle: c.title,
    popularity: popularityOverride?.[c.id] ?? getChampionPopularity(c.id),
    imageKind: 'champion_splash',
    imageUrl: getChampionSplashUrl(c.id, 0),
    fallbackImageUrl: getChampionSquareUrl(data.version, c.imageFull),
    aliases: getChampionAliases(c.id, c.name),
  };
}

function itemToAnswer(
  item: RiftItem,
  data: RiftData,
  popularityOverride?: Record<string, number>
): ValidAnswerEntry {
  return {
    id: item.id,
    displayName: item.name,
    subtitle: item.plaintext || `${item.goldTotal} Gold`,
    popularity: popularityOverride?.[item.id] ?? getItemPopularity(item.id),
    imageKind: 'item_icon',
    imageUrl: getItemIconUrl(data.version, item.imageFull),
    aliases: getItemAliases(item.name),
  };
}

function spellToAnswer(
  spell: RiftSpell,
  data: RiftData,
  popularityBonus = 0
): ValidAnswerEntry {
  const champPop = getChampionPopularity(spell.championId);
  const slotPopBias = spell.slot === 'R' ? -6 : spell.slot === 'Q' ? -2 : spell.slot === 'P' ? 8 : 4;
  const popularity = Math.max(5, Math.min(99, champPop + slotPopBias + popularityBonus));
  return {
    id: spell.id,
    displayName: spell.name,
    subtitle: `${spell.championName} (${spell.slot === 'P' ? 'Passive' : spell.slot})`,
    popularity,
    imageKind: 'ability_icon',
    imageUrl: getSpellIconUrl(data.version, spell.imageFull, spell.slot === 'P'),
    fallbackImageUrl: getChampionSquareUrl(
      data.version,
      data.championsById[spell.championId]?.imageFull ?? ''
    ),
    aliases: getAbilityAliases(spell.name),
  };
}

function resolveSkinLineAnswers(
  data: RiftData,
  matcher: (skin: RiftSkin, champ: RiftChampion) => boolean
): ValidAnswerEntry[] {
  const results: ValidAnswerEntry[] = [];
  for (const champ of data.champions) {
    const matchedSkin = champ.skins.find((s) => s.num > 0 && matcher(s, champ));
    if (!matchedSkin) continue;
    results.push({
      id: `${champ.id}_${matchedSkin.num}`,
      displayName: champ.name,
      subtitle: matchedSkin.name,
      popularity: getChampionPopularity(champ.id),
      imageKind: 'skin_splash',
      imageUrl: getChampionSplashUrl(champ.id, matchedSkin.num),
      fallbackImageUrl: getChampionSplashUrl(champ.id, 0),
      aliases: [
        ...getChampionAliases(champ.id, champ.name),
        normalizeAnswerText(matchedSkin.name),
      ],
    });
  }
  return results;
}

function resolveMechanicSpells(
  data: RiftData,
  refs: string[],
  popularityOverrides?: Record<string, number>
): ValidAnswerEntry[] {
  const entries: ValidAnswerEntry[] = [];
  for (const ref of refs) {
    const [champId, slot] = ref.split(':');
    const champ = data.championsById[champId];
    if (!champ) continue;
    const spell =
      slot === 'P'
        ? champ.passive
        : champ.spells[['Q', 'W', 'E', 'R'].indexOf(slot)];
    if (!spell) continue;
    const base = spellToAnswer(spell, data);
    if (popularityOverrides?.[ref] !== undefined) {
      base.popularity = popularityOverrides[ref];
    }
    entries.push(base);
  }
  return entries;
}

const REGION_DISPLAY: Record<RuneterraRegionId, { label: string; adjective: string }> = {
  demacia: { label: 'Demacia', adjective: 'Demacian' },
  noxus: { label: 'Noxus', adjective: 'Noxian' },
  ionia: { label: 'Ionia', adjective: 'Ionian' },
  piltover: { label: 'Piltover', adjective: 'Piltovan' },
  zaun: { label: 'Zaun', adjective: 'Zaunite' },
  freljord: { label: 'the Freljord', adjective: 'Freljordian' },
  shurima: { label: 'Shurima', adjective: 'Shuriman' },
  shadow_isles: { label: 'the Shadow Isles', adjective: 'Shadow Isles' },
  bilgewater: { label: 'Bilgewater', adjective: 'Bilgewater' },
  targon: { label: 'Mount Targon', adjective: 'Targonian' },
  bandle_city: { label: 'Bandle City', adjective: 'Bandle City' },
  void: { label: 'The Void', adjective: 'Void' },
  ixtal: { label: 'Ixtal', adjective: 'Ixtali' },
};

const SKIN_LINE_DEFS: Array<{
  id: string;
  label: string;
  matcher: (skin: RiftSkin) => boolean;
}> = [
  { id: 'star_guardian', label: 'Star Guardian', matcher: (s) => s.name.includes('Star Guardian') },
  { id: 'project', label: 'PROJECT', matcher: (s) => s.name.includes('PROJECT') },
  { id: 'blood_moon', label: 'Blood Moon', matcher: (s) => s.name.includes('Blood Moon') },
  { id: 'high_noon', label: 'High Noon', matcher: (s) => s.name.includes('High Noon') },
  { id: 'spirit_blossom', label: 'Spirit Blossom', matcher: (s) => s.name.includes('Spirit Blossom') },
  { id: 'pool_party', label: 'Pool Party', matcher: (s) => s.name.includes('Pool Party') },
  { id: 'dark_star', label: 'Dark Star', matcher: (s) => s.name.includes('Dark Star') },
  {
    id: 'coven',
    label: 'Coven',
    matcher: (s) => /\bCoven\b/.test(s.name) && !s.name.includes('Broken Covenant'),
  },
  { id: 'odyssey', label: 'Odyssey', matcher: (s) => s.name.includes('Odyssey') },
  { id: 'battle_academia', label: 'Battle Academia', matcher: (s) => s.name.includes('Battle Academia') },
  { id: 'pulsefire', label: 'Pulsefire', matcher: (s) => s.name.includes('Pulsefire') },
  { id: 'soul_fighter', label: 'Soul Fighter', matcher: (s) => s.name.includes('Soul Fighter') },
  { id: 'winterblessed', label: 'Winterblessed', matcher: (s) => s.name.includes('Winterblessed') },
  { id: 'pentakill', label: 'Pentakill', matcher: (s) => s.name.includes('Pentakill') },
  { id: 'elderwood', label: 'Elderwood', matcher: (s) => s.name.includes('Elderwood') },
  { id: 'space_groove', label: 'Space Groove', matcher: (s) => s.name.includes('Space Groove') },
  { id: 'cafe_cuties', label: 'Cafe Cuties', matcher: (s) => s.name.includes('Cafe Cuties') },
  { id: 'empyrean', label: 'Empyrean', matcher: (s) => s.name.includes('Empyrean') },
  { id: 'faerie_court', label: 'Faerie Court', matcher: (s) => s.name.includes('Faerie Court') },
  { id: 'arcana', label: 'Arcana', matcher: (s) => s.name.includes('Arcana') },
  { id: 'inkshadow', label: 'Inkshadow', matcher: (s) => s.name.includes('Inkshadow') },
  { id: 'bewitching', label: 'Bewitching', matcher: (s) => s.name.includes('Bewitching') },
  { id: 'astronaut', label: 'Astronaut', matcher: (s) => /astronaut/i.test(s.name) },
  { id: 'true_damage', label: 'True Damage', matcher: (s) => s.name.includes('True Damage') },
  { id: 'heartsteel', label: 'HEARTSTEEL', matcher: (s) => s.name.includes('HEARTSTEEL') },
  { id: 'porcelain', label: 'Porcelain', matcher: (s) => s.name.includes('Porcelain') },
  { id: 'broken_covenant', label: 'Broken Covenant', matcher: (s) => s.name.includes('Broken Covenant') },
  { id: 'mecha_kingdoms', label: 'Mecha Kingdoms', matcher: (s) => s.name.includes('Mecha Kingdoms') },
  { id: 'nightbringer', label: 'Nightbringer', matcher: (s) => s.name.includes('Nightbringer') },
  { id: 'dawnbringer', label: 'Dawnbringer', matcher: (s) => s.name.includes('Dawnbringer') },
  { id: 'crime_city', label: 'Crime City', matcher: (s) => s.name.includes('Crime City') },
  { id: 'snow_moon', label: 'Snow Moon', matcher: (s) => s.name.includes('Snow Moon') },
  { id: 'arcade', label: 'Arcade', matcher: (s) => /\bArcade\b/.test(s.name) },
  { id: 'cosmic', label: 'Cosmic', matcher: (s) => /\bCosmic\b/.test(s.name) },
  { id: 'kda', label: 'K/DA', matcher: (s) => s.name.includes('K/DA') },
  { id: 'worlds_t1', label: 'T1 / SKT T1', matcher: (s) => /\b(SKT T1|T1)\b/.test(s.name) },
];

const CHAMPION_ROLES = ['Fighter', 'Mage', 'Assassin', 'Tank', 'Marksman', 'Support'] as const;

const ITEM_TAG_LABELS: Record<string, string> = {
  Damage: 'Attack Damage',
  SpellDamage: 'Ability Power',
  Health: 'Health',
  Armor: 'Armor',
  SpellBlock: 'Magic Resist',
  AttackSpeed: 'Attack Speed',
  CriticalStrike: 'Critical Strike Chance',
  LifeSteal: 'Life Steal',
  Mana: 'Mana',
  ManaRegen: 'Mana Regen',
  HealthRegen: 'Health Regen',
  AbilityHaste: 'Ability Haste',
  ArmorPenetration: 'Armor Penetration',
  MagicPenetration: 'Magic Penetration',
  NonbootsMovement: 'Move Speed (non-Boots)',
  Slow: 'a Slow effect',
  OnHit: 'On-Hit damage',
};

const TITLE_KEYWORDS = [
  'Shadow',
  'Dark',
  'Iron',
  'Blade',
  'Queen',
  'King',
  'Heart',
  'Void',
  'Star',
  'Storm',
  'Hand',
  'Spirit',
  'Blood',
  'Hunter',
  'Master',
  'Lord',
  'Witch',
  'Demon',
  'Dragon',
  'Light',
  'Death',
  'Ice',
  'Stone',
  'Sun',
  'Moon',
  'Flame',
  'Wolf',
  'Soul',
  'Guardian',
  'Warden',
  'Knight',
  'Eye',
  'Fist',
  'Lady',
  'Child',
  'Prince',
  'Fallen',
  'Broken',
];

const ABILITY_KEYWORDS = [
  'Strike',
  'Shadow',
  'Dark',
  'Light',
  'Flame',
  'Fire',
  'Frost',
  'Ice',
  'Blood',
  'Crimson',
  'Soul',
  'Spirit',
  'Blade',
  'Shield',
  'Storm',
  'Wind',
  'Void',
  'Death',
  'Star',
  'Cosmic',
  'Iron',
  'Surge',
  'Blast',
  'Leap',
  'Dash',
  'Bite',
  'Curse',
  'Shot',
  'Wave',
  'Roar',
  'Call',
  'Fury',
  'Wrath',
  'Chain',
  'Pulse',
  'Bolt',
  'Trap',
  'Mark',
  'Veil',
  'Edge',
  'Judgment',
  'Tempest',
  'Barrage',
  'Smash',
  'Slam',
  'Charge',
  'Guard',
  'Rift',
  'Spark',
  'Flash',
  'Bind',
  'Grasp',
  'Slash',
  'Dance',
  'Step',
  'Path',
  'Pierce',
  'Venom',
  'Poison',
  'Arrow',
  'Fang',
  'Hammer',
  'Spear',
  'Nova',
  'Eclipse',
  'Moon',
  'Sun',
  'Heart',
  'Mist',
  'Shatter',
];

/**
 * Curated core questions (completely free of examples or clues).
 */
export const CORE_QUESTIONS: TriviaQuestion[] = [
  {
    id: 'champ_energy',
    category: 'champions',
    subType: 'champ_resource',
    answerKind: 'champion',
    prompt: 'Name a champion who uses Energy as their ability resource.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      data.champions.filter((c) => c.partype === 'Energy').map((c) => championToAnswer(c, data)),
  },
  {
    id: 'champ_resourceless',
    category: 'champions',
    subType: 'champ_resource',
    answerKind: 'champion',
    prompt: 'Name a champion whose abilities cost no resource at all.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      data.champions
        .filter((c) => c.partype === 'None' || c.partype === '')
        .map((c) => championToAnswer(c, data)),
  },
  {
    id: 'champ_fury_rage',
    category: 'champions',
    subType: 'champ_resource',
    answerKind: 'champion',
    prompt: 'Name a champion who uses Fury, Rage, Grit, Heat, Flow, or Ferocity.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      data.champions
        .filter((c) =>
          [
            'Fury',
            'Rage',
            'Grit',
            'Heat',
            'Flow',
            'Ferocity',
            'Courage',
            'Shield',
            'Blood Well',
            'Crimson Rush',
          ].includes(c.partype)
        )
        .map((c) => championToAnswer(c, data)),
  },
  {
    id: 'champ_apostrophe',
    category: 'champions',
    subType: 'champ_name',
    answerKind: 'champion',
    prompt: 'Name a champion whose official name contains an apostrophe.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      data.champions.filter((c) => c.name.includes("'")).map((c) => championToAnswer(c, data)),
  },
  {
    id: 'champ_two_words',
    category: 'champions',
    subType: 'champ_name',
    answerKind: 'champion',
    prompt: 'Name a champion whose official name consists of two or more words.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      data.champions.filter((c) => c.name.trim().includes(' ')).map((c) => championToAnswer(c, data)),
  },
  {
    id: 'champ_double_letters',
    category: 'champions',
    subType: 'champ_name',
    answerKind: 'champion',
    prompt: 'Name a champion whose name contains consecutive identical letters.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      data.champions
        .filter((c) => /([a-z])\1/i.test(c.name.replace(/\s+/g, '')))
        .map((c) => championToAnswer(c, data)),
  },
  {
    id: 'champ_transform',
    category: 'champions',
    subType: 'champ_mechanic',
    answerKind: 'champion',
    prompt: 'Name a champion who transforms or swaps between distinct forms or weapon kits.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      TRANSFORMING_CHAMPIONS.map((id) => data.championsById[id])
        .filter((c): c is RiftChampion => Boolean(c))
        .map((c) => championToAnswer(c, data, { Jayce: 28, Nidalee: 30, Kayn: 20, Gnar: 42 })),
  },
  {
    id: 'champ_companion',
    category: 'champions',
    subType: 'champ_mechanic',
    answerKind: 'champion',
    prompt: 'Name a champion who fights alongside a named creature, spirit companion, or mount.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      COMPANION_OR_MOUNT_CHAMPIONS.map((id) => data.championsById[id])
        .filter((c): c is RiftChampion => Boolean(c))
        .map((c) => championToAnswer(c, data, { Annie: 20, Yuumi: 14, Nunu: 25, Lulu: 28, Kindred: 40 })),
  },
  {
    id: 'champ_high_range',
    category: 'champions',
    subType: 'champ_stat',
    answerKind: 'champion',
    prompt: 'Name a champion with 600 or more base attack range at level 1.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      data.champions
        .filter((c) => (c.stats.attackrange ?? 0) >= 600)
        .map((c) => championToAnswer(c, data, { Caitlyn: 8, Ashe: 18, Annie: 55, Senna: 48, Anivia: 82 })),
  },
  {
    id: 'champ_fast_ms',
    category: 'champions',
    subType: 'champ_stat',
    answerKind: 'champion',
    prompt: 'Name a champion with 345 or higher base Movement Speed.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      data.champions
        .filter((c) => (c.stats.movespeed ?? 0) >= 345)
        .map((c) => championToAnswer(c, data)),
  },
  {
    id: 'champ_slow_ms',
    category: 'champions',
    subType: 'champ_stat',
    answerKind: 'champion',
    prompt: 'Name a champion with 325 or lower base Movement Speed.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      data.champions
        .filter((c) => (c.stats.movespeed ?? 999) <= 325)
        .map((c) => championToAnswer(c, data)),
  },

  // Abilities (Curated mechanics — ZERO examples!)
  {
    id: 'abil_global_ult',
    category: 'abilities',
    subType: 'abil_mechanic',
    answerKind: 'ability',
    prompt: 'Name a true Global Ultimate (R) ability that reaches anywhere on Summoner’s Rift.',
    hint: 'Type an ability name.',
    resolveAnswers: (data) =>
      resolveMechanicSpells(data, ABILITY_MECHANICS.globalUltimates, {
        'Karthus:R': 10,
        'Ashe:R': 14,
        'Jinx:R': 16,
        'Ezreal:R': 22,
        'Shen:R': 28,
        'Soraka:R': 35,
        'Gangplank:R': 48,
        'Draven:R': 56,
        'Senna:R': 64,
        'Briar:R': 88,
      }),
  },
  {
    id: 'abil_semi_global',
    category: 'abilities',
    subType: 'abil_mechanic',
    answerKind: 'ability',
    prompt: 'Name any Global or Long-Range Semi-Global Ultimate (R) ability.',
    hint: 'Type an ability name.',
    resolveAnswers: (data) =>
      resolveMechanicSpells(data, ABILITY_MECHANICS.semiGlobalUltimates, {
        'Karthus:R': 10,
        'Ashe:R': 15,
        'Jinx:R': 18,
        'Nocturne:R': 26,
        'TwistedFate:R': 34,
        'Pantheon:R': 42,
        'Galio:R': 54,
        'Taliyah:R': 78,
        'Ryze:R': 72,
        'Kled:R': 86,
        'Briar:R': 90,
      }),
  },
  {
    id: 'abil_projectile_defense',
    category: 'abilities',
    subType: 'abil_mechanic',
    answerKind: 'ability',
    prompt: 'Name an ability that blocks, destroys, reflects, or spell-shields incoming projectiles.',
    hint: 'Type an ability name.',
    resolveAnswers: (data) =>
      resolveMechanicSpells(data, ABILITY_MECHANICS.projectileDefense, {
        'Yasuo:W': 4,
        'Morgana:E': 16,
        'Sivir:E': 22,
        'Fiora:W': 28,
        'Braum:E': 36,
        'Samira:W': 42,
        'Mel:W': 58,
        'Nocturne:W': 66,
        'Gwen:W': 72,
        'Malzahar:P': 84,
        'XinZhao:R': 90,
      }),
  },
  {
    id: 'abil_stealth',
    category: 'abilities',
    subType: 'abil_mechanic',
    answerKind: 'ability',
    prompt: 'Name an ability that grants Invisibility or Camouflage.',
    hint: 'Type an ability name.',
    resolveAnswers: (data) =>
      resolveMechanicSpells(data, ABILITY_MECHANICS.stealthAbilities, {
        'Akali:W': 10,
        'Shaco:Q': 16,
        'Twitch:Q': 22,
        'Evelynn:P': 28,
        'Teemo:P': 34,
        'Rengar:R': 42,
        'Khazix:R': 46,
        'Pyke:W': 54,
        'Talon:R': 60,
        'Kaisa:E': 68,
        'MonkeyKing:W': 74,
        'Senna:E': 78,
        'Neeko:W': 84,
        'Aurora:W': 90,
      }),
  },
  {
    id: 'abil_death_defy',
    category: 'abilities',
    subType: 'abil_mechanic',
    answerKind: 'ability',
    prompt: 'Name an ability that prevents death, revives a champion, or grants Stasis/Invulnerability.',
    hint: 'Type an ability name.',
    resolveAnswers: (data) =>
      resolveMechanicSpells(data, ABILITY_MECHANICS.deathDefyingAbilities, {
        'Tryndamere:R': 10,
        'Kayle:R': 18,
        'Kindred:R': 25,
        'Zilean:R': 32,
        'Bard:R': 42,
        'Taric:R': 56,
        'Anivia:P': 64,
        'Lissandra:R': 70,
        'Zac:P': 78,
        'Renata:W': 86,
        'Akshan:W': 91,
      }),
  },
  {
    id: 'abil_execute_ult',
    category: 'abilities',
    subType: 'abil_mechanic',
    answerKind: 'ability',
    prompt: 'Name an Ultimate (R) ability famous for its missing-HP or threshold Execute.',
    hint: 'Type an ability name.',
    resolveAnswers: (data) =>
      resolveMechanicSpells(data, ABILITY_MECHANICS.executeUltimates, {
        'Darius:R': 8,
        'Garen:R': 12,
        'Pyke:R': 18,
        'Chogath:R': 28,
        'Urgot:R': 38,
        'Jinx:R': 48,
        'Veigar:R': 58,
        'Akali:R': 68,
        'Evelynn:R': 76,
      }),
  },
  {
    id: 'abil_terrain',
    category: 'abilities',
    subType: 'abil_mechanic',
    answerKind: 'ability',
    prompt: 'Name an ability that creates terrain, impassable walls, pillars, or new brush.',
    hint: 'Type an ability name.',
    resolveAnswers: (data) =>
      resolveMechanicSpells(data, ABILITY_MECHANICS.terrainAbilities, {
        'JarvanIV:R': 14,
        'Anivia:W': 24,
        'Taliyah:R': 34,
        'Azir:R': 42,
        'Trundle:E': 52,
        'Veigar:E': 60,
        'Yorick:W': 72,
        'Ornn:Q': 82,
        'Ivern:W': 90,
      }),
  },
  {
    id: 'abil_hooks',
    category: 'abilities',
    subType: 'abil_mechanic',
    answerKind: 'ability',
    prompt: 'Name a hook, pull, or grab ability that yanks enemies toward you.',
    hint: 'Type an ability name.',
    resolveAnswers: (data) =>
      resolveMechanicSpells(data, ABILITY_MECHANICS.hookPullAbilities, {
        'Blitzcrank:Q': 5,
        'Thresh:Q': 12,
        'Nautilus:Q': 22,
        'Pyke:Q': 30,
        'Darius:E': 42,
        'Mordekaiser:E': 56,
        'Swain:E': 68,
        'Sett:E': 76,
        'Kled:Q': 86,
        'Renata:Q': 92,
      }),
  },
  {
    id: 'abil_one_word_ult',
    category: 'abilities',
    subType: 'abil_pattern',
    answerKind: 'ability',
    prompt: 'Name an Ultimate (R) ability whose official name is a single word.',
    hint: 'Type an ability name.',
    resolveAnswers: (data) =>
      data.champions
        .map((c) => c.spells[3])
        .filter((s) => s && !/[\s\-|]/.test(s.name.trim()))
        .map((s) => spellToAnswer(s, data)),
  },
  {
    id: 'abil_exclaim_ult',
    category: 'abilities',
    subType: 'abil_pattern',
    answerKind: 'ability',
    prompt: 'Name an Ultimate (R) ability whose official name ends with an exclamation mark.',
    hint: 'Type an ability name.',
    resolveAnswers: (data) =>
      data.champions
        .map((c) => c.spells[3])
        .filter((s) => s && s.name.trim().endsWith('!'))
        .map((s) => spellToAnswer(s, data)),
  },
  {
    id: 'abil_colon',
    category: 'abilities',
    subType: 'abil_pattern',
    answerKind: 'ability',
    prompt: 'Name any champion ability whose official name contains a colon (:).',
    hint: 'Type an ability name.',
    resolveAnswers: (data) =>
      data.champions
        .flatMap((c) => [c.passive, ...c.spells])
        .filter((s) => s.name.includes(':'))
        .map((s) => spellToAnswer(s, data)),
  },
  {
    id: 'abil_long_cd_ult',
    category: 'abilities',
    subType: 'abil_pattern',
    answerKind: 'ability',
    prompt: 'Name an Ultimate (R) ability with a Rank-1 base cooldown of 140 seconds or longer.',
    hint: 'Type an ability name.',
    resolveAnswers: (data) =>
      data.champions
        .map((c) => c.spells[3])
        .filter((s) => s && (s.cooldown[0] ?? 0) >= 140)
        .map((s) => spellToAnswer(s, data)),
  },
  {
    id: 'abil_short_cd_ult',
    category: 'abilities',
    subType: 'abil_pattern',
    answerKind: 'ability',
    prompt: 'Name an Ultimate (R) ability with a Rank-1 base cooldown of 80 seconds or shorter.',
    hint: 'Type an ability name.',
    resolveAnswers: (data) =>
      data.champions
        .map((c) => c.spells[3])
        .filter((s) => s && (s.cooldown[0] ?? 999) > 0 && (s.cooldown[0] ?? 999) <= 80)
        .map((s) => spellToAnswer(s, data)),
  },

  // Items (Curated — ZERO examples!)
  {
    id: 'item_boots_upgrade',
    category: 'items',
    subType: 'item_category',
    answerKind: 'item',
    prompt: 'Name a Summoner’s Rift Boots upgrade (Tier 2 or Tier 3, excluding base Boots).',
    hint: 'Type an item name.',
    resolveAnswers: (data) =>
      data.items.filter((i) => i.tags.includes('Boots') && i.id !== '1001').map((i) => itemToAnswer(i, data)),
  },
  {
    id: 'item_active',
    category: 'items',
    subType: 'item_category',
    answerKind: 'item',
    prompt: 'Name a Summoner’s Rift item that has an Active effect.',
    hint: 'Type an item name.',
    resolveAnswers: (data) =>
      data.items
        .filter((i) => i.description.includes('<active>') || i.tags.includes('Active'))
        .map((i) => itemToAnswer(i, data)),
  },
  {
    id: 'item_starter_lane',
    category: 'items',
    subType: 'item_category',
    answerKind: 'item',
    prompt: 'Name a Summoner’s Rift starting item.',
    hint: 'Type an item name.',
    resolveAnswers: (data) =>
      data.items
        .filter((i) =>
          ['1054', '1055', '1056', '1086', '1120', '1082', '1083', '1101', '1102', '1103', '3865'].includes(
            i.id
          )
        )
        .map((i) => itemToAnswer(i, data)),
  },
  {
    id: 'item_support_quest',
    category: 'items',
    subType: 'item_category',
    answerKind: 'item',
    prompt: 'Name a Summoner’s Rift Support Quest item or one of its upgrades.',
    hint: 'Type an item name.',
    resolveAnswers: (data) =>
      data.items
        .filter((i) => ['3865', '3869', '3870', '3871', '3876', '3877'].includes(i.id))
        .map((i) => itemToAnswer(i, data)),
  },
  {
    id: 'item_consumable',
    category: 'items',
    subType: 'item_category',
    answerKind: 'item',
    prompt: 'Name a Summoner’s Rift Consumable item.',
    hint: 'Type an item name.',
    resolveAnswers: (data) =>
      data.items.filter((i) => i.tags.includes('Consumable')).map((i) => itemToAnswer(i, data)),
  },
  {
    id: 'item_apostrophe',
    category: 'items',
    subType: 'item_name',
    answerKind: 'item',
    prompt: 'Name a Summoner’s Rift item whose name contains an apostrophe.',
    hint: 'Type an item name.',
    resolveAnswers: (data) =>
      data.items.filter((i) => i.name.includes("'")).map((i) => itemToAnswer(i, data)),
  },

  // Lore (Curated — ZERO examples!)
  {
    id: 'lore_yordles',
    category: 'lore',
    subType: 'lore_group',
    answerKind: 'champion',
    prompt: 'Name a champion who is canonically a Yordle.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      LORE_GROUPS.yordles
        .map((id) => data.championsById[id])
        .filter((c): c is RiftChampion => Boolean(c))
        .map((c) => championToAnswer(c, data, { Teemo: 5, Tristana: 22, Lulu: 28, Veigar: 25 })),
  },
  {
    id: 'lore_darkin',
    category: 'lore',
    subType: 'lore_group',
    answerKind: 'champion',
    prompt: 'Name a champion who is a Darkin or hosts a Darkin weapon.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      LORE_GROUPS.darkin
        .map((id) => data.championsById[id])
        .filter((c): c is RiftChampion => Boolean(c))
        .map((c) => championToAnswer(c, data, { Aatrox: 12, Kayn: 20, Varus: 48, Naafiri: 78, Zaahen: 98 })),
  },
  {
    id: 'lore_ascended',
    category: 'lore',
    subType: 'lore_group',
    answerKind: 'champion',
    prompt: 'Name a Shuriman Ascended (Sunborn) champion.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      LORE_GROUPS.ascended
        .map((id) => data.championsById[id])
        .filter((c): c is RiftChampion => Boolean(c))
        .map((c) => championToAnswer(c, data)),
  },
  {
    id: 'lore_vastaya',
    category: 'lore',
    subType: 'lore_group',
    answerKind: 'champion',
    prompt: 'Name a champion who is canonically a Vastaya.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      LORE_GROUPS.vastaya
        .map((id) => data.championsById[id])
        .filter((c): c is RiftChampion => Boolean(c))
        .map((c) => championToAnswer(c, data)),
  },
  {
    id: 'lore_arcane_cast',
    category: 'lore',
    subType: 'lore_group',
    answerKind: 'champion',
    prompt: 'Name a League champion who appears as a major character in Arcane.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      LORE_GROUPS.arcaneCast
        .map((id) => data.championsById[id])
        .filter((c): c is RiftChampion => Boolean(c))
        .map((c) => championToAnswer(c, data, { Jinx: 4, Vi: 6, Caitlyn: 12, Jayce: 18, Viktor: 22, Ekko: 24 })),
  },
  {
    id: 'lore_siblings',
    category: 'lore',
    subType: 'lore_group',
    answerKind: 'champion',
    prompt: 'Name a champion who has a canonical sibling who is also a playable champion.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      LORE_GROUPS.siblings
        .map((id) => data.championsById[id])
        .filter((c): c is RiftChampion => Boolean(c))
        .map((c) => championToAnswer(c, data)),
  },
  {
    id: 'lore_demons',
    category: 'lore',
    subType: 'lore_group',
    answerKind: 'champion',
    prompt: 'Name a champion who is canonically a Demon, Azakana-fused, or bound to one of the Ten Kings.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      LORE_GROUPS.demons
        .map((id) => data.championsById[id])
        .filter((c): c is RiftChampion => Boolean(c))
        .map((c) =>
          championToAnswer(c, data, {
            Evelynn: 20,
            Fiddlesticks: 24,
            TahmKench: 46,
            Nocturne: 52,
            Yone: 68,
            Swain: 80,
          })
        ),
  },
  {
    id: 'lore_aspects',
    category: 'lore',
    subType: 'lore_group',
    answerKind: 'champion',
    prompt: 'Name a champion who is a Targonian Aspect or Celestial Host.',
    hint: 'Type a champion name.',
    resolveAnswers: (data) =>
      LORE_GROUPS.aspects
        .map((id) => data.championsById[id])
        .filter((c): c is RiftChampion => Boolean(c))
        .map((c) => championToAnswer(c, data)),
  },
  {
    id: 'lore_runeterra_region_name',
    category: 'lore',
    subType: 'lore_region_name',
    answerKind: 'region',
    prompt: 'Name one of the 13 major regions of Runeterra.',
    hint: 'Type a Runeterra region name.',
    resolveAnswers: (data) => {
      const emblemChamp: Record<RuneterraRegionId, string> = {
        demacia: 'Garen',
        noxus: 'Darius',
        ionia: 'Irelia',
        piltover: 'Caitlyn',
        zaun: 'Jinx',
        freljord: 'Ashe',
        bilgewater: 'MissFortune',
        shadow_isles: 'Thresh',
        shurima: 'Azir',
        void: 'Velkoz',
        targon: 'Leona',
        bandle_city: 'Teemo',
        ixtal: 'Qiyana',
      };
      return RUNETERRA_REGIONS.map((reg) => {
        const champ = data.championsById[emblemChamp[reg.id]];
        return {
          id: reg.id,
          displayName: reg.name,
          subtitle: 'Runeterra Region',
          popularity: reg.popularity,
          imageKind: 'region_crest' as const,
          imageUrl: champ ? getChampionSplashUrl(champ.id, 0) : '',
          fallbackImageUrl: champ ? getChampionSquareUrl(data.version, champ.imageFull) : undefined,
          aliases: reg.aliases.map(normalizeAnswerText),
        };
      });
    },
  },
];

let cachedPoolVersion: string | null = null;
let cachedPool: TriviaQuestion[] = [];

const TRUE_LONG_RANGE_SPELLS = new Set([
  'Ashe:E',
  'Ashe:R',
  'Briar:R',
  'Draven:R',
  'Ezreal:R',
  'Gangplank:R',
  'Janna:W',
  'Jhin:R',
  'Jinx:R',
  'Karthus:R',
  'Senna:R',
  'Shen:R',
  'Soraka:R',
  'TwistedFate:Q',
  'Ziggs:R',
]);

function isRangedSpell(s: RiftSpell): boolean {
  const r = s.range?.[0] ?? 0;
  if (TRUE_LONG_RANGE_SPELLS.has(`${s.championId}:${s.slot}`)) return true;
  // Ignore Riot's 25000/4294967295 engine sentinels unless whitelisted above
  return r >= 550 && r <= 12000;
}

function isLongRangeSpell(s: RiftSpell): boolean {
  const r = s.range?.[0] ?? 0;
  if (TRUE_LONG_RANGE_SPELLS.has(`${s.championId}:${s.slot}`)) return true;
  return r >= 1000 && r <= 12000;
}

function isCloseRangeSpell(s: RiftSpell): boolean {
  const r = s.range?.[0] ?? 0;
  return r > 0 && r <= 425;
}

const SPELL_MECHANIC_FILTERS: Array<{
  id: string;
  label: string;
  promptPhrase: string;
  test: (s: RiftSpell) => boolean;
}> = [
  {
    id: 'ranged',
    label: 'ranged',
    promptPhrase: 'is ranged (550+ range)',
    test: isRangedSpell,
  },
  {
    id: 'long_range',
    label: 'long-range',
    promptPhrase: 'is long-range (1,000+ range)',
    test: isLongRangeSpell,
  },
  {
    id: 'close_range',
    label: 'close-range',
    promptPhrase: 'is close-range (425 range or less)',
    test: isCloseRangeSpell,
  },
  {
    id: 'stun',
    label: 'Stun',
    promptPhrase: 'Stuns enemies',
    test: (s) => /<status>Stun/i.test(s.tooltip),
  },
  {
    id: 'root',
    label: 'Root',
    promptPhrase: 'Roots or Snares enemies',
    test: (s) => /<status>(Root|Snare)/i.test(s.tooltip),
  },
  {
    id: 'slow',
    label: 'Slow',
    promptPhrase: 'Slows enemies',
    test: (s) =>
      /<status>Slow/i.test(s.tooltip) && !/removes? all <status>Slow/i.test(s.tooltip),
  },
  {
    id: 'knock',
    label: 'Knock-up / Displacement',
    promptPhrase: 'Knocks enemies up, back, or pulls them',
    test: (s) => /<status>(Knock|Airborne|Pull|Displacement)/i.test(s.tooltip),
  },
  {
    id: 'hard_cc',
    label: 'Hard Crowd Control',
    promptPhrase: 'applies Hard Crowd Control (Stun, Root, Knock-up, Charm, Fear, or Taunt)',
    test: (s) =>
      /<status>(Stun|Root|Snare|Knock|Airborne|Charm|Fear|Taunt|Sleep|Suppress|Polymorph)/i.test(
        s.tooltip
      ),
  },
  {
    id: 'shield',
    label: 'Shield',
    promptPhrase: 'grants a Shield',
    test: (s) => /<shield>/i.test(s.tooltip),
  },
  {
    id: 'heal',
    label: 'Heal',
    promptPhrase: 'Heals or restores Health',
    test: (s) => /<healing>/i.test(s.tooltip),
  },
  {
    id: 'dash',
    label: 'Dash / Leap / Blink',
    promptPhrase: 'includes a Dash, Leap, Lunge, or Blink',
    test: (s) => /\bdash(es|ing)?\b|\bleaps?\b|\blunges?\b|\bblinks?\b/i.test(s.description),
  },
  {
    id: 'speed',
    label: 'Move Speed',
    promptPhrase: 'grants bonus Move Speed',
    test: (s) => /<speed>/i.test(s.tooltip),
  },
  {
    id: 'attack_speed',
    label: 'Attack Speed',
    promptPhrase: 'grants bonus Attack Speed',
    test: (s) => /<attackSpeed>/i.test(s.tooltip),
  },
  {
    id: 'true_damage',
    label: 'True Damage',
    promptPhrase: 'deals True Damage',
    test: (s) => /<trueDamage>/i.test(s.tooltip),
  },
  {
    id: 'magic_damage',
    label: 'Magic Damage',
    promptPhrase: 'deals Magic Damage',
    test: (s) => /<magicDamage>/i.test(s.tooltip),
  },
  {
    id: 'physical_damage',
    label: 'Physical Damage',
    promptPhrase: 'deals Physical Damage',
    test: (s) => /<physicalDamage>/i.test(s.tooltip),
  },
];

/**
 * Procedurally builds a broad, general, clue-free trivia pool directly from
 * live Riot Data Dragon data — focusing on wide categories where players can
 * think of obvious picks or hunt for deep-cut Challenger answers.
 */
export function buildQuestionPool(data: RiftData): TriviaQuestion[] {
  if (cachedPoolVersion === data.version && cachedPool.length > 0) {
    return cachedPool;
  }

  const pool: TriviaQuestion[] = [];
  const seenIds = new Set<string>();

  const tryAdd = (q: TriviaQuestion, minAnswers = 8) => {
    if (seenIds.has(q.id)) return;
    const answers = q.resolveAnswers(data);
    if (answers.length >= minAnswers) {
      seenIds.add(q.id);
      pool.push(q);
    }
  };

  // 1. Core handcrafted questions (allow >= 4 for curated lore groups like Darkin/Ascended)
  for (const q of CORE_QUESTIONS) tryAdd(q, 4);

  // 2. Champions: Starting letters A-Z (broad letters >= 6 champions)
  for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    tryAdd(
      {
        id: `champ_starts_${ch}`,
        category: 'champions',
        subType: 'champ_letter_start',
        answerKind: 'champion',
        prompt: `Name a champion whose name begins with the letter ${ch}.`,
        hint: 'Type a champion name.',
        resolveAnswers: (d) =>
          d.champions
            .filter((c) => c.name.toUpperCase().startsWith(ch))
            .map((c) => championToAnswer(c, d)),
      },
      6
    );
    tryAdd(
      {
        id: `champ_ends_${ch}`,
        category: 'champions',
        subType: 'champ_letter_end',
        answerKind: 'champion',
        prompt: `Name a champion whose name ends with the letter ${ch}.`,
        hint: 'Type a champion name.',
        resolveAnswers: (d) =>
          d.champions
            .filter((c) => c.name.toUpperCase().endsWith(ch))
            .map((c) => championToAnswer(c, d)),
      },
      6
    );
  }

  // 3. Champions: Name lengths
  for (const len of [4, 5, 6, 7, 8, 9]) {
    tryAdd({
      id: `champ_len_${len}`,
      category: 'champions',
      subType: 'champ_length',
      answerKind: 'champion',
      prompt:
        len === 4
          ? 'Name a champion whose official name is 4 letters or fewer.'
          : len === 9
          ? 'Name a champion whose official name is 9 letters or longer.'
          : `Name a champion whose official name is exactly ${len} letters long.`,
      hint: 'Type a champion name.',
      resolveAnswers: (d) =>
        d.champions
          .filter((c) => {
            const count = c.name.replace(/[^a-zA-Z]/g, '').length;
            return len === 4 ? count <= 4 : len === 9 ? count >= 9 : count === len;
          })
          .map((c) => championToAnswer(c, d)),
    });
  }

  // 4. Champions: Roles, Melee/Ranged Role splits, Role x Resource, & Dual-Roles
  for (let i = 0; i < CHAMPION_ROLES.length; i++) {
    const roleA = CHAMPION_ROLES[i];
    tryAdd({
      id: `champ_role_${roleA}`,
      category: 'champions',
      subType: 'champ_role',
      answerKind: 'champion',
      prompt: `Name a champion tagged as ${anOrA(roleA)} in Riot’s roster.`,
      hint: 'Type a champion name.',
      resolveAnswers: (d) =>
        d.champions.filter((c) => c.tags.includes(roleA)).map((c) => championToAnswer(c, d)),
    });

    tryAdd({
      id: `champ_role_melee_${roleA}`,
      category: 'champions',
      subType: 'champ_role_range',
      answerKind: 'champion',
      prompt: `Name a Melee champion tagged as ${anOrA(roleA)}.`,
      hint: 'Type a champion name.',
      resolveAnswers: (d) =>
        d.champions
          .filter((c) => c.tags.includes(roleA) && (c.stats.attackrange ?? 0) <= 350)
          .map((c) => championToAnswer(c, d)),
    });

    tryAdd({
      id: `champ_role_ranged_${roleA}`,
      category: 'champions',
      subType: 'champ_role_range',
      answerKind: 'champion',
      prompt: `Name a Ranged champion tagged as ${anOrA(roleA)}.`,
      hint: 'Type a champion name.',
      resolveAnswers: (d) =>
        d.champions
          .filter((c) => c.tags.includes(roleA) && (c.stats.attackrange ?? 0) > 350)
          .map((c) => championToAnswer(c, d)),
    });

    tryAdd({
      id: `champ_role_${roleA}_nomana`,
      category: 'champions',
      subType: 'champ_role_resource',
      answerKind: 'champion',
      prompt: `Name ${anOrA(roleA)} champion who does not use Mana.`,
      hint: 'Type a champion name.',
      resolveAnswers: (d) =>
        d.champions
          .filter((c) => c.tags.includes(roleA) && c.partype !== 'Mana')
          .map((c) => championToAnswer(c, d)),
    });

    tryAdd({
      id: `champ_role_${roleA}_mana`,
      category: 'champions',
      subType: 'champ_role_resource',
      answerKind: 'champion',
      prompt: `Name ${anOrA(roleA)} champion who uses Mana.`,
      hint: 'Type a champion name.',
      resolveAnswers: (d) =>
        d.champions
          .filter((c) => c.tags.includes(roleA) && c.partype === 'Mana')
          .map((c) => championToAnswer(c, d)),
    });

    for (let j = i + 1; j < CHAMPION_ROLES.length; j++) {
      const roleB = CHAMPION_ROLES[j];
      tryAdd({
        id: `champ_roles_${roleA}_${roleB}`,
        category: 'champions',
        subType: 'champ_dual_role',
        answerKind: 'champion',
        prompt: `Name a champion tagged as BOTH ${roleA} and ${roleB}.`,
        hint: 'Type a champion name.',
        resolveAnswers: (d) =>
          d.champions
            .filter((c) => c.tags.includes(roleA) && c.tags.includes(roleB))
            .map((c) => championToAnswer(c, d)),
      });
    }
  }

  // 5. Champions: Base Stat Milestones & Skin Counts (general roster buckets)
  for (const [statId, label, pred] of [
    ['high_hp', '640 or more base Health at level 1', (c: RiftChampion) => (c.stats.hp ?? 0) >= 640],
    ['low_hp', '530 or less base Health at level 1', (c: RiftChampion) => (c.stats.hp ?? 9999) <= 530],
    ['high_armor', '37 or more base Armor at level 1', (c: RiftChampion) => (c.stats.armor ?? 0) >= 37],
    ['low_armor', '22 or less base Armor at level 1', (c: RiftChampion) => (c.stats.armor ?? 999) <= 22],
    ['high_ad', '66 or more base Attack Damage at level 1', (c: RiftChampion) => (c.stats.attackdamage ?? 0) >= 66],
    ['many_skins_14', '14 or more skins in total (excluding default)', (c: RiftChampion) => c.skins.filter((s) => s.num > 0).length >= 14],
    ['few_skins_6', '6 or fewer skins in total (excluding default)', (c: RiftChampion) => c.skins.filter((s) => s.num > 0).length <= 6],
  ] as [string, string, (c: RiftChampion) => boolean][]) {
    tryAdd({
      id: `champ_stat_${statId}`,
      category: 'champions',
      subType: 'champ_stat_milestone',
      answerKind: 'champion',
      prompt: `Name a champion with ${label}.`,
      hint: 'Type a champion name.',
      resolveAnswers: (d) => d.champions.filter(pred).map((c) => championToAnswer(c, d)),
    });
  }

  // 6. Champions: Official Title Keywords (wide buckets >= 6)
  for (const kw of TITLE_KEYWORDS) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    tryAdd(
      {
        id: `champ_title_${kw.toLowerCase()}`,
        category: 'champions',
        subType: 'champ_title',
        answerKind: 'champion',
        prompt: `Name a champion whose official title contains the word "${kw}".`,
        hint: 'Type a champion name.',
        resolveAnswers: (d) =>
          d.champions.filter((c) => regex.test(c.title)).map((c) => championToAnswer(c, d)),
      },
      6
    );
  }

  // 7. Abilities: General Mechanics (Ranged, CC, Shields, Heals, Dashes, Damage Types)
  for (const mech of SPELL_MECHANIC_FILTERS) {
    tryAdd({
      id: `abil_mech_${mech.id}`,
      category: 'abilities',
      subType: 'abil_mechanic_general',
      answerKind: 'ability',
      prompt: `Name any champion ability (Q, W, E, or R) that ${mech.promptPhrase}.`,
      hint: 'Type an ability name.',
      resolveAnswers: (d) =>
        d.champions
          .flatMap((c) => c.spells)
          .filter(mech.test)
          .map((s) => spellToAnswer(s, d)),
    });

    // Mechanic x Champion Role (e.g., "Name a ranged ability belonging to a Mage champion.")
    for (const role of CHAMPION_ROLES) {
      tryAdd(
        {
          id: `abil_mech_${mech.id}_role_${role}`,
          category: 'abilities',
          subType: `abil_mech_${mech.id}_role`,
          answerKind: 'ability',
          prompt:
            mech.id === 'ranged' || mech.id === 'long_range' || mech.id === 'close_range'
              ? `Name ${anOrA(mech.label)} skill belonging to ${anOrA(role)} champion.`
              : `Name ${anOrA(role)} ability that ${mech.promptPhrase}.`,
          hint: 'Type an ability name.',
          resolveAnswers: (d) =>
            d.champions
              .filter((c) => c.tags.includes(role))
              .flatMap((c) => c.spells)
              .filter(mech.test)
              .map((s) => spellToAnswer(s, d)),
        },
        10
      );
    }

    // Mechanic x Ability Slot (Q, W, E, R)
    for (const slot of ['Q', 'W', 'E', 'R'] as const) {
      const slotIdx = ['Q', 'W', 'E', 'R'].indexOf(slot);
      const slotLabel = slot === 'R' ? 'Ultimate (R) ability' : `${slot} ability`;
      tryAdd(
        {
          id: `abil_mech_${mech.id}_slot_${slot}`,
          category: 'abilities',
          subType: `abil_mech_${mech.id}_slot`,
          answerKind: 'ability',
          prompt: `Name ${anOrA(slotLabel)} that ${mech.promptPhrase}.`,
          hint: 'Type an ability name.',
          resolveAnswers: (d) =>
            d.champions
              .map((c) => c.spells[slotIdx])
              .filter((s): s is RiftSpell => Boolean(s) && mech.test(s))
              .map((s) => spellToAnswer(s, d)),
        },
        10
      );
    }
  }

  // 8. Abilities: Broad Role & Region Pools (by Kit & by Slot)
  const ABIL_SLOTS = [
    { slot: 'P' as const, label: 'Passive (P) ability', get: (c: RiftChampion) => c.passive },
    { slot: 'Q' as const, label: 'Q ability', get: (c: RiftChampion) => c.spells[0] },
    { slot: 'W' as const, label: 'W ability', get: (c: RiftChampion) => c.spells[1] },
    { slot: 'E' as const, label: 'E ability', get: (c: RiftChampion) => c.spells[2] },
    { slot: 'R' as const, label: 'Ultimate (R) ability', get: (c: RiftChampion) => c.spells[3] },
  ];

  for (const role of CHAMPION_ROLES) {
    tryAdd({
      id: `abil_any_role_${role}`,
      category: 'abilities',
      subType: 'abil_role_any',
      answerKind: 'ability',
      prompt: `Name any ability (Passive, Q, W, E, or R) belonging to ${anOrA(role)} champion.`,
      hint: 'Type an ability name.',
      resolveAnswers: (d) =>
        d.champions
          .filter((c) => c.tags.includes(role))
          .flatMap((c) => [c.passive, ...c.spells])
          .map((s) => spellToAnswer(s, d)),
    });

    for (const sDef of ABIL_SLOTS) {
      tryAdd({
        id: `abil_slot_${sDef.slot}_role_${role}`,
        category: 'abilities',
        subType: `abil_slot_role_${sDef.slot}`,
        answerKind: 'ability',
        prompt: `Name ${anOrA(sDef.label)} belonging to ${anOrA(role)} champion.`,
        hint: 'Type an ability name.',
        resolveAnswers: (d) =>
          d.champions
            .filter((c) => c.tags.includes(role))
            .map((c) => sDef.get(c))
            .filter((s): s is RiftSpell => Boolean(s))
            .map((s) => spellToAnswer(s, d)),
      });
    }
  }

  for (const [regId, champIds] of Object.entries(REGION_CHAMPIONS) as [
    RuneterraRegionId,
    string[],
  ][]) {
    tryAdd({
      id: `abil_any_region_${regId}`,
      category: 'abilities',
      subType: 'abil_region_any',
      answerKind: 'ability',
      prompt: `Name any ability (Passive, Q, W, E, or R) belonging to ${anOrA(REGION_DISPLAY[regId].adjective)} champion.`,
      hint: 'Type an ability name.',
      resolveAnswers: (d) =>
        champIds
          .flatMap((cid) => {
            const c = d.championsById[cid];
            return c ? [c.passive, ...c.spells] : [];
          })
          .map((s) => spellToAnswer(s, d)),
    });

    for (const sDef of ABIL_SLOTS) {
      tryAdd({
        id: `abil_slot_${sDef.slot}_region_${regId}`,
        category: 'abilities',
        subType: `abil_slot_region_${sDef.slot}`,
        answerKind: 'ability',
        prompt: `Name ${anOrA(sDef.label)} belonging to ${anOrA(REGION_DISPLAY[regId].adjective)} champion.`,
        hint: 'Type an ability name.',
        resolveAnswers: (d) =>
          champIds
            .map((cid) => d.championsById[cid])
            .filter((c): c is RiftChampion => Boolean(c))
            .map((c) => sDef.get(c))
            .filter((s): s is RiftSpell => Boolean(s))
            .map((s) => spellToAnswer(s, d)),
      });
    }
  }

  // 9. Abilities: Keyword searches across all 865+ spells (broad themes)
  for (const kw of ABILITY_KEYWORDS) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    tryAdd({
      id: `abil_kw_${kw.toLowerCase()}`,
      category: 'abilities',
      subType: 'abil_keyword',
      answerKind: 'ability',
      prompt: `Name any champion ability (P, Q, W, E, or R) whose name contains "${kw}".`,
      hint: 'Type an ability name.',
      resolveAnswers: (d) =>
        d.champions
          .flatMap((c) => [c.passive, ...c.spells])
          .filter((s) => regex.test(s.name))
          .map((s) => spellToAnswer(s, d)),
    });
  }

  // 10. Items: Builds directly out of major components (>= 6 upgrades)
  for (const comp of data.items) {
    if (comp.into.length < 6) continue;
    tryAdd(
      {
        id: `item_from_${comp.id}`,
        category: 'items',
        subType: 'item_component',
        answerKind: 'item',
        prompt: `Name a Summoner’s Rift item that builds directly out of ${comp.name}.`,
        hint: 'Type an item name.',
        resolveAnswers: (d) =>
          d.items.filter((i) => i.from.includes(comp.id)).map((i) => itemToAnswer(i, d)),
      },
      6
    );
  }

  // 11. Items: Broad Gold Ranges (no hyper-specific exact gold memorization)
  for (const [minG, maxG, label] of [
    [1, 500, '500 gold or less'],
    [800, 1100, 'between 800 and 1,100 gold'],
    [1100, 1400, 'between 1,100 and 1,400 gold'],
    [2200, 2550, 'between 2,200 and 2,550 gold'],
    [2600, 2900, 'between 2,600 and 2,900 gold'],
    [2900, 3200, 'between 2,900 and 3,200 gold'],
    [3200, 9999, '3,200 gold or more'],
  ] as [number, number, string][]) {
    tryAdd({
      id: `item_gold_range_${minG}_${maxG}`,
      category: 'items',
      subType: 'item_gold_range',
      answerKind: 'item',
      prompt: `Name a Summoner’s Rift item that costs ${label}.`,
      hint: 'Type an item name.',
      resolveAnswers: (d) =>
        d.items
          .filter((i) => i.goldTotal >= minG && i.goldTotal <= maxG)
          .map((i) => itemToAnswer(i, d)),
    });
  }

  // 12. Items: Stat Tags, Dual-Stat Tag Combinations, & Stat x Price Tier
  const itemTagKeys = Object.keys(ITEM_TAG_LABELS);
  for (let i = 0; i < itemTagKeys.length; i++) {
    const tagA = itemTagKeys[i];
    tryAdd({
      id: `item_tag_${tagA}`,
      category: 'items',
      subType: 'item_stat',
      answerKind: 'item',
      prompt: `Name a Summoner’s Rift item that grants ${ITEM_TAG_LABELS[tagA]}.`,
      hint: 'Type an item name.',
      resolveAnswers: (d) =>
        d.items.filter((it) => it.tags.includes(tagA)).map((it) => itemToAnswer(it, d)),
    });

    for (let j = i + 1; j < itemTagKeys.length; j++) {
      const tagB = itemTagKeys[j];
      tryAdd({
        id: `item_tags_${tagA}_${tagB}`,
        category: 'items',
        subType: 'item_dual_stat',
        answerKind: 'item',
        prompt: `Name a Summoner’s Rift item that grants BOTH ${ITEM_TAG_LABELS[tagA]} and ${ITEM_TAG_LABELS[tagB]}.`,
        hint: 'Type an item name.',
        resolveAnswers: (d) =>
          d.items
            .filter((it) => it.tags.includes(tagA) && it.tags.includes(tagB))
            .map((it) => itemToAnswer(it, d)),
      });
    }
  }

  for (const tag of [
    'Damage',
    'SpellDamage',
    'Health',
    'Armor',
    'SpellBlock',
    'AttackSpeed',
    'Mana',
    'AbilityHaste',
  ]) {
    for (const [tierId, label, pred] of [
      ['cheap', 'under 1,500 gold', (i: RiftItem) => i.goldTotal > 0 && i.goldTotal < 1500],
      ['legendary', '2,500 gold or more', (i: RiftItem) => i.goldTotal >= 2500],
    ] as [string, string, (i: RiftItem) => boolean][]) {
      tryAdd({
        id: `item_tag_${tag}_${tierId}`,
        category: 'items',
        subType: 'item_tag_tier',
        answerKind: 'item',
        prompt: `Name a Summoner’s Rift item that grants ${ITEM_TAG_LABELS[tag]} and costs ${label}.`,
        hint: 'Type an item name.',
        resolveAnswers: (d) =>
          d.items
            .filter((i) => i.tags.includes(tag) && pred(i))
            .map((i) => itemToAnswer(i, d)),
      });
    }
  }

  // 13. Items: Keywords & Starting Letters
  for (const kw of [
    'Blade',
    'Sword',
    'Shield',
    'Staff',
    'Heart',
    'Crown',
    'Mask',
    'Cloak',
    'Mail',
    'Bow',
    'Orb',
    'Ring',
    'Edge',
    'Elixir',
    'Dagger',
    'Tome',
    'Boots',
    'Gem',
    'Shard',
  ]) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    tryAdd(
      {
        id: `item_kw_${kw.toLowerCase()}`,
        category: 'items',
        subType: 'item_keyword',
        answerKind: 'item',
        prompt: `Name a Summoner’s Rift item whose name contains "${kw}".`,
        hint: 'Type an item name.',
        resolveAnswers: (d) =>
          d.items.filter((i) => regex.test(i.name)).map((i) => itemToAnswer(i, d)),
      },
      5
    );
  }

  for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    tryAdd({
      id: `item_starts_${ch}`,
      category: 'items',
      subType: 'item_letter',
      answerKind: 'item',
      prompt: `Name a Summoner’s Rift item whose name begins with the letter ${ch}.`,
      hint: 'Type an item name.',
      resolveAnswers: (d) =>
        d.items
          .filter((it) => it.name.toUpperCase().startsWith(ch))
          .map((it) => itemToAnswer(it, d)),
    });
  }

  // 14. Skins: Individual Skin Lines (general universe pools)
  for (const line of SKIN_LINE_DEFS) {
    tryAdd(
      {
        id: `skin_line_${line.id}`,
        category: 'skins',
        subType: 'skin_line',
        answerKind: 'skin_champion',
        prompt: `Name a champion who has ${anOrA(line.label)} skin.`,
        hint: 'Type a champion name.',
        resolveAnswers: (d) => resolveSkinLineAnswers(d, line.matcher),
      },
      5
    );

    for (const role of CHAMPION_ROLES) {
      tryAdd(
        {
          id: `skin_${line.id}_role_${role}`,
          category: 'skins',
          subType: 'skin_role',
          answerKind: 'skin_champion',
          prompt: `Name ${anOrA(role)} champion who has ${anOrA(line.label)} skin.`,
          hint: 'Type a champion name.',
          resolveAnswers: (d) =>
            resolveSkinLineAnswers(d, (s, c) => c.tags.includes(role) && line.matcher(s)),
        },
        6
      );
    }

    for (const [regId, champIds] of Object.entries(REGION_CHAMPIONS) as [
      RuneterraRegionId,
      string[],
    ][]) {
      const set = new Set(champIds);
      tryAdd(
        {
          id: `skin_${line.id}_region_${regId}`,
          category: 'skins',
          subType: 'skin_region',
          answerKind: 'skin_champion',
          prompt: `Name ${anOrA(REGION_DISPLAY[regId].adjective)} champion who has ${anOrA(line.label)} skin.`,
          hint: 'Type a champion name.',
          resolveAnswers: (d) =>
            resolveSkinLineAnswers(d, (s, c) => set.has(c.id) && line.matcher(s)),
        },
        5
      );
    }
  }

  // 15. Skins: Skin Line Overlaps (broad overlaps >= 6 champions)
  for (let i = 0; i < SKIN_LINE_DEFS.length; i++) {
    const lineA = SKIN_LINE_DEFS[i];
    for (let j = i + 1; j < SKIN_LINE_DEFS.length; j++) {
      const lineB = SKIN_LINE_DEFS[j];
      tryAdd(
        {
          id: `skin_both_${lineA.id}_${lineB.id}`,
          category: 'skins',
          subType: 'skin_intersection',
          answerKind: 'skin_champion',
          prompt: `Name a champion who has BOTH ${anOrA(lineA.label)} skin and ${anOrA(lineB.label)} skin.`,
          hint: 'Type a champion name.',
          resolveAnswers: (d) =>
            resolveSkinLineAnswers(
              d,
              (s, c) =>
                lineA.matcher(s) && c.skins.some((other) => other.num > 0 && lineB.matcher(other))
            ),
        },
        6
      );
    }
  }

  // 16. Skins: Broad Skin Name Prompts (Keywords, Role Skins, Region Skins, Starting Letter)
  const crossSkinToAnswer = (s: RiftSkin, c: RiftChampion, idx: number): ValidAnswerEntry => ({
    id: `${c.id}_${s.num}`,
    displayName: s.name,
    subtitle: `${c.name} Skin`,
    popularity: Math.min(97, 24 + idx * 5),
    imageKind: 'skin_splash',
    imageUrl: getChampionSplashUrl(c.id, s.num),
    fallbackImageUrl: getChampionSplashUrl(c.id, 0),
    aliases: [normalizeAnswerText(s.name)],
  });

  for (const kw of [
    'Dark',
    'Star',
    'Blood',
    'Dragon',
    'Shadow',
    'Mecha',
    'Battle',
    'Void',
    'Spirit',
    'Knight',
    'Queen',
    'King',
    'Winter',
    'Pool',
    'Infernal',
    'Lunar',
    'Soul',
    'Heart',
    'Steel',
    'Cosmic',
    'Witch',
    'Crimson',
    'Frost',
    'Cyber',
    'Snow',
    'Night',
    'Dawn',
    'Arcane',
    'Crystal',
    'Guardian',
  ]) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    tryAdd({
      id: `skin_kw_${kw.toLowerCase()}`,
      category: 'skins',
      subType: 'skin_keyword',
      answerKind: 'skin_name',
      prompt: `Name any champion skin whose name contains "${kw}".`,
      hint: 'Type a skin name.',
      resolveAnswers: (d) =>
        d.champions.flatMap((c) =>
          c.skins
            .filter((s) => s.num > 0 && regex.test(s.name))
            .map((s, idx) => crossSkinToAnswer(s, c, idx))
        ),
    });
  }

  for (const role of CHAMPION_ROLES) {
    tryAdd({
      id: `skin_of_role_${role}`,
      category: 'skins',
      subType: 'skin_role_name',
      answerKind: 'skin_name',
      prompt: `Name any skin belonging to ${anOrA(role)} champion.`,
      hint: 'Type a skin name.',
      resolveAnswers: (d) =>
        d.champions
          .filter((c) => c.tags.includes(role))
          .flatMap((c) =>
            c.skins.filter((s) => s.num > 0).map((s, idx) => crossSkinToAnswer(s, c, idx))
          ),
    });
  }

  for (const [regId, champIds] of Object.entries(REGION_CHAMPIONS) as [
    RuneterraRegionId,
    string[],
  ][]) {
    const set = new Set(champIds);
    tryAdd({
      id: `skin_of_region_${regId}`,
      category: 'skins',
      subType: 'skin_region_name',
      answerKind: 'skin_name',
      prompt: `Name any skin belonging to ${anOrA(REGION_DISPLAY[regId].adjective)} champion.`,
      hint: 'Type a skin name.',
      resolveAnswers: (d) =>
        d.champions
          .filter((c) => set.has(c.id))
          .flatMap((c) =>
            c.skins.filter((s) => s.num > 0).map((s, idx) => crossSkinToAnswer(s, c, idx))
          ),
    });
  }

  for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    tryAdd({
      id: `skin_starts_${ch}`,
      category: 'skins',
      subType: 'skin_letter',
      answerKind: 'skin_name',
      prompt: `Name any champion skin whose name begins with the letter ${ch}.`,
      hint: 'Type a skin name.',
      resolveAnswers: (d) =>
        d.champions.flatMap((c) =>
          c.skins
            .filter((s) => s.num > 0 && s.name.toUpperCase().startsWith(ch))
            .map((s, idx) => crossSkinToAnswer(s, c, idx))
        ),
    });
  }

  // 17. Lore & Regions: Broad Runeterra Region & Role Combinations
  for (const [regId, champIds] of Object.entries(REGION_CHAMPIONS) as [
    RuneterraRegionId,
    string[],
  ][]) {
    const regInfo = REGION_DISPLAY[regId];
    const set = new Set(champIds);

    tryAdd({
      id: `lore_region_${regId}`,
      category: 'lore',
      subType: 'lore_region',
      answerKind: 'champion',
      prompt: `Name a champion associated with ${regInfo.label} in Runeterra lore.`,
      hint: 'Type a champion name.',
      resolveAnswers: (d) =>
        champIds
          .map((id) => d.championsById[id])
          .filter((c): c is RiftChampion => Boolean(c))
          .map((c) => championToAnswer(c, d)),
    });

    for (const role of CHAMPION_ROLES) {
      tryAdd(
        {
          id: `lore_region_${regId}_role_${role}`,
          category: 'lore',
          subType: 'lore_region_role',
          answerKind: 'champion',
          prompt: `Name ${anOrA(regInfo.adjective)} ${role} champion.`,
          hint: 'Type a champion name.',
          resolveAnswers: (d) =>
            d.champions
              .filter((c) => set.has(c.id) && c.tags.includes(role))
              .map((c) => championToAnswer(c, d)),
        },
        4
      );
    }

    tryAdd(
      {
        id: `lore_region_${regId}_nomana`,
        category: 'lore',
        subType: 'lore_region_resource',
        answerKind: 'champion',
        prompt: `Name ${anOrA(regInfo.adjective)} champion who does not use Mana.`,
        hint: 'Type a champion name.',
        resolveAnswers: (d) =>
          d.champions
            .filter((c) => set.has(c.id) && c.partype !== 'Mana')
            .map((c) => championToAnswer(c, d)),
      },
      4
    );

    tryAdd(
      {
        id: `lore_region_${regId}_ranged`,
        category: 'lore',
        subType: 'lore_region_range',
        answerKind: 'champion',
        prompt: `Name a Ranged champion associated with ${regInfo.label}.`,
        hint: 'Type a champion name.',
        resolveAnswers: (d) =>
          d.champions
            .filter((c) => set.has(c.id) && (c.stats.attackrange ?? 0) > 350)
            .map((c) => championToAnswer(c, d)),
      },
      4
    );

    tryAdd(
      {
        id: `lore_region_${regId}_melee`,
        category: 'lore',
        subType: 'lore_region_range',
        answerKind: 'champion',
        prompt: `Name a Melee champion associated with ${regInfo.label}.`,
        hint: 'Type a champion name.',
        resolveAnswers: (d) =>
          d.champions
            .filter((c) => set.has(c.id) && (c.stats.attackrange ?? 0) <= 350)
            .map((c) => championToAnswer(c, d)),
      },
      4
    );
  }

  // Sort deterministically by ID so Daily Challenge seeds remain identical everywhere
  pool.sort((a, b) => a.id.localeCompare(b.id));
  cachedPoolVersion = data.version;
  cachedPool = pool;
  return pool;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getTodayUtcKey(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffleWithRng<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Picks 7 varied questions per run, covering all 5 categories AND avoiding
 * repeating the same question subType within the same 7-question run.
 */
export function selectRunQuestions(
  mode: 'daily' | 'unlimited',
  data: RiftData,
  dateKey?: string
): TriviaQuestion[] {
  const pool = buildQuestionPool(data);
  const seed =
    mode === 'daily'
      ? hashString(`rift-rarity-daily-v3-${dateKey ?? getTodayUtcKey()}`)
      : hashString(`rift-rarity-unlimited-${Date.now()}-${Math.random()}`);

  const rng = mulberry32(seed);
  const categories: QuestionCategory[] = ['champions', 'abilities', 'items', 'skins', 'lore'];
  const picked: TriviaQuestion[] = [];
  const usedIds = new Set<string>();
  const usedSubTypes = new Set<string>();

  for (const cat of categories) {
    const candidates = shuffleWithRng(
      pool.filter((q) => q.category === cat),
      rng
    );
    const chosen =
      candidates.find((q) => !usedSubTypes.has(q.subType ?? q.id)) ?? candidates[0];
    if (chosen) {
      picked.push(chosen);
      usedIds.add(chosen.id);
      if (chosen.subType) usedSubTypes.add(chosen.subType);
    }
  }

  const bonusCats = shuffleWithRng(categories, rng).slice(0, 2);
  for (const cat of bonusCats) {
    const candidates = shuffleWithRng(
      pool.filter((q) => q.category === cat && !usedIds.has(q.id)),
      rng
    );
    const chosen =
      candidates.find((q) => !usedSubTypes.has(q.subType ?? q.id)) ?? candidates[0];
    if (chosen) {
      picked.push(chosen);
      usedIds.add(chosen.id);
      if (chosen.subType) usedSubTypes.add(chosen.subType);
    }
  }

  return shuffleWithRng(picked, rng);
}
