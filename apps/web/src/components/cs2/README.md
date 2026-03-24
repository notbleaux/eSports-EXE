# CS2 Components

**[Ver001.000]**

Counter-Strike 2 visualization components for the 4NJZ4 TENET Platform.

## Components

### GameSelector
Located: `src/components/GameSelector.tsx`

Toggle between Valorant and CS2 game modes.

```tsx
import { GameSelector, type GameType } from '@/components/GameSelector';

function MyComponent() {
  const [game, setGame] = useState<GameType>('cs2');
  
  return (
    <GameSelector
      selectedGame={game}
      onGameChange={setGame}
    />
  );
}
```

### CS2MapViewer
Located: `src/components/cs2/CS2MapViewer.tsx`

Interactive CS2 map display with zoom, pan, and heatmap overlay.

```tsx
import { CS2MapViewer } from '@/components/cs2';
import type { CS2MapData } from '@/components/cs2';

const mapData: CS2MapData = {
  id: 'dust2',
  name: 'Dust II',
  game: 'cs2',
  // ... see types.ts for full structure
};

<CS2MapViewer
  mapData={mapData}
  heatmapData={heatmapData} // optional
  onMapClick={(x, y, z) => console.log(x, y, z)}
/>
```

**Features:**
- Zoom (25% - 400%)
- Pan/drag navigation
- Grid overlay toggle (Ctrl+G)
- Callout display
- Bombsite markers
- Heatmap overlay
- Fullscreen mode

### CS2WeaponCard
Located: `src/components/cs2/CS2WeaponCard.tsx`

Display weapon stats with optional comparison.

```tsx
import { CS2WeaponCard, CS2WeaponCompare } from '@/components/cs2';

// Single weapon
<CS2WeaponCard
  weapon={weapon}
  compareWeapon={otherWeapon} // optional
  onClick={handleClick}
  isSelected={false}
/>

// Side-by-side comparison
<CS2WeaponCompare
  weapon1={weapon1}
  weapon2={weapon2}
/>
```

**Stats Displayed:**
- Damage
- Fire Rate (RPM)
- Recoil Control
- Armor Penetration
- Movement Speed
- Price & Kill Reward
- Magazine/Reserve Ammo

## CS2 Hub
Located: `src/hub-cs2/index.tsx`

Full CS2 hub page with:
- Overview
- Maps viewer
- Weapons comparison
- Analytics (placeholder)

## Demo Page
Located: `src/components/cs2/CS2Demo.tsx`

Development and testing page showcasing all components.

## Types
Located: `src/components/cs2/types.ts`

All TypeScript interfaces and constants exported from the main index.

## Usage Example

```tsx
import { 
  CS2MapViewer, 
  CS2WeaponCard,
  type CS2MapData,
  type CS2Weapon 
} from '@/components/cs2';

function CS2Page() {
  return (
    <div>
      <CS2MapViewer mapData={dust2Data} />
      <CS2WeaponCard weapon={ak47Data} />
    </div>
  );
}
```

## Integration with App

To add CS2 Hub to your routing:

```tsx
// In your router configuration
import CS2Hub from '@/hub-cs2';

<Route path="/cs2" element={<CS2Hub />} />
```

## Future Enhancements

- [ ] Real map images integration
- [ ] Weapon skin marketplace data
- [ ] Player statistics integration
- [ ] Match history heatmaps
- [ ] Grenade lineup viewer
- [ ] Economy simulator
