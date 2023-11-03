const { CompositeDisposable } = require("atom");

module.exports =
class PulsarRunnerView {
  constructor() {
    this.ids = [];
    this.disposables = new CompositeDisposable();
    // Create root element
    this.element = document.createElement("div");
    this.element.classList.add("pulsar-runner");
    this.registerScrollCommands();
  }

  destroy() {
    this.disposables.dispose();
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  getTitle() {
    return "Pulsar Runner";
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
