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

async function tryFetch(data) {
  try {
    const res = await (function(){
  // form-encoded POST to avoid CORS preflight
  var __fd = new FormData();
  try { for (var k in data) if (Object.prototype.hasOwnProperty.call(data,k)) __fd.append(k, data[k]); } catch(e) { /* fallback */ }
  var __params = new URLSearchParams();
  try { for (var pair of __fd.entries()) __params.append(pair[0], pair[1]); } catch(e){}
  return fetch(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: __params.toString()
  })
})();
    const text = await res.text();
    try { const json = JSON.parse(text); return {ok: res.ok, json}; } catch (e) { return {ok: res.ok, json:null}; }
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
    if (result.ok) {
      form.reset();
      showSuccess();
    } else {
      submitViaIframe(data);
    }
  } catch (err) {
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
    if (msgEl) msgEl.textContent = message || 'An account with this email already exists. Please contact admin for support.';
    if (waBtn) {
      var waLink = whatsappNumber ? 'https://wa.me/' + whatsappNumber.replace(/[^0-9]/g,'') : 'https://wa.me/8129048805';
      waBtn.setAttribute('href', waLink);
    }
    if (modal) modal.style.display = 'flex';
    // close handlers
    document.getElementById('btModalClose').onclick = function(){ closeDuplicateModal(); };
    document.getElementById('btModalOk').onclick = function(){ closeDuplicateModal(); };
    document.getElementById('btModalOverlay').onclick = function(){ closeDuplicateModal(); };
  } catch(e){ console.error(e); }
}
function closeDuplicateModal(){ var modal=document.getElementById('duplicateModal'); if(modal) modal.style.display='none'; }

// If enhanced_submission.js defines a function handleSubmissionResponse, leave it; otherwise patch fetch handling globally
(function(){
  // Helper: monkey-patch window.fetch to intercept responses from webapp and show modal on duplicate:true
  if (!window._btool_fetch_patched) {
    var origFetch = window.fetch;
    window.fetch = function(){ 
      return origFetch.apply(this, arguments).then(function(resp){
        try{
          // clone response to read JSON safely
          var cloned = resp.clone();
          return cloned.json().then(function(json){
            if (json && json.duplicate) {
              // show our modal instead of letting form continue
              var msg = json.message || 'An account with this email already exists. Please contact admin for support.';
              showDuplicateModal(msg, '8129048805');
              // return a rejected promise to indicate handled (so caller can stop)
              return Promise.reject({handled:true, payload: json});
            }
            return resp;
          }).catch(function(){ return resp; });
        }catch(e){ return resp; }
      });
    };
    window._btool_fetch_patched = true;
  }
})();
