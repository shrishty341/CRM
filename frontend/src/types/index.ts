/**
 * TypeScript type definitions for the Pharma CRM HCP Interaction Module.
 */

// ============================================================
// AI Chat Types
// ============================================================

export interface AIExtractedData {
  doctor_name: string | null;
  hospital: string | null;
  specialization: string | null;
  meeting_date: string | null;
  products_discussed: string[];
  samples_given: number;
  sentiment: string | null;
  outcome: string | null;
  follow_up_date: string | null;
  summary: string | null;
  confidence_score: number | null;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  extracted_data?: AIExtractedData | null;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  extracted_data: AIExtractedData | null;
  raw_response: string | null;
  conversation_id: string | null;
}

// ============================================================
// Interaction Types
// ============================================================

export interface Interaction {
  id: number;
  hcp_id: number;
  doctor_name: string | null;
  hospital: string | null;
  specialization: string | null;
  meeting_date: string | null;
  interaction_type: string;
  products_discussed: string[];
  samples_given: number;
  outcome: string | null;
  follow_up_date: string | null;
  notes: string | null;
  ai_summary: string | null;
  created_at: string | null;
}

export interface InteractionFormData {
  doctor_name: string;
  hospital: string;
  specialization: string;
  meeting_date: string;
  interaction_type: string;
  products_discussed: string;
  samples_given: number;
  outcome: string;
  follow_up_date: string;
  notes: string;
}

export interface InteractionCreatePayload {
  doctor_name: string;
  hospital: string;
  specialization?: string | null;
  meeting_date?: string | null;
  interaction_type?: string;
  products_discussed?: string[];
  samples_given?: number;
  outcome?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;
  ai_summary?: string | null;
}

export interface InteractionResponse {
  success: boolean;
  message: string;
  data: Interaction | null;
}

export interface InteractionHistoryResponse {
  success: boolean;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  interactions: Interaction[];
}

// ============================================================
// HCP Types
// ============================================================

export interface HCP {
  id: number;
  doctor_name: string;
  hospital: string;
  specialization: string | null;
  created_at: string | null;
  interaction_count: number;
}

export interface HCPListResponse {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  hcps: HCP[];
}

export interface HCPRecentResponse {
  success: boolean;
  hcps: HCP[];
}

// ============================================================
// Redux State Types
// ============================================================

export interface ChatState {
  messages: ChatMessage[];
  currentConversationId: string | null;
  isProcessing: boolean;
  error: string | null;
  extractedData: AIExtractedData | null;
  showForm: boolean;
}

export interface InteractionState {
  currentInteraction: Interaction | null;
  interactions: Interaction[];
  isLoading: boolean;
  error: string | null;
  saveSuccess: boolean;
  total: number;
  page: number;
  pageSize: number;
}

export interface HCPState {
  hcps: HCP[];
  recentHcps: HCP[];
  isLoading: boolean;
  error: string | null;
  total: number;
}

export interface RootState {
  chat: ChatState;
  interaction: InteractionState;
  hcp: HCPState;
}

// ============================================================
// UI Types
// ============================================================

export type InteractionMode = 'form' | 'chat';

export type ThemeMode = 'light' | 'dark';

export interface SuggestedPrompt {
  text: string;
  label: string;
}

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    label: 'Simple Visit',
    text: "Met with Dr. Sharma at Apollo Hospital today. Discussed CardioPlus. He was interested and took 3 samples.",
  },
  {
    label: 'Follow-up Visit',
    text: "Follow-up meeting with Dr. Patel at Fortis Hospital. He wants more information about NeuroMax. Gave him 5 samples. Requested another meeting next week.",
  },
  {
    label: 'New Product Discussion',
    text: "Presented new product CardioPlus to Dr. Singh at Max Healthcare. He is a cardiologist and seems very interested. Asked for 10 samples. Follow-up in 2 weeks.",
  },
  {
    label: 'Sample Delivery',
    text: "Delivered 8 samples of NeuroMax to Dr. Gupta at Medanta. He prescribed it to 2 patients last week. Positive feedback.",
  },
];

export const OUTCOME_OPTIONS = [
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'follow_up_required', label: 'Follow-up Required' },
  { value: 'sample_requested', label: 'Sample Requested' },
  { value: 'prescription_commitment', label: 'Prescription Commitment' },
];

export const INTERACTION_TYPE_OPTIONS = [
  { value: 'in_person', label: 'In Person' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
];

export const SPECIALIZATION_OPTIONS = [
  'Cardiologist',
  'Neurologist',
  'Orthopedic',
  'Pediatrician',
  'Dermatologist',
  'Oncologist',
  'Gastroenterologist',
  'Pulmonologist',
  'Endocrinologist',
  'Nephrologist',
  'Ophthalmologist',
  'ENT Specialist',
  'General Physician',
  'Psychiatrist',
  'Radiologist',
];

export const PRODUCT_OPTIONS = [
  'CardioPlus',
  'NeuroMax',
  'RespiraClear',
  'DermCare',
  'GastroShield',
  'OrthoFlex',
  'OncoGuard',
  'PediatriCare',
];