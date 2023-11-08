const path = require("path");

// Our declared runner types support replacements to certain variables as needed
// so that we can ensure we are running this exactly as expected.
// Supported Replacements:
// - filePath: The path to the file we are intending to run
// - rootFolderOnly: The root folder of the current file we are intending to run
const runnerTypes = {
  "js": "node %filePath%",
  "python": "python %filePath%",
  "go": "go run %filePath%",
  "powershell": "powershell -file %filePath%",
  "coffee": "coffee %filePath%",
  "shell": "bash %filePath%",
  "ruby": "ruby %filePath%",
  "perl": "perl %filePath%",
  "perl6": "perl %filePath%",
  "swift": "swift run %rootFolderOnly%"
};

const extensionsToRunners = {
  ".js": "js",
  ".py": "python",
  ".coffee": "coffee",
  ".ps1": "powershell",
  ".go": "go",
  ".swift": "swift"
};

function findRunner() {
  let grammar = atom.workspace.getActiveTextEditor().getGrammar().scopeName.replace("source.", "");

  if (runnerTypes[grammar]) {
    return runnerTypes[grammar];
  }

  let ext = path.extname(atom.workspace.getActiveTextEditor().getPath());

  if (extensionsToRunners[ext]) {
    let runner = extensionsToRunners[ext];
    if (runnerTypes[runner]) {
      return runnerTypes[runner];
    }
  }

  // TODO other methods of detection
  return;
}

module.exports = {
  findRunner,
};
