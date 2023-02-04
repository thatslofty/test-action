import * as core from "@actions/core";
// import * as github from "@actions/github";
import axios from "axios";

async function run(): Promise<void> {
  // `who-to-greet` input defined in action metadata file
  const userId = core.getInput("user-id");
  const token = core.getInput("token");
  console.log(`Hello ${userId} ${token}!`);

  const response = await axios.get(
    `https://gh-actions.vercel.app/api/hello?userId=${userId}&token=${token}`
  );

  core.setOutput("errors-list", response);
  // Get the JSON webhook payload for the event that triggered the workflow
  // const payload = JSON.stringify(github.context.payload, undefined, 2);
  // console.log(`The event payload: ${payload}`);
}

try {
  run();
} catch (e) {
  if (e instanceof Error) core.setFailed(e.message);
}
