import subProcess from "child_process";

export async function runTSC(): Promise<string[]> {
  const errorsArray: string[] = [];
  return new Promise((resolve, reject) => {
    // TODO: possibly swap this with https://github.com/actions/toolkit/tree/main/packages/exec
    const child = subProcess.spawn("yarn", ["tsc", "--noEmit"], {
      cwd: "../",
    }); // TODO: verify the wd when this runs.

    child.stdout.on("data", (data) => {
      console.log("stdout data", data?.toString());
      if (data.includes("error TS")) {
        errorsArray.push(data?.toString());
      }
    });

    child.stderr.on("data", (data) => {
      console.log("stderr data", data?.toString());
      if (data.includes("error TS")) {
        errorsArray.push(data?.toString());
      }
    });

    child.on("error", (error) => {
      console.error(`error: ${error.message}`);
      reject();
    });

    child.on("close", (code) => {
      resolve(errorsArray);
    });
  });
}
