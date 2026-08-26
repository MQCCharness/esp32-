// ── Sensor & Actuator Data for Educational Program ──
// Shared across all stages (encyclopedia, wiring simulation, code upload sim)

export type PinTargetType = 'power' | 'ground' | 'signal' | 'i2c-sda' | 'i2c-scl' | 'echo';

export interface SensorPin {
  label: string;        // VCC, GND, DATA, TRIG, ECHO, SDA, SCL
  color: string;        // hex color for wire
  colorName: string;    // Korean color name
  targetGpio: number | null; // target GPIO number (null for VCC/GND which are bus pins)
  targetType: PinTargetType;
}

export interface SimulatedData {
  label: string;    // e.g. "온도", "습도", "거리"
  unit: string;     // e.g. "°C", "%", "cm"
  min: number;
  max: number;
  default: number;
  decimals: number;
}

export interface SensorInfo {
  key: string;
  emoji: string;
  name: string;
  subName?: string;
  type: 'sensor' | 'actuator';
  category: string;          // 측정/동작 분야
  measure: string;           // what it measures/does (short)
  description: string;       // Korean description for students
  realLifeExample: string;   // real-life use case
  pins: SensorPin[];
  pinType: string;           // Digital, ADC, I2C, PWM, RMT
  simulatedData?: SimulatedData;
}

// ── Wire color palette ──
export const WIRE_COLORS = {
  red:    { hex: '#e74c3c', name: '빨강' },
  black:  { hex: '#2c3e50', name: '검정' },
  green:  { hex: '#27ae60', name: '초록' },
  blue:   { hex: '#3498db', name: '파랑' },
  yellow: { hex: '#f1c40f', name: '노랑' },
  orange: { hex: '#e67e22', name: '주황' },
  white:  { hex: '#ecf0f1', name: '흰색' },
  purple: { hex: '#9b59b6', name: '보라' },
} as const;

// ── Sensor definitions ──
export const SENSORS: SensorInfo[] = [
  {
    key: 'dht11',
    emoji: '🌡️',
    name: '온습도 센서',
    type: 'sensor',
    category: '온습도',
    measure: '온도와 습도',
    description: '주변 공기의 온도와 습도를 측정하는 센서예요. 온도는 0~50°C, 습도는 20~90%까지 측정할 수 있어요.',
    realLifeExample: '스마트 온실: 온도가 너무 올라가면 환기 팬을 켜고, 습도가 낮아지면 분무기를 작동해요.',
    pins: [
      { label: 'VCC', color: WIRE_COLORS.red.hex, colorName: WIRE_COLORS.red.name, targetGpio: null, targetType: 'power' },
      { label: 'DATA', color: WIRE_COLORS.yellow.hex, colorName: WIRE_COLORS.yellow.name, targetGpio: 4, targetType: 'signal' },
      { label: 'GND', color: WIRE_COLORS.black.hex, colorName: WIRE_COLORS.black.name, targetGpio: null, targetType: 'ground' },
    ],
    pinType: 'Digital',
    simulatedData: { label: '온도', unit: '°C', min: 20, max: 30, default: 25.3, decimals: 1 },
  },
  {
    key: 'ultrasonic',
    emoji: '📡',
    name: '초음파 거리 센서',
    type: 'sensor',
    category: '거리',
    measure: '물체까지의 거리',
    description: '초음파를 쏘아서 물체에 부딪히고 돌아오는 시간으로 거리를 재는 센서예요. 2cm~400cm까지 측정할 수 있어요.',
    realLifeExample: '자동차 후방 센서: 차 뒤에 장애물이 가까워지면 "삐삐삐~" 소리로 운전자에게 알려줘요.',
    pins: [
      { label: 'VCC', color: WIRE_COLORS.red.hex, colorName: WIRE_COLORS.red.name, targetGpio: null, targetType: 'power' },
      { label: 'TRIG', color: WIRE_COLORS.yellow.hex, colorName: WIRE_COLORS.yellow.name, targetGpio: 5, targetType: 'signal' },
      { label: 'ECHO', color: WIRE_COLORS.orange.hex, colorName: WIRE_COLORS.orange.name, targetGpio: 18, targetType: 'echo' },
      { label: 'GND', color: WIRE_COLORS.black.hex, colorName: WIRE_COLORS.black.name, targetGpio: null, targetType: 'ground' },
    ],
    pinType: 'Digital',
    simulatedData: { label: '거리', unit: 'cm', min: 5, max: 200, default: 15.2, decimals: 1 },
  },
  {
    key: 'cds',
    emoji: '☀️',
    name: '조도 센서',
    type: 'sensor',
    category: '조도',
    measure: '빛의 밝기',
    description: '주변이 얼마나 밝은지 측정하는 센서예요. 빛이 많으면 저항이 작아지고, 어두우면 저항이 커져요.',
    realLifeExample: '자동 조명: 해가 지면 자동으로 가로등이 켜지고, 해가 뜨면 꺼져요.',
    pins: [
      { label: 'VCC', color: WIRE_COLORS.red.hex, colorName: WIRE_COLORS.red.name, targetGpio: null, targetType: 'power' },
      { label: 'SIG', color: WIRE_COLORS.yellow.hex, colorName: WIRE_COLORS.yellow.name, targetGpio: 7, targetType: 'signal' },
      { label: 'GND', color: WIRE_COLORS.black.hex, colorName: WIRE_COLORS.black.name, targetGpio: null, targetType: 'ground' },
    ],
    pinType: 'ADC',
    simulatedData: { label: '밝기', unit: '%', min: 0, max: 100, default: 50, decimals: 0 },
  },
  {
    key: 'soil',
    emoji: '🌱',
    name: '토양 수분 센서',
    type: 'sensor',
    category: '수분',
    measure: '흙의 수분량',
    description: '흙이 얼마나 젖어 있는지 측정하는 센서예요. 흙에 꽂아서 사용하고, 수분이 많으면 값이 올라가요.',
    realLifeExample: '스마트 화분: 흙이 마르면 자동으로 물을 줘서 식물이 시들지 않게 해줘요.',
    pins: [
      { label: 'VCC', color: WIRE_COLORS.red.hex, colorName: WIRE_COLORS.red.name, targetGpio: null, targetType: 'power' },
      { label: 'SIG', color: WIRE_COLORS.yellow.hex, colorName: WIRE_COLORS.yellow.name, targetGpio: 2, targetType: 'signal' },
      { label: 'GND', color: WIRE_COLORS.black.hex, colorName: WIRE_COLORS.black.name, targetGpio: null, targetType: 'ground' },
    ],
    pinType: 'ADC',
    simulatedData: { label: '수분', unit: '%', min: 0, max: 100, default: 36, decimals: 0 },
  },
  {
    key: 'gas',
    emoji: '🔥',
    name: '가스 센서',
    type: 'sensor',
    category: '가스',
    measure: '가스 농도',
    description: '주변에 가스(연기, LPG, 메탄 등)가 얼마나 있는지 측정하는 센서예요. 위험한 가스가 감지되면 경보를 울릴 수 있어요.',
    realLifeExample: '가스 누출 경보기: 주방에서 가스가 새면 "삐~!" 하고 알람을 울려서 대피를 유도해요.',
    pins: [
      { label: 'VCC', color: WIRE_COLORS.red.hex, colorName: WIRE_COLORS.red.name, targetGpio: null, targetType: 'power' },
      { label: 'SIG', color: WIRE_COLORS.yellow.hex, colorName: WIRE_COLORS.yellow.name, targetGpio: 3, targetType: 'signal' },
      { label: 'GND', color: WIRE_COLORS.black.hex, colorName: WIRE_COLORS.black.name, targetGpio: null, targetType: 'ground' },
    ],
    pinType: 'ADC',
    simulatedData: { label: '가스 농도', unit: '%', min: 0, max: 100, default: 19, decimals: 0 },
  },
  {
    key: 'ds18b20',
    emoji: '❄️',
    name: '방수 온도 센서',
    type: 'sensor',
    category: '온도',
    measure: '정밀한 온도',
    description: '온습도 센서보다 더 정밀하게 온도를 측정하는 센서예요. -55°C~125°C까지 넓은 범위를 측정할 수 있고, 방수 처리되어 물속에서도 사용할 수 있어요.',
    realLifeExample: '수족관 온도 조절: 물 온도를 항상 25°C로 유지해서 열대어가 건강하게 살도록 해줘요.',
    pins: [
      { label: 'VCC', color: WIRE_COLORS.red.hex, colorName: WIRE_COLORS.red.name, targetGpio: null, targetType: 'power' },
      { label: 'DATA', color: WIRE_COLORS.yellow.hex, colorName: WIRE_COLORS.yellow.name, targetGpio: 15, targetType: 'signal' },
      { label: 'GND', color: WIRE_COLORS.black.hex, colorName: WIRE_COLORS.black.name, targetGpio: null, targetType: 'ground' },
    ],
    pinType: 'Digital (1-Wire)',
    simulatedData: { label: '온도', unit: '°C', min: 15, max: 35, default: 23.5, decimals: 1 },
  },
  {
    key: 'potentiometer',
    emoji: '🎛️',
    name: '가변 저항',
    type: 'sensor',
    category: '각도',
    measure: '회전 각도',
    description: '손잡이를 돌려서 저항값을 바꿀 수 있는 부품이에요. 돌리는 각도에 따라 값이 변해서, 볼륨이나 다이얼로 사용할 수 있어요.',
    realLifeExample: '오디오 볼륨: 손잡이를 돌리면 소리가 커지거나 작아져요. 라디오 주파수 다이얼도 같은 원리예요.',
    pins: [
      { label: 'VCC', color: WIRE_COLORS.red.hex, colorName: WIRE_COLORS.red.name, targetGpio: null, targetType: 'power' },
      { label: 'SIG', color: WIRE_COLORS.yellow.hex, colorName: WIRE_COLORS.yellow.name, targetGpio: 6, targetType: 'signal' },
      { label: 'GND', color: WIRE_COLORS.black.hex, colorName: WIRE_COLORS.black.name, targetGpio: null, targetType: 'ground' },
    ],
    pinType: 'ADC',
    simulatedData: { label: '각도', unit: '°', min: 0, max: 270, default: 135, decimals: 0 },
  },
  {
    key: 'tilt',
    emoji: '📐',
    name: '틸트 센서',
    type: 'sensor',
    category: '기울기',
    measure: '기울어짐 여부',
    description: '기울어짐을 감지하는 센서예요. 안에 작은 금속 구슬이 있어서, 센서가 기울어지면 구슬이 굴러서 전기가 통하거나 끊겨요. 단순한 ON/OFF 신호를 보내요.',
    realLifeExample: '자전도 센서: 전자제품이 넘어지면 자동으로 전원을 차단해서 화재를 예방해요. 파친코 기계에서 동전이 흔들리는 것도 같은 원리예요!',
    pins: [
      { label: 'VCC', color: WIRE_COLORS.red.hex, colorName: WIRE_COLORS.red.name, targetGpio: null, targetType: 'power' },
      { label: 'SIG', color: WIRE_COLORS.yellow.hex, colorName: WIRE_COLORS.yellow.name, targetGpio: 10, targetType: 'signal' },
      { label: 'GND', color: WIRE_COLORS.black.hex, colorName: WIRE_COLORS.black.name, targetGpio: null, targetType: 'ground' },
    ],
    pinType: 'Digital',
    simulatedData: { label: '기울기', unit: '', min: 0, max: 1, default: 1, decimals: 0 },
  },
  {
    key: 'button',
    emoji: '🔘',
    name: '버튼',
    type: 'sensor',
    category: '입력',
    measure: '누름 여부',
    description: '손으로 누르면 켜지고, 떼면 꺼지는 가장 기본적인 입력 부품이에요. 전자제품의 전원 버튼, 리모컨 버튼과 같은 원리예요.',
    realLifeExample: '엘리베이터 버튼: 누르면 해당 층으로 이동해요. 게임 컨트롤러의 A, B 버튼도 같은 원리예요!',
    pins: [
      { label: 'VCC', color: WIRE_COLORS.red.hex, colorName: WIRE_COLORS.red.name, targetGpio: null, targetType: 'power' },
      { label: 'SIG', color: WIRE_COLORS.yellow.hex, colorName: WIRE_COLORS.yellow.name, targetGpio: 11, targetType: 'signal' },
      { label: 'GND', color: WIRE_COLORS.black.hex, colorName: WIRE_COLORS.black.name, targetGpio: null, targetType: 'ground' },
    ],
    pinType: 'Digital',
    simulatedData: { label: '버튼', unit: '', min: 0, max: 1, default: 1, decimals: 0 },
  },
  {
    key: 'touch',
    emoji: '👆',
    name: '터치 센서',
    type: 'sensor',
    category: '터치',
    measure: '터치 여부',
    description: '손가락이 가까이만 가도 터치를 감지하는 센서예요. 물리적으로 누를 필요 없이 살짝만 대면 돼요. 정전용량 변화로 터치를 감지해요.',
    realLifeExample: '스마트폰 화면: 손가락으로 살짝만 터치해도 반응해요. 터치 무드등, 터치 도어벨 등에 사용돼요!',
    pins: [
      { label: 'VCC', color: WIRE_COLORS.red.hex, colorName: WIRE_COLORS.red.name, targetGpio: null, targetType: 'power' },
      { label: 'SIG', color: WIRE_COLORS.yellow.hex, colorName: WIRE_COLORS.yellow.name, targetGpio: 16, targetType: 'signal' },
      { label: 'GND', color: WIRE_COLORS.black.hex, colorName: WIRE_COLORS.black.name, targetGpio: null, targetType: 'ground' },
    ],
    pinType: 'Digital',
    simulatedData: { label: '터치', unit: '', min: 0, max: 1, default: 1, decimals: 0 },
  },
];

export const ACTUATORS: SensorInfo[] = [
  {
    key: 'buzzer',
    emoji: '🔊',
    name: '부저',
    type: 'actuator',
    category: '소리',
    measure: '소리 출력',
    description: '전기를 주면 "삑~" 소리를 내는 부품이에요. 알람이나 경고음을 낼 때 사용해요.',
    realLifeExample: '전자레인지 알람: 음식이 다 되면 "삑삑삑~" 소리로 알려줘요.',
    pins: [
      { label: 'VCC', color: WIRE_COLORS.red.hex, colorName: WIRE_COLORS.red.name, targetGpio: null, targetType: 'power' },
      { label: 'SIG', color: WIRE_COLORS.yellow.hex, colorName: WIRE_COLORS.yellow.name, targetGpio: 12, targetType: 'signal' },
      { label: 'GND', color: WIRE_COLORS.black.hex, colorName: WIRE_COLORS.black.name, targetGpio: null, targetType: 'ground' },
    ],
    pinType: 'Digital/PWM',
  },
  {
    key: 'servo',
    emoji: '🔄',
    name: '서보 모터',
    type: 'actuator',
    category: '회전',
    measure: '각도 제어 (0~180°)',
    description: '원하는 각도로 정확하게 돌릴 수 있는 모터예요. 0도부터 180도까지 회전할 수 있어요.',
    realLifeExample: '로봇 팔: 모터를 여러 개 사용해서 팔을 움직이고 물건을 집을 수 있어요.',
    pins: [
      { label: 'VCC', color: WIRE_COLORS.red.hex, colorName: WIRE_COLORS.red.name, targetGpio: null, targetType: 'power' },
      { label: 'SIG', color: WIRE_COLORS.yellow.hex, colorName: WIRE_COLORS.yellow.name, targetGpio: 14, targetType: 'signal' },
      { label: 'GND', color: WIRE_COLORS.black.hex, colorName: WIRE_COLORS.black.name, targetGpio: null, targetType: 'ground' },
    ],
    pinType: 'PWM',
  },
  {
    key: 'oled',
    emoji: '🖥️',
    name: 'OLED 디스플레이',
    type: 'actuator',
    category: '디스플레이',
    measure: '글자/그림 표시',
    description: '작은 화면에 글자나 그림을 보여주는 디스플레이예요. I2C 방식으로 통신해서 4개의 선만 연결하면 돼요.',
    realLifeExample: '스마트 시계: 시간, 날씨, 걸음 수를 작은 화면에 보여줘요.',
    pins: [
      { label: 'VCC', color: WIRE_COLORS.red.hex, colorName: WIRE_COLORS.red.name, targetGpio: null, targetType: 'power' },
      { label: 'GND', color: WIRE_COLORS.black.hex, colorName: WIRE_COLORS.black.name, targetGpio: null, targetType: 'ground' },
      { label: 'SDA', color: WIRE_COLORS.green.hex, colorName: WIRE_COLORS.green.name, targetGpio: 8, targetType: 'i2c-sda' },
      { label: 'SCL', color: WIRE_COLORS.blue.hex, colorName: WIRE_COLORS.blue.name, targetGpio: 9, targetType: 'i2c-scl' },
    ],
    pinType: 'I2C',
  },
  {
    key: 'neopixel',
    emoji: '🌈',
    name: 'NeoPixel LED',
    type: 'actuator',
    category: '조명',
    measure: '컬러 LED 제어',
    description: '빨강, 초록, 파랑을 섞어서 모든 색을 만들 수 있는 LED예요. 하나의 핀으로 여러 개의 LED를 제어할 수 있어요.',
    realLifeExample: '스마트 무드등: 스마트폰에서 색깔과 밝기를 바꿀 수 있는 조명.',
    pins: [
      { label: 'VCC', color: WIRE_COLORS.red.hex, colorName: WIRE_COLORS.red.name, targetGpio: null, targetType: 'power' },
      { label: 'DIN', color: WIRE_COLORS.yellow.hex, colorName: WIRE_COLORS.yellow.name, targetGpio: 13, targetType: 'signal' },
      { label: 'GND', color: WIRE_COLORS.black.hex, colorName: WIRE_COLORS.black.name, targetGpio: null, targetType: 'ground' },
    ],
    pinType: 'RMT',
  },
  {
    key: 'dcmotor',
    emoji: '💨',
    name: 'DC 모터',
    type: 'actuator',
    category: '회전',
    measure: '모터 ON/OFF',
    description: '전기를 주면 빙글빙글 돌아가는 일반적인 모터예요. 바퀴를 굴리거나 다양한 용도로 사용할 수 있어요. 모터 드라이버가 필요해요.',
    realLifeExample: '스마트 카: 모터를 사용해서 바퀴를 굴려서 RC카를 만들 수 있어요.',
    pins: [
      { label: 'VCC', color: WIRE_COLORS.red.hex, colorName: WIRE_COLORS.red.name, targetGpio: null, targetType: 'power' },
      { label: 'SIG', color: WIRE_COLORS.yellow.hex, colorName: WIRE_COLORS.yellow.name, targetGpio: 1, targetType: 'signal' },
      { label: 'GND', color: WIRE_COLORS.black.hex, colorName: WIRE_COLORS.black.name, targetGpio: null, targetType: 'ground' },
    ],
    pinType: 'Digital',
  },
  {
    key: 'fanmotor',
    emoji: '🌀',
    name: '팬모터',
    type: 'actuator',
    category: '회전',
    measure: '팬 회전 ON/OFF',
    description: '전기를 주면 팬이 돌아가서 바람을 일으키는 모터예요. L9110 모터 드라이버로 제어하며, 환기나 냉각에 사용해요.',
    realLifeExample: '스마트 환기 시스템: 온도가 높아지면 자동으로 팬이 돌아가서 환기해요.',
    pins: [
      { label: 'VCC', color: WIRE_COLORS.red.hex, colorName: WIRE_COLORS.red.name, targetGpio: null, targetType: 'power' },
      { label: 'SIG', color: WIRE_COLORS.yellow.hex, colorName: WIRE_COLORS.yellow.name, targetGpio: 17, targetType: 'signal' },
      { label: 'GND', color: WIRE_COLORS.black.hex, colorName: WIRE_COLORS.black.name, targetGpio: null, targetType: 'ground' },
    ],
    pinType: 'Digital',
  },
];

export const ALL_COMPONENTS: SensorInfo[] = [...SENSORS, ...ACTUATORS];

export function getSensorByKey(key: string): SensorInfo | undefined {
  return ALL_COMPONENTS.find((s) => s.key === key);
}
