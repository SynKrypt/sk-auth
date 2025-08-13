import { randomDigitIDGenerator } from "@/utils/random-id-generator.ts";
import { IPostgresService } from "../db/db.service.ts";

import { PostgresService } from "../db/db.service.ts";
import ServiceResponse from "../response/service-response.ts";
import { v4 as uuidv4 } from "uuid";
import { UUID } from "node:crypto";

export interface ICLIService {
  generateNonce(): any;
}

class CLIService implements ICLIService {
  private readonly dbService: PostgresService;
  constructor() {
    this.dbService = new PostgresService();
  }

  public generateNonce(): any {
    const nonce = String(randomDigitIDGenerator(10));
    return ServiceResponse.success({ nonce });
  }

  public async saveNonceToDB(nonce: string, userId: UUID): Promise<any> {
    try {
      const response = await this.dbService.createToken(
        userId,
        nonce,
        "nonce",
        new Date(Date.now() + 30 * 1000),
      );
      if (!response.success) {
        return ServiceResponse.failure(response.error);
      }
      return ServiceResponse.success(response.data);
    } catch (error: any) {
      return ServiceResponse.failure(error);
    }
  }
}

export default CLIService;
