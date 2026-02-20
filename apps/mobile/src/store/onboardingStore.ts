import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
    completed: boolean;
    currentStep: number;
    skipped: boolean;
    setCompleted: (completed: boolean) => void;
    setCurrentStep: (step: number) => void;
    setSkipped: (skipped: boolean) => void;
    reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            completed: false,
            currentStep: 0,
            skipped: false,

            setCompleted: (completed) => set({ completed }),
            setCurrentStep: (step) => set({ currentStep: step }),
            setSkipped: (skipped) => set({ skipped }),

            reset: () => set({ completed: false, currentStep: 0, skipped: false }),
        }),
        {
            name: 'onboarding-storage',
            storage: createJSONStorage(() => AsyncStorage),
        },
    ),
);
