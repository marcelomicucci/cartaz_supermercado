const { app, BrowserWindow } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

app.commandLine.appendSwitch("disable-gpu");

async function capturePoster() {
  const window = new BrowserWindow({
    width: 1280,
    height: 1600,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  await window.loadFile(path.join(__dirname, "..", "index.html"));
  const result = await window.webContents.executeJavaScript(`(async () => {
    const values = {
      headline: "OFERTA ESPECIAL",
      product: "CAFÉ",
      detail: "TRADICIONAL",
      unit: "PACOTE 500G",
      price: "18,99",
      suffix: "/UN",
      dateText: "VÁLIDO ATÉ 30/11",
      textBlockY: "14",
      headlineSize: "95",
      productSize: "145",
      detailSize: "110",
      unitSize: "115",
      priceMainSize: "105",
      centsSize: "115",
      suffixSize: "115"
    };

    for (const [id, value] of Object.entries(values)) {
      const field = document.getElementById(id);
      field.value = value;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }

    render();

    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const paper = document.getElementById("paper");
    const rect = paper.getBoundingClientRect();
    return {
      bounds: {
        x: Math.max(0, Math.floor(rect.x)),
        y: Math.max(0, Math.floor(rect.y)),
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height)
      },
      state: {
        headline: document.getElementById("headlinePreview").textContent,
        product: document.getElementById("productPreview").textContent,
        price: document.querySelector(".price-main").textContent
      }
    };
  })()`);

  console.log("Cartaz capturado:", result.state, result.bounds);
  await new Promise(resolve => setTimeout(resolve, 500));
  const image = await window.webContents.capturePage(result.bounds);
  const outputDir = path.join(__dirname, "..", "docs");
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "cartaz-pronto.png"), image.toPNG());
  window.destroy();
}

app.whenReady()
  .then(capturePoster)
  .then(() => app.quit())
  .catch(error => {
    console.error(error);
    app.exit(1);
  });
