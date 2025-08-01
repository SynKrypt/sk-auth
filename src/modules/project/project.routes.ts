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
  getOrganization,
  getProject,
} = projectModule;

router.post("/web/organization", authenticate, createNewOrganization);
router.get("/web/organization", authenticate, getOrganization);
router.delete("/web/organization", authenticate, deleteOrganization);
router.post("/web", authenticate, createNewProject);
router.get("/web", authenticate, getProject);
router.delete("/web", authenticate, deleteProject);

export default router;
