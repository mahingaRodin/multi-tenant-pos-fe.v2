import { create } from "zustand";
import type { ShiftReportDto } from "@/lib/types";

interface ShiftState {
  currentShift: ShiftReportDto | null;
  setCurrentShift: (s: ShiftReportDto | null) => void;
}

export const useShiftStore = create<ShiftState>((set) => ({
  currentShift: null,
  setCurrentShift: (s) => set({ currentShift: s }),
}));
