const { CompositeDisposable } = require("atom");

module.exports =
class PulsarRunnerView {
  constructor(state) {
    this.state = state;
    this.disposables = new CompositeDisposable();
    this.title = `${this.state.file} - Pulsar Runner`;
    // Create root element
    this.element = null;
    this.setupRootElement();
    this.registerScrollCommands();
    this.generatePane();
  }

  destroy() {
    this.disposables.dispose();
    this.element.remove();
  }

  setupRootElement() {
    this.element = document.createElement("div");
    this.element.classList.add("pulsar-runner");
  }

  generatePane() {
    // Setup Summary Element
    let summaryEle = document.createElement("div");
    summaryEle.classList.add("summary");

    let statusEle = document.createElement("span");
    statusEle.classList.add("status");

    let exitCode = this.state.state.command.status;
    if (exitCode === 0) {
      statusEle.textContent = "Completed Successfully";
      statusEle.classList.add("inline-block", "highlight-success");
    } else {
      statusEle.textContent = `Failed with Exit Code: ${exitCode}`;
      statusEle.classList.add("inline-block", "highlight-error");
    }

    let timeEle = document.createElement("span");
    timeEle.classList.add("time");
    timeEle.textContent = `Ran in ${this.getTotalTime()}ms`;

    summaryEle.appendChild(statusEle);
    summaryEle.appendChild(timeEle);

    this.element.appendChild(summaryEle);

    // Generic Logs Element
    let cmdEle = document.createElement("div");
    cmdEle.classList.add("logs");

    // Setup Logs Element
    let cmdSetupEle = document.createElement("details");
    cmdSetupEle.classList.add("setup");

    let cmdSetupSummaryEle = document.createElement("summary");
    cmdSetupSummaryEle.textContent = "Set Up Runner";

    cmdSetupEle.appendChild(cmdSetupSummaryEle);

    cmdSetupEle.appendChild(
      this.createPrettyOutputDom(this.state.state.setup)
    );

    cmdEle.appendChild(cmdSetupEle);

    // Command Logs Element
    let cmdCommandEle = document.createElement("details");
    cmdCommandEle.classList.add("command");

    let cmdCommandSummaryEle = document.createElement("summary");
    cmdCommandSummaryEle.textContent = "Run File";

    cmdCommandEle.appendChild(cmdCommandSummaryEle);

    cmdCommandEle.appendChild(
      this.createPrettyOutputDom(this.state.state.command.output)
    );

    cmdEle.appendChild(cmdCommandEle);

    // Add all elements
    this.element.appendChild(cmdEle);
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
    let totalTime = this.state.state.setup.elapsedTime + this.state.state.command.elapsedTime;
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
