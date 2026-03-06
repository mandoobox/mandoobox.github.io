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

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      var textArea = document.createElement("textarea");

      textArea.value = text;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.top = "-9999px";
      textArea.style.left = "-9999px";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        if (!document.execCommand("copy")) {
          throw new Error("Copy command failed");
        }
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(textArea);
      }
    });
  }

  function setupPostShare() {
    var shareRoot = document.querySelector("[data-share-root]");
    if (!shareRoot) {
      return;
    }

    var rawUrl = shareRoot.getAttribute("data-share-url") || window.location.href;
    var url = new URL(rawUrl, window.location.origin).href;
    var title = shareRoot.getAttribute("data-share-title") || document.title;
    var nativeButton = shareRoot.querySelector("[data-share-native]");
    var copyButton = shareRoot.querySelector("[data-share-copy]");
    var feedback = shareRoot.querySelector("[data-share-feedback]");
    var feedbackTimer = 0;
    var successTimer = 0;

    function setFeedback(message, state) {
      if (!feedback) {
        return;
      }

      feedback.textContent = message;
      if (state) {
        feedback.dataset.state = state;
      } else {
        feedback.removeAttribute("data-state");
      }

      window.clearTimeout(feedbackTimer);
      if (message) {
        feedbackTimer = window.setTimeout(function () {
          feedback.textContent = "";
          feedback.removeAttribute("data-state");
        }, 2200);
      }
    }

    if (nativeButton) {
      if (navigator.share) {
        nativeButton.hidden = false;
        nativeButton.addEventListener("click", function () {
          navigator.share({ title: title, url: url }).catch(function (error) {
            if (error && error.name === "AbortError") {
              return;
            }
            setFeedback("Share failed", "error");
          });
        });
      } else {
        nativeButton.hidden = true;
      }
    }

    if (!copyButton) {
      return;
    }

    copyButton.addEventListener("click", function () {
      copyText(url)
        .then(function () {
          copyButton.classList.add("is-success");
          setFeedback("Link copied", "success");

          window.clearTimeout(successTimer);
          successTimer = window.setTimeout(function () {
            copyButton.classList.remove("is-success");
          }, 1800);
        })
        .catch(function () {
          setFeedback("Copy failed", "error");
        });
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
  setupPostShare();
  setupPostToc();
})();
