# streaming-http-mcp-server-lambda

## Setup
- Use `.env.example` to create your own `.env` file
- `bun install`
- `bun dev` to launch SST dev mode
- `bun deploy` to deploy

## Coding style
- Ensure `bun typecheck` and `bun check` pass. You can run `bun fix` to format the code.
  - To use the git hooks in the repo's `.githooks` folder, which will save you from waiting for CI to tell you that you forgot to these commands, run this:
    ```bash
    git config core.hookspath .githooks
    ```
