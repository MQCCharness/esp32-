// ── Stage 6: Code Upload Simulation ──
// Arduino IDE ESP32 setup + Board manager + Code upload + Serial monitor + Quiz

import { useState, useEffect, useRef } from 'react';
import { Quiz } from '../components/Quiz';
import { QUIZ_STAGE6 } from '../data/quizzes';
import { useProgressStore } from '../store/progressStore';

// ══════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════

const QUIZ_PASS_SCORE = 100;

const BOARD_MANAGER_URL = 'https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json';

const STEP_LABELS = ['Arduino IDE', '보드 매니저', '보드 선택', '코드 작성', '업로드', '시리얼 모니터', '퀴즈'];

const SERIAL_MESSAGES = [
  'ESP32-S3-MOC 부팅 중...',
  'WiFi 연결 중... SSID: MyHomeWiFi',
  'WiFi 연결됨! IP: 192.168.1.100',
  'MQTT 브로커 연결 중...',
  'MQTT 연결됨! 대시보드와 통신 시작',
  '온습도 센서 온도: 25.3°C, 습도: 45%',
  '초음파 거리: 15.2cm',
  '조도 센서: 52%',
  '--- 대시보드로 데이터 전송 중 ---',
  '온습도 센서 온도: 25.4°C, 습도: 46%',
  '초음파 거리: 14.8cm',
  '정상 작동 중 ✅',
];

const EXAMPLE_CODE = `#include <DHT.h>
#include <WiFi.h>

#define DHTPIN 4
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();

  WiFi.begin("MyHomeWiFi", "password");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" WiFi 연결됨!");
}

void loop() {
  float temp = dht.readTemperature();
  float humi = dht.readHumidity();

  Serial.print("온도: ");
  Serial.print(temp);
  Serial.print("°C, 습도: ");
  Serial.print(humi);
  Serial.println("%");

  delay(2000);
}`;

// ══════════════════════════════════════════════════════
// Step Indicator (same as Stage4)
// ══════════════════════════════════════════════════════

function StepIndicator({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 2, marginBottom: 24,
      overflowX: 'auto', padding: '12px 16px',
      background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)',
    }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 64,
            opacity: i <= current ? 1 : 0.4,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700,
              background: i < current ? 'var(--accent-green-dim)' : i === current ? 'var(--accent-blue)' : 'var(--bg-input)',
              border: `2px solid ${i < current ? 'var(--accent-green)' : i === current ? 'var(--accent-blue)' : 'var(--border)'}`,
              color: i <= current ? 'white' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span style={{
              fontSize: '0.62rem', whiteSpace: 'nowrap', fontWeight: i === current ? 600 : 400,
              color: i === current ? 'var(--accent-blue)' : 'var(--text-muted)',
            }}>
              {labels[i]}
            </span>
          </div>
          {i < total - 1 && (
            <div style={{
              width: 16, height: 2, margin: '0 2px', marginBottom: 16,
              background: i < current ? 'var(--accent-green)' : 'var(--border)',
              transition: 'background 0.2s ease',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// Step 0: Arduino IDE Install Guide
// ══════════════════════════════════════════════════════

function ArduinoInstall({ onComplete }: { onComplete: () => void }) {
  return (
    <div>
      <div className="info-box info-box--blue" style={{ marginBottom: 16 }}>
        <div className="info-box__title">💻 Arduino IDE 설치</div>
        <p>ESP32에 코드를 업로드하려면 Arduino IDE가 필요합니다. 무료로 다운로드할 수 있어요!</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-input)', border: '2px solid var(--accent-blue)',
            fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-blue)',
          }}>1</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>
              📥 Arduino IDE 다운로드
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              <a href="https://www.arduino.cc/en/software" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)' }}>
                arduino.cc/en/software
              </a>
              에서 Windows 버전을 다운로드합니다. "Win 7 or newer"를 클릭하면 됩니다.
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-input)', border: '2px solid var(--accent-blue)',
            fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-blue)',
          }}>2</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>
              ⚙️ 설치 실행
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              다운로드한 파일을 실행하여 Arduino IDE를 설치합니다. 기본 설정으로 "Next"를 누르면 됩니다.
            </div>
          </div>
        </div>
      </div>

      <div className="info-box info-box--yellow" style={{ marginTop: 16 }}>
        <div className="info-box__title">⚠️ 주의사항</div>
        <p>Arduino IDE 설치 시 USB 드라이버도 함께 설치됩니다. 만약 드라이버 설치가 되지 않으면 다음 링크에서 다운로드할 수 있습니다.</p>
      </div>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <button className="btn btn--success" onClick={onComplete}>다음 단계로 →</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// Step 1: Board Manager Setup (Interactive)
// ══════════════════════════════════════════════════════

function BoardManagerSetup({ onComplete }: { onComplete: () => void }) {
  const [urlAdded, setUrlAdded] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function handleAddUrl() {
    setUrlAdded(true);
  }

  function handleInstall() {
    if (installing || installed) return;
    setInstalling(true);
    setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setInstalling(false);
          setInstalled(true);
          return 100;
        }
        return prev + 3;
      });
    }, 80);
  }

  return (
    <div>
      <div className="info-box info-box--blue" style={{ marginBottom: 16 }}>
        <div className="info-box__title">⚙️ 보드 매니저로 ESP32 추가</div>
        <p>Arduino IDE에서 ESP32 보드를 사용하려면 보드 매니저로 ESP32 패키지를 추가해야 합니다. 단계별로 따라해보세요!</p>
      </div>

      {/* Step 1: Add URL */}
      <div className="card" style={{ opacity: urlAdded ? 0.6 : 1 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: urlAdded ? 'var(--accent-green-dim)' : 'var(--bg-input)',
            border: `2px solid ${urlAdded ? 'var(--accent-green)' : 'var(--accent-blue)'}`,
            color: 'white', fontSize: '0.8rem', fontWeight: 700,
          }}>{urlAdded ? '✓' : '1'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              파일 &gt; 환경설정 &gt; "추가 보드 매니저 URL" 입력
            </div>
            <div style={{
              padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--accent-cyan)',
              wordBreak: 'break-all', marginBottom: 10,
            }}>
              {BOARD_MANAGER_URL}
            </div>
            {!urlAdded ? (
              <button className="btn btn--primary" onClick={handleAddUrl} style={{ fontSize: '0.85rem' }}>
                URL 추가하기
              </button>
            ) : (
              <span style={{ color: 'var(--accent-green)', fontSize: '0.85rem', fontWeight: 600 }}>
                ✓ URL 추가됨!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Install ESP32 package */}
      <div className="card" style={{ opacity: urlAdded ? 1 : 0.4 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: installed ? 'var(--accent-green-dim)' : 'var(--bg-input)',
            border: `2px solid ${installed ? 'var(--accent-green)' : 'var(--accent-blue)'}`,
            color: 'white', fontSize: '0.8rem', fontWeight: 700,
          }}>{installed ? '✓' : '2'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              툴 &gt; 보드 &gt; 보드 매니저 &gt; "esp32" 검색 후 설치
            </div>

            {/* Mock board manager window */}
            <div style={{
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              overflow: 'hidden', marginTop: 8,
            }}>
              <div style={{
                padding: '8px 12px', background: 'var(--bg-input)',
                borderBottom: '1px solid var(--border)',
                fontSize: '0.8rem', color: 'var(--text-muted)',
              }}>
                보드 매니저
              </div>
              <div style={{ padding: 12 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 8, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>esp32</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>by Espressif Systems</div>
                  </div>
                  {installed ? (
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                      background: 'rgba(61,214,140,0.15)', color: 'var(--accent-green)',
                    }}>설치됨</span>
                  ) : installing ? (
                    <div style={{ width: 120 }}>
                      <div style={{ width: '100%', height: 6, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-blue)', transition: 'width 0.08s linear' }} />
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
                        {progress}%
                      </div>
                    </div>
                  ) : urlAdded ? (
                    <button className="btn btn--primary" onClick={handleInstall} style={{ fontSize: '0.8rem', padding: '4px 16px' }}>
                      설치
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>먼저 URL 추가</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {installed && (
        <div className="info-box info-box--green" style={{ marginTop: 16 }}>
          <div className="info-box__title">✅ ESP32 패키지 설치 완료!</div>
          <p>이제 Arduino IDE에서 ESP32 보드를 사용할 수 있습니다!</p>
        </div>
      )}

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <button className="btn btn--success" onClick={onComplete} disabled={!installed}>
          다음 단계로 →
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// Step 2: Board & Port Selection
// ══════════════════════════════════════════════════════

function BoardPortSelect({ onComplete }: { onComplete: () => void }) {
  const [boardSelected, setBoardSelected] = useState(false);
  const [portSelected, setPortSelected] = useState(false);
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const [portMenuOpen, setPortMenuOpen] = useState(false);

  const allSelected = boardSelected && portSelected;

  return (
    <div>
      <div className="info-box info-box--blue" style={{ marginBottom: 16 }}>
        <div className="info-box__title">⚙️ 보드 및 포트 선택</div>
        <p>ESP32에 코드를 업로드하려면 올바른 보드와 포트를 선택해야 합니다. 버튼을 눌러 메뉴를 열어서 선택해보세요!</p>
      </div>

      {/* Board selection */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 12 }}>🔧 툴 &gt; 보드 선택</div>
        <button
          className="btn btn--ghost"
          onClick={() => { setBoardMenuOpen(!boardMenuOpen); setPortMenuOpen(false); }}
          style={{ width: '100%', justifyContent: 'space-between', padding: '12px 16px' }}
        >
          <span>{boardSelected ? 'ESP32S3 Dev Module' : '보드 선택...'}</span>
          <span>{boardMenuOpen ? '▲' : '▼'}</span>
        </button>
        {boardMenuOpen && (
          <div style={{
            marginTop: 4, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            overflow: 'hidden', background: 'var(--bg-input)',
          }}>
            <div style={{ padding: '8px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>ESP32 Arduino</div>
            <div
              onClick={() => { setBoardSelected(true); setBoardMenuOpen(false); }}
              style={{
                padding: '10px 24px', cursor: 'pointer', fontSize: '0.9rem',
                background: boardSelected ? 'rgba(74,158,255,0.1)' : 'transparent',
                color: boardSelected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,158,255,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = boardSelected ? 'rgba(74,158,255,0.1)' : 'transparent'; }}
            >
              ✓ ESP32S3 Dev Module
            </div>
          </div>
        )}
        {boardSelected && (
          <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--accent-green)' }}>
            ✓ ESP32S3 Dev Module 선택됨
          </div>
        )}
      </div>

      {/* Port selection */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 12 }}>🔌 툴 &gt; 포트 선택</div>
        <button
          className="btn btn--ghost"
          onClick={() => { setPortMenuOpen(!portMenuOpen); setBoardMenuOpen(false); }}
          style={{ width: '100%', justifyContent: 'space-between', padding: '12px 16px' }}
        >
          <span>{portSelected ? 'COM3' : '포트 선택...'}</span>
          <span>{portMenuOpen ? '▲' : '▼'}</span>
        </button>
        {portMenuOpen && (
          <div style={{
            marginTop: 4, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            overflow: 'hidden', background: 'var(--bg-input)',
          }}>
            <div
              onClick={() => { setPortSelected(true); setPortMenuOpen(false); }}
              style={{
                padding: '10px 16px', cursor: 'pointer', fontSize: '0.9rem',
                color: 'var(--text-secondary)', transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,158,255,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              COM3 (ESP32-S3)
            </div>
          </div>
        )}
        {portSelected && (
          <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--accent-green)' }}>
            ✓ COM3 선택됨
          </div>
        )}
      </div>

      <div className="info-box info-box--yellow">
        <div className="info-box__title">⚠️ 포트가 안 보이나요?</div>
        <p>USB-C 케이블로 노트북과 ESP32 보드가 잘 연결되어 있는지 확인하세요. 또한 USB 케이블은 데이터 전송용(단순 충전 전용이 아닌) 케이블이어야 합니다.</p>
      </div>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <button className="btn btn--success" onClick={onComplete} disabled={!allSelected}>
          다음 단계로 →
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// Step 3: Code View
// ══════════════════════════════════════════════════════

function CodeView({ onComplete }: { onComplete: () => void }) {
  return (
    <div>
      <div className="info-box info-box--blue" style={{ marginBottom: 16 }}>
        <div className="info-box__title">📝 코드 작성</div>
        <p>아래는 온습도 센서로 온도와 습도를 읽고, WiFi로 연결하여 시리얼 모니터에 출력하는 예제 코드입니다. 이 코드를 업로드해보겠습니다.</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Code editor title bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', background: 'var(--bg-input)',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            📄 esp32_dht11_example.ino
          </span>
        </div>

        {/* Code content */}
        <pre style={{
          margin: 0, padding: 16, overflow: 'auto',
          background: '#0d0f17', fontSize: '0.82rem', lineHeight: 1.6,
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          color: '#e8eaf0',
        }}>
          <code>{EXAMPLE_CODE}</code>
        </pre>
      </div>

      <div className="info-box info-box--yellow" style={{ marginTop: 16 }}>
        <div className="info-box__title">💡 코드 설명</div>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li><strong style={{ color: 'var(--accent-cyan)' }}>#include</strong> — 온습도 센서와 WiFi 라이브러리를 불러옵니다.</li>
          <li><strong style={{ color: 'var(--accent-cyan)' }}>DHTPIN 4</strong> — 온습도 센서의 DATA 선을 GPIO 4번에 연결합니다. (앞쪽에서 배운 것과 같아요!)</li>
          <li><strong style={{ color: 'var(--accent-cyan)' }}>setup()</strong> — 시작할 때 한 번만 실행됩니다. WiFi 연결을 설정합니다.</li>
          <li><strong style={{ color: 'var(--accent-cyan)' }}>loop()</strong> — 계속 반복 실행됩니다. 2초마다 온도와 습도를 읽어서 출력합니다.</li>
        </ul>
      </div>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <button className="btn btn--success" onClick={onComplete}>다음 단계로 →</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// Step 4: Upload Simulation
// ══════════════════════════════════════════════════════

function UploadSim({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startUpload() {
    if (uploading || done) return;
    setUploading(true);
    setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setUploading(false);
          setDone(true);
          return 100;
        }
        return prev + 2;
      });
    }, 60);
  }

  const statusMessage = done
    ? '✅ 업로드 완료! ESP32가 곧바로 부팅됩니다.'
    : uploading
      ? progress < 30
        ? '컴파일 중... ' + progress + '%'
        : progress < 70
          ? '펌웨어 업로드 중... ' + progress + '%'
          : '부팅 및 검증 중... ' + progress + '%'
      : '업로드 버튼(→)을 눌러 코드를 ESP32에 업로드하세요.';

  return (
    <div>
      <div className="info-box info-box--blue" style={{ marginBottom: 16 }}>
        <div className="info-box__title">⚡ 코드 업로드</div>
        <p>작성한 코드를 ESP32 보드에 업로드합니다. 업로드 버튼(→)을 눌렀을 때, ESP32는 자동으로 부트로더 모드로 진입하여 펌웨어를 받아요.</p>
      </div>

      {/* Mock Arduino IDE upload area */}
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>
          {done ? '✅' : uploading ? '⚡' : '📦'}
        </div>

        {/* Progress bar */}
        {(uploading || done) && (
          <div style={{
            width: '100%', height: 28, background: 'var(--bg-input)',
            borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)',
            marginBottom: 12,
          }}>
            <div style={{
              width: `${progress}%`, height: '100%',
              background: done ? 'var(--accent-green)' : 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))',
              transition: 'width 0.06s linear', borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: 'white',
            }}>
              {progress > 10 ? `${progress}%` : ''}
            </div>
          </div>
        )}

        <div style={{
          fontSize: '0.9rem', color: done ? 'var(--accent-green)' : 'var(--text-secondary)',
          marginBottom: 16,
        }}>
          {statusMessage}
        </div>

        {!done ? (
          <button className="btn btn--primary btn--lg" onClick={startUpload} disabled={uploading}>
            {uploading ? '업로드 중... ⏳' : '→ 코드 업로드'}
          </button>
        ) : (
          <button className="btn btn--success btn--lg" onClick={onComplete}>
            다음 단계로 →
          </button>
        )}
      </div>

      {done && (
        <div className="info-box info-box--green" style={{ marginTop: 16 }}>
          <div className="info-box__title">🎉 업로드 성공!</div>
          <p>ESP32가 새 코드를 실행하기 시작했어요! 이제 시리얼 모니터로 동작을 확인해보세요.</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// Step 5: Virtual Serial Monitor
// ══════════════════════════════════════════════════════

function SerialMonitor({ onComplete }: { onComplete: () => void }) {
  const [messages, setMessages] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index >= SERIAL_MESSAGES.length) {
        clearInterval(interval);
        setDone(true);
        return;
      }
      setMessages((prev) => [...prev, SERIAL_MESSAGES[index]]);
      index++;
    }, 900);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div>
      <div className="info-box info-box--blue" style={{ marginBottom: 16 }}>
        <div className="info-box__title">🖥️ 가상 시리얼 모니터</div>
        <p>업로드한 코드가 ESP32에서 실행되며 출력하는 메시지를 확인합니다. 실제 Arduino IDE에서도 같은 방식으로 동작합니다.</p>
      </div>

      {/* Terminal window */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', background: '#0a0c14',
          borderBottom: '1px solid #1a1e2e',
        }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff6b6b' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f5cd47' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3dd68c' }} />
          <span style={{ marginLeft: 8, fontSize: '0.8rem', color: '#565d6b' }}>
            시리얼 모니터 — COM3 — 115200 baud
          </span>
        </div>

        <div
          ref={scrollRef}
          style={{
            background: '#0a0c14', minHeight: 280, maxHeight: 400,
            overflow: 'auto', padding: 16,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '0.85rem', lineHeight: 1.8,
          }}
        >
          {messages.length === 0 && (
            <div style={{ color: '#565d6b' }}>waiting for output...</div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{ color: '#3dd68c', animation: 'fadeIn 0.3s ease' }}>
              <span style={{ color: '#565d6b' }}>$</span> {msg}
            </div>
          ))}
          {!done && messages.length > 0 && (
            <div style={{ color: '#565d6b', display: 'inline-block' }}>
              <span style={{ color: '#565d6b' }}>$</span> <span style={{ animation: 'pulse 1s ease infinite' }}>█</span>
            </div>
          )}
        </div>
      </div>

      {done && (
        <div className="info-box info-box--green" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
          <div className="info-box__title">시리얼 모니터 확인 완료!</div>
          <p>ESP32가 정상적으로 동작하고 있어요! 마지막으로 퀴즈를 풀어보세요.</p>
          <div style={{ marginTop: 12 }}>
            <button className="btn btn--success" onClick={onComplete}>퀴즈 풀러 가기 →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════

interface Stage6Props {
  onComplete: () => void;
  teacherMode?: boolean;
}

export function Stage6Upload({ onComplete, teacherMode }: Stage6Props) {
  const [step, setStep] = useState(0);
  const [quizPassed, setQuizPassed] = useState(false);
  const setUploadSimCompleted = useProgressStore((s) => s.setUploadSimCompleted);

  function handleQuizComplete(score: number) {
    if (score >= QUIZ_PASS_SCORE) {
      setQuizPassed(true);
      setUploadSimCompleted();
      onComplete();
    }
  }

  return (
    <div className="stage">
      <h2 className="stage__title">
        <span>💻</span> 코드 업로드 시뮬레이션
      </h2>
      <p className="stage__description">
        PC에서 코드를 업로드하여 ESP32를 작동시키는 과정을 시뮬레이션해 보세요!
      </p>

      {step < 6 && <StepIndicator current={step} total={7} labels={STEP_LABELS} />}

      {teacherMode && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
          {STEP_LABELS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                background: i === step ? 'var(--accent-blue)' : 'var(--bg-card)',
                color: i === step ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {step === 0 && <ArduinoInstall onComplete={() => setStep(1)} />}
      {step === 1 && <BoardManagerSetup onComplete={() => setStep(2)} />}
      {step === 2 && <BoardPortSelect onComplete={() => setStep(3)} />}
      {step === 3 && <CodeView onComplete={() => setStep(4)} />}
      {step === 4 && <UploadSim onComplete={() => setStep(5)} />}
      {step === 5 && <SerialMonitor onComplete={() => setStep(6)} />}
      {step === 6 && (
        <>
          <Quiz
            questions={QUIZ_STAGE6}
            title="코드 업로드 퀴즈"
            selectCount={3}
            onComplete={handleQuizComplete}
          />
          {quizPassed && (
            <div className="info-box info-box--green" style={{ marginTop: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
              <div className="info-box__title">모든 단계 완료!</div>
              <p>축하해요! ESP32-S3-MOC 교육 프로그램의 모든 과정을 완료했어요! 이제 실제로 나만의 IoT 프로젝트를 만들어보세요!</p>
              <div style={{ marginTop: 12 }}>
                <button className="btn btn--success btn--lg" onClick={onComplete}>
                  프로그램 완료 ✅
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Stage6Upload;
