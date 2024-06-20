"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachStoreRoutes = void 0;
const express_1 = require("express");
const custom_route_handler_1 = __importDefault(require("./custom-route-handler"));
const medusa_1 = require("@medusajs/medusa");
// Initialize a custom router
const router = (0, express_1.Router)();
function attachStoreRoutes(storeRouter) {
    // Attach our router to a custom path on the store router
    storeRouter.use("/custom", router);
    // Define a GET endpoint on the root route of our custom path
    router.get("/", (0, medusa_1.wrapHandler)(custom_route_handler_1.default));
}
exports.attachStoreRoutes = attachStoreRoutes;
