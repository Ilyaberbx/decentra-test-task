import type { AssetDetailsResponse } from "../dto/altDetailsResponse.js";
import type { CertResponse, AltAsset } from "../dto/altCertResponse.js";
import type { EnrichedAltData } from "../dto/enrichedAltData.js";
import type { IAltService } from "../abstractions/ialt-service.js";
import axios from "axios";
import "dotenv/config";
import type { TransformedDetailedTokenData } from "../dto/transformedDetailedTokenData.js";

const ALT_GRAPHQL_URL = "https://alt-platform-server.production.internal.onlyalt.com/graphql";
const ALT_AUTH_TOKEN = process.env.ALT_AUTH_TOKEN!;

export class AltService implements IAltService {
  public async enrichWithAltData(tokenDetail: TransformedDetailedTokenData): Promise<EnrichedAltData | null> {
    if (!tokenDetail.serial_number || !tokenDetail.grader || !tokenDetail.grade) {
      console.log(`No serial number, grader, or grade found for token detail: ${tokenDetail.tokenId}`);
      return null;
    }

    try {
      const asset = await this.fetchAltAssetByCert(tokenDetail.serial_number);

      await new Promise((resolve) => setTimeout(resolve, 300));

      if (!asset) {
        return null;
      }

      if (tokenDetail.grader && tokenDetail.grade) {
        const marketValue = await this.fetchAltMarketValue(asset.id, tokenDetail.grade, tokenDetail.grader);

        if (marketValue == null) {
          return null;
        }

        return {
          beezieTokenId: tokenDetail.tokenId,
          altAssetId: asset.id,
          altMarketValue: marketValue,
        };
      }

      return null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Error enriching with ALT data: ${error.message}`);
      } else {
        console.error(`Error enriching with ALT data:`, error);
      }
      return null;
    }
  }

  private async fetchAltAssetByCert(certNumber: string): Promise<AltAsset | null> {
    if (!certNumber) return null;

    try {
      console.log(`Querying ALT for cert: ${certNumber}`);

      const query = `
      query Cert($certNumber: String!) {
        cert(certNumber: $certNumber) {
          certNumber
          gradeNumber
          gradingCompany
          asset {
            id
            name
            year
            subject
            category
            brand
          }
        }
      }
    `;

      const response = await axios.post<CertResponse>(
        `${ALT_GRAPHQL_URL}/Cert`,
        {
          query,
          variables: { certNumber },
        },
        {
          headers: {
            accept: "*/*",
            "content-type": "application/json",
            authorization: `Bearer ${ALT_AUTH_TOKEN}`,
            origin: "https://app.alt.xyz",
            referer: "https://app.alt.xyz/",
          },
        }
      );

      const cert = response.data?.data?.cert;
      if (cert && cert.asset) {
        console.log(`Found ALT asset: ${cert.asset.id}`);
        return cert.asset;
      }

      console.log(`No ALT asset found for cert: ${certNumber}`);
      return null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Error fetching ALT asset for cert ${certNumber}: ${error.message}`);
      } else {
        console.error(`Error fetching ALT asset for cert ${certNumber}:`, error);
      }
      return null;
    }
  }

  private async fetchAltMarketValue(assetId: string, gradeNumber: string, grader: string): Promise<number | null> {
    if (!assetId || !gradeNumber || !grader) return null;

    try {
      console.log(`Fetching ALT value for asset: ${assetId} (${grader} ${gradeNumber})`);

      const query = `
        query AssetDetails($id: ID!, $tsFilter: TimeSeriesFilter!) {
          asset(id: $id) {
            id
            name
            altValueInfo(tsFilter: $tsFilter) {
              currentAltValue
            }
          }
        }
      `;

      const response = await axios.post<AssetDetailsResponse>(
        `${ALT_GRAPHQL_URL}/AssetDetails`,
        {
          query,
          variables: {
            id: assetId,
            tsFilter: {
              gradeNumber,
              gradingCompany: grader.toUpperCase(),
            },
          },
        },
        {
          headers: {
            accept: "*/*",
            "content-type": "application/json",
            authorization: `Bearer ${ALT_AUTH_TOKEN}`,
            origin: "https://app.alt.xyz",
            referer: "https://app.alt.xyz/",
          },
        }
      );

      const altValue = response.data?.data?.asset?.altValueInfo?.currentAltValue;
      if (altValue) {
        const value = parseFloat(altValue);
        console.log(`ALT Market Value: $${value}`);
        return value;
      }

      console.log(`No market value found`);
      return null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Error fetching ALT value: ${error.message}`);
      } else {
        console.error(`Error fetching ALT value:`, error);
      }
      return null;
    }
  }
}
