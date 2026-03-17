# TENET Loading Animations Memory File
Saved 2024 - 4 ASCII designs for React/CSS implementation

## 1. SATOR Square (5x5 palindrome)
```
S A T O R
A R E P O 
T E N E T
O P E R A
R O T A S
```
**Animation:** X/+ pulse through squares, letter glow → cyan/amber

## 2. ROTAS Square (inverse)
```
R O T A S
O P E R A
T E N E T
A R E P O
S A T O R
```
**Animation:** ◆◇ diamond alternate, counter-clockwise wave

## 3. 4NJZ4 O's (binary 5x5)
```
ooooo ooooo ooooo ooooo ooooo
ooooo ooooo ooooo ooooo ooooo
ooooo ooooo 04NjZ4 ooooo ooooo
ooooo ooooo ooooo ooooo ooooo
ooooo ooooo ooooo ooooo ooooo
```
**Animation:** o/0 blink, center 4NJZ4 reveal + ripple

## 4. EXE/XVENX (full ceremonial)
```
XxX___/EXE___\___XxX
|!|*O*T*O*!|!|*O*T*O*|
|!|*+*O*!|!|*+*O*|
...XNEVX...
```
**Animation:** 12-frame sequence, border pulse, center cross rotation

**React Implementation Plan:**
- `TENETLoader.tsx` variant='sator|rotas|oooo|exe' size='sm|md|lg'
- CSS keyframes, monospace font (JetBrains Mono)
- Dark theme cyan/amber accents
- WebGL fluid inspiration: https://paveldogreat.github.io/WebGL-Fluid-Simulation/

