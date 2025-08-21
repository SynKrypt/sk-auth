import asyncHandler from "@/utils/async-handler.ts";
import { Request, Response } from "express";
import CLIService from "./cli.service.ts";
import ApiResponse, {
  CustomError,
  ErrorType,
} from "../response/api-response.ts";
import { PostgresService } from "../db/db.service.ts";

export interface ICLIModule {
  requestNonce: (req: Request, res: Response) => Promise<string>;
  login: (req: Request, res: Response) => Promise<any>;
  logout: (req: Request, res: Response) => Promise<any>;
}

class CLIModule implements ICLIModule {
  private readonly cliService: CLIService;
  private readonly dbService: PostgresService;

  constructor() {
    this.cliService = new CLIService();
    this.dbService = new PostgresService();
  }

  public requestNonce = asyncHandler(async (req: Request, res: Response) => {
    // get the public key fingerprint from the request body
    const pubKeyFingerprint = req.body?.fingerprint;
    if (!pubKeyFingerprint) {
      throw new CustomError(
        ErrorType.bad_request,
        400,
        "Missing public key fingerprint",
      );
    }
    // look for the public key in the DB
    const findPublicKeyResponse =
      await this.dbService.getPubKeyByFingerprint(pubKeyFingerprint);
    if (!findPublicKeyResponse.success) {
      throw new CustomError(
        ErrorType.not_found,
        404,
        "Public Key Not Found",
        findPublicKeyResponse.error,
      );
    }
    const userId = findPublicKeyResponse.data.user_id;
    // generate a nonce and store it in the DB
    const createNonceResponse = this.cliService.generateNonce();
    if (!createNonceResponse.success) {
      throw new CustomError(
        ErrorType.database_error,
        500,
        "Failed to generate nonce",
        createNonceResponse.error,
      );
    }
    const saveNonceResponse = await this.cliService.saveNonceToDB(
      createNonceResponse.data.nonce,
      userId,
    );
    if (!saveNonceResponse.success) {
      throw new CustomError(
        ErrorType.database_error,
        500,
        "Failed to save nonce",
        saveNonceResponse.error,
      );
    }
    res.status(200).json(
      ApiResponse.success(200, "Nonce generated successfully", {
        nonce: createNonceResponse.data.nonce,
      }),
    );
  });

  public login = asyncHandler(async (req: Request, res: Response) => {
    // get the signed payload and the nonce from request body
    const { nonce: _nonce, signedPayload, signature } = req.body;
    if (!_nonce || !signedPayload || !signature) {
      throw new CustomError(
        ErrorType.bad_request,
        400,
        "Missing nonce, signed payload, or signature",
      );
    }

    const nonce = String(_nonce);

    // check the validity of the nonce record
    const nonceValidityResponse = await this.cliService.isNonceValid(nonce);
    if (!nonceValidityResponse.success) {
      throw new CustomError(
        ErrorType.bad_request,
        401,
        "Invalid nonce",
        nonceValidityResponse.error,
      );
    }

    // verify the signature of the signed payload using the public key
    const getPublicKeyResponse = await this.cliService.getPublicKeyFromUserId(
      nonceValidityResponse.data.userId,
    );
    if (!getPublicKeyResponse.success) {
      throw new CustomError(
        ErrorType.bad_request,
        404,
        "Public key not found",
        getPublicKeyResponse.error,
      );
    }
    const publicKey = getPublicKeyResponse.data.publicKey?.key_val;
    const verifySignatureResponse = await this.cliService.verifySignature(
      signedPayload,
      signature,
      publicKey,
    );
    if (!verifySignatureResponse.success) {
      throw new CustomError(
        ErrorType.bad_request,
        404,
        "Signature verification failed",
        verifySignatureResponse.error,
      );
    }

    // invalidate the nonce record (so that it cannot be used again)
    const invalidateNonceResponse = await this.cliService.invalidateNonce(
      nonceValidityResponse.data?.nonceId,
    );
    if (!invalidateNonceResponse.success) {
      throw new CustomError(
        ErrorType.bad_request,
        500,
        "Nonce invalidation failed",
        invalidateNonceResponse.error,
      );
    }

    // create a new session token (of type "cli-session") for the user (valid forever until revoked)
    const createSessionResponse = await this.cliService.createSession(
      nonceValidityResponse.data?.userId,
      "cli-session",
    );
    if (!createSessionResponse.success) {
      throw new CustomError(
        ErrorType.bad_request,
        500,
        "Session creation failed",
        createSessionResponse.error,
      );
    }

    // send the session token to the client
    res
      .status(200)
      .json(
        ApiResponse.success(
          200,
          "CLI Login Successful",
          createSessionResponse.data?.token,
        ),
      );
  });

  public logout = asyncHandler(async (req: Request, res: Response) => {});
}

export default CLIModule;
