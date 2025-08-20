import { Router } from "express";
import CLIModule from "./cli.module.ts";

const router = Router();
const cliModule = new CLIModule();

const { requestNonce, login } = cliModule;

router.post("/request-nonce", requestNonce);
router.post("/login", login);

export default router;
