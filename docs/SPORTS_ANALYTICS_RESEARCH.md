BU# Sports Analytics Multi-Sport Expansion Research

## Esports Sources
**VLR.gg (Valorant)** 
- Match history, player stats, team rankings
- Bracket analysis, VOD links
- Community ratings (13-19)

**HLTV.org (CS2)** 
- Live matches, player profiles, maps stats
- ELO ratings, HLTV rank changes
- Event calendars, team pages

**VLR vs HLTV Comparison**
| Metric | VLR | HLTV |
|--------|-----|------|
| Player Rating | VLR Rating | HLTV Rating |
| Match Detail | Rich | Basic |
| Mobile | Excellent | Desktop focus |
| API | Limited | None |

## Traditional Sports
**Soccer (FIFA/UEFA)**
- xG, PPDA, shot maps
- Opta/StatsBomb data
- Wyscout, FBref

**NFL**
- PFF grades, EPA, DVOA
- Next Gen Stats (tracking)
- TruMedia

**NBA**
- PER, BPM, VORP
- Cleaning the Glass, Basketball Index
- Second Spectrum tracking

**NHL/MLB/Chess/Olympics**
- MoneyPuck, Baseball Savant
- Lichess FIDE API
- Olympics: InfoStrada, Gracenote

## Multi-sport TENET Expansion
**Unified Schema:**
```
tenets:
  - valorant (VLR)
  - cs2 (HLTV)
  - soccer (FBref)
  - nfl (PFF)
metrics: sim_rating, rar, xG, EPA, PER
```

**Research Complete – Ready for scrapers.**

