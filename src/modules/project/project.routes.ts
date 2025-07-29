import Router from "express";
import { authenticate } from "@/middlewares/auth.middleware.ts";
import ProjectModule from "./project.module.ts";

const router = Router();
const projectModule = new ProjectModule();

router.post(
  "/web/organization",
  authenticate,
  projectModule.createNewOrganization
);
router.post("/web/project", authenticate, projectModule.createNewProject);
router.delete("/web/project", authenticate, projectModule.deleteProject);

export default router;
