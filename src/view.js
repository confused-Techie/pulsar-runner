const { CompositeDisposable } = require("atom");
const cp = require("child_process");
const { performance } = require("perf_hooks");
const path = require("path");
const process = require("process");
const runner = require("./runner.js");

module.exports =
class PulsarRunnerView {
  constructor(view) {
    this.disposables = new CompositeDisposable();
    this.file = view?.file ?? atom.workspace.getActivePaneItem().getTitle();
    this.filepath = view?.filepath ?? atom.workspace.getActiveTextEditor().getPath();
    this.title = view?.title ?? `${this.file} - Pulsar Runner`;

    // Create root element
    this.element = null;
    this.setupRootElement();
    this.registerScrollCommands();

    // Components
    this.comps = {
      statusComp: null,
      timeComp: null,
      loaderComp: null,
      setupCmd: null,
      setupSummary: null,
      commandCmd: null,
      commandSummary: null,
      commandOutput: null
    };

    if (view?.comps) {
      this.comps = view.comps;
    }

    // Command Items
    this.setupStartTime = 0;
    this.commandStartTime = 0;
    this.cli;
    this.state = {
      setup: {
        elapsedTime: 0,
        detectedRunner: "",
        cwd: "",
        args: null,
        filePath: "",
        opts: null
      },
      command: {
        elapsedTime: 0,
        status: 0,
        error: "",
        stderr: "",
        stdout: "",
        output: ""
      }
    };

    this.setupRootPane();

    if (view?.state) {
      this.state = view.state;
      this.redrawSetupElement();
      this.redrawCommandElement();
      this.redrawSummaryElement();
    } else {
      this.setupSpawn();
    }
  }

  destroy() {
    if (typeof this.cli?.abort === "function") {
      // Ensures that closing the panel to a running process will kill it
      this.cli.abort();
    }
    this.disposables.dispose();
    this.element.remove();
  }

  setupSpawn() {
    this.setupStartTime = performance.now();

    let filePath = atom.workspace.getActiveTextEditor().getPath();
    let runnerCmd = runner.findRunner();

    if (typeof runnerCmd !== "string") {
      this.state.setup.detectedRunner = "not_identified";
      this.state.command.output = "Unable to identify the runner to use.";
      this.state.command.status = 1;
      this.redrawSetupElement();
      this.redrawCommandElement();
      this.redrawSummaryElement();
      return;
    }

    // TODO: Find the path matching the file we are running, among all directories,
    // don't assume the first
    let cwd = atom.project.getDirectories()[0].realPath;

    const controller = new AbortController();
    const { signal } = controller;

    const opts = {
      cwd: cwd,
      shell: true,
      timeout: atom.config.get("pulsar-runner.commandTimeout"),
      signal: signal
    };

    let runnerCmdArr = runnerCmd.split(" ");

    for (let i = 0; i < runnerCmdArr.length; i++) {
      // preform any replacements that are supported
      if (runnerCmdArr[i] === "%filePath%") {
        runnerCmdArr[i] = `"${filePath}"`;
      }
      if (runnerCmdArr[i] === "%rootFolderOnly%") {
        runnerCmdArr[i] = `${path.basename(path.dirname(filePath))}`;
      }
    }

    let runnerCmdApp = runnerCmdArr[0];
    // Remove the app now from the array
    runnerCmdArr.shift();

    this.state.setup.elapsedTime = performance.now() - this.setupStartTime;
    this.state.setup.cwd = cwd;
    this.state.setup.opts = opts;
    this.state.setup.args = runnerCmdArr;
    this.state.setup.filePath = filePath;
    this.state.setup.detectedRunner = runnerCmdApp;

    this.redrawSetupElement();

    this.commandStartTime = performance.now();

    this.cli = cp.spawn(runnerCmdApp, runnerCmdArr, opts);

    this.cli.stdout.on("data", (data) => {
      this.state.command.stdout += data.toString();
      this.state.command.output += data.toString();
      this.redrawCommandElement();
    });

    this.cli.stderr.on("data", (data) => {
      this.state.command.stderr += data.toString();
      this.state.command.output += data.toString();
      this.redrawCommandElement();
    });

    this.cli.on("error", (err) => {
      this.state.command.error = err;
      this.state.command.output += err;
      this.state.command.elapsedTime = performance.now() - this.commandStartTime;
      this.redrawCommandElement();
      this.redrawSummaryElement();
    });

    this.cli.on("close", (code) => {
      this.state.command.status = code;
      this.state.command.elapsedTime = performance.now() - this.commandStartTime;
      this.redrawCommandElement();
      this.redrawSummaryElement();
    });
  }

  setupRootElement() {
    this.element = document.createElement("div");
    this.element.classList.add("pulsar-runner");
  }

  setupRootPane() {
    // Setup Summary Element
    let summaryEle = document.createElement("div");
    summaryEle.classList.add("summary");

    this.comps.statusComp = document.createElement("span");
    this.comps.statusComp.classList.add("status");
    this.comps.textContent = "In Progress...";

    this.comps.loaderComp = document.createElement("div");
    this.comps.loaderComp.classList.add("block");
    let prog = document.createElement("progress");
    prog.classList.add("inline-block");
    this.comps.loaderComp.appendChild(prog);

    this.comps.timeComp = document.createElement("span");
    this.comps.timeComp.classList.add("time");
    this.comps.timeComp.textContent = "...";

    summaryEle.appendChild(this.comps.loaderComp);
    summaryEle.appendChild(this.comps.statusComp);
    summaryEle.appendChild(this.comps.timeComp);

    this.element.appendChild(summaryEle);

    // Setup Generic Logs Element
    let cmdEle = document.createElement("div");
    cmdEle.classList.add("logs");

    // Setup the Setup Element
    this.comps.setupCmd = document.createElement("details");
    this.comps.setupCmd.classList.add("setup");

    this.comps.setupSummary = document.createElement("summary");
    this.comps.setupSummary.textContent = "Set Up Runner - ...";

    this.comps.setupCmd.appendChild(this.comps.setupSummary);

    cmdEle.appendChild(this.comps.setupCmd);

    // Setup the Command Element
    this.comps.commandCmd = document.createElement("details");
    this.comps.commandCmd.open = true;
    this.comps.commandCmd.classList.add("command");

    this.comps.commandSummary = document.createElement("summary");
    this.comps.commandSummary.textContent = "Run File - ...";

    this.comps.commandCmd.appendChild(this.comps.commandSummary);

    cmdEle.appendChild(this.comps.commandCmd);

    // Attach command to main element
    this.element.appendChild(cmdEle);
  }

  redrawSummaryElement() {
    //this.element.removeNode(this.comps.loaderComp);
    this.comps.loaderComp.remove();

    if (typeof this.state.setup.elapsedTime === "number" && typeof this.state.command.elapsedTime === "number") {
      this.comps.timeComp.textContent = `Run in ${this.getTotalTime()}ms Total`;
      // If we have a total time we can safely assume the exit code should be available
      let exitCode = this.state.command.status;
      if (exitCode === 0) {
        this.comps.statusComp.textContent = "Completed Successfully";
        this.comps.statusComp.classList.add("inline-block", "highlight-success");
      } else if (typeof exitCode === "number") {
        this.comps.statusComp.textContent = `Failed with Exit Code: ${exitCode}`;
        this.comps.statusComp.classList.add("inline-block", "highlight-error");
      } else if (typeof this.state.command.error?.code === "string") {
        this.comps.statusComp.textContent = `Failed with Error: ${this.state.command.error.code}`;
        this.comps.statusComp.classList.add("inline-block", "highlight-error");
      } else {
        this.comps.statusComp.textContent = `Seems to have failed.`;
        this.comps.statusComp.classList.add("inline-block", "highlight-error");
      }
    }
  }

  redrawSetupElement() {
    if (typeof this.state.setup.elapsedTime === "number") {
      this.comps.setupSummary.textContent = `Setup Up Runner - ${this.state.setup.elapsedTime.toFixed(2)}ms`;
      // If we have an elapsed time, it's safe to assume we have all other variables we will get
      this.comps.setupCmd.appendChild(this.createPrettyOutputDom(this.state.setup));
    }
  }

  redrawCommandElement() {
    if (typeof this.state.command.elapsedTime === "number") {
      this.comps.commandSummary.textContent = `Run File - ${this.state.command.elapsedTime.toFixed(2)}ms`;
    }
    // Then we will draw the inner text no matter what
    if (this.comps.commandOutput !== null) {
      // This isn't the first set of data being drawn. Replace the existing HTML Node
      // of data with new
      let prev = this.comps.commandOutput;
      this.comps.commandOutput = this.createPrettyOutputDom(this.state.command.output);
      this.comps.commandCmd.replaceChild(this.comps.commandOutput, prev);
    } else {
      // This is the first set of data being drawn
      this.comps.commandOutput = this.createPrettyOutputDom(this.state.command.output);
      this.comps.commandCmd.appendChild(this.comps.commandOutput);
    }
  }

  createPrettyOutputDom(item) {
    // This may receive a string of data or may receive a JSON object
    if (typeof item === "string") {
      let items = item.split("\n");

      let ele = document.createElement("div");
      ele.classList.add("console");

      for (let i = 0; i < items.length; i++) {
        let itemEle = document.createElement("div");
        itemEle.classList.add("line_number");
        itemEle.textContent = i;
        let itemText = document.createElement("span");
        itemText.classList.add("line_content");
        itemText.textContent = items[i];

        let itemContainer = document.createElement("div");
        itemContainer.appendChild(itemEle);
        itemContainer.appendChild(itemText);
        itemContainer.classList.add("line");

        ele.appendChild(itemContainer);
      }

      return ele;
    } else {
      // We will assume this is JSON data
      let data = JSON.stringify(item, null, 2);
      return this.createPrettyOutputDom(data);
    }
  }

  getTotalTime() {
    let totalTime = this.state.setup.elapsedTime + this.state.command.elapsedTime;
    return totalTime.toFixed(2);
  }

  getElement() {
    return this.element;
  }

  getTitle() {
    return this.title ?? "Pulsar Runner";
  }

  getLongTitle() {
    return `${this.state.file} - ${this.state.id} - Pulsar Runner`;
  }

  getDefaultLocation() {
    return "right";
  }

  registerScrollCommands() {
    this.disposables.add(
      atom.commands.add(this.element, {
        "core:move-up": () => {
          this.element.scrollTop == document.body.offsetHeight / 20;
        },
        "core:move-down": () => {
          this.element.scrollTop += document.body.offsetHeight / 20;
        },
        "core:page-up": () => {
          this.element.scrollTop -= this.element.offsetHeight;
        },
        "core:page-down": () => {
          this.element.scrollTop += this.element.offsetHeight;
        },
        "core:move-to-top": () => {
          this.element.scrollTop = 0;
        },
        "core:move-to-bottom": () => {
          this.element.scrollTop = this.element.scrollHeight;
        }
      })
    );
  }

}
