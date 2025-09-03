/* ---------- Date Initialization ---------- */
function formatDateLong(d = new Date()) {
  return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}
function formatTime(d = new Date()) {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
function setPageDates() {
  const txt = formatDateLong(new Date());
  document.querySelectorAll('#date, #today-date').forEach(e => e.textContent = txt);
}

/* ---------- Toast ---------- */
function showToast(message, timeout = 3000) {
  let container = document.getElementById('campus-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'campus-toast-container';
    container.style.position = 'fixed';
    container.style.right = '20px';
    container.style.bottom = '20px';
    container.style.zIndex = 9999;
    document.body.appendChild(container);
  }

  const t = document.createElement('div');
  t.textContent = message;
  t.style.cssText = `
    background: rgba(0,0,0,0.8);
    color: #fff;
    padding: 10px 14px;
    border-radius: 10px;
    margin-top: 8px;
    box-shadow: 0 6px 18px rgba(0,0,0,0.12);
    font-size: 13px;
    opacity: 0;
    transition: opacity .18s ease, transform .18s ease;
  `;
  container.appendChild(t);

  requestAnimationFrame(() => {
    t.style.opacity = '1';
    t.style.transform = 'translateY(-4px)';
  });

  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(0)';
    setTimeout(() => t.remove(), 220);
  }, timeout);
}

/* ---------- CSV / Download Helpers ---------- */
function downloadBlob(content, filename, mime='text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportCSV(rows = [], filename = 'export.csv') {
  if (!Array.isArray(rows) || rows.length === 0) return showToast('No rows to export');
  const csv = rows.map(r => r.map(cell => {
    if (cell === null || cell === undefined) return '';
    const s = String(cell);
    return (s.includes('"') || s.includes(',') || s.includes('\n')) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
  downloadBlob(csv, filename, 'text/csv');
  showToast('CSV exported: ' + filename);
}

/* ---------- Scan Attendance ---------- */
function attachScanButtons() {
  document.querySelectorAll('[data-scan], #scan-attendance, #scan-btn').forEach(el => {
    el.addEventListener('click', () => scanAttendance(el.getAttribute('data-scan') || el.id || 'Scan'));
  });
  window.scanAttendance = scanAttendance;
}

function scanAttendance(mode = 'QR/Face Scan') {
  const now = new Date();
  const scheduled = new Date(now);
  scheduled.setHours(9, 5, 0, 0);
  const status = now > scheduled ? 'Late' : 'Present';
  const logEntry = { timestamp: now.toISOString(), status, mode, time: formatTime(now) };

  try {
    const arr = JSON.parse(localStorage.getItem('campus_attendance_log_v1') || '[]');
    arr.unshift(logEntry);
    localStorage.setItem('campus_attendance_log_v1', JSON.stringify(arr.slice(0, 200)));
  } catch(e) { console.warn(e); }

  showToast(`${mode} → ${status} at ${formatTime(now)}`);
  document.querySelectorAll('.today-status, #today-status, .status-badge').forEach(el => el.textContent = status);
  const alerts = document.querySelector('.alert-box ul');
  if (alerts) {
    const li = document.createElement('li');
    li.textContent = `Attendance ${status} recorded at ${formatTime(now)} via ${mode}`;
    alerts.prepend(li);
  }
}

/* ---------- Notes ---------- */
function saveNote(key, text) { localStorage.setItem(key, text); showToast('Note saved'); }
function loadNote(key) { return localStorage.getItem(key) || ''; }
function restoreNotesIfAny() {
  ['notes-area','note-area','class-notes','notes'].forEach(id => {
    const el = document.getElementById(id);
    if(el && el.tagName === 'TEXTAREA') {
      const saved = loadNote('campus_note_' + id);
      if(saved) el.value = saved;
      el.addEventListener('input', () => saveNote('campus_note_' + id, el.value));
    }
  });
}

/* ---------- Sidebar toggle (mobile) ---------- */
function attachSidebarToggle() {
  const toggleBtn = document.getElementById('menuToggle');
  if (!toggleBtn) return;
  toggleBtn.addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('active'));
}

/* ---------- Profile Picture ---------- */
const profilePic = document.getElementById('profilePic');
const fileInput = document.getElementById('fileInput');
profilePic.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = e => {
      profilePic.src = e.target.result;
      localStorage.setItem('campus_profile_pic', e.target.result);
      showToast('Profile picture updated!');
    };
    reader.readAsDataURL(file);
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const savedPic = localStorage.getItem('campus_profile_pic');
  if(savedPic) profilePic.src = savedPic;
});

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  setPageDates();
  attachScanButtons();
  attachSidebarToggle();
  restoreNotesIfAny();
});

window.showToast = showToast;
window.exportCSV = exportCSV;
window.downloadBlob = downloadBlob;
window.saveNote = saveNote;
window.loadNote = loadNote;
