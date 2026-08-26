// ── Progress Store (Zustand + localStorage) ──
// Tracks student progress across all 6 stages

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProgressState {
  // Stage progression
  currentStage: number;           // 1-6
  completedStages: number[];      // e.g. [1, 2]

  // Quiz scores (stageId → score 0-100)
  quizScores: Record<number, number>;

  // Wiring simulation (missionId → completed)
  wiringMissions: Record<number, boolean>;

  // Code upload simulation
  uploadSimCompleted: boolean;

  // Final certificate
  certificateIssued: boolean;

  // ── Actions ──
  setCurrentStage: (stage: number) => void;
  completeStage: (stage: number) => void;
  setQuizScore: (stage: number, score: number) => void;
  completeWiringMission: (missionId: number) => void;
  setUploadSimCompleted: () => void;
  issueCertificate: () => void;
  isStageUnlocked: (stage: number) => boolean;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      currentStage: 1,
      completedStages: [],
      quizScores: {},
      wiringMissions: {},
      uploadSimCompleted: false,
      certificateIssued: false,

      setCurrentStage: (stage) => set({ currentStage: stage }),

      completeStage: (stage) =>
        set((state) => ({
          completedStages: state.completedStages.includes(stage)
            ? state.completedStages
            : [...state.completedStages, stage],
        })),

      setQuizScore: (stage, score) =>
        set((state) => ({
          quizScores: {
            ...state.quizScores,
            [stage]: Math.max(score, state.quizScores[stage] ?? 0),
          },
        })),

      completeWiringMission: (missionId) =>
        set((state) => ({
          wiringMissions: {
            ...state.wiringMissions,
            [missionId]: true,
          },
        })),

      setUploadSimCompleted: () => set({ uploadSimCompleted: true }),

      issueCertificate: () => set({ certificateIssued: true }),

      isStageUnlocked: (stage) => {
        if (stage <= 1) return true;
        const { completedStages } = get();
        return completedStages.includes(stage - 1);
      },

      resetProgress: () =>
        set({
          currentStage: 1,
          completedStages: [],
          quizScores: {},
          wiringMissions: {},
          uploadSimCompleted: false,
          certificateIssued: false,
        }),
    }),
    {
      name: 'edu-progress',
      // Only persist data fields, not functions
      partialize: (state) => ({
        currentStage: state.currentStage,
        completedStages: state.completedStages,
        quizScores: state.quizScores,
        wiringMissions: state.wiringMissions,
        uploadSimCompleted: state.uploadSimCompleted,
        certificateIssued: state.certificateIssued,
      }),
    },
  ),
);
