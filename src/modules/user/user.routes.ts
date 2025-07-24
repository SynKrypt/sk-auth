import { Router } from "express";
import UserModule from "./user.module.ts";
import { authenticate } from "@/middlewares/auth.middleware.ts";

const router = Router();
const userModule = new UserModule();

// SynKrypt Web
router.post("/web/register", userModule.registerWeb);
router.post("/web/login", userModule.loginWeb);
router.post("/web/logout", authenticate, userModule.logoutWeb);
router.get("/web/account", authenticate, userModule.getAccount);
router.delete("/web/account", authenticate, userModule.deleteAccount);

// SynKrypt CLI
router.post("/cli/login", () => {});
router.get("/cli/account/me", () => {});

// Key verification
router.post("/key/verify", () => {});

// Assign Role
router.post("/admin/assign-role", () => {});

export default router;
