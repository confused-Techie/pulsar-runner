
// Our declared runner types support replacements to certain variables as needed
// so that we can ensure we are running this exactly as expected.
// Supported Replacements:
// - filePath: The path to the file we are intending to run
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

function findRunner() {
  let grammar = atom.workspace.getActiveTextEditor().getGrammar().scopeName.replace("source.", "");

  if (runnerTypes[grammar]) {
    return runnerTypes[grammar];
  }

  // TODO other methods of detection
  return;
}

module.exports = {
  findRunner,
};
