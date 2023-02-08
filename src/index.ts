import * as core from "@actions/core";
import * as github from "@actions/github";
import axios from "axios";
import { runTSC } from "./run-tsc";

async function run(): Promise<void> {
  const user_id = core.getInput("user-id");
  const token = core.getInput("token");
  console.log("context", JSON.stringify(github.context));
  // const branch = core.getInput("base-branch");
  // const errorsArray: string[] = [];

  // const response = await axios.get(
  //   `https://gh-actions.vercel.app/api/hello?userId=${userId}&token=${token}`
  // );

  // console.log(response);

  // core.setOutput("errors-list", response.data?.status);
  // Get the JSON webhook payload for the event that triggered the workflow
  // const payload = JSON.stringify(github.context.payload, undefined, 2);
  // console.log(`The event payload: ${payload}`);

  const errorsArray = await runTSC();
  console.log(errorsArray);

  // TODO: possibly swap with https://github.com/actions/toolkit/tree/main/packages/http-client
  const response = await axios.post(
    `https://gh-actions.vercel.app/api/typescript-errors`,
    {
      token,
      user_id,
      branch: "develop", // TODO: temp
      errors: [
        "pages/api/helloFriends.ts(36,18): error TS7006: Parameter 'thing' implicitly has an 'any' type.\n",
      ],
    }
  );

  console.log("response", JSON.stringify(response));

  // TODO: send errors list to api
  // TODO: post new errors in github as comment
}

try {
  run();
} catch (e) {
  if (e instanceof Error) core.setFailed(e.message);
}
