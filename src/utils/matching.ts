import type {
  AnswerKind,
  AnswerPickCounts,
  RankId,
  RiftData,
  ValidAnswerEntry,
} from '../types/game';
import { RUNETERRA_REGIONS } from '../data/loreAndFacts';

/**
 * Normalizes user input & answer names by:
 * - lowercasing
 * - stripping diacritics
 * - converting "&" to "and"
 * - removing apostrophes, periods, hyphens, commas, colons, exclamation marks, and spaces
 */
export function normalizeAnswerText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['’`.,:;!?\-/\s]+/g, '');
}

/**
 * Common League champion nicknames and shorthand abbreviations.
 */
export const CHAMPION_NICKNAMES: Record<string, string[]> = {
  aatrox: ['Aatrox'],
  ali: ['Alistar'],
  aphel: ['Aphelios'],
  phel: ['Aphelios'],
  asol: ['AurelionSol'],
  aurelion: ['AurelionSol'],
  az: ['Azir'],
  bc: ['Blitzcrank'],
  blitz: ['Blitzcrank'],
  bel: ['Belveth'],
  belveth: ['Belveth'],
  cait: ['Caitlyn'],
  cam: ['Camille'],
  cass: ['Cassiopeia'],
  cassio: ['Cassiopeia'],
  cho: ['Chogath'],
  chogath: ['Chogath'],
  donger: ['Heimerdinger'],
  heimer: ['Heimerdinger'],
  mundo: ['DrMundo'],
  drmundo: ['DrMundo'],
  eve: ['Evelynn'],
  ez: ['Ezreal'],
  fiddle: ['Fiddlesticks'],
  fidd: ['Fiddlesticks'],
  gp: ['Gangplank'],
  heca: ['Hecarim'],
  hecarim: ['Hecarim'],
  j4: ['JarvanIV'],
  jarvan: ['JarvanIV'],
  jarvan4: ['JarvanIV'],
  jarvaniv: ['JarvanIV'],
  kaisa: ['Kaisa'],
  karth: ['Karthus'],
  kass: ['Kassadin'],
  kat: ['Katarina'],
  kata: ['Katarina'],
  kha: ['Khazix'],
  khazix: ['Khazix'],
  bug: ['Khazix'],
  kog: ['KogMaw'],
  kogmaw: ['KogMaw'],
  ksante: ['KSante'],
  lb: ['Leblanc'],
  leblanc: ['Leblanc'],
  lee: ['LeeSin'],
  leesin: ['LeeSin'],
  liss: ['Lissandra'],
  malph: ['Malphite'],
  malz: ['Malzahar'],
  mao: ['Maokai'],
  yi: ['MasterYi'],
  masteryi: ['MasterYi'],
  mf: ['MissFortune'],
  missfortune: ['MissFortune'],
  wukong: ['MonkeyKing'],
  monkeyking: ['MonkeyKing'],
  wu: ['MonkeyKing'],
  morde: ['Mordekaiser'],
  mord: ['Mordekaiser'],
  morg: ['Morgana'],
  naut: ['Nautilus'],
  nid: ['Nidalee'],
  nida: ['Nidalee'],
  noc: ['Nocturne'],
  nunu: ['Nunu'],
  nunuwillump: ['Nunu'],
  nunuandwillump: ['Nunu'],
  ori: ['Orianna'],
  panth: ['Pantheon'],
  rek: ['RekSai'],
  reksai: ['RekSai'],
  renek: ['Renekton'],
  renata: ['Renata'],
  renataglasc: ['Renata'],
  sej: ['Sejuani'],
  sera: ['Seraphine'],
  shyv: ['Shyvana'],
  sol: ['AurelionSol'],
  tahm: ['TahmKench'],
  tk: ['TahmKench'],
  kench: ['TahmKench'],
  tali: ['Taliyah'],
  tf: ['TwistedFate'],
  twistedfate: ['TwistedFate'],
  trist: ['Tristana'],
  trynd: ['Tryndamere'],
  trynda: ['Tryndamere'],
  vel: ['Velkoz'],
  velkoz: ['Velkoz'],
  vlad: ['Vladimir'],
  voli: ['Volibear'],
  ww: ['Warwick'],
  xin: ['XinZhao'],
  xinzhao: ['XinZhao'],
  yas: ['Yasuo'],
  zil: ['Zilean'],
};

/**
 * Common League item nicknames, Tear evolutions & abbreviations.
 */
export const ITEM_NICKNAMES: Record<string, string[]> = {
  ie: ['infinityedge'],
  bt: ['bloodthirster'],
  ga: ['guardianangel'],
  zhonya: ['zhonyashourglass'],
  zhonyas: ['zhonyashourglass'],
  hourglass: ['zhonyashourglass'],
  rabadon: ['rabadonsdeathcap'],
  rabadons: ['rabadonsdeathcap'],
  dcap: ['rabadonsdeathcap'],
  deathcap: ['rabadonsdeathcap'],
  bork: ['bladeoftheruinedking'],
  botrk: ['bladeoftheruinedking'],
  ldr: ['lorddominiksregards'],
  doms: ['lorddominiksregards'],
  rfc: ['rapidfirecannon'],
  rapidfire: ['rapidfirecannon'],
  pd: ['phantomdancer'],
  triforce: ['trinityforce'],
  trinity: ['trinityforce'],
  dd: ['deathsdance'],
  maw: ['mawofmalmortius'],
  fh: ['frozenheart'],
  sv: ['spiritvisage'],
  visage: ['spiritvisage'],
  fon: ['forceofnature'],
  roa: ['rodofages'],
  luden: ['ludensecho'],
  ludens: ['ludensecho'],
  liandry: ['liandrystorment'],
  liandrys: ['liandrystorment'],
  nashor: ['nashorstooth'],
  nashors: ['nashorstooth'],
  rylai: ['rylaiscrystalscepter'],
  rylais: ['rylaiscrystalscepter'],
  zeke: ['zekesconvergence'],
  zekes: ['zekesconvergence'],
  shurelya: ['shurelyasbattlesong'],
  shurelyas: ['shurelyasbattlesong'],
  locket: ['locketoftheironsolari'],
  solari: ['locketoftheironsolari'],
  mikael: ['mikaelsblessing'],
  mikaels: ['mikaelsblessing'],
  moonstone: ['moonstonerenewer'],
  sunfire: ['sunfireaegis'],
  randuin: ['randuinsomen'],
  randuins: ['randuinsomen'],
  jaksho: ['jakshotheprotean'],
  warmog: ['warmogsarmor'],
  warmogs: ['warmogsarmor'],
  bc: ['blackcleaver'],
  cleaver: ['blackcleaver'],
  sterak: ['steraksgage'],
  steraks: ['steraksgage'],
  youmuu: ['youmuusghostblade'],
  youmuus: ['youmuusghostblade'],
  ghostblade: ['youmuusghostblade'],
  collector: ['thecollector'],
  kraken: ['krakenslayer'],
  shiv: ['statikkshiv'],
  statikk: ['statikkshiv'],
  guinsoo: ['guinsoosrageblade'],
  guinsoos: ['guinsoosrageblade'],
  rageblade: ['guinsoosrageblade'],
  runaan: ['runaanshurricane'],
  runaans: ['runaanshurricane'],
  hurricane: ['runaanshurricane'],
  yuntal: ['yuntalwildarrows'],
  banshee: ['bansheesveil'],
  banshees: ['bansheesveil'],
  tabi: ['platedsteelcaps'],
  tabis: ['platedsteelcaps'],
  ninjatabi: ['platedsteelcaps'],
  steelcaps: ['platedsteelcaps'],
  mercs: ['mercurystreads'],
  merctreads: ['mercurystreads'],
  ionian: ['ionianbootsoflucidity'],
  ionians: ['ionianbootsoflucidity'],
  lucidity: ['ionianbootsoflucidity'],
  lucidityboots: ['ionianbootsoflucidity'],
  swifties: ['bootsofswiftness'],
  zerkers: ['berserkersgreaves'],
  greaves: ['berserkersgreaves'],
  sorcs: ['sorcerersshoes'],
  sorcshoes: ['sorcerersshoes'],
  controlward: ['controlward'],
  pink: ['controlward'],
  pinkward: ['controlward'],
  tear: ['tearofthegoddess'],
  bf: ['bfsword'],
  bfsword: ['bfsword'],
  nlr: ['needlesslylargerod'],
  largerod: ['needlesslylargerod'],
  qss: ['quicksilversash'],
  rocketbelt: ['hextechrocketbelt'],
  protobelt: ['hextechrocketbelt'],
  gunblade: ['hextechgunblade'],
  sundered: ['sunderedsky'],
  shieldbow: ['immortalshieldbow'],
  navori: ['navoriflickerblade'],
  flickerblade: ['navoriflickerblade'],
  stride: ['stridebreaker'],
  titanic: ['titanichydra'],
  ravenous: ['ravenoushydra'],
  profane: ['profanehydra'],
  brutalizer: ['thebrutalizer'],
  deadmans: ['deadmansplate'],
  dmp: ['deadmansplate'],
  serpents: ['serpentsfang'],
  serylda: ['seryldasgrudge'],
  seryldas: ['seryldasgrudge'],
  chempunk: ['chempunkchainsword'],
  chainsword: ['chempunkchainsword'],
  mejais: ['mejaissoulstealer'],
  mejai: ['mejaissoulstealer'],
  dblade: ['doransblade'],
  dring: ['doransring'],
  dshield: ['doransshield'],
  dbow: ['doransbow'],
  dhelm: ['doranshelm'],
  pot: ['healthpotion'],
  hpotion: ['healthpotion'],
  refillable: ['refillablepotion'],
  archangels: ['archangelsstaff'],
  seraphs: ['archangelsstaff'],
  seraphsembrace: ['archangelsstaff'],
  muramana: ['manamune'],
  fimbulwinter: ['wintersapproach'],
  fatedashes: ['fatedashes'],
  kaenic: ['kaenicrookern'],
  rookern: ['kaenicrookern'],
  unending: ['unendingdespair'],
  overlords: ['overlordsbloodmail'],
  bloodmail: ['overlordsbloodmail'],
  blackfire: ['blackfiretorch'],
  hexplate: ['experimentalhexplate'],
  morello: ['morellonomicon'],
  duskanddawn: ['duskanddawn'],
  bandlepipes: ['bandlepipes'],
  fiendhunter: ['fiendhunterbolts'],
  bastionbreaker: ['bastionbreaker'],
  hexoptics: ['hexopticsc44'],
};

export function getChampionAliases(championId: string, championName: string): string[] {
  const aliases = new Set<string>([
    normalizeAnswerText(championId),
    normalizeAnswerText(championName),
  ]);
  for (const [nick, ids] of Object.entries(CHAMPION_NICKNAMES)) {
    if (ids.includes(championId)) {
      aliases.add(nick);
    }
  }
  return Array.from(aliases);
}

export function getItemAliases(itemName: string): string[] {
  const norm = normalizeAnswerText(itemName);
  const aliases = new Set<string>([norm]);
  if (norm.startsWith('the')) {
    aliases.add(norm.slice(3));
  }
  for (const [nick, names] of Object.entries(ITEM_NICKNAMES)) {
    if (names.includes(norm)) {
      aliases.add(nick);
    }
  }
  return Array.from(aliases);
}

export function getAbilityAliases(abilityName: string): string[] {
  const aliases = new Set<string>([normalizeAnswerText(abilityName)]);
  if (abilityName.includes('/') || abilityName.includes('|')) {
    const parts = abilityName.split(/[\/|]/);
    for (const part of parts) {
      const cleaned = normalizeAnswerText(part);
      if (cleaned.length >= 3) aliases.add(cleaned);
    }
  }
  return Array.from(aliases);
}

/**
 * Damerau-Levenshtein edit distance (treats adjacent transpositions as cost 1).
 */
export function damerauLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

export interface CatalogSpellTarget {
  displayName: string; // e.g., "Yuumi", "Muramana", "Zhonya's Hourglass"
  submitText: string;  // text that gets matched cleanly
  keys: string[];
}

/**
 * Builds the full spellcheck catalog for the active question's answerKind.
 * Uses the ENTIRE catalog (not filtered to valid answers for the question),
 * so typo suggestions NEVER leak which answers are valid for the prompt!
 */
export function buildCatalogSpellTargets(
  data: RiftData,
  answerKind: AnswerKind
): CatalogSpellTarget[] {
  if (answerKind === 'champion' || answerKind === 'skin_champion') {
    return data.champions.map((c) => ({
      displayName: c.name,
      submitText: c.name,
      keys: getChampionAliases(c.id, c.name),
    }));
  }

  if (answerKind === 'item') {
    const targets: CatalogSpellTarget[] = data.items.map((item) => ({
      displayName: item.name,
      submitText: item.name,
      keys: getItemAliases(item.name),
    }));
    // Add famous Tear-evolved item names as explicit spellcheck display names
    targets.push(
      { displayName: 'Muramana', submitText: 'Muramana', keys: ['muramana'] },
      { displayName: "Seraph's Embrace", submitText: "Seraph's Embrace", keys: ['seraphsembrace', 'seraphs'] },
      { displayName: 'Fimbulwinter', submitText: 'Fimbulwinter', keys: ['fimbulwinter'] }
    );
    return targets;
  }

  if (answerKind === 'ability') {
    const targets: CatalogSpellTarget[] = [];
    for (const c of data.champions) {
      for (const s of [c.passive, ...c.spells]) {
        targets.push({
          displayName: s.name,
          submitText: s.name,
          keys: getAbilityAliases(s.name),
        });
      }
    }
    return targets;
  }

  if (answerKind === 'skin_name') {
    const targets: CatalogSpellTarget[] = [];
    for (const c of data.champions) {
      for (const s of c.skins) {
        if (s.num <= 0) continue;
        targets.push({
          displayName: s.name,
          submitText: s.name,
          keys: [normalizeAnswerText(s.name)],
        });
      }
    }
    return targets;
  }

  return RUNETERRA_REGIONS.map((r) => ({
    displayName: r.name,
    submitText: r.name,
    keys: r.aliases.map(normalizeAnswerText),
  }));
}

export interface TypoSuggestion {
  displayName: string;
  submitText: string;
  distance: number;
}

/**
 * Checks if the player's input is a close misspelling of a catalog entity
 * (e.g., "yumi" -> "Yuumi", "marumana" -> "Muramana").
 * Returns null if the input is already an exact match or too far from anything.
 */
export function findTypoSuggestion(
  rawInput: string,
  catalog: CatalogSpellTarget[]
): TypoSuggestion | null {
  const norm = normalizeAnswerText(rawInput);
  if (norm.length < 3) return null;

  // If it already matches an exact key in the catalog, no typo help needed
  for (const target of catalog) {
    if (target.keys.includes(norm)) return null;
  }

  const maxDist = norm.length <= 4 ? 1 : norm.length <= 7 ? 2 : 3;
  let best: TypoSuggestion | null = null;

  for (const target of catalog) {
    for (const key of target.keys) {
      if (key.length < 3) continue;
      if (Math.abs(key.length - norm.length) > maxDist) continue;
      const dist = damerauLevenshtein(norm, key);
      if (dist > 0 && dist <= maxDist) {
        if (
          !best ||
          dist < best.distance ||
          (dist === best.distance && key.length < best.displayName.length)
        ) {
          best = {
            displayName: target.displayName,
            submitText: target.submitText,
            distance: dist,
          };
        }
      }
    }
  }

  return best;
}

/**
 * Finds a matching ValidAnswerEntry for the player's typed string.
 */
export function matchPlayerAnswer(
  rawInput: string,
  validAnswers: ValidAnswerEntry[]
): ValidAnswerEntry | null {
  const norm = normalizeAnswerText(rawInput);
  if (!norm) return null;

  for (const entry of validAnswers) {
    if (entry.aliases.includes(norm)) {
      return entry;
    }
  }
  return null;
}

/**
 * Computes effective popularity (1 = most common, 100 = rarest) by blending
 * the baseline popularity score with observed community pick frequency across days.
 */
export function computeEffectivePopularity(
  entry: ValidAnswerEntry,
  validAnswers: ValidAnswerEntry[],
  communityCounts?: AnswerPickCounts
): number {
  if (!communityCounts) return entry.popularity;

  let totalPicks = 0;
  for (const ans of validAnswers) {
    totalPicks += communityCounts[ans.id] ?? 0;
  }

  if (totalPicks < 2) return entry.popularity;

  const entryPicks = communityCounts[entry.id] ?? 0;
  const share = entryPicks / totalPicks;

  // Higher pick share => lower popularity number (more common, Bronze/Silver).
  // Zero picks while community has picked others => high popularity number (rarer!).
  const observedPopularity =
    entryPicks === 0
      ? 94
      : Math.max(2, 95 - Math.min(1, share * 3.4) * 93);

  // Ramp community influence smoothly up to 85% once >= 10 total picks exist
  const communityWeight = Math.min(0.85, totalPicks / 10);
  return entry.popularity * (1 - communityWeight) + observedPopularity * communityWeight;
}

/**
 * Evaluates a valid answer's rank (Bronze..Challenger) using effective popularity
 * (hand-tuned baseline blended with observed community frequency).
 */
export function evaluateAnswerRank(
  matched: ValidAnswerEntry,
  validAnswers: ValidAnswerEntry[],
  communityCounts?: AnswerPickCounts
): RankId {
  const scored = validAnswers.map((entry) => ({
    entry,
    eff: computeEffectivePopularity(entry, validAnswers, communityCounts),
  }));
  scored.sort((a, b) => a.eff - b.eff);

  const n = scored.length;
  const matchedEff = computeEffectivePopularity(matched, validAnswers, communityCounts);

  const matchingIndices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (Math.abs(scored[i].eff - matchedEff) < 0.001) {
      matchingIndices.push(i);
    }
  }
  const avgIndex =
    matchingIndices.reduce((acc, val) => acc + val, 0) / Math.max(1, matchingIndices.length);
  const percentile = n <= 1 ? 0.5 : avgIndex / (n - 1);

  const absObscurity = Math.max(0, Math.min(1, (matchedEff - 10) / 88));
  const combined = 0.72 * percentile + 0.28 * absObscurity;

  if (combined < 0.14) return 'bronze';
  if (combined < 0.28) return 'silver';
  if (combined < 0.42) return 'gold';
  if (combined < 0.55) return 'platinum';
  if (combined < 0.68) return 'emerald';
  if (combined < 0.80) return 'diamond';
  if (combined < 0.89) return 'master';
  if (combined < 0.95) return 'grandmaster';
  return 'challenger';
}
