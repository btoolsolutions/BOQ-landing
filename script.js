// script.js

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("demoForm");
  const statusEl = document.getElementById("status");
  const submitBtn = document.getElementById("submitBtn");

  // Gmail address validation
  function isGmailAddress(email) {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    statusEl.textContent = "";
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!isGmailAddress(data.email)) {
      alert("Please enter a valid Gmail address (example@gmail.com)");
      return;
    }

    // ------------------------------
    // 🔵 SHOW LOADING BUTTON STATE
    // ------------------------------
    submitBtn.disabled = true;
    statusEl.textContent = "Submitting, please wait...";

    const _origBtnHTML =
      submitBtn.innerHTML ||
      submitBtn.textContent ||
      "Get Instant Demo Access";

    submitBtn.innerHTML =
      '<span class="btn-text">Submitting, please wait</span>' +
      '<span class="btn-spinner" aria-hidden="true"></span>';

    submitBtn.setAttribute("aria-live", "polite");
    submitBtn.setAttribute("aria-busy", "true");
    // ------------------------------

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbywD8NnwnfquxxC8dqw-Tk8WLaPnuhdMbqglEwAeYu6dijjNvZiGWg5FoBGpK6uHxP0/exec",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.status === "success") {
        document.getElementById("successPopup").style.display = "flex";
        form.reset();
      } else if (result.status === "exists") {
        document.getElementById("duplicatePopup").style.display = "flex";
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Network error. Please try again.");
    } finally {
      // --------------------------------
      // 🔵 RESTORE ORIGINAL BUTTON STATE
      // --------------------------------
      submitBtn.disabled = false;
      submitBtn.removeAttribute("aria-busy");
      submitBtn.removeAttribute("aria-live");

      if (typeof _origBtnHTML !== "undefined") {
        submitBtn.innerHTML = _origBtnHTML;
      } else {
        submitBtn.textContent = "Get Instant Demo Access";
      }
      // --------------------------------
    }
  });

  // Close popups
  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      this.closest(".popup").style.display = "none";
    });
  });

  // WhatsApp floating button
  const waMessage =
    "Hello, I would like to get the 24-hour free demo access of bTool ERP.";
  document
    .getElementById("whatsappBtn")
    .addEventListener("click", function () {
      window.open(
        "https://wa.me/918129048805?text=" + encodeURIComponent(waMessage),
        "_blank"
      );
    });
});
