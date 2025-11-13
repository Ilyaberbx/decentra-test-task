import axios from "axios";
import type { BeezieAttribute } from "../dto/beezieAttribute.js";
import type { BeezieCollectible } from "../dto/beezieCollectible.js";
import type { BeezieTokenDetails } from "../dto/beezieTokenDetails.js";
import type { TransformedDetailedTokenData } from "../dto/transformedDetailedTokenData.js";
import type { IBeezieService } from "../abstractions/ibeezie-service.js";
import { processBatched } from "../utils/batchProcessor.js";

const BEEZIE_API_URL = "https://api.beezie.io/dropItems/byCategory";
const BEEZIE_TOKEN_DETAIL_URL = "https://api.beezie.io/dropItems/getByTokenId";

export class BeezieService implements IBeezieService {
  public transformDetailedTokenData(tokenDetails: BeezieTokenDetails): TransformedDetailedTokenData {
    const attributes = tokenDetails.metadata?.attributes || [];

    return {
      tokenId: tokenDetails.tokenId,
      serial_number: this.getAttributeValue(attributes, "serial"),
      grader: this.getAttributeValue(attributes, "grader"),
      grade: this.getAttributeValue(attributes, "grade"),
    };
  }

  public async fetchTokenDetailsByCategory(category: string): Promise<TransformedDetailedTokenData[]> {
    const maxPagesToFetch = 10;
    const collectibles = await this.fetchAllCollectiblesByCategory(category, maxPagesToFetch);
    const tokenIds = collectibles.map((collectible) => collectible.tokenId);
    return processBatched(tokenIds, (tokenId) => this.fetchTokenDetailsById(tokenId), {
      batchSize: 50,
      delayBetweenBatchesMs: 200,
    });
  }

  private getAttributeValue(attributes: BeezieAttribute[] | undefined, traitType: string): string | null {
    if (!attributes || !Array.isArray(attributes)) return null;

    const attribute = attributes.find((attr) => attr.trait_type && attr.trait_type.toLowerCase() === traitType.toLowerCase());

    return attribute ? attribute.trait_value || null : null;
  }

  private async fetchCollectiblesByPageSize(categoryId: string = "1", page: number = 0, pageSize: number): Promise<BeezieCollectible[]> {
    try {
      console.log(`Fetching Beezie collectibles - Category: ${categoryId}, Page: ${page}, PageSize: ${pageSize}`);

      const response = await axios.post<BeezieCollectible[]>(
        BEEZIE_API_URL,
        {
          categoryId: categoryId,
          page: page.toString(),
          pageSize: pageSize.toString(),
          filters: [],
          saleStatus: "all",
          sellOrderDateOrder: "DESC",
        },
        {
          headers: {
            accept: "*/*",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "content-type": "application/json",
            origin: "https://beezie.io",
            referer: "https://beezie.io/",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
          },
        }
      );

      console.log(`Successfully fetched ${response.data.length} collectibles from Beezie`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Error fetching Beezie collectibles: ${error.message}`);
        if (error.response) {
          console.error(`Response status: ${error.response.status}`);
          console.error(`Response data: ${error.response.data}`);
        }
      } else {
        console.error(`Error fetching Beezie collectibles:`, error);
      }
      throw error;
    }
  }

  private async fetchAllCollectiblesByCategory(categoryId: string = "1", maxPages: number | null = null): Promise<BeezieCollectible[]> {
    const allCollectibles: BeezieCollectible[] = [];
    let page = 0;
    const pageSize = 20;

    while (true) {
      if (maxPages !== null && page >= maxPages) {
        console.log(`Reached max pages limit: ${maxPages}`);
        break;
      }

      const collectibles = await this.fetchCollectiblesByPageSize(categoryId, page, pageSize);

      if (!collectibles || collectibles.length === 0) {
        console.log(`No more collectibles found at page ${page}`);
        break;
      }

      allCollectibles.push(...collectibles);
      console.log(`Total collected so far: ${allCollectibles.length}`);

      if (collectibles.length < pageSize) {
        console.log(`Reached last page (received ${collectibles.length} items, expected ${pageSize})`);
        break;
      }

      page++;

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return allCollectibles;
  }

  public async fetchTokenDetailsById(tokenId: number): Promise<TransformedDetailedTokenData> {
    try {
      console.log(`Fetching details for token ${tokenId}`);

      const response = await axios.get<{ dropItem: BeezieTokenDetails }>(`${BEEZIE_TOKEN_DETAIL_URL}/${tokenId}`, {
        headers: {
          accept: "*/*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          origin: "https://beezie.io",
          referer: "https://beezie.io/",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
        },
      });

      return this.transformDetailedTokenData(response.data.dropItem);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Error fetching token ${tokenId} details: ${error.message}`);
      } else {
        console.error(`Error fetching token ${tokenId} details:`, error);
      }
      throw error;
    }
  }
}
