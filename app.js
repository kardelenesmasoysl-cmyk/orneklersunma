
const $ = (id) => document.getElementById(id);

const form = $("exampleForm");
const exampleId = $("exampleId");
const titleInput = $("title");
const categoryInput = $("category");
const summaryInput = $("summary");
const codeInput = $("code");
const tagsInput = $("tags");

const preview = $("preview");
const itemList = $("itemList");
const countBadge = $("countBadge");
const filterCategory = $("filterCategory");
const searchInput = $("searchInput");
const clearSearchBtn = $("clearSearchBtn");

const resetBtn = $("resetBtn");
const newTopBtn = $("newTopBtn");
const prevBtn = $("prevBtn");
const nextBtn = $("nextBtn");
const exportBtn = $("exportBtn");
const importInput = $("importInput");
const saveBtn = $("saveBtn");
const formHeading = $("formHeading");
const editorDetails = $("editorDetails");
const toast = $("toast");

let currentIndex = 0;
let toastTimer;
let examples = loadExamples();

function loadExamples() {
    try {
        const saved = JSON.parse(localStorage.getItem("examples") || "[]");

        if (!Array.isArray(saved)) return [];

        return saved
            .filter(item =>
                item &&
                typeof item.title === "string" &&
                typeof item.category === "string" &&
                typeof item.summary === "string" &&
                typeof item.code === "string"
            )
            .map((item, index) => ({
                id: typeof item.id === "string"
                    ? item.id
                    : `old-${Date.now()}-${index}`,
                title: item.title,
                category: item.category,
                summary: item.summary,
                code: item.code,
                tags: typeof item.tags === "string" ? item.tags : ""
            }));
    } catch {
        return [];
    }
}

function createId() {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveToStorage() {
    try {
        localStorage.setItem("examples", JSON.stringify(examples));
        return true;
    } catch {
        showToast("Kayıt yapılamadı. Tarayıcı depolama alanını kontrol et.");
        return false;
    }
}

function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("visible");

    toastTimer = setTimeout(() => {
        toast.classList.remove("visible");
    }, 2800);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getFilteredExamples() {
    const category = filterCategory.value || "Tümü";
    const query = searchInput.value.trim().toLocaleLowerCase("tr-TR");

    return examples.filter(item => {
        const matchesCategory =
            category === "Tümü" || item.category === category;

        const searchableText = [
            item.title,
            item.category,
            item.summary,
            item.code,
            item.tags
        ].join(" ").toLocaleLowerCase("tr-TR");

        return matchesCategory && searchableText.includes(query);
    });
}

function updateFilterOptions() {
    const selected = filterCategory.value || "Tümü";
    const categories = [...new Set(examples.map(item => item.category))]
        .sort((a, b) => a.localeCompare(b, "tr"));

    filterCategory.replaceChildren(
        new Option("Tüm kategoriler", "Tümü")
    );

    categories.forEach(category => {
        filterCategory.add(new Option(category, category));
    });

    filterCategory.value = categories.includes(selected)
        ? selected
        : "Tümü";
}

function updateStatistics() {
    countBadge.textContent = examples.length;
    $("resultCount").textContent =
        `${getFilteredExamples().length} sonuç`;
}

function renderPreview() {
    const filtered = getFilteredExamples();

    if (filtered.length === 0) {
        preview.innerHTML = `
      <div class="empty-state">
        <strong>Burada yeni fikirler için yer var.</strong>
        Henüz gösterilecek örnek yok. Yeni bir örnek oluşturabilir veya arama filtresini değiştirebilirsin.
      </div>
    `;

        $("slideCounter").textContent = "0 / 0";
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    currentIndex = Math.max(0, Math.min(currentIndex, filtered.length - 1));

    const item = filtered[currentIndex];
    const tags = String(item.tags || "")
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean);

    preview.innerHTML = `
    <span class="preview-category">${escapeHTML(item.category)}</span>
    <h3>${escapeHTML(item.title)}</h3>
    <p>${escapeHTML(item.summary)}</p>
    <pre><code>${escapeHTML(item.code)}</code></pre>
    ${tags.length
            ? `<p class="preview-tags">Etiketler: ${tags.map(escapeHTML).join(" · ")}</p>`
            : ""
        }
  `;

    $("slideCounter").textContent = `${currentIndex + 1} / ${filtered.length}`;
    prevBtn.disabled = filtered.length < 2;
    nextBtn.disabled = filtered.length < 2;
}

function renderList() {
    const filtered = getFilteredExamples();
    itemList.replaceChildren();

    if (filtered.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";

        const heading = document.createElement("strong");
        heading.textContent = examples.length
            ? "Aramana uygun bir sonuç bulamadık."
            : "İlk örneğini eklemeye ne dersin?";

        const message = document.createElement("span");
        message.textContent = examples.length
            ? "Arama kelimeni veya kategori filtresini değiştirebilirsin."
            : "Yeni örnek oluştur düğmesine basarak başlayabilirsin.";

        empty.append(heading, message);
        itemList.appendChild(empty);
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement("article");
        card.className = "item-card";

        const top = document.createElement("div");
        top.className = "item-card-top";

        const category = document.createElement("span");
        category.className = "category-badge";
        category.textContent = item.category;

        top.appendChild(category);

        const heading = document.createElement("h4");
        heading.textContent = item.title;

        const summary = document.createElement("p");
        summary.textContent = item.summary;

        const tagList = document.createElement("div");
        tagList.className = "tag-list";

        String(item.tags || "")
            .split(",")
            .map(tag => tag.trim())
            .filter(Boolean)
            .forEach(tag => {
                const element = document.createElement("span");
                element.className = "tag";
                element.textContent = tag;
                tagList.appendChild(element);
            });

        const actions = document.createElement("div");
        actions.className = "card-actions";

        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.textContent = "Görüntüle";
        viewButton.addEventListener("click", () => {
            const latest = getFilteredExamples();
            currentIndex = latest.findIndex(entry => entry.id === item.id);
            renderPreview();
            $("presentation").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Düzenle";
        editButton.addEventListener("click", () => editExample(item.id));

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Sil";
        deleteButton.className = "delete-btn";
        deleteButton.addEventListener("click", () => deleteExample(item.id));

        actions.append(viewButton, editButton, deleteButton);
        card.append(top, heading, summary);

        if (tagList.childElementCount > 0) {
            card.appendChild(tagList);
        }

        card.appendChild(actions);
        itemList.appendChild(card);
    });
}

function render() {
    updateFilterOptions();
    updateStatistics();
    renderPreview();
    renderList();
    clearSearchBtn.hidden = searchInput.value.length === 0;
}

function resetForm() {
    form.reset();
    exampleId.value = "";
    saveBtn.textContent = "Örneği kaydet";
    formHeading.textContent = "Yeni örnek oluştur";
}

function startNewExample() {
    resetForm();
    editorDetails.open = true;

    $("editorPanel").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    titleInput.focus({ preventScroll: true });
}

form.addEventListener("submit", event => {
    event.preventDefault();

    const item = {
        id: exampleId.value || createId(),
        title: titleInput.value.trim(),
        category: categoryInput.value,
        summary: summaryInput.value.trim(),
        code: codeInput.value.trim(),
        tags: tagsInput.value.trim()
    };

    if (!item.title || !item.category || !item.summary || !item.code) {
        showToast("Lütfen zorunlu alanları doldur.");
        return;
    }

    const previous = examples.map(entry => ({ ...entry }));
    const existingIndex = examples.findIndex(entry => entry.id === item.id);
    const isEditing = existingIndex >= 0;

    if (isEditing) {
        examples[existingIndex] = item;
    } else {
        examples.push(item);
    }

    if (!saveToStorage()) {
        examples = previous;
        render();
        return;
    }

    resetForm();
    searchInput.value = "";
    filterCategory.value = "Tümü";
    currentIndex = Math.max(
        0,
        examples.findIndex(entry => entry.id === item.id)
    );

    render();
    showToast(isEditing ? "Örneğin güncellendi." : "Yeni örneğin kaydedildi.");
});

function editExample(id) {
    const item = examples.find(entry => entry.id === id);
    if (!item) return;

    exampleId.value = item.id;
    titleInput.value = item.title;
    categoryInput.value = item.category;
    summaryInput.value = item.summary;
    codeInput.value = item.code;
    tagsInput.value = item.tags || "";

    formHeading.textContent = "Örneği düzenle";
    saveBtn.textContent = "Değişiklikleri kaydet";
    editorDetails.open = true;

    $("editorPanel").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    titleInput.focus({ preventScroll: true });
}

function deleteExample(id) {
    const item = examples.find(entry => entry.id === id);
    if (!item) return;

    if (!confirm(`"${item.title}" örneğini silmek istiyor musun?`)) {
        return;
    }

    const previous = examples;
    examples = examples.filter(entry => entry.id !== id);

    if (!saveToStorage()) {
        examples = previous;
        render();
        return;
    }

    if (exampleId.value === id) resetForm();

    currentIndex = 0;
    render();
    showToast("Örnek silindi.");
}

resetBtn.addEventListener("click", () => {
    resetForm();
    showToast("Form temizlendi.");
});

newTopBtn.addEventListener("click", startNewExample);

filterCategory.addEventListener("change", () => {
    currentIndex = 0;
    render();
});

searchInput.addEventListener("input", () => {
    currentIndex = 0;
    render();
});

clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    currentIndex = 0;
    render();
    searchInput.focus();
});

prevBtn.addEventListener("click", () => {
    const filtered = getFilteredExamples();
    if (filtered.length < 2) return;

    currentIndex = (currentIndex - 1 + filtered.length) % filtered.length;
    renderPreview();
});

nextBtn.addEventListener("click", () => {
    const filtered = getFilteredExamples();
    if (filtered.length < 2) return;

    currentIndex = (currentIndex + 1) % filtered.length;
    renderPreview();
});

exportBtn.addEventListener("click", () => {
    const blob = new Blob(
        [JSON.stringify(examples, null, 2)],
        { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "ornekler.json";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("JSON yedeğin indiriliyor.");
});

importInput.addEventListener("change", async () => {
    const file = importInput.files?.[0];
    if (!file) return;

    try {
        const imported = JSON.parse(await file.text());

        if (!Array.isArray(imported)) {
            throw new Error("JSON dosyası bir örnek listesi içermeli.");
        }

        const valid = imported.every(item =>
            item &&
            typeof item.title === "string" &&
            typeof item.category === "string" &&
            typeof item.summary === "string" &&
            typeof item.code === "string"
        );

        if (!valid) {
            throw new Error("Dosyadaki örneklerin alanları geçersiz.");
        }

        const normalized = imported.map((item, index) => ({
            id: typeof item.id === "string"
                ? item.id
                : `import-${Date.now()}-${index}`,
            title: item.title,
            category: item.category,
            summary: item.summary,
            code: item.code,
            tags: typeof item.tags === "string" ? item.tags : ""
        }));

        const previous = examples;
        examples = normalized;

        if (!saveToStorage()) {
            examples = previous;
            render();
            return;
        }

        resetForm();
        searchInput.value = "";
        filterCategory.value = "Tümü";
        currentIndex = 0;
        render();

        showToast(`${examples.length} örnek içe aktarıldı.`);
    } catch (error) {
        showToast(`İçe aktarma başarısız: ${error.message}`);
    } finally {
        importInput.value = "";
    }
});

render();
