import collectionManifest from './collectionManifest.json';
import type { Player, Rarity, SupplyLedger } from './types';

export const rarities: Record<
  Rarity,
  {
    label: string;
    short: string;
    supply: number | null;
    weight: number;
    boostedWeight: number;
    points: number;
    glow: string;
  }
> = {
  base: { label: 'Base', short: 'BASE', supply: null, weight: 720, boostedWeight: 0, points: 1, glow: '#8c94a5' },
  bronze: { label: 'Bronce', short: 'BRZ', supply: 100, weight: 185, boostedWeight: 0, points: 4, glow: '#c87437' },
  silver: { label: 'Plata', short: 'SLV', supply: 50, weight: 70, boostedWeight: 0, points: 10, glow: '#d8dde8' },
  gold: { label: 'Oro', short: 'GLD', supply: 25, weight: 22, boostedWeight: 730, points: 28, glow: '#ffd36b' },
  diamond: { label: 'Diamante', short: 'DIA', supply: 10, weight: 5, boostedWeight: 235, points: 75, glow: '#71d8ff' },
  opal: { label: 'Opalo Rosa', short: 'OPL', supply: 5, weight: 3, boostedWeight: 35, points: 220, glow: '#ff5bd7' },
  icon: { label: 'Icono', short: 'ICO', supply: 2, weight: 1, boostedWeight: 12, points: 520, glow: '#fff3b0' },
};

export const rarityOrder: Rarity[] = ['base', 'bronze', 'silver', 'gold', 'diamond', 'opal', 'icon'];
export const standardRarityOrder: Rarity[] = ['base', 'bronze', 'silver', 'gold', 'diamond', 'opal'];

const firstNames = [
  'Marco',
  'Thiago',
  'Nico',
  'Jules',
  'Rafa',
  'Kylan',
  'Diego',
  'Eliot',
  'Mason',
  'Zion',
  'Leandro',
  'Noah',
  'Viktor',
  'Andrey',
  'Iker',
  'Soren',
  'Mateo',
  'Tariq',
  'Luca',
  'Enzo',
  'Dario',
  'Omar',
  'Kenji',
  'Aurel',
  'Basti',
  'Ciro',
  'Emil',
  'Fabio',
  'Galo',
  'Hugo',
];

const lastNames = [
  'Vellari',
  'Alvarez',
  'Romero',
  'Ferreira',
  'Clarke',
  'Moretti',
  'Costa',
  'Park',
  'Diawara',
  'Petrov',
  'Weber',
  'Jensen',
  'Santos',
  'Morales',
  'Okafor',
  'Tanaka',
  'Berg',
  'Silva',
  'Novak',
  'Lazaro',
  'Benali',
  'Kovacs',
  'Haddad',
  'Rossi',
  'Ndiaye',
  'Ortega',
  'Chen',
  'Mendes',
  'Serrano',
  'Volkov',
];

const countries = [
  ['Argentina', '🇦🇷'],
  ['Brazil', '🇧🇷'],
  ['Spain', '🇪🇸'],
  ['England', '🏴'],
  ['France', '🇫🇷'],
  ['Italy', '🇮🇹'],
  ['Germany', '🇩🇪'],
  ['Portugal', '🇵🇹'],
  ['Japan', '🇯🇵'],
  ['Senegal', '🇸🇳'],
  ['Morocco', '🇲🇦'],
  ['Netherlands', '🇳🇱'],
  ['Croatia', '🇭🇷'],
  ['Mexico', '🇲🇽'],
  ['Uruguay', '🇺🇾'],
];

const clubs: [string, string, [string, string]][] = [
  ['Northridge FC', 'NFC', ['#131923', '#d6a13b']],
  ['Aurelia City', 'AUR', ['#12141f', '#f6cf67']],
  ['Port Azul', 'PAZ', ['#061722', '#3bb7ff']],
  ['Red Harbor', 'RHB', ['#1f0f12', '#ff5a6d']],
  ['Monte Verde', 'MVU', ['#0c1812', '#58d174']],
  ['Solaris United', 'SOL', ['#21180b', '#ffca4f']],
  ['Blackstone Rovers', 'BKR', ['#0b0c10', '#b9c0ca']],
  ['Royal Obsidian', 'OBS', ['#100d18', '#bd85ff']],
  ['Valencia Norte', 'VNO', ['#1a1208', '#ff9d35']],
  ['Cobalt Rangers', 'CBR', ['#071229', '#648dff']],
];

const positions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
const archetypes = [
  'pressing spark',
  'ice-cold finisher',
  'tempo conductor',
  'last-line commander',
  'dribble artist',
  'set-piece specialist',
  'box-to-box engine',
  'aerial titan',
  'counterattack hunter',
  'fearless shot-stopper',
];

const bios = [
  'Figura de potrero con sonrisa imposible y una coleccion de gambetas para la tribuna.',
  'Juega cada pelota como si fuera la ultima figurita brillante del album.',
  'Especialista en festejos exagerados, miradas picantes y pases con efecto raro.',
  'Un personaje de vestuario: ruido, carisma y una forma muy propia de competir.',
  'Corre poco en silencio y mucho con cara de plan maestro.',
  'Tiene tecnica de barrio, ego de final y una pose que pide cromo premium.',
  'Puede fallar lo facil y meter lo absurdo, por eso todos lo quieren en el album.',
  'Un clasico Marcatoon: nariz, gesto y personalidad antes que cualquier estadistica.',
];

function ratingFor(index: number, position: string) {
  const base = 63 + ((index * 7) % 31);
  return position === 'GK' ? Math.min(96, base + 2) : base;
}

function stat(seed: number, modifier = 0) {
  return Math.max(35, Math.min(99, 48 + ((seed * 13 + modifier) % 47)));
}

function countryCode(country: string) {
  return (
    {
      Argentina: 'ARG',
      Brazil: 'BRA',
      Spain: 'ESP',
      England: 'ENG',
      France: 'FRA',
      Italy: 'ITA',
      Germany: 'GER',
      Portugal: 'POR',
      Japan: 'JPN',
      Senegal: 'SEN',
      Morocco: 'MAR',
      Netherlands: 'NED',
      Croatia: 'CRO',
      Mexico: 'MEX',
      Uruguay: 'URU',
    }[country] ?? country.slice(0, 3).toUpperCase()
  );
}

type ManifestEntry = {
  global_player_number: number;
  name: string;
  club?: string;
  clubCode?: string;
  position?: string;
  nationality?: string;
  flag?: string;
  bio?: string;
  category?: 'standard' | 'icon';
  cutout: string;
  cards: Partial<Record<Rarity, string>>;
};

const manifest = collectionManifest as ManifestEntry[];

export const players: Player[] = manifest.map((entry, i) => {
  const id = entry.global_player_number;
  const club = clubs[i % clubs.length];
  const country = countries[(i * 3 + Math.floor(i / 7)) % countries.length];
  const position = positions[(i * 5 + Math.floor(i / 13)) % positions.length];
  const rating = ratingFor(i, position);
  const palette = [club[2][0], club[2][1], ['#f0b17a', '#8f5135', '#d98c5f', '#5b3527'][i % 4]];

  return {
    id,
    cardNumber: id,
    name: entry.name,
    assets: {
      cutout: entry.cutout,
      cards: entry.cards,
    },
    category: entry.category ?? 'standard',
    nationality: entry.nationality ?? country[0],
    flag: entry.flag ?? countryCode(entry.nationality ?? country[0]),
    club: entry.club ?? club[0],
    clubCode: entry.clubCode ?? club[1],
    position: entry.position ?? position,
    rating,
    stats: {
      PAC: stat(i, position.includes('W') || position === 'ST' ? 18 : 0),
      SHO: stat(i + 4, position === 'ST' || position === 'CAM' ? 16 : -4),
      PAS: stat(i + 8, position === 'CM' || position === 'CAM' ? 14 : 0),
      DEF: stat(i + 12, position.includes('B') || position === 'CDM' ? 18 : -8),
      PHY: stat(i + 16, position === 'CB' || position === 'ST' ? 12 : 0),
    },
    bio: entry.bio ?? bios[i % bios.length],
    archetype: archetypes[(i * 2 + Math.floor(i / 9)) % archetypes.length],
    palette,
    hair: i % 9,
    expression: (i * 2) % 7,
    pose: (i * 3) % 5,
  };
});

export function supplyKey(playerId: number, rarity: Rarity) {
  return `${playerId}:${rarity}`;
}

export function createInitialSupply(): SupplyLedger {
  const supply: SupplyLedger = {};
  for (const player of players) {
    for (const rarity of rarityOrder) {
      const max = rarities[rarity].supply;
      if (max && player.assets.cards[rarity]) supply[supplyKey(player.id, rarity)] = max;
    }
  }
  return supply;
}

export function maxSupplyFor(rarity: Rarity) {
  return rarities[rarity].supply ?? undefined;
}
