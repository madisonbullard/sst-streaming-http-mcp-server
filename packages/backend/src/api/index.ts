import { Hono } from "hono";
import { compress } from "hono/compress";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { McpRoutes } from "../api/mcp";
import { ErrorCodes, VisibleError } from "../util/error";

export const app = new Hono();
app.use("*", logger());
app.use("*", compress());
app.use("*", async (c, next) => {
	await next();
	if (!c.res.headers.get("cache-control")) {
		c.header("cache-control", "no-store, max-age=0, must-revalidate, no-cache");
	}
});

const routes = app.route("/mcp", McpRoutes).onError((error, c) => {
	// Handle our custom VisibleError
	if (error instanceof VisibleError) {
		// @ts-expect-error
		return c.json(error.toResponse(), error.statusCode());
	}

	// Handle HTTP exceptions
	if (error instanceof HTTPException) {
		console.error("http error:", error);
		return c.json(
			{
				type: "validation",
				code: ErrorCodes.Validation.INVALID_PARAMETER,
				message: "Invalid request",
			},
			400,
		);
	}

	// Handle any other errors as internal server errors
	console.error("unhandled error:", error);
	return c.json(
		{
			type: "internal",
			code: ErrorCodes.Server.INTERNAL_ERROR,
			message: "Internal server error",
		},
		500,
	);
});

export type AppType = typeof routes;
