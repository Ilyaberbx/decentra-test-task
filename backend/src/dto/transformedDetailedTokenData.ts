import type { BeezieCollectible } from "./beezieCollectible.js";

export interface TransformedDetailedTokenData extends BeezieCollectible {
  serial_number: string | null;
  grader: string | null;
  grade: string | null;
}
