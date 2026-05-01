import { players, rarities, rarityOrder, supplyKey } from './data';
import type { AppState, OwnedCard, Player, Rarity } from './types';

export function getPlayer(playerId: number): Player {
  return players.find((player) => player.id === playerId) ?? players[0];
}

export function bestOwnedForPlayer(cards: OwnedCard[], playerId: number) {
  const owned = cards.filter((card) => card.playerId === playerId);
  return owned.sort((a, b) => rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity))[0];
}

export function ownedVersions(cards: OwnedCard[], playerId: number) {
  return rarityOrder.map((rarity) => ({
    rarity,
    cards: cards.filter((card) => card.playerId === playerId && card.rarity === rarity),
  }));
}

export function progressFor(state: AppState) {
  const uniquePlayers = new Set(state.ownedCards.map((card) => card.playerId)).size;
  const uniqueByRarity = Object.fromEntries(
    rarityOrder.map((rarity) => [
      rarity,
      new Set(state.ownedCards.filter((card) => card.rarity === rarity).map((card) => card.playerId)).size,
    ]),
  ) as Record<Rarity, number>;

  return {
    uniquePlayers,
    albumPercent: Math.round((uniquePlayers / players.length) * 100),
    totalCards: state.ownedCards.length,
    duplicates: state.ownedCards.filter((card) => card.duplicate).length,
    uniqueByRarity,
    rareCards: state.ownedCards.filter((card) => ['gold', 'diamond', 'opal', 'icon'].includes(card.rarity)).length,
  };
}

export function remainingFor(state: AppState, playerId: number, rarity: Rarity) {
  const max = rarities[rarity].supply;
  if (!max) return null;
  return state.supply[supplyKey(playerId, rarity)] ?? 0;
}

export function scarcityHighlights(state: AppState) {
  const rows = players
    .flatMap((player) =>
      rarityOrder
        .filter((rarity) => rarity !== 'base')
        .map((rarity) => ({
          player,
          rarity,
          remaining: remainingFor(state, player.id, rarity) ?? 0,
        })),
    )
    .filter((row) => row.remaining <= 4 || row.rarity === 'opal')
    .sort((a, b) => a.remaining - b.remaining || rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity));

  return rows.slice(0, 8);
}
