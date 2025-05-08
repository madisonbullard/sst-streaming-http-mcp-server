# sst-streaming-http-mcp-server
This is an SST monorepo that deploys an AWS Lambda and Cloudfront distribution for MCP streaming HTTP servers. Currently this doesn't include auth.

## Setup
- Use `.env.example` to create your own `.env` file
- `bun install`
- `bun dev` to launch SST dev mode
- `bun deploy` to deploy

## Using MCP Inspector (@modelcontextprotocol/inspector)
- `bun dev` to launch SST dev mode
- `bun mcp-inspect` to launch MCP Inspector
- Launch the UI in the browser at http://127.0.0.1:6274
- Select Transport Type: Streamable HTTP
- Input the URL to the MCP server
  - This will be the URL of the API Router that you deployed, displayed in `bun dev` output.
  - Append the proper routing to the `/mcp` endpoint: `{CLOUDFRONT_URL_FROM_SST}/mcp/test-server/mcp`

## Coding style
- Ensure `bun typecheck` and `bun check` pass. You can run `bun fix` to format the code.
  - To use the git hooks in the repo's `.githooks` folder, which will save you from waiting for CI to tell you that you forgot to these commands, run this:
    ```bash
    git config core.hookspath .githooks
    ```
