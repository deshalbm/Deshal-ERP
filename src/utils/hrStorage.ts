import {
  EmploymentContract,
  PerformanceGoal,
  EmployeeKPI,
  PerformanceReview,
  TrainingCourse,
  EmployeeTrainingRecord,
  EmployeeCertificate,
  DisciplinaryAction,
  EmployeeRecognition,
  EmployeeCareerHistory,
  EmployeeDocumentRecord,
  EmployeeEventGreeting
} from '../types/hr';

export const HR_STORAGE_KEYS = {
  CONTRACTS: 'deshal_hr_contracts_v1',
  GOALS: 'deshal_hr_goals_v1',
  KPIS: 'deshal_hr_kpis_v1',
  REVIEWS: 'deshal_hr_reviews_v1',
  TRAINING_COURSES: 'deshal_hr_courses_v1',
  TRAINING_RECORDS: 'deshal_hr_training_records_v1',
  CERTIFICATES: 'deshal_hr_certificates_v1',
  DISCIPLINARY: 'deshal_hr_disciplinary_v1',
  RECOGNITIONS: 'deshal_hr_recognitions_v1',
  CAREER_HISTORIES: 'deshal_hr_career_histories_v1',
  DOCUMENTS: 'deshal_hr_documents_v1',
  GREETINGS: 'deshal_hr_greetings_v1'
};

// -------------------------------------------------------------------
// DEFAULT SEED DATA - CLEAN PRODUCTION MODE
// -------------------------------------------------------------------
export const DEFAULT_CONTRACTS: EmploymentContract[] = [];
export const DEFAULT_GOALS: PerformanceGoal[] = [];
export const DEFAULT_KPIS: EmployeeKPI[] = [];
export const DEFAULT_REVIEWS: PerformanceReview[] = [];
export const DEFAULT_TRAINING_COURSES: TrainingCourse[] = [];
export const DEFAULT_TRAINING_RECORDS: EmployeeTrainingRecord[] = [];
export const DEFAULT_CERTIFICATES: EmployeeCertificate[] = [];
export const DEFAULT_DISCIPLINARY_ACTIONS: DisciplinaryAction[] = [];
export const DEFAULT_RECOGNITIONS: EmployeeRecognition[] = [];
export const DEFAULT_CAREER_HISTORIES: EmployeeCareerHistory[] = [];
export const DEFAULT_DOCUMENTS: EmployeeDocumentRecord[] = [];
export const DEFAULT_GREETINGS: EmployeeEventGreeting[] = [];

// -------------------------------------------------------------------
// STORAGE LOADER & SAVER UTILITIES
// -------------------------------------------------------------------

// Contracts
export function loadEmploymentContracts(): EmploymentContract[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.CONTRACTS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load contracts from storage:', e);
  }
  saveEmploymentContracts(DEFAULT_CONTRACTS);
  return DEFAULT_CONTRACTS;
}

export function saveEmploymentContracts(contracts: EmploymentContract[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.CONTRACTS, JSON.stringify(contracts));
  } catch (e) {
    console.error('Failed to save contracts:', e);
  }
}

// Goals
export function loadPerformanceGoals(): PerformanceGoal[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.GOALS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load goals:', e);
  }
  savePerformanceGoals(DEFAULT_GOALS);
  return DEFAULT_GOALS;
}

export function savePerformanceGoals(goals: PerformanceGoal[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.GOALS, JSON.stringify(goals));
  } catch (e) {
    console.error('Failed to save goals:', e);
  }
}

// KPIs
export function loadEmployeeKPIs(): EmployeeKPI[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.KPIS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load KPIs:', e);
  }
  saveEmployeeKPIs(DEFAULT_KPIS);
  return DEFAULT_KPIS;
}

export function saveEmployeeKPIs(kpis: EmployeeKPI[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.KPIS, JSON.stringify(kpis));
  } catch (e) {
    console.error('Failed to save KPIs:', e);
  }
}

// Reviews
export function loadPerformanceReviews(): PerformanceReview[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.REVIEWS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load reviews:', e);
  }
  savePerformanceReviews(DEFAULT_REVIEWS);
  return DEFAULT_REVIEWS;
}

export function savePerformanceReviews(reviews: PerformanceReview[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  } catch (e) {
    console.error('Failed to save reviews:', e);
  }
}

// Training Courses
export function loadTrainingCourses(): TrainingCourse[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.TRAINING_COURSES);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load courses:', e);
  }
  saveTrainingCourses(DEFAULT_TRAINING_COURSES);
  return DEFAULT_TRAINING_COURSES;
}

export function saveTrainingCourses(courses: TrainingCourse[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.TRAINING_COURSES, JSON.stringify(courses));
  } catch (e) {
    console.error('Failed to save courses:', e);
  }
}

// Training Records
export function loadEmployeeTrainingRecords(): EmployeeTrainingRecord[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.TRAINING_RECORDS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load training records:', e);
  }
  saveEmployeeTrainingRecords(DEFAULT_TRAINING_RECORDS);
  return DEFAULT_TRAINING_RECORDS;
}

export function saveEmployeeTrainingRecords(records: EmployeeTrainingRecord[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.TRAINING_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save training records:', e);
  }
}

// Certificates
export function loadEmployeeCertificates(): EmployeeCertificate[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.CERTIFICATES);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load certificates:', e);
  }
  saveEmployeeCertificates(DEFAULT_CERTIFICATES);
  return DEFAULT_CERTIFICATES;
}

export function saveEmployeeCertificates(certs: EmployeeCertificate[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.CERTIFICATES, JSON.stringify(certs));
  } catch (e) {
    console.error('Failed to save certificates:', e);
  }
}

// Disciplinary
export function loadDisciplinaryActions(): DisciplinaryAction[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.DISCIPLINARY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load disciplinary actions:', e);
  }
  saveDisciplinaryActions(DEFAULT_DISCIPLINARY_ACTIONS);
  return DEFAULT_DISCIPLINARY_ACTIONS;
}

export function saveDisciplinaryActions(actions: DisciplinaryAction[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.DISCIPLINARY, JSON.stringify(actions));
  } catch (e) {
    console.error('Failed to save disciplinary actions:', e);
  }
}

// Recognitions
export function loadEmployeeRecognitions(): EmployeeRecognition[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.RECOGNITIONS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load recognitions:', e);
  }
  saveEmployeeRecognitions(DEFAULT_RECOGNITIONS);
  return DEFAULT_RECOGNITIONS;
}

export function saveEmployeeRecognitions(recs: EmployeeRecognition[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.RECOGNITIONS, JSON.stringify(recs));
  } catch (e) {
    console.error('Failed to save recognitions:', e);
  }
}

// Career Histories
export function loadEmployeeCareerHistories(): EmployeeCareerHistory[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.CAREER_HISTORIES);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load career histories:', e);
  }
  saveEmployeeCareerHistories(DEFAULT_CAREER_HISTORIES);
  return DEFAULT_CAREER_HISTORIES;
}

export function saveEmployeeCareerHistories(histories: EmployeeCareerHistory[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.CAREER_HISTORIES, JSON.stringify(histories));
  } catch (e) {
    console.error('Failed to save career histories:', e);
  }
}

// Documents
export function loadEmployeeDocuments(): EmployeeDocumentRecord[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.DOCUMENTS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load employee documents:', e);
  }
  saveEmployeeDocuments(DEFAULT_DOCUMENTS);
  return DEFAULT_DOCUMENTS;
}

export function saveEmployeeDocuments(docs: EmployeeDocumentRecord[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  } catch (e) {
    console.error('Failed to save employee documents:', e);
  }
}

// Greetings
export function loadEmployeeGreetings(): EmployeeEventGreeting[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.GREETINGS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load greetings:', e);
  }
  saveEmployeeGreetings(DEFAULT_GREETINGS);
  return DEFAULT_GREETINGS;
}

export function saveEmployeeGreetings(greetings: EmployeeEventGreeting[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.GREETINGS, JSON.stringify(greetings));
  } catch (e) {
    console.error('Failed to save greetings:', e);
  }
}
