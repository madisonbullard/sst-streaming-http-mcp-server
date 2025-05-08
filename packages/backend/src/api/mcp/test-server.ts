import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
	type CallToolResult,
	isInitializeRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { toFetchResponse, toReqRes } from "fetch-to-node";
import { type Context, Hono } from "hono";
import { z } from "zod";
import { McpErrorCodes } from "./common";

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

export namespace TestServerApi {
	export const route = new Hono();

	// Handle POST requests for client-to-server communication
	route.post("/mcp", async (c) => {
		const { req, res } = toReqRes(c.req.raw);

		const headers = c.req.header();
		const sessionId = headers["mcp-session-id"] as string | undefined;

		let transport: StreamableHTTPServerTransport;

		if (sessionId && transports[sessionId]) {
			// Reuse existing transport
			transport = transports[sessionId];
		} else if (!sessionId && isInitializeRequest(req)) {
			// New initialization request
			transport = new StreamableHTTPServerTransport({
				sessionIdGenerator: () => randomUUID(),
				onsessioninitialized: (sessionId) => {
					// Store the transport by session ID
					transports[sessionId] = transport;
				},
			});

			// Clean up transport when closed
			transport.onclose = () => {
				if (transport.sessionId) {
					delete transports[transport.sessionId];
				}
			};

			const server = new McpServer(
				{
					name: "example-server",
					version: "1.0.0",
				},
				{ capabilities: { logging: {} } },
			);

			// Register a tool specifically for testing resumability
			server.tool(
				"start-notification-stream",
				"Starts sending periodic notifications for testing resumability",
				{
					interval: z
						.number()
						.describe("Interval in milliseconds between notifications")
						.default(100),
					count: z
						.number()
						.describe("Number of notifications to send (0 for 100)")
						.default(10),
				},
				async (
					{ interval, count },
					{ sendNotification },
				): Promise<CallToolResult> => {
					const sleep = (ms: number) =>
						new Promise((resolve) => setTimeout(resolve, ms));
					let counter = 0;

					while (count === 0 || counter < count) {
						counter++;
						try {
							await sendNotification({
								method: "notifications/message",
								params: {
									level: "info",
									data: `Periodic notification #${counter} at ${new Date().toISOString()}`,
								},
							});
						} catch (error) {
							console.error("Error sending notification:", error);
						}
						// Wait for the specified interval
						await sleep(interval);
					}

					return {
						content: [
							{
								type: "text",
								text: `Started sending periodic notifications every ${interval}ms`,
							},
						],
					};
				},
			);

			try {
				// Connect to the MCP server
				await server.connect(transport);

				// Added for extra debuggability
				transport.onerror = console.error.bind(console);

				// Handle the request
				await transport.handleRequest(req, res, await c.req.json());

				res.on("close", () => {
					console.log("Request closed");
					transport.close();
					server.close();
				});

				return toFetchResponse(res);
			} catch (error) {
				console.error(error);
				return c.json(
					{
						jsonrpc: "2.0",
						error: {
							code: McpErrorCodes.InternalError,
							message: "Internal server error",
						},
						id: null,
					},
					500,
				);
			}
		} else {
			// Invalid request
			return c.json(
				{
					jsonrpc: "2.0",
					error: {
						code: McpErrorCodes.InvalidRequest,
						message: "Bad Request: No valid session ID provided",
					},
					id: null,
				},
				400,
			);
		}
	});

	// Reusable handler for GET and DELETE requests
	const handleSessionRequest = async (c: Context) => {
		const { req, res } = toReqRes(c.req.raw);
		const headers = c.req.header();
		const sessionId = headers["mcp-session-id"] as string | undefined;

		if (!sessionId || !transports[sessionId]) {
			c.text("Invalid or missing session ID", 400);
			return;
		}

		const transport = transports[sessionId];
		await transport.handleRequest(req, res);
	};

	// Handle GET requests for server-to-client notifications via SSE
	route.get("/mcp", handleSessionRequest);

	// Handle DELETE requests for session termination
	route.delete("/mcp", handleSessionRequest);
}
