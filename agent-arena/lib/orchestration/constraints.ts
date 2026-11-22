/** Shared by the composer (browser) and the orchestrator. No Node imports here. */
export const DEFAULT_CONSTRAINTS = `Work only inside the current directory. It is a fresh git repository prepared for you.
Do not push, publish, deploy or open pull requests.
Do not read or modify files outside this directory.
If the task is a web app, make it runnable with a package.json "dev" or "start" script, or a static index.html.
When you finish, reply with a short summary of what you built and anything left undone.`;
