// ── Stage 2: Sensor & Actuator Encyclopedia ──
// Interactive card gallery with detail view and mini quiz for Korean middle school students

import { useState } from 'react';
import { SENSORS, ACTUATORS } from '../data/sensors';
import type { SensorInfo, SensorPin } from '../data/sensors';
import { Quiz } from '../components/Quiz';
import { QUIZ_STAGE2 } from '../data/quizzes';

// ── Filter tabs (as const — no enum, per erasableSyntaxOnly) ──
const FILTER_TABS = [
  { key: 'all', label: '전체' },
  { key: 'sensor', label: '센서' },
  { key: 'actuator', label: '액추에이터' },
] as const;

type FilterType = (typeof FILTER_TABS)[number]['key'];

// ── Quiz pass threshold ──
const QUIZ_PASS_SCORE = 100;

interface Stage2Props {
  onComplete: () => void;
}

// ── Helper: format pin target for display ──
function getPinTargetLabel(pin: SensorPin): string {
  if (pin.targetGpio !== null) {
    return `GPIO ${pin.targetGpio}`;
  }
  switch (pin.targetType) {
    case 'power':
      return 'VCC (3.3V)';
    case 'ground':
      return 'GND';
    default:
      return pin.label;
  }
}

export function Stage2Sensors({ onComplete }: Stage2Props) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedSensor, setSelectedSensor] = useState<SensorInfo | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  // ── Filtered list based on active tab ──
  const items: SensorInfo[] =
    filter === 'sensor'
      ? SENSORS
      : filter === 'actuator'
        ? ACTUATORS
        : [...SENSORS, ...ACTUATORS];

  // ── Quiz completion: call stage onComplete when passed ──
  function handleQuizComplete(score: number) {
    if (score >= QUIZ_PASS_SCORE) {
      onComplete();
    }
  }

  // ═══════════════════════════════════════════════════════
  // Detail View (when a card is clicked)
  // ═══════════════════════════════════════════════════════
  if (selectedSensor) {
    const s = selectedSensor;
    const isSensor = s.type === 'sensor';

    return (
      <div className="stage">
        <div
          className="card"
          style={{ borderColor: 'var(--accent-blue)', boxShadow: 'var(--shadow-glow-blue)' }}
        >
          {/* Header: emoji + name + badges */}
          <div className="card__header">
            <span className="card__emoji" style={{ fontSize: '3rem' }}>
              {s.emoji}
            </span>
            <div>
              <div className="card__title" style={{ fontSize: '1.5rem' }}>
                {s.name}
              </div>
              {s.subName && <div className="card__subtitle">{s.subName}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <span className={`badge ${isSensor ? 'badge--blue' : 'badge--purple'}`}>
                  {isSensor ? '📡 센서' : '⚙️ 액추에이터'}
                </span>
                <span className="badge badge--gray">{s.category}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card__body" style={{ marginBottom: 20 }}>
            {s.description}
          </div>

          {/* 실생활 예시 */}
          <div className="info-box info-box--green">
            <div className="info-box__title">🌱 실생활 예시</div>
            {s.realLifeExample}
          </div>

          {/* 핀 정보 */}
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                fontWeight: 700,
                marginBottom: 12,
                color: 'var(--text-primary)',
                fontSize: '1.05rem',
              }}
            >
              🔌 핀 정보
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span className="badge badge--yellow">{s.pinType}</span>
              <span className="badge badge--gray">{s.pins.length}개 핀</span>
            </div>

            {/* Wire-by-wire list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {s.pins.map((pin) => (
                <div
                  key={pin.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: pin.color,
                      border: '2px solid rgba(255,255,255,0.3)',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      minWidth: 60,
                    }}
                  >
                    {pin.label}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {pin.colorName} 선
                  </span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      color: 'var(--accent-blue)',
                      fontWeight: 600,
                    }}
                  >
                    → {getPinTargetLabel(pin)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Close button */}
          <button
            className="btn btn--ghost"
            onClick={() => setSelectedSensor(null)}
            style={{ marginTop: 24 }}
          >
            ← 닫기
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // Main Gallery View
  // ═══════════════════════════════════════════════════════
  return (
    <div className="stage">
      {/* ── Section 1: Introduction ── */}
      <h2 className="stage__title">📚 센서와 액추에이터 백과사전</h2>
      <p className="stage__description">
        ESP32에 연결할 수 있는 다양한 센서와 액추에이터를 알아봐요. 카드를 클릭하면 자세한 정보를 볼
        수 있어요!
      </p>

      <div className="info-box info-box--blue">
        <div className="info-box__title">📖 센서 vs 액추에이터</div>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: 'var(--accent-blue)' }}>📡 센서</strong> = 데이터를 읽는 부품
          (예: 온도 측정, 거리 측정)
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: 'var(--accent-purple)' }}>⚙️ 액추에이터</strong> = 행동하는 부품
          (예: 모터 회전, 소리 출력)
        </div>
        <div>센서는 눈/귀/코 역할, 액추에이터는 손/발 역할이라고 생각하면 쉬워요!</div>
      </div>

      {/* ── Section 2: Filter Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`btn ${filter === tab.key ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Section 3: Card Gallery ── */}
      <div className="grid grid--3">
        {items.map((item) => {
          const isSensor = item.type === 'sensor';
          return (
            <div
              key={item.key}
              className="card card--clickable"
              onClick={() => setSelectedSensor(item)}
            >
              <div className="card__header">
                <span className="card__emoji">{item.emoji}</span>
                <div>
                  <div className="card__title">{item.name}</div>
                  {item.subName && <div className="card__subtitle">{item.subName}</div>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                <span className={`badge ${isSensor ? 'badge--blue' : 'badge--purple'}`}>
                  {isSensor ? '센서' : '액추에이터'}
                </span>
                <span className="badge badge--gray">{item.category}</span>
              </div>

              <div className="card__body" style={{ fontSize: '0.85rem' }}>
                {isSensor ? '측정' : '동작'}: {item.measure}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Section 4: Mini Quiz ── */}
      <div style={{ marginTop: 40 }}>
        <div className="info-box info-box--yellow">
          <div className="info-box__title">💡 퀴즈 준비!</div>
          모든 센서와 액추에이터를 살펴봤나요? 퀴즈를 풀고 다음 단계로 넘어가요!
        </div>

        {!showQuiz ? (
          <button className="btn btn--primary btn--lg" onClick={() => setShowQuiz(true)}>
            📝 퀴즈 풀기
          </button>
        ) : (
          <Quiz
            questions={QUIZ_STAGE2}
            onComplete={handleQuizComplete}
            selectCount={5}
            title="센서와 액추에이터 퀴즈"
          />
        )}
      </div>
    </div>
  );
}

export default Stage2Sensors;
