import { useState } from 'react';

const APPS_SCRIPT_CODE = `function setup() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clear();
  sheet.getRange(1, 1, 1, 9).setValues([['학번', '이름', '1단계', '2단계', '3단계', '4단계', '5단계', '6단계', '마지막 업데이트']]);
  sheet.getRange(1, 1, 1, 9)
    .setFontWeight('bold')
    .setBackground('#4a4a5a')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center')
    .setFontSize(15);
  sheet.setFrozenRows(1);

  for (var col = 1; col <= 9; col++) {
    sheet.setColumnWidth(col, 125);
  }

  sheet.getRange(2, 1, 100, 9).setFontSize(15);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  var values = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(data.studentId)) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    sheet.appendRow([data.studentId, data.name, '', '', '', '', '', '', '']);
    rowIndex = sheet.getLastRow();
  } else {
    sheet.getRange(rowIndex, 2).setValue(data.name);
  }

  var stageData = [];
  for (var j = 1; j <= 6; j++) {
    stageData.push(data.stages[j] ? '✅' : '');
  }
  sheet.getRange(rowIndex, 3, 1, 6).setValues([stageData]);
  sheet.getRange(rowIndex, 9).setValue(new Date()).setNumberFormat('yyyy-MM-dd HH:mm:ss');
  sheet.getRange(rowIndex, 1, 1, 9).setFontSize(15);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

const sectionStyle: React.CSSProperties = {
  marginBottom: 20,
  paddingLeft: 16,
  borderLeft: '3px solid var(--accent-blue)',
};

const stepStyle: React.CSSProperties = {
  marginBottom: 8,
  lineHeight: 1.8,
  fontSize: '0.9rem',
};

const codeBlockStyle: React.CSSProperties = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: 16,
  fontSize: '0.8rem',
  fontFamily: 'monospace',
  whiteSpace: 'pre',
  overflowX: 'auto',
  color: 'var(--text-secondary)',
  maxHeight: 400,
  overflowY: 'auto',
};

export function TeacherGuide() {
  const [expanded, setExpanded] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="info-box info-box--blue" style={{ marginBottom: 16 }}>
      <div
        className="info-box__title"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded(!expanded)}
      >
        📋 교사용 가이드 — 학생 진도 확인 방법 {expanded ? '▼' : '▶'}
      </div>

      {expanded && (
        <div style={{ marginTop: 16 }}>
          <div style={sectionStyle}>
            <strong style={{ color: 'var(--accent-blue)' }}>1. config.txt 파일이란?</strong>
            <p style={stepStyle}>
              <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4 }}>
                config.txt
              </code>{' '}
              파일은 esp32-edu.exe 실행 파일과 <strong>같은 폴더</strong>에 있어야 합니다.
              <br />
              이 파일 안에는 Google Apps Script 웹앱 URL이 한 줄로 들어있습니다.
              <br />
              학생이 단계를 통과할 때마다 이 URL로 진도 데이터가 전송되어 Google Sheet에 기록됩니다.
            </p>
            <p style={stepStyle}>
              <strong>config.txt 내용 예시:</strong>
              <br />
              <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4, wordBreak: 'break-all' }}>
                https://script.google.com/macros/s/AKfycbx.../exec
              </code>
            </p>
            <p style={stepStyle}>
              ⚠️ config.txt 파일이 없거나 비어있으면 진도 동기화가 작동하지 않습니다. (학습 자체에는 영향 없음)
            </p>
          </div>

          <div style={sectionStyle}>
            <strong style={{ color: 'var(--accent-blue)' }}>2. Google Sheets 설정 (최초 1회)</strong>
            <p style={stepStyle}>
              새로운 Google Sheet을 만들어 학생 진도를 기록하려면 다음 단계를 따르세요.
            </p>
            <p style={stepStyle}>
              <strong>①</strong>{' '}
              <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)' }}>
                sheets.google.com
              </a>{' '}
              에서 새 스프레드시트 생성
            </p>
            <p style={stepStyle}>
              <strong>②</strong> 상단 메뉴에서 <strong>확장 프로그램 → Apps Script</strong> 클릭
            </p>
            <p style={stepStyle}>
              <strong>③</strong> 기존 코드를 모두 삭제하고 아래의 Apps Script 코드를 붙여넣기
            </p>
            <p style={stepStyle}>
              <strong>④</strong> 코드 편집기 상단의 실행 버튼(▶) 옆에서{' '}
              <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4 }}>setup</code>{' '}
              선택 후 실행 — 권한 승인 필요 (고급 → 프로젝트로 이동하여 승인)
            </p>
            <p style={stepStyle}>
              <strong>⑤</strong> 상단 메뉴에서 <strong>배포 → 새 배포</strong> 클릭
            </p>
            <p style={stepStyle}>
              <strong>⑥</strong> 유형 선택 아이콘(⚙️) 클릭 → <strong>웹 앱</strong> 선택
            </p>
            <p style={stepStyle}>
              <strong>⑦</strong> 다음과 같이 설정:
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;• 설명: 학생 진도 추적
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;• 실행: <strong>나</strong>
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;• 액세스 권한: <strong>모든 사용자</strong>
            </p>
            <p style={stepStyle}>
              <strong>⑧</strong> <strong>배포</strong> 버튼 클릭 — 권한 승인 필요
            </p>
            <p style={stepStyle}>
              <strong>⑨</strong> 생성된 <strong>웹 앱 URL</strong> 복사
            </p>
            <p style={stepStyle}>
              <strong>⑩</strong> config.txt 파일에 URL 붙여넣기 (exe와 같은 폴더)
            </p>

            <div style={{ marginTop: 12 }}>
              <button
                className="btn btn--ghost"
                onClick={() => setShowCode(!showCode)}
                style={{ fontSize: '0.85rem', marginRight: 8 }}
              >
                {showCode ? '코드 숨기기' : 'Apps Script 코드 보기'}
              </button>
              {showCode && (
                <button
                  className="btn btn--ghost"
                  onClick={handleCopy}
                  style={{ fontSize: '0.85rem' }}
                >
                  {copied ? '✅ 복사됨!' : '📋 코드 복사'}
                </button>
              )}
            </div>
            {showCode && (
              <pre style={{ ...codeBlockStyle, marginTop: 12 }}>{APPS_SCRIPT_CODE}</pre>
            )}
          </div>

          <div style={sectionStyle}>
            <strong style={{ color: 'var(--accent-blue)' }}>3. 학생 진도 확인 방법</strong>
            <p style={stepStyle}>
              ① 2번에서 생성한 Google Sheet을 열면 학생별 진도가 실시간으로 표시됩니다.
            </p>
            <p style={stepStyle}>
              ② 시트 구조:
            </p>
            <div style={{ ...codeBlockStyle, whiteSpace: 'pre', marginBottom: 8 }}>
{`학번 | 이름    | 1단계 | 2단계 | 3단계 | 4단계 | 5단계 | 6단계 | 마지막 업데이트
2401 | 김학생  |  ✅  |  ✅  |       |       |       |       | 2026-07-11 21:05:37
2402 | 이학생  |  ✅  |  ✅  |  ✅  |  ✅  |       |       | 2026-07-11 21:10:15
2403 | 박학생  |  ✅  |       |       |       |       |       | 2026-07-11 20:50:22`}
            </div>
            <p style={stepStyle}>
              ③ <strong>✅</strong> 표시가 있으면 해당 단계를 통과한 것입니다.
            </p>
            <p style={stepStyle}>
              ④ <strong>마지막 업데이트</strong> 열에서 학생이 마지막으로 진도를 기록한 시간을 확인할 수 있습니다.
            </p>
            <p style={stepStyle}>
              ⑤ 학번을 기준으로 학생이 식별되므로, 학번 앞자리로 학급 구분이 가능합니다. (예: 24xx = 1학년)
            </p>
            <p style={stepStyle}>
              ⚠️ Google Sheet URL은 Apps Script 웹앱 URL과 다릅니다. 진도를 확인하려면{' '}
              <strong>Google Sheet 자체의 URL</strong>(sheets.google.com/spreadsheets/d/...)로 접속하세요.
            </p>
          </div>

          <div style={sectionStyle}>
            <strong style={{ color: 'var(--accent-blue)' }}>4. 교사 모드 사용 방법</strong>
            <p style={stepStyle}>
              ① 앱 시작 시 <strong>학번 3300, 이름 박동배</strong> 입력
            </p>
            <p style={stepStyle}>
              ② 모든 단계가 열리며, Stage 3/4/6 상단에 서브 단계 이동 버튼이 표시됩니다.
            </p>
            <p style={stepStyle}>
              ③ 번호 버튼을 클릭하여 원하는 서브 단계로 직접 이동할 수 있습니다.
            </p>
            <p style={stepStyle}>
              ④ 교사 모드에서는 진도가 Google Sheet에 동기화되지 않습니다.
            </p>
          </div>

          <div style={sectionStyle}>
            <strong style={{ color: 'var(--accent-blue)' }}>5. 배포 방법 (다른 교사에게)</strong>
            <p style={stepStyle}>
              ① esp32-edu.exe 파일과 config.txt 파일을 같은 폴더에 배치
            </p>
            <p style={stepStyle}>
              ② 두 파일을 ZIP으로 압축하여 배포
            </p>
            <p style={stepStyle}>
              ③ 학생 PC에서 압축 해제 후 esp32-edu.exe 실행
            </p>
            <p style={stepStyle}>
              ④ config.txt에 올바른 URL이 들어있으면 자동으로 진도 동기화가 작동합니다.
            </p>
            <p style={stepStyle}>
              ⑤ 진도를 확인하려면 Google Sheet URL을 교사들과 공유하면 됩니다.
            </p>
          </div>

          <div style={sectionStyle}>
            <strong style={{ color: 'var(--accent-blue)' }}>6. config.txt URL 변경 방법</strong>
            <p style={stepStyle}>
              진도를 기록할 Google Sheet을 변경하려면:
            </p>
            <p style={stepStyle}>
              ① 새 Google Sheet에서 2번 단계를 따라 Apps Script 배포
            </p>
            <p style={stepStyle}>
              ② 새 웹앱 URL을 복사
            </p>
            <p style={stepStyle}>
              ③ config.txt 파일을 메모장으로 열어 URL 교체
            </p>
            <p style={stepStyle}>
              ④ 프로그램 재실행 — 재빌드 불필요
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
