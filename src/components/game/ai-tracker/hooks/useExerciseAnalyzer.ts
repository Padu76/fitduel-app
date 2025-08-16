// src/components/game/ai-tracker/hooks/useExerciseAnalyzer.ts

import { useRef, useCallback } from 'react'
import { ExerciseAnalyzer } from '../services/ExerciseAnalyzer'

export interface AnalysisResult {
  formScore: number
  isInPosition: boolean
  mistakes: string[]
  suggestions: string[]
}

export interface UseExerciseAnalyzerReturn {
  analyzerRef: React.MutableRefObject<ExerciseAnalyzer | null>
  analyzePose: (landmarks: any[]) => AnalysisResult
  getRepCount: () => number
  getAverageFormScore: () => number
  getMistakes: () => string[]
  setCalibrationData: (data: any) => void
  reset: () => void
}

export const useExerciseAnalyzer = (exerciseType: string): UseExerciseAnalyzerReturn => {
  const analyzerRef = useRef<ExerciseAnalyzer | null>(null)

  // Initialize analyzer on first use
  if (!analyzerRef.current) {
    analyzerRef.current = new ExerciseAnalyzer(exerciseType)
  }

  const analyzePose = useCallback((landmarks: any[]): AnalysisResult => {
    if (!analyzerRef.current) {
      analyzerRef.current = new ExerciseAnalyzer(exerciseType)
    }
    
    return analyzerRef.current.analyzePose(landmarks)
  }, [exerciseType])

  const getRepCount = useCallback((): number => {
    return analyzerRef.current?.getRepCount() || 0
  }, [])

  const getAverageFormScore = useCallback((): number => {
    return analyzerRef.current?.getAverageFormScore() || 0
  }, [])

  const getMistakes = useCallback((): string[] => {
    return analyzerRef.current?.getMistakes() || []
  }, [])

  const setCalibrationData = useCallback((data: any) => {
    analyzerRef.current?.setCalibrationData(data)
  }, [])

  const reset = useCallback(() => {
    analyzerRef.current?.reset()
  }, [])

  return {
    analyzerRef,
    analyzePose,
    getRepCount,
    getAverageFormScore,
    getMistakes,
    setCalibrationData,
    reset
  }
}