import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  LayoutAnimation,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_GRID_SIZE = 4;
const GRID_SIZES = [4, 5, 6, 7, 8];
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
  4096: { bg: '#3c3a32', fg: '#f9f6f2' },
  8192: { bg: '#3b332a', fg: '#f9f6f2' },
  16384: { bg: '#3a2f26', fg: '#f9f6f2' },
  32768: { bg: '#392b22', fg: '#f9f6f2' },
  65536: { bg: '#38271e', fg: '#f9f6f2' },
  131072: { bg: '#37231a', fg: '#f9f6f2' },
};

const createEmptyGrid = size =>
  Array.from({ length: size }, () => Array(size).fill(null));

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function App() {
  const idRef = useRef(1);
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [grid, setGrid] = useState(() =>
    addRandomTile(addRandomTile(createEmptyGrid(DEFAULT_GRID_SIZE), idRef), idRef)
  );
  const [score, setScore] = useState(0);
  const [bestBySize, setBestBySize] = useState({});
  const [sizeIndex, setSizeIndex] = useState(
    GRID_SIZES.indexOf(DEFAULT_GRID_SIZE)
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [history, setHistory] = useState([]);
  const [animKey, setAnimKey] = useState(0);

  const positionsRef = useRef(new Map());
  const scaleRef = useRef(new Map());
  const timerRef = useRef(null);
  const gameStartRef = useRef(null);
  const hasMovedRef = useRef(false);

  useEffect(() => {
    const loadBest = async () => {
      try {
        const raw = await AsyncStorage.getItem('best-2048-rn-by-size');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            setBestBySize(parsed);
            return;
          }
        }
      } catch (e) {
        // ignore parse errors
      }
      try {
        const legacy = await AsyncStorage.getItem('best-2048-rn');
        if (legacy) {
          const value = Number(legacy);
          if (!Number.isNaN(value)) {
            setBestBySize({ '4': value });
          }
        }
      } catch (e) {
        // ignore
      }
    };
    loadBest();
  }, []);

  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(
          'best-2048-rn-by-size',
          JSON.stringify(bestBySize)
        );
      } catch (e) {
        // ignore quota errors
      }
    };
    if (Object.keys(bestBySize).length) {
      save();
    }
  }, [bestBySize]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const raw = await AsyncStorage.getItem('history-2048-rn-records');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHistory(parsed);
      } catch (e) {
        // ignore parse errors
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    const saveHistory = async () => {
      try {
        await AsyncStorage.setItem(
          'history-2048-rn-records',
          JSON.stringify(history)
        );
      } catch (e) {
        // ignore quota errors
      }
    };
    saveHistory();
  }, [history]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    gameStartRef.current = Date.now();
    setElapsedSeconds(0);
    hasMovedRef.current = false;
    timerRef.current = setInterval(() => {
      const start = gameStartRef.current;
      if (!start) return;
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const finishGameAndRecord = (finalScore, finalSize) => {
    const start = gameStartRef.current;
    if (!start) return;
    // 没有实际操作（没有发生过移动）的对局不计入历史
    if (!hasMovedRef.current) {
      stopTimer();
      gameStartRef.current = null;
      return;
    }
    const elapsed = Math.floor((Date.now() - start) / 1000);
    stopTimer();
    const record = {
      size: finalSize,
      seconds: elapsed,
      score: finalScore,
      startedAt: start,
    };
    setHistory(prev => {
      const next = [record, ...prev];
      return next.slice(0, 10);
    });
    gameStartRef.current = null;
  };

  useEffect(() => {
    startTimer();
  }, []);

  const boardSize = useMemo(() => {
    const w = Dimensions.get('window').width;
    return Math.min(420, w - 32);
  }, []);

  const tileSize = useMemo(() => {
    const size = grid.length || gridSize;
    return (boardSize - BOARD_PADDING * 2 - GAP * (size - 1)) / size;
  }, [boardSize, grid, gridSize]);

  const tiles = useMemo(() => flattenTiles(grid), [grid]);

  useEffect(() => {
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
    [grid, score, gridSize, bestBySize, isGameOver]
  );

  const move = direction => {
    if (isGameOver) return;
    const { moved, newGrid, gained } = slideGrid(grid, direction, idRef);
    if (!moved) return;
    hasMovedRef.current = true;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const withNew = addRandomTile(newGrid, idRef);
    setGrid(withNew);
    const newScore = score + gained;
    setScore(newScore);
    const sizeKey = String(withNew.length || gridSize);
    const currentBest = bestBySize[sizeKey] || 0;
    if (newScore > currentBest) {
      setBestBySize(prev => ({ ...prev, [sizeKey]: newScore }));
    }
    setAnimKey(k => k + 1);
    if (!hasMoves(withNew)) {
      setIsGameOver(true);
      finishGameAndRecord(newScore, withNew.length);
    }
  };

  const restart = () => {
    finishGameAndRecord(score, grid.length || gridSize);
    const size = grid.length || gridSize;
    const fresh = addRandomTile(
      addRandomTile(createEmptyGrid(size), idRef),
      idRef
    );
    setGrid(fresh);
    setScore(0);
    setIsGameOver(false);
    setElapsedSeconds(0);
    setAnimKey(k => k + 1);
    startTimer();
  };

  const changeSize = delta => {
    const nextIndex = sizeIndex + delta;
    if (nextIndex < 0 || nextIndex >= GRID_SIZES.length) return;
    const nextSize = GRID_SIZES[nextIndex];
    finishGameAndRecord(score, grid.length || gridSize);
    setSizeIndex(nextIndex);
    setGridSize(nextSize);
    const fresh = addRandomTile(
      addRandomTile(createEmptyGrid(nextSize), idRef),
      idRef
    );
    setGrid(fresh);
    setScore(0);
    setIsGameOver(false);
    setElapsedSeconds(0);
    setAnimKey(k => k + 1);
    startTimer();
  };

  const formatTime = totalSeconds => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleDeleteHistory = index => {
    setHistory(prev => prev.filter((_, i) => i !== index));
  };

  const formatStartTime = timestamp => {
    const d = new Date(timestamp);
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const DD = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${MM}-${DD} ${hh}:${mm}:${ss}`;
  };

  const currentSize = grid.length || gridSize;
  const sizeKey = String(currentSize);
  const bestForSize = bestBySize[sizeKey] || 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>2048</Text>
          <View style={styles.scores}>
            <Score label="score" value={score} />
            <Score label="best" value={bestForSize} />
            <Score label="time" value={formatTime(elapsedSeconds)} />
          </View>
        </View>
        <View style={styles.topRow}>
          <Text style={styles.instructions}>
            滑动合并方块，冲击 2048！
          </Text>
          <TouchableOpacity style={styles.btn} onPress={restart}>
            <Text style={styles.btnText}>新游戏</Text>
          </TouchableOpacity>
        </View>
        <View
          style={[styles.board, { width: boardSize, height: boardSize, padding: BOARD_PADDING }]}
          {...panResponder.panHandlers}
        >
          <GridCells gap={GAP} tileSize={tileSize} gridSize={currentSize} />
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
              const colors = TILE_COLORS[tile.value] || {
                bg: '#3c3a32',
                fg: '#f9f6f2',
              };
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
                    <Text style={[styles.tileText, { color: colors.fg }]}>
                      {tile.value}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>
          {isGameOver && (
            <View style={styles.overlay}>
              <Text style={styles.overlayText}>游戏结束</Text>
              <TouchableOpacity style={styles.btn} onPress={restart}>
                <Text style={styles.btnText}>再来一局</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={styles.sizeRow}>
          <TouchableOpacity
            style={styles.sizeBtn}
            onPress={() => changeSize(-1)}
            disabled={sizeIndex <= 0}
          >
            <Text style={styles.sizeBtnText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.sizeLabel}>
            {currentSize}×{currentSize}
          </Text>
          <TouchableOpacity
            style={styles.sizeBtn}
            onPress={() => changeSize(1)}
            disabled={sizeIndex >= GRID_SIZES.length - 1}
          >
            <Text style={styles.sizeBtnText}>{'>'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.history}>
          <Text style={styles.historyTitle}>对局记录</Text>
          {history.length === 0 ? (
            <Text style={styles.historyEmpty}>暂无对局</Text>
          ) : (
            history.map((item, index) => (
              <View key={item.startedAt || index} style={styles.historyItem}>
                <Text style={styles.historyText}>
                  {formatStartTime(item.startedAt)} · {item.size}×{item.size} ·{' '}
                  {formatTime(item.seconds)} · {item.score}分
                </Text>
                <TouchableOpacity
                  style={styles.historyDelete}
                  onPress={() => handleDeleteHistory(index)}
                >
                  <Text style={styles.historyDeleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Score = ({ label, value }) => (
  <View style={styles.scoreBox}>
    <Text style={styles.scoreLabel}>{label}</Text>
    <Text style={styles.scoreValue}>{value}</Text>
  </View>
);

const GridCells = ({ gap, tileSize, gridSize }) => {
  const cells = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      cells.push(
        <View
          key={`cell-${r}-${c}`}
          style={[
            styles.cell,
            {
              width: tileSize,
              height: tileSize,
              marginRight: c === gridSize - 1 ? 0 : gap,
              marginBottom: r === gridSize - 1 ? 0 : gap,
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
  const size = grid.length;
  const newGrid = createEmptyGrid(size);

  const traverse = size;

  const getLine = idx => {
    const line = [];
    for (let i = 0; i < size; i++) {
      if (direction === 'left' || direction === 'right') {
        line.push(grid[idx][i]);
      } else {
        line.push(grid[i][idx]);
      }
    }
    return line;
  };

  const setLine = (idx, line) => {
    for (let i = 0; i < size; i++) {
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
    while (result.length < size) result.push(null);
    if (direction === 'right' || direction === 'down') result.reverse();
    return result;
  };

  for (let idx = 0; idx < traverse; idx++) {
    const oldLine = getLine(idx);
    const newLine = processLine(oldLine);
    setLine(idx, newLine);
    for (let j = 0; j < size; j++) {
      if (oldLine[j] !== newLine[j]) moved = true;
    }
  }

  return { moved, newGrid, gained };
};

const addRandomTile = (grid, idRef = { current: 1000 }) => {
  const size = grid.length;
  const empties = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
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
  const size = grid.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
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

const hasMoves = grid => {
  const size = grid.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const tile = grid[r][c];
      if (!tile) return true;
      const value = tile.value;
      const dirs = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
      ];
      if (
        dirs.some(v => {
          const nr = r + v.y;
          const nc = c + v.x;
          if (nr < 0 || nr >= size || nc < 0 || nc >= size) return false;
          const next = grid[nr][nc];
          return !next || next.value === value;
        })
      ) {
        return true;
      }
    }
  }
  return false;
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#faf8ef',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  scrollContent: {
    paddingBottom: 24,
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(238, 228, 218, 0.73)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#776e65',
    marginBottom: 12,
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  sizeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#8f7a66',
    borderRadius: 4,
  },
  sizeBtnText: {
    color: '#f9f6f2',
    fontSize: 18,
    fontWeight: '700',
  },
  sizeLabel: {
    minWidth: 64,
    textAlign: 'center',
    fontSize: 16,
    color: '#776e65',
  },
  history: {
    marginTop: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#776e65',
    marginBottom: 4,
  },
  historyEmpty: {
    fontSize: 13,
    color: '#776e65',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(187, 173, 160, 0.25)',
  },
  historyText: {
    flex: 1,
    fontSize: 13,
    color: '#776e65',
    marginRight: 8,
  },
  historyDelete: {
    backgroundColor: '#d9534f',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  historyDeleteText: {
    color: '#f9f6f2',
    fontSize: 12,
  },
});
