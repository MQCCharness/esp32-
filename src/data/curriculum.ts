// ── Curriculum Structure ──
// Defines the 6-stage learning path

export interface CurriculumStage {
  id: number;
  key: string;
  title: string;
  emoji: string;
  description: string;
  estimatedMinutes: number;
  miniQuizThreshold: number; // % to pass (0-100)
}

export const CURRICULUM: CurriculumStage[] = [
  {
    id: 1,
    key: 'esp32-intro',
    title: 'ESP32-S3-MOC 보드 소개',
    emoji: '🔧',
    description: 'ESP32가 무엇인지, 보드의 각 부분이 어떤 역할을 하는지 알아봐요.',
    estimatedMinutes: 12,
    miniQuizThreshold: 70,
  },
  {
    id: 2,
    key: 'sensor-guide',
    title: '센서와 액추에이터 백과사전',
    emoji: '📚',
    description: '다양한 센서와 액추에이터가 무엇을 하는지, 어디에 쓰이는지 알아봐요.',
    estimatedMinutes: 18,
    miniQuizThreshold: 70,
  },
  {
    id: 3,
    key: 'wiring-sim',
    title: '배선 시뮬레이션',
    emoji: '🔌',
    description: '드래그 앤 드롭으로 센서를 ESP32 보드에 직접 연결해 봐요!',
    estimatedMinutes: 25,
    miniQuizThreshold: 70,
  },
  {
    id: 4,
    key: 'hardware-guide',
    title: '실제 하드웨어 연결 가이드',
    emoji: '📦',
    description: '시뮬레이션을 완료했다면, 이제 실제 ESP32-S3-MOC 키트로 실습해 봐요!',
    estimatedMinutes: 8,
    miniQuizThreshold: 0,
  },
  {
    id: 5,
    key: 'final-quiz',
    title: '종합 퀴즈',
    emoji: '🏆',
    description: '지금까지 배운 내용을 총정리하는 퀴즈예요. 70점 이상 합격!',
    estimatedMinutes: 12,
    miniQuizThreshold: 70,
  },
  {
    id: 6,
    key: 'code-upload',
    title: '코드 업로드 시뮬레이션',
    emoji: '💻',
    description: 'PC에 코드를 업로드해서 ESP32를 작동시키는 과정을 시뮬레이션해 봐요.',
    estimatedMinutes: 18,
    miniQuizThreshold: 100,
  },
];

// ── Wiring simulation missions (Stage 3) ──
export interface WiringMission {
  id: number;
  title: string;
  description: string;
  sensorKey: string;
  hint: string;
}

export const WIRING_MISSIONS: WiringMission[] = [
  {
    id: 1,
    title: 'DHT11 온습도 센서 연결',
    description: 'DHT11 센서의 3개 선을 ESP32 보드에 연결해 봐요. VCC는 전원, GND는 접지, DATA는 GPIO 4번이에요.',
    sensorKey: 'dht11',
    hint: '빨간 선 → VCC, 검정 선 → GND, 노란 선 → GPIO 4',
  },
  {
    id: 2,
    title: '초음파 거리 센서 연결',
    description: 'HC-SR04 초음파 센서의 4개 선을 연결해 봐요. TRIG는 GPIO 5, ECHO는 GPIO 18이에요.',
    sensorKey: 'ultrasonic',
    hint: '빨간 선 → VCC, 검정 선 → GND, 노란 선(TRIG) → GPIO 5, 주황 선(ECHO) → GPIO 18',
  },
  {
    id: 3,
    title: 'OLED 디스플레이 연결 (I2C)',
    description: 'OLED 화면을 I2C 방식으로 연결해 봐요. SDA는 GPIO 8, SCL은 GPIO 9번이에요. 다른 센서들과 핀을 공유해요!',
    sensorKey: 'oled',
    hint: '빨간 선 → VCC, 검정 선 → GND, 초록 선(SDA) → GPIO 8, 파랑 선(SCL) → GPIO 9',
  },
  {
    id: 4,
    title: '복합 미션: DHT11 + OLED 동시 연결',
    description: 'DHT11 센서와 OLED 화면을 동시에 연결해 봐요. I2C 핀(SDA, SCL)은 OLED만 사용해요.',
    sensorKey: 'dht11+oled',
    hint: 'DHT11: VCC, GND, GPIO 4 | OLED: VCC, GND, SDA=GPIO 8, SCL=GPIO 9',
  },
];
