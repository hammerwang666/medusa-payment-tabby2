"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const medusa_1 = require("@medusajs/medusa");
const medusa_core_utils_1 = require("medusa-core-utils");
const store_1 = require("./routes/store");
const admin_1 = require("./routes/admin");
exports.default = (rootDirectory) => {
    // Read currently-loaded medusa config
    const { configModule } = (0, medusa_core_utils_1.getConfigFile)(rootDirectory, "medusa-config");
    const { projectConfig } = configModule;
    // Set up our CORS options objects, based on config
    const storeCorsOptions = {
        origin: projectConfig.store_cors.split(","),
        credentials: true,
    };
    const adminCorsOptions = {
        origin: projectConfig.admin_cors.split(","),
        credentials: true,
    };
    // Set up express router
    const router = (0, express_1.Router)();
    // Set up root routes for store and admin endpoints, with appropriate CORS settings
    router.use("/store", (0, cors_1.default)(storeCorsOptions), body_parser_1.default.json());
    router.use("/admin", (0, cors_1.default)(adminCorsOptions), body_parser_1.default.json());
    // Add authentication to all admin routes *except* auth and account invite ones
    router.use(/\/admin\/((?!auth)(?!invites)(?!users\/reset-password)(?!users\/password-token).*)/, (0, medusa_1.authenticate)());
    // Set up routers for store and admin endpoints
    const storeRouter = (0, express_1.Router)();
    const adminRouter = (0, express_1.Router)();
    // Attach these routers to the root routes
    router.use("/store", storeRouter);
    router.use("/admin", adminRouter);
    // Attach custom routes to these routers
    (0, store_1.attachStoreRoutes)(storeRouter);
    (0, admin_1.attachAdminRoutes)(adminRouter);
    return router;
};
