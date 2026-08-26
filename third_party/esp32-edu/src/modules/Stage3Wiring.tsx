// ── Stage 3: Wiring Simulation ──
// Drag-and-drop pin wiring for Korean middle school students

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { Quiz } from '../components/Quiz';
import { QUIZ_STAGE3 } from '../data/quizzes';
import { WIRING_MISSIONS } from '../data/curriculum';
import type { WiringMission } from '../data/curriculum';
import { getSensorByKey } from '../data/sensors';
import type { SensorInfo, SensorPin, SimulatedData } from '../data/sensors';
import { useProgressStore } from '../store/progressStore';

// ── Board constants (matching Stage1Intro) ──
const BOARD_W = 440;
const BOARD_H = 560;
const PIN_SIZE = 14;
const PIN_GAP = 2;
const PIN_COL_STEP = PIN_SIZE + PIN_GAP;
const PIN_Y_START = 75;
const PIN_Y_STEP = 28;
const LEFT_PIN_X = 30;
const RIGHT_PIN_X = BOARD_W - 76;

const PIN_FILL = {
  G: '#2c3e50',
  V: '#e74c3c',
  S: '#f0a500',
} as const;

const LEFT_GPIOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;
const RIGHT_GPIOS = [16, 17, 18, 20, 21, 38, 39, 40, 41, 42, 47, 48] as const;

const QUIZ_PASS_SCORE = 100;

// ── Types ──
type PinColumn = 'G' | 'V' | 'S';

interface WireDef {
  id: string;
  sensorKey: string;
  sensorName: string;
  sensorEmoji: string;
  pin: SensorPin;
  simulatedData?: SimulatedData;
}

interface BoardPinDef {
  id: string;
  x: number;
  y: number;
  column: PinColumn;
  gpio: number;
  side: 'L' | 'R';
}

interface LineDef {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

// ── Build all board pin definitions ──
const ALL_BOARD_PINS: BoardPinDef[] = [
  ...LEFT_GPIOS.flatMap((gpio, i) => {
    const y = PIN_Y_START + i * PIN_Y_STEP;
    return [
      { id: `pin-L-${gpio}-G`, x: LEFT_PIN_X, y, column: 'G' as const, gpio, side: 'L' as const },
      { id: `pin-L-${gpio}-V`, x: LEFT_PIN_X + PIN_COL_STEP, y, column: 'V' as const, gpio, side: 'L' as const },
      { id: `pin-L-${gpio}-S`, x: LEFT_PIN_X + PIN_COL_STEP * 2, y, column: 'S' as const, gpio, side: 'L' as const },
    ];
  }),
  ...RIGHT_GPIOS.flatMap((gpio, i) => {
    const y = PIN_Y_START + i * PIN_Y_STEP;
    return [
      { id: `pin-R-${gpio}-S`, x: RIGHT_PIN_X, y, column: 'S' as const, gpio, side: 'R' as const },
      { id: `pin-R-${gpio}-V`, x: RIGHT_PIN_X + PIN_COL_STEP, y, column: 'V' as const, gpio, side: 'R' as const },
      { id: `pin-R-${gpio}-G`, x: RIGHT_PIN_X + PIN_COL_STEP * 2, y, column: 'G' as const, gpio, side: 'R' as const },
    ];
  }),
];

// ── Helpers ──
function getTargetLabel(pin: SensorPin): string {
  if (pin.targetGpio !== null) return `GPIO ${pin.targetGpio}`;
  if (pin.targetType === 'power') return 'VCC (전원)';
  if (pin.targetType === 'ground') return 'GND (접지)';
  return pin.label;
}

function isCorrectMatch(pin: SensorPin, boardPinId: string): boolean {
  const parts = boardPinId.split('-');
  const gpio = parseInt(parts[2], 10);
  const column = parts[3] as PinColumn;
  switch (pin.targetType) {
    case 'power': return column === 'V';
    case 'ground': return column === 'G';
    case 'signal':
    case 'i2c-sda':
    case 'i2c-scl':
    case 'echo':
      return column === 'S' && pin.targetGpio === gpio;
    default: return false;
  }
}

function loadMissionSensors(mission: WiringMission): SensorInfo[] {
  if (mission.sensorKey === 'dht11+oled') {
    const dht11 = getSensorByKey('dht11');
    const oled = getSensorByKey('oled');
    return [dht11, oled].filter((s): s is SensorInfo => s !== undefined);
  }
  const s = getSensorByKey(mission.sensorKey);
  return s ? [s] : [];
}

function buildWires(sensors: SensorInfo[]): WireDef[] {
  return sensors.flatMap((sensor) =>
    sensor.pins.map((pin, pinIndex) => ({
      id: `${sensor.key}-${pinIndex}`,
      sensorKey: sensor.key,
      sensorName: sensor.name,
      sensorEmoji: sensor.emoji,
      pin,
      simulatedData: sensor.simulatedData,
    })),
  );
}

// ══════════════════════════════════════════════════════
// DraggableWire — a sensor wire that can be dragged
// ══════════════════════════════════════════════════════
function DraggableWire({ wire, connected, wrong, registerRef }: { wire: WireDef; connected: boolean; wrong: boolean; registerRef: (el: HTMLDivElement | null) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: wire.id,
    disabled: connected,
  });

  const wireStyle: CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    cursor: connected ? 'default' : isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 1000 : 1,
    touchAction: 'none',
  };

  const borderColor = connected ? 'var(--accent-green)' : wrong ? 'var(--accent-red)' : 'var(--border)';
  const bgColor = connected ? 'rgba(61, 214, 140, 0.1)' : wrong ? 'rgba(255, 107, 107, 0.15)' : 'var(--bg-input)';

  return (
    <div ref={(node) => { setNodeRef(node); registerRef(node); }} style={wireStyle} {...listeners} {...attributes}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', background: bgColor,
        border: `2px solid ${borderColor}`, borderRadius: 8,
        transition: 'all 0.2s ease',
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 4,
          background: wire.pin.color, flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.2)',
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
            {wire.pin.label}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {wire.pin.colorName} · {getTargetLabel(wire.pin)}
          </div>
        </div>
        {connected && <span style={{ color: 'var(--accent-green)', fontSize: '1.2rem', fontWeight: 700 }}>✓</span>}
        {wrong && <span style={{ color: 'var(--accent-red)', fontSize: '1.2rem', fontWeight: 700 }}>✗</span>}
        {!connected && !wrong && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>드래그</span>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// DroppablePin — HTML overlay on SVG board for drop targets
// ══════════════════════════════════════════════════════
function DroppablePin({ pinDef, wireColor }: { pinDef: BoardPinDef; wireColor: string | null }) {
  const { isOver, setNodeRef } = useDroppable({ id: pinDef.id });
  const active = isOver || wireColor !== null;

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: `${(pinDef.x / BOARD_W) * 100}%`,
        top: `${(pinDef.y / BOARD_H) * 100}%`,
        width: `${(PIN_SIZE / BOARD_W) * 100}%`,
        height: `${(PIN_SIZE / BOARD_H) * 100}%`,
        borderRadius: 2,
        background: wireColor ?? (isOver ? 'rgba(245, 205, 71, 0.5)' : 'transparent'),
        border: active ? `2px solid ${wireColor ?? '#f5cd47'}` : '1px solid transparent',
        boxShadow: active ? `0 0 8px ${wireColor ?? '#f5cd47'}` : 'none',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
      }}
    />
  );
}

// ══════════════════════════════════════════════════════
// BoardSVG — decorative SVG board (no interaction)
// ══════════════════════════════════════════════════════
function BoardSVG() {
  return (
    <svg viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }}>
      <rect x={10} y={20} width={420} height={520} rx={12} fill="#0d4f1e" stroke="#063014" strokeWidth={2} />
      <rect x={180} y={6} width={80} height={28} rx={4} fill="#7f8c8d" stroke="#555" strokeWidth={1} />
      <rect x={186} y={10} width={68} height={20} rx={3} fill="#3d4548" />
      <text x={220} y={24} textAnchor="middle" fill="#6b7280" fontSize={8}>USB-C</text>
      <circle cx={290} cy={48} r={6} fill="#3dd68c" stroke="#27ae60" strokeWidth={1} />
      <rect x={170} y={180} width={100} height={14} rx={2} fill="#c0c4c8" stroke="#8a8e92" strokeWidth={1} />
      <rect x={130} y={200} width={180} height={170} rx={6} fill="#c0c4c8" stroke="#8e9499" strokeWidth={1.5} />
      <rect x={140} y={210} width={160} height={150} rx={3} fill="#8e9499" opacity={0.3} />
      <text x={220} y={270} textAnchor="middle" fill="#2c3e50" fontSize={18} fontWeight={700}>ESP32-S3</text>
      <text x={220} y={292} textAnchor="middle" fill="#2c3e50" fontSize={14}>N16R8</text>

      {/* Left pin headers */}
      <text x={LEFT_PIN_X + 7} y={62} fill="#5a7a4a" fontSize={8} fontWeight={600}>G</text>
      <text x={LEFT_PIN_X + PIN_COL_STEP + 7} y={62} fill="#5a7a4a" fontSize={8} fontWeight={600}>V</text>
      <text x={LEFT_PIN_X + PIN_COL_STEP * 2 + 7} y={62} fill="#5a7a4a" fontSize={8} fontWeight={600}>S</text>
      {LEFT_GPIOS.map((gpio, i) => {
        const y = PIN_Y_START + i * PIN_Y_STEP;
        const isSda = gpio === 8;
        const isScl = gpio === 9;
        return (
          <g key={`svg-L-${i}`}>
            <rect x={LEFT_PIN_X} y={y} width={PIN_SIZE} height={PIN_SIZE} rx={2} fill={PIN_FILL.G} />
            <rect x={LEFT_PIN_X + PIN_COL_STEP} y={y} width={PIN_SIZE} height={PIN_SIZE} rx={2} fill={PIN_FILL.V} />
            <rect x={LEFT_PIN_X + PIN_COL_STEP * 2} y={y} width={PIN_SIZE} height={PIN_SIZE} rx={2} fill={PIN_FILL.S} />
            <text x={26} y={y + 11} textAnchor="end"
              fill={isSda ? '#3dd68c' : isScl ? '#4a9eff' : '#e8eaf0'}
              fontSize={9} fontWeight={isSda || isScl ? 700 : 400}>{gpio}</text>
            {isSda && <text x={82} y={y + 11} textAnchor="start" fill="#3dd68c" fontSize={9} fontWeight={700}>SDA</text>}
            {isScl && <text x={82} y={y + 11} textAnchor="start" fill="#4a9eff" fontSize={9} fontWeight={700}>SCL</text>}
          </g>
        );
      })}

      {/* Right pin headers */}
      <text x={RIGHT_PIN_X + 7} y={62} fill="#5a7a4a" fontSize={8} fontWeight={600}>S</text>
      <text x={RIGHT_PIN_X + PIN_COL_STEP + 7} y={62} fill="#5a7a4a" fontSize={8} fontWeight={600}>V</text>
      <text x={RIGHT_PIN_X + PIN_COL_STEP * 2 + 7} y={62} fill="#5a7a4a" fontSize={8} fontWeight={600}>G</text>
      {RIGHT_GPIOS.map((gpio, i) => {
        const y = PIN_Y_START + i * PIN_Y_STEP;
        return (
          <g key={`svg-R-${i}`}>
            <rect x={RIGHT_PIN_X} y={y} width={PIN_SIZE} height={PIN_SIZE} rx={2} fill={PIN_FILL.S} />
            <rect x={RIGHT_PIN_X + PIN_COL_STEP} y={y} width={PIN_SIZE} height={PIN_SIZE} rx={2} fill={PIN_FILL.V} />
            <rect x={RIGHT_PIN_X + PIN_COL_STEP * 2} y={y} width={PIN_SIZE} height={PIN_SIZE} rx={2} fill={PIN_FILL.G} />
            <text x={414} y={y + 11} textAnchor="start" fill="#e8eaf0" fontSize={9}>{gpio}</text>
          </g>
        );
      })}

      <text x={220} y={520} textAnchor="middle" fill="#5a7a4a" fontSize={11} fontWeight={600}>ESP32-S3-MOC</text>
    </svg>
  );
}

// ══════════════════════════════════════════════════════
// Main Component: Stage3Wiring
// ══════════════════════════════════════════════════════
interface Stage3Props {
  onComplete: () => void;
  teacherMode?: boolean;
}

export function Stage3Wiring({ onComplete, teacherMode }: Stage3Props) {
  const completeWiringMission = useProgressStore((s) => s.completeWiringMission);

  const [missionIndex, setMissionIndex] = useState(0);
  const [connections, setConnections] = useState<Record<string, string>>({});
  const [wrongWireId, setWrongWireId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [missionDone, setMissionDone] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const wireElements = useRef<Map<string, HTMLDivElement>>(new Map());
  const [lines, setLines] = useState<LineDef[]>([]);
  const [tick, setTick] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const mission = WIRING_MISSIONS[missionIndex];
  const missionSensors = useMemo(() => loadMissionSensors(mission), [mission]);
  const wires = useMemo(() => buildWires(missionSensors), [missionSensors]);
  const allConnected = wires.length > 0 && wires.every((w) => connections[w.id] !== undefined);

  // Reverse map: pinId → wireId
  const pinWireMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const [wireId, pinId] of Object.entries(connections)) {
      m[pinId] = wireId;
    }
    return m;
  }, [connections]);

  // Reset state when mission changes
  useEffect(() => {
    setConnections({});
    setWrongWireId(null);
    setShowHint(false);
    setMissionDone(false);
  }, [missionIndex]);

  // Mark mission done when all wires connected
  useEffect(() => {
    if (allConnected && !missionDone) {
      setMissionDone(true);
      completeWiringMission(mission.id);
    }
  }, [allConnected, missionDone, mission.id, completeWiringMission]);

  function handleNextMission() {
    if (missionIndex < WIRING_MISSIONS.length - 1) {
      setMissionIndex((m) => m + 1);
    } else {
      setShowQuiz(true);
    }
  }

  useLayoutEffect(() => {
    const container = containerRef.current;
    const board = boardRef.current;
    if (!container || !board) return;

    const containerRect = container.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    const newLines: LineDef[] = [];

    for (const [wireId, pinId] of Object.entries(connections)) {
      const wireEl = wireElements.current.get(wireId);
      if (!wireEl) continue;
      const wire = wires.find((w) => w.id === wireId);
      const pinDef = ALL_BOARD_PINS.find((p) => p.id === pinId);
      if (!wire || !pinDef) continue;

      const wireRect = wireEl.getBoundingClientRect();
      const pinX = boardRect.left + ((pinDef.x + PIN_SIZE / 2) / BOARD_W) * boardRect.width - containerRect.left;
      const pinY = boardRect.top + ((pinDef.y + PIN_SIZE / 2) / BOARD_H) * boardRect.height - containerRect.top;

      newLines.push({
        x1: wireRect.right - containerRect.left,
        y1: wireRect.top + wireRect.height / 2 - containerRect.top,
        x2: pinX,
        y2: pinY,
        color: wire.pin.color,
      });
    }

    setLines(newLines);
  }, [connections, wires, tick]);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const wireId = active.id as string;
    const pinId = over.id as string;

    // Check pin not already occupied
    const occupiedByOther = Object.entries(connections).find(
      ([wid, pid]) => pid === pinId && wid !== wireId,
    );
    if (occupiedByOther) {
      setWrongWireId(wireId);
      setTimeout(() => setWrongWireId(null), 1000);
      return;
    }

    const wire = wires.find((w) => w.id === wireId);
    if (!wire) return;

    if (isCorrectMatch(wire.pin, pinId)) {
      setConnections((prev) => ({ ...prev, [wireId]: pinId }));
    } else {
      setWrongWireId(wireId);
      setTimeout(() => setWrongWireId(null), 1000);
    }
  }

  function handleQuizComplete(score: number) {
    if (score >= QUIZ_PASS_SCORE) {
      setQuizPassed(true);
      onComplete();
    }
  }

  // ── Quiz view ──
  if (showQuiz) {
    return (
      <div className="stage">
        <h2 className="stage__title"><span>📝</span> 배선 시뮬레이션 퀴즈</h2>
        <p className="stage__description">4개의 미션을 모두 완료했어요! 마지막으로 퀴즈를 풀어봐요.</p>
        <Quiz
          questions={QUIZ_STAGE3}
          title="배선 시뮬레이션 퀴즈"
          selectCount={3}
          onComplete={handleQuizComplete}
        />
        {quizPassed && (
          <div className="info-box info-box--green" style={{ marginTop: 16 }}>
            <div className="info-box__title">🎉 스테이지 3 완료!</div>
            축하해요! 센서를 ESP32 보드에 연결하는 방법을 마스터했어요. 다음 단계로 진행해 보세요!
            <div style={{ marginTop: 12 }}>
              <button className="btn btn--success" onClick={onComplete}>다음 단계로 →</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Mission view ──
  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <div className="stage">
        <h2 className="stage__title"><span>🔌</span> 배선 시뮬레이션</h2>
        <p className="stage__description">
          센서의 선을 드래그해서 ESP32 보드의 올바른 핀에 연결해 보세요!
        </p>

        {/* Mission progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {WIRING_MISSIONS.map((m, i) => (
            <div
              key={m.id}
              style={{
                flex: 1, height: 8, borderRadius: 4,
                background: i < missionIndex ? 'var(--accent-green)' : i === missionIndex ? 'var(--accent-blue)' : 'var(--border)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
          미션 {missionIndex + 1} / {WIRING_MISSIONS.length} — {mission.title}
        </div>

        {teacherMode && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
            {WIRING_MISSIONS.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setMissionIndex(i)}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  background: i === missionIndex ? 'var(--accent-blue)' : 'var(--bg-card)',
                  color: i === missionIndex ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                미션 {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Mission description */}
        <div className="info-box info-box--blue" style={{ marginBottom: 16 }}>
          <div className="info-box__title">📋 {mission.title}</div>
          {mission.description}
        </div>

        {/* Hint */}
        <div style={{ marginBottom: 20 }}>
          {!showHint ? (
            <button className="btn btn--ghost" onClick={() => setShowHint(true)}>
              💡 힌트 보기
            </button>
          ) : (
            <div className="info-box info-box--yellow">
              <div className="info-box__title">💡 힌트</div>
              {mission.hint}
            </div>
          )}
        </div>

        {/* Main: sensor wires + board */}
        <div ref={containerRef} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start', position: 'relative' }}>
          {/* Left: sensor card with wires */}
          <div>
            {missionSensors.map((sensor) => {
              const sensorWires = wires.filter((w) => w.sensorKey === sensor.key);
              const sensorAllConnected = sensorWires.every((w) => connections[w.id] !== undefined);
              return (
                <div key={sensor.key} className="card" style={{ marginBottom: 16 }}>
                  <div className="card__header">
                    <span className="card__emoji">{sensor.emoji}</span>
                    <div>
                      <div className="card__title">{sensor.name}</div>
                      {sensor.subName && <div className="card__subtitle">{sensor.subName}</div>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                    {sensorWires.map((wire) => (
                      <DraggableWire
                        key={wire.id}
                        wire={wire}
                        connected={connections[wire.id] !== undefined}
                        wrong={wrongWireId === wire.id}
                        registerRef={(el) => {
                          if (el) wireElements.current.set(wire.id, el);
                          else wireElements.current.delete(wire.id);
                        }}
                      />
                    ))}
                  </div>

                  {/* Simulated data when all connected */}
                  {sensorAllConnected && sensor.simulatedData && (
                    <div className="info-box info-box--green" style={{ marginTop: 12 }}>
                      <div className="info-box__title">📊 센서 데이터</div>
                      {sensor.simulatedData.label}: {sensor.simulatedData.default}{sensor.simulatedData.unit}
                    </div>
                  )}
                  {sensorAllConnected && !sensor.simulatedData && (
                    <div className="info-box info-box--green" style={{ marginTop: 12 }}>
                      <div className="info-box__title">✅ 연결 완료</div>
                      {sensor.name}이(가) 정상적으로 연결되었어요!
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: ESP32 board with droppable pins */}
          <div>
            <div className="card">
              <div className="card__header">
                <span className="card__emoji">🔧</span>
                <div>
                  <div className="card__title">ESP32-S3-MOC 보드</div>
                  <div className="card__subtitle">선을 드래그해서 핀에 놓으세요</div>
                </div>
              </div>

              <div ref={boardRef} style={{ position: 'relative', width: '100%', maxWidth: BOARD_W, margin: '0 auto' }}>
                <BoardSVG />
                {/* HTML overlay droppable targets */}
                {ALL_BOARD_PINS.map((pinDef) => {
                  const wireId = pinWireMap[pinDef.id];
                  const wire = wireId ? wires.find((w) => w.id === wireId) : null;
                  return (
                    <DroppablePin
                      key={pinDef.id}
                      pinDef={pinDef}
                      wireColor={wire ? wire.pin.color : null}
                    />
                  );
                })}
              </div>

              {/* GVS legend */}
              <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ color: PIN_FILL.G, fontWeight: 700 }}>■</span> GND
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ color: PIN_FILL.V, fontWeight: 700 }}>■</span> VCC
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ color: PIN_FILL.S, fontWeight: 700 }}>■</span> Signal
                </span>
              </div>
            </div>
          </div>

          {lines.length > 0 && (
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
              {lines.map((line, i) => {
                const dx = line.x2 - line.x1;
                return (
                  <path
                    key={i}
                    d={`M ${line.x1} ${line.y1} C ${line.x1 + dx * 0.4} ${line.y1}, ${line.x2 - dx * 0.4} ${line.y2}, ${line.x2} ${line.y2}`}
                    stroke={line.color}
                    strokeWidth={4}
                    fill="none"
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}
                  />
                );
              })}
            </svg>
          )}
        </div>

        {/* Success message when all connected */}
        {allConnected && !showQuiz && (
          <div className="info-box info-box--green" style={{ marginTop: 24, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
            <div className="info-box__title">미션 {missionIndex + 1} 완료!</div>
            <p>모든 선을 올바르게 연결했어요!</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn--success" onClick={handleNextMission}>
                {missionIndex < WIRING_MISSIONS.length - 1 ? '다음 미션으로 →' : '퀴즈 풀기 →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
}

export default Stage3Wiring;
