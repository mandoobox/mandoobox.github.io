(function () {
  function slugify(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function setupCategoryFilter() {
    var filterRoot = document.querySelector("[data-category-filter]");
    var postItems = Array.prototype.slice.call(document.querySelectorAll("[data-post-item]"));
    var emptyMessage = document.querySelector("[data-post-empty]");

    if (!filterRoot || postItems.length === 0) {
      return;
    }

    function applyCategory(category) {
      var visibleCount = 0;

      postItems.forEach(function (item) {
        var itemCategory = item.dataset.category || "";
        var isVisible = category === "all" || itemCategory === category;

        item.hidden = !isVisible;
        if (isVisible) {
          visibleCount += 1;
        }
      });

      if (emptyMessage) {
        emptyMessage.hidden = visibleCount !== 0;
      }
    }

    filterRoot.addEventListener("click", function (event) {
      var button = event.target.closest("[data-category-button]");
      if (!button) {
        return;
      }

      var selectedCategory = button.dataset.categoryButton || "all";
      var buttons = filterRoot.querySelectorAll("[data-category-button]");

      buttons.forEach(function (filterButton) {
        filterButton.classList.toggle("is-active", filterButton === button);
      });

      applyCategory(selectedCategory);
    });
  }

  function setupTableWraps() {
    var tables = Array.prototype.slice.call(
      document.querySelectorAll(".post-content table")
    );

    if (tables.length === 0) {
      return;
    }

    tables.forEach(function (table) {
      if (table.parentElement && table.parentElement.classList.contains("table-wrap")) {
        return;
      }

      var wrapper = document.createElement("div");
      wrapper.className = "table-wrap";
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  function createHeadingId(heading, index, usedIds) {
    if (heading.id) {
      usedIds.add(heading.id);
      return heading.id;
    }

    var baseId = slugify(heading.textContent || "");
    if (!baseId) {
      baseId = "section-" + (index + 1);
    }

    var uniqueId = baseId;
    var suffix = 2;
    while (usedIds.has(uniqueId) || document.getElementById(uniqueId)) {
      uniqueId = baseId + "-" + suffix;
      suffix += 1;
    }

    heading.id = uniqueId;
    usedIds.add(uniqueId);
    return uniqueId;
  }

  function setupPostToc() {
    var tocRoot = document.querySelector("[data-toc-root]");
    var tocNav = document.querySelector("[data-toc-nav]");
    var tocContent = document.querySelector("[data-toc-content]");

    if (!tocRoot || !tocNav || !tocContent) {
      return;
    }

    var headings = Array.prototype.slice.call(tocContent.querySelectorAll("h2, h3"));
    if (headings.length === 0) {
      return;
    }

    var usedIds = new Set();
    var list = document.createElement("ol");
    list.className = "post-toc__list";

    headings.forEach(function (heading, index) {
      var id = createHeadingId(heading, index, usedIds);
      var item = document.createElement("li");
      var link = document.createElement("a");

      item.className = "post-toc__item post-toc__item--" + heading.tagName.toLowerCase();
      link.className = "post-toc__link";
      link.href = "#" + id;
      link.textContent = heading.textContent || "";

      item.appendChild(link);
      list.appendChild(item);
    });

    tocNav.appendChild(list);
    tocRoot.hidden = false;
  }

  setupCategoryFilter();
  setupTableWraps();
  setupPostToc();
})();
