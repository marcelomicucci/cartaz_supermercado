const STORAGE = {
  media: "cartaz-facil-media-v2",
  templates: "cartaz-facil-templates-v2",
  state: "cartaz-facil-state-v2"
};

const defaultMedia = [
  {
    id: "a4-vertical",
    name: "A4 Oferta Vertical",
    width: 210,
    height: 297,
    margins: { top: 45, right: 15, bottom: 18, left: 15 },
    artStyle: "portrait"
  },
  {
    id: "a4-paisagem",
    name: "A4 Explosão Paisagem",
    width: 297,
    height: 210,
    margins: { top: 28, right: 25, bottom: 20, left: 35 },
    artStyle: "burst"
  }
];

const defaults = {
  mediaId: "a4-vertical",
  artStyle: "portrait",
  headline: "LEITE EM PÓ",
  product: "NINHO",
  detail: "INSTANTÂNEO",
  unit: "LATA 380G",
  price: "13,99",
  suffix: "",
  dateText: "",
  offsetX: 0,
  offsetY: 0,
  textBlockY: 0,
  priceBlockY: 0,
  scale: 100,
  headlineSize: 100,
  productSize: 100,
  detailSize: 100,
  unitSize: 100,
  currencySize: 100,
  priceMainSize: 100,
  centsSize: 100,
  suffixSize: 100,
  dateSize: 100
};

const stateIds = [
  "artStyle", "headline", "product", "detail", "unit", "price",
  "suffix", "dateText", "offsetX", "offsetY", "textBlockY", "priceBlockY", "scale", "headlineSize",
  "productSize", "detailSize", "unitSize", "currencySize", "priceMainSize",
  "centsSize", "suffixSize", "dateSize"
];

const sizeIds = [
  "headlineSize", "productSize", "detailSize", "unitSize", "currencySize",
  "priceMainSize", "centsSize", "suffixSize", "dateSize"
];

const ART_STYLES = new Set(["portrait", "burst", "blank"]);
const SUFFIXES = new Set(["", "/UN", "/KG"]);

const byId = id => document.getElementById(id);
const fields = Object.fromEntries(stateIds.map(id => [id, byId(id)]));
const mediaSelect = byId("mediaSelect");
const paper = byId("paper");
const content = byId("content");
const mediaDialog = byId("mediaDialog");
const templateDialog = byId("templateDialog");
let media = normalizeMedia(load(STORAGE.media, defaultMedia));
let templates = normalizeTemplates(load(STORAGE.templates, []));
let currentMediaId = defaults.mediaId;

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(fallback) ? (Array.isArray(value) ? value : fallback) : { ...fallback, ...value };
  } catch {
    return fallback;
  }
}

function finiteNumber(value, fallback, min = -Infinity, max = Infinity) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function normalizeMedia(items) {
  if (!Array.isArray(items)) return structuredClone(defaultMedia);

  const normalized = items.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const width = finiteNumber(item.width, 210, 20, 1000);
    const height = finiteNumber(item.height, 297, 20, 1000);
    const margins = item.margins || {};
    const horizontalLimit = Math.max(0, width / 2 - 1);
    const verticalLimit = Math.max(0, height / 2 - 1);

    return [{
      id: String(item.id || `media-importada-${index}`),
      name: String(item.name || `Mídia ${index + 1}`).slice(0, 80),
      width,
      height,
      margins: {
        top: finiteNumber(margins.top, 0, 0, verticalLimit),
        right: finiteNumber(margins.right, 0, 0, horizontalLimit),
        bottom: finiteNumber(margins.bottom, 0, 0, verticalLimit),
        left: finiteNumber(margins.left, 0, 0, horizontalLimit)
      },
      artStyle: ART_STYLES.has(item.artStyle) ? item.artStyle : "blank"
    }];
  });

  return normalized.length ? normalized : structuredClone(defaultMedia);
}

function normalizeTemplates(items) {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item, index) => {
    if (!item || typeof item !== "object" || !item.state) return [];
    return [{
      id: String(item.id || `template-importado-${index}`),
      name: String(item.name || `Template ${index + 1}`).slice(0, 80),
      state: { ...defaults, ...item.state },
      updatedAt: item.updatedAt || new Date(0).toISOString()
    }];
  });
}

function persist() {
  localStorage.setItem(STORAGE.media, JSON.stringify(media));
  localStorage.setItem(STORAGE.templates, JSON.stringify(templates));
  localStorage.setItem(STORAGE.state, JSON.stringify(getEditorState()));
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function selectedMedia() {
  return media.find(item => item.id === currentMediaId) || media[0];
}

function splitPrice(raw) {
  const clean = String(raw).trim().replace(/[^\d,.]/g, "").replace(".", ",");
  const [integer = "0", decimals = ""] = clean.split(",");
  return { integer: integer || "0", decimals: decimals ? `,${decimals.slice(0, 2)}` : "" };
}

function fitText(element, maxWidth) {
  element.style.setProperty("--fit", "1");
  let fit = 1;
  while (element.scrollWidth > maxWidth && fit > 0.3) {
    fit -= 0.025;
    element.style.setProperty("--fit", fit.toFixed(3));
  }
}

function getEditorState() {
  return {
    mediaId: currentMediaId,
    ...Object.fromEntries(stateIds.map(id => [id, fields[id].value]))
  };
}

function applyEditorState(state) {
  const merged = { ...defaults, ...state };
  currentMediaId = media.some(item => item.id === merged.mediaId) ? merged.mediaId : media[0].id;
  stateIds.forEach(id => {
    const value = id === "artStyle" && !ART_STYLES.has(merged[id])
      ? defaults[id]
      : id === "suffix" && !SUFFIXES.has(merged[id])
        ? defaults[id]
        : merged[id] ?? defaults[id];
    fields[id].value = value;
  });
  refreshMediaSelect();
  render();
}

function refreshMediaSelect() {
  mediaSelect.replaceChildren(...media.map(item => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    option.selected = item.id === currentMediaId;
    return option;
  }));
}

function render() {
  const selected = selectedMedia();
  if (!selected) return;

  paper.className = `paper template-${fields.artStyle.value}`;
  paper.style.setProperty("--paper-ratio", `${selected.width} / ${selected.height}`);
  paper.style.setProperty("--print-width", `${selected.width}mm`);
  paper.style.setProperty("--print-height", `${selected.height}mm`);
  paper.style.setProperty("--safe-top", `${selected.margins.top / selected.height * 100}%`);
  paper.style.setProperty("--safe-right", `${selected.margins.right / selected.width * 100}%`);
  paper.style.setProperty("--safe-bottom", `${selected.margins.bottom / selected.height * 100}%`);
  paper.style.setProperty("--safe-left", `${selected.margins.left / selected.width * 100}%`);
  paper.style.setProperty("--print-safe-top", `${selected.margins.top}mm`);
  paper.style.setProperty("--print-safe-right", `${selected.margins.right}mm`);
  paper.style.setProperty("--print-safe-bottom", `${selected.margins.bottom}mm`);
  paper.style.setProperty("--print-safe-left", `${selected.margins.left}mm`);

  const offsetX = Number(fields.offsetX.value) || 0;
  const offsetY = Number(fields.offsetY.value) || 0;
  content.style.setProperty("--offset-x", `${offsetX / selected.width * 100}cqw`);
  content.style.setProperty("--offset-y", `${offsetY / selected.width * 100}cqw`);
  content.style.setProperty("--print-offset-x", `${offsetX}mm`);
  content.style.setProperty("--print-offset-y", `${offsetY}mm`);
  content.style.setProperty("--content-scale", (Number(fields.scale.value) || 100) / 100);
  byId("scaleOutput").textContent = `${fields.scale.value}%`;
  const textBlockY = Number(fields.textBlockY.value) || 0;
  const priceBlockY = Number(fields.priceBlockY.value) || 0;
  content.style.setProperty("--text-block-y", `${textBlockY / selected.width * 100}cqw`);
  content.style.setProperty("--price-block-y", `${priceBlockY / selected.width * 100}cqw`);
  content.style.setProperty("--print-text-block-y", `${textBlockY}mm`);
  content.style.setProperty("--print-price-block-y", `${priceBlockY}mm`);
  byId("textBlockYOutput").textContent = `${textBlockY} mm`;
  byId("priceBlockYOutput").textContent = `${priceBlockY} mm`;
  sizeIds.forEach(id => {
    const cssName = `--${id.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`;
    content.style.setProperty(cssName, (Number(fields[id].value) || 100) / 100);
    byId(`${id}Output`).textContent = `${fields[id].value}%`;
  });

  byId("headlinePreview").textContent = fields.headline.value || " ";
  byId("productPreview").textContent = fields.product.value || " ";
  byId("detailPreview").textContent = fields.detail.value || " ";
  byId("unitPreview").textContent = (fields.unit.value || " ").replace(/\s+(?=\S+$)/, "\n");
  byId("datePreview").textContent = fields.dateText.value;

  const price = splitPrice(fields.price.value);
  byId("pricePreview").querySelector(".price-main").textContent = price.integer;
  byId("pricePreview").querySelector(".price-cents").textContent = price.decimals;
  byId("pricePreview").querySelector(".price-suffix").textContent = fields.suffix.value;

  byId("mediaSummary").innerHTML =
    `<strong>${selected.width} × ${selected.height} mm</strong><span>Área útil: margens ${selected.margins.top} / ${selected.margins.right} / ${selected.margins.bottom} / ${selected.margins.left} mm</span>`;

  requestAnimationFrame(() => {
    fitText(byId("headlinePreview"), content.clientWidth);
    fitText(byId("productPreview"), content.clientWidth * 0.82);
    fitText(byId("detailPreview"), content.clientWidth);
  });
  persist();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function showView(name) {
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.id === `${name}View`));
  document.querySelectorAll(".nav-button").forEach(button => button.classList.toggle("active", button.dataset.view === name));
  byId("printButton").hidden = name !== "editor";
  byId("saveTemplateShortcut").hidden = name !== "editor";
  if (name === "media") renderMediaList();
  if (name === "templates") renderTemplateList();
}

function renderMediaList() {
  byId("mediaList").innerHTML = media.map(item => `
    <article class="management-card">
      <div class="card-preview media-mini" data-media-id="${escapeHtml(item.id)}"></div>
      <div class="card-body">
        <span class="card-kicker">${item.width} × ${item.height} mm</span>
        <h3>${escapeHtml(item.name)}</h3>
        <p>Margens: ${item.margins.top} / ${item.margins.right} / ${item.margins.bottom} / ${item.margins.left} mm</p>
        <div class="card-actions">
          <button class="small-button use-media" data-id="${item.id}" type="button">Usar</button>
          <button class="small-button edit-media" data-id="${item.id}" type="button">Editar</button>
          <button class="small-button danger delete-media" data-id="${item.id}" type="button">Excluir</button>
        </div>
      </div>
    </article>
  `).join("");
  byId("mediaList").querySelectorAll("[data-media-id]").forEach(preview => {
    const item = media.find(entry => entry.id === preview.dataset.mediaId);
    if (item) preview.style.aspectRatio = `${item.width} / ${item.height}`;
  });
}

function renderTemplateList() {
  if (!templates.length) {
    byId("templateList").innerHTML = `<div class="empty-state"><h3>Nenhum template salvo</h3><p>Monte um cartaz no editor e salve a composição para reutilizá-la.</p></div>`;
    return;
  }
  byId("templateList").innerHTML = templates.map(item => {
    const linkedMedia = media.find(entry => entry.id === item.state.mediaId);
    return `
      <article class="management-card">
        <div class="template-card-preview template-${item.state.artStyle}">
          <strong>${escapeHtml(item.state.product || "OFERTA")}</strong>
          <span>R$ ${escapeHtml(item.state.price || "0,00")}</span>
        </div>
        <div class="card-body">
          <span class="card-kicker">${escapeHtml(linkedMedia?.name || "Mídia removida")}</span>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.state.headline || "")}${item.state.dateText ? ` · ${escapeHtml(item.state.dateText)}` : ""}</p>
          <div class="card-actions">
            <button class="small-button load-template" data-id="${item.id}" type="button">Carregar</button>
            <button class="small-button overwrite-template" data-id="${item.id}" type="button">Atualizar</button>
            <button class="small-button danger delete-template" data-id="${item.id}" type="button">Excluir</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function openMediaDialog(item = null) {
  byId("mediaDialogTitle").textContent = item ? "Editar mídia" : "Nova mídia";
  byId("mediaId").value = item?.id || "";
  byId("mediaName").value = item?.name || "";
  byId("mediaWidth").value = item?.width || 210;
  byId("mediaHeight").value = item?.height || 297;
  byId("marginTop").value = item?.margins.top ?? 45;
  byId("marginRight").value = item?.margins.right ?? 15;
  byId("marginBottom").value = item?.margins.bottom ?? 18;
  byId("marginLeft").value = item?.margins.left ?? 15;
  byId("mediaArtStyle").value = item?.artStyle || "portrait";
  mediaDialog.showModal();
}

function saveMedia() {
  if (!byId("mediaForm").reportValidity()) return false;
  const id = byId("mediaId").value || uid("media");
  const item = {
    id,
    name: byId("mediaName").value.trim(),
    width: Number(byId("mediaWidth").value),
    height: Number(byId("mediaHeight").value),
    margins: {
      top: Number(byId("marginTop").value),
      right: Number(byId("marginRight").value),
      bottom: Number(byId("marginBottom").value),
      left: Number(byId("marginLeft").value)
    },
    artStyle: byId("mediaArtStyle").value
  };
  if (item.margins.left + item.margins.right >= item.width ||
      item.margins.top + item.margins.bottom >= item.height) {
    alert("As margens precisam deixar uma área útil positiva no papel.");
    return false;
  }
  const index = media.findIndex(entry => entry.id === id);
  if (index >= 0) media[index] = item;
  else media.push(item);
  currentMediaId = id;
  fields.artStyle.value = item.artStyle;
  refreshMediaSelect();
  renderMediaList();
  render();
  persist();
  return true;
}

function openTemplateDialog() {
  byId("templateName").value = fields.product.value ? `${fields.product.value} - oferta` : "";
  templateDialog.showModal();
}

function saveTemplate() {
  if (!byId("templateForm").reportValidity()) return false;
  templates.unshift({
    id: uid("template"),
    name: byId("templateName").value.trim(),
    state: getEditorState(),
    updatedAt: new Date().toISOString()
  });
  persist();
  renderTemplateList();
  return true;
}

document.querySelectorAll(".nav-button").forEach(button =>
  button.addEventListener("click", () => showView(button.dataset.view))
);

stateIds.forEach(id => {
  fields[id].addEventListener("input", render);
  fields[id].addEventListener("change", render);
});

mediaSelect.addEventListener("change", () => {
  currentMediaId = mediaSelect.value;
  fields.artStyle.value = selectedMedia().artStyle;
  render();
});

byId("toggleCalibration").addEventListener("click", event => {
  const visible = paper.classList.toggle("show-calibration");
  event.currentTarget.textContent = visible ? "Ocultar guias" : "Mostrar guias";
});
byId("resetSizes").addEventListener("click", () => {
  sizeIds.forEach(id => fields[id].value = defaults[id]);
  render();
});
byId("resetButton").addEventListener("click", () => applyEditorState(defaults));
byId("printButton").addEventListener("click", () => window.print());
byId("newMediaButton").addEventListener("click", () => openMediaDialog());
byId("newTemplateButton").addEventListener("click", openTemplateDialog);
byId("saveTemplateShortcut").addEventListener("click", openTemplateDialog);

byId("mediaForm").addEventListener("submit", event => {
  if (event.submitter?.value === "default" && !saveMedia()) event.preventDefault();
});
byId("templateForm").addEventListener("submit", event => {
  if (event.submitter?.value === "default" && !saveTemplate()) event.preventDefault();
});

byId("mediaList").addEventListener("click", event => {
  const id = event.target.dataset.id;
  if (!id) return;
  const item = media.find(entry => entry.id === id);
  if (event.target.classList.contains("use-media")) {
    currentMediaId = id;
    fields.artStyle.value = item.artStyle;
    refreshMediaSelect();
    render();
    showView("editor");
  }
  if (event.target.classList.contains("edit-media")) openMediaDialog(item);
  if (event.target.classList.contains("delete-media")) {
    if (media.length === 1) return alert("É necessário manter pelo menos uma mídia.");
    if (!confirm(`Excluir a mídia "${item.name}"?`)) return;
    media = media.filter(entry => entry.id !== id);
    if (currentMediaId === id) currentMediaId = media[0].id;
    refreshMediaSelect();
    renderMediaList();
    render();
  }
});

byId("templateList").addEventListener("click", event => {
  const id = event.target.dataset.id;
  if (!id) return;
  const index = templates.findIndex(entry => entry.id === id);
  const item = templates[index];
  if (event.target.classList.contains("load-template")) {
    applyEditorState(item.state);
    showView("editor");
  }
  if (event.target.classList.contains("overwrite-template")) {
    if (!confirm(`Atualizar "${item.name}" com o cartaz que está no editor?`)) return;
    templates[index] = { ...item, state: getEditorState(), updatedAt: new Date().toISOString() };
    persist();
    renderTemplateList();
  }
  if (event.target.classList.contains("delete-template")) {
    if (!confirm(`Excluir o template "${item.name}"?`)) return;
    templates.splice(index, 1);
    persist();
    renderTemplateList();
  }
});

let dynamicPageRuleIndex = null;

window.addEventListener("beforeprint", () => {
  const selected = selectedMedia();
  const stylesheet = [...document.styleSheets].find(sheet => sheet.href?.endsWith("styles.css"));
  if (!stylesheet) return;
  dynamicPageRuleIndex = stylesheet.cssRules.length;
  stylesheet.insertRule(`@page { size: ${selected.width}mm ${selected.height}mm; margin: 0; }`, dynamicPageRuleIndex);
});
window.addEventListener("afterprint", () => {
  if (dynamicPageRuleIndex === null) return;
  const stylesheet = [...document.styleSheets].find(sheet => sheet.href?.endsWith("styles.css"));
  stylesheet?.deleteRule(dynamicPageRuleIndex);
  dynamicPageRuleIndex = null;
});

const savedState = load(STORAGE.state, defaults);
applyEditorState(savedState);
renderMediaList();
renderTemplateList();
