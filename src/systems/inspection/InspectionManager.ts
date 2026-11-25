import type { IdentityDocument } from '../../entities/Document';
import type { NPCRecord } from '../../entities/NPC';

export type InspectionIssue = 'name' | 'plate' | 'model' | 'category' | 'expiry' | 'photo' | 'database';

export class InspectionManager {
  compare(npc: NPCRecord, documents: IdentityDocument[]): InspectionIssue[] {
    const issues: InspectionIssue[] = [];
    const license = documents.find((document) => document.type === 'license');
    const registration = documents.find((document) => document.type === 'registration');
    const insurance = documents.find((document) => document.type === 'insurance');

    if (!license) issues.push('database');
    else {
      if (license.ownerName !== npc.name) issues.push('name');
      if (!license.photoMatches) issues.push('photo');
      if (license.licenseCategory !== npc.documents.licenseCategory) issues.push('category');
      if (license.expiryDate < '2026-11-25') issues.push('expiry');
    }
    if (!registration) issues.push('database');
    else {
      if (registration.plate !== npc.vehicle.plate) issues.push('plate');
      if (registration.vehicleModel !== `${npc.vehicle.make} ${npc.vehicle.model}`) issues.push('model');
    }
    if (!insurance || insurance.expiryDate < '2026-11-25') issues.push('expiry');
    return [...new Set(issues)];
  }

  evaluate(npc: NPCRecord, documents: IdentityDocument[], decision: 'approve' | 'refuse'): { correct: boolean; issues: InspectionIssue[] } {
    const issues = this.compare(npc, documents);
    const shouldApprove = issues.length === 0;
    return { correct: decision === 'approve' ? shouldApprove : !shouldApprove, issues };
  }
}
