// ===== Core Types =====

export type TaskType = 'checkin' | 'photo' | 'findObject' | 'message' | 'drawing';

export type AppPhase =
  | 'identity'
  | 'b-config'
  | 'b-orchestrate'
  | 'b-publishing'
  | 'c-app';

export type CTab = 'home' | 'discover' | 'task' | 'my';

export type CView = 'mall-map' | 'task-map' | 'task' | 'experience-card';

export type TaskMode = 'ai' | 'manual';

export type NodeStatus = 'locked' | 'available' | 'completed';

// ===== AI Config Hint =====
//
// The API key is server-side only. The client request only carries
// the model name as a hint — the actual credential is read by the
// backend from its own environment.
export interface AIConfigHint {
  model: string;
}

// ===== Activity Config (B-end form) =====

export interface ActivityConfig {
  name: string;
  brandName: string;
  location: string;
  time: string;
  audience: string[];
  taskTypes: TaskType[];
}

// ===== Task Content (B-end generated/manual) =====

export interface TaskContent {
  type: TaskType;
  label: string;
  icon: string;
  /**
   * Organizer's free-form description of what this specific task should
   * be about. e.g. for a "message" task: "让用户写一句关于茶的味道的短句,
   * 我们会拼成一面墙". The AI uses this to generate the rest of the
   * task (description / prompt / NPC lines) so the result is personalised
   * to this activity instead of being a generic preset.
   */
  customPrompt: string;
  description: string;
  promptHint: string;
  npcWelcome: string;
  npcFarewell: string;
  mode: TaskMode;
}

// ===== Task Results (C-end user-generated) =====

export interface TaskResult {
  type: TaskType;
  // checkin
  checkinTime?: string;
  // photo
  photoData?: string;
  photoComment?: string;
  // findObject
  foundCorrect?: boolean;
  findFeedback?: string;
  // message
  userMessage?: string;
  coCreatedStory?: string;
  // drawing
  drawingData?: string;
  drawingComment?: string;
}

// ===== Experience Card =====

export interface VisualStyle {
  primary: string;
  secondary: string;
  accent: string;
  decoration: string;
}

export interface ExperienceCardData {
  theme: string;
  brandName: string;
  date: string;
  location: string;
  results: TaskResult[];
  storyText: string;
  visualStyle: VisualStyle;
}

// ===== Task Node Status (for C-end map) =====

export interface TaskNodeState {
  type: TaskType;
  label: string;
  icon: string;
  status: NodeStatus;
  position: { x: number; y: number };
}

// ===== AI Generation Request =====
//
// Carried from the client to the CityStage backend. The model
// field is a hint only; the actual API key is read server-side.
export interface GenerateContentRequest {
  promptType: string;
  params: Record<string, unknown>;
  aiConfig: AIConfigHint;
}

export interface GenerateContentResponse {
  content: string;
  data?: Record<string, unknown>;
}
