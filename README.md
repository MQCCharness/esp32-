# ESP32-S3-MOC 교육용 웹 프로그램 (esp32-edu.exe)

한국 중학생을 위한 ESP32-S3-MOC 보드 교육용 데스크톱 애플리케이션입니다. React + TypeScript + Vite로 제작되었으며, Go + Wails v2로 단독 exe로 패키징됩니다.

## 기능

### 6단계 커리큘럼

| 단계 | 제목 | 내용 |
|------|------|------|
| 1 | ESP32 소개 | ESP32-S3 칩, WiFi/블루투스, GPIO, 메모리 구조 학습 + 퀴즈 |
| 2 | 센서 백과사전 | 16종 센서/액추에이터 백과사전 (DHT11, 초음파, 조도, 토양수분, 가스, DS18B20, 가변저항, 틸트, 터치, 버튼, 부저, 서보, OLED, NeoPixel, DC모터, 팬모터 L9110) + 퀴즈 |
| 3 | 배선 시뮬레이션 | 드래그 앤 드롭으로 핀 연결 시뮬레이션 (7개 미션) + 종합 퀴즈 |
| 4 | 하드웨어 연결 가이드 | 7개 서브 스텝: 사진 맞추기 → 보드 확인(클릭 가능한 부품 설명) → 대시보드 생성기 → 펌웨어 업로드 → WiFi & MQTT → Manus 가이드 → MQTT 웹 페이지(비유 학습 + 퀴즈) |
| 5 | 종합 퀴즈 | 1-3, 6단계 통합 문제 풀에서 10문제 랜덤 출제 |
| 6 | 코드 업로드 시뮬레이션 | PlatformIO CLI 시뮬레이션, 포트 선택, 바이너리 업로드, 시리얼 모니터 + 퀴즈 |

### 퀴즈 시스템

- **합격 기준**: 100% (선택된 모든 문제 정답)
- **랜덤화**: 문제 선택 순서 + 보기 순서 매번 셔플
- **재시도 가능**: 합격할 때까지 무제한 재도전

### Google Sheets 연동

학생 진행 상황이 Google Sheets에 자동으로 기록됩니다:

- 학번, 이름, 1-6단계 완료 여부, 마지막 업데이트 시간
- `config.txt`에 Apps Script Web App URL 입력 (exe 빌드 없이 URL 변경 가능)
- 진행 상황은 앱 시작 시 및 "정보 변경" 시 초기화

### 교사 모드

- 학번 `3300`, 이름 `박동배` 입력 시 모든 단계 잠금 해제
- 3/4/6단계에서 서브 스텝 이동 버튼 표시
- TeacherGuide 패널에서 설정 가이드 확인 가능

## 빌드 방법

### 사전 요구사항

- Node.js 18+
- Go 1.21+
- Wails CLI (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

### 빌드

```powershell
# 프론트엔드 빌드 (TypeScript + Vite)
npm run build

# 데스크톱 exe 빌드 (Go + Wails)
go build -tags "desktop,production" -ldflags "-H windowsgui" -o esp32-edu.exe .
```

또는 빌드 스크립트 사용:

```powershell
.\build.ps1
```

### 출력

- `esp32-edu.exe` (~18 MB)
- `config.txt`를 exe와 같은 폴더에 배치해야 Google Sheets 연동 작동

## 설정

### config.txt

exe와 같은 폴더에 `config.txt` 파일을 생성하고 Apps Script Web App URL을 입력:

```
https://script.google.com/macros/s/AKfycbx.../exec
```

`config.txt.example`을 참고하세요. (실제 `config.txt`는 gitignore됨)

### Google Sheets 설정

1. Google Sheets에서 새 스프레드시트 생성
2. 확장 프로그램 → Apps Script
3. `apps-script/Code.gs` 내용 붙여넣기
4. 배포 → 웹 앱으로 배포 (액세스 권한: 모든 사용자)
5. 생성된 Web App URL을 `config.txt`에 입력

자세한 설정 방법은 앱 내 TeacherGuide 패널을 참고하세요.

## 기술 스택

- **프론트엔드**: React 19, TypeScript, Vite, @dnd-kit (드래그 앤 드롭), Framer Motion, Zustand (상태 관리)
- **데스크톱**: Go, Wails v2
- **데이터 동기화**: Google Apps Script Web App
- **로컬 저장**: Zustand + localStorage (학생 정보, 진행 상황)

## 프로젝트 구조

```
edu-web/
├── src/
│   ├── App.tsx                    # 메인 앱, 단계 라우팅, 교사 모드
│   ├── store/studentStore.ts      # Zustand 상태 관리 (localStorage)
│   ├── modules/
│   │   ├── Stage1Intro.tsx        # ESP32 소개 + 퀴즈
│   │   ├── Stage2Sensors.tsx      # 센서 백과사전 + 퀴즈
│   │   ├── Stage3Wiring.tsx       # 배선 시뮬레이션 (7 미션) + 퀴즈
│   │   ├── Stage4Hardware.tsx     # 하드웨어 가이드 (7 서브 스텝)
│   │   ├── Stage5Final.tsx        # 종합 퀴즈 (35→10)
│   │   └── Stage6Upload.tsx       # 코드 업로드 시뮬레이션 + 퀴즈
│   ├── components/
│   │   ├── Quiz.tsx               # 재사용 가능한 퀴즈 컴포넌트
│   │   ├── TeacherGuide.tsx       # 교사용 설정 가이드
│   │   └── NameInput.tsx          # 학번 + 이름 입력
│   ├── data/
│   │   ├── sensors.ts             # 16종 센서/액추에이터 정의
│   │   └── quizzes.ts             # 모든 퀴즈 문제 풀
│   └── services/
│       └── progressSync.ts        # Google Sheets POST 동기화
├── apps-script/Code.gs            # Google Apps Script
├── main.go                        # Go + Wails 메인
├── config.txt.example             # config.txt 템플릿
├── build.ps1                      # 빌드 스크립트
└── esp32-edu.exe                  # 빌드 출력물
```

## GitHub

- Repository: https://github.com/parkdongbae-afk/esp32-edu
