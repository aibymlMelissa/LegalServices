export { LegalDoctrineModule } from './legalDoctrineModule';
export { LegalProcedureModule } from './legalProcedureModule';
export { LegalPrinciplesModule } from './legalPrinciplesModule';
export { AdmissibleEvidenceModule } from './admissibleEvidenceModule';
export { CasePrecedentsModule } from './casePrecedentsModule';
export { ClientPsychologyModule } from './clientPsychologyModule';

export interface MCPModuleRegistry {
  legalDoctrine: LegalDoctrineModule;
  legalProcedure: LegalProcedureModule;
  legalPrinciples: LegalPrinciplesModule;
  admissibleEvidence: AdmissibleEvidenceModule;
  casePrecedents: CasePrecedentsModule;
  clientPsychology: ClientPsychologyModule;
}