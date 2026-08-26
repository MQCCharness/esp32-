// ── Stage 5: Final Comprehensive Quiz ──
// 10 random questions from the combined pool (all stages)

import { useState } from 'react';
import { Quiz } from '../components/Quiz';
import { QUIZ_STAGE5 } from '../data/quizzes';

const QUIZ_PASS_SCORE = 100;

interface Stage5Props {
  onComplete: () => void;
}

export function Stage5Final({ onComplete }: Stage5Props) {
  const [passed, setPassed] = useState(false);

  function handleQuizComplete(score: number) {
    if (score >= QUIZ_PASS_SCORE) {
      setPassed(true);
      onComplete();
    }
  }

  return (
    <div className="stage">
      <h2 className="stage__title">
        <span>🏆</span> 종합 퀴즈
      </h2>
      <p className="stage__description">
        지금까지 배운 모든 내용을 총정리하는 퀴즈예요. 모든 문제를 맞춰야 합격합니다!
      </p>

      <div className="info-box info-box--blue" style={{ marginBottom: 16 }}>
        <div className="info-box__title">🎯 목표</div>
        <p>10개의 문제가 무작위로 출제됩니다. ESP32 보드, 센서, 배선, 코드 업로드 등 모든 범위를 포괄합니다. 100%를 맞춰야 합격합니다!</p>
      </div>

      <Quiz
        questions={QUIZ_STAGE5}
        title="종합 퀴즈"
        selectCount={10}
        onComplete={handleQuizComplete}
      />

      {passed && (
        <div className="info-box info-box--green" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
          <div className="info-box__title">종합 퀴즈 통과!</div>
          <p>모든 내용을 마스터했어요! 마지막 단계로 진행해 보세요.</p>
          <div style={{ marginTop: 12 }}>
            <button className="btn btn--success" onClick={onComplete}>다음 단계로 →</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Stage5Final;
