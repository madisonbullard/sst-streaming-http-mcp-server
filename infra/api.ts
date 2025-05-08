const api = new sst.aws.Function("Api", {
	url: true,
	streaming: !$dev,
	handler: "./packages/backend/src/function/api.handler",
});

export const apiRouter = new sst.aws.Router("ApiRouter", {
	routes: { "/*": api.url },
});
