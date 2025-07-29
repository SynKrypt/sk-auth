import { Router } from "express";
import KeyModule from "./key.module.js";
import { authenticate } from "@/middlewares/auth.middleware.ts";

const router = Router();
const keyModule = new KeyModule();

router.post("/key", authenticate, keyModule.createKeyGenerationOneTimeToken);
router.post("/key/verify", keyModule.verifyKeyGenerationOneTimeToken);

export default router;
