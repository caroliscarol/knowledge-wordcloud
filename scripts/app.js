(() => {
  const DATA_URL = "./data/knowledge.json";

  /** @type {Record<string, any>} */
  const knowledgeMap = {};
  let currentSelectedId = null;

  const palette = [
    "rgba(96, 165, 250, 0.9)",
    "rgba(129, 140, 248, 0.9)",
    "rgba(56, 189, 248, 0.9)",
    "rgba(236, 72, 153, 0.9)",
    "rgba(52, 211, 153, 0.9)"
  ];

  function pickColor(index) {
    return palette[index % palette.length];
  }

  async function loadKnowledgeData() {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error("无法加载知识点数据：" + response.status);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  function buildKnowledgeMap(items) {
    items.forEach((item) => {
      if (item && item.id) {
        knowledgeMap[item.id] = item;
      }
    });
  }

  function clearSelectedWord() {
    const selected = document.querySelector(".word-item.selected");
    if (selected) {
      selected.classList.remove("selected");
    }
  }

  function renderWordCloud(items) {
    const container = document.getElementById("wordCloudContainer");
    if (!container) return;
    container.innerHTML = "";

    if (!items.length) {
      container.textContent = "暂无知识点数据。请检查 data/knowledge.json。";
      return;
    }

    items.forEach((item, index) => {
      const span = document.createElement("button");
      span.type = "button";
      span.className = "word-item";
      span.textContent = item.label || item.id;
      span.dataset.id = item.id;
      const weight = Number(item.weight) || 3;
      span.dataset.weight = String(Math.min(Math.max(weight, 1), 5));
      span.style.backgroundColor = "rgba(15, 23, 42, 0.7)";
      span.style.border = "1px solid rgba(148, 163, 184, 0.5)";
      span.style.color = pickColor(index);
      span.setAttribute("aria-label", (item.label || item.id) + " 知识点");

      span.addEventListener("click", () => {
        showDetailById(item.id);
      });

      container.appendChild(span);
    });
  }

  function showDetailById(id) {
    const detailPanel = document.getElementById("detailPanel");
    if (!detailPanel) return;

    const item = knowledgeMap[id];
    if (!item) return;

    currentSelectedId = id;
    clearSelectedWord();
    const targetWord = document.querySelector(`.word-item[data-id="${id}"]`);
    if (targetWord) {
      targetWord.classList.add("selected");
    }

    detailPanel.innerHTML = "";

    const title = document.createElement("h3");
    title.className = "detail-title";
    title.textContent = item.label || item.id;

    const desc = document.createElement("p");
    desc.className = "detail-description";
    desc.textContent = item.description || "暂无描述。";

    const relatedLabel = document.createElement("p");
    relatedLabel.className = "detail-section-label";
    relatedLabel.textContent = "相关词汇";

    const relatedWrap = document.createElement("div");
    relatedWrap.className = "related-list";

    const relatedIds = Array.isArray(item.related) ? item.related : [];
    if (!relatedIds.length) {
      const empty = document.createElement("span");
      empty.className = "detail-empty";
      empty.textContent = "暂无相关词汇。";
      relatedWrap.appendChild(empty);
    } else {
      relatedIds.forEach((rid) => {
        const relatedItem = knowledgeMap[rid];
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "related-chip";
        chip.textContent = relatedItem ? relatedItem.label || relatedItem.id : rid;
        chip.dataset.id = rid;
        chip.addEventListener("click", () => {
          showDetailById(rid);
          const wordButton = document.querySelector(`.word-item[data-id="${rid}"]`);
          if (wordButton) {
            wordButton.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
          }
        });
        relatedWrap.appendChild(chip);
      });
    }

    detailPanel.appendChild(title);
    detailPanel.appendChild(desc);
    detailPanel.appendChild(relatedLabel);
    detailPanel.appendChild(relatedWrap);
  }

  async function init() {
    const detailPanel = document.getElementById("detailPanel");
    if (detailPanel) {
      detailPanel.innerHTML = `
        <div class="detail-empty">
          <p>正在加载知识点数据，请稍候…</p>
        </div>
      `;
    }

    try {
      const items = await loadKnowledgeData();
      buildKnowledgeMap(items);
      renderWordCloud(items);

      if (items.length) {
        showDetailById(items[0].id);
      } else if (detailPanel) {
        detailPanel.innerHTML = `
          <div class="detail-empty">
            <p>暂无知识点数据，请先在 <code>data/knowledge.json</code> 中添加内容。</p>
          </div>
        `;
      }
    } catch (error) {
      console.error(error);
      if (detailPanel) {
        detailPanel.innerHTML = `
          <div class="detail-empty">
            <p>加载数据时出现问题：${error.message}</p>
          </div>
        `;
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

