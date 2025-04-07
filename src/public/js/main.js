document.addEventListener("DOMContentLoaded", function () {
  // Handle settings form reset button
  const resetButton = document.querySelector(
    '.settings-form button[type="reset"]'
  );
  if (resetButton) {
    resetButton.addEventListener("click", function (e) {
      if (confirm("Reset all settings to default values?")) {
        // Let the form reset naturally
      } else {
        e.preventDefault();
      }
    });
  }

  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href !== "#") {
        e.preventDefault();
        document.querySelector(href).scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  });

  // Add active class to current nav item
  const currentPath = window.location.pathname;
  document.querySelectorAll(".prach-nav a").forEach((link) => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
  });
});
