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

function showSuccess() { successOverlay.classList.add('visible'); }
function hideSuccess() { successOverlay.classList.remove('visible'); }
closeSuccess && closeSuccess.addEventListener('click', hideSuccess);

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
  ['company','email','phone','location'].forEach(k => {
    const inp = fallbackForm.querySelector('[name="' + k + '"]');
    if (inp) inp.value = data[k] || '';
  });
  fallbackForm.submit();
  setTimeout(() => {
    showSuccess();
    form.reset();
  }, 900);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.textContent = '';
  const data = Object.fromEntries(new FormData(form).entries());
  const email = (data.email || '').trim();

  if (!form.checkValidity()) { form.reportValidity(); return; }
  if (!isGmailAddress(email)) { statusEl.textContent = 'Please enter a valid Gmail address (e.g. example@gmail.com). Other domains are not allowed.'; return; }
  if (!WEB_APP_URL) { statusEl.textContent = 'Web App URL missing.'; return; }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';
  statusEl.textContent = 'Submitting...';

  try {
    const result = await tryFetch(data);

    // --- NEW / MODIFIED DUPLICATE CHECK LOGIC ---
    if (result.json && result.json.duplicate) {
      // Use the message from the Apps Script response
      const message = result.json.message || "An account with this email already exists. Please contact admin for support.";
      const whatsappNumber = '8129048805'; // Hardcoded number from Apps Script/index.html
      
      // Update the modal with the specific warning required by the user
      showDuplicateModal(message, whatsappNumber);
      
      // Stop execution and reset submission status
      statusEl.textContent = 'Submission failed (duplicate account).';
      return; 
    }
    
    if (result.json && result.json.message) {
      statusEl.textContent = result.json.message;
    }
    // --- END DUPLICATE CHECK LOGIC ---
    
    if (result.ok && result.json && result.json.success) {
      form.reset();
      showSuccess();
    } else {
      // If result failed or wasn't a duplicate, use the old iframe fallback
      submitViaIframe(data);
    }
  } catch (err) {
    // If fetch itself failed (network issue), use iframe fallback
    submitViaIframe(data);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Get Instant Demo Access';
  }
});


/* bTool duplicate modal controller (Style 3) */
function showDuplicateModal(message, whatsappNumber) {
  try {
    var modal = document.getElementById('duplicateModal');
    var msgEl = document.getElementById('btModalMessage');
    var waBtn = document.getElementById('btModalWhatsApp');
    
    // Set the specific message required by the user
    const finalMessage = "An account with this email already exists. Please contact admin for support.";

    if (msgEl) msgEl.textContent = finalMessage;
    
    if (waBtn) {
      var waLink = whatsappNumber ? 'https://wa.me/' + whatsappNumber.replace(/[^0-9]/g,'') : 'https://wa.me/8129048805';
      waBtn.setAttribute('href', waLink);
    }
    if (modal) modal.style.display = 'flex';
    
    // close handlers
    document.getElementById('btModalClose').onclick = function(){ closeDuplicateModal(); };
    document.getElementById('btModalOk').onclick = function(){ closeDuplicateModal(); };
    document.getElementById('btModalOverlay').onclick = function(){ closeDuplicateModal(); };
    
    // Also update the status message
    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.textContent = finalMessage;

  } catch(e){ console.error(e); }
}
function closeDuplicateModal(){ var modal=document.getElementById('duplicateModal'); if(modal) modal.style.display='none'; }

// Remove the conflicting robust submit handler and monkey-patching logic from here.
// The main event listener at the top now handles submission and duplicate checks.
