const { CompositeDisposable } = require("atom");
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
    const runnerOutput = run();
    console.log("runnerOutput");
    console.log(runnerOutput);
    // normally we would want to generate a unique ID,
    // run the file
    // assign the output to an object with said ID,
    // then open the view with said output, but for now lets make things easy
    atom.workspace.open(PulsarRunnerViewURI);
  }

}

module.exports = new PulsarRunnerPackage();
