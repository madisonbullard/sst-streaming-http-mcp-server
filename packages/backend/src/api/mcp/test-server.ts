import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { toFetchResponse, toReqRes } from "fetch-to-node";
import { type Context, Hono } from "hono";
import { server as testServer } from "../../mcp/servers/test-server";
import { getOrCreateTransport } from "../../mcp/transport";

export namespace TestServerApi {
	export const route = new Hono();

	// Handle POST requests for client-to-server communication
	route.post("/mcp", async (c) => {
		const { req, res } = toReqRes(c.req.raw);

		const headers = c.req.header();
		const sessionId = headers["mcp-session-id"] as string | undefined;

		const transport = await getOrCreateTransport({
			sessionId,
			server: testServer,
			isInitializeRequest: isInitializeRequest(await c.req.json()),
		});

		res.on("close", () => {
			console.log("Request closed");
			transport.close();
			testServer.close();
		});

		// Handle the request
		await transport.handleRequest(req, res, await c.req.json());

		return toFetchResponse(res);
	});

	// Reusable handler for GET and DELETE requests
	const handleSessionRequest = async (c: Context) => {
		const { req, res } = toReqRes(c.req.raw);
		const headers = c.req.header();
		const sessionId = headers["mcp-session-id"] as string | undefined;

		const transport = await getOrCreateTransport({
			sessionId,
			server: testServer,
		});

		res.on("close", () => {
			console.log("Request closed");
			transport.close();
			testServer.close();
		});

		await transport.handleRequest(req, res);
	};

	// Handle GET requests for server-to-client notifications via SSE
	route.get("/mcp", handleSessionRequest);

	// Handle DELETE requests for session termination
	route.delete("/mcp", handleSessionRequest);
}
