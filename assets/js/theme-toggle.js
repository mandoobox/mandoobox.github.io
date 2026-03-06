(function () {
  var root = document.documentElement;
  var button = document.querySelector("[data-theme-toggle]");
  var label = document.querySelector("[data-theme-label]");
  var icon = document.querySelector("[data-theme-icon]");
  var config = window.MandooBoxTheme || {};
  var storageKey = config.storageKey || "theme";
  var labels = config.labels || {
    theme: "Theme",
    light: "Light",
    dark: "Dark"
  };
  var mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function getStoredMode() {
    try {
      var mode = localStorage.getItem(storageKey);
      return mode === "light" || mode === "dark" ? mode : null;
    } catch (error) {
      return null;
    }
  }

  function dispatchThemeChange(mode) {
    window.dispatchEvent(new CustomEvent("themechange", {
      detail: { theme: mode }
    }));
  }

  function updateButton(mode) {
    if (!button) {
      return;
    }

    var currentLabel = mode === "dark" ? labels.dark : labels.light;

    if (label) {
      label.textContent = currentLabel;
    }

    if (icon) {
      icon.textContent = mode === "dark" ? "dark_mode" : "light_mode";
    }

    button.setAttribute("aria-pressed", String(mode === "dark"));
    button.setAttribute("aria-label", labels.theme + ": " + currentLabel);
    button.title = labels.theme + ": " + currentLabel;
  }

  function applyMode(mode, persist) {
    root.dataset.theme = mode;
    root.style.colorScheme = mode;

    if (persist) {
      try {
        localStorage.setItem(storageKey, mode);
      } catch (error) {
        // Ignore storage failures and keep the in-memory theme change.
      }
    }

    updateButton(mode);
    dispatchThemeChange(mode);
  }

  function syncWithSystem(event) {
    if (getStoredMode()) {
      return;
    }

    var nextMode = event.matches ? "dark" : "light";
    root.dataset.theme = nextMode;
    root.style.colorScheme = nextMode;
    updateButton(nextMode);
    dispatchThemeChange(nextMode);
  }

  var initialMode = root.dataset.theme === "dark" ? "dark" : "light";
  updateButton(initialMode);

  if (!button) {
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", syncWithSystem);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(syncWithSystem);
    }
    return;
  }

  button.addEventListener("click", function () {
    var nextMode = root.dataset.theme === "dark" ? "light" : "dark";
    applyMode(nextMode, true);
  });

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", syncWithSystem);
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(syncWithSystem);
  }
})();
