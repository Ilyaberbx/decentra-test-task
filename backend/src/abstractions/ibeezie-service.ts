import type { TransformedDetailedTokenData } from "../dto/transformedDetailedTokenData.js";

export interface IBeezieService {
  fetchTokenDetailsByCategory(category: string): Promise<TransformedDetailedTokenData[]>;
  fetchTokenDetailsById(tokenId: number): Promise<TransformedDetailedTokenData>;
}
