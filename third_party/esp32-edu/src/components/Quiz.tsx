// ── Reusable Quiz Component ──
// Used by all stages that have quiz questions

import { useState } from 'react';
import type { QuizQuestion } from '../data/quizzes';

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
  title?: string;
  selectCount?: number;
}

type QuizState = 'answering' | 'reviewing' | 'finished';

function shuffleArray<T>(arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function prepareQuiz(questions: QuizQuestion[], count: number): QuizQuestion[] {
  const selected = shuffleArray(questions).slice(0, Math.min(count, questions.length));
  return selected.map((q) => {
    const indexed = q.options.map((opt, i) => ({ opt, isCorrect: i === q.correctIndex }));
    const shuffled = shuffleArray(indexed);
    return {
      ...q,
      options: shuffled.map((o) => o.opt),
      correctIndex: shuffled.findIndex((o) => o.isCorrect),
    };
  });
}

export function Quiz({ questions, onComplete, title = '퀴즈', selectCount }: QuizProps) {
  const [quizQuestions, setQuizQuestions] = useState(() =>
    prepareQuiz(questions, selectCount ?? questions.length),
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [state, setState] = useState<QuizState>('answering');
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const question = quizQuestions[currentIndex];
  const isLast = currentIndex === quizQuestions.length - 1;
  const score = Math.round((correctCount / quizQuestions.length) * 100);

  function handleSelect(index: number) {
    if (state !== 'answering') return;
    setSelectedIndex(index);
    setState('reviewing');

    const isCorrect = index === question.correctIndex;
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    }
    setAnswers((prev) => [...prev, index]);
  }

  function handleNext() {
    if (isLast) {
      setState('finished');
      onComplete(score);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedIndex(null);
    setState('answering');
  }

  function handleRetry() {
    setQuizQuestions(prepareQuiz(questions, selectCount ?? questions.length));
    setCurrentIndex(0);
    setSelectedIndex(null);
    setState('answering');
    setCorrectCount(0);
    setAnswers([]);
  }

  // ── Finished state ──
  if (state === 'finished') {
    const passed = correctCount === quizQuestions.length;
    return (
      <div className="quiz">
        <div className="quiz__result">
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>
            {passed ? '🎉' : '😅'}
          </div>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>
            {passed ? '합격!' : '아쉬워요!'}
          </h3>
          <div
            className={`quiz__result-score ${passed ? 'quiz__result-score--pass' : 'quiz__result-score--fail'}`}
          >
            {score}점
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
            {quizQuestions.length}문제 중 {correctCount}문제 정답
          </p>
          {passed ? (
            <p style={{ color: 'var(--accent-green)' }}>
              ✅ 다음 단계로 진행할 수 있어요!
            </p>
          ) : (
            <p style={{ color: 'var(--accent-yellow)' }}>
              💡 모든 문제를 맞춰야 다음 단계로 넘어갈 수 있어요. 다시 도전해 보세요!
            </p>
          )}
          <div className="quiz__actions">
            {!passed && (
              <button className="btn btn--ghost" onClick={handleRetry}>
                🔁 다시 풀기
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Answering / Reviewing state ──
  return (
    <div className="quiz">
      <div className="quiz__header">
        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700 }}>
          📝 {title}
        </h3>
        <span className="quiz__progress">
          {currentIndex + 1} / {quizQuestions.length}
        </span>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {quizQuestions.map((_, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background:
                i < currentIndex
                  ? answers[i] === quizQuestions[i].correctIndex
                    ? 'var(--accent-green)'
                    : 'var(--accent-red)'
                  : i === currentIndex
                    ? 'var(--accent-blue)'
                    : 'var(--border)',
              transition: 'background 0.2s ease',
            }}
          />
        ))}
      </div>

      <div className="quiz__question">{question.question}</div>

      <div>
        {question.options.map((option, i) => {
          let className = 'quiz__option';
          if (state === 'reviewing') {
            if (i === question.correctIndex) {
              className += ' quiz__option--correct';
            } else if (i === selectedIndex) {
              className += ' quiz__option--wrong';
            }
          } else if (i === selectedIndex) {
            className += ' quiz__option--selected';
          }

          return (
            <div
              key={i}
              className={className}
              onClick={() => handleSelect(i)}
              style={{ cursor: state === 'answering' ? 'pointer' : 'default' }}
            >
              <span className="quiz__option-letter">
                {state === 'reviewing' && i === question.correctIndex
                  ? '✓'
                  : state === 'reviewing' && i === selectedIndex && i !== question.correctIndex
                    ? '✗'
                    : String.fromCharCode(65 + i)}
              </span>
              <span>{option}</span>
            </div>
          );
        })}
      </div>

      {state === 'reviewing' && (
        <>
          <div className="quiz__explanation">
            <strong>
              {selectedIndex === question.correctIndex ? '✅ 정답이에요! ' : '❌ 틀렸어요. '}
            </strong>
            {question.explanation}
          </div>
          <div className="quiz__actions">
            <button
              className="btn btn--primary"
              onClick={handleNext}
              style={{ marginTop: 8 }}
            >
              {isLast ? '결과 보기 🏁' : '다음 문제 →'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Quiz;
