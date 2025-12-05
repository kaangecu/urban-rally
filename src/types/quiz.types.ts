export type QuizQuestionType = 'multiple-choice' | 'text' | 'number';

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuizQuestionType;
  options?: string[]; // For multiple choice
  correctAnswer: string | number;
  points: number;
  hint?: string; // Optional hint for the question
}

export interface QuizAnswer {
  questionId: string;
  answer: string | number;
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface QuizSubmissionData {
  taskId: string;
  answers: QuizAnswer[];
  totalPoints: number;
  submittedAt: Date;
}
