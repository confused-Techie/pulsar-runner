const cp = require("child_process");
const { performance } = require("perf_hooks");

// Our declared runner types support replacements to certain variables as needed
// so that we can ensure we are running this exactly as expected.
// Supported Replacements:
// - filePath: The path to the file we are intending to run
const runnerTypes = {
  "js": "node %filePath%"
};

module.exports =
function run() {
  let setupStart = performance.now();

  let filePath = atom.workspace.getActiveTextEditor().getPath();
  let runnerCmd = findLanguage();

  if (typeof runnerCmd !== "string") {
    atom.notifications.addError(
      "Pulsar Runner was unable to find a runner for this file type.",
      {
        dismissable: true
      }
    );
    return;
  }

  // TODO: Find the path matching the file we are running
  // among all directories, don't assume the first
  let cwd = atom.project.getDirectories()[0].realPath;

  const opts = {
    cwd: cwd,
    timeout: 300000 // TODO: Use config
  };

  let runnerCmdArr = runnerCmd.split(" ");

  for (let i = 0; i < runnerCmdArr.length; i++) {
    // Preform any replacements needed
    if (runnerCmdArr[i] === "%filePath%") {
      runnerCmdArr[i] = filePath;
    }
  }

  let runnerCmdApp = runnerCmdArr[0];
  // Remove the app now from the array
  runnerCmdArr.shift();

  let setupEnd = performance.now();
  let commandStart = performance.now();

  const command = cp.spawnSync(runnerCmdApp, runnerCmdArr, opts);

  let output = {
    setup: {
      detectedRunner: runnerCmdApp,
      elapsedTime: setupEnd - setupStart,
      cwd: cwd,
      args: runnerCmdArr,
      commandOpts: opts,
      filePath: filePath
    },
    command: {
      elapsedTime: performance.now() - commandStart,
      pid: command.pid,
      signal: command.signal,
      status: command.status,
      error: command.error,
      output: convertUint8ArrayToString(command.output),
      stderr: convertUint8ArrayToString(command.stderr),
      stdout: convertUint8ArrayToString(command.stdout)
    }
  };

  return output;
}

function findLanguage() {
  let grammar = atom.workspace.getActiveTextEditor().getGrammar().scopeName.replace("source.", "");

  if (runnerTypes[grammar]) {
    return runnerTypes[grammar];
  }

  // TODO other methods of detection
}

function convertUint8ArrayToString(data) {
  if (Array.isArray(data)) {
    // This is a multi dimensional array, lets get recursive
    let outputText = "";

    for (let i = 0; i < data.length; i++) {
      outputText += convertUint8ArrayToString(data[i]);
    }

    return outputText;
  }

  if (!data || data.length === 0) {
    return "\n";
  } else {
    return data.toString();
  }
}
