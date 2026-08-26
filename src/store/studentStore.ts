import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StudentState {
  studentId: string;
  name: string;
  setStudentInfo: (id: string, name: string) => void;
  clearStudent: () => void;
}

export const useStudentStore = create<StudentState>()(
  persist(
    (set) => ({
      studentId: '',
      name: '',
      setStudentInfo: (id, name) => set({ studentId: id, name }),
      clearStudent: () => set({ studentId: '', name: '' }),
    }),
    { name: 'student-info' },
  ),
);
