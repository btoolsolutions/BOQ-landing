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
    const res = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
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
