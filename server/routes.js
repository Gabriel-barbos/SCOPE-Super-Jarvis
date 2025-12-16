import { Router } from "express";

import clientsRoutes from "./clients/clients.routes.js";
import routinesRoutes from "./routines/routines.routes.js";
import authRoutes from "./auth/auth.routes.js";
import proxyRoutes from "./proxy/proxy.routes.js";

const router = Router();

router.use("/clients", clientsRoutes);
router.use("/routines", routinesRoutes);
router.use("/auth", authRoutes);
router.use("/proxy", proxyRoutes);

export default router;
