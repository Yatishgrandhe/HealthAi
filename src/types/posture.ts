export interface PostureAnalysis {
  score: number;
  status: "good" | "fair" | "poor";
  feedback: string[];
  recommendations: string[];
  confidence: number;
  personDetected: boolean;
  faceDetected: boolean;
  capturedImage?: string;
  timestamp?: string;
  detailedAnalysis?: {
    headNeck: { score: number; issues: string[] };
    shoulders: { score: number; issues: string[] };
    spine: { score: number; issues: string[] };
    hips: { score: number; issues: string[] };
    overall: { score: number; issues: string[] };
  };
}

export interface ProgressReport {
  id: string;
  timestamp: string;
  score: number;
  status: "good" | "fair" | "poor";
  imageUrl: string;
  analysis: PostureAnalysis;
}

export interface BodyPartAnalysis {
  score: number;
  issues: string[];
  recommendations: string[];
}

export interface DetailedPostureAnalysis {
  headNeck: BodyPartAnalysis;
  shoulders: BodyPartAnalysis;
  spine: BodyPartAnalysis;
  hips: BodyPartAnalysis;
  overall: BodyPartAnalysis;
} 