export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
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

export interface Case {
  id: string;
  title: string;
  description?: string;
  caseType: CaseType;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  userId: string;
  services: Services[];
  evidence: Evidence[];
}

export enum CaseType {
  CRIMINAL_DEFENSE = 'CRIMINAL_DEFENSE',
  CRIMINAL_PROSECUTION = 'CRIMINAL_PROSECUTION',
  CIVIL_LITIGATION = 'CIVIL_LITIGATION',
  FAMILY_LAW = 'FAMILY_LAW',
  CORPORATE_LAW = 'CORPORATE_LAW',
  OTHER = 'OTHER'
}

export enum CaseStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export interface Services {
  id: string;
  title: string;
  legalDoctrine?: any;
  legalProcedure?: any;
  legalPrinciples?: any;
  admissibleEvidence?: any;
  casePrecedents?: any;
  clientPsychology?: any;
  synthesizedServices?: any;
  presentationUrl?: string;
  professionalFeedback?: string;
  feedbackHistory?: string;
  version?: number;
  parentServicesId?: string;
  createdAt: string;
  updatedAt: string;
  caseId: string;
}

export interface Evidence {
  id: string;
  title: string;
  description?: string;
  evidenceType: EvidenceType;
  fileUrl?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  caseId: string;
}

export enum EvidenceType {
  DOCUMENT = 'DOCUMENT',
  TESTIMONY = 'TESTIMONY',
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
  EXPERT_OPINION = 'EXPERT_OPINION',
  OTHER = 'OTHER'
}

export interface CreateCaseRequest {
  title: string;
  description?: string;
  caseType: CaseType;
}

export interface CreateServicesRequest {
  caseId: string;
  title: string;
  mcpModules?: {
    legalDoctrine?: any;
    legalProcedure?: any;
    legalPrinciples?: any;
    admissibleEvidence?: any;
    casePrecedents?: any;
    clientPsychology?: any;
  };
}