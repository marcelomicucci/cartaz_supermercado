const { app, BrowserWindow, session } = require("electron");
const path = require("node:path");

app.commandLine.appendSwitch("disable-gpu");
if (process.platform === "linux") {
  app.commandLine.appendSwitch("no-sandbox");
}

async function runSmokeTest() {
  await session.defaultSession.clearStorageData({ storages: ["localstorage"] });

  const window = new BrowserWindow({
    width: 1280,
    height: 900,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  await window.loadFile(path.join(__dirname, "..", "index.html"));
  const result = await window.webContents.executeJavaScript(`(async () => {
    const setField = (id, value) => {
      const field = document.getElementById(id);
      field.value = value;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    };

    setField("product", "ARROZ");
    setField("price", "22,50");
    document.getElementById("saveTemplateShortcut").click();
    setField("templateName", "Oferta de arroz");
    document.getElementById("saveTemplateButton").click();

    window.dispatchEvent(new Event("beforeprint"));
    const hasPageRule = [...document.styleSheets]
      .flatMap(sheet => [...sheet.cssRules])
      .some(rule => rule.cssText.startsWith("@page"));
    window.dispatchEvent(new Event("afterprint"));

    await document.fonts.ready;
    return {
      product: document.getElementById("productPreview").textContent,
      price: document.querySelector(".price-main").textContent + document.querySelector(".price-cents").textContent,
      templateCount: document.querySelectorAll("#templateList .management-card").length,
      hasPageRule,
      fontLoaded: document.fonts.check('24px "Oferta do Dia"')
    };
  })()`);

  const expected = {
    product: "ARROZ",
    price: "22,50",
    templateCount: 1,
    hasPageRule: true,
    fontLoaded: true
  };

  for (const [key, value] of Object.entries(expected)) {
    if (result[key] !== value) {
      throw new Error(`${key}: esperado ${JSON.stringify(value)}, recebido ${JSON.stringify(result[key])}`);
    }
  }

  console.log("Smoke test concluído:", result);
  window.destroy();
}

app.whenReady()
  .then(runSmokeTest)
  .then(() => app.quit())
  .catch(error => {
    console.error(error);
    app.exit(1);
  });
