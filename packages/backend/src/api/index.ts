import { Hono } from "hono";
import { compress } from "hono/compress";
import { logger } from "hono/logger";
import { McpRoutes } from "../api/mcp";

export const app = new Hono();
app.use("*", logger());
app.use("*", compress());
app.use("*", async (c, next) => {
	await next();
	if (!c.res.headers.get("cache-control")) {
		c.header("cache-control", "no-store, max-age=0, must-revalidate, no-cache");
	}
});

const routes = app.route("/mcp", McpRoutes);

export type AppType = typeof routes;
