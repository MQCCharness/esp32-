// ── Stage 1: ESP32-S3-MOC Board Introduction ──
// Interactive board diagram with clickable parts + capability cards + mini quiz

import { useState } from 'react';
import { Quiz } from '../components/Quiz';
import { QUIZ_STAGE1 } from '../data/quizzes';

// ── Board constants ──
const BOARD_W = 440;
const BOARD_H = 560;
const PIN_SIZE = 14;
const PIN_GAP = 2;
const PIN_COL_STEP = PIN_SIZE + PIN_GAP; // 16
const PIN_Y_START = 75;
const PIN_Y_STEP = 28;
const LEFT_PIN_X = 30;
const RIGHT_PIN_X = BOARD_W - 76; // 364

const PIN_COLORS = {
  G: '#2c3e50',
  V: '#e74c3c',
  S: '#f0a500',
} as const;

const HIGHLIGHT_COLOR = '#f5cd47';

const LEFT_GPIOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;
const RIGHT_GPIOS = [16, 17, 18, 20, 21, 38, 39, 40, 41, 42, 47, 48] as const;

// ── Board parts (clickable) ──
interface BoardPart {
  key: string;
  name: string;
  emoji: string;
  description: string;
}

const BOARD_PARTS: BoardPart[] = [
  {
    key: 'usb',
    name: 'USB-C 포트',
    emoji: '🔌',
    description: 'PC와 연결하는 포트예요. 코드를 업로드하고, 시리얼 통신으로 데이터를 주고받으며, 전원도 공급해요. 하나로 세 가지 역할을 해요!',
  },
  {
    key: 'chip',
    name: 'ESP32-S3 칩',
    emoji: '🧠',
    description: 'ESP32의 뇌예요! WiFi와 블루투스 통신, 센서 데이터 처리를 모두 여기서 해요. N16R8은 16MB 플래시, 8MB RAM을 의미해요.',
  },
  {
    key: 'antenna',
    name: '안테나',
    emoji: '📡',
    description: 'WiFi와 블루투스 무선 통신을 위한 안테나예요. 이 안테나 덕분에 인터넷에 연결할 수 있어요.',
  },
  {
    key: 'leftPins',
    name: '좌측 핀 헤더',
    emoji: '📌',
    description: '센서를 연결하는 핀이에요. 왼쪽에는 15개의 핀이 있어요. G=접지, V=전원, S=신호 규칙을 기억하세요!',
  },
  {
    key: 'rightPins',
    name: '우측 핀 헤더',
    emoji: '📌',
    description: '오른쪽에도 12개의 핀이 있어요. 총 27개의 핀에 센서와 액추에이터를 연결할 수 있어요.',
  },
  {
    key: 'powerLed',
    name: '전원 LED',
    emoji: '💡',
    description: '전원이 켜지면 빛나는 LED예요. ESP32가 정상적으로 전원을 공급받고 있는지 알려줘요.',
  },
];

// ── Capability cards ──
const CAPABILITIES = [
  { emoji: '📶', title: 'WiFi 통신', subtitle: '인터넷 연결', body: '인터넷에 연결해서 데이터를 주고받을 수 있어요. 날씨 정보, 스마트폰 알림 등을 활용할 수 있어요.' },
  { emoji: '📱', title: '블루투스', subtitle: '무선 기기 연결', body: '스마트폰이나 다른 기기와 무선으로 연결할 수 있어요. 블루투스 리모컨, 무선 스피커 등을 만들 수 있어요.' },
  { emoji: '🌡️', title: '센서 데이터 읽기', subtitle: '다양한 센서', body: '온도, 습도, 거리, 빛, 가스 등 다양한 센서에서 데이터를 읽을 수 있어요.' },
  { emoji: '🔄', title: '모터 제어', subtitle: '움직이는 부품', body: '서보 모터, DC 모터를 회전시켜서 로봇 팔, 환기 팬 등을 만들 수 있어요.' },
  { emoji: '🖥️', title: '디스플레이 출력', subtitle: '화면 표시', body: 'OLED 화면에 글자와 그림을 표시할 수 있어요. 스마트 시계, 정보 보드 등을 만들 수 있어요.' },
  { emoji: '🏠', title: 'IoT 프로젝트', subtitle: '사물인터넷', body: '인터넷과 센서를 연결해서 스마트홈, 스마트팜 등 IoT 프로젝트를 만들 수 있어요.' },
] as const;

const QUIZ_PASS_SCORE = 100;

interface Stage1Props {
  onComplete: () => void;
}

export function Stage1Intro({ onComplete }: Stage1Props) {
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [quizPassed, setQuizPassed] = useState(false);

  const selectedPartData = selectedPart
    ? BOARD_PARTS.find((p) => p.key === selectedPart) ?? null
    : null;

  const isActive = (key: string) => selectedPart === key;

  function handleQuizComplete(score: number) {
    if (score >= QUIZ_PASS_SCORE) {
      setQuizPassed(true);
      onComplete();
    }
  }

  // ── Render left pin row ──
  function renderLeftPins() {
    return (
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedPart('leftPins')}>
        <rect
          x={24} y={66} width={58}
          height={LEFT_GPIOS.length * PIN_Y_STEP + 10}
          rx={4}
          fill={isActive('leftPins') ? 'rgba(245,205,71,0.12)' : 'transparent'}
          stroke={isActive('leftPins') ? HIGHLIGHT_COLOR : 'transparent'}
          strokeWidth={2} pointerEvents="none"
        />
        <text x={LEFT_PIN_X + 7} y={62} fill="#5a7a4a" fontSize={8} fontWeight={600} pointerEvents="none">G</text>
        <text x={LEFT_PIN_X + PIN_COL_STEP + 7} y={62} fill="#5a7a4a" fontSize={8} fontWeight={600} pointerEvents="none">V</text>
        <text x={LEFT_PIN_X + PIN_COL_STEP * 2 + 7} y={62} fill="#5a7a4a" fontSize={8} fontWeight={600} pointerEvents="none">S</text>
        {LEFT_GPIOS.map((gpio, i) => {
          const y = PIN_Y_START + i * PIN_Y_STEP;
          const isSda = gpio === 8;
          const isScl = gpio === 9;
          return (
            <g key={`left-${i}`}>
              <rect x={LEFT_PIN_X} y={y} width={PIN_SIZE} height={PIN_SIZE} rx={2} fill={PIN_COLORS.G} pointerEvents="none" />
              <rect x={LEFT_PIN_X + PIN_COL_STEP} y={y} width={PIN_SIZE} height={PIN_SIZE} rx={2} fill={PIN_COLORS.V} pointerEvents="none" />
              <rect x={LEFT_PIN_X + PIN_COL_STEP * 2} y={y} width={PIN_SIZE} height={PIN_SIZE} rx={2} fill={PIN_COLORS.S} pointerEvents="none" />
              <text x={26} y={y + 11} textAnchor="end"
                fill={isSda ? '#3dd68c' : isScl ? '#4a9eff' : '#e8eaf0'}
                fontSize={9} fontWeight={isSda || isScl ? 700 : 400} pointerEvents="none">{gpio}</text>
              {isSda && <text x={82} y={y + 11} textAnchor="start" fill="#3dd68c" fontSize={9} fontWeight={700} pointerEvents="none">SDA</text>}
              {isScl && <text x={82} y={y + 11} textAnchor="start" fill="#4a9eff" fontSize={9} fontWeight={700} pointerEvents="none">SCL</text>}
            </g>
          );
        })}
      </g>
    );
  }

  // ── Render right pin row ──
  function renderRightPins() {
    return (
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedPart('rightPins')}>
        <rect
          x={358} y={66} width={62}
          height={RIGHT_GPIOS.length * PIN_Y_STEP + 10}
          rx={4}
          fill={isActive('rightPins') ? 'rgba(245,205,71,0.12)' : 'transparent'}
          stroke={isActive('rightPins') ? HIGHLIGHT_COLOR : 'transparent'}
          strokeWidth={2} pointerEvents="none"
        />
        <text x={RIGHT_PIN_X + 7} y={62} fill="#5a7a4a" fontSize={8} fontWeight={600} pointerEvents="none">S</text>
        <text x={RIGHT_PIN_X + PIN_COL_STEP + 7} y={62} fill="#5a7a4a" fontSize={8} fontWeight={600} pointerEvents="none">V</text>
        <text x={RIGHT_PIN_X + PIN_COL_STEP * 2 + 7} y={62} fill="#5a7a4a" fontSize={8} fontWeight={600} pointerEvents="none">G</text>
        {RIGHT_GPIOS.map((gpio, i) => {
          const y = PIN_Y_START + i * PIN_Y_STEP;
          return (
            <g key={`right-${i}`}>
              <rect x={RIGHT_PIN_X} y={y} width={PIN_SIZE} height={PIN_SIZE} rx={2} fill={PIN_COLORS.S} pointerEvents="none" />
              <rect x={RIGHT_PIN_X + PIN_COL_STEP} y={y} width={PIN_SIZE} height={PIN_SIZE} rx={2} fill={PIN_COLORS.V} pointerEvents="none" />
              <rect x={RIGHT_PIN_X + PIN_COL_STEP * 2} y={y} width={PIN_SIZE} height={PIN_SIZE} rx={2} fill={PIN_COLORS.G} pointerEvents="none" />
              <text x={414} y={y + 11} textAnchor="start" fill="#e8eaf0" fontSize={9} pointerEvents="none">{gpio}</text>
            </g>
          );
        })}
      </g>
    );
  }

  return (
    <div className="stage">
      <h2 className="stage__title">
        <span>🔧</span>
        ESP32-S3-MOC 보드 소개
      </h2>
      <p className="stage__description">
        ESP32가 무엇인지, 보드의 각 부분이 어떤 역할을 하는지 알아봅시다!
      </p>

      {/* Section 1: Interactive Board Diagram */}
      <div className="card">
        <div className="card__header">
          <span className="card__emoji">🔧</span>
          <div>
            <div className="card__title">ESP32-S3-MOC 보드 구조</div>
            <div className="card__subtitle">각 부분을 클릭해 보세요!</div>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
          style={{ width: '100%', maxWidth: '440px', height: 'auto', display: 'block', margin: '0 auto' }}
        >
          <rect x={10} y={20} width={420} height={520} rx={12} fill="#0d4f1e" stroke="#063014" strokeWidth={2} />

          {/* USB-C port */}
          <g style={{ cursor: 'pointer' }} onClick={() => setSelectedPart('usb')}>
            <rect x={180} y={6} width={80} height={28} rx={4} fill="#7f8c8d"
              stroke={isActive('usb') ? HIGHLIGHT_COLOR : '#555'}
              strokeWidth={isActive('usb') ? 3 : 1} />
            <rect x={186} y={10} width={68} height={20} rx={3} fill="#3d4548" pointerEvents="none" />
            <text x={220} y={24} textAnchor="middle" fill="#6b7280" fontSize={8} pointerEvents="none">USB-C</text>
          </g>

          {/* Power LED */}
          <g style={{ cursor: 'pointer' }} onClick={() => setSelectedPart('powerLed')}>
            <circle cx={290} cy={48} r={6} fill="#3dd68c"
              stroke={isActive('powerLed') ? HIGHLIGHT_COLOR : '#27ae60'}
              strokeWidth={isActive('powerLed') ? 3 : 1} />
          </g>

          {/* Antenna */}
          <g style={{ cursor: 'pointer' }} onClick={() => setSelectedPart('antenna')}>
            <rect x={170} y={180} width={100} height={14} rx={2} fill="#c0c4c8"
              stroke={isActive('antenna') ? HIGHLIGHT_COLOR : '#8a8e92'}
              strokeWidth={isActive('antenna') ? 3 : 1} />
          </g>

          {/* ESP32-S3 chip */}
          <g style={{ cursor: 'pointer' }} onClick={() => setSelectedPart('chip')}>
            <rect x={130} y={200} width={180} height={170} rx={6} fill="#c0c4c8"
              stroke={isActive('chip') ? HIGHLIGHT_COLOR : '#8e9499'}
              strokeWidth={isActive('chip') ? 3 : 1.5} />
            <rect x={140} y={210} width={160} height={150} rx={3} fill="#8e9499" opacity={0.3} pointerEvents="none" />
            <text x={220} y={270} textAnchor="middle" fill="#2c3e50" fontSize={18} fontWeight={700} pointerEvents="none">ESP32-S3</text>
            <text x={220} y={292} textAnchor="middle" fill="#2c3e50" fontSize={14} pointerEvents="none">N16R8</text>
          </g>

          {renderLeftPins()}
          {renderRightPins()}

          <text x={220} y={520} textAnchor="middle" fill="#5a7a4a" fontSize={11} fontWeight={600} pointerEvents="none">ESP32-S3-MOC</text>
        </svg>

        {/* Selected part info */}
        {selectedPartData ? (
          <div className="info-box info-box--blue" style={{ marginTop: 16 }}>
            <div className="info-box__title">{selectedPartData.emoji} {selectedPartData.name}</div>
            {selectedPartData.description}
          </div>
        ) : (
          <div className="info-box info-box--blue" style={{ marginTop: 16 }}>
            <div className="info-box__title">👆 안내</div>
            보드의 각 부분을 클릭하면 설명이 나와요!
          </div>
        )}

        {/* GVS rule */}
        <div className="info-box info-box--blue" style={{ marginTop: 16 }}>
          <div className="info-box__title">📌 G-V-S 핀 규칙</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#2c3e50', color: '#fff', padding: '2px 10px', borderRadius: 4, fontSize: 13, fontWeight: 700 }}>G</span>
              <span style={{ color: '#b4b9c5', fontSize: 13 }}>GND (접지, 마이너스 극)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#e74c3c', color: '#fff', padding: '2px 10px', borderRadius: 4, fontSize: 13, fontWeight: 700 }}>V</span>
              <span style={{ color: '#b4b9c5', fontSize: 13 }}>VCC (전원, 플러스 극)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#f0a500', color: '#fff', padding: '2px 10px', borderRadius: 4, fontSize: 13, fontWeight: 700 }}>S</span>
              <span style={{ color: '#b4b9c5', fontSize: 13 }}>Signal (신호, 데이터 전송)</span>
            </div>
          </div>
          <p style={{ color: '#7d8390', fontSize: 13, marginTop: 10, marginBottom: 0, lineHeight: 1.6 }}>
            ESP32-S3-MOC 보드는 3핀 헤더(G-V-S) 방식입니다. 센서의 선 색깔을 보고 같은 색끼리 연결하세요!
          </p>
        </div>
      </div>

      {/* Section 2: Capability Cards */}
      <h3 style={{ color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: 700, margin: '32px 0 8px' }}>
        ✨ ESP32로 할 수 있는 일
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
        다양한 프로젝트를 만들 수 있어요!
      </p>
      <div className="grid grid--3">
        {CAPABILITIES.map((cap) => (
          <div key={cap.title} className="card card--clickable">
            <div className="card__header">
              <span className="card__emoji">{cap.emoji}</span>
              <div>
                <div className="card__title">{cap.title}</div>
                <div className="card__subtitle">{cap.subtitle}</div>
              </div>
            </div>
            <div className="card__body" style={{ fontSize: '0.85rem' }}>{cap.body}</div>
          </div>
        ))}
      </div>

      {/* Section 3: Mini Quiz */}
      <div style={{ marginTop: 40 }}>
        <div className="info-box info-box--yellow">
          <div className="info-box__title">💡 퀴즈 준비!</div>
          보드 구조와 기능을 다 살펴봤나요? 퀴즈를 풀고 다음 단계로 넘어가요!
        </div>
        <Quiz
          questions={QUIZ_STAGE1}
          title="ESP32 보드 퀴즈"
          selectCount={3}
          onComplete={handleQuizComplete}
        />
        {quizPassed && (
          <div className="info-box info-box--green" style={{ marginTop: 16 }}>
            <div className="info-box__title">🎉 스테이지 1 완료!</div>
            축하해요! ESP32-S3-MOC 보드에 대해 잘 알게 되었어요. 다음 단계로 진행해 보세요!
            <div style={{ marginTop: 12 }}>
              <button className="btn btn--success" onClick={onComplete}>다음 단계로 →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Stage1Intro;
