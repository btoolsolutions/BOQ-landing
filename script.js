// script.js (updated: restored duplicate modal rendering logic)
// Web app URL (your provided exec URL)
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz9LFcmtQ-blFWgPJTu5s3fc7Yxl8_cn1lOqfyaV8BNvfMwmWJrGFNXOug-fp5F3TsU6g/exec';

const form = document.getElementById('demoForm');
const fallbackForm = document.getElementById('fallbackForm');
const statusEl = document.getElementById('status');
const submitBtn = document.getElementById('submitBtn');
const successOverlay = document.getElementById('successOverlay');
const closeSuccess = document.getElementById('closeSuccess');

function isGmailAddress(email) {
  if(!email) return false;
  const e = email.trim().toLowerCase();
  return e.endsWith('@gmail.com') || e.endsWith('@googlemail.com');
}

function showSuccess() { 
  if (successOverlay) {
    successOverlay.classList.add('visible');
    successOverlay.setAttribute('aria-hidden','false');
  }
}
function hideSuccess() { 
  if (successOverlay) {
    successOverlay.classList.remove('visible');
    successOverlay.setAttribute('aria-hidden','true');
  }
}
if (closeSuccess) closeSuccess.addEventListener('click', hideSuccess);

/*
 * Fetches data from the Web App.
 * Returns { ok: boolean, json: object }
 */
async function tryFetch(data) {
  try {
    // form-encoded POST to avoid CORS preflight
    const __fd = new FormData();
    for (const k in data) if (Object.prototype.hasOwnProperty.call(data,k)) __fd.append(k, data[k]);
    const __params = new URLSearchParams(__fd);
    
    const res = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: __params.toString()
    });
    
    const text = await res.text();
    try { 
      const json = JSON.parse(text); 
      return { ok: res.ok, json }; 
    } catch (e) { 
      return { ok: res.ok, json:null }; 
    }
  } catch (err) {
    throw err;
  }
}

function submitViaIframe(data) {
  if (!fallbackForm) return;
  ['company','email','phone','location'].forEach(k => {
    const inp = fallbackForm.querySelector('[name="' + k + '"]');
    if (inp) inp.value = data[k] || '';
  });
  fallbackForm.submit();
  setTimeout(() => {
    showSuccess();
    if (form) form.reset();
  }, 900);
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!statusEl) return;
    statusEl.textContent = '';
    const data = Object.fromEntries(new FormData(form).entries());
    const email = (data.email || '').trim();

    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (!isGmailAddress(email)) { statusEl.textContent = 'Please enter a valid Gmail address (e.g. example@gmail.com). Other domains are not allowed.'; return; }
    if (!WEB_APP_URL) { statusEl.textContent = 'Web App URL missing.'; return; }

    // show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-text">Submitting, please wait</span><span class="btn-spinner" aria-hidden="true"></span>';
    statusEl.textContent = 'Submitting, please wait...';

    try {
      const result = await tryFetch(data);

      // --- DUPLICATE CHECK LOGIC ---
      if (result.json && result.json.duplicate) {
        const message = result.json.message || "An account with this email already exists. Please contact admin for support.";
        const whatsappNumber = result.json.whatsapp || '8129048805';
        showDuplicateModal(message, whatsappNumber);
        statusEl.textContent = 'Submission failed (duplicate account).';
        return; 
      }
      
      if (result.json && result.json.message) {
        statusEl.textContent = result.json.message;
      }

      if (result.ok && result.json && result.json.success) {
        form.reset();
        showSuccess();
      } else {
        // fallback to iframe submission to avoid CORS issues
        submitViaIframe(data);
      }
    } catch (err) {
      // fallback on network error
      console.error('Submission fetch failed, using iframe fallback:', err);
      submitViaIframe(data);
    } finally {
      // restore button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Get Instant Demo Access';
    }
  });
}

/* DUPLICATE MODAL CONTROLLER - defensive and robust */
(function(){
  // Document-level delegated click handler as a fallback
  document.addEventListener('click', function(evt) {
    // If user clicks the OK button or any element inside it
    const ok = evt.target.closest && evt.target.closest('#btModalOk');
    if (ok) {
      closeDuplicateModal();
      return;
    }
    // Close if clicking overlay
    const overlayClick = evt.target && evt.target.id === 'btModalOverlay';
    if (overlayClick) {
      closeDuplicateModal();
      return;
    }
  }, false);
})();

function closeDuplicateModal() {
  try {
    var modal = document.getElementById('duplicateModal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden','true');
  } catch(e) {
    console.error('closeDuplicateModal error:', e);
  }
}

/* === RESTORED showDuplicateModal ===
   This version renders any HTML the server returned in message,
   or falls back to a readable HTML fragment with WhatsApp link.
*/
function showDuplicateModal(message, whatsappNumber) {
  try {
    var modal = document.getElementById('duplicateModal');
    var msgEl = document.getElementById('btModalMessage');
    var waBtn = document.getElementById('btModalWhatsApp');
    var okBtn = document.getElementById('btModalOk');
    var closeBtn = document.getElementById('btModalClose'); // may be null
    var overlay = document.getElementById('btModalOverlay'); // may be null

    // If the server supplied an HTML message for duplicates, use it; otherwise
    // fall back to the standard message (same wording as enhanced_submission.js)
    var finalHtml;
    if (message && message.trim()) {
      // If server sent HTML, prefer it; otherwise escape plain text
      // Heuristic: if contains angle-brackets treat as HTML
      if (/<[a-z][\s\S]*>/i.test(message)) {
        finalHtml = message;
      } else {
        // simple escape of HTML characters
        finalHtml = message.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
      }
    } else {
      finalHtml = '<strong>It seems you already have an active account with this email.</strong><br>';
      finalHtml += 'If you need help, contact us on WhatsApp: <a href="https://wa.me/8129048805" target="_blank">+91 8129048805</a>';
    }

    if (msgEl) {
      // set innerHTML because enhanced_submission.js used HTML in the message
      msgEl.innerHTML = finalHtml;
    }

    if (waBtn) {
      var waLink = whatsappNumber ? 'https://wa.me/' + whatsappNumber.replace(/[^0-9]/g,'') : 'https://wa.me/8129048805';
      waBtn.setAttribute('href', waLink);
    }

    if (!modal) {
      console.warn('Duplicate modal element (#duplicateModal) not found.');
      return;
    }

    // Ensure primary OK button is a plain button and has a single handler
    if (okBtn) {
      try { okBtn.setAttribute('type', 'button'); } catch(e){}
      var newOk = okBtn.cloneNode(true);
      okBtn.parentNode.replaceChild(newOk, okBtn);
      newOk.addEventListener('click', function onOkClick(e){
        closeDuplicateModal();
      });
    }

    // wire close button if it exists
    if (closeBtn) {
      try { closeBtn.setAttribute('type', 'button'); } catch(e){}
      var newClose = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newClose, closeBtn);
      newClose.addEventListener('click', function(){ closeDuplicateModal(); });
    }

    // ensure overlay is clickable
    if (overlay) {
      overlay.style.pointerEvents = 'auto';
      var newOverlay = overlay.cloneNode(true);
      overlay.parentNode.replaceChild(newOverlay, overlay);
      newOverlay.addEventListener('click', function(){ closeDuplicateModal(); });
    }

    // make modal visible and accessible
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    modal.style.pointerEvents = 'auto';

    if (statusEl) statusEl.textContent = '';

  } catch(e){
    console.error('showDuplicateModal error:', e);
  }
}
