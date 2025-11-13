export interface AssetDetailsResponse {
  data?: {
    asset?: {
      id: string;
      name: string;
      altValueInfo?: {
        currentAltValue?: string;
      };
    };
  };
}
