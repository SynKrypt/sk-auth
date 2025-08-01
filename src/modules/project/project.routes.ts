import Router from "express";
import { authenticate } from "@/middlewares/auth.middleware.ts";
import ProjectModule from "./project.module.ts";

const router = Router();
const projectModule = new ProjectModule();
const {
  createNewOrganization,
  deleteOrganization,
  createNewProject,
  deleteProject,
} = projectModule;

router.post("/web/organization", authenticate, createNewOrganization);
router.delete("/web/organization", authenticate, deleteOrganization);
router.post("/web", authenticate, createNewProject);
router.delete("/web", authenticate, deleteProject);

export default router;
