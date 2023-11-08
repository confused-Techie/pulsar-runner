const runner = require("../src/runner.js");

/*
 * This gave me lots of trouble of inspecting the element
 * after creation. So for the meantime I can at least test the runner return
 */

describe("Pulsar-Runner", () => {

  beforeEach(async () => {
    jasmine.useRealClock();
    await atom.packages.activatePackage("pulsar-runner");
    await atom.packages.activatePackage("language-javascript");
  });

  afterEach(async () => {
    await atom.packages.deactivatePackage("pulsar-runner");
  });

  it("Runs 'node' files", async () => {
    await atom.workspace.open("test.js");

    //atom.commands.dispatch(atom.views.getView(atom.workspace), "run:file");
    let out = runner();

    expect(typeof out.command.elapsedTime === "number").toBe(true);
    expect(typeof out.command.pid === "number").toBe(true);
    expect()

  });
});
