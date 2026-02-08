const storageKey = "haccp-products";

const productForm = document.getElementById("product-form");
const productList = document.getElementById("product-list");
const productDetail = document.getElementById("product-detail");
const analyzeButton = document.getElementById("analyze-photo");
const aiStatus = document.getElementById("ai-status");
const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const closeModalButton = document.getElementById("close-modal");
const cancelEditButton = document.getElementById("cancel-edit");

let products = loadProducts();
let selectedId = null;
let editingId = null;

function loadProducts() {
  const raw = localStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : [];
}

function saveProducts() {
  localStorage.setItem(storageKey, JSON.stringify(products));
}

function renderList() {
  productList.innerHTML = "";

  if (products.length === 0) {
    productList.innerHTML = "<p>Nessun prodotto inserito.</p>";
    return;
  }

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.role = "listitem";

    const title = document.createElement("h3");
    title.textContent = product.name;

    const meta = document.createElement("div");
    meta.className = "product-meta";
    meta.innerHTML = `
      <div>Fornitore: ${product.supplier}</div>
      <div>Lotto: ${product.lot}</div>
      <div>Scadenza: ${formatDate(product.expiry)}</div>
      <div>Tipologia: ${product.category}</div>
    `;

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const detailButton = document.createElement("button");
    detailButton.type = "button";
    detailButton.className = "secondary";
    detailButton.textContent = "Dettagli";
    detailButton.addEventListener("click", () => selectProduct(product.id));

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "ghost";
    editButton.textContent = "Modifica";
    editButton.addEventListener("click", () => openEdit(product.id));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Elimina";
    deleteButton.addEventListener("click", () => removeProduct(product.id));

    actions.append(detailButton, editButton, deleteButton);

    card.append(title, meta, actions);
    productList.append(card);
  });
}

function renderDetail() {
  if (!selectedId) {
    productDetail.innerHTML = "<p>Nessun prodotto selezionato.</p>";
    return;
  }

  const product = products.find((item) => item.id === selectedId);
  if (!product) {
    productDetail.innerHTML = "<p>Prodotto non trovato.</p>";
    return;
  }

  productDetail.innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><span>Nome:</span> ${product.name}</div>
      <div class="detail-item"><span>Fornitore:</span> ${product.supplier}</div>
      <div class="detail-item"><span>Tipologia:</span> ${product.category}</div>
      <div class="detail-item"><span>Modalità di conservazione:</span> ${product.storage}</div>
      <div class="detail-item"><span>Numero lotto:</span> ${product.lot}</div>
      <div class="detail-item"><span>Data di scadenza:</span> ${formatDate(product.expiry)}</div>
    </div>
  `;
}

function selectProduct(id) {
  selectedId = id;
  renderDetail();
}

function removeProduct(id) {
  if (!confirm("Vuoi eliminare questo prodotto?")) {
    return;
  }

  products = products.filter((item) => item.id !== id);
  if (selectedId === id) {
    selectedId = null;
  }
  saveProducts();
  renderList();
  renderDetail();
}

function openEdit(id) {
  const product = products.find((item) => item.id === id);
  if (!product) {
    return;
  }

  editingId = id;
  editForm.name.value = product.name;
  editForm.supplier.value = product.supplier;
  editForm.category.value = product.category;
  editForm.storage.value = product.storage;
  editForm.lot.value = product.lot;
  editForm.expiry.value = product.expiry;

  editModal.hidden = false;
}

function closeEdit() {
  editModal.hidden = true;
  editingId = null;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleDateString("it-IT");
}

function simulateAiExtraction(file) {
  if (!file) {
    aiStatus.textContent = "Carica una foto per l'analisi.";
    return;
  }

  aiStatus.textContent = "Analisi IA in corso...";

  setTimeout(() => {
    const now = new Date();
    const expiryDate = new Date(now.setMonth(now.getMonth() + 2));
    const lotHint = file.name
      .replace(/\.[^/.]+$/, "")
      .toUpperCase()
      .slice(0, 8) || "L" + Math.floor(Math.random() * 9000 + 1000);

    productForm.lot.value = lotHint;
    productForm.expiry.value = expiryDate.toISOString().split("T")[0];
    aiStatus.textContent = "Analisi completata: dati suggeriti e pronti per la verifica.";
  }, 900);
}

productForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(productForm);
  const newProduct = {
    id: crypto.randomUUID(),
    name: formData.get("name"),
    supplier: formData.get("supplier"),
    category: formData.get("category"),
    storage: formData.get("storage"),
    lot: formData.get("lot"),
    expiry: formData.get("expiry"),
  };

  products.unshift(newProduct);
  saveProducts();
  productForm.reset();
  aiStatus.textContent = "In attesa di foto.";
  selectedId = newProduct.id;
  renderList();
  renderDetail();
});

productForm.addEventListener("reset", () => {
  aiStatus.textContent = "In attesa di foto.";
});

analyzeButton.addEventListener("click", () => {
  const file = productForm.photo.files[0];
  simulateAiExtraction(file);
});

editForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!editingId) {
    return;
  }

  const index = products.findIndex((item) => item.id === editingId);
  if (index === -1) {
    return;
  }

  const formData = new FormData(editForm);
  products[index] = {
    ...products[index],
    name: formData.get("name"),
    supplier: formData.get("supplier"),
    category: formData.get("category"),
    storage: formData.get("storage"),
    lot: formData.get("lot"),
    expiry: formData.get("expiry"),
  };

  saveProducts();
  renderList();
  renderDetail();
  closeEdit();
});

closeModalButton.addEventListener("click", closeEdit);
cancelEditButton.addEventListener("click", closeEdit);

renderList();
renderDetail();
