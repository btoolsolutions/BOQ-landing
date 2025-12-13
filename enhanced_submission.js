
// Enhanced submission handler: shows user-friendly messages and handles duplicate responses from webapp
(function(){
  function showMessage(msg, type) {
    var box = document.getElementById('bt-message-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'bt-message-box';
      box.style.position = 'fixed';
      box.style.left = '20px';
      box.style.right = '20px';
      box.style.bottom = '20px';
      box.style.zIndex = 9999;
      box.style.padding = '14px 18px';
      box.style.borderRadius = '8px';
      box.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
      box.style.fontFamily = 'Arial, sans-serif';
      box.style.fontSize = '14px';
      box.style.display = 'none';
      document.body.appendChild(box);
    }
    box.innerHTML = msg;
    box.style.display = 'block';
    if (type === 'success') {
      box.style.background = '#e6ffed';
      box.style.color = '#064e3b';
      box.style.border = '1px solid #a7f3d0';
    } else if (type === 'warning') {
      box.style.background = '#fff7ed';
      box.style.color = '#92400e';
      box.style.border = '1px solid #ffd8a8';
    } else {
      box.style.background = '#fff1f2';
      box.style.color = '#7f1d1d';
      box.style.border = '1px solid #fecaca';
    }
    clearTimeout(window._bt_msg_timeout);
    window._bt_msg_timeout = setTimeout(function(){ box.style.display='none'; }, 8000);
  }

  window.postFormToWebApp = function(webAppUrl, formDataObj) {
    (function(){
  // form-encoded POST to avoid CORS preflight
  var __fd = new FormData();
  try { for (var k in formDataObj) if (Object.prototype.hasOwnProperty.call(formDataObj,k)) __fd.append(k, formDataObj[k]); } catch(e) { /* fallback */ }
  var __params = new URLSearchParams();
  try { for (var pair of __fd.entries()) __params.append(pair[0], pair[1]); } catch(e){}
  return fetch(webAppUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: __params.toString()
  })
})().then(function(resp){ return resp.json(); })
    .then(function(data){
      if (!data) {
        showMessage('Unexpected server response. Please try again.', 'error');
        return;
      }
      if (data.success) {
        var msg = 'Success! Your 3-day trial is active.';
        if (data.sheetUrl) {
          msg += ' <a href="' + data.sheetUrl + '" target="_blank" style="color:inherit;text-decoration:underline;">Open your BOQ sheet</a>';
        }
        showMessage(msg, 'success');
        var f = document.querySelector('form');
        if (f) f.reset();
        return;
      }
      if (data.duplicate) {
        var dupMsg = '<strong>It seems you already have an active account with this email.</strong><br>';
        if (data.expiry) dupMsg += 'Expiry: ' + data.expiry + '<br>';
        if (data.sheetUrl) dupMsg += '<a href="' + data.sheetUrl + '" target="_blank">Open your existing BOQ sheet</a><br>';
        dupMsg += 'If you need help, contact us on WhatsApp: <a href="https://wa.me/8129048805" target="_blank">+91 8129048805</a>';
        showMessage(dupMsg, 'warning');
        return;
      }
      showMessage(data.message || 'Submission failed. Please try again.', 'error');
    })
    .catch(function(err){
      console.error(err);
      showMessage('Network error: ' + (err.message || ''), 'error');
    });
  };

  document.addEventListener('DOMContentLoaded', function(){
    var btn = document.getElementById('bt-submit');
    if (btn) {
      btn.addEventListener('click', function(e){
        e.preventDefault();
        var form = btn.closest('form') || document.querySelector('form');
        if (!form) {
          showMessage('Form not found on page.', 'error');
          return;
        }
        var fd = {};
        var elements = form.querySelectorAll('input,textarea,select');
        elements.forEach(function(el){
          if (!el.name) return;
          if (el.type === 'checkbox') fd[el.name] = el.checked;
          else fd[el.name] = el.value;
        });
        var webAppUrl = window.WEB_APP_URL || form.getAttribute('data-webapp') || '';
        if (!webAppUrl) {
          showMessage('Web App URL not configured. Please set data-webapp on the form.', 'error');
          return;
        }
        postFormToWebApp(webAppUrl, fd);
      });
    }
  });
})();
