import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GRID_SIZE = 4;
const GAP = 12;
const BOARD_PADDING = 12;
const TILE_COLORS = {
  2: { bg: '#eee4da', fg: '#776e65' },
  4: { bg: '#ede0c8', fg: '#776e65' },
  8: { bg: '#f2b179', fg: '#f9f6f2' },
  16: { bg: '#f59563', fg: '#f9f6f2' },
  32: { bg: '#f67c5f', fg: '#f9f6f2' },
  64: { bg: '#f65e3b', fg: '#f9f6f2' },
  128: { bg: '#edcf72', fg: '#f9f6f2' },
  256: { bg: '#edcc61', fg: '#f9f6f2' },
  512: { bg: '#edc850', fg: '#f9f6f2' },
  1024: { bg: '#edc53f', fg: '#f9f6f2' },
  2048: { bg: '#edc22e', fg: '#f9f6f2' },
};

const emptyGrid = () => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function App() {
  const idRef = useRef(1);
  const [grid, setGrid] = useState(() => addRandomTile(addRandomTile(emptyGrid(), idRef), idRef));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const positionsRef = useRef(new Map()); // id -> Animated.ValueXY
  const scaleRef = useRef(new Map()); // id -> Animated.Value

  useEffect(() => {
    AsyncStorage.getItem('best-2048-rn').then(v => {
      if (v) setBest(Number(v));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('best-2048-rn', String(best));
  }, [best]);

  const boardSize = useMemo(() => {
    const w = Dimensions.get('window').width;
    return Math.min(420, w - 32);
  }, []);

  const tileSize = useMemo(() => {
    return (boardSize - BOARD_PADDING * 2 - GAP * (GRID_SIZE - 1)) / GRID_SIZE;
  }, [boardSize]);

  const tiles = useMemo(() => flattenTiles(grid), [grid]);

  useEffect(() => {
    // clean up stale animated values
    const ids = new Set(tiles.map(t => t.id));
    [...positionsRef.current.keys()].forEach(id => {
      if (!ids.has(id)) positionsRef.current.delete(id);
    });
    [...scaleRef.current.keys()].forEach(id => {
      if (!ids.has(id)) scaleRef.current.delete(id);
    });
  }, [tiles]);

  useEffect(() => {
    tiles.forEach(tile => {
      let scale = scaleRef.current.get(tile.id);
      if (!scale) {
        scale = new Animated.Value(tile.isNew ? 0 : 1);
        scaleRef.current.set(tile.id, scale);
      }
      if (tile.isNew) {
        scale.setValue(0);
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      } else if (tile.merged) {
        Animated.sequence([
          Animated.spring(scale, { toValue: 1.12, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        ]).start();
      }
    });
  }, [tiles, animKey]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderRelease: (_, gesture) => {
          const { dx, dy } = gesture;
          const absX = Math.abs(dx);
          const absY = Math.abs(dy);
          if (Math.max(absX, absY) < 20) return;
          if (absX > absY) {
            dx > 0 ? move('right') : move('left');
          } else {
            dy > 0 ? move('down') : move('up');
          }
        },
      }),
    [grid, score]
  );

  const move = direction => {
    const { moved, newGrid, gained } = slideGrid(grid, direction, idRef);
    if (!moved) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const withNew = addRandomTile(newGrid, idRef);
    setGrid(withNew);
    const newScore = score + gained;
    setScore(newScore);
    if (newScore > best) setBest(newScore);
    setAnimKey(k => k + 1); // force re-render for animations
  };

  const restart = () => {
    const fresh = addRandomTile(addRandomTile(emptyGrid(), idRef), idRef);
    setGrid(fresh);
    setScore(0);
    setAnimKey(k => k + 1);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>2048</Text>
        <View style={styles.scores}>
          <Score label="score" value={score} />
          <Score label="best" value={best} />
        </View>
      </View>
      <View style={styles.topRow}>
        <Text style={styles.instructions}>滑动或按键合并方块，冲击 2048！</Text>
        <TouchableOpacity style={styles.btn} onPress={restart}>
          <Text style={styles.btnText}>新游戏</Text>
        </TouchableOpacity>
      </View>
      <View
        style={[styles.board, { width: boardSize, height: boardSize, padding: BOARD_PADDING }]}
        {...panResponder.panHandlers}
      >
        <GridCells gap={GAP} tileSize={tileSize} />
        <View style={styles.tilesLayer}>
          {tiles.map(tile => {
            const translate = ensurePosition(
              tile.id,
              tile.row,
              tile.col,
              tileSize,
              positionsRef,
              GAP
            );
            const scale = ensureScale(tile.id, scaleRef, tile.isNew);
            const colors = TILE_COLORS[tile.value] || { bg: '#3c3a32', fg: '#f9f6f2' };
            const extraSize =
              tile.value > 512 ? styles.tiny : tile.value > 64 ? styles.small : null;
            return (
              <Animated.View
                key={tile.id}
                style={[
                  styles.tile,
                  {
                    width: tileSize,
                    height: tileSize,
                    transform: [
                      { translateX: translate.x },
                      { translateY: translate.y },
                      { scale },
                    ],
                  },
                ]}
              >
                <View
                  style={[
                    styles.tileInner,
                    extraSize,
                    { backgroundColor: colors.bg },
                  ]}
                >
                  <Text style={[styles.tileText, { color: colors.fg }]}>{tile.value}</Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const Score = ({ label, value }) => (
  <View style={styles.scoreBox}>
    <Text style={styles.scoreLabel}>{label}</Text>
    <Text style={styles.scoreValue}>{value}</Text>
  </View>
);

const GridCells = ({ gap, tileSize }) => {
  const cells = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      cells.push(
        <View
          key={`cell-${r}-${c}`}
          style={[
            styles.cell,
            {
              width: tileSize,
              height: tileSize,
              marginRight: c === GRID_SIZE - 1 ? 0 : gap,
              marginBottom: r === GRID_SIZE - 1 ? 0 : gap,
            },
          ]}
        />
      );
    }
  }
  return <View style={styles.grid}>{cells}</View>;
};

const slideGrid = (grid, direction, idRef) => {
  let moved = false;
  let gained = 0;
  const newGrid = emptyGrid();

  const traverse = direction === 'up' || direction === 'down' ? GRID_SIZE : GRID_SIZE;

  const getLine = idx => {
    const line = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      if (direction === 'left' || direction === 'right') {
        line.push(grid[idx][i]);
      } else {
        line.push(grid[i][idx]);
      }
    }
    return line;
  };

  const setLine = (idx, line) => {
    for (let i = 0; i < GRID_SIZE; i++) {
      if (direction === 'left' || direction === 'right') {
        if (line[i]) {
          line[i].row = idx;
          line[i].col = i;
        }
        newGrid[idx][i] = line[i];
      } else {
        if (line[i]) {
          line[i].row = i;
          line[i].col = idx;
        }
        newGrid[i][idx] = line[i];
      }
    }
  };

  const processLine = raw => {
    const line = raw.filter(Boolean);
    if (direction === 'right' || direction === 'down') line.reverse();
    const result = [];
    let i = 0;
    while (i < line.length) {
      const current = line[i];
      if (i + 1 < line.length && line[i + 1].value === current.value) {
        const mergedTile = {
          id: ++idRef.current,
          value: current.value * 2,
          merged: true,
          isNew: false,
        };
        gained += mergedTile.value;
        result.push(mergedTile);
        i += 2;
        moved = true;
      } else {
        result.push({ ...current, merged: false, isNew: false });
        i += 1;
      }
    }
    while (result.length < GRID_SIZE) result.push(null);
    if (direction === 'right' || direction === 'down') result.reverse();
    return result;
  };

  for (let idx = 0; idx < traverse; idx++) {
    const oldLine = getLine(idx);
    const newLine = processLine(oldLine);
    setLine(idx, newLine);
    for (let j = 0; j < GRID_SIZE; j++) {
      if (oldLine[j] !== newLine[j]) moved = true;
    }
  }

  return { moved, newGrid, gained };
};

const addRandomTile = (grid, idRef = { current: 1000 }) => {
  const empties = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) empties.push({ r, c });
    }
  }
  if (!empties.length) return grid;
  const pick = empties[Math.floor(Math.random() * empties.length)];
  const tile = {
    id: ++idRef.current,
    value: Math.random() < 0.9 ? 2 : 4,
    row: pick.r,
    col: pick.c,
    isNew: true,
    merged: false,
  };
  const next = grid.map(row => row.slice());
  next[pick.r][pick.c] = tile;
  return next;
};

const flattenTiles = grid => {
  const tiles = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c]) tiles.push(grid[r][c]);
    }
  }
  return tiles;
};

const ensurePosition = (id, row, col, tileSize, ref, gap) => {
  const targetX = col * (tileSize + gap);
  const targetY = row * (tileSize + gap);
  let val = ref.current.get(id);
  if (!val) {
    val = new Animated.ValueXY({ x: targetX, y: targetY });
    ref.current.set(id, val);
  } else {
    Animated.timing(val, {
      toValue: { x: targetX, y: targetY },
      duration: 140,
      useNativeDriver: true,
    }).start();
  }
  return val;
};

const ensureScale = (id, ref, isNew) => {
  let val = ref.current.get(id);
  if (!val) {
    val = new Animated.Value(isNew ? 0 : 1);
    ref.current.set(id, val);
  }
  return val;
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#faf8ef',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#776e65',
  },
  scores: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreBox: {
    backgroundColor: '#bbada0',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 80,
  },
  scoreLabel: {
    color: '#f9f6f2',
    textAlign: 'center',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  scoreValue: {
    color: '#f9f6f2',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  instructions: {
    flex: 1,
    color: '#776e65',
    fontSize: 14,
    lineHeight: 18,
  },
  btn: {
    backgroundColor: '#8f7a66',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
  },
  btnText: {
    color: '#f9f6f2',
    fontWeight: '700',
  },
  board: {
    marginTop: 16,
    backgroundColor: '#bbada0',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  grid: {
    position: 'absolute',
    top: BOARD_PADDING,
    left: BOARD_PADDING,
    right: BOARD_PADDING,
    bottom: BOARD_PADDING,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    backgroundColor: 'rgba(238, 228, 218, 0.35)',
    borderRadius: 4,
  },
  tilesLayer: {
    position: 'absolute',
    top: BOARD_PADDING,
    left: BOARD_PADDING,
    right: BOARD_PADDING,
    bottom: BOARD_PADDING,
  },
  tile: {
    position: 'absolute',
  },
  tileInner: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    fontWeight: '800',
    fontSize: 28,
  },
  small: { fontSize: 22 },
  tiny: { fontSize: 18 },
});

