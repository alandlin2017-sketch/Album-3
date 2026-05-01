export type Rarity = 'base' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'opal' | 'icon';

export type PlayerCategory = 'standard' | 'icon';

export type Player = {
  id: number;
  cardNumber: number;
  name: string;
  assets: {
    cutout: string;
    cards: Partial<Record<Rarity, string>>;
  };
  category: PlayerCategory;
  nationality: string;
  flag: string;
  club: string;
  clubCode: string;
  position: string;
  rating: number;
  stats: {
    PAC: number;
    SHO: number;
    PAS: number;
    DEF: number;
    PHY: number;
  };
  bio: string;
  archetype: string;
  palette: string[];
  hair: number;
  expression: number;
  pose: number;
};

export type OwnedCard = {
  id: string;
  playerId: number;
  rarity: Rarity;
  edition?: number;
  maxEdition?: number;
  duplicate: boolean;
  pulledAt: number;
};

export type SupplyLedger = Record<string, number>;

export type AppState = {
  ownedCards: OwnedCard[];
  supply: SupplyLedger;
  exchangePoints: number;
  openedPacks: number;
};

export type PackResult = OwnedCard[];

export type PackMode = 'standard' | 'boosted';
