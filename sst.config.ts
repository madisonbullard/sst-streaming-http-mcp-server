/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
	app(input) {
		return {
			name: "sst-streaming-http-mcp-server",
			removal: input?.stage === "production" ? "retain" : "remove",
			protect: ["production"].includes(input?.stage),
			home: "aws",
		};
	},
	async run() {
		const { apiRouter } = await import("./infra/api");

		return {
			api: apiRouter.url,
		};
	},
});
