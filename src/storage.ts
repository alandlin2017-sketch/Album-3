import { createInitialSupply, maxSupplyFor, players, rarities, rarityOrder, supplyKey } from './data';
import type { AppState, OwnedCard, PackMode, PackResult, Rarity } from './types';

const KEY = 'virtua-football-state-v7-polished';

export const initialState: AppState = {
  ownedCards: [],
  supply: createInitialSupply(),
  exchangePoints: 0,
  openedPacks: 0,
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as AppState;
    return {
      ownedCards: parsed.ownedCards ?? [],
      supply: { ...createInitialSupply(), ...(parsed.supply ?? {}) },
      exchangePoints: parsed.exchangePoints ?? 0,
      openedPacks: parsed.openedPacks ?? 0,
    };
  } catch {
    return initialState;
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function weightedRarity(supply: AppState['supply'], mode: PackMode): Rarity {
  const eligible = rarityOrder.filter((rarity) => {
    if (mode === 'boosted' && (rarity === 'base' || rarity === 'bronze' || rarity === 'silver')) return false;
    if (rarity === 'base') return true;
    return players.some((player) => player.assets.cards[rarity] && (supply[supplyKey(player.id, rarity)] ?? 0) > 0);
  });
  const total = eligible.reduce((sum, rarity) => sum + (mode === 'boosted' ? rarities[rarity].boostedWeight : rarities[rarity].weight), 0);
  let ticket = Math.random() * total;
  for (const rarity of eligible) {
    ticket -= mode === 'boosted' ? rarities[rarity].boostedWeight : rarities[rarity].weight;
    if (ticket <= 0) return rarity;
  }
  return mode === 'boosted' ? 'gold' : 'base';
}

function randomPlayerForRarity(rarity: Rarity, supply: AppState['supply'], blockedPlayerIds: Set<number>) {
  if (rarity === 'base') {
    const availableBase = players.filter((player) => player.category === 'standard' && !blockedPlayerIds.has(player.id));
    return availableBase[Math.floor(Math.random() * availableBase.length)];
  }
  const available = players.filter((player) => !blockedPlayerIds.has(player.id) && player.assets.cards[rarity] && (supply[supplyKey(player.id, rarity)] ?? 0) > 0);
  return available[Math.floor(Math.random() * available.length)];
}

function cardScore(card: OwnedCard) {
  const player = players.find((item) => item.id === card.playerId);
  return rarityOrder.indexOf(card.rarity) * 1000 + (player?.rating ?? 0);
}

function randomEdition(state: AppState, playerId: number, rarity: Rarity, maxEdition: number) {
  const used = new Set(
    state.ownedCards
      .filter((card) => card.playerId === playerId && card.rarity === rarity && card.edition)
      .map((card) => card.edition),
  );
  const available: number[] = [];
  for (let edition = 1; edition <= maxEdition; edition += 1) {
    if (!used.has(edition)) available.push(edition);
  }
  return available[Math.floor(Math.random() * available.length)];
}

export function openPackTransaction(state: AppState, mode: PackMode = 'standard'): { state: AppState; cards: PackResult } {
  const supply = { ...state.supply };
  const nextOwned: OwnedCard[] = [...state.ownedCards];
  const cards: OwnedCard[] = [];
  const pickedPlayerIds = new Set<number>();

  const packSize = mode === 'boosted' ? 8 : 5;

  for (let index = 0; index < packSize; index += 1) {
    let rarity = weightedRarity(supply, mode);
    let player = randomPlayerForRarity(rarity, supply, pickedPlayerIds);

    if (!player) {
      rarity = mode === 'boosted' ? 'gold' : 'base';
      player = randomPlayerForRarity(rarity, supply, pickedPlayerIds);
    }

    if (!player) break;

    const maxEdition = maxSupplyFor(rarity);
    let edition: number | undefined;

    if (maxEdition) {
      const key = supplyKey(player.id, rarity);
      const remaining = supply[key] ?? 0;
      if (remaining <= 0) {
        index -= 1;
        continue;
      }
      edition = randomEdition({ ...state, ownedCards: nextOwned }, player.id, rarity, maxEdition);
      supply[key] = remaining - 1;
    }

    const duplicate = nextOwned.some((card) => card.playerId === player.id && card.rarity === rarity);
    const card: OwnedCard = {
      id: `${Date.now()}-${index}-${player.id}-${rarity}-${Math.random().toString(36).slice(2)}`,
      playerId: player.id,
      rarity,
      edition,
      maxEdition,
      duplicate,
      pulledAt: Date.now() + index,
    };

    nextOwned.push(card);
    cards.push(card);
    pickedPlayerIds.add(player.id);
  }

  cards.sort((a, b) => cardScore(a) - cardScore(b));

  return {
    state: {
      ...state,
      ownedCards: nextOwned,
      supply,
      openedPacks: state.openedPacks + 1,
    },
    cards,
  };
}

export function resetPrototype() {
  localStorage.removeItem(KEY);
}
