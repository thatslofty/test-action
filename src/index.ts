import * as core from "@actions/core";
import * as github from "@actions/github";
import { exec } from "@actions/exec";
import axios from "axios";
import { runTSC } from "./run-tsc";

async function run(): Promise<void> {
  const user_id = core.getInput("user-id");
  const token = core.getInput("token");
  const githubToken = core.getInput("github-token");
  const action = github.context?.payload?.action;
  await exec("yarn"); // TODO: this needs to work with npm also. Could we just install tsc here without yarn?

  const errorsArray = await runTSC();

  // TODO: possibly swap with https://github.com/actions/toolkit/tree/main/packages/http-client
  const response = await axios.post(
    `https://gh-actions.vercel.app/api/typescript-errors`,
    {
      token,
      user_id,
      action: github.context?.payload?.action,
      branch: github.context.payload.pull_request?.head?.ref,
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
  }

  const newCount = newErrors.length;
  const fixedCount = fixedErrors.length;
  const successMessage = "👍 No New Errors";
  const fixedMessage = `👍 ${fixedCount} Error${
    fixedCount > 1 ? "s" : ""
  } Fixed`;
  const failureMessage = `👎 ${newCount} New Error${
    newCount > 1 ? "s" : ""
  } Added`;

  console.log("payload", github.context.payload);

  const octokit = github.getOctokit(githubToken);
  const { data } = await octokit.rest.checks.listForRef({
    ...github.context.repo,
    ref: github.context?.payload.after,
  });
  const currentCheck = data.check_runs.find(
    (r) => r.name === core.getInput("job-name")
  );
  await octokit.rest.checks.update({
    ...github.context.repo,
    check_run_id: currentCheck?.id,
    conclusion: newErrors.length ? "failure" : "success",
    output: {
      title:
        newCount > 0
          ? failureMessage
          : fixedCount > 0
          ? fixedMessage
          : successMessage,
      summary: `New Errors: ${newCount}, Fixed Errors: ${fixedCount}`,
    },
  });

  if (newErrors.length) {
    core.setFailed(failureMessage);
  }
}

try {
  run();
} catch (e) {
  if (e instanceof Error) core.setFailed(e.message);
}
