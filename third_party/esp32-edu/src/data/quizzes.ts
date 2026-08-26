// ── Quiz Questions for Each Stage ──
// Each pool has 2x+ questions; Quiz component randomly selects a subset

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QUIZ_SELECT_COUNT: Readonly<Record<number, number>> = {
  1: 3,
  2: 5,
  3: 3,
  5: 10,
  6: 3,
};

// Stage 1: ESP32 Intro Quiz (8 questions in pool, select 3)
export const QUIZ_STAGE1: QuizQuestion[] = [
  {
    id: 1,
    question: 'ESP32-S3-MOC 보드에서 USB-C 포트의 역할은 무엇인가요?',
    options: [
      '전원만 공급하는 단자',
      '코드 업로드, 시리얼 통신, 전원 공급을 모두 하는 단자',
      '센서를 연결하는 단자',
      'WiFi 안테나 연결 단자',
    ],
    correctIndex: 1,
    explanation: 'USB-C 포트는 PC와 연결해서 코드를 업로드하고, 시리얼 통신으로 데이터를 주고받으며, 동시에 전원도 공급해요. 하나로 세 가지 역할을 해요!',
  },
  {
    id: 2,
    question: 'ESP32 보드의 핀 헤더에서 G, V, S는 각각 무엇을 의미하나요?',
    options: [
      'G=게임, V=비디오, S=소리',
      'G=GND(접지), V=VCC(전원), S=Signal(신호)',
      'G=녹색, V=보라색, S=은색',
      'G=GPIO, V=전압, S=스위치',
    ],
    correctIndex: 1,
    explanation: 'G는 GND(접지, 마이너스 극), V는 VCC(전원, 플러스 극), S는 Signal(신호, 데이터)을 의미해요. 센서를 연결할 때 이 규칙을 꼭 지켜야 해요!',
  },
  {
    id: 3,
    question: 'ESP32-S3 칩이 할 수 있는 일이 아닌 것은?',
    options: [
      'WiFi 무선 통신',
      '블루투스 통신',
      '센서 데이터 처리',
      '직접 전기 발생',
    ],
    correctIndex: 3,
    explanation: 'ESP32-S3는 WiFi와 블루투스 통신, 센서 데이터 처리를 할 수 있지만, 전기를 직접 발생시킬 수는 없어요. 전기는 USB-C나 배터리에서 공급받아요.',
  },
  {
    id: 4,
    question: 'ESP32-S3-MOC 보드의 안테나 역할은 무엇인가요?',
    options: [
      '전파를 잡아서 라디오를 듣는 것',
      'WiFi와 블루투스 무선 통신을 위한 것',
      '열을 발산하는 것',
      '전원을 안정화하는 것',
    ],
    correctIndex: 1,
    explanation: '안테나는 WiFi와 블루투스 무선 통신을 위해 필요해요. 이 안테나 덕분에 ESP32가 인터넷에 연결되고 스마트폰과 통신할 수 있어요.',
  },
  {
    id: 5,
    question: 'ESP32-S3 N16R8에서 "N16"이 의미하는 것은?',
    options: [
      '16개의 GPIO 핀',
      '16MB 플래시 메모리',
      '16비트 프로세서',
      '16V 전압',
    ],
    correctIndex: 1,
    explanation: 'N16은 16MB 플래시 메모리를 의미해요. R8은 8MB RAM(램)이에요. 숫자가 클수록 더 많은 코드와 데이터를 저장할 수 있어요.',
  },
  {
    id: 6,
    question: 'ESP32 보드에서 전원 LED가 켜져 있으면 무엇을 의미하나요?',
    options: [
      '코드가 업로드 중인 것',
      'WiFi가 연결된 것',
      '보드에 전원이 정상적으로 공급되고 있는 것',
      '센서가 데이터를 보내고 있는 것',
    ],
    correctIndex: 2,
    explanation: '전원 LED가 켜져 있으면 ESP32 보드가 정상적으로 전원을 공급받고 있다는 뜻이에요. LED가 안 켜지면 전원 연결을 확인해야 해요!',
  },
  {
    id: 7,
    question: 'ESP32-S3-MOC 보드에 총 몇 개의 GPIO 핀이 있나요?',
    options: [
      '15개',
      '27개',
      '12개',
      '40개',
    ],
    correctIndex: 1,
    explanation: '좌측에 15개, 우측에 12개의 GPIO 핀이 있어서 총 27개예요. 각 핀에는 G-V-S 3개씩 있어서 다양한 센서를 연결할 수 있어요.',
  },
  {
    id: 8,
    question: 'ESP32를 활용한 IoT 프로젝트로 가장 적절한 것은?',
    options: [
      '전자레인지로 음식 데우기',
      '스마트 화분: 흙이 마르면 자동으로 물 주기',
      '텔레비전 방송 송출하기',
      '자동차 타이어 교체하기',
    ],
    correctIndex: 1,
    explanation: 'ESP32는 센서(수분 측정)와 액추에이터(물 펌프)를 제어하고 WiFi로 인터넷에 연결할 수 있어서, 스마트 화분 같은 IoT 프로젝트에 딱이에요!',
  },
];

// Stage 2: Sensor Guide Quiz (10 questions in pool, select 5)
export const QUIZ_STAGE2: QuizQuestion[] = [
  {
    id: 1,
    question: 'DHT11 센서는 무엇을 측정하나요?',
    options: [
      '거리와 속도',
      '온도와 습도',
      '빛의 밝기와 색상',
      '가스와 연기',
    ],
    correctIndex: 1,
    explanation: 'DHT11은 온도와 습도를 동시에 측정하는 센서예요. 온도는 0~50°C, 습도는 20~90% 범위를 측정할 수 있어요.',
  },
  {
    id: 2,
    question: '초음파 센서(HC-SR04)가 거리를 재는 원리는 무엇인가요?',
    options: [
      '레이저로 물체를 쏴서 측정',
      '초음파가 물체에 부딪히고 돌아오는 시간으로 측정',
      '적외선으로 물체의 열을 측정',
      '카메라로 물체의 크기를 측정',
    ],
    correctIndex: 1,
    explanation: '초음파 센서는 초음파를 쏘아서 물체에 부딪히고 돌아오는 시간으로 거리를 계산해요. 박쥐가 물체를 피하는 원리와 같아요!',
  },
  {
    id: 3,
    question: 'OLED 디스플레이는 몇 개의 선으로 연결되나요? (I2C 방식)',
    options: [
      '2개 (VCC, GND)',
      '3개 (VCC, GND, SIG)',
      '4개 (VCC, GND, SDA, SCL)',
      '6개 (VCC, GND, R, G, B, SIG)',
    ],
    correctIndex: 2,
    explanation: 'OLED는 I2C 방식을 사용해서 4개의 선(VCC, GND, SDA, SCL)으로 연결해요. SDA는 데이터, SCL은 클럭 신호를 전달해요.',
  },
  {
    id: 4,
    question: '다음 중 액추에이터(행동하는 부품)는 무엇인가요?',
    options: [
      'DHT11 (온습도 센서)',
      '초음파 센서',
      '서보 모터',
      'CDS (조도 센서)',
    ],
    correctIndex: 2,
    explanation: '서보 모터는 전기를 받아서 직접 움직이는 액추에이터예요. 센서는 데이터를 "읽는" 부품이고, 액추에이터는 "움직이는" 부품이에요.',
  },
  {
    id: 5,
    question: '토양 수분 센서의 실생활 활용 예로 가장 적절한 것은?',
    options: [
      '자동문 열기/닫기',
      '스마트 화분: 흙이 마르면 자동으로 물 주기',
      '가로등 자동 켜기/끄기',
      '비행기 고도 측정',
    ],
    correctIndex: 1,
    explanation: '토양 수분 센서는 흙의 수분량을 측정해서, 흙이 마르면 자동으로 물을 주는 스마트 화분에 사용할 수 있어요. 식물이 시들지 않게 도와줘요!',
  },
  {
    id: 6,
    question: '가변 저항(포텐셔미터)은 무엇을 측정하나요?',
    options: [
      '온도 변화',
      '회전 각도',
      '기압 변화',
      '소리 크기',
    ],
    correctIndex: 1,
    explanation: '가변 저항은 손잡이를 돌리는 각도에 따라 저항값이 변해요. 이 각도를 ESP32가 읽어서 볼륨이나 다이얼로 사용할 수 있어요. 오디오 볼륨 조절과 같은 원리예요!',
  },
  {
    id: 7,
    question: 'CDS 조도 센서는 무엇을 측정하나요?',
    options: [
      '공기 중 먼지량',
      '주변의 밝기',
      '물의 투명도',
      '소음 크기',
    ],
    correctIndex: 1,
    explanation: 'CDS 조도 센서는 주변이 얼마나 밝은지를 측정해요. 빛이 많으면 저항이 작아지고, 어두우면 저항이 커져요. 자동 조명, 가로등에 사용돼요!',
  },
  {
    id: 8,
    question: '서보 모터(SG90)의 회전 범위는 어느 정도인가요?',
    options: [
      '0도부터 360도까지',
      '0도부터 180도까지',
      '0도부터 90도까지',
      '360도 연속 회전',
    ],
    correctIndex: 1,
    explanation: '서보 모터 SG90은 0도부터 180도까지 정밀하게 회전할 수 있어요. 원하는 각도로 정확히 돌릴 수 있어서 로봇 팔이나 RC카 조향에 사용돼요!',
  },
  {
    id: 9,
    question: 'NeoPixel(LED)의 가장 큰 특징은 무엇인가요?',
    options: [
      '전원 없이 빛남',
      '하나의 핀으로 여러 개의 컬러 LED를 제어할 수 있음',
      '열만 발생하고 빛은 없음',
      'WiFi로만 제어 가능',
    ],
    correctIndex: 1,
    explanation: 'NeoPixel은 하나의 데이터 핀으로 여러 개의 LED를 연쇄적으로 제어할 수 있어요. 각 LED마다 색상을 다르게 설정할 수 있어서 화려한 조명 효과를 낼 수 있어요!',
  },
  {
    id: 10,
    question: '가스 센서(MQ-2)가 감지할 수 있는 것은?',
    options: [
      '미세먼지 농도',
      'LPG, 메탄, 연기 등 가스',
      '이산화탄소 농도',
      '방사선',
    ],
    correctIndex: 1,
    explanation: 'MQ-2 가스 센서는 LPG, 메탄, 프로판, 연기 등을 감지할 수 있어요. 주방 가스 누출 경보기나 화재 경보 시스템에 사용돼요!',
  },
  {
    id: 11,
    question: '틸트 센서(SW-520D)는 무엇을 감지하나요?',
    options: [
      '온도 변화',
      '기울어짐 여부',
      '빛의 밝기',
      '소리 크기',
    ],
    correctIndex: 1,
    explanation: '틸트 센서는 안에 작은 금속 구슬이 있어서, 센서가 기울어지면 구슬이 굴러서 전기가 통하거나 끊겨요. 이렇게 기울어짐을 ON/OFF 신호로 감지해요!',
  },
  {
    id: 12,
    question: '버튼과 터치 센서의 가장 큰 차이는?',
    options: [
      '버튼은 전원이 필요 없다',
      '터치 센서는 물리적으로 누를 필요 없이 손가락 접촉만으로 감지한다',
      '터치 센서는 WiFi로만 작동한다',
      '버튼은 아날로그 신호를 보낸다',
    ],
    correctIndex: 1,
    explanation: '버튼은 손으로 직접 눌러야 하지만, 터치 센서는 손가락이 가까이만 가도 정전용량 변화로 감지해요. 스마트폰 화면 터치와 같은 원리예요!',
  },
  {
    id: 13,
    question: '터치 센서(TTP223B)가 터치를 감지하는 원리는?',
    options: [
      '온도 변화로 감지',
      '압력으로 감지',
      '정전용량 변화로 감지',
      '적외선으로 감지',
    ],
    correctIndex: 2,
    explanation: '터치 센서는 정전용량(capacitance) 원리를 사용해요. 사람의 손가락이 가까이 오면 정전용량이 변하고, 이 변화를 감지해서 터치를 인식해요!',
  },
];

// Stage 3: Wiring Sim Quiz (6 questions in pool, select 3)
export const QUIZ_STAGE3: QuizQuestion[] = [
  {
    id: 1,
    question: 'DHT11 센서의 DATA 선은 몇 번 GPIO에 연결해야 하나요?',
    options: ['GPIO 4', 'GPIO 7', 'GPIO 8', 'GPIO 12'],
    correctIndex: 0,
    explanation: 'DHT11의 DATA 선은 GPIO 4번에 연결해요. 이 핀으로 온도와 습도 데이터가 ESP32로 전달돼요.',
  },
  {
    id: 2,
    question: 'OLED와 다른 I2C 센서를 동시에 사용할 수 있는 이유는?',
    options: [
      '핀이 충분히 많아서',
      'I2C 기기마다 주소가 달라서 같은 핀을 공유할 수 있기 때문',
      'OLED는 전원만 있어도 작동해서',
      '실제로는 동시에 사용할 수 없기 때문',
    ],
    correctIndex: 1,
    explanation: 'I2C 통신에서는 각 기기마다 고유한 주소가 있어요. OLED는 0x3C, 다른 I2C 센서는 다른 주소를 써서 같은 SDA/SCL 핀을 공유할 수 있어요!',
  },
  {
    id: 3,
    question: '초음파 센서에서 TRIG와 ECHO 핀의 역할은?',
    options: [
      'TRIG=초음파 받기, ECHO=초음파 쏘기',
      'TRIG=초음파 쏘기, ECHO=초음파 받기',
      '둘 다 전원 공급',
      '둘 다 데이터 전송',
    ],
    correctIndex: 1,
    explanation: 'TRIG(트리거)는 초음파를 "쏘는" 역할, ECHO(에코)는 물체에 부딪혀 돌아온 초음파를 "받는" 역할이에요. TRIG=GPIO 5, ECHO=GPIO 18에 연결해요.',
  },
  {
    id: 4,
    question: '센서의 빨간 선은 보통 어디에 연결하나요?',
    options: [
      'GND (접지)',
      'VCC (전원)',
      'Signal (신호)',
      '아무 곳이나',
    ],
    correctIndex: 1,
    explanation: '빨간 선은 VCC(전원, 플러스 극)에 연결해요. 전선 색깔 규칙: 빨강=전원, 검정=접지, 나머지=신호선이에요!',
  },
  {
    id: 5,
    question: '센서에서 검정 선(GND)의 역할은 무엇인가요?',
    options: [
      '데이터를 전송하는 선',
      '전원을 공급하는 선',
      '전류가 돌아가는 접지선(마이너스 극)',
      'WiFi 신호선',
    ],
    correctIndex: 2,
    explanation: '검정 선은 GND(접지)예요. 전류가 센서를 거쳐 다시 ESP32로 돌아가는 길이에요. 마이너스 극이라고도 해요. 빨간 선(VCC)과 짝을 이뤄요!',
  },
  {
    id: 6,
    question: '초음파 센서의 ECHO 선은 몇 번 GPIO에 연결해야 하나요?',
    options: ['GPIO 5', 'GPIO 12', 'GPIO 18', 'GPIO 4'],
    correctIndex: 2,
    explanation: 'ECHO 선은 GPIO 18번에 연결해요. TRIG는 GPIO 5번이고요. TRIG가 초음파를 쏘고, ECHO가 돌아온 초음파를 받아요!',
  },
];

// Stage 6: Code Upload Quiz (6 questions in pool, select 3)
export const QUIZ_STAGE6: QuizQuestion[] = [
  {
    id: 1,
    question: 'ESP32에 코드를 업로드하려면 어떤 케이블로 PC와 연결해야 하나요?',
    options: [
      'HDMI 케이블',
      'USB-C 케이블',
      '이더넷 케이블',
      '오디오 케이블',
    ],
    correctIndex: 1,
    explanation: 'ESP32-S3-MOC 보드는 USB-C 포트가 있어서, USB-C 케이블로 PC와 연결해서 코드를 업로드해요.',
  },
  {
    id: 2,
    question: '코드를 업로드하기 전에 반드시 선택해야 하는 것은?',
    options: [
      '색상 테마',
      '올바른 시리얼 포트 (COM 포트)',
      '인터넷 브라우저',
      '블루투스 연결',
    ],
    correctIndex: 1,
    explanation: 'PC와 ESP32가 연결된 시리얼 포트(COM3, COM4 등)를 선택해야 코드를 올바르게 업로드할 수 있어요. 포트가 맞지 않으면 업로드가 실패해요!',
  },
  {
    id: 3,
    question: '업로드가 완료된 후 펌웨어의 동작 상태를 확인하는 방법은?',
    options: [
      '화면이 자동으로 켜짐',
      '시리얼 모니터로 ESP32가 출력하는 메시지를 확인',
      'PC가 자동으로 재부팅됨',
      '이메일로 알림이 옴',
    ],
    correctIndex: 1,
    explanation: '시리얼 모니터를 열면 ESP32가 출력하는 메시지(WiFi 연결 상태, 센서 데이터 등)를 실시간으로 볼 수 있어요. 코드가 제대로 작동하는지 확인하는 가장 좋은 방법이에요!',
  },
  {
    id: 4,
    question: 'ESP32 프로그래밍에 가장 많이 사용되는 언어는?',
    options: [
      'Python',
      'C/C++ (Arduino)',
      'Java',
      'HTML',
    ],
    correctIndex: 1,
    explanation: 'ESP32는 Arduino IDE를 사용해서 C/C++ 언어로 프로그래밍하는 것이 가장 일반적이에요. MicroPython도 사용할 수 있지만, Arduino 방식이 더 많이 쓰여요!',
  },
  {
    id: 5,
    question: 'Arduino IDE에서 코드 업로드 버튼의 모양은?',
    options: [
      '재생 기호 (▶)',
      '오른쪽 화살표 (→)',
      '원형 (○)',
      '저장 아이콘 (💾)',
    ],
    correctIndex: 1,
    explanation: 'Arduino IDE에서 업로드 버튼은 오른쪽 화살표(→) 모양이에요. 재생 기호(▶)는 코드를 확인만 하고 업로드하지는 않는 버튼이에요!',
  },
  {
    id: 6,
    question: '코드 업로드 중 ESP32 보드의 상태는?',
    options: [
      '전원이 꺼짐',
      '자동으로 재부팅되며 펌웨어를 받음',
      'WiFi가 자동으로 켜짐',
      '모든 LED가 깜빡임',
    ],
    correctIndex: 1,
    explanation: '업로드 중 ESP32는 자동으로 부트로더 모드로 진입해서 펌웨어를 받아요. 업로드가 끝나면 자동으로 재부팅되면서 새 코드가 실행돼요!',
  },
];

// Stage 5: Final Comprehensive Quiz (combined pool)
export const QUIZ_STAGE5: QuizQuestion[] = [
  ...QUIZ_STAGE1,
  ...QUIZ_STAGE2,
  ...QUIZ_STAGE3,
  ...QUIZ_STAGE6,
  {
    id: 100,
    question: 'ESP32-S3-MOC를 활용한 IoT 프로젝트를 만들 때, 올바른 순서는?',
    options: [
      '코드 업로드 → 배선 → 센서 선택',
      '센서 선택 → 배선 → 코드 업로드 → 동작 확인',
      '배선 → 센서 선택 → 동작 확인 → 코드 업로드',
      '동작 확인 → 코드 업로드 → 배선 → 센서 선택',
    ],
    correctIndex: 1,
    explanation: '올바른 순서: 1) 어떤 센서/액추에이터를 사용할지 결정 → 2) 올바른 핀에 배선 → 3) 코드 업로드 → 4) 시리얼 모니터로 동작 확인. 이 순서를 지켜야 안전하고 효율적으로 프로젝트를 만들 수 있어요!',
  },
];

// Stage 4 sub-step: MQTT Web Page Guide
export const QUIZ_STAGE4_MQTT: QuizQuestion[] = [
  {
    id: 1,
    question: 'MQTT 브로커의 역할을 우체국에 비유하면 어떻게 되나요?',
    options: [
      '편지를 쓰는 사람',
      '편지를 받아서 알맞은 주소로 배달하는 곳',
      '편지를 배달하는 우체부',
      '편지를 읽는 사람',
    ],
    correctIndex: 1,
    explanation: 'MQTT 브로커는 우체국 같은 역할이에요! ESP32가 보낸 데이터(편지)를 받아서, 알맞은 토픽(우편함 주소)으로 배달해요.',
  },
  {
    id: 2,
    question: '웹 브라우저(Chrome, Safari 등)가 MQTT 브로커에 연결할 때 사용하는 포트는 몇 번인가요?',
    options: ['1883번 (TCP)', '9001번 (WebSocket)', '80번 (HTTP)', '443번 (HTTPS)'],
    correctIndex: 1,
    explanation: '브라우저는 보안 때문에 TCP를 직접 사용할 수 없어요. 그래서 WebSocket이라는 방식으로 9001번 포트를 사용해야 한답니다!',
  },
  {
    id: 3,
    question: 'ESP32가 MQTT 브로커에 데이터를 보낼 때 사용하는 포트는 몇 번인가요?',
    options: ['1883번 (TCP)', '9001번 (WebSocket)', '80번 (HTTP)', '22번 (SSH)'],
    correctIndex: 0,
    explanation: 'ESP32는 TCP 1883번 포트를 사용해요. ESP32는 브라우저와 달리 TCP를 직접 사용할 수 있어서 우체부 전용 도로(1883번)를 쓰는 거예요!',
  },
  {
    id: 4,
    question: '스마트폰으로 ESP32 대시보드를 보려면 어떤 조건이 필요한가요?',
    options: [
      '인터넷만 되면 어디서나 가능',
      '블루투스가 켜져 있어야 함',
      'ESP32가 연결된 PC와 같은 WiFi 망에 있어야 함',
      '5G 네트워크가 필요함',
    ],
    correctIndex: 2,
    explanation: '같은 WiFi 망에 있어야 해요! PC가 웹 서버(포트 18080)와 MQTT 브로커(포트 9001)를 LAN에 공개하기 때문에, 같은 WiFi에서 접속할 수 있어요.',
  },
  {
    id: 5,
    question: 'MQTT 센서 웹 페이지 파일의 특징으로 올바른 것은?',
    options: [
      '여러 개의 파일과 폴더로 구성됨',
      '웹 서버 설치가 필요함',
      '단일 HTML 파일 하나로 완성되어 file://로 바로 열 수 있음',
      'npm과 번들러가 필요함',
    ],
    correctIndex: 2,
    explanation: '단일 HTML 파일 하나로 끝나요! 웹 서버 없이 파일을 더블클릭하면 바로 실행됩니다. 외부 라이브러리는 CDN 스크립트 태그로만 불러와요.',
  },
];

export function getQuizForStage(stageId: number): QuizQuestion[] {
  switch (stageId) {
    case 1: return QUIZ_STAGE1;
    case 2: return QUIZ_STAGE2;
    case 3: return QUIZ_STAGE3;
    case 5: return QUIZ_STAGE5;
    case 6: return QUIZ_STAGE6;
    default: return [];
  }
}
