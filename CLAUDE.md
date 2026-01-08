# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains dual implementations of the classic 2048 game:

1. **React Native App** (repository root): Cross-platform mobile app for iOS and Android
   - Main component: `App.js` (930 lines, single-file implementation)
   - Entry point: `index.js`
   - Configuration: `app.json`, `package.json`
   - Platform-specific: `android/`, `ios/`

2. **Web Version** (`web/index.html`): Standalone browser-based game
   - Single HTML file with embedded CSS and JavaScript
   - No build process required

3. **Legacy RN Project** (`rn/`): Older React Native implementation kept for reference
   - Do not modify this directory; all new work targets the root app

## Development Commands

### React Native Development

```bash
# Install dependencies
npm install

# Start Metro bundler
npm run start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run linting
npm run lint

# Run tests
npm test
```

### Building Android APKs

From repository root:

```bash
cd android

# Debug build (uses Metro bundler)
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# Release builds (self-contained, per-ABI splits)
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-{abi}-release.apk
# Note: Signed with debug keystore, not for production app store
```

### Web Version

```bash
# Option 1: Open directly
open web/index.html

# Option 2: Serve with static server
cd web
npx serve .
```

## Code Architecture

### React Native App Architecture (`App.js`)

The entire React Native game is implemented in a single 930-line file with the following structure:

**State Management:**
- Game grid stored as 2D array of tile objects: `{ id, value, row, col, isNew, merged }`
- Persistent state stored in AsyncStorage:
  - `best-2048-rn-by-size`: Best scores keyed by grid size (e.g., "4", "5")
  - `history-2048-rn-records`: Array of completed games (limited to 10 most recent)
- Timer state: `elapsedSeconds`, `hasStarted`, `isPaused`
- Grid size: Configurable 4×4 to 8×8 (via `GRID_SIZES` array)

**Animation System:**
- Uses React Native's `Animated` API with refs (`positionsRef`, `scaleRef`)
- Tile positions animated via `Animated.ValueXY` for smooth sliding
- Scale animations for newly spawned tiles (0→1) and merged tiles (1→1.08→1)
- Duration: 140ms for movement, 160ms for spawn, 200ms for merge

**Core Game Logic Functions:**
- `slideGrid(grid, direction, idRef)`: Implements slide/merge logic in one direction
  - Processes each row/column independently
  - Returns `{ newGrid, gained }` with new state and score delta
- `addRandomTile(grid, idRef)`: Spawns 2 (90%) or 4 (10%) in random empty cell
- `hasMoves(grid)`: Checks if any moves remain (empty cells or adjacent mergeable tiles)
- `isSameGrid(prevGrid, nextGrid)`: Detects no-op moves (values unchanged)

**Move Processing Flow:**
1. User swipes (via `PanResponder`) or triggers move
2. `slideGrid()` processes the move direction
3. Compare grids to detect no-op (skip adding new tile)
4. If valid move: add random tile, update score, check game over
5. Start timer on first actual move (`hasMovedRef.current = true`)

**Game History Tracking:**
- Only records games where timer started AND user made at least one move
- Record structure: `{ size, seconds, score, startedAt }`
- Stored as array, limited to 10 most recent games
- Records saved on game over or when switching grid sizes

**Gesture Controls:**
- `PanResponder` detects swipe gestures (minimum 20px threshold)
- Determines direction by comparing absolute x/y deltas
- Blocked when game over or paused

**Dynamic Grid Sizing:**
- Grid size affects tile dimensions: `(boardSize - padding - gaps) / size`
- All tile positions and animations recalculated on grid size change
- Changing grid size triggers game restart and records current game

### Web Version Architecture

Self-contained HTML file (~800 lines) with similar game logic but different implementation:
- Vanilla JavaScript with DOM manipulation
- localStorage for persistence
- CSS Grid for layout
- Touch and keyboard event handlers

## Key Technical Details

### Tile Object Structure
```javascript
{
  id: number,        // Unique identifier (auto-incrementing via idRef)
  value: number,     // 2, 4, 8, 16, ..., up to 131072
  row: number,       // 0-indexed grid position
  col: number,       // 0-indexed grid position
  isNew: boolean,    // True for newly spawned tiles (triggers scale-in animation)
  merged: boolean    // True for tiles created by merge (triggers bounce animation)
}
```

### Grid Representation
```javascript
// 2D array of tile objects or null
// Example 2×2 grid:
[
  [{ id: 1, value: 2, row: 0, col: 0, ... }, null],
  [null, { id: 2, value: 4, row: 1, col: 1, ... }]
]
```

### Slide Algorithm Details

The `slideGrid()` function processes movement in four steps:

1. **Extract line**: Get row/column depending on direction (left/right use rows, up/down use columns)
2. **Filter empties**: Remove null cells to get compact array of tiles
3. **Reverse if needed**: For right/down, reverse line before processing
4. **Merge pass**: Single left-to-right pass merging adjacent equal values
   - When tiles merge, keep the "base" tile (second of the pair) and update its value
   - Mark merged tile with `merged: true` flag
   - Skip both tiles and continue
5. **Pad with nulls**: Fill remaining positions with null
6. **Reverse back**: For right/down, reverse result
7. **Update positions**: Set row/col on each tile to match new grid position

### AsyncStorage Keys

- `best-2048-rn-by-size`: JSON object `{ "4": 1234, "5": 2048, ... }`
- `history-2048-rn-records`: JSON array of game records
- `best-2048-rn`: Legacy key (loaded once for migration to new format)

## Testing

Currently no automated tests are configured. The `jest.config.js` exists but `__tests__/` directory is empty.

When adding tests:
- Place tests in `__tests__/` directory
- Use Jest with React Native preset (`react-native`)
- Focus on pure game logic functions: `slideGrid`, `hasMoves`, `addRandomTile`, `isSameGrid`
- Use `react-test-renderer` for component tests

## Code Style

- **Formatting**: 2-space indentation, single quotes, semicolons
- **Naming**: camelCase for variables/functions, UPPER_SNAKE_CASE for constants
- **Constants**: Defined at file top (e.g., `DEFAULT_GRID_SIZE`, `GAP`, `TILE_COLORS`)
- **React patterns**: Function components, hooks (useState, useEffect, useRef, useMemo)
- **Platform-specific**: Use `Platform.OS` checks when needed (e.g., StatusBar height on Android)

## Important Conventions

### Timer Behavior
- Timer starts on first actual move (swipe that changes grid state)
- Timer paused when user clicks pause icon or game ends
- Timer reset on new game or grid size change
- Games without moves (immediate restart) are not recorded

### Grid Size Changes
- Changing grid size records current game before resetting
- Best scores maintained separately per grid size
- Available sizes: 4×4, 5×5, 6×6, 7×7, 8×8

### Tile Colors
Defined in `TILE_COLORS` object with background and foreground colors for values 2-131072. Tiles beyond defined values use fallback color `#3c3a32`.

### Font Size Adjustments
- Default: 28px
- Values > 64: 22px (`.small` style)
- Values > 512: 18px (`.tiny` style)

## Dependencies

Key React Native dependencies:
- `react-native`: 0.83.1
- `react`: 19.2.0
- `@react-native-async-storage/async-storage`: Persistent storage
- `react-native-safe-area-context`: Safe area handling

Requires Node.js >= 20 (specified in `package.json` engines field).
