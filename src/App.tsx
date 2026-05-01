import { AnimatePresence, motion } from 'framer-motion';
import {
  BadgeCent,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Gem,
  Gamepad2,
  PackageOpen,
  RefreshCw,
  Repeat2,
  Search,
  Shield,
  Sparkles,
  Trophy,
  User,
  X,
} from 'lucide-react';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { bestOwnedForPlayer, getPlayer, ownedVersions, progressFor, remainingFor, scarcityHighlights } from './collection';
import { players, rarities, rarityOrder, standardRarityOrder } from './data';
import { loadState, openPackTransaction, resetPrototype, saveState } from './storage';
import type { AppState, OwnedCard, PackMode, Player, Rarity } from './types';

type Screen = 'album' | 'collection' | 'packs' | 'exchange' | 'minigames' | 'profile';

const navItems: { screen: Screen; label: string; icon: typeof BookOpen }[] = [
  { screen: 'album', label: 'Album', icon: BookOpen },
  { screen: 'collection', label: 'Cards', icon: Gem },
  { screen: 'packs', label: 'Packs', icon: PackageOpen },
  { screen: 'exchange', label: 'Exchange', icon: Repeat2 },
  { screen: 'minigames', label: 'Minigames', icon: Gamepad2 },
];

const rarityFilters: ('all' | Rarity)[] = ['all', ...rarityOrder];
const pageSize = 9;
const cardPageSize = 36;

function editionLabel(card?: OwnedCard) {
  if (!card?.edition || !card.maxEdition) return 'Open edition';
  return `${String(card.edition).padStart(2, '0')}/${card.maxEdition}`;
}

function PlayerAvatar({ player, compact = false }: { player: Player; compact?: boolean }) {
  const [primary, accent, skin] = player.palette;
  const hairColors = ['#19110b', '#050505', '#6c3b17', '#f0c13d', '#461111', '#f6efe2', '#17243a', '#7d4a29', '#111'];
  const hair = hairColors[player.hair];
  const grin = player.expression % 3 !== 1;
  const lookingLeft = player.pose % 2 === 0;
  const noseX = lookingLeft ? 91 : 109;
  const noseRotate = lookingLeft ? -8 : 8;
  const armLeft = player.pose % 3 === 0 ? 'M57 145 q-35 -26 -18 -59' : 'M62 145 q-24 4 -35 31';
  const armRight = player.pose % 3 === 1 ? 'M143 144 q37 -24 20 -60' : 'M138 145 q24 6 36 31';
  const eyeShift = lookingLeft ? -4 : 4;

  return (
    <svg className={`avatar-art marcatoon ${compact ? 'compact' : ''}`} viewBox="0 0 200 220" role="img" aria-label={`${player.name} Marcatoon avatar`}>
      <defs>
        <linearGradient id={`kit-${player.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
        <radialGradient id={`skin-${player.id}`} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffd3a3" />
          <stop offset="100%" stopColor={skin} />
        </radialGradient>
      </defs>
      <g className="comic-zaps">
        <path d="M28 61 l13 -17 l-4 17 l13 -3 l-18 19 l5 -16z" />
        <path d="M158 43 l18 -15 l-8 18 l15 -2 l-22 18 l8 -15z" />
      </g>
      <ellipse cx="100" cy="205" rx={compact ? 52 : 68} ry="10" fill="#000" opacity=".35" />
      <path className="toon-arm" d={armLeft} fill="none" stroke={`url(#skin-${player.id})`} />
      <path className="toon-arm" d={armRight} fill="none" stroke={`url(#skin-${player.id})`} />
      <path className="toon-body" d="M51 127 q49 -24 98 0 l22 79 H29z" fill={`url(#kit-${player.id})`} />
      <path className="toon-sash" d="M77 130 h48 l-8 46 H85z" fill="#fff" opacity=".18" />
      <circle className="toon-fist" cx={player.pose % 3 === 0 ? 39 : 27} cy={player.pose % 3 === 0 ? 86 : 176} r="13" fill={`url(#skin-${player.id})`} />
      <circle className="toon-fist" cx={player.pose % 3 === 1 ? 163 : 174} cy={player.pose % 3 === 1 ? 84 : 176} r="13" fill={`url(#skin-${player.id})`} />
      <path className="toon-neck" d="M84 119 q17 12 34 0 v25 q-17 12 -34 0z" fill={skin} />
      <path className="toon-head" d="M50 73 q3 -47 43 -57 q41 -10 67 23 q24 31 7 72 q-14 35 -58 38 q-49 4 -63 -36 q-8 -22 4 -40z" fill={`url(#skin-${player.id})`} />
      {player.hair % 3 === 0 ? (
        <path className="toon-hair" d="M47 67 q10 -54 53 -55 l-8 20 l25 -23 l-3 25 l29 -18 l-9 28 l28 -7 q9 13 8 34 q-47 -22 -123 -4z" fill={hair} />
      ) : player.hair % 3 === 1 ? (
        <g className="toon-hair curls" fill={hair}>
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={54 + ((i * 11) % 100)} cy={41 + ((i * 17) % 31)} r={13 - (i % 3)} />
          ))}
        </g>
      ) : (
        <path className="toon-hair" d="M48 74 q8 -56 43 -61 q24 -4 34 14 q30 3 38 42 q-26 -13 -39 -10 q-21 -28 -30 -4 q-20 -16 -46 19z" fill={hair} />
      )}
      <ellipse className="toon-ear" cx="48" cy="82" rx="10" ry="14" fill={skin} />
      <ellipse className="toon-ear" cx="160" cy="85" rx="10" ry="14" fill={skin} />
      <g className="toon-eyes">
        <ellipse cx="79" cy="76" rx="12" ry="15" fill="#fff" />
        <ellipse cx="121" cy="76" rx="12" ry="15" fill="#fff" />
        <circle cx={79 + eyeShift} cy="78" r="5" fill="#050505" />
        <circle cx={121 + eyeShift} cy="78" r="5" fill="#050505" />
        <path d="M65 58 q16 -12 30 -2" />
        <path d="M110 56 q16 -10 31 1" />
      </g>
      <ellipse className="toon-nose" cx={noseX} cy="91" rx="28" ry="15" transform={`rotate(${noseRotate} ${noseX} 91)`} fill="#ffc08e" />
      <path className="toon-nose-line" d={lookingLeft ? 'M87 87 q-11 8 -2 17' : 'M113 87 q12 8 2 17'} />
      {grin ? (
        <g className="mega-grin">
          <path d="M69 107 q34 34 77 2 q-4 27 -36 32 q-31 4 -41 -34z" fill="#111" />
          <path d="M76 111 q31 20 63 0 q-7 16 -30 18 q-21 1 -33 -18z" fill="#fff" />
          <path d="M84 113 v12 M96 116 v13 M109 117 v13 M122 115 v11" />
        </g>
      ) : (
        <g className="worried-mouth">
          <path d="M82 121 q26 -15 50 2" />
          <circle cx="73" cy="103" r="5" fill="#f18f78" opacity=".7" />
        </g>
      )}
      <path className="toon-chin" d="M84 140 q22 12 48 -3" />
      <text x="100" y="169" textAnchor="middle" fontSize="26" fontWeight="900" fill="#fff" stroke="#111" strokeWidth="3" paintOrder="stroke">
        {player.clubCode}
      </text>
    </svg>
  );
}

function ParticleCanvas({ tone = '#ffd36b' }: { tone?: string }) {
  return (
    <div className="particle-field" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <i
          key={i}
          style={
            {
              '--x': `${(i * 37) % 100}%`,
              '--delay': `${(i % 9) * 0.22}s`,
              '--tone': tone,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

function rarityFxName(rarity: Rarity) {
  return (
    {
      base: 'base',
      bronze: 'bronce',
      silver: 'plata',
      gold: 'oro',
      diamond: 'diamante',
      opal: 'opalo',
      icon: 'icono',
    } satisfies Record<Rarity, string>
  )[rarity];
}

function RarityAura({ rarity }: { rarity: Rarity }) {
  const particleCount = rarity === 'base' ? 0 : rarity === 'bronze' || rarity === 'silver' ? 4 : rarity === 'icon' ? 14 : 8;
  return (
    <div className="card-aura-system" aria-hidden="true">
      <div className="aura-core" />
      <div className="aura-shine" />
      <div className="aura-orbit">
        <span />
        <span />
        <span />
      </div>
      {particleCount ? (
        <div className="aura-particles">
          {Array.from({ length: particleCount }, (_, i) => (
            <span
              key={i}
              style={
                {
                  '--particle-x': `${6 + ((i * 23) % 88)}%`,
                  '--particle-delay': `${(i % 8) * 0.19}s`,
                  '--particle-size': `${3 + (i % 4)}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PackRevealFx({ rarity }: { rarity: Rarity }) {
  const fx = rarityFxName(rarity);
  const colors: Record<Rarity, string[]> = {
    base: ['rgba(220,230,255,.95)', 'rgba(170,190,230,.72)'],
    bronze: ['rgba(255,165,85,.95)', 'rgba(255,105,35,.75)'],
    silver: ['rgba(245,250,255,.98)', 'rgba(170,195,235,.78)'],
    gold: ['rgba(255,220,70,.98)', 'rgba(255,165,25,.82)'],
    diamond: ['rgba(120,230,255,1)', 'rgba(95,150,255,.82)'],
    opal: ['rgba(255,120,220,1)', 'rgba(115,225,255,.85)', 'rgba(255,225,110,.78)'],
    icon: ['rgba(255,255,245,1)', 'rgba(255,220,100,.95)', 'rgba(160,235,255,.78)'],
  };
  const palette = colors[rarity];

  return (
    <div className={`pack-rarity-layer fx-${fx} show`} aria-hidden="true">
      <div className="pack-rarity-ring" />
      <div className="pack-rarity-rays" />
      <div className="pack-rarity-particles">
        {Array.from({ length: rarity === 'base' ? 4 : rarity === 'bronze' || rarity === 'silver' ? 8 : rarity === 'icon' ? 22 : 14 }, (_, i) => {
          const count = rarity === 'base' ? 4 : rarity === 'bronze' || rarity === 'silver' ? 8 : rarity === 'icon' ? 22 : 14;
          const angle = (Math.PI * 2 * i) / count;
          const distance = rarity === 'icon' ? 210 : rarity === 'opal' ? 178 : rarity === 'diamond' ? 160 : rarity === 'gold' ? 145 : 118;
          return (
            <span
              key={i}
              style={
                {
                  '--x': `${50 + Math.cos(angle) * 9}%`,
                  '--y': `${50 + Math.sin(angle) * 9}%`,
                  '--mx': `${Math.cos(angle) * distance}px`,
                  '--my': `${Math.sin(angle) * distance}px`,
                  '--s': `${5 + (i % 4) * 2}px`,
                  '--c': palette[i % palette.length],
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>
    </div>
  );
}

function ScreenCue({ rarity }: { rarity: Rarity }) {
  if (rarity !== 'diamond' && rarity !== 'opal' && rarity !== 'icon') return null;
  const fx = rarityFxName(rarity);
  return (
    <div className={`pack-screen-cue ${fx} show`} aria-hidden="true">
      <div className="cue-fog" />
      <div className="cue-side left" />
      <div className="cue-side right" />
      <div className="cue-border" />
      <div className="cue-shards" />
      <div className="cue-core" />
      <div className="cue-lightning" />
    </div>
  );
}

function OpeningPack({ src, opening = false, rarity = 'base' }: { src: string; opening?: boolean; rarity?: Rarity }) {
  return (
    <div className={`pack-open-zone ${opening ? 'opening' : ''} ${rarity === 'icon' ? 'incoming-icon' : ''} ${rarity === 'opal' ? 'incoming-opal' : ''}`}>
      <div className="pack-burst" />
      <div className="pack-flash" />
      {rarity === 'icon' ? (
        <>
          <div className="pack-divinity" />
          <div className="pack-divinity pack-divinity-alt" />
          <div className="pack-crown" />
        </>
      ) : null}
      <div className="animated-pack">
        {opening ? (
          <>
            <img className="pack-piece pack-full" src={src} alt="" draggable={false} />
            <img className="pack-piece pack-left" src={src} alt="" draggable={false} />
            <img className="pack-piece pack-right" src={src} alt="" draggable={false} />
            <img className="pack-piece pack-top" src={src} alt="" draggable={false} />
            <img className="pack-piece pack-bottom" src={src} alt="" draggable={false} />
          </>
        ) : (
          <img className="pack-piece pack-full" src={src} alt="" draggable={false} />
        )}
        <div className="tear-light" />
      </div>
    </div>
  );
}

function CardView({
  card,
  player,
  ghost = false,
  small = false,
  animated,
  rarityOverride,
  tapMode = 'flip',
  onClick,
}: {
  card?: OwnedCard;
  player: Player;
  ghost?: boolean;
  small?: boolean;
  animated?: boolean;
  rarityOverride?: Rarity;
  tapMode?: 'flip' | 'open';
  onClick?: () => void;
}) {
  const rarity = card?.rarity ?? rarityOverride ?? 'base';
  const [flipped, setFlipped] = useState(false);
  const canFlip = !ghost;
  const edition = editionLabel(card);
  const frontImage = player.assets.cards[rarity] ?? Object.values(player.assets.cards)[0] ?? '';

  function handleCardTap() {
    if (tapMode === 'open') {
      onClick?.();
      return;
    }
    if (ghost) return;
    setFlipped((value) => !value);
  }

  const className = `sticker-card real-card ${rarity} ${ghost ? 'ghost' : ''} ${small ? 'small lightweight' : ''} ${flipped ? 'is-flipped' : ''} ${canFlip ? 'can-flip' : 'no-flip'}`;
  const content = (
    <div className="card-flip-inner">
      <div className="card-face card-face-front">
        {ghost ? (
          <div className="missing-real-card">
            <div className="silhouette">?</div>
            <strong>Missing</strong>
          </div>
        ) : (
          <>
            {(animated ?? !small) ? <RarityAura rarity={rarity} /> : null}
            <img src={frontImage} alt={`${player.name} ${rarities[rarity].label} card`} draggable={false} loading={small ? 'lazy' : 'eager'} />
            {card?.duplicate ? <div className="dupe-ribbon">Duplicate</div> : null}
          </>
        )}
      </div>
      <div className="card-face card-face-back">
        <span className="back-kicker">{rarities[rarity].label}</span>
        <dl>
          <div>
            <dt>Club</dt>
            <dd>{player.club}</dd>
          </div>
          <div>
            <dt>Posicion</dt>
            <dd>{player.position}</dd>
          </div>
          <div>
            <dt>Nacion</dt>
            <dd>{player.flag} {player.nationality}</dd>
          </div>
          <div>
            <dt>Rareza</dt>
            <dd>{rarities[rarity].label}</dd>
          </div>
          <div>
            <dt>Numerada</dt>
            <dd>{edition}</dd>
          </div>
        </dl>
        <small>Toque para volver</small>
      </div>
    </div>
  );

  if (small) {
    return (
      <button type="button" className={className} onClick={handleCardTap} aria-label={`${player.name} ${rarities[rarity].label}`}>
        {content}
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      className={className}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -4 }}
      onClick={handleCardTap}
      aria-label={`${player.name} ${rarities[rarity].label}`}
    >
      {content}
    </motion.button>
  );
}

function ProgressRing({ value }: { value: number }) {
  return (
    <div className="progress-ring" style={{ '--progress': `${value * 3.6}deg` } as React.CSSProperties}>
      <span>{value}%</span>
    </div>
  );
}

function HomeScreen({
  state,
  onOpenPack,
  onSelectCard,
}: {
  state: AppState;
  onOpenPack: () => void;
  onSelectCard: (player: Player) => void;
}) {
  const progress = progressFor(state);
  const recent = [...state.ownedCards].sort((a, b) => b.pulledAt - a.pulledAt).slice(0, 5);
  return (
    <main className="screen home-screen">
      <section className="hero-panel">
        <div className="brand-lockup">
          <span className="ball-mark">★</span>
          <div>
            <p>Virtua Football</p>
            <h1>Sticker Album</h1>
          </div>
        </div>
        <ProgressRing value={progress.albumPercent} />
        <button className="primary-action" onClick={onOpenPack}>
          <PackageOpen size={18} /> Open premium pack
        </button>
      </section>

      <section className="metric-strip">
        <Metric label="Players" value={`${progress.uniquePlayers}/${players.length}`} />
        <Metric label="Cards" value={progress.totalCards} />
        <Metric label="Duplicates" value={progress.duplicates} />
      </section>

      <section>
        <SectionTitle icon={Trophy} title="Recent Pulls" />
        <div className="horizontal-cards">
          {recent.length ? (
            recent.map((card) => <CardView key={card.id} card={card} player={getPlayer(card.playerId)} small onClick={() => onSelectCard(getPlayer(card.playerId))} />)
          ) : (
            <EmptyState title="No cards yet" body="Open a pack to begin the album." />
          )}
        </div>
      </section>

      <section>
        <SectionTitle icon={Shield} title="Global Scarcity" />
        <div className="scarcity-list">
          {scarcityHighlights(state).map(({ player, rarity, remaining }) => (
            <button key={`${player.id}-${rarity}`} onClick={() => onSelectCard(player)}>
              <span className={`rarity-dot ${rarity}`} />
              <strong>{player.name}</strong>
              <em>{rarities[rarity].label}</em>
              <b>{remaining} left</b>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof BookOpen; title: string }) {
  return (
    <div className="section-title">
      <Icon size={18} />
      <h2>{title}</h2>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
}

function AlbumScreen({ state, onSelectCard }: { state: AppState; onSelectCard: (player: Player) => void }) {
  const [page, setPage] = useState(0);
  const [rarity, setRarity] = useState<'all' | Rarity>('all');
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () =>
      [...players]
        .filter((player) => {
          const text = `${player.name} ${player.club} ${player.nationality} ${player.position}`.toLowerCase();
          const hasRarity = rarity === 'all' || state.ownedCards.some((card) => card.playerId === player.id && card.rarity === rarity);
          return text.includes(query.toLowerCase()) && hasRarity;
        })
        .sort((a, b) => a.club.localeCompare(b.club) || a.cardNumber - b.cardNumber),
    [query, rarity, state.ownedCards],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice(page * pageSize, page * pageSize + pageSize);

  useEffect(() => {
    setPage(0);
  }, [rarity, query]);

  return (
    <main className="screen">
      <ScreenHeader eyebrow="Digital book" title="Album" />
      <AlbumCover state={state} />
      <Toolbar rarity={rarity} setRarity={setRarity} query={query} setQuery={setQuery} />
      <div className="album-shell">
        <div className="book-spine" />
        <AnimatePresence mode="wait">
          <motion.div
            key={`${page}-${rarity}-${query}`}
            className="album-page"
            initial={{ rotateY: -72, opacity: 0.4, x: -22 }}
            animate={{ rotateY: 0, opacity: 1, x: 0 }}
            exit={{ rotateY: 72, opacity: 0, x: 22 }}
            transition={{ duration: 0.48, ease: [0.2, 0.72, 0.15, 1] }}
          >
            <div className="page-heading">
              <span>Ordenado por equipo</span>
              <b>
                {page + 1}/{pages}
              </b>
            </div>
            <div className="album-grid">
              {visible.map((player, index) => {
                const best = bestOwnedForPlayer(state.ownedCards, player.id);
                const showClub = index === 0 || visible[index - 1].club !== player.club;
                return (
                  <Fragment key={player.id}>
                    {showClub ? (
                      <div className="club-divider">
                        <span>{player.club}</span>
                        <b>{player.clubCode}</b>
                      </div>
                    ) : null}
                    <div className="album-slot-hitbox" onClick={() => onSelectCard(player)}>
                      <CardView card={best} player={player} ghost={!best} small tapMode="open" onClick={() => onSelectCard(player)} />
                    </div>
                  </Fragment>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="pager">
        <button onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0}>
          <ChevronLeft />
        </button>
        <span>{filtered.length} slots</span>
        <button onClick={() => setPage((value) => Math.min(pages - 1, value + 1))} disabled={page >= pages - 1}>
          <ChevronRight />
        </button>
      </div>
    </main>
  );
}

function Toolbar({
  rarity,
  setRarity,
  query,
  setQuery,
}: {
  rarity: 'all' | Rarity;
  setRarity: (rarity: 'all' | Rarity) => void;
  query: string;
  setQuery: (query: string) => void;
}) {
  return (
    <div className="toolbar">
      <label className="search-box">
        <Search size={16} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search player, club, country" />
      </label>
      <div className="segmented-scroll">
        {rarityFilters.map((item) => (
          <button key={item} className={rarity === item ? 'active' : ''} onClick={() => setRarity(item)}>
            {item === 'all' ? 'All' : rarities[item].label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScreenHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="screen-header">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
    </header>
  );
}

function AlbumCover({ state }: { state: AppState }) {
  const progress = progressFor(state);
  const coverPlayers = [...players]
    .sort((a, b) => Number(Boolean(bestOwnedForPlayer(state.ownedCards, b.id))) - Number(Boolean(bestOwnedForPlayer(state.ownedCards, a.id))) || a.cardNumber - b.cardNumber)
    .slice(0, 3);

  return (
    <section className="album-cover" aria-label="Tapa del album">
      <div className="cover-copy">
        <span>TAPA</span>
        <h2>Virtua Football Album</h2>
        <p>Season One</p>
      </div>
      <div className="cover-players" aria-hidden="true">
        {coverPlayers.map((player) => (
          <img key={player.id} src={player.assets.cutout} alt="" draggable={false} />
        ))}
      </div>
      <div className="cover-stamp">
        <b>{progress.albumPercent}%</b>
        <small>{progress.uniquePlayers}/{players.length}</small>
      </div>
    </section>
  );
}

function PackScreen({
  state,
  setState,
  onSelectCard,
}: {
  state: AppState;
  setState: (state: AppState) => void;
  onSelectCard: (player: Player) => void;
}) {
  const [phase, setPhase] = useState<'idle' | 'tear' | 'opening' | 'reveal' | 'done'>('idle');
  const [cards, setCards] = useState<OwnedCard[]>([]);
  const [index, setIndex] = useState(0);
  const [packMode, setPackMode] = useState<PackMode>('standard');
  const [revealNonce, setRevealNonce] = useState(0);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const swipeTriggered = useRef(false);
  const openingTimer = useRef<number | null>(null);

  const active = cards[index];
  const activeRarity = active?.rarity ?? 'base';
  const activeFx = rarityFxName(activeRarity);
  const activePackSrc = packMode === 'boosted' ? '/supersobre.png' : '/sobre_normal.png';

  useEffect(() => {
    return () => {
      if (openingTimer.current) window.clearTimeout(openingTimer.current);
    };
  }, []);

  function startPack(mode: PackMode = 'standard') {
    if (openingTimer.current) window.clearTimeout(openingTimer.current);
    const result = openPackTransaction(state, mode);
    setPackMode(mode);
    setState(result.state);
    setCards(result.cards);
    setIndex(0);
    setPhase('tear');
  }

  function playPackOpening() {
    setPhase('opening');
    if (openingTimer.current) window.clearTimeout(openingTimer.current);
    openingTimer.current = window.setTimeout(() => {
      setRevealNonce((value) => value + 1);
      setPhase('reveal');
    }, 1780);
  }

  function revealNext() {
    if (index < cards.length - 1) {
      setRevealNonce((value) => value + 1);
      setIndex(index + 1);
      return;
    }
    setPhase('done');
  }

  function swipeProps(action: () => void, threshold = 58) {
    const start = (x: number, y: number) => {
      swipeStart.current = { x, y };
      swipeTriggered.current = false;
    };
    const check = (x: number, y: number) => {
      if (!swipeStart.current || swipeTriggered.current) return;
      const dx = x - swipeStart.current.x;
      const dy = y - swipeStart.current.y;
      if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.2) {
        swipeTriggered.current = true;
        swipeStart.current = null;
        action();
      }
    };
    const end = (x: number, y: number) => {
      check(x, y);
      swipeStart.current = null;
    };
    return {
      onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
        start(event.clientX, event.clientY);
      },
      onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
        check(event.clientX, event.clientY);
      },
      onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
        end(event.clientX, event.clientY);
      },
      onMouseDown: (event: React.MouseEvent<HTMLElement>) => {
        start(event.clientX, event.clientY);
      },
      onMouseUp: (event: React.MouseEvent<HTMLElement>) => {
        end(event.clientX, event.clientY);
      },
      onMouseMove: (event: React.MouseEvent<HTMLElement>) => {
        check(event.clientX, event.clientY);
      },
      onTouchStart: (event: React.TouchEvent<HTMLElement>) => {
        const touch = event.touches[0];
        start(touch.clientX, touch.clientY);
      },
      onTouchEnd: (event: React.TouchEvent<HTMLElement>) => {
        const touch = event.changedTouches[0];
        end(touch.clientX, touch.clientY);
      },
      onTouchMove: (event: React.TouchEvent<HTMLElement>) => {
        const touch = event.touches[0];
        check(touch.clientX, touch.clientY);
      },
      onPointerCancel: () => {
        swipeStart.current = null;
      },
      onTouchCancel: () => {
        swipeStart.current = null;
      },
    };
  }

  return (
    <main className={`screen pack-screen ${activeRarity}`}>
      <ScreenHeader eyebrow="Sobres" title="Abrir sobre" />
      <div className={`pack-stage ${phase === 'opening' ? 'opening' : ''} ${phase === 'reveal' && activeRarity === 'diamond' ? 'screen-diamante' : ''} ${phase === 'reveal' && activeRarity === 'opal' ? 'screen-opalo' : ''} ${phase === 'reveal' && activeRarity === 'icon' ? 'screen-icono' : ''}`}>
        {(activeRarity === 'diamond' || activeRarity === 'opal' || activeRarity === 'icon') && phase === 'reveal' ? <ParticleCanvas tone={rarities[activeRarity].glow} /> : null}
        {phase === 'idle' ? (
          <div className="pack-choice">
            <button className="sealed-pack image-pack" onClick={() => startPack('standard')}>
              <img src="/sobre_normal.png" alt="Normal Pack" draggable={false} />
              <em>Tocar para entrar</em>
            </button>
            <button className="sealed-pack image-pack boosted-pack" onClick={() => startPack('boosted')}>
              <img src="/supersobre.png" alt="SUPERPACK" draggable={false} />
              <strong>SUPERPACK</strong>
              <em>Tocar para entrar</em>
            </button>
          </div>
        ) : null}

        {phase === 'tear' ? (
          <motion.button className="sealed-pack image-pack tearing pack-tear-button" {...swipeProps(playPackOpening)} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
            <OpeningPack src={activePackSrc} rarity={activeRarity} />
            <em>Deslizar para abrir</em>
          </motion.button>
        ) : null}

        {phase === 'opening' ? <OpeningPack src={activePackSrc} opening rarity={activeRarity} /> : null}

        {phase === 'reveal' && active ? <ScreenCue key={`cue-${active.id}-${revealNonce}`} rarity={active.rarity} /> : null}

        {phase === 'reveal' && active ? (
          <div key={`zone-${active.id}-${revealNonce}`} className="reveal-zone">
            <PackRevealFx key={`fx-${active.id}-${revealNonce}`} rarity={active.rarity} />
            {active.rarity === 'opal' ? <div className="cinematic-flash">Pink Opal pull</div> : null}
            {active.rarity === 'icon' ? <div className="cinematic-flash icon-flash">ICONO</div> : null}
            <div
              key={`${active.id}-${revealNonce}`}
              className={`flip-holder single-card-reveal ${activeFx} enter-${activeFx}`}
              {...swipeProps(revealNext)}
            >
              <CardView card={active} player={getPlayer(active.playerId)} onClick={() => onSelectCard(getPlayer(active.playerId))} />
            </div>
            <div className="swipe-hint">{index < cards.length - 1 ? `Deslizar carta ${index + 1}/5` : 'Deslizar para terminar'}</div>
          </div>
        ) : null}

        {phase === 'done' ? (
          <div className="pack-summary">
            <h2>Pack complete</h2>
            <div className="summary-grid">
              {cards.map((card) => (
                <CardView key={card.id} card={card} player={getPlayer(card.playerId)} small onClick={() => onSelectCard(getPlayer(card.playerId))} />
              ))}
            </div>
            <button className="primary-action" onClick={() => setPhase('idle')}>
              <PackageOpen size={18} /> Elegir otro sobre
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function CollectionScreen({ state, onSelectCard }: { state: AppState; onSelectCard: (player: Player) => void }) {
  const [rarity, setRarity] = useState<'all' | Rarity>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const cards = useMemo(
    () =>
      [...state.ownedCards]
        .filter((card) => rarity === 'all' || card.rarity === rarity)
        .filter((card) => {
          const player = getPlayer(card.playerId);
          return `${player.name} ${player.club} ${player.nationality}`.toLowerCase().includes(query.toLowerCase());
        })
        .sort((a, b) => rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity) || b.pulledAt - a.pulledAt),
    [query, rarity, state.ownedCards],
  );
  const pages = Math.max(1, Math.ceil(cards.length / cardPageSize));
  const visibleCards = cards.slice(page * cardPageSize, page * cardPageSize + cardPageSize);

  useEffect(() => {
    setPage(0);
  }, [rarity, query]);

  return (
    <main className="screen">
      <ScreenHeader eyebrow="Vault" title="Cards" />
      <Toolbar rarity={rarity} setRarity={setRarity} query={query} setQuery={setQuery} />
      <div className="collection-grid">
        {cards.length ? (
          visibleCards.map((card) => <CardView key={card.id} card={card} player={getPlayer(card.playerId)} small onClick={() => onSelectCard(getPlayer(card.playerId))} />)
        ) : (
          <EmptyState title="No matching cards" body="Try another filter or open packs." />
        )}
      </div>
      {cards.length > cardPageSize ? (
        <div className="pager">
          <button onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0}>
            <ChevronLeft />
          </button>
          <span>{page * cardPageSize + 1}-{Math.min(cards.length, (page + 1) * cardPageSize)} / {cards.length}</span>
          <button onClick={() => setPage((value) => Math.min(pages - 1, value + 1))} disabled={page >= pages - 1}>
            <ChevronRight />
          </button>
        </div>
      ) : null}
    </main>
  );
}

function ExchangeScreen({ state, setState }: { state: AppState; setState: (state: AppState) => void }) {
  const duplicates = state.ownedCards.filter((card) => card.duplicate);
  const value = duplicates.reduce((sum, card) => sum + rarities[card.rarity].points, 0);

  function exchangeAll() {
    const duplicateIds = new Set(duplicates.map((card) => card.id));
    setState({
      ...state,
      ownedCards: state.ownedCards.filter((card) => !duplicateIds.has(card.id)),
      exchangePoints: state.exchangePoints + value,
    });
  }

  return (
    <main className="screen">
      <ScreenHeader eyebrow="Crafting desk" title="Exchange" />
      <section className="exchange-panel">
        <div>
          <span className="eyebrow">Duplicate balance</span>
          <h2>{duplicates.length} cards</h2>
          <p>Duplicates convert into exchange points for future crafting, pack discounts, and upgrade chances.</p>
        </div>
        <div className="points-orb">
          <b>{state.exchangePoints}</b>
          <span>points</span>
        </div>
      </section>
      <button className="primary-action wide" disabled={!duplicates.length} onClick={exchangeAll}>
        <RefreshCw size={18} /> Convert all duplicates for {value} pts
      </button>
      <div className="collection-grid">
        {duplicates.length ? duplicates.map((card) => <CardView key={card.id} card={card} player={getPlayer(card.playerId)} small />) : <EmptyState title="No duplicates" body="Every duplicate you pull will appear here." />}
      </div>
    </main>
  );
}

function MinigamesScreen({ state, onOpenPack }: { state: AppState; onOpenPack: () => void }) {
  const progress = progressFor(state);
  const games = [
    { title: 'Penalty Rush', meta: `${progress.rareCards} rare cards`, action: 'Coming soon' },
    { title: 'Memory Match', meta: `${progress.uniquePlayers} players`, action: 'Coming soon' },
    { title: 'Pack Sprint', meta: `${state.openedPacks} packs opened`, action: 'Open packs' },
  ];

  return (
    <main className="screen">
      <ScreenHeader eyebrow="Arcade" title="Minigames" />
      <div className="minigame-grid">
        {games.map((game) => (
          <section key={game.title} className="minigame-card">
            <Gamepad2 size={24} />
            <div>
              <h2>{game.title}</h2>
              <p>{game.meta}</p>
            </div>
            <button className={game.action === 'Open packs' ? 'primary-action compact' : 'ghost-action'} onClick={game.action === 'Open packs' ? onOpenPack : undefined} disabled={game.action !== 'Open packs'}>
              {game.action}
            </button>
          </section>
        ))}
      </div>
    </main>
  );
}

function ProfileScreen({ state, setState }: { state: AppState; setState: (state: AppState) => void }) {
  const progress = progressFor(state);
  return (
    <main className="screen">
      <ScreenHeader eyebrow="Collector ID" title="Profile" />
      <section className="profile-card">
        <ProgressRing value={progress.albumPercent} />
        <div>
          <h2>Legacy Collector</h2>
          <p>Season One prototype account stored locally on this device.</p>
        </div>
      </section>
      <section className="metric-strip two">
        <Metric label="Opened packs" value={state.openedPacks} />
        <Metric label="Rare cards" value={progress.rareCards} />
        <Metric label="Exchange pts" value={state.exchangePoints} />
        <Metric label="Duplicates" value={progress.duplicates} />
      </section>
      <section>
        <SectionTitle icon={BadgeCent} title="Rarity Completion" />
        <div className="rarity-progress">
          {rarityOrder.map((rarity) => (
            <div key={rarity}>
              <span>{rarities[rarity].label}</span>
              <div>
                <i style={{ width: `${(progress.uniqueByRarity[rarity] / players.length) * 100}%` }} />
              </div>
              <b>{progress.uniqueByRarity[rarity]}/{players.length}</b>
            </div>
          ))}
        </div>
      </section>
      <button
        className="danger-action"
        onClick={() => {
          resetPrototype();
          setState(loadState());
        }}
      >
        Reset local prototype
      </button>
    </main>
  );
}

function PlayerDetail({
  player,
  state,
  onClose,
}: {
  player: Player;
  state: AppState;
  onClose: () => void;
}) {
  const versionRows = ownedVersions(state.ownedCards, player.id).filter(({ rarity }) =>
    player.category === 'icon' ? rarity === 'icon' : standardRarityOrder.includes(rarity),
  );

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.article className="player-modal" initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}>
        <button className="close-button" onClick={onClose} aria-label="Close player detail">
          <X />
        </button>
        <div className="modal-hero">
          <img className="modal-cutout" src={player.assets.cutout} alt={player.name} />
          <div>
            <span className="eyebrow">#{String(player.cardNumber).padStart(3, '0')} {player.position}</span>
            <h2>{player.name}</h2>
            <p>
              {player.flag} {player.nationality} · {player.club}
            </p>
            <strong>{player.archetype}</strong>
          </div>
        </div>
        <p className="bio">
          {player.bio} {player.category === 'icon' ? 'Los iconos existen solo en rareza ICONO y estan numerados a 2.' : 'Cada jugador normal existe en todas las rarezas clasicas; lo que cambia es el marco, la escasez y el numerado.'}
        </p>
        <div className="variant-grid">
          {versionRows.map(({ rarity, cards }) => {
            const first = cards[0];
            const remaining = remainingFor(state, player.id, rarity);
            return (
              <div key={rarity} className={`variant ${rarity} ${first ? 'owned' : 'locked'}`}>
                <span>{rarities[rarity].label}</span>
                <b>{first ? `${cards.length} owned` : 'Locked'}</b>
                <em>{first ? editionLabel(first) : remaining === null ? 'Open edition' : `${remaining} remaining`}</em>
              </div>
            );
          })}
        </div>
        <div className="player-version-cards">
          {versionRows.map(({ rarity, cards }) => {
            const owned = [...cards].sort((a, b) => (b.edition ?? 0) - (a.edition ?? 0));
            const first = owned[0];
            return (
              <div key={rarity} className={`player-version-slot ${rarity} ${first ? 'owned' : 'locked'}`}>
                <CardView card={first} player={player} ghost={!first} rarityOverride={rarity} small />
                <div>
                  <strong>{rarities[rarity].label}</strong>
                  <span>{first ? `${owned.length} en album` : 'Bloqueada'}</span>
                  <em>{first ? editionLabel(first) : 'No conseguida'}</em>
                </div>
              </div>
            );
          })}
        </div>
      </motion.article>
    </motion.div>
  );
}

export default function App() {
  const [state, setStateRaw] = useState<AppState>(() => loadState());
  const [screen, setScreen] = useState<Screen>('album');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const progress = useMemo(() => progressFor(state), [state]);

  function setState(next: AppState) {
    setStateRaw(next);
    saveState(next);
  }

  function openPacksScreen() {
    setScreen('packs');
  }

  return (
    <div className="app">
      <div className="stadium-bg" />
      <header className="topbar">
        <div>
          <span>VIRTUA</span>
          <strong>Football Album</strong>
        </div>
        <button className={`profile-bubble ${screen === 'profile' ? 'active' : ''}`} onClick={() => setScreen('profile')} aria-label="Abrir perfil">
          <User size={18} />
          <span>{progress.albumPercent}%</span>
        </button>
      </header>

      <AnimatePresence mode="wait">
        <motion.div key={screen} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.22 }}>
          {screen === 'album' ? <AlbumScreen state={state} onSelectCard={setSelectedPlayer} /> : null}
          {screen === 'packs' ? <PackScreen state={state} setState={setState} onSelectCard={setSelectedPlayer} /> : null}
          {screen === 'collection' ? <CollectionScreen state={state} onSelectCard={setSelectedPlayer} /> : null}
          {screen === 'exchange' ? <ExchangeScreen state={state} setState={setState} /> : null}
          {screen === 'minigames' ? <MinigamesScreen state={state} onOpenPack={openPacksScreen} /> : null}
          {screen === 'profile' ? <ProfileScreen state={state} setState={setState} /> : null}
        </motion.div>
      </AnimatePresence>

      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map(({ screen: item, label, icon: Icon }) => (
          <button key={item} className={screen === item ? 'active' : ''} onClick={() => setScreen(item)}>
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <AnimatePresence>{selectedPlayer ? <PlayerDetail player={selectedPlayer} state={state} onClose={() => setSelectedPlayer(null)} /> : null}</AnimatePresence>
    </div>
  );
}
