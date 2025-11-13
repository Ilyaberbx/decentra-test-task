export interface AltAsset {
  id: string;
  name: string;
  year?: string;
  subject?: string;
  category?: string;
  brand?: string;
}

export interface CertResponse {
  data?: {
    cert?: {
      certNumber: string;
      gradeNumber: string;
      gradingCompany: string;
      asset: AltAsset;
    };
  };
}
