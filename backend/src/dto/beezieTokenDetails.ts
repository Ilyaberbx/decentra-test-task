import type { BeezieAttribute } from "./beezieAttribute.js";
import type { BeezieCollectible } from "./beezieCollectible.js";

export interface BeezieTokenDetails extends BeezieCollectible {
  metadata?: {
    attributes?: BeezieAttribute[];
  };
}
