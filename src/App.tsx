// ── ESP32-S3-MOC Educational Program ──
// Main App: layout, stage routing, progress tracking

import { useState, useEffect } from 'react';
import { useProgressStore } from './store/progressStore';
import { useStudentStore } from './store/studentStore';
import { syncProgress, setWebAppUrl } from './services/progressSync';
import { CURRICULUM } from './data/curriculum';
import { ProgressNav } from './components/ProgressNav';
import { NameInput } from './components/NameInput';
import { TeacherGuide } from './components/TeacherGuide';
import { Stage1Intro } from './modules/Stage1Intro';
import { Stage2Sensors } from './modules/Stage2Sensors';
import { Stage3Wiring } from './modules/Stage3Wiring';
import { Stage4Hardware } from './modules/Stage4Hardware';
import { Stage5Final } from './modules/Stage5Final';
import { Stage6Upload } from './modules/Stage6Upload';

// ── Main App ──
function App() {
  const currentStage = useProgressStore((s) => s.currentStage);
  const completeStage = useProgressStore((s) => s.completeStage);
  const setCurrentStage = useProgressStore((s) => s.setCurrentStage);
  const resetProgress = useProgressStore((s) => s.resetProgress);
  const studentId = useStudentStore((s) => s.studentId);
  const studentName = useStudentStore((s) => s.name);
  const clearStudent = useStudentStore((s) => s.clearStudent);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    resetProgress();
    clearStudent();
    setInitialized(true);
    window.go?.main?.App?.LoadConfig().then((url: string) => {
      if (url) setWebAppUrl(url);
    });
  }, []);

  useEffect(() => {
    if (studentId === '3300' && studentName === '박동배') {
      const store = useProgressStore.getState();
      for (let i = 1; i <= 6; i++) store.completeStage(i);
      for (let i = 1; i <= 4; i++) store.completeWiringMission(i);
      store.setUploadSimCompleted();
      store.issueCertificate();
    }
  }, [studentId, studentName]);

  const handleStageComplete = (stageId: number) => {
    completeStage(stageId);

    const { studentId, name } = useStudentStore.getState();
    if (studentId && name) {
      const { completedStages } = useProgressStore.getState();
      void syncProgress(studentId, name, completedStages);
    }

    if (stageId < CURRICULUM.length) {
      setCurrentStage(stageId + 1);
    }
  };

  if (!initialized) return null;

  if (!studentId || !studentName) {
    return <NameInput />;
  }

  const teacherMode = studentId === '3300' && studentName === '박동배';

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div>
          <h1 className="app-header__title">
            <span className="app-header__title-emoji">🔧</span>
            ESP32-S3-MOC 교육 프로그램
          </h1>
          <p className="app-header__subtitle">
            중학생을 위한 ESP32 &amp; IoT 학습 — 단계별로 차근차근!
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge" style={{ fontSize: '0.85rem' }}>
            👤 {studentId} {studentName}
          </span>
          <button
            className="btn btn--ghost"
            onClick={() => {
              resetProgress();
              clearStudent();
            }}
            style={{ fontSize: '0.8rem', padding: '8px 12px' }}
          >
            정보 변경
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => setShowResetConfirm(!showResetConfirm)}
            style={{ fontSize: '0.8rem', padding: '8px 16px' }}
          >
            🔄 진도 초기화
          </button>
        </div>
      </header>

      {/* Reset confirmation */}
      {showResetConfirm && (
        <div className="info-box info-box--red" style={{ marginBottom: 16 }}>
          <div className="info-box__title">⚠️ 정말 초기화할까요?</div>
          <p>모든 학습 진도가 삭제됩니다. 되돌릴 수 없어요!</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              className="btn btn--danger"
              onClick={() => {
                resetProgress();
                setShowResetConfirm(false);
              }}
            >
              예, 초기화
            </button>
            <button
              className="btn btn--ghost"
              onClick={() => setShowResetConfirm(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Progress Navigation */}
      <ProgressNav />

      {teacherMode && <TeacherGuide />}

      {/* Stage Content */}
      {currentStage === 1 && <Stage1Intro onComplete={() => handleStageComplete(1)} />}
      {currentStage === 2 && <Stage2Sensors onComplete={() => handleStageComplete(2)} />}
      {currentStage === 3 && <Stage3Wiring onComplete={() => handleStageComplete(3)} teacherMode={teacherMode} />}
      {currentStage === 4 && <Stage4Hardware onComplete={() => handleStageComplete(4)} teacherMode={teacherMode} />}
      {currentStage === 5 && <Stage5Final onComplete={() => handleStageComplete(5)} />}
      {currentStage === 6 && <Stage6Upload onComplete={() => handleStageComplete(6)} teacherMode={teacherMode} />}

      {/* Footer */}
      <footer style={{ textAlign: 'center', marginTop: 48, color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        <p>ESP32-S3-MOC Educational Program · All 6 Stages</p>
      </footer>
    </div>
  );
}

export default App;
