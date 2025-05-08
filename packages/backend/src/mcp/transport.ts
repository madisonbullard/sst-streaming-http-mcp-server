import { randomUUID } from "node:crypto";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ErrorCodes, VisibleError } from "../util/error";

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

export async function getOrCreateTransport({
	sessionId,
	server,
	isInitializeRequest = false,
}: {
	sessionId?: string;
	server: McpServer;
	isInitializeRequest?: boolean;
}) {
	let transport: StreamableHTTPServerTransport;

	if (sessionId && transports[sessionId]) {
		// Reuse existing transport
		transport = transports[sessionId];
	} else if (!sessionId && isInitializeRequest) {
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

		try {
			// Connect to the MCP server
			await server.connect(transport);

			// Added for extra debuggability
			transport.onerror = console.error.bind(console);
		} catch (error) {
			console.error(error);
			throw new VisibleError(
				"internal",
				ErrorCodes.Server.INTERNAL_ERROR,
				"Internal server error",
			);
		}
	} else {
		// Invalid request
		throw new VisibleError(
			"validation",
			ErrorCodes.Validation.INVALID_PARAMETER,
			"Invalid request: No valid session ID provided",
		);
	}

	// Handle the request
	return transport;
}
