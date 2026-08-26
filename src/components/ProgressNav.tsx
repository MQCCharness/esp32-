// ── Progress Navigation Bar ──
// Shows the 6-stage learning path with unlock/complete status

import { CURRICULUM } from '../data/curriculum';
import { useProgressStore } from '../store/progressStore';

interface ProgressNavProps {
  // No props needed — reads from store directly
}

export function ProgressNav({}: ProgressNavProps) {
  const currentStage = useProgressStore((s) => s.currentStage);
  const completedStages = useProgressStore((s) => s.completedStages);
  const isStageUnlocked = useProgressStore((s) => s.isStageUnlocked);
  const setCurrentStage = useProgressStore((s) => s.setCurrentStage);

  return (
    <nav className="progress-bar">
      {CURRICULUM.map((stage, index) => {
        const isCompleted = completedStages.includes(stage.id);
        const isActive = currentStage === stage.id;
        const isLocked = !isStageUnlocked(stage.id);

        const stepClass = [
          'progress-bar__step',
          isActive ? 'progress-bar__step--active' : '',
          isCompleted ? 'progress-bar__step--completed' : '',
          isLocked ? 'progress-bar__step--locked' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {/* Step circle + label */}
            <div
              className={stepClass}
              onClick={() => !isLocked && setCurrentStage(stage.id)}
            >
              <div className="progress-bar__circle">
                {isCompleted ? '✓' : stage.emoji}
              </div>
              <span className="progress-bar__label">
                {stage.id}단계
              </span>
            </div>

            {/* Connector line (not after last step) */}
            {index < CURRICULUM.length - 1 && (
              <div
                className={[
                  'progress-bar__connector',
                  isCompleted ? 'progress-bar__connector--completed' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default ProgressNav;
