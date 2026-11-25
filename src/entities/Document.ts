export interface IdentityDocument {
  id: string;
  type: 'license' | 'registration' | 'insurance';
  ownerName: string;
  plate: string;
  vehicleModel: string;
  licenseCategory: string;
  expiryDate: string;
  photoMatches: boolean;
}
