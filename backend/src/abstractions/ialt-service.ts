import type { EnrichedAltData } from "../dto/enrichedAltData.js";
import type { TransformedDetailedTokenData } from "../dto/transformedDetailedTokenData.js";

export interface IAltService {
  enrichWithAltData(tokenDetail: TransformedDetailedTokenData): Promise<EnrichedAltData | null>;
}
