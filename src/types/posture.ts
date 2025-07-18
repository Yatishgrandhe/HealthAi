export interface PostureAnalysis {
  // Core Results
  score: number;
  status: "excellent" | "good" | "fair" | "poor";
  
  // Detection Results
  personDetected: boolean;
  faceDetected: boolean;
  detectionMethods: string[];
  
  // Analysis Results - Backward compatibility
  detailedAnalysis: {
    headNeck: BodyPartAnalysis;
    shoulders: BodyPartAnalysis;
    spine: BodyPartAnalysis;
    hips: BodyPartAnalysis;
    overall: BodyPartAnalysis;
  };
  

  
  // Feedback - Backward compatibility with array format
  feedback: string[];
  recommendations: string[];
  
  // Enhanced Feedback (optional for new features)
  categorizedFeedback?: CategorizedFeedback;
  prioritizedRecommendations?: PrioritizedRecommendations;
  
  // Metadata
  analysisMetadata: AnalysisMetadata;
  
  // Legacy fields for backward compatibility
  capturedImage?: string;
  timestamp?: string;
}

export interface BodyPartAnalysis {
  score: number;
  issues: string[] | PostureIssue[]; // Support both formats for backward compatibility
  measurements?: PostureMeasurements;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendations: string[];
}

export interface PostureIssue {
  type: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  impact: string;
  recommendations: string[];
}

export interface PostureMeasurements {
  headPosition: 'forward' | 'neutral' | 'backward' | 'unknown';
  shoulderLevel: 'even' | 'leftHigh' | 'rightHigh' | 'unknown';
  spineAlignment: 'straight' | 'curved' | 'twisted' | 'unknown';
  hipAlignment: 'level' | 'tilted' | 'rotated' | 'unknown';
}

export interface CategorizedFeedback {
  critical: string[];
  major: string[];
  moderate: string[];
  minor: string[];
}

export interface PrioritizedRecommendations {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  exercises: Exercise[];
  lifestyle: string[];
}

export interface Exercise {
  name: string;
  description: string;
  targetArea: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  frequency: string;
}

export interface AnalysisMetadata {
  imageQuality: number;
  lightingConditions: string;
  bodyVisibility: number;
  processingTime: number;
  detectionConfidence: number;
}

export interface PersonDetectionResult {
  detected: boolean;
  confidence: number;
  detectionMethods: string[];
  bodyPartsFound: string[];
  clothingFound: string[];
  faceData?: FaceAnnotation;
}

export interface FaceAnnotation {
  confidence: number;
  boundingPoly: {
    vertices: Array<{ x: number; y: number }>;
  };
  rollAngle: number;
  panAngle: number;
  tiltAngle: number;
}

export interface PostureAnalysisError {
  success: false;
  errorType: 'PERSON_NOT_DETECTED' | 'IMAGE_QUALITY' | 'API_ERROR' | 'PROCESSING_ERROR' | 'RATE_LIMIT';
  errorCode: string;
  message: string;
  suggestions: string[];
  retryable: boolean;
}

export interface DetectionLayer {
  name: string;
  weight: number;
  threshold: number;
  analyze(visionData: any): DetectionScore;
}

export interface DetectionScore {
  score: number;
  confidence: number;
  method: string;
}

export interface BodyPartMap {
  head: string[];
  neck: string[];
  shoulders: string[];
  arms: string[];
  torso: string[];
  spine: string[];
  hips: string[];
  legs: string[];
  feet: string[];
}

export interface SpatialAnalysis {
  headPosition: 'forward' | 'neutral' | 'backward' | 'unknown';
  shoulderLevel: 'even' | 'leftHigh' | 'rightHigh' | 'unknown';
  spineAlignment: 'straight' | 'curved' | 'twisted' | 'unknown';
  hipAlignment: 'level' | 'tilted' | 'rotated' | 'unknown';
}

export interface ScoringWeights {
  spine: 0.25;
  shoulders: 0.20;
  headNeck: 0.20;
  hips: 0.20;
  overall: 0.15;
}

export interface ScoreCalculation {
  baseScore: number;
  penalties: PosturePenalty[];
  bonuses: PostureBonus[];
  finalScore: number;
}

export interface PosturePenalty {
  type: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  points: number;
  description: string;
}

export interface PostureBonus {
  type: string;
  points: number;
  description: string;
}

// Legacy interfaces for backward compatibility
export interface ProgressReport {
  id: string;
  timestamp: string;
  score: number;
  status: "excellent" | "good" | "fair" | "poor";
  imageUrl: string;
  analysis: PostureAnalysis;
}

export interface DetailedPostureAnalysis {
  headNeck: BodyPartAnalysis;
  shoulders: BodyPartAnalysis;
  spine: BodyPartAnalysis;
  hips: BodyPartAnalysis;
  overall: BodyPartAnalysis;
} 