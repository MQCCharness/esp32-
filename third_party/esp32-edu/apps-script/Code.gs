// ── ESP32-S3-MOC 학생 진도 추적 Google Apps Script ──
//
// 배포 방법:
// 1. Google Sheets에서 새 스프레드시트 생성
// 2. 확장 프로그램 → Apps Script 클릭
// 3. 기존 코드 삭제 후 이 코드를 붙여넣기
// 4. setup() 함수 실행 (헤더 행 생성) — 실행 권한 승인
// 5. 배포 → 새 배포 → 유형: 웹 앱 선택
//    - 실행: 나
//    - 액세스 권한: 모든 사용자
// 6. 생성된 웹 앱 URL 복사
// 7. exe 파일과 같은 폴더에 config.txt 파일 생성 후 URL 붙여넣기
//    config.txt 내용: https://script.google.com/macros/s/AKfyc.../exec

function setup() {
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
}
