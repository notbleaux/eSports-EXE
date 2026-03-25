[Ver001.000]

# Counter-Strike 2 Expansion Plan

**Date:** 2026-03-16  
**Status:** Planning Phase  
**Target:** Q3 2026 Launch

---

## Executive Summary

This document outlines the expansion of the NJZiteGeisTe Platform to support Counter-Strike 2 (CS2), building on the existing Valorant foundation. The expansion leverages our proprietary SimRating and RAR analytics systems while adapting to CS2's unique mechanics.

### Key Differences: Valorant vs CS2

| Aspect | Valorant | CS2 |
|--------|----------|-----|
| **Agents** | Unique abilities per agent | No abilities, pure gunplay |
| **Economy** | Fixed costs, predictable | Variable, complex |
| **Maps** | 9 competitive maps | 7-8 active duty maps |
| **Gunplay** | Bloom, spray patterns | Recoil patterns, spray control |
| **Data Sources** | VLR.gg, Pandascore | HLTV, Pandascore, GRID |
| **Tournaments** | Riot-controlled | Multiple organizers (ESL, BLAST, etc.) |

---

## Phase 1: Data Infrastructure (Weeks 1-4)

### 1.1 New Data Sources

**HLTV Integration**
```python
# extraction/src/scrapers/hltv_client.py (NEW)
class HLTVClient:
    """Ethical HLTV.gg scraping with rate limiting."""
    BASE_URL = "https://www.hltv.org"
    RATE_LIMIT = 1.5  # 1.5 req/sec (HLTV is stricter)
```

**Pandascore CS2 API**
- Endpoint: `https://api.pandascore.co/csgo2/`
- Same authentication as Valorant
- Tournament, match, player endpoints

**GRID Integration (optional)**
- Official Valve data partner
- Real-time telemetry
- Higher cost, premium data

### 1.2 Database Schema Updates

```sql
-- Add game_type to existing tables
ALTER TABLE matches ADD COLUMN game_type VARCHAR(10) 
  CHECK (game_type IN ('valorant', 'cs2')) 
  DEFAULT 'valorant';

ALTER TABLE players ADD COLUMN game_type VARCHAR(10) 
  CHECK (game_type IN ('valorant', 'cs2')) 
  DEFAULT 'valorant';

-- CS2-specific tables
CREATE TABLE cs2_weapons (
    id UUID PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(20), -- rifle, smg, pistol, heavy
    cost INTEGER,
    kill_reward INTEGER,
    damage INTEGER,
    armor_penetration DECIMAL(3,2)
);

CREATE TABLE cs2_maps (
    id UUID PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    is_active_duty BOOLEAN DEFAULT false,
    callouts JSONB -- Map-specific callouts
);
```

### 1.3 Data Pipeline Expansion

**New Epochs for CS2**
```python
CS2_EPOCHS = {
    1: {"start": date(2023, 9, 27), "end": date(2024, 12, 31), "confidence_floor": 60.0},
    2: {"start": date(2025, 1, 1), "end": date(2026, 12, 31), "confidence_floor": 80.0},
    3: {"start": date(2027, 1, 1), "end": date.today(), "confidence_floor": 100.0},
}
```

---

## Phase 2: Analytics Adaptation (Weeks 5-8)

### 2.1 SimRating for CS2

**CS2 Components (5-factor)**
```python
class CS2SimRatingCalculator:
    """
    SimRating = 0.20 * aim_z        (ADR, headshot %)
              + 0.20 * game_sense_z (clutch success, multi-kills)
              + 0.20 * consistency_z (KAST, round stability)
              + 0.20 * impact_z      (opening duels, trade efficiency)
              + 0.20 * economy_z     (value per dollar spent)
    """
    
    def calculate(self, player_stats: CS2PlayerStats) -> SimRatingResult:
        # No agent abilities in CS2 - pure gunplay metrics
        aim_z = self.normalize_adr(player_stats.adr)
        game_sense_z = self.normalize_clutch_rate(player_stats.clutch_success_rate)
        consistency_z = self.normalize_kast(player_stats.kast)
        impact_z = self.normalize_impact(player_stats.impact_rating)
        economy_z = self.normalize_value_per_dollar(player_stats.value_per_dollar)
        
        return super().calculate(aim_z, game_sense_z, consistency_z, impact_z, economy_z)
```

### 2.2 Role Classification (CS2)

**CS2 Roles (6 instead of Valorant's 4)**
```typescript
enum CS2Role {
  AWPER = 'awper',           // Primary AWP player
  RIFLER_ENTRY = 'entry',    // First into sites
  RIFLER_SUPPORT = 'support', // Trade fragging, flashes
  IGL = 'igl',               // In-game leader
  LURKER = 'lurker',         // Flank control
  HYBRID = 'hybrid',         // Flexible role
}
```

**Role Detection Algorithm**
```python
def classify_cs2_role(player_stats: dict) -> CS2Role:
    """Classify CS2 role based on weapon usage and positioning."""
    
    # AWP detection
    if player_stats['awp_kills'] / player_stats['total_kills'] > 0.25:
        return CS2Role.AWPER
    
    # Entry detection (first duels, aggressive positioning)
    if player_stats['opening_duels_attempted'] > 20:
        return CS2Role.RIFLER_ENTRY
    
    # IGL detection (from team roster data)
    if player_stats.get('is_igl', False):
        return CS2Role.IGL
    
    # Lurker detection (survival rate, flank kills)
    if player_stats['survival_rate'] > 0.35 and player_stats['flank_kills'] > 10:
        return CS2Role.LURKER
    
    # Default to support/hybrid
    return CS2Role.HYBRID
```

### 2.3 RAR (Role-Adjusted Rating) for CS2

**Replacement Levels by Role**
```python
CS2_REPLACEMENT_LEVELS = {
    CS2Role.AWPER: 1.05,        # Hard to replace
    CS2Role.IGL: 1.10,          # Very hard to replace
    CS2Role.RIFLER_ENTRY: 0.95, # Easier to find
    CS2Role.RIFLER_SUPPORT: 0.90,
    CS2Role.LURKER: 0.95,
    CS2Role.HYBRID: 0.92,
}
```

### 2.4 Economy Analytics

**CS2 Economy Complexity**
```python
@dataclass
class CS2EconomyStats:
    """Advanced CS2 economy metrics."""
    
    # Spending efficiency
    total_money_spent: int
    total_damage_dealt: int
    value_per_dollar: float  # damage per $1000 spent
    
    # Force buy performance
    force_buy_rounds: int
    force_buy_wins: int
    force_buy_win_rate: float
    
    # Eco round performance  
    eco_rounds: int
    eco_round_wins: int
    eco_round_win_rate: float
    
    # Full buy performance
    full_buy_rounds: int
    full_buy_wins: int
    full_buy_win_rate: float
    
    # Equipment utilization
    utility_damage_per_round: float
    flash_assists_per_round: float
    he_grenade_kills: int
    molotov_kills: int
```

---

## Phase 3: Simulation Engine (Weeks 9-12)

### 3.1 ROTAS for CS2

**Core Differences from Valorant Simulation**
```gdscript
# platform/simulation-game/cs2/CS2MatchSimulator.cs (NEW)
public class CS2MatchSimulator : MatchSimulator
{
    // No abilities - pure gunplay mechanics
    public override void ProcessTick()
    {
        // 1. Process economy
        UpdateTeamEconomy();
        
        // 2. Process weapon purchases
        ProcessBuys();
        
        // 3. Process utility usage (smokes, flashes, molotovs)
        ProcessUtility();
        
        // 4. Process gunfights (recoil patterns, armor penetration)
        ProcessGunfights();
        
        // 5. Process bomb plant/defuse
        ProcessBombObjective();
    }
    
    // CS2-specific: Recoil pattern simulation
    private Vector3 CalculateRecoil(Weapon weapon, int shotNumber)
    {
        return CS2RecoilPatterns.Get(weapon.Name).GetOffset(shotNumber);
    }
}
```

### 3.2 Weapon Mechanics

**CS2 Weapon Database**
```typescript
interface CS2Weapon {
  id: string;
  name: string;
  category: 'rifle' | 'smg' | 'pistol' | 'heavy' | 'grenade';
  cost: number;
  killReward: number;
  damage: number;
  armorPenetration: number;  // 0.0 to 1.0
  recoilPattern: Vector2[];  // Recoil offset per shot
  fireRate: number;          // RPM
  magazineSize: number;
  reloadTime: number;
}

const AK47: CS2Weapon = {
  id: 'weapon_ak47',
  name: 'AK-47',
  category: 'rifle',
  cost: 2700,
  killReward: 300,
  damage: 36,
  armorPenetration: 0.775,
  recoilPattern: [/* 30 shot pattern */],
  fireRate: 600,
  magazineSize: 30,
  reloadTime: 2.5,
};
```

### 3.3 Map Callouts System

**CS2 Map Callouts Database**
```json
{
  "maps": {
    "de_dust2": {
      "callouts": [
        { "name": "Long A", "position": { "x": 100, "y": 200 } },
        { "name": "Short A", "position": { "x": 150, "y": 180 } },
        { "name": "Mid", "position": { "x": 200, "y": 200 } },
        { "name": "B Tunnels", "position": { "x": 300, "y": 300 } },
        { "name": "CT Spawn", "position": { "x": 250, "y": 250 } }
      ],
      "bombsites": ["A", "B"],
      "spawns": {
        "T": [{ "x": 50, "y": 50 }],
        "CT": [{ "x": 250, "y": 250 }]
      }
    }
  }
}
```

---

## Phase 4: Frontend Updates (Weeks 13-16)

### 4.1 Hub Modifications

**SATOR Hub - Dual Game Support**
```tsx
// components/SATOR/GameSelector.tsx (NEW)
function GameSelector() {
  const [selectedGame, setSelectedGame] = useState<'valorant' | 'cs2'>('valorant');
  
  return (
    <div className="game-selector">
      <button 
        onClick={() => setSelectedGame('valorant')}
        className={selectedGame === 'valorant' ? 'active' : ''}
      >
        <img src="/icons/valorant.svg" alt="Valorant" />
        Valorant
      </button>
      <button 
        onClick={() => setSelectedGame('cs2')}
        className={selectedGame === 'cs2' ? 'active' : ''}
      >
        <img src="/icons/cs2.svg" alt="CS2" />
        Counter-Strike 2
      </button>
    </div>
  );
}
```

**ROTAS Hub - CS2 Simulation View**
```tsx
// hub-2-rotas/components/CS2TacticalView.tsx (NEW)
function CS2TacticalView({ matchId }: { matchId: string }) {
  // CS2-specific tactical view
  // - Smokes (volumetric)
  // - Molotovs (area denial)
  // - Flashbangs (whiteout effect)
  // - Bomb site visualization
  
  return (
    <TacticalView
      game="cs2"
      mapData={cs2MapData}
      showUtility={true}
      showEconomy={true}
    />
  );
}
```

### 4.2 New Components

**Weapon Comparison Tool**
```tsx
// components/SATOR/WeaponComparison.tsx (NEW)
function WeaponComparison() {
  const [weapon1, setWeapon1] = useState<CS2Weapon>();
  const [weapon2, setWeapon2] = useState<CS2Weapon>();
  
  return (
    <div className="weapon-comparison">
      <WeaponSelector game="cs2" onSelect={setWeapon1} />
      <WeaponSelector game="cs2" onSelect={setWeapon2} />
      <ComparisonTable weapon1={weapon1} weapon2={weapon2} />
      <RecoilPatternDisplay weapon={weapon1} />
    </div>
  );
}
```

**Economy Tracker**
```tsx
// components/AREPO/CS2EconomyTracker.tsx (NEW)
function CS2EconomyTracker({ matchId }: { matchId: string }) {
  const { economyData } = useCS2Economy(matchId);
  
  return (
    <div className="economy-tracker">
      <TeamEconomy team="CT" data={economyData.ct} />
      <TeamEconomy team="T" data={economyData.t} />
      <BuyHistory rounds={economyData.rounds} />
      <ForceBuyAnalysis data={economyData.forceBuys} />
    </div>
  );
}
```

---

## Phase 5: Testing & Launch (Weeks 17-20)

### 5.1 Testing Strategy

| Test Type | Coverage Target | Priority |
|-----------|-----------------|----------|
| Unit Tests | 80% | High |
| Integration Tests | CS2 data pipeline | High |
| E2E Tests | Critical user flows | Medium |
| Simulation Validation | 1000+ test matches | High |

### 5.2 Beta Launch Plan

**Week 17: Closed Beta**
- Invite 100 CS2 community members
- Focus: Data accuracy
- Collect feedback on analytics

**Week 18: Open Beta**
- Public access to CS2 features
- Limited to recent matches
- Monitor performance

**Week 19: Full Launch**
- All CS2 features enabled
- Marketing campaign
- Influencer partnerships

### 5.3 Post-Launch Support

**Monitoring**
- CS2 data pipeline health
- Simulation accuracy vs. actual results
- User engagement metrics

**Quick Fixes**
- Map callout corrections
- Role classification tuning
- Economy calculation fixes

---

## Resource Requirements

### Development Team

| Role | Effort | Notes |
|------|--------|-------|
| Backend Engineer | 4 weeks | Data pipeline, API |
| Data Engineer | 3 weeks | HLTV extraction |
| ML Engineer | 2 weeks | Analytics adaptation |
| Godot Developer | 4 weeks | Simulation engine |
| Frontend Developer | 3 weeks | UI updates |
| QA Engineer | 2 weeks | Testing |

### Infrastructure

**Additional Costs**
- HLTV scraping infrastructure
- CS2 data storage (~50GB/year)
- Simulation compute (GPU instances)

**Estimated Monthly Cost Increase: $500-1000**

---

## Success Metrics

### Technical Metrics
- CS2 data accuracy: >95%
- SimRating correlation with HLTV rating: >0.85
- Simulation accuracy: >70% match outcome prediction

### Business Metrics
- CS2 user adoption: 30% of Valorant users within 6 months
- CS2 API usage: 10,000 requests/day by month 3
- Feature parity: 80% of Valorant features in CS2 by month 6

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| HLTV blocks scraping | Medium | High | Use Pandascore as primary |
| CS2 meta shifts | High | Medium | Adaptive role classification |
| Simulation inaccuracies | Medium | High | Continuous ML training |
| User preference for HLTV | Medium | High | Unique analytics (economy, roles) |

---

## Timeline Summary

```
Week 1-4:   Data Infrastructure
Week 5-8:   Analytics Adaptation
Week 9-12:  Simulation Engine
Week 13-16: Frontend Updates
Week 17-20: Testing & Launch
--------------------------------
Total: 20 weeks (5 months)
Target: Q3 2026
```

---

## Next Steps

1. **Week 1:** Finalize HLTV scraping approach
2. **Week 1:** Set up CS2 database tables
3. **Week 2:** Begin HLTV client development
4. **Week 3:** Parallel Pandascore CS2 integration
5. **Week 4:** Data validation and testing

---

*Document Owner: Product Team*  
*Review Date: Monthly during implementation*
