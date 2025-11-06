export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface CreateCaseRequest {
  title: string;
  description?: string;
  caseType: string;
}

export interface MCPModuleInput {
  caseId: string;
  caseDetails: any;
  specificPrompt?: string;
}

export interface MCPModuleOutput {
  moduleType: string;
  data: any;
  confidence: number;
  sources?: string[];
  timestamp: Date;
}

export interface LegalStrategyRequest {
  caseId: string;
  mcpModules: {
    legalDoctrine?: any;
    legalProcedure?: any;
    legalPrinciples?: any;
    admissibleEvidence?: any;
    casePrecedents?: any;
    clientPsychology?: any;
  };
}

export interface LegalStrategyResponse {
  strategyId: string;
  synthesizedStrategy: any;
  presentationUrl?: string;
  confidence: number;
}