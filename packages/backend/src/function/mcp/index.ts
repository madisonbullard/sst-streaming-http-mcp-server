import { Hono } from "hono";
import { TestServerApi } from "../../api/mcp/test-server";

export const McpRoutes = new Hono().route(
	"/test-server/mcp",
	TestServerApi.route,
);
