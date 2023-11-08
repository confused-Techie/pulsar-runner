const { CompositeDisposable } = require("atom");
const { v4: uuidv4 } = require("uuid");
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
    let runnerForId;

    for (let i = 0; i < this.runnerIDs.length; i++) {
      if (id === this.runnerIDs[i].id) {
        runnerForId = this.runnerIDs[i];
        break;
      }
    }
    return new PulsarRunnerView(runnerForId);
  }

  run() {
    // TODO: We will want to support keeping runs for the same file
    // while alternatively supporting only unique runs per file
    let view = new PulsarRunnerView();

    let runnerObject = {
      id: uuidv4(),
      state: view,
      filepath: atom.workspace.getActiveTextEditor().getPath(),
      file: atom.workspace.getActivePaneItem().getTitle()
    };

    this.runnerIDs.push(runnerObject);

    atom.workspace.open(view);
  }

}

module.exports = new PulsarRunnerPackage();
