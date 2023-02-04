import * as core from "@actions/core";
import * as github from "@actions/github";

async function run(): Promise<void> {
  // `who-to-greet` input defined in action metadata file
  const userId = core.getInput("user-id");
  const token = core.getInput("token");
  console.log(`Hello ${userId} ${token}!`);

  core.setOutput("errors-list", ["err1", "err2"]);
  // Get the JSON webhook payload for the event that triggered the workflow
  // const payload = JSON.stringify(github.context.payload, undefined, 2);
  // console.log(`The event payload: ${payload}`);
}

try {
  run();
} catch (e) {
  if (e instanceof Error) core.setFailed(e.message);
}
