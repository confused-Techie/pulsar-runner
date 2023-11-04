const { CompositeDisposable } = require("atom");
const { v4: uuidv4 } = require("uuid");
const run = require("./runner.js");
const PulsarRunnerView = require("./view.js");

const PulsarRunnerViewURI = "atom://pulsar-runner/";

class PulsarRunnerPackage {
  constructor() {
    this.runnerIDs = [];
    this.disposables = new CompositeDisposable();
  }

  activate() {

    this.disposables.add(
      atom.workspace.addOpener(uri => {
        if (uri.startsWith(PulsarRunnerViewURI)) {
          return this.findRunnerView(uri);
        }
      })
    );

    this.disposables.add(
      atom.commands.add("atom-workspace", "run:file", () => {
        this.run();
      })
    );

  }

  deactivate() {
    this.disposables.dispose();
  }

  findRunnerView(uri) {
    let id = uri.replace(PulsarRunnerViewURI, "");

    // Open the right runner ID
    return new PulsarRunnerView();
  }

  run() {
    // TODO: We will want to support keeping runs for the same file
    // while alternatively supporting only unique runs per file
    let runnerObject = {
      id: uuidv4(),
      state: null,
      filepath: atom.workspace.getActiveTextEditor().getPath(),
      file: atom.workspace.getActivePaneItem().getTitle()
    };

    runnerObject.state = run();
    console.log(runnerObject);

    if (runnerObject.state === undefined) {
      // Then it failed to return anything, and should
      // handle itself via a notification error message
      return;
    }

    this.runnerIDs.push(runnerObject);

    let view = new PulsarRunnerView(runnerObject);
    atom.workspace.open(view);
  }

}

module.exports = new PulsarRunnerPackage();
