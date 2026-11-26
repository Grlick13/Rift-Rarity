import type { RiftChampion, RiftData, RiftItem, RiftSpell } from '../types/game';

const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';

/**
 * ARAM / non-Summoner's Rift 4-digit items that Data Dragon leaves flagged with maps["11"]: true.
 */
const EXCLUDED_NON_SR_ITEM_IDS = new Set([
  '2051', // Guardian's Horn (ARAM)
  '2141', // Cappa Juice (ARAM)
  '3112', // Guardian's Orb (ARAM)
  '3177', // Guardian's Blade (ARAM)
  '3184', // Guardian's Hammer (ARAM)
]);

interface RawDDragonChampion {
  id: string;
  key: string;
  name: string;
  title: string;
  tags: string[];
  partype: string;
  lore: string;
  image: { full: string };
  skins: { id: string; num: number; name: string }[];
  passive: {
    name: string;
    description: string;
    image: { full: string };
  };
  spells: {
    id: string;
    name: string;
    description: string;
    tooltip: string;
    cooldown: number[];
    cost: number[];
    range?: number[];
    resource: string;
    image: { full: string };
  }[];
  stats: Record<string, number>;
}

interface RawDDragonItem {
  name: string;
  plaintext?: string;
  description: string;
  gold?: { base: number; total: number; purchasable: boolean };
  tags?: string[];
  from?: string[];
  into?: string[];
  image: { full: string };
  maps?: Record<string, boolean>;
  requiredChampion?: string;
  requiredAlly?: string;
  inStore?: boolean;
  hideFromAll?: boolean;
  depth?: number;
}

let memoryCache: RiftData | null = null;

export function getChampionSplashUrl(championId: string, skinNum = 0): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_${skinNum}.jpg`;
}

export function getChampionLoadingUrl(championId: string, skinNum = 0): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championId}_${skinNum}.jpg`;
}

export function getChampionSquareUrl(version: string, imageFull: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${imageFull}`;
}

export function getItemIconUrl(version: string, imageFull: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${imageFull}`;
}

export function getSpellIconUrl(version: string, imageFull: string, isPassive = false): string {
  const folder = isPassive ? 'passive' : 'spell';
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/${folder}/${imageFull}`;
}

export async function loadRiftData(): Promise<RiftData> {
  if (memoryCache) return memoryCache;

  const versionRes = await fetch(VERSIONS_URL);
  if (!versionRes.ok) {
    throw new Error('Could not fetch Riot Data Dragon versions.');
  }
  const versions = (await versionRes.json()) as string[];
  const version = versions[0];
  if (!version) {
    throw new Error('No Data Dragon version available.');
  }

  const [champRes, itemRes] = await Promise.all([
    fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/championFull.json`),
    fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`),
  ]);

  if (!champRes.ok || !itemRes.ok) {
    throw new Error('Failed to load champion or item archives from Data Dragon.');
  }

  const champJson = (await champRes.json()) as { data: Record<string, RawDDragonChampion> };
  const itemJson = (await itemRes.json()) as { data: Record<string, RawDDragonItem> };

  const slots: Array<'Q' | 'W' | 'E' | 'R'> = ['Q', 'W', 'E', 'R'];
  const champions: RiftChampion[] = Object.values(champJson.data)
    .map((c) => {
      const passive: RiftSpell = {
        id: `${c.id}Passive`,
        name: c.passive.name.trim(),
        description: c.passive.description,
        tooltip: '',
        cooldown: [0],
        cost: [0],
        range: [0],
        resource: 'Passive',
        imageFull: c.passive.image.full,
        slot: 'P',
        championId: c.id,
        championName: c.name,
      };
      const spells: RiftSpell[] = c.spells.slice(0, 4).map((s, idx) => ({
        id: s.id,
        name: s.name.trim(),
        description: s.description,
        tooltip: s.tooltip,
        cooldown: s.cooldown,
        cost: s.cost,
        range: s.range ?? [0],
        resource: s.resource,
        imageFull: s.image.full,
        slot: slots[idx],
        championId: c.id,
        championName: c.name,
      }));
      return {
        id: c.id,
        key: c.key,
        name: c.name.trim(),
        title: c.title.trim(),
        tags: c.tags ?? [],
        partype: c.partype ?? '',
        lore: c.lore ?? '',
        imageFull: c.image.full,
        skins: c.skins ?? [],
        passive,
        spells,
        stats: c.stats ?? {},
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const championsById: Record<string, RiftChampion> = {};
  for (const c of champions) {
    championsById[c.id] = c;
  }

  // Strictly filter for Summoner's Rift purchasable, non-duplicate items
  const dedupedItems = new Map<string, RiftItem>();
  const rawEntries = Object.entries(itemJson.data).sort((a, b) => Number(a[0]) - Number(b[0]));

  for (const [id, raw] of rawEntries) {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId >= 10000) continue; // Ignore mode/Arena/ARAM 6-digit copies
    if (EXCLUDED_NON_SR_ITEM_IDS.has(id)) continue;
    if (!raw.maps || raw.maps['11'] !== true) continue;
    if (!raw.gold || raw.gold.purchasable !== true) continue;
    if (raw.requiredChampion || raw.requiredAlly) continue;
    if (raw.inStore === false || raw.hideFromAll === true) continue;

    const cleanName = raw.name.replace(/<[^>]+>/g, '').trim();
    const normKey = cleanName.toLowerCase();
    if (!cleanName || dedupedItems.has(normKey)) continue;

    dedupedItems.set(normKey, {
      id,
      name: cleanName,
      plaintext: raw.plaintext ?? '',
      description: raw.description ?? '',
      goldTotal: raw.gold.total,
      goldBase: raw.gold.base,
      purchasable: raw.gold.purchasable,
      tags: raw.tags ?? [],
      from: raw.from ?? [],
      into: raw.into ?? [],
      imageFull: raw.image.full,
      depth: raw.depth ?? 1,
    });
  }

  const items = Array.from(dedupedItems.values()).sort((a, b) => a.name.localeCompare(b.name));
  const itemsById: Record<string, RiftItem> = {};
  for (const item of items) {
    itemsById[item.id] = item;
  }

  memoryCache = {
    version,
    champions,
    championsById,
    items,
    itemsById,
  };

  return memoryCache;
}
