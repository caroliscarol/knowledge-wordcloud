(() => {
  const DATA_URL = "./data/knowledge.json";

  /** @type {Record<string, any>} */
  const knowledgeMap = {};
  /** @type {any[]} */
  let allItems = [];
  let currentSelectedId = null;
  let showOnlyImportant = false;
  let activeCategory = null; // null 表示全部
  let searchKeyword = "";

  const categoryLabels = {
    company: "公司",
    model: "模型",
    tool: "工具",
    assistant: "助手",
    concept: "概念",
    technique: "技术",
    other: "其他"
  };

  function splitLabel(raw) {
    const label = (raw || "").trim();
    if (!label) {
      return { primary: "", secondary: "" };
    }
    // 简单规则：如果既包含中文又包含空格，则按第一个空格拆成「中文部分 + 英文部分」
    const hasChinese = /[\u4e00-\u9fa5]/.test(label);
    const spaceIndex = label.indexOf(" ");
    if (hasChinese && spaceIndex > 0) {
      const primary = label.slice(0, spaceIndex).trim();
      const secondary = label.slice(spaceIndex + 1).trim();
      return { primary, secondary };
    }
    return { primary: label, secondary: "" };
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

  function getVisibleItems() {
    if (!Array.isArray(allItems)) return [];

    return allItems.filter((item) => {
      const weight = Number(item.weight) || 3;

      if (activeCategory && item.category !== activeCategory) {
        return false;
      }

      if (showOnlyImportant && weight < 4) {
        return false;
      }

      if (searchKeyword) {
        const label = (item.label || "").toLowerCase();
        const id = (item.id || "").toLowerCase();
        const text = label + " " + id;
        if (!text.includes(searchKeyword)) {
          return false;
        }
      }

      return true;
    });
  }

  function renderWordCloud() {
    const items = getVisibleItems().slice();
    // 随机打散词云展示顺序
    items.sort(() => Math.random() - 0.5);
    const container = document.getElementById("wordCloudContainer");
    if (!container) return;
    container.innerHTML = "";

    if (!items.length) {
      container.textContent = "暂无匹配的词汇，请调整搜索或筛选条件。";
      return;
    }

    items.forEach((item) => {
      const span = document.createElement("button");
      span.type = "button";
      span.className = "word-item";
      const { primary } = splitLabel(item.label || item.id);
      span.textContent = primary || item.label || item.id;
      span.dataset.id = item.id;
      const weight = Number(item.weight) || 3;
      span.dataset.weight = String(Math.min(Math.max(weight, 1), 5));
      span.dataset.category = item.category || "other";
      span.setAttribute("aria-label", (item.label || item.id) + " 知识点");

      const jitterX = (Math.random() - 0.5) * 26; // -13px ~ 13px
      const jitterY = (Math.random() - 0.5) * 20; // -10px ~ 10px
      span.style.setProperty("--jitter-x", `${jitterX}px`);
      span.style.setProperty("--jitter-y", `${jitterY}px`);

      span.addEventListener("click", () => {
        showDetailById(item.id);
      });

      container.appendChild(span);
    });
  }

  function bindImportantToggle() {
    const btn = document.getElementById("toggleImportant");
    if (!btn) return;

    btn.addEventListener("click", () => {
      showOnlyImportant = !showOnlyImportant;
      btn.classList.toggle("toggle-important--active", showOnlyImportant);
      btn.textContent = showOnlyImportant ? "显示全部" : "只看重点词";

      const visibleBefore = getVisibleItems();
      const hadCurrentVisible =
        currentSelectedId &&
        visibleBefore.some((item) => item.id === currentSelectedId);

      renderWordCloud();

      const visibleAfter = getVisibleItems();
      if (!visibleAfter.length) return;

      if (hadCurrentVisible && visibleAfter.some((item) => item.id === currentSelectedId)) {
        showDetailById(currentSelectedId);
      } else {
        showDetailById(visibleAfter[0].id);
      }
    });
  }

  function bindSearchInput() {
    const input = document.getElementById("wordSearch");
    if (!input) return;

    input.addEventListener("input", () => {
      searchKeyword = input.value.toLowerCase().trim();
      renderWordCloud();
      const visible = getVisibleItems();
      if (visible.length) {
        const stillVisible = visible.some((item) => item.id === currentSelectedId);
        if (!stillVisible) {
          showDetailById(visible[0].id);
        }
      }
    });
  }

  function bindCategoryFilters() {
    const buttons = document.querySelectorAll(".category-filter");
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.category;
        activeCategory = cat === "all" ? null : cat || null;

        buttons.forEach((b) => b.classList.remove("category-filter--active"));
        btn.classList.add("category-filter--active");

        renderWordCloud();
        const visible = getVisibleItems();
        if (visible.length) {
          const stillVisible = visible.some((item) => item.id === currentSelectedId);
          if (!stillVisible) {
            showDetailById(visible[0].id);
          }
        }
      });
    });
  }

  function bindImportantToggle() {
    const btn = document.getElementById("toggleImportant");
    if (!btn) return;

    btn.addEventListener("click", () => {
      showOnlyImportant = !showOnlyImportant;
      btn.classList.toggle("toggle-important--active", showOnlyImportant);
      btn.textContent = showOnlyImportant ? "显示全部" : "只看重点词";

      const visibleBefore = getVisibleItems();
      const hadCurrentVisible =
        currentSelectedId &&
        visibleBefore.some((item) => item.id === currentSelectedId);

      renderWordCloud();

      const visibleAfter = getVisibleItems();
      if (!visibleAfter.length) return;

      if (hadCurrentVisible && visibleAfter.some((item) => item.id === currentSelectedId)) {
        showDetailById(currentSelectedId);
      } else {
        showDetailById(visibleAfter[0].id);
      }
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

    const header = document.createElement("div");
    header.className = "detail-header";

    const title = document.createElement("h3");
    title.className = "detail-title";
    const { primary, secondary } = splitLabel(item.label || item.id);
    title.textContent = primary || item.label || item.id;

    let secondarySpan = null;
    if (secondary) {
      secondarySpan = document.createElement("span");
      secondarySpan.className = "detail-title-secondary";
      secondarySpan.textContent = secondary;
    }

    const category = document.createElement("span");
    category.className = "detail-category";
    const categoryKey = item.category || "other";
    category.textContent = categoryLabels[categoryKey] || categoryLabels.other;

    header.appendChild(title);
    if (secondarySpan) {
      header.appendChild(secondarySpan);
    }
    header.appendChild(category);

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

    detailPanel.appendChild(header);
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
      allItems = items.slice();
      buildKnowledgeMap(allItems);
      bindSearchInput();
      bindCategoryFilters();
      bindImportantToggle();
      renderWordCloud();

      const visible = getVisibleItems();
      if (visible.length) {
        showDetailById(visible[0].id);
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

