import { Router } from "express";
import UserModule from "./user.module.ts";
import { authenticate } from "@/middlewares/auth.middleware.ts";

const router = Router();
const userModule = new UserModule();

// Admin routes (via web UI)
router.post("/web/admin/register", userModule.registerWeb);
router.post("/web/admin/login", userModule.loginWeb);
router.post("/web/admin/logout", authenticate, userModule.logoutWeb);
router.get("/web/admin/account", authenticate, userModule.getAccount);
router.delete("/web/admin/account", authenticate, userModule.deleteAccount);

// User routes (created by admin on web UI)
router.post("/web/non-admin", authenticate, userModule.createNewUser);
// router.delete("/web/user/:userId", authenticate, userModule.deleteUser);
// router.get("/web/user", authenticate, userModule.getUsers);
// router.get("/web/user/:userId", authenticate, userModule.getUser);
// router.put("/web/user/:userId", authenticate, userModule.updateUser);

// SynKrypt CLI
router.post("/cli/login", () => {});
router.get("/cli/account/me", () => {});

// Key verification
router.post("/key/verify", () => {});

// Assign Role
router.post("/admin/assign-role", () => {});

export default router;
