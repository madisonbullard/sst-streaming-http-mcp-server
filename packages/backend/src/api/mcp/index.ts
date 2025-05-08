import { Hono } from "hono";
import { TestServerApi } from "./test-server";

export const McpRoutes = new Hono().route("/test-server", TestServerApi.route);
