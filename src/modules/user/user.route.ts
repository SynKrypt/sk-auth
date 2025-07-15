import { Router } from "express";
import { registerWeb } from "./user.controller.ts";

const router = Router();

// SynKrypt Web
router.post("/web/register", registerWeb);
router.post("/web/login", () => {});
router.post("/web/logout", () => {});
router.get("/web/account", () => {});
router.delete("/web/account", () => {});

// SynKrypt CLI
router.post("/cli/login", () => {});
router.get("/cli/account/me", () => {});

// Key verification
router.post("/key/verify", () => {});

// Assign Role
router.post("/admin/assign-role", () => {});

export default router;
