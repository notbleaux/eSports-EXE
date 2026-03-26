# URL Structure — NJZiteGeisTe Platform

## Naming Hierarchy

The platform uses a four-layer naming system derived from the TENET palindrome:

| Term | Layer | Description | Example |
|------|-------|-------------|---------|
| **TeNeT** | Brand | The NJZiteGeisTe product identity | Landing page `/` |
| **TENET** | Platform | Universal WorldHUBs — game-agnostic top layer | Hub types |
| **tenet** | Game World | Game-specific world instance | `/valorant`, `/cs2` |
| **tezet** | Hub Selector | 4 hub types within each game world | `/valorant/analytics` |

## Hub Types (appear in every tenet)

| Internal Name | User Route | Label | Purpose |
|--------------|-----------|-------|---------|
| SATOR | `/analytics` | Analytics | Advanced Analytics — SimRating, RAR |
| ROTAS | `/stats` | Stats | Stats Reference — historical data |
| OPERA | `/pro-scene` | Pro Scene | Pro eSports — tournaments, live |
| AREPO | `/community` | Community | Forums, players, fans |
| TENET | `/hubs` | Hubs | WorldHUBs selector |

## Full Route Map

### Universal Hub Routes
```
/               Landing page (NJZiteGeisTe brand)
/analytics      SATOR — Advanced Analytics
/stats          ROTAS — Stats Reference
/pro-scene      OPERA — Pro eSports Info
/community      AREPO — Community & Forums
/hubs           TENET — WorldHUBs selector
```

### Game World Routes (tenet layer)
```
/valorant                    Valorant game world
/cs2                         CS2 game world
```

### Tezet Routes (game-world + hub type) — Phase 5+
```
/valorant/analytics          SATOR within Valorant
/valorant/stats              ROTAS within Valorant
/valorant/pro-scene          OPERA within Valorant
/valorant/community          AREPO within Valorant
/cs2/analytics               SATOR within CS2
/cs2/stats                   ROTAS within CS2
/cs2/pro-scene               OPERA within CS2
/cs2/community               AREPO within CS2
```

### Legacy Redirects (permanent)
```
/sator  → /analytics
/rotas  → /stats
/arepo  → /community
/opera  → /pro-scene
/tenet  → /hubs
```

## Internal vs User-Facing Names

SATOR, ROTAS, OPERA, AREPO are **internal developer identifiers** used in:
- Folder names (`hub-1-sator/`, `hub-2-rotas/` etc.)
- Component names (`SATORHub`, `ROTASHub` etc.)
- Mascot character identities
- Design system color assignments

They are **never shown to users** in navigation or URLs.
