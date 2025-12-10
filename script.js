const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz9LFcmtQ-blFWgPJTu5s3fc7Yxl8_cn1lOqfyaV8BNvfMwmWJrGFNXOug-fp5F3TsU6g/exec';

const form = document.getElementById('demoForm');
const fallbackForm = document.getElementById('fallbackForm');
const statusEl = document.getElementById('status');
const submitBtn = document.getElementById('submitBtn');
const successOverlay = document.getElementById('successOverlay');
const closeSuccess = document.getElementById('closeSuccess');
const loadingBox = document.getElementById('loadingBox'); // <--- ADDED THIS

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

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    // Show spinner
    if (loadingBox) loadingBox.style.display = 'flex'; // <--- ADDED THIS

    try {
      const result = await tryFetch(data);

      // --- DUPLICATE CHECK LOGIC ---
      if (result.json && result.json.duplicate) {
        const message = result.json.message || "An account with this email already exists. Please contact admin for support.";
        const whatsappNumber = '8129048805';
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
        // fallback
        submitViaIframe(data);
      }
    } catch (err) {
      // fallback on network error
      submitViaIframe(data);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Get Instant Demo Access';
      // Hide spinner
      if (loadingBox) loadingBox.style.display = 'none'; // <--- ADDED THIS
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
      console.log('Delegated handler: btModalOk clicked');
      closeDuplicateModal();
      return;
    }
    // Close if clicking overlay
    const overlayClick = evt.target && evt.target.id === 'btModalOverlay';
    if (overlayClick) {
      console.log('Delegated handler: overlay clicked');
      closeDuplicateModal();
      return;
    }
  }, false);
})();

function showDuplicateModal(message, whatsappNumber) {
  try {
    var modal = document.getElementById('duplicateModal');
    var msgEl = document.getElementById('btModalMessage');
    var waBtn = document.getElementById('btModalWhatsApp');
    var okBtn = document.getElementById('btModalOk');
    var closeBtn = document.getElementById('btModalClose'); // may be null
    var overlay = document.getElementById('btModalOverlay'); // may be null

    const finalMessage = "An account with this email already exists. Please contact admin for support.";

    if (msgEl) msgEl.textContent = finalMessage;
    
    if (waBtn) {
      var waLink = whatsappNumber ? 'https://wa.me/' + whatsappNumber.replace(/[^0-9]/g,'') : 'https://wa.me/8129048805';
      waBtn.setAttribute('href', waLink);
    }

    if (!modal) {
      console.warn('Duplicate modal element (#duplicateModal) not found.');
      return;
    }

    // Ensure button is not a submit button to avoid form submission behavior
    if (okBtn) {
      try { okBtn.setAttribute('type', 'button'); } catch(e){}
      // remove previous listener safely by cloning node (cheap way)
      var newOk = okBtn.cloneNode(true);
      okBtn.parentNode.replaceChild(newOk, okBtn);
      newOk.addEventListener('click', function onOkClick(e){
        console.log('OK button clicked (direct handler).');
        closeDuplicateModal();
      });
    } else {
      // If okBtn not present, delegation will handle it (document click listener)
      console.warn('OK button (#btModalOk) not found — using delegated handler as fallback.');
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
      // remove/replace to avoid duplicate listeners
      var newOverlay = overlay.cloneNode(true);
      overlay.parentNode.replaceChild(newOverlay, overlay);
      newOverlay.addEventListener('click', function(){ closeDuplicateModal(); });
    }

    // make modal visible and accessible
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    // ensure it can receive pointer events
    modal.style.pointerEvents = 'auto';

    // Clear form-level status message (if present)
    if (statusEl) statusEl.textContent = '';

  } catch(e){
    console.error('showDuplicateModal error:', e);
  }
}

function closeDuplicateModal(){
  try {
    var modal=document.getElementById('duplicateModal');
    if(modal) {
      modal.style.display='none';
      modal.setAttribute('aria-hidden','true');
      console.log('Modal closed');
    }
  } catch(e){
    console.error('closeDuplicateModal error:', e);
  }
}
