// script.js (updated)
// Uses the webapp URL you provided and logs response details for debugging.

document.addEventListener("DOMContentLoaded", function () {
  // <-- Update only this constant if webapp URL ever changes -->
  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz9LFcmtQ-blFWgPJTu5s3fc7Yxl8_cn1lOqfyaV8BNvfMwmWJrGFNXOug-fp5F3TsU6g/exec";

  const form = document.getElementById("demoForm");
  const statusEl = document.getElementById("status");
  const submitBtn = document.getElementById("submitBtn");

  // Small helper: perform fetch with logging and better error handling
  async function tryFetch(formData) {
    try {
      const res = await fetch(WEB_APP_URL, {
        method: "POST",
        body: formData,
        mode: "cors",
        credentials: "omit",
        headers: {
          // don't set Content-Type here for FormData (browser sets it)
        },
      });

      // Log status for debugging
      console.log("fetch response status:", res.status, res.statusText);

      // Try get text & JSON (safe)
      const text = await res.text().catch(() => "");
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch (err) {
        // not JSON
      }
      console.log("fetch response body (text):", text);
      if (!res.ok) {
        // Return an object representing failure so caller can fallback
        return { ok: false, status: res.status, statusText: res.statusText, text, json };
      }
      return { ok: true, status: res.status, text, json };
    } catch (err) {
      // Network-level error (CORS preflight, DNS, offline, etc.)
      console.error("fetch failed:", err);
      return { ok: false, fetchError: true, error: err };
    }
  }

  // Fallback submission via hidden iframe (keeps current behavior)
  // This expects a <form id="fallbackForm" target="hidden_iframe"> in index.html
  function submitViaIframe(obj) {
    // create and post a form if fallbackForm isn't present
    const fallback = document.getElementById("fallbackForm");
    if (fallback) {
      // populate fallback inputs if they exist, else just submit (we assume fallback form has matching input names)
      // create temporary hidden inputs for any keys missing
      const created = [];
      Object.keys(obj).forEach((k) => {
        let input = fallback.querySelector(`[name="${k}"]`);
        if (!input) {
          input = document.createElement("input");
          input.type = "hidden";
          input.name = k;
          input.value = obj[k];
          fallback.appendChild(input);
          created.push(input);
        } else {
          input.value = obj[k];
        }
      });
      fallback.submit();
      // cleanup created inputs after short delay
      setTimeout(() => created.forEach(i => i.remove()), 3000);
    } else {
      // If no fallback form exists, throw so caller can show message
      throw new Error("No fallbackForm found in page for iframe fallback.");
    }
  }

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

    // Show loading state on the button
    submitBtn.disabled = true;
    statusEl.textContent = "Submitting, please wait...";

    const _origBtnHTML = submitBtn.innerHTML || submitBtn.textContent || "Get Instant Demo Access";
    submitBtn.innerHTML =
      '<span class="btn-text">Submitting, please wait</span><span class="btn-spinner" aria-hidden="true"></span>';
    submitBtn.setAttribute("aria-live", "polite");
    submitBtn.setAttribute("aria-busy", "true");

    try {
      // Try fetch (with logging)
      const result = await tryFetch(formData);

      if (result.ok) {
        // If server returned JSON use that, otherwise try text
        const resp = result.json || (result.text ? (function(){ try { return JSON.parse(result.text); } catch(e){ return null } })() : null);

        // handle server responses (keep your existing statuses)
        if (resp && resp.status === "success") {
          document.getElementById("successPopup").style.display = "flex";
          form.reset();
        } else if (resp && resp.status === "exists") {
          document.getElementById("duplicatePopup").style.display = "flex";
        } else {
          // If server returned 200 but body isn't as expected, show text or success conservatively
          console.warn("Unexpected success response:", resp, result.text);
          // If response contains helpful text, show alert; else assume success
          if (resp && resp.message) {
            alert(resp.message);
          } else {
            document.getElementById("successPopup").style.display = "flex";
            form.reset();
          }
        }
      } else {
        // Non-OK response (404, 403, 500, etc.) or fetch-level error
        console.warn("Non-OK fetch result, falling back. details:", result);

        // If 404 specifically, log and attempt fallback
        if (result.status === 404) {
          console.error("Server returned 404. Web app exec URL may be incorrect or deployment missing.");
        }

        statusEl.textContent = 'Network error detected — using fallback submission...';

        // attempt iframe fallback with raw data object
        try {
          submitViaIframe(data);
        } catch (fbErr) {
          console.error("Iframe fallback failed:", fbErr);
          alert("Network error. Please try again later.");
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
      statusEl.textContent = "Network error. Please try again later.";
    } finally {
      // restore button
      submitBtn.disabled = false;
      submitBtn.removeAttribute("aria-busy");
      submitBtn.removeAttribute("aria-live");
      if (typeof _origBtnHTML !== "undefined") {
        submitBtn.innerHTML = _origBtnHTML;
      } else {
        submitBtn.textContent = "Get Instant Demo Access";
      }
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
  const waBtn = document.getElementById("whatsappBtn");
  if (waBtn) {
    waBtn.addEventListener("click", function () {
      window.open(
        "https://wa.me/918129048805?text=" + encodeURIComponent(waMessage),
        "_blank"
      );
    });
  }
});
