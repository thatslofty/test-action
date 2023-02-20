import * as core from "@actions/core";
import * as github from "@actions/github";
import { exec } from "@actions/exec";
import axios from "axios";
import { runTSC } from "./run-tsc";

async function run(): Promise<void> {
  const user_id = core.getInput("user-id");
  const token = core.getInput("token");
  await exec("yarn"); // TODO: this needs to work with npm also. Could we just install tsc here without yarn?
  // console.log("context", JSON.stringify(github.context));
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
      action: github.context?.payload?.action,
      branch: github.context.payload.pull_request?.head?.ref, // TODO: temp
      base_branch: github.context.payload.pull_request?.base?.ref,
      errors: errorsArray,
    }
  );

  const newErrors = response.data?.newErrors ?? [];
  const fixedErrors = response.data?.fixedErrors ?? [];
  if (newErrors.length) {
    // build annotations in code for newErrors
    newErrors.forEach((err: any) => {
      core.error("New TS Error", {
        file: err.path,
        startLine: err.line,
        startColumn: err.col,
        title: err.message,
      });
    });

    const count = newErrors.length;
    core.setFailed(`${count} New Error${count > 1 ? "s" : ""} Added`);
  }
  // else if (fixedErrors.length) {
  //   const count = fixedErrors.length;
  //   core.setOutput(`${count} New Error${count > 1 ? "s" : ""} Added`);
  // }

  console.log("response", response.data);

  // TODO: post new errors in github
}

try {
  run();
} catch (e) {
  if (e instanceof Error) core.setFailed(e.message);
}
