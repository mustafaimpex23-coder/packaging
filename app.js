/* Vision Transit Recruitment – web demo
   Plain HTML/CSS/JavaScript, no backend. All three panels share one dataset
   stored in the browser (localStorage), so an action in one panel shows in the others.
   Sample data is rebuilt each day so "today's" shifts always line up with the clock. */
(function () {
  'use strict';

  /* ================= Constants ================= */
  const DB_KEY = 'vtr_demo_v3';
  const H = 36e5, MIN = 6e4, DAY = 864e5;
  const ROLES = ['Van Driver', 'HGV Class 1 Driver', 'HGV Class 2 Driver', '7.5T Driver', 'Warehouse Operative', 'Picker & Packer', 'Forklift Driver', 'Transport Office Staff'];
  const DRIVER_ROLES = ['Van Driver', 'HGV Class 1 Driver', 'HGV Class 2 Driver', '7.5T Driver'];
  const CPC_ROLES = ['HGV Class 1 Driver', 'HGV Class 2 Driver', '7.5T Driver'];
  const DOC_TYPES = { cv: 'CV', rtw: 'Right to work', licence: 'Driving licence', cpc: 'Driver CPC card (DQC)', forklift: 'Forklift certificate' };
  const DOC_HINT = { cv: 'Your latest CV with work history', rtw: 'Passport, BRP or Home Office share code', licence: 'Front and back of your photocard licence', cpc: 'Driver Qualification Card, in date', forklift: 'RTITB or ITSSAR certificate' };
  const EXPIRY_TYPES = ['rtw', 'licence', 'cpc', 'forklift'];
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const SHIFT_PREFS = ['Days', 'Nights', 'Weekends'];
  const SECTORS = ['Logistics', 'Courier', 'Warehouse', 'Distribution centre', 'Manufacturing'];
  const LICENCES = ['B', 'C1', 'C', 'C+E', 'D'];
  const EXPENSE_CATS = ['Office rent', 'Job advertising', 'Software & IT', 'Fuel & mileage', 'PPE & workwear', 'Insurance', 'Training & CPC', 'Phone & internet', 'Accountancy & legal', 'Vehicles & equipment', 'Other'];
  const FEATURES = ['Candidates & documents', 'Shifts & attendance', 'Timesheets', 'Payroll', 'Invoices & finance', 'Clients & jobs', 'Settings'];
  const TEAM_ROLES = ['Director', 'Recruitment consultant', 'Payroll & finance', 'Compliance officer'];
  const ME = { candidate: 'c1', employer: 'e1', admin: 't1' };
  const HOME = { candidate: 'home', employer: 'home', admin: 'dashboard' };
  const PANEL_LABEL = { candidate: 'Candidate app', employer: 'Employer portal', admin: 'Admin panel' };

  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const toastRoot = document.getElementById('toast-root');
  const ui = {
    jobs: { q: '', cat: '', type: '' }, cands: { q: '', role: '', status: '' }, act: { q: '', area: '' },
    live: 'All', ts: 'Submitted', comp: 'Needs check', apps: 'All', ajobs: 'All', inv: 'All', period: 'Financial year', week: 0, focus: null
  };
  let lastHash = null;
  let curRole = null;

  /* ================= Icons ================= */
  const PATHS = {
    home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3',
    file: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13h6M9 17h6',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
    bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0',
    plus: 'M12 5v14M5 12h14',
    briefcase: 'M3 7h18v13H3zM8 7V4h8v3M3 13h18',
    truck: 'M2 6h12v10H2zM14 9h4l4 4v3h-8zM6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    building: 'M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3M2 21h20',
    check: 'M20 6L9 17l-5-5',
    send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z',
    chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    menu: 'M3 6h18M3 12h18M3 18h18',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
    pin: 'M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
    download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
    x: 'M18 6L6 18M6 6l12 12',
    alert: 'M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
    sheet: 'M4 3h16v18H4zM4 9h16M4 15h16M10 3v18',
    wallet: 'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3zM3 7V5a2 2 0 0 1 2-2h11M16 14h.01',
    receipt: 'M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6M9 16h4',
    pound: 'M16 7a4 4 0 0 0-7 2.5V20M6 13h8M6 20h12',
    activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
    key: 'M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zM15.5 7.5l3 3L22 7l-3-3',
    gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    coffee: 'M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 2v3M10 2v3M14 2v3',
    play: 'M6 4l14 8-14 8z',
    stop: 'M6 6h12v12H6z',
    edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    left: 'M15 18l-6-6 6-6',
    right: 'M9 18l6-6-6-6'
  };
  function ic(name) { return `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${PATHS[name] || ''}"/></svg>`; }
  const LOGO = '<svg class="logo" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="9" fill="#f5b301"/><path d="M9.5 11.5h7l3.5 9 3.5-9h7l-8 18h-5z" fill="#0f1f3a"/></svg>';

  /* ================= Helpers ================= */
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function sum(arr) { return arr.reduce((a, b) => a + (Number(b) || 0), 0); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function cur() { return (db && db.settings && db.settings.currency) || '£'; }
  function money(n, dp) { dp = dp == null ? 2 : dp; const v = Number(n) || 0; return (v < 0 ? '-' : '') + cur() + Math.abs(v).toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
  function moneyK(n) { const v = Number(n) || 0; if (Math.abs(v) >= 1e6) return cur() + (v / 1e6).toFixed(1) + 'm'; if (Math.abs(v) >= 1e4) return cur() + Math.round(v / 1e3) + 'k'; if (Math.abs(v) >= 1e3) return cur() + (v / 1e3).toFixed(1) + 'k'; return cur() + Math.round(v); }
  function hrs(n) { return (Math.round((n || 0) * 100) / 100).toFixed(2); }
  function dayKey(d) { d = new Date(d); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function sod(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function weekStart(d) { const x = sod(d); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; }
  function monthStart(d) { const x = sod(d); x.setDate(1); return x; }
  function quarterStart(d) { const x = monthStart(d); x.setMonth(Math.floor(x.getMonth() / 3) * 3); return x; }
  function fyStart(d) { d = new Date(d); return new Date(d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1, 3, 1); }
  function ms(d) { return new Date(d).getTime(); }
  function fmtDate(s) { if (!s) return '—'; const d = new Date(s); return isNaN(d) ? '—' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function fmtDay(s) { const d = new Date(s); return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function fmtTime(s) { if (!s) return '—'; return new Date(s).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  function fmtDT(s) { if (!s) return '—'; return fmtDay(s) + ', ' + fmtTime(s); }
  function dtLocal(s) { const d = new Date(s); return dayKey(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function ago(s) {
    const m = Math.round((Date.now() - ms(s)) / MIN);
    if (m < 1) return 'just now';
    if (m < 60) return m + ' min ago';
    const h = Math.round(m / 60);
    if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
    const d = Math.round(h / 24);
    if (d < 30) return d + (d === 1 ? ' day ago' : ' days ago');
    return fmtDate(s);
  }
  function dur(x) { x = Math.max(0, x); const h = Math.floor(x / H), m = Math.floor(x % H / MIN), s = Math.floor(x % MIN / 1000); return h + 'h ' + pad(m) + 'm ' + pad(s) + 's'; }
  function durShort(x) { x = Math.max(0, x); const h = Math.floor(x / H), m = Math.round(x % H / MIN); return h ? h + 'h ' + pad(m) + 'm' : m + ' min'; }
  function countdown(target) { const d = ms(target) - Date.now(); if (d > 0) return 'starts in ' + durShort(d); return 'started ' + durShort(-d) + ' ago'; }
  function fmtSize(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function initials(n) { return String(n || '?').trim().split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase(); }
  function shortName(n) { const p = String(n).trim().split(/\s+/); return p.length > 1 ? p[0] + ' ' + p[p.length - 1][0] + '.' : p[0]; }
  function avatar(n, cls) { return `<span class="avatar ${cls || ''}">${esc(initials(n))}</span>`; }
  function pl(n, one, many) { return n === 1 ? one : many; }
  function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ================= Calculations ================= */
  function hoursOf(s) { if (!s.clockIn || !s.clockOut) return 0; return Math.max(0, round2((ms(s.clockOut) - ms(s.clockIn)) / H - (s.breakMins || 0) / 60)); }
  function payOf(s) { return round2(hoursOf(s) * s.payRate); }
  function holOf(s, pct) { return round2(payOf(s) * (pct == null ? db.settings.holidayPct : pct) / 100); }
  function grossOf(s, pct) { return round2(payOf(s) + holOf(s, pct)); }
  function chargeOf(s) { return round2(hoursOf(s) * s.chargeRate); }
  function ctax(p) { if (p <= 0) return 0; if (p <= 50000) return p * 0.19; if (p >= 250000) return p * 0.25; return p * 0.25 - (250000 - p) * 3 / 200; }
  function linesFromShifts(list) {
    const g = {};
    list.forEach(s => { const k = s.role + '|' + s.chargeRate; g[k] = g[k] || { desc: s.role + ' – temporary labour', qty: 0, rate: s.chargeRate }; g[k].qty += hoursOf(s); });
    return Object.values(g).map(l => ({ desc: l.desc, qty: round2(l.qty), rate: l.rate, amount: round2(l.qty * l.rate) }));
  }

  /* ================= Sample data ================= */
  function seed() {
    const R = rng(7341);
    const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
    const now = Date.now();
    const t0 = sod(now).getTime();
    const iso = x => new Date(x).toISOString();
    const rates = {
      'Van Driver': { pay: 14.00, charge: 18.90 }, 'HGV Class 1 Driver': { pay: 20.50, charge: 27.40 }, 'HGV Class 2 Driver': { pay: 17.50, charge: 23.60 },
      '7.5T Driver': { pay: 15.50, charge: 20.90 }, 'Warehouse Operative': { pay: 12.60, charge: 16.80 }, 'Picker & Packer': { pay: 12.21, charge: 16.20 },
      'Forklift Driver': { pay: 13.80, charge: 18.50 }, 'Transport Office Staff': { pay: 16.00, charge: 22.00 }
    };
    const settings = {
      company: 'Vision Transit Recruitment Ltd', vatNo: 'GB 123 4567 89', companyNo: '12345678', address: 'United Kingdom', email: 'office@visiontransit.example', phone: '0121 496 0999',
      currency: '£', vatRate: 20, holidayPct: 12.07, onCostPct: 13, graceMins: 10, geofence: 200, geofenceOn: true, autoClockOutHrs: 14,
      paymentTerms: 30, invoicePrefix: 'VTR-', nextInvoice: 0, dubaiEnabled: false, rates
    };
    const week = on => Object.fromEntries(DAYS.map(d => [d, on.includes(d)]));
    const doc = (type, fileName, status, daysAgo, expDays, note) => ({ id: uid('d'), type, fileName, size: (120 + ri(0, 600)) * 1024, uploaded: iso(now - daysAgo * DAY), status, note: note || '', expiry: expDays == null ? '' : dayKey(now + expDays * DAY), data: null });
    const MF = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], MS = MF.concat('Sat');
    const C = (id, name, phone, postcode, city, role, experience, licence, about, days, shifts, docs, createdDays, availStatus) => ({
      id, name, email: name.toLowerCase().replace(/\s+/g, '.') + '@example.com', phone, postcode, city, role, experience, licence, about, status: 'Active',
      availability: { days: week(days), shifts, status: availStatus || 'Available now', from: '' }, docs, createdAt: iso(now - createdDays * DAY)
    });
    const candidates = [
      C('c1', 'James Carter', '07700 900123', 'B12 0AA', 'Birmingham', 'HGV Class 1 Driver', 6, ['B', 'C', 'C+E'], 'Class 1 driver with 6 years on trunking and multi-drop. Curtain-siders and box trailers, digital tacho, clean licence.', MS, ['Days', 'Nights'],
        [doc('cv', 'James_Carter_CV.pdf', 'Verified', 40), doc('rtw', 'Passport_JCarter.jpg', 'Verified', 40, 1100), doc('licence', 'Driving_Licence_Front_Back.pdf', 'Verified', 39, 800), doc('cpc', 'DQC_Card.jpg', 'Pending', 1, 1400)], 41),
      C('c2', 'Amira Hussain', '07700 900456', 'LE4 9HA', 'Leicester', 'Warehouse Operative', 3, ['B'], 'Goods-in, RF scanning and pick-to-light. Happy with early or late shifts.', MF, ['Days'],
        [doc('cv', 'Amira_Hussain_CV.docx', 'Verified', 30), doc('rtw', 'BRP_Card.jpg', 'Verified', 30, 45)], 31),
      C('c3', 'Tomasz Nowak', '07700 900789', 'CV6 5RS', 'Coventry', 'Forklift Driver', 8, ['B'], 'Counterbalance and reach truck, RTITB certified. Prefers long-term work.', MF, ['Days'],
        [doc('cv', 'T_Nowak_CV.pdf', 'Verified', 60), doc('rtw', 'EU_Settlement_Status.pdf', 'Verified', 60), doc('forklift', 'RTITB_Counterbalance.pdf', 'Verified', 59, 300)], 61),
      C('c4', 'Daniel Okafor', '07700 900321', 'M11 2NA', 'Manchester', 'Van Driver', 2, ['B'], 'Multi-drop van driver, 120+ drops a day, own sat-nav and phone.', DAYS, ['Days', 'Weekends'],
        [doc('cv', 'Daniel_Okafor_CV.pdf', 'Pending', 1), doc('rtw', 'Passport_DOkafor.jpg', 'Verified', 11, 2000), doc('licence', 'Licence_Photo.jpg', 'Rejected', 3, 900, 'Back of licence is missing. Please upload both sides.')], 12),
      C('c5', 'Priya Sharma', '07700 900654', 'NN11 4TX', 'Daventry', 'Picker & Packer', 1, ['B'], 'Fast, accurate picker with peak-season experience at two online retailers.', MS, ['Days', 'Weekends'],
        [doc('cv', 'Priya_Sharma_CV.pdf', 'Verified', 25), doc('rtw', 'Passport_PSharma.jpg', 'Verified', 25, 1500)], 25),
      C('c6', 'Lee Thompson', '07700 900987', 'NG7 2AB', 'Nottingham', 'HGV Class 2 Driver', 9, ['B', 'C1', 'C'], 'Rigid driver, multi-drop and tail-lift deliveries across the East Midlands.', MF, ['Days'],
        [doc('cv', 'Lee_Thompson_CV.pdf', 'Verified', 80), doc('rtw', 'Passport_LThompson.jpg', 'Verified', 80, 1800), doc('licence', 'Licence_LThompson.pdf', 'Verified', 80, 1000), doc('cpc', 'DQC_LThompson.jpg', 'Verified', 80, 20)], 80),
      C('c7', 'Marek Kowalski', '07700 900222', 'DE24 8EP', 'Derby', '7.5T Driver', 4, ['B', 'C1'], 'Two-person furniture and white goods delivery.', MF, ['Days'],
        [doc('cv', 'Marek_K_CV.pdf', 'Verified', 50), doc('rtw', 'EU_Settlement_MK.pdf', 'Verified', 50), doc('licence', 'Licence_MK.jpg', 'Verified', 50, -5), doc('cpc', 'DQC_MK.jpg', 'Verified', 50, 600)], 50),
      C('c8', 'Sophie Bennett', '07700 900333', 'B5 7RN', 'Birmingham', 'Transport Office Staff', 5, ['B'], 'Transport planner using Paragon and Microlise. Looking for a permanent role.', MF, ['Days'],
        [doc('cv', 'Sophie_Bennett_CV.pdf', 'Verified', 20), doc('rtw', 'Passport_SB.jpg', 'Verified', 20, 2400)], 20, 'Not available'),
      C('c9', 'Ahmed Raza', '07700 900444', 'B10 0AB', 'Birmingham', 'Van Driver', 3, ['B'], 'Same-day and parcel delivery. Own phone and sat-nav.', DAYS, ['Days', 'Weekends'],
        [doc('cv', 'Ahmed_Raza_CV.pdf', 'Verified', 35), doc('rtw', 'Passport_AR.jpg', 'Verified', 35, 1700), doc('licence', 'Licence_AR.pdf', 'Verified', 35, 400)], 35),
      C('c10', 'Grace Adeyemi', '07700 900555', 'LE2 7DP', 'Leicester', 'Warehouse Operative', 2, ['B'], 'Reach truck trained, goods-in and despatch. Days or nights.', MF, ['Days', 'Nights'],
        [doc('cv', 'Grace_Adeyemi_CV.pdf', 'Verified', 5), doc('rtw', 'ShareCode_Grace.png', 'Pending', 1, 700)], 5)
    ];
    const E = (id, company, contact, email, phone, sector, address, status, createdDays, creditLimit) => ({ id, company, contact, email, phone, sector, address, sites: [address], companyNo: '', status, creditLimit, createdAt: iso(now - createdDays * DAY) });
    const employers = [
      E('e1', 'Northlink Logistics Ltd', 'Sarah Mitchell', 'ops@northlink.example', '0121 496 0000', 'Logistics', 'Tyburn Road depot, Birmingham B24', 'Approved', 400, 40000),
      E('e2', 'SwiftDrop Couriers', 'Imran Shah', 'hello@swiftdrop.example', '0161 496 0111', 'Courier', 'Trafford Park hub, Manchester M17', 'Approved', 300, 25000),
      E('e3', 'Midlands Packaging Co', 'Gareth Hughes', 'gareth@midlandspack.example', '0115 496 0222', 'Manufacturing', 'Colwick Industrial Estate, Nottingham NG4', 'Pending', 1, 15000),
      E('e4', 'Daventry Fulfilment Centre', 'Laura Grant', 'laura@daventryfc.example', '0116 496 0333', 'Warehouse', 'DIRFT Unit 7, Daventry NN6', 'Approved', 250, 35000),
      E('e5', 'Peak Distribution Ltd', 'Mark Ellis', 'mark@peakdist.example', '0115 496 0555', 'Distribution centre', 'Sinfin Lane DC, Derby DE24', 'Approved', 200, 20000)
    ];
    const siteOf = id => employers.find(e => e.id === id).sites[0];
    const mk = (cid, eid, role, st, en, extra) => Object.assign({
      id: uid('s'), candidateId: cid, clientId: eid, role, site: siteOf(eid), start: iso(st), end: iso(en), payRate: rates[role].pay, chargeRate: rates[role].charge,
      clockIn: null, clockOut: null, breakStart: null, breakMins: 0, gps: null, status: 'Scheduled', ts: null, tsNote: '', tsBy: '', invoiceId: null, payrunId: null, manual: false
    }, extra || {});
    const crew = [['c1', 'e1', 'HGV Class 1 Driver', 6, 10], ['c2', 'e4', 'Warehouse Operative', 6, 8.5], ['c3', 'e1', 'Forklift Driver', 7, 9], ['c4', 'e2', 'Van Driver', 7, 10], ['c5', 'e4', 'Picker & Packer', 6, 8.5],
      ['c6', 'e5', 'HGV Class 2 Driver', 5, 10], ['c7', 'e5', '7.5T Driver', 6, 9], ['c9', 'e2', 'Van Driver', 7, 10], ['c10', 'e4', 'Warehouse Operative', 14, 8.5]];
    const shifts = [];
    // Past two weeks
    for (let k = 14; k >= 1; k--) {
      const day = t0 - k * DAY, dow = new Date(day).getDay();
      if (dow === 0) continue;
      crew.forEach(([cid, eid, role, sh, len]) => {
        if (dow === 6 && R() < 0.6) return;
        if (R() < 0.1) return;
        const st = day + sh * H, en = st + len * H;
        const ci = st + ri(-9, 13) * MIN, co = en + ri(-4, 18) * MIN;
        const ts = k <= 7 ? (R() < 0.3 ? 'Submitted' : 'Approved') : 'Approved';
        const s = mk(cid, eid, role, st, en, { clockIn: iso(ci), clockOut: iso(co), breakMins: len >= 9 ? 45 : 30, status: 'Completed', ts, tsBy: ts === 'Approved' ? 'client' : '', gps: { ok: true, dist: ri(15, 160) } });
        s.k = k;
        shifts.push(s);
      });
    }
    const queried = shifts.filter(s => s.candidateId === 'c5' && s.k <= 4).pop();
    if (queried) { queried.ts = 'Queried'; queried.tsBy = ''; queried.tsNote = 'Client says the worker left site 30 minutes early. Please confirm the clock-out time.'; }
    const noshow = shifts.filter(s => s.candidateId === 'c4' && s.k >= 2 && s.k <= 6).pop();
    if (noshow) Object.assign(noshow, { status: 'No-show', clockIn: null, clockOut: null, ts: null, tsBy: '', gps: null, breakMins: 0 });
    // Today (relative to the current time)
    const T = (cid, eid, role, off, len, extra) => { const st = now + off * H; shifts.push(mk(cid, eid, role, st, st + len * H, extra)); };
    T('c3', 'e1', 'Forklift Driver', -3, 9, { clockIn: iso(now - 3 * H + 3 * MIN), gps: { ok: true, dist: 64 } });
    T('c2', 'e4', 'Warehouse Operative', -1.5, 8.5, { clockIn: iso(now - 1.5 * H - 4 * MIN), breakStart: iso(now - 12 * MIN), gps: { ok: true, dist: 38 } });
    T('c5', 'e4', 'Picker & Packer', -2, 8.5, { clockIn: iso(now - 2 * H + 14 * MIN), gps: { ok: true, dist: 112 } });
    T('c4', 'e2', 'Van Driver', -25 / 60, 10);
    T('c1', 'e1', 'HGV Class 1 Driver', 20 / 60, 10);
    T('c6', 'e5', 'HGV Class 2 Driver', 2, 10);
    T('c9', 'e2', 'Van Driver', -11, 9, { clockIn: iso(now - 11 * H + 2 * MIN), clockOut: iso(now - 2 * H + 6 * MIN), breakMins: 45, status: 'Completed', ts: 'Submitted', gps: { ok: true, dist: 41 } });
    T('c7', 'e5', '7.5T Driver', 5, 9);
    T('c10', 'e4', 'Warehouse Operative', 3.5, 8.5);
    // Next six days
    for (let k = 1; k <= 6; k++) {
      const day = t0 + k * DAY, dow = new Date(day).getDay();
      if (dow === 0) continue;
      crew.forEach(([cid, eid, role, sh, len]) => { if (dow === 6 && !['c4', 'c9', 'c5'].includes(cid)) return; const st = day + sh * H; shifts.push(mk(cid, eid, role, st, st + len * H)); });
    }
    [[1, 'e1', 'HGV Class 1 Driver', 22, 9], [2, 'e2', 'Van Driver', 7, 10], [2, 'e4', 'Picker & Packer', 6, 8.5], [3, 'e5', '7.5T Driver', 6, 9], [4, 'e4', 'Picker & Packer', 6, 8.5]]
      .forEach(([k, eid, role, sh, len]) => { const st = t0 + k * DAY + sh * H; shifts.push(mk(null, eid, role, st, st + len * H)); });

    // Invoices
    const invoices = [];
    let invNo = 1040;
    const makeInv = (eid, issue, lines, status, paidAt, period, shiftIds) => {
      const net = round2(sum(lines.map(l => l.amount))), vat = round2(net * settings.vatRate / 100);
      const inv = { id: uid('i'), number: settings.invoicePrefix + (invNo++), clientId: eid, issued: dayKey(issue), due: dayKey(issue + settings.paymentTerms * DAY), period, lines, net, vatRate: settings.vatRate, vat, total: round2(net + vat), status, paidAt: paidAt ? dayKey(paidAt) : '', shiftIds: shiftIds || [] };
      invoices.push(inv);
      return inv;
    };
    const fy = fyStart(now), thisMonth = monthStart(now);
    const monthly = { e1: [18000, 24000, 25.0], e2: [9000, 13000, 18.9], e4: [14000, 20000, 16.5], e5: [7000, 10000, 22.0] };
    const payruns = [];
    for (let m = new Date(fy); m < thisMonth; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
      const label = m.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      const issue = new Date(m.getFullYear(), m.getMonth() + 1, 1).getTime();
      let monthNet = 0;
      Object.keys(monthly).forEach(eid => {
        const [lo, hi, rate] = monthly[eid];
        const qty = round2(ri(lo, hi) / rate), amount = round2(qty * rate);
        monthNet += amount;
        let paid = issue + ri(20, 34) * DAY, status = 'Paid';
        if (paid > now) { status = 'Sent'; paid = null; }
        if (eid === 'e2' && issue + settings.paymentTerms * DAY < now && issue + (settings.paymentTerms + 31) * DAY > now) { status = 'Sent'; paid = null; }
        makeInv(eid, issue, [{ desc: 'Temporary labour – ' + label + ' (monthly summary)', qty, rate, amount }], status, paid, label, []);
      });
      const gross = round2(monthNet * 0.745), basic = round2(gross / (1 + settings.holidayPct / 100));
      payruns.push({ id: uid('p'), date: dayKey(new Date(m.getFullYear(), m.getMonth() + 1, 0)), label: 'Monthly payroll – ' + label, workers: ri(18, 27), hours: round2(gross / 14.6), basic, holiday: round2(gross - basic), gross, lines: [], status: 'Paid' });
    }
    // Week-two invoices and pay run built from real shifts
    const wk2 = shifts.filter(s => s.k >= 8 && s.status === 'Completed');
    const periodLabel = fmtDay(t0 - 14 * DAY) + ' – ' + fmtDay(t0 - 8 * DAY);
    [['e1', 'Paid'], ['e2', 'Sent'], ['e4', 'Sent'], ['e5', 'Paid']].forEach(([eid, st]) => {
      const list = wk2.filter(s => s.clientId === eid);
      if (!list.length) return;
      const inv = makeInv(eid, now - 6 * DAY, linesFromShifts(list), st, st === 'Paid' ? now - DAY : null, periodLabel, list.map(s => s.id));
      list.forEach(s => { s.invoiceId = inv.id; });
    });
    const prId = uid('p');
    const byC = {};
    wk2.forEach(s => { (byC[s.candidateId] = byC[s.candidateId] || []).push(s); s.payrunId = prId; });
    const prLines = Object.keys(byC).map(cid => { const l = byC[cid]; const basic = round2(sum(l.map(payOf))), hol = round2(basic * settings.holidayPct / 100); return { candidateId: cid, shiftIds: l.map(s => s.id), hours: round2(sum(l.map(hoursOf))), basic, holiday: hol, gross: round2(basic + hol) }; });
    payruns.push({ id: prId, date: dayKey(now - 5 * DAY), label: 'Weekly payroll – ' + periodLabel, workers: prLines.length, hours: round2(sum(prLines.map(l => l.hours))), basic: round2(sum(prLines.map(l => l.basic))), holiday: round2(sum(prLines.map(l => l.holiday))), gross: round2(sum(prLines.map(l => l.gross))), lines: prLines, status: 'Paid' });
    shifts.forEach(s => { delete s.k; });
    settings.nextInvoice = invNo;

    // Expenses since the start of the financial year
    const expenses = [];
    const ex = (d, category, supplier, net, vatRate, note) => { if (d > now) return; expenses.push({ id: uid('x'), date: dayKey(d), category, supplier, net: round2(net), vat: round2(net * vatRate / 100), note: note || '', receipt: '' }); };
    for (let m = new Date(fy); m <= thisMonth; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
      const d0 = m.getTime();
      ex(d0, 'Office rent', 'Office landlord', 1250, 20);
      ex(d0 + 3 * DAY, 'Job advertising', 'Indeed', ri(400, 900), 20);
      ex(d0 + 5 * DAY, 'Software & IT', 'Rota and payroll software', 185, 20);
      ex(d0 + 8 * DAY, 'Fuel & mileage', 'Fuel card', ri(150, 320), 20);
      ex(d0 + 11 * DAY, 'PPE & workwear', 'Hi-vis and safety boots', ri(90, 260), 20);
      ex(d0 + 13 * DAY, 'Insurance', 'Employers liability insurance', 320, 0);
      ex(d0 + 17 * DAY, 'Phone & internet', 'Business broadband and mobiles', 95, 20);
      if (m.getMonth() % 3 === 2) ex(d0 + 20 * DAY, 'Accountancy & legal', 'Accountants (quarterly)', 450, 20);
      if (R() < 0.45) ex(d0 + 22 * DAY, 'Training & CPC', 'Driver CPC course', ri(250, 480), 0);
    }

    const J = (id, title, category, location, type, pay, shift, positions, startDays, description, requirements, employerId, status, createdDays) => ({ id, title, category, location, type, pay, shift, positions, start: dayKey(now + startDays * DAY), description, requirements, employerId, status, createdAt: iso(now - createdDays * DAY) });
    const jobs = [
      J('j1', 'HGV Class 1 Driver – Night Trunking', 'HGV Class 1 Driver', 'Birmingham', 'Temporary', '£20.50/hr', 'Nights 22:00–07:00', 3, 3, 'Trunking between our Birmingham hub and Daventry DIRFT. Home every day. Curtain-sider trailers.', 'Cat C+E licence, valid CPC, digital tacho card, max 6 points.', 'e1', 'Open', 2),
      J('j2', 'Multi-drop Van Driver', 'Van Driver', 'Manchester', 'Temporary', '£14.00/hr', 'Days 07:00–17:00', 5, 2, 'Parcel delivery in South Manchester. Van and fuel provided. Around 110 drops a day.', 'Full UK licence held 2+ years, max 6 points.', 'e2', 'Open', 1),
      J('j3', 'Warehouse Operative', 'Warehouse Operative', 'Daventry', 'Temporary', '£12.60/hr', 'Rotating 06:00–14:30 / 14:00–22:30', 10, 5, 'Goods-in, put-away and replenishment in a busy distribution centre.', 'Safety boots. RF scanner experience preferred.', 'e4', 'Open', 3),
      J('j4', 'Counterbalance Forklift Driver', 'Forklift Driver', 'Birmingham', 'Permanent', '£28,500/yr', 'Days, Mon–Fri', 1, 14, 'Loading and unloading curtain-siders in the yard. Pension and overtime.', 'RTITB or ITSSAR counterbalance certificate.', 'e1', 'Open', 6),
      J('j5', '7.5T Driver – Two-person Delivery', '7.5T Driver', 'Derby', 'Temporary', '£15.50/hr', 'Days 06:00–15:00', 2, 4, 'Two-person home delivery of furniture across the East Midlands.', 'C1 licence, valid CPC, good customer service.', 'e5', 'Open', 5),
      J('j6', 'Pickers & Packers – Peak Season', 'Picker & Packer', 'Daventry', 'Temporary', '£12.21/hr', 'Days, nights or weekends', 25, 10, 'Peak season picking and packing for an online retailer. Weekly pay, free parking.', 'No experience needed. Safety boots required.', 'e4', 'Open', 1),
      J('j7', 'Transport Planner', 'Transport Office Staff', 'Birmingham', 'Permanent', '£32,000/yr', 'Office hours', 1, 21, 'Planning daily routes for a 40-vehicle fleet using Paragon.', 'Transport planning experience. Transport Manager CPC desirable.', 'e1', 'Pending approval', 0.2),
      J('j8', 'HGV Class 2 Driver – Multi-drop', 'HGV Class 2 Driver', 'Derby', 'Temp to perm', '£17.50/hr', 'Days 05:00–15:00', 2, 7, 'Multi-drop rigid deliveries to retail stores. Tail-lift experience helpful.', 'Cat C licence, valid CPC.', 'e5', 'Open', 4),
      J('j9', 'Warehouse Operative – Nights', 'Warehouse Operative', 'Manchester', 'Temporary', '£13.40/hr', 'Nights 22:00–06:30', 6, 6, 'Night shift sortation in a parcel hub.', 'Able to lift up to 25 kg.', 'e2', 'Open', 2)
    ];
    const A = (id, jobId, candidateId, status, days, extra) => Object.assign({ id, jobId, candidateId, status, createdAt: iso(now - days * DAY) }, extra || {});
    const applications = [
      A('a1', 'j1', 'c1', 'Interview', 1.5, { interviewDate: dtLocal(now + 2 * DAY).slice(0, 11) + '10:00', interviewNote: 'Assessment drive at Tyburn Road depot. Bring your licence and CPC card.' }),
      A('a2', 'j3', 'c2', 'Pending', 2), A('a3', 'j4', 'c3', 'Approved', 5), A('a4', 'j2', 'c4', 'Pending', 0.5),
      A('a5', 'j5', 'c1', 'Rejected', 4), A('a6', 'j6', 'c5', 'Pending', 0.8), A('a7', 'j2', 'c9', 'Approved', 6), A('a8', 'j8', 'c6', 'Pending', 1.2), A('a9', 'j9', 'c10', 'Pending', 0.3)
    ];
    const bookings = [
      { id: 'b1', employerId: 'e1', role: 'HGV Class 1 Driver', qty: 3, type: 'Temporary', start: dayKey(now + 5 * DAY), shift: 'Nights', site: siteOf('e1'), notes: 'Holiday cover, two weeks minimum.', candidateId: null, status: 'In progress', createdAt: iso(now - 3 * DAY) },
      { id: 'b2', employerId: 'e2', role: 'Van Driver', qty: 5, type: 'Temporary', start: dayKey(now + 7 * DAY), shift: 'Days', site: siteOf('e2'), notes: 'Peak season, likely 8 weeks.', candidateId: null, status: 'Requested', createdAt: iso(now - DAY) },
      { id: 'b3', employerId: 'e4', role: 'Picker & Packer', qty: 8, type: 'Temporary', start: dayKey(now + 4 * DAY), shift: 'Mixed', site: siteOf('e4'), notes: 'Black Friday volume. Weekend cover needed too.', candidateId: null, status: 'Requested', createdAt: iso(now - 0.4 * DAY) }
    ];
    const N = (to, title, body, hoursAgo) => ({ id: uid('n'), to, title, body, createdAt: iso(now - hoursAgo * H), readBy: [] });
    const notifications = [
      N('candidate:c1', 'Shift reminder', 'You are booked at Tyburn Road depot today. Remember to clock in when you arrive.', 2),
      N('candidate:c1', 'Interview booked', 'Assessment drive for HGV Class 1 Driver – Night Trunking. See My applications for the date and time.', 30),
      N('all-candidates', 'Peak season roles are open', 'We have 40+ temporary warehouse and van roles starting this month. Keep your availability up to date.', 50),
      N('employer:e1', 'Booking update', 'Your request for 3 HGV Class 1 Drivers is in progress. 2 candidates are being checked.', 20),
      N('employer:e1', 'Worker on site', 'Tomasz N. clocked in at Tyburn Road depot.', 3)
    ];
    const clockEvents = [];
    const ev = (t, cid, type, text, by) => clockEvents.push({ id: uid('k'), at: iso(t), candidateId: cid, type, text, by: by || 'app' });
    ev(now - 11 * H + 2 * MIN, 'c9', 'in', 'Clocked in at Trafford Park hub (41 m from site)');
    ev(now - 3 * H + 3 * MIN, 'c3', 'in', 'Clocked in at Tyburn Road depot (64 m from site)');
    ev(now - 2 * H + 14 * MIN, 'c5', 'in', 'Clocked in 14 min late at DIRFT Unit 7 (112 m from site)');
    ev(now - 2 * H + 6 * MIN, 'c9', 'out', 'Clocked out. 8.07 hours worked');
    ev(now - 1.5 * H - 4 * MIN, 'c2', 'in', 'Clocked in at DIRFT Unit 7 (38 m from site)');
    ev(now - 12 * MIN, 'c2', 'break', 'Started break');
    const L = (minsAgo, who, area, text) => ({ id: uid('l'), at: iso(now - minsAgo * MIN), who, area, text });
    const activity = [
      L(12, 'Amira Hussain', 'Attendance', 'Started break at DIRFT Unit 7'),
      L(95, 'Amira Hussain', 'Attendance', 'Clocked in at DIRFT Unit 7'),
      L(106, 'Priya Sharma', 'Attendance', 'Clocked in 14 min late at DIRFT Unit 7'),
      L(114, 'Ahmed Raza', 'Attendance', 'Clocked out at Trafford Park hub'),
      L(177, 'Tomasz Nowak', 'Attendance', 'Clocked in at Tyburn Road depot'),
      L(240, 'Hannah Price', 'Finance', 'Recorded expense: Job advertising (Indeed)'),
      L(420, 'Ben Walsh', 'Compliance', 'Rejected Driving licence for Daniel Okafor: back of licence missing'),
      L(600, 'Kelly Morgan', 'Payroll', 'Ran weekly payroll'),
      L(1440, 'Omar Siddiqui', 'Recruitment', 'Booked interview for James Carter'),
      L(1500, 'Sarah Mitchell (Northlink Logistics Ltd)', 'Jobs', 'Posted job: Transport Planner')
    ];
    const team = [
      { id: 't1', name: 'Hannah Price', role: 'Director', email: 'hannah@visiontransit.example', status: 'Active', lastActive: iso(now) },
      { id: 't2', name: 'Omar Siddiqui', role: 'Recruitment consultant', email: 'omar@visiontransit.example', status: 'Active', lastActive: iso(now - 40 * MIN) },
      { id: 't3', name: 'Kelly Morgan', role: 'Payroll & finance', email: 'kelly@visiontransit.example', status: 'Active', lastActive: iso(now - 3 * H) },
      { id: 't4', name: 'Ben Walsh', role: 'Compliance officer', email: 'ben@visiontransit.example', status: 'Active', lastActive: iso(now - DAY) }
    ];
    const perms = {
      'Director': FEATURES.slice(),
      'Recruitment consultant': ['Candidates & documents', 'Shifts & attendance', 'Clients & jobs'],
      'Payroll & finance': ['Timesheets', 'Payroll', 'Invoices & finance'],
      'Compliance officer': ['Candidates & documents']
    };
    return { version: 3, seededOn: dayKey(now), settings, team, perms, candidates, employers, jobs, applications, bookings, shifts, invoices, payruns, expenses, notifications, clockEvents, activity };
  }

  let db = null;
  function load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) { const d = JSON.parse(raw); if (d && d.version === 3 && d.seededOn === dayKey(Date.now())) return d; }
    } catch (e) { /* storage unavailable */ }
    const s = seed();
    try { localStorage.setItem(DB_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
    return s;
  }
  db = load();
  function save() { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); return true; } catch (e) { return false; } }

  /* ================= Lookups ================= */
  const job = id => db.jobs.find(j => j.id === id);
  const cand = id => db.candidates.find(c => c.id === id);
  const emp = id => db.employers.find(e => e.id === id);
  const shiftById = id => db.shifts.find(s => s.id === id);
  const invById = id => db.invoices.find(i => i.id === id);
  function employerName(id) { if (!id) return 'Vision Transit (direct)'; const e = emp(id); return e ? e.company : '—'; }
  function candName(id) { const c = cand(id); return c ? c.name : 'Unassigned'; }
  function actor(role) { return role === 'candidate' ? cand(ME.candidate) : role === 'employer' ? emp(ME.employer) : db.team.find(t => t.id === ME.admin) || db.team[0]; }
  function actorName() { if (curRole === 'employer') { const e = actor('employer'); return e.contact + ' (' + e.company + ')'; } const u = curRole ? actor(curRole) : null; return u ? u.name : 'System'; }
  function openJobs() { return db.jobs.filter(j => j.status === 'Open').sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  function hasApplied(c, jobId) { return db.applications.some(a => a.candidateId === c.id && a.jobId === jobId); }
  function requiredDocs(c) {
    const r = ['cv', 'rtw'];
    if (DRIVER_ROLES.includes(c.role)) r.push('licence');
    if (CPC_ROLES.includes(c.role)) r.push('cpc');
    if (c.role === 'Forklift Driver') r.push('forklift');
    return r;
  }
  function docOf(c, type) { return c.docs.find(d => d.type === type); }
  function daysLeft(expiry) { if (!expiry) return null; return Math.round((ms(expiry + 'T12:00:00') - Date.now()) / DAY); }
  function docState(d) {
    if (!d) return 'Missing';
    if (d.status === 'Pending') return 'Needs check';
    if (d.status === 'Rejected') return 'Rejected';
    const dl = daysLeft(d.expiry);
    if (dl != null && dl < 0) return 'Expired';
    if (dl != null && dl <= 60) return 'Expiring';
    return 'Valid';
  }
  function verifiedCount(c) { return requiredDocs(c).filter(t => ['Valid', 'Expiring'].includes(docState(docOf(c, t)))).length; }
  function compliant(c) { return verifiedCount(c) === requiredDocs(c).length; }
  function complianceItems() {
    const out = [];
    db.candidates.forEach(c => {
      const req = requiredDocs(c);
      req.forEach(t => { if (!docOf(c, t)) out.push({ c, d: null, type: t, state: 'Missing', dl: null }); });
      c.docs.forEach(d => out.push({ c, d, type: d.type, state: docState(d), dl: daysLeft(d.expiry) }));
    });
    return out;
  }
  function notify(to, title, body) { db.notifications.push({ id: uid('n'), to, title, body, createdAt: new Date().toISOString(), readBy: [] }); }
  function notesFor(role, id) { return db.notifications.filter(n => n.to === role + ':' + id || n.to === 'all-' + role + 's').sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  function unreadCount(role, id) { const key = role + ':' + id; return notesFor(role, id).filter(n => !n.readBy.includes(key)).length; }
  function markRead(role, id) { const key = role + ':' + id; notesFor(role, id).forEach(n => { if (!n.readBy.includes(key)) n.readBy.push(key); }); save(); }
  function log(area, text) { db.activity.unshift({ id: uid('l'), at: new Date().toISOString(), who: actorName(), area, text }); if (db.activity.length > 400) db.activity.length = 400; }

  /* Shift state */
  function shiftState(s) {
    if (s.status === 'Cancelled') return 'Cancelled';
    if (s.status === 'No-show') return 'No-show';
    if (s.clockOut) return 'Completed';
    if (s.breakStart) return 'On break';
    if (s.clockIn) return 'On site';
    if (!s.candidateId) return 'Unfilled';
    const now = Date.now(), st = ms(s.start);
    if (now > st + db.settings.graceMins * MIN) return 'Late';
    if (st - now <= 60 * MIN) return 'Due soon';
    return 'Scheduled';
  }
  function lateBy(s) { if (!s.clockIn) return 0; return Math.round((ms(s.clockIn) - ms(s.start)) / MIN); }
  function liveShifts() {
    const now = Date.now();
    return db.shifts.filter(s => s.candidateId && s.status !== 'Cancelled' && (
      (s.clockIn && !s.clockOut) ||
      (ms(s.start) >= now - 12 * H && ms(s.start) <= now + 16 * H) ||
      (s.clockOut && ms(s.clockOut) >= now - 12 * H)
    )).sort((a, b) => ms(a.start) - ms(b.start));
  }
  function myTodayShift(cid) {
    const list = liveShifts().filter(s => s.candidateId === cid && s.status !== 'No-show');
    const now = Date.now();
    return list.find(s => s.clockIn && !s.clockOut) || list.filter(s => s.clockOut && now - ms(s.clockOut) < 4 * H).pop() || list.find(s => !s.clockIn && ms(s.end) > now) || list.filter(s => s.clockOut).pop() || null;
  }
  function invState(i) { if (i.status === 'Sent' && daysLeft(i.due) < 0) return 'Overdue'; return i.status; }
  function autoClose() {
    const lim = db.settings.autoClockOutHrs * H;
    let changed = false;
    db.shifts.forEach(s => {
      if (s.clockIn && !s.clockOut && Date.now() - ms(s.clockIn) > lim) {
        if (s.breakStart) { s.breakMins += Math.round((ms(s.end) - ms(s.breakStart)) / MIN); s.breakStart = null; }
        s.clockOut = s.end; s.status = 'Completed'; s.ts = 'Submitted'; s.tsNote = 'Automatically clocked out after ' + db.settings.autoClockOutHrs + ' hours. Please check the times.';
        changed = true;
      }
    });
    if (changed) save();
  }

  /* ================= UI helpers ================= */
  const OK = ['Verified', 'Approved', 'Open', 'Filled', 'Available now', 'Paid', 'Completed', 'On site', 'Active', 'Live', 'Valid'];
  const BAD = ['Rejected', 'Suspended', 'Cancelled', 'Closed', 'Not available', 'Late', 'No-show', 'Overdue', 'Expired', 'Missing'];
  const PEND = ['Pending', 'Submitted', 'Requested', 'Draft', 'Due soon', 'Expiring', 'Unfilled', 'Pending approval', 'Available from date', 'Queried', 'Needs check', 'Ready'];
  const INFO = ['Interview', 'In progress', 'Scheduled', 'Sent', 'On break', 'Planned', 'Opening soon', 'Temporary', 'Permanent', 'Temp to perm'];
  function chip(s, live) {
    const cls = OK.includes(s) ? 'chip-ok' : BAD.includes(s) ? 'chip-bad' : PEND.includes(s) ? 'chip-pending' : INFO.includes(s) ? 'chip-info' : '';
    const isLive = live !== false && (s === 'On site' || s === 'On break' || s === 'Late');
    return `<span class="chip ${cls} ${isLive ? 'live' : ''}">${esc(s)}</span>`;
  }
  function stat(label, value, sub, tone) { return `<div class="stat ${tone || ''}"><span>${esc(label)}</span><strong>${value}</strong>${sub ? `<small>${sub}</small>` : ''}</div>`; }
  function empty(msg) { return `<div class="empty">${esc(msg)}</div>`; }
  function opts(list, sel, placeholder) { return (placeholder != null ? `<option value="">${esc(placeholder)}</option>` : '') + list.map(o => { const v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; return `<option value="${esc(v)}" ${String(v) === String(sel) ? 'selected' : ''}>${esc(t)}</option>`; }).join(''); }
  function pills(name, list, selected) { return `<div class="pills">${list.map(o => `<label class="pill"><input type="checkbox" name="${name}" value="${esc(o)}" ${(selected || []).includes(o) ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>`; }
  function tabs(key, values, counts) { return `<div class="tabs" role="tablist">${values.map(v => `<button type="button" class="${ui[key] === v ? 'on' : ''}" data-action="set-tab" data-key="${key}" data-val="${esc(v)}">${esc(v)}${counts && counts[v] ? `<em>${counts[v]}</em>` : ''}</button>`).join('')}</div>`; }
  function card(title, actions, body, extraCls) { return `<section class="card ${extraCls || ''}"><div class="card-head"><h3>${title}</h3>${actions || ''}</div>${body}</section>`; }
  function personCell(c, sub) { return `<div class="person">${avatar(c.name)}<div><b>${esc(c.name)}</b><span class="sub">${esc(sub == null ? c.role : sub)}</span></div></div>`; }
  function go(h) { if (location.hash === h) render(); else location.hash = h; }
  function hbars(entries, fmt) {
    const max = Math.max(1, ...entries.map(e => e[1]));
    return `<div class="bars">${entries.map(([k, v]) => `<div class="bar-row"><span class="bar-label" title="${esc(k)}">${esc(k)}</span><div class="bar-track"><span style="width:${(v / max * 100).toFixed(1)}%"></span></div><span class="bar-val">${fmt ? fmt(v) : v}</span></div>`).join('')}</div>`;
  }
  function vbars(entries, fmt, hlLast) {
    const max = Math.max(1, ...entries.map(e => e.v));
    return `<div class="vchart"><div class="vbars">${entries.map((e, i) => `<div class="vcol ${hlLast && i === entries.length - 1 ? 'hl' : ''}" title="${esc(e.label)}: ${esc(fmt(e.v))}"><span class="vval">${e.v ? esc(fmt(e.v)) : ''}</span><div class="vbar" style="height:${(e.v / max * 82).toFixed(1)}%"></div></div>`).join('')}</div>
      <div class="vlabels">${entries.map(e => `<span>${esc(e.short || e.label)}</span>`).join('')}</div></div>`;
  }

  /* ================= Toast & modal ================= */
  function toast(msg, type) {
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    toastRoot.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3200);
  }
  function openModal(title, body, wide) {
    modalRoot.innerHTML = `<div class="modal-backdrop" data-action="backdrop"><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-head"><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-action="close-modal" aria-label="Close">${ic('x')}</button></div><div class="modal-body">${body}</div></div></div>`;
    document.body.style.overflow = 'hidden';
    const f = modalRoot.querySelector('input:not([type=hidden]):not([type=checkbox]),select,textarea');
    if (f) f.focus();
  }
  function closeModal() { modalRoot.innerHTML = ''; document.body.style.overflow = ''; }

  /* ================= Landing page ================= */
  function landingView() {
    const onSite = liveShifts().filter(s => ['On site', 'On break'].includes(shiftState(s))).length;
    return `<div class="land">
      <div class="land-top">
        <header class="land-head">
          <a class="brand brand-light" href="#/">${LOGO}<span><b>Vision Transit</b><small>Recruitment</small></span></a>
          <span class="demo-pill">Live demo</span>
        </header>
        <section class="land-intro">
          <p class="eyebrow">Recruitment platform · United Kingdom</p>
          <h1>Drivers and warehouse staff, managed in one place.</h1>
          <p class="lead">Choose a panel to open it. Each one is already filled with sample candidates, clients, shifts and invoices. What you do in one panel shows up in the other two.</p>
        </section>
      </div>
      <div class="land-cards">
        <a class="pcard" href="#/candidate/home">
          <span class="tag">${ic('user')}</span>
          <div><h2>Candidate app</h2><p class="as">Opens as James Carter, HGV Class 1 driver</p></div>
          <ul><li>Clock in and out of today's shift</li><li>Find jobs and apply in one tap</li><li>Upload licence, CPC and right to work</li><li>See hours worked and payslips</li></ul>
          <span class="go">Open candidate app ${ic('arrow')}</span>
        </a>
        <a class="pcard" href="#/employer/home">
          <span class="tag">${ic('building')}</span>
          <div><h2>Employer portal</h2><p class="as">Opens as Northlink Logistics Ltd</p></div>
          <ul><li>See which workers are on site now</li><li>Post jobs and request staff</li><li>Approve timesheets</li><li>View and download invoices</li></ul>
          <span class="go">Open employer portal ${ic('arrow')}</span>
        </a>
        <a class="pcard featured" href="#/admin/dashboard">
          <span class="tag">${ic('shield')}</span>
          <div><h2>Admin panel</h2><p class="as">Opens as Hannah Price, Operations Director</p></div>
          <ul><li>Live clock-in board: ${onSite} workers on site now</li><li>Rota, timesheets and payroll</li><li>Invoices, VAT, expenses and tax estimate</li><li>Compliance, reports, team access and settings</li></ul>
          <span class="go">Open admin panel ${ic('arrow')}</span>
        </a>
      </div>
      <div class="land-body">
        <section class="try">
          <h3>Try this in one minute</h3>
          <ol>
            <li><span>Open the <a href="#/candidate/home">candidate app</a> and press <b>Clock in</b> on today's shift.</span></li>
            <li><span>Open the <a href="#/admin/live">admin live board</a>. James now shows as on site, with a running timer.</span></li>
            <li><span>Clock him out, then approve his timesheet in <a href="#/admin/timesheets">Timesheets</a>.</span></li>
            <li><span>Run <a href="#/admin/payroll">Payroll</a> and create the client's invoice in <a href="#/admin/invoices">Invoices</a>. The payslip appears in the candidate app.</span></li>
          </ol>
        </section>
        <div class="facts">
          <div class="fact"><h4>Roles we supply</h4><div class="roles">${ROLES.map(r => `<span>${esc(r)}</span>`).join('')}</div></div>
          <div class="fact"><h4>Markets</h4><div class="markets">
            <div class="market"><span>${ic('pin')} United Kingdom</span>${chip('Live', false)}</div>
            <div class="market"><span>${ic('globe')} Dubai, UAE</span>${chip(db.settings.dubaiEnabled ? 'Opening soon' : 'Planned', false)}</div>
          </div></div>
        </div>
      </div>
      <footer class="land-foot"><span>© ${new Date().getFullYear()} Vision Transit Recruitment · Demo with sample data</span><button type="button" class="linklike" data-action="reset-demo">Reset demo data</button></footer>
    </div>`;
  }

  /* ================= Shell ================= */
  const NAV = {
    candidate: [[null, [['home', 'Home', 'home'], ['shifts', 'My shifts & pay', 'clock'], ['jobs', 'Find jobs', 'briefcase'], ['applications', 'My applications', 'list'], ['documents', 'Documents', 'file'], ['profile', 'Profile & availability', 'user']]]],
    employer: [[null, [['home', 'Home', 'home'], ['jobs', 'Jobs & applicants', 'briefcase'], ['requests', 'Request staff', 'truck'], ['timesheets', 'Timesheets', 'sheet'], ['invoices', 'Invoices', 'receipt'], ['company', 'Company', 'building']]]],
    admin: [
      ['Overview', [['dashboard', 'Dashboard', 'home'], ['live', 'Live attendance', 'clock']]],
      ['Workforce', [['shifts', 'Shifts & rota', 'calendar'], ['timesheets', 'Timesheets', 'sheet'], ['candidates', 'Candidates', 'users'], ['compliance', 'Compliance', 'shield']]],
      ['Recruitment', [['applications', 'Applications', 'list'], ['jobs', 'Jobs', 'briefcase'], ['clients', 'Clients', 'building'], ['requests', 'Staff requests', 'truck']]],
      ['Finance', [['payroll', 'Payroll', 'wallet'], ['invoices', 'Invoices', 'receipt'], ['finance', 'Expenses & tax', 'pound'], ['reports', 'Reports', 'chart']]],
      ['System', [['notify', 'Notifications', 'send'], ['activity', 'Activity log', 'activity'], ['team', 'Team & access', 'key'], ['settings', 'Settings', 'gear']]]
    ]
  };
  function navTitle(role, key) { for (const g of NAV[role]) for (const it of g[1]) if (it[0] === key) return it[1]; return ''; }
  function navBadge(role, key) {
    if (role === 'candidate') {
      const c = actor('candidate');
      if (key === 'home') return unreadCount('candidate', c.id);
      if (key === 'documents') return requiredDocs(c).filter(t => ['Missing', 'Rejected', 'Expired'].includes(docState(docOf(c, t)))).length;
      return 0;
    }
    if (role === 'employer') {
      if (key === 'timesheets') return db.shifts.filter(s => s.clientId === ME.employer && s.ts === 'Submitted').length;
      if (key === 'home') return unreadCount('employer', ME.employer);
      return 0;
    }
    if (key === 'live') return liveShifts().filter(s => shiftState(s) === 'Late').length;
    if (key === 'timesheets') return db.shifts.filter(s => s.ts === 'Submitted' || s.ts === 'Queried').length;
    if (key === 'compliance') return complianceItems().filter(x => ['Needs check', 'Expired'].includes(x.state)).length;
    if (key === 'applications') return db.applications.filter(a => a.status === 'Pending').length;
    if (key === 'jobs') return db.jobs.filter(j => j.status === 'Pending approval').length;
    if (key === 'clients') return db.employers.filter(e => e.status === 'Pending').length;
    if (key === 'requests') return db.bookings.filter(b => b.status === 'Requested').length;
    if (key === 'invoices') return db.invoices.filter(i => invState(i) === 'Overdue').length;
    return 0;
  }
  function shell(role, active, content) {
    const u = actor(role);
    const who = role === 'employer' ? u.company : u.name;
    const sub = role === 'candidate' ? u.role : role === 'employer' ? u.contact + ', ' + u.sector : u.role;
    let nav = '';
    NAV[role].forEach(([label, items]) => {
      if (label) nav += `<div class="nav-group">${label}</div>`;
      items.forEach(([k, t, icn]) => { const n = navBadge(role, k); nav += `<a href="#/${role}/${k}" class="${k === active ? 'active' : ''}">${ic(icn)}<span>${t}</span>${n ? `<em>${n}</em>` : ''}</a>`; });
    });
    return `<div class="shell">
      <aside class="side">
        <a class="brand brand-light" href="#/">${LOGO}<span><b>Vision Transit</b><small>${PANEL_LABEL[role]}</small></span></a>
        <nav class="side-nav" aria-label="${PANEL_LABEL[role]}">${nav}</nav>
        <div class="side-switch"><span>Switch panel</span><div>${['candidate', 'employer', 'admin'].map(r => `<a href="#/${r}/${HOME[r]}" class="${r === role ? 'on' : ''}">${cap(r)}</a>`).join('')}</div></div>
        <div class="side-foot">${avatar(who)}<div><b>${esc(who)}</b><small>${esc(sub)}</small></div></div>
      </aside>
      <div class="scrim" data-action="toggle-nav"></div>
      <div class="main">
        <header class="topbar">
          <button type="button" class="icon-btn menu-btn" data-action="toggle-nav" aria-label="Open menu">${ic('menu')}</button>
          <h1>${esc(navTitle(role, active))}</h1>
          ${role === 'admin' ? `<span class="top-clock">${ic('clock')}<span data-clock="full"></span></span>` : ''}
          <a class="btn ghost sm" href="#/">${ic('logout')}<span class="hide-sm">Exit demo</span></a>
        </header>
        <div class="content">${content}</div>
      </div>
    </div>`;
  }

  /* ================= Shared blocks ================= */
  function jobCard(j, c) {
    const applied = c && hasApplied(c, j.id);
    return `<article class="job">
      <div class="job-top"><div><h4>${esc(j.title)}</h4><p class="muted small">${esc(employerName(j.employerId))}</p></div>${chip(j.type)}</div>
      <div class="job-meta"><span>${ic('pin')}${esc(j.location)}</span><span>${ic('clock')}${esc(j.shift)}</span><span class="pay">${esc(j.pay)}</span></div>
      <div class="job-foot"><small class="muted">Posted ${ago(j.createdAt)}</small><div class="btn-row">
        <button type="button" class="btn ghost sm" data-action="view-job" data-id="${j.id}">Details</button>
        ${c ? (applied ? chip('Applied') : `<button type="button" class="btn primary sm" data-action="apply" data-id="${j.id}">Apply</button>`) : ''}
      </div></div>
    </article>`;
  }
  function jobForm(isAdmin) {
    return `<form class="form" data-form="post-job">
      <div class="form-grid">
        <label class="full">Job title<input id="jf-title" name="title" required placeholder="e.g. HGV Class 2 Driver – Days"></label>
        <label>Category<select id="jf-cat" name="category" required>${opts(ROLES, '', 'Select category')}</select></label>
        <label>Location<input id="jf-loc" name="location" required placeholder="Town or city"></label>
        <label>Contract type<select id="jf-type" name="type">${opts(['Temporary', 'Permanent', 'Temp to perm'], 'Temporary')}</select></label>
        <label>Pay rate<input id="jf-pay" name="pay" required placeholder="e.g. £15.50/hr or £30,000/yr"></label>
        <label>Shift pattern<input id="jf-shift" name="shift" required placeholder="e.g. Nights 22:00–06:00"></label>
        <label>Positions<input id="jf-pos" type="number" name="positions" min="1" value="1" required></label>
        <label>Start date<input id="jf-start" type="date" name="start" required value="${dayKey(Date.now() + 3 * DAY)}"></label>
        ${isAdmin ? `<label>Client<select id="jf-client" name="employerId"><option value="">Vision Transit (direct)</option>${db.employers.filter(e => e.status === 'Approved').map(e => `<option value="${e.id}">${esc(e.company)}</option>`).join('')}</select></label>` : ''}
        <label class="full">Job description<textarea id="jf-desc" name="description" required placeholder="Duties, site details, vehicle type"></textarea></label>
        <label class="full">Requirements<textarea id="jf-req" name="requirements" placeholder="Licence category, CPC, certificates, experience"></textarea></label>
      </div>
      <div class="form-actions"><button type="button" class="btn ghost" data-action="close-modal">Cancel</button><button class="btn primary">${isAdmin ? 'Publish job' : 'Submit for approval'}</button></div>
    </form>`;
  }
  function docsSummary(c) { const v = verifiedCount(c), r = requiredDocs(c).length; return `<span class="chip ${v === r ? 'chip-ok' : 'chip-pending'}">${v}/${r} checks</span>`; }
  function notesList(list, key) {
    if (!list.length) return empty('No notifications yet.');
    return `<div class="list">${list.map(n => `<div class="list-item"><span class="dot ${n.readBy.includes(key) ? '' : 'on'}"></span><div class="grow"><b>${esc(n.title)}</b><p class="muted small">${esc(n.body)}</p></div><small class="muted nowrap">${ago(n.createdAt)}</small></div>`).join('')}</div>`;
  }
  function clockButtons(s, size) {
    const st = shiftState(s), b = size === 'lg' ? 'lg' : 'sm';
    if (['Scheduled', 'Due soon', 'Late'].includes(st)) return `<button type="button" class="btn primary ${b}" data-action="clock" data-op="in" data-id="${s.id}">${ic('play')}Clock in</button>`;
    if (st === 'On site') return `<button type="button" class="btn outline ${b}" data-action="clock" data-op="break" data-id="${s.id}">${ic('coffee')}Start break</button><button type="button" class="btn dark ${b}" data-action="clock" data-op="out" data-id="${s.id}">${ic('stop')}Clock out</button>`;
    if (st === 'On break') return `<button type="button" class="btn primary ${b}" data-action="clock" data-op="resume" data-id="${s.id}">${ic('play')}End break</button>`;
    return '';
  }
  function invoiceTable(list, admin) {
    if (!list.length) return empty('No invoices in this list.');
    return `<div class="table-wrap"><table><thead><tr><th>Invoice</th>${admin ? '<th>Client</th>' : ''}<th>Period</th><th>Issued</th><th>Due</th><th class="num">Net</th><th class="num">Total</th><th>Status</th><th></th></tr></thead><tbody>
      ${list.map(i => { const st = invState(i); return `<tr><td><b>${esc(i.number)}</b></td>${admin ? `<td>${esc(employerName(i.clientId))}</td>` : ''}<td class="small">${esc(i.period)}</td><td class="nowrap">${fmtDate(i.issued)}</td><td class="nowrap">${fmtDate(i.due)}${st === 'Overdue' ? `<span class="flag">${-daysLeft(i.due)} days overdue</span>` : ''}</td>
        <td class="num">${money(i.net)}</td><td class="num"><b>${money(i.total)}</b></td><td>${chip(st)}</td>
        <td><div class="btn-row"><button type="button" class="btn ghost sm" data-action="view-invoice" data-id="${i.id}">${ic('eye')}View</button>
        ${admin && i.status === 'Draft' ? `<button type="button" class="btn outline sm" data-action="invoice-status" data-id="${i.id}" data-status="Sent">${ic('send')}Send</button>` : ''}
        ${admin && i.status === 'Sent' ? `<button type="button" class="btn success sm" data-action="invoice-status" data-id="${i.id}" data-status="Paid">Mark paid</button>` : ''}</div></td></tr>`; }).join('')}
    </tbody></table></div>`;
  }

  /* ================= Candidate panel ================= */
  const CANDIDATE = {
    home(c) {
      const s = myTodayShift(c.id);
      const ws = weekStart(Date.now()).getTime();
      const mine = db.shifts.filter(x => x.candidateId === c.id);
      const weekDone = mine.filter(x => x.clockOut && ms(x.start) >= ws);
      const next = mine.filter(x => !x.clockIn && x.status === 'Scheduled' && ms(x.start) > Date.now() && (!s || x.id !== s.id)).sort((a, b) => ms(a.start) - ms(b.start))[0];
      const matches = openJobs().filter(j => j.category === c.role && !hasApplied(c, j.id)).slice(0, 3);
      const html = `
      ${s ? todayShiftCard(s) : `<section class="card welcome"><div><h2>Hi ${esc(c.name.split(' ')[0])}, no shift today</h2><p class="muted">${next ? 'Your next shift is ' + fmtDT(next.start) + ' at ' + esc(next.site) + '.' : 'Keep your availability up to date so we can offer you work.'}</p></div><a class="btn outline" href="#/candidate/jobs">Find work</a></section>`}
      <div class="stats">
        ${stat('Hours this week', hrs(sum(weekDone.map(hoursOf))), weekDone.length + ' shifts completed', 'accent')}
        ${stat('Earnings this week', money(sum(weekDone.map(x => grossOf(x)))), 'Before tax, includes holiday pay')}
        ${stat('Next shift', next ? esc(fmtDay(next.start)) : '—', next ? fmtTime(next.start) + ' · ' + esc(employerName(next.clientId)) : 'Nothing booked yet')}
        ${stat('Documents', verifiedCount(c) + '/' + requiredDocs(c).length, compliant(c) ? 'All checks complete' : 'Some checks still open', compliant(c) ? 'good' : '')}
      </div>
      <div class="grid-2">
        ${card('Notifications', '', notesList(notesFor('candidate', c.id).slice(0, 4), 'candidate:' + c.id))}
        ${card('Jobs for ' + esc(c.role) + 's', '<a href="#/candidate/jobs">See all jobs</a>', matches.length ? matches.map(j => `<div class="mini-job"><div><b>${esc(j.title)}</b><p class="muted small">${esc(j.location)} · ${esc(j.pay)}</p></div><button type="button" class="btn primary sm" data-action="apply" data-id="${j.id}">Apply</button></div>`).join('') : empty('No new jobs for your role right now.'))}
      </div>`;
      markRead('candidate', c.id);
      return html;
    },

    shifts(c) {
      const mine = db.shifts.filter(x => x.candidateId === c.id && x.status !== 'Cancelled');
      const upcoming = mine.filter(x => !x.clockIn && x.status === 'Scheduled' && ms(x.end) > Date.now()).sort((a, b) => ms(a.start) - ms(b.start)).slice(0, 8);
      const past = mine.filter(x => x.clockOut || x.status === 'No-show').sort((a, b) => ms(b.start) - ms(a.start)).slice(0, 15);
      const slips = db.payruns.filter(p => p.lines.some(l => l.candidateId === c.id)).sort((a, b) => b.date.localeCompare(a.date));
      const s = myTodayShift(c.id);
      return `${s ? todayShiftCard(s) : ''}
      ${card('Upcoming shifts', '', upcoming.length ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Time</th><th>Client & site</th><th>Role</th><th class="num">Pay rate</th></tr></thead><tbody>
        ${upcoming.map(x => `<tr><td class="nowrap"><b>${fmtDay(x.start)}</b></td><td class="nowrap">${fmtTime(x.start)}–${fmtTime(x.end)}</td><td>${esc(employerName(x.clientId))}<span class="sub">${esc(x.site)}</span></td><td>${esc(x.role)}</td><td class="num">${money(x.payRate)}/hr</td></tr>`).join('')}
      </tbody></table></div>` : empty('No upcoming shifts booked.'))}
      ${card('Hours worked', '', past.length ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Site</th><th>Clocked in</th><th>Clocked out</th><th class="num">Break</th><th class="num">Hours</th><th class="num">Pay</th><th>Timesheet</th><th>Paid</th></tr></thead><tbody>
        ${past.map(x => x.status === 'No-show' ? `<tr><td class="nowrap">${fmtDay(x.start)}</td><td>${esc(x.site)}</td><td colspan="5" class="muted">Did not attend</td><td>${chip('No-show', false)}</td><td>—</td></tr>` :
        `<tr><td class="nowrap">${fmtDay(x.start)}</td><td>${esc(x.site)}</td><td class="num">${fmtTime(x.clockIn)}</td><td class="num">${fmtTime(x.clockOut)}</td><td class="num">${x.breakMins} min</td><td class="num"><b>${hrs(hoursOf(x))}</b></td><td class="num">${money(grossOf(x))}</td><td>${chip(x.ts || '—')}</td><td>${x.payrunId ? chip('Paid') : '<span class="muted small">Next pay run</span>'}</td></tr>`).join('')}
      </tbody></table></div>` : empty('No shifts worked yet.'))}
      ${card('Payslips', '', slips.length ? `<div class="list">${slips.map(p => { const l = p.lines.find(x => x.candidateId === c.id); return `<div class="list-item"><span class="step-ic ok">${ic('wallet')}</span><div class="grow"><b>Paid ${fmtDate(p.date)}</b><p class="muted small">${l.shiftIds.length} shifts · ${hrs(l.hours)} hours</p></div><b class="num">${money(l.gross)}</b><button type="button" class="btn ghost sm" data-action="view-payslip" data-id="${p.id}" data-c="${c.id}">View</button></div>`; }).join('')}</div>` : empty('Your first payslip appears here after payroll runs.'))}`;
    },

    jobs(c) {
      const f = ui.jobs, q = f.q.trim().toLowerCase();
      const list = openJobs().filter(j => (!f.cat || j.category === f.cat) && (!f.type || j.type === f.type) && (!q || (j.title + ' ' + j.location + ' ' + employerName(j.employerId)).toLowerCase().includes(q)));
      return `<section class="card"><div class="filters">
          <div class="search">${ic('search')}<input id="f-jobs-q" data-filter="jobs.q" value="${esc(f.q)}" placeholder="Search job title, town or company" aria-label="Search jobs"></div>
          <select id="f-jobs-cat" data-filter="jobs.cat" aria-label="Category">${opts(ROLES, f.cat, 'All categories')}</select>
          <select id="f-jobs-type" data-filter="jobs.type" aria-label="Contract type">${opts(['Temporary', 'Permanent', 'Temp to perm'], f.type, 'All contract types')}</select>
        </div></section>
        <p class="muted small">${list.length} job${list.length === 1 ? '' : 's'} found</p>
        ${list.length ? `<div class="jobs">${list.map(j => jobCard(j, c)).join('')}</div>` : `<section class="card">${empty('No jobs match your search.')}</section>`}`;
    },

    applications(c) {
      const apps = db.applications.filter(a => a.candidateId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return card('Job history', '<a class="btn outline sm" href="#/candidate/jobs">Find more jobs</a>', apps.length ? `<div class="table-wrap"><table><thead><tr><th>Job</th><th>Company</th><th>Applied</th><th>Status</th><th>Details</th></tr></thead><tbody>
        ${apps.map(a => { const j = job(a.jobId) || { title: 'Removed job', location: '', employerId: null, pay: '' }; return `<tr>
          <td><b>${esc(j.title)}</b><span class="sub">${esc(j.location)} · ${esc(j.pay)}</span></td><td>${esc(employerName(j.employerId))}</td><td class="nowrap">${fmtDate(a.createdAt)}</td><td>${chip(a.status)}</td>
          <td class="small">${a.status === 'Interview' ? `<b>${fmtDT(a.interviewDate)}</b><span class="sub">${esc(a.interviewNote || '')}</span>` : a.status === 'Approved' ? 'Our team will call you with start details.' : a.status === 'Rejected' ? 'Not successful this time.' : 'Being reviewed by our team.'}</td></tr>`; }).join('')}
      </tbody></table></div>` : empty('You have not applied for any jobs yet.'));
    },

    documents(c) {
      const req = requiredDocs(c);
      const types = req.concat(c.docs.map(d => d.type).filter(t => !req.includes(t)));
      if (!types.includes('forklift') && ['Forklift Driver', 'Warehouse Operative'].includes(c.role)) types.push('forklift');
      return `<div class="banner info">${ic('shield')}<div><b>Why we need these</b><p class="small">UK law requires us to check your right to work before you start. Drivers also need a valid licence and, for HGV and 7.5T work, a Driver CPC card. We check documents within 24 hours and remind you before anything expires.</p></div></div>
      ${card('Your documents', '<span class="muted small">PDF, JPG, PNG or Word · max 5 MB</span>', types.map(t => {
        const d = docOf(c, t), st = docState(d), dl = d ? daysLeft(d.expiry) : null;
        return `<div class="doc-row">
          <span class="doc-ic">${ic('file')}</span>
          <div><b>${esc(DOC_TYPES[t])}${req.includes(t) ? '<span class="req">Required</span>' : ''}</b>
            <span class="muted small">${d ? `${esc(d.fileName)} · uploaded ${ago(d.uploaded)}${d.expiry ? ' · expires ' + fmtDate(d.expiry) + (dl != null && dl >= 0 && dl <= 60 ? ' (' + dl + ' days)' : '') : ''}` : esc(DOC_HINT[t])}</span>
            ${d && d.status === 'Rejected' && d.note ? `<div class="note-bad">${esc(d.note)}</div>` : ''}${st === 'Expired' ? '<div class="note-bad">This document has expired. Please upload the new one.</div>' : ''}</div>
          <div>${chip(st === 'Valid' ? 'Verified' : st)}</div>
          <div class="btn-row">${d ? `<button type="button" class="btn ghost sm" data-action="view-doc" data-c="${c.id}" data-d="${d.id}">View</button>` : ''}
            <button type="button" class="btn ${d && st !== 'Expired' && st !== 'Rejected' ? 'outline' : 'primary'} sm" data-action="upload-doc" data-type="${t}">${ic('upload')}${d ? 'Replace' : 'Upload'}</button></div>
        </div>`;
      }).join(''))}`;
    },

    profile(c) {
      const a = c.availability;
      return `<div class="grid-2">
      ${card('Personal details', '', `<form class="form" data-form="cand-profile"><div class="form-grid">
          <label class="full">Full name<input id="cp-name" name="name" value="${esc(c.name)}" required></label>
          <label>Email<input id="cp-email" type="email" name="email" value="${esc(c.email)}" required></label>
          <label>Mobile<input id="cp-phone" type="tel" name="phone" value="${esc(c.phone)}" required></label>
          <label>Town / city<input id="cp-city" name="city" value="${esc(c.city)}"></label>
          <label>Postcode<input id="cp-pc" name="postcode" value="${esc(c.postcode)}" required></label>
          <label>Main role<select id="cp-role" name="role">${opts(ROLES, c.role)}</select></label>
          <label>Years of experience<input id="cp-exp" type="number" min="0" max="50" name="experience" value="${esc(c.experience)}"></label>
          <fieldset class="full"><legend>Driving licence categories</legend>${pills('licence', LICENCES, c.licence)}</fieldset>
          <label class="full">About you<textarea id="cp-about" name="about">${esc(c.about)}</textarea></label>
        </div><div class="form-actions"><button class="btn primary">Save profile</button></div></form>`)}
      ${card('Availability', '', `<form class="form" data-form="availability">
          <fieldset><legend>Days you can work</legend><div class="days">${DAYS.map(d => `<label class="day"><input type="checkbox" name="days" value="${d}" ${a.days[d] ? 'checked' : ''}><span>${d}</span></label>`).join('')}</div></fieldset>
          <fieldset><legend>Preferred shifts</legend>${pills('shifts', SHIFT_PREFS, a.shifts)}</fieldset>
          <label>Status<select id="av-status" name="status">${opts(['Available now', 'Available from date', 'Not available'], a.status)}</select></label>
          <label>Available from<input id="av-from" type="date" name="from" value="${esc(a.from)}"><span class="hint">Only needed for "Available from date"</span></label>
          <div class="form-actions"><button class="btn primary">Save availability</button></div>
        </form>`)}
      </div>`;
    }
  };

  function todayShiftCard(s) {
    const st = shiftState(s), set = db.settings;
    let timer, note;
    if (st === 'On site') timer = `<small>On shift for</small><strong data-since="${s.clockIn}">${dur(Date.now() - ms(s.clockIn))}</strong><small>Clocked in at ${fmtTime(s.clockIn)}${s.breakMins ? ' · ' + s.breakMins + ' min break taken' : ''}</small>`;
    else if (st === 'On break') timer = `<small>On break for</small><strong data-since="${s.breakStart}">${dur(Date.now() - ms(s.breakStart))}</strong><small>Clocked in at ${fmtTime(s.clockIn)}</small>`;
    else if (st === 'Completed') timer = `<small>Shift complete</small><strong>${hrs(hoursOf(s))} hrs</strong><small>${fmtTime(s.clockIn)}–${fmtTime(s.clockOut)} · about ${money(grossOf(s))} before tax</small>`;
    else timer = `<small>Shift ${st === 'Late' ? 'started' : 'starts'} at ${fmtTime(s.start)}</small><strong>${fmtTime(s.start)}</strong><small data-countdown="${s.start}">${countdown(s.start)}</small>`;
    if (s.gps && s.gps.ok) note = `${ic('shield')}<span>Location verified: ${s.gps.dist} m from ${esc(s.site)}</span>`;
    else if (set.geofenceOn) note = `${ic('pin')}<span>When you clock in, we check you are within ${set.geofence} m of ${esc(s.site)}.</span>`;
    else note = `${ic('pin')}<span>${esc(s.site)}</span>`;
    return `<section class="card shift-hero">
      <div class="sh-top"><div><p class="eyebrow-sm">${dayKey(s.start) === dayKey(Date.now()) || s.clockIn ? 'Today\'s shift' : dayKey(s.start) === dayKey(Date.now() + DAY) ? 'Next shift · tomorrow' : 'Next shift'}</p><h2>${esc(s.role)} · ${esc(employerName(s.clientId))}</h2><p>${fmtDay(s.start)} · ${fmtTime(s.start)}–${fmtTime(s.end)} · ${money(s.payRate)}/hr</p></div>${chip(st)}</div>
      <div class="sh-body"><div class="sh-timer">${timer}</div><div class="sh-actions">${clockButtons(s, 'lg') || (st === 'Completed' ? '<a class="btn outline" href="#/candidate/shifts">See hours</a>' : '')}</div></div>
      <p class="sh-note">${note}</p>
    </section>`;
  }

  /* ================= Employer panel ================= */
  const EMPLOYER = {
    home(e) {
      const mine = db.shifts.filter(s => s.clientId === e.id && s.status !== 'Cancelled');
      const live = liveShifts().filter(s => s.clientId === e.id);
      const onSite = live.filter(s => ['On site', 'On break', 'Late'].includes(shiftState(s)));
      const ws = weekStart(Date.now()).getTime(), we = ws + 7 * DAY, mStart = monthStart(Date.now()).getTime();
      const week = mine.filter(s => ms(s.start) >= ws && ms(s.start) < we);
      const monthDone = mine.filter(s => s.clockOut && ms(s.start) >= mStart);
      const upcoming = mine.filter(s => !s.clockIn && s.status === 'Scheduled' && ms(s.start) > Date.now() && ms(s.start) < Date.now() + 3 * DAY).sort((a, b) => ms(a.start) - ms(b.start)).slice(0, 8);
      const tsWaiting = mine.filter(s => s.ts === 'Submitted').length;
      const html = `
      <div class="card welcome"><div><h2>${esc(e.company)}</h2><p class="muted">${esc(e.sector)} · ${esc(e.address)}</p></div>
        <div class="btn-row"><button type="button" class="btn primary" data-action="post-job-modal">${ic('plus')}Post a job</button><a class="btn outline" href="#/employer/requests">Request staff</a></div></div>
      <div class="stats">
        ${stat('On site now', onSite.filter(s => shiftState(s) !== 'Late').length, onSite.filter(s => shiftState(s) === 'Late').length + ' running late', 'accent')}
        ${stat('Shifts this week', week.length, week.filter(s => !s.candidateId).length + ' still being filled')}
        ${stat('Hours this month', hrs(sum(monthDone.map(hoursOf))), monthDone.length + ' shifts worked')}
        ${stat('Spend this month', moneyK(sum(monthDone.map(chargeOf))), 'Excluding VAT')}
      </div>
      ${tsWaiting ? `<div class="banner">${ic('sheet')}<div><b>${tsWaiting} timesheet${tsWaiting === 1 ? '' : 's'} waiting for your approval</b><p class="small">Approve them so we can pay the workers and invoice you correctly. <a href="#/employer/timesheets">Review timesheets</a></p></div></div>` : ''}
      <div class="grid-2">
        ${card('Your workers today', '', onSite.length || live.length ? `<div class="list">${live.map(s => { const st = shiftState(s), c = cand(s.candidateId); return `<div class="list-item">${avatar(c.name, 'sm')}<div class="grow"><b>${esc(shortName(c.name))}</b><p class="muted small">${esc(s.role)} · ${fmtTime(s.start)}–${fmtTime(s.end)}${st === 'On site' ? ' · on site <span class="elapsed" data-since="' + s.clockIn + '"></span>' : ''}</p></div>${chip(st)}</div>`; }).join('')}</div>` : empty('No workers booked for today.'))}
        ${card('Coming up (next 3 days)', '', upcoming.length ? `<div class="list">${upcoming.map(s => `<div class="list-item"><span class="step-ic ${s.candidateId ? '' : 'warn'}">${ic('calendar')}</span><div class="grow"><b>${fmtDay(s.start)} · ${fmtTime(s.start)}–${fmtTime(s.end)}</b><p class="muted small">${esc(s.role)} · ${s.candidateId ? esc(shortName(candName(s.candidateId))) : 'Being filled by Vision Transit'}</p></div></div>`).join('')}</div>` : empty('Nothing booked in the next 3 days.'))}
      </div>
      ${card('Updates from Vision Transit', '', notesList(notesFor('employer', e.id).slice(0, 5), 'employer:' + e.id))}`;
      markRead('employer', e.id);
      return html;
    },

    jobs(e) {
      const jobs = db.jobs.filter(j => j.employerId === e.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return card('Your jobs', `<button type="button" class="btn primary sm" data-action="post-job-modal">${ic('plus')}Post a job</button>`, jobs.length ? `<div class="table-wrap"><table><thead><tr><th>Job</th><th>Type</th><th class="num">Positions</th><th class="num">Applicants</th><th>Status</th><th></th></tr></thead><tbody>
        ${jobs.map(j => { const n = db.applications.filter(a => a.jobId === j.id).length; return `<tr>
          <td><b>${esc(j.title)}</b><span class="sub">${esc(j.location)} · ${esc(j.pay)} · posted ${ago(j.createdAt)}</span></td>
          <td>${esc(j.type)}</td><td class="num">${esc(j.positions)}</td><td class="num"><b>${n}</b></td><td>${chip(j.status)}</td>
          <td><div class="btn-row"><button type="button" class="btn outline sm" data-action="view-applicants" data-id="${j.id}">Applicants</button>
          ${j.status === 'Open' ? `<button type="button" class="btn ghost sm" data-action="job-status" data-id="${j.id}" data-status="Closed">Close</button>` : j.status === 'Closed' ? `<button type="button" class="btn ghost sm" data-action="job-status" data-id="${j.id}" data-status="Open">Reopen</button>` : ''}</div></td></tr>`; }).join('')}
      </tbody></table></div>` : empty('You have not posted any jobs yet.'));
    },

    requests(e) {
      const list = db.bookings.filter(b => b.employerId === e.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return `${card('Request staff', '<p class="muted small sub">Tell us who you need. We fill the shifts with checked, ready-to-work candidates.</p>', `
        <form class="form" data-form="booking"><div class="form-grid three">
          <label>Role<select id="bk-role" name="role" required>${opts(ROLES, '', 'Select role')}</select></label>
          <label>Number of staff<input id="bk-qty" type="number" name="qty" min="1" value="1" required></label>
          <label>Contract<select id="bk-type" name="type">${opts(['Temporary', 'Permanent', 'Temp to perm'], 'Temporary')}</select></label>
          <label>Start date<input id="bk-start" type="date" name="start" required value="${dayKey(Date.now() + 2 * DAY)}"></label>
          <label>Shift<select id="bk-shift" name="shift">${opts(['Days', 'Nights', 'Weekends', 'Mixed'], 'Days')}</select></label>
          <label>Site<input id="bk-site" name="site" value="${esc(e.address)}" required></label>
          <label class="full">Notes<textarea id="bk-notes" name="notes" placeholder="Duration, vehicle type, PPE, induction details"></textarea></label>
        </div><div class="form-actions"><button class="btn primary">Send request</button></div></form>`)}
      ${card('Your requests', '', list.length ? `<div class="table-wrap"><table><thead><tr><th>Role</th><th class="num">Qty</th><th>Contract</th><th>Start</th><th>Site</th><th>Status</th></tr></thead><tbody>
        ${list.map(b => `<tr><td><b>${esc(b.role)}</b><span class="sub">${esc(b.shift)} · sent ${ago(b.createdAt)}</span></td><td class="num">${esc(b.qty)}</td><td>${esc(b.type)}</td><td class="nowrap">${fmtDate(b.start)}</td><td class="small">${esc(b.site)}</td><td>${chip(b.status)}</td></tr>`).join('')}
      </tbody></table></div>` : empty('No staff requests yet.'))}`;
    },

    timesheets(e) {
      const mine = db.shifts.filter(s => s.clientId === e.id && s.clockOut);
      const waiting = mine.filter(s => s.ts === 'Submitted').sort((a, b) => ms(b.start) - ms(a.start));
      const done = mine.filter(s => s.ts !== 'Submitted').sort((a, b) => ms(b.start) - ms(a.start)).slice(0, 15);
      const row = (s, actions) => { const c = cand(s.candidateId); return `<tr><td>${personCell(c, s.role)}</td><td class="nowrap">${fmtDay(s.start)}</td><td class="num">${fmtTime(s.clockIn)}</td><td class="num">${fmtTime(s.clockOut)}</td><td class="num">${s.breakMins} min</td><td class="num"><b>${hrs(hoursOf(s))}</b></td><td class="num">${money(chargeOf(s))}</td><td>${actions}</td></tr>`; };
      const head = '<thead><tr><th>Worker</th><th>Date</th><th class="num">In</th><th class="num">Out</th><th class="num">Break</th><th class="num">Hours</th><th class="num">Charge</th><th></th></tr></thead>';
      return `${card('Waiting for your approval', waiting.length ? `<button type="button" class="btn success sm" data-action="approve-all" data-client="${e.id}">${ic('check')}Approve all (${waiting.length})</button>` : '', waiting.length ? `<div class="table-wrap"><table>${head}<tbody>${waiting.map(s => row(s, `<div class="btn-row"><button type="button" class="btn success sm" data-action="ts-approve" data-id="${s.id}">Approve</button><button type="button" class="btn danger sm" data-action="ts-query" data-id="${s.id}">Query</button></div>`)).join('')}</tbody></table></div>` : empty('All timesheets are approved.'))}
      ${card('Recent timesheets', '', done.length ? `<div class="table-wrap"><table>${head}<tbody>${done.map(s => row(s, chip(s.ts || '—'))).join('')}</tbody></table></div>` : empty('No timesheets yet.'))}`;
    },

    invoices(e) {
      const list = db.invoices.filter(i => i.clientId === e.id && i.status !== 'Draft').sort((a, b) => b.issued.localeCompare(a.issued));
      const due = list.filter(i => i.status === 'Sent');
      return `<div class="stats">${stat('Outstanding', money(sum(due.map(i => i.total))), due.length + ' invoices unpaid', 'accent')}${stat('Overdue', money(sum(due.filter(i => invState(i) === 'Overdue').map(i => i.total))), due.filter(i => invState(i) === 'Overdue').length + ' invoices', due.some(i => invState(i) === 'Overdue') ? 'bad' : '')}${stat('Paid this financial year', moneyK(sum(list.filter(i => i.status === 'Paid' && i.issued >= dayKey(fyStart(Date.now()))).map(i => i.total))), 'Including VAT')}</div>
      ${card('Invoices', '', invoiceTable(list, false))}`;
    },

    company(e) {
      return card('Company details', chip(e.status), `<form class="form" data-form="company"><div class="form-grid">
          <label class="full">Company name<input id="co-name" name="company" value="${esc(e.company)}" required></label>
          <label>Contact name<input id="co-contact" name="contact" value="${esc(e.contact)}" required></label>
          <label>Phone<input id="co-phone" type="tel" name="phone" value="${esc(e.phone)}" required></label>
          <label>Email<input id="co-email" type="email" name="email" value="${esc(e.email)}" required></label>
          <label>Sector<select id="co-sector" name="sector">${opts(SECTORS, e.sector)}</select></label>
          <label class="full">Site address<input id="co-address" name="address" value="${esc(e.address)}" required></label>
          <label>Companies House number<input id="co-no" name="companyNo" value="${esc(e.companyNo)}"></label>
        </div><div class="form-actions"><button class="btn primary">Save changes</button></div></form>`);
    }
  };

  /* ================= Admin panel ================= */
  const ADMIN = {
    dashboard(u) {
      const now = Date.now();
      const live = liveShifts(), states = live.map(s => [s, shiftState(s)]);
      const onSite = states.filter(x => x[1] === 'On site' || x[1] === 'On break').length;
      const late = states.filter(x => x[1] === 'Late').length;
      const mStart = monthStart(now).getTime();
      const monthDone = db.shifts.filter(s => s.clockOut && ms(s.start) >= mStart);
      const billable = sum(monthDone.map(chargeOf)), cost = sum(monthDone.map(s => grossOf(s)));
      const margin = billable ? (billable - cost) / billable * 100 : 0;
      const unpaid = db.invoices.filter(i => i.status === 'Sent');
      const overdue = unpaid.filter(i => invState(i) === 'Overdue');
      const comp = complianceItems();
      const tsWaiting = db.shifts.filter(s => s.ts === 'Submitted' || s.ts === 'Queried').length;
      const unfilled = db.shifts.filter(s => !s.candidateId && s.status === 'Scheduled' && ms(s.start) > now && ms(s.start) < now + 3 * DAY).length;
      const tasks = [
        [late, pl(late, 'worker late for their shift', 'workers late for their shift'), '#/admin/live', 'clock', 'bad'],
        [tsWaiting, pl(tsWaiting, 'timesheet to approve or resolve', 'timesheets to approve or resolve'), '#/admin/timesheets', 'sheet', 'warn'],
        [comp.filter(x => x.state === 'Needs check').length, 'document checks waiting', '#/admin/compliance', 'file', 'warn'],
        [comp.filter(x => x.state === 'Expired').length, 'expired document checks (worker blocked)', '#/admin/compliance', 'alert', 'bad'],
        [unfilled, pl(unfilled, 'unfilled shift in the next 3 days', 'unfilled shifts in the next 3 days'), '#/admin/shifts', 'calendar', 'warn'],
        [overdue.length, pl(overdue.length, 'overdue invoice', 'overdue invoices') + ' (' + money(sum(overdue.map(i => i.total)), 0) + ')', '#/admin/invoices', 'receipt', 'bad'],
        [db.applications.filter(a => a.status === 'Pending').length, 'new applications to review', '#/admin/applications', 'list', 'info'],
        [db.bookings.filter(b => b.status === 'Requested').length, 'staff requests from clients', '#/admin/requests', 'truck', 'info'],
        [db.employers.filter(e => e.status === 'Pending').length + db.jobs.filter(j => j.status === 'Pending approval').length, 'clients or jobs waiting for approval', '#/admin/clients', 'building', 'info']
      ].filter(t => t[0] > 0);
      const days = [];
      for (let k = 13; k >= 0; k--) {
        const d0 = sod(now).getTime() - k * DAY, d1 = d0 + DAY;
        const v = sum(db.shifts.filter(s => s.clockOut && ms(s.start) >= d0 && ms(s.start) < d1).map(chargeOf));
        days.push({ label: fmtDay(d0), short: new Date(d0).toLocaleDateString('en-GB', { weekday: 'narrow' }) + ' ' + new Date(d0).getDate(), v });
      }
      const byClient = {};
      monthDone.forEach(s => { byClient[s.clientId] = (byClient[s.clientId] || 0) + chargeOf(s); });
      const alerts = comp.filter(x => ['Expired', 'Expiring', 'Rejected', 'Missing'].includes(x.state)).sort((a, b) => (a.dl == null ? 999 : a.dl) - (b.dl == null ? 999 : b.dl)).slice(0, 6);
      return `
      <div class="card welcome"><div><h2>${greeting()}, ${esc(u.name.split(' ')[0])}</h2><p class="muted">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${db.candidates.filter(c => c.status === 'Active').length} active workers · ${db.employers.filter(e => e.status === 'Approved').length} clients</p></div>
        <div class="btn-row"><button type="button" class="btn primary sm" data-action="create-shift">${ic('plus')}Create shift</button><button type="button" class="btn outline sm" data-action="admin-post-job">Post job</button><a class="btn outline sm" href="#/admin/payroll">Run payroll</a><a class="btn outline sm" href="#/admin/invoices">Create invoice</a></div></div>
      <div class="stats six">
        ${stat('On site now', onSite, `<a href="#/admin/live">${live.length} shifts today</a>`, 'good')}
        ${stat('Late or missing', late, late ? 'Call them now' : 'Everyone on time', late ? 'bad' : '')}
        ${stat('Billable this month', moneyK(billable), hrs(sum(monthDone.map(hoursOf))) + ' hours worked', 'accent')}
        ${stat('Gross margin', margin.toFixed(1) + '%', moneyK(billable - cost) + ' after worker pay')}
        ${stat('Unpaid invoices', moneyK(sum(unpaid.map(i => i.total))), overdue.length + ' overdue', overdue.length ? 'bad' : '')}
        ${stat('Compliant workers', db.candidates.filter(compliant).length + '/' + db.candidates.length, 'All required documents valid')}
      </div>
      <div class="grid-21">
        ${card('Live board', `<a class="btn outline sm" href="#/admin/live">Open live attendance</a>`, liveTable(live.filter(s => shiftState(s) !== 'Completed').slice(0, 7), true))}
        ${card('Needs attention', '', tasks.length ? `<div class="list">${tasks.map(t => `<a class="list-item" href="${t[2]}" style="color:inherit;text-decoration:none"><span class="step-ic ${t[4]}">${ic(t[3])}</span><div class="grow"><b>${t[0]} ${esc(t[1])}</b></div>${ic('right')}</a>`).join('')}</div>` : empty('Nothing waiting. All caught up.'))}
      </div>
      <div class="grid-2">
        ${card('Billable work, last 14 days', '<span class="legend"><span><i style="background:var(--navy)"></i>Charge to clients, excl. VAT</span></span>', vbars(days, moneyK, true))}
        ${card('Compliance alerts', '<a href="#/admin/compliance">Open compliance</a>', alerts.length ? `<div class="list">${alerts.map(x => `<div class="list-item"><span class="step-ic ${x.state === 'Expiring' ? 'warn' : 'bad'}">${ic('alert')}</span><div class="grow"><b>${esc(x.c.name)}: ${esc(DOC_TYPES[x.type])}</b><p class="muted small">${x.state === 'Expired' ? 'Expired ' + (-x.dl) + ' days ago' : x.state === 'Expiring' ? 'Expires in ' + x.dl + ' days' : x.state === 'Missing' ? 'Not uploaded yet' : 'Rejected, waiting for a new upload'}</p></div>${chip(x.state)}</div>`).join('')}</div>` : empty('No compliance alerts.'))}
      </div>
      <div class="grid-2">
        ${card('Top clients this month', '', Object.keys(byClient).length ? hbars(Object.entries(byClient).sort((a, b) => b[1] - a[1]).map(([k, v]) => [employerName(k), v]), v => moneyK(v)) : empty('No work completed this month yet.'))}
        ${card('Recent activity', '<a href="#/admin/activity">Full log</a>', `<div class="feed">${db.activity.slice(0, 7).map(a => `<div class="feed-item"><time>${fmtTime(a.at)}</time><span><b>${esc(a.who)}</b> ${esc(a.text.charAt(0).toLowerCase() + a.text.slice(1))}</span></div>`).join('')}</div>`)}
      </div>`;
    },

    live() {
      const live = liveShifts();
      const st = live.map(s => shiftState(s));
      const cnt = k => st.filter(x => x === k).length;
      const counts = { 'On site': cnt('On site'), 'On break': cnt('On break'), 'Late': cnt('Late'), 'Scheduled': cnt('Scheduled') + cnt('Due soon'), 'Completed': cnt('Completed') };
      const filtered = live.filter(s => { const x = shiftState(s); if (ui.live === 'All') return true; if (ui.live === 'Scheduled') return x === 'Scheduled' || x === 'Due soon'; return x === ui.live; });
      const set = db.settings;
      const noShows = db.shifts.filter(s => s.status === 'No-show' && ms(s.start) >= Date.now() - 16 * H);
      return `
      <section class="card"><div class="live-head">
        <div><div class="big-clock" data-clock="time"></div><p class="muted">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · shifts from the last 12 hours and the next 16</p></div>
        <div class="counters">
          <div class="counter ok"><b>${counts['On site']}</b><span>On site</span></div>
          <div class="counter"><b>${counts['On break']}</b><span>On break</span></div>
          <div class="counter ${counts.Late ? 'bad' : ''}"><b>${counts.Late}</b><span>Late</span></div>
          <div class="counter warn"><b>${counts.Scheduled}</b><span>Starting later</span></div>
          <div class="counter"><b>${counts.Completed}</b><span>Finished</span></div>
        </div>
      </div></section>
      <div class="banner info">${ic('shield')}<div><b>Clock-in rules</b><p class="small">Workers clock in from the candidate app. ${set.geofenceOn ? `Their phone location must be within ${set.geofence} m of the site.` : 'Location checks are switched off.'} A worker is marked late ${set.graceMins} minutes after the shift starts. Shifts still open after ${set.autoClockOutHrs} hours are closed automatically. <a href="#/admin/settings">Change rules</a></p></div></div>
      <div class="grid-21">
        ${card('Today\'s shifts', tabs('live', ['All', 'On site', 'On break', 'Late', 'Scheduled', 'Completed'], counts), liveTable(filtered, false))}
        <div style="display:grid;gap:20px;align-content:start">
          ${card('Clock-in feed', '', db.clockEvents.length ? `<div class="feed">${db.clockEvents.slice().sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12).map(ev => `<div class="feed-item"><time>${fmtTime(ev.at)}</time><span><b>${esc(shortName(candName(ev.candidateId)))}</b> ${esc(ev.text.charAt(0).toLowerCase() + ev.text.slice(1))}${ev.by === 'admin' ? ' <span class="muted">(by admin)</span>' : ''}</span></div>`).join('')}</div>` : empty('No clock events yet today.'))}
          ${noShows.length ? card('No-shows', '', `<div class="list">${noShows.map(s => `<div class="list-item">${avatar(candName(s.candidateId), 'sm')}<div class="grow"><b>${esc(candName(s.candidateId))}</b><p class="muted small">${esc(employerName(s.clientId))} · ${fmtTime(s.start)}</p></div>${chip('No-show', false)}</div>`).join('')}</div>`) : ''}
        </div>
      </div>`;
    },

    shifts() {
      const ws = weekStart(Date.now()).getTime() + ui.week * 7 * DAY;
      const today = sod(Date.now()).getTime();
      const days = [];
      for (let i = 0; i < 7; i++) days.push(ws + i * DAY);
      const inWeek = db.shifts.filter(s => s.status !== 'Cancelled' && ms(s.start) >= ws && ms(s.start) < ws + 7 * DAY);
      const unfilled = db.shifts.filter(s => !s.candidateId && s.status === 'Scheduled' && ms(s.start) > Date.now()).sort((a, b) => ms(a.start) - ms(b.start));
      const cls = s => { const st = shiftState(s); return st === 'Unfilled' ? 'open' : st === 'Completed' ? 'done' : ['Late', 'No-show'].includes(st) ? 'bad' : ['On site', 'On break'].includes(st) ? 'live' : ''; };
      const hoursBooked = sum(inWeek.map(s => (ms(s.end) - ms(s.start)) / H));
      return `
      <div class="stats">
        ${stat('Shifts this week', inWeek.length, inWeek.filter(s => s.candidateId).length + ' filled', 'accent')}
        ${stat('Unfilled', inWeek.filter(s => !s.candidateId).length, 'Need a worker', inWeek.some(s => !s.candidateId) ? 'bad' : '')}
        ${stat('Hours booked', hrs(hoursBooked), 'Scheduled shift length')}
        ${stat('Fill rate', (inWeek.length ? Math.round(inWeek.filter(s => s.candidateId).length / inWeek.length * 100) : 100) + '%', 'Shifts with a worker')}
      </div>
      ${card('Rota', `<div class="btn-row"><div class="week-nav"><button type="button" class="icon-btn" data-action="week" data-op="-1" aria-label="Previous week">${ic('left')}</button><b>${fmtDate(ws).replace(/ \d{4}$/, '')} – ${fmtDate(ws + 6 * DAY)}</b><button type="button" class="icon-btn" data-action="week" data-op="1" aria-label="Next week">${ic('right')}</button>${ui.week ? '<button type="button" class="btn ghost sm" data-action="week" data-op="0">This week</button>' : ''}</div><button type="button" class="btn primary sm" data-action="create-shift">${ic('plus')}Create shift</button></div>`,
        `<div class="rota-wrap"><div class="rota">${days.map(d => {
          const list = inWeek.filter(s => ms(s.start) >= d && ms(s.start) < d + DAY).sort((a, b) => ms(a.start) - ms(b.start));
          return `<div class="rota-day ${d === today ? 'today' : ''}"><h4>${new Date(d).toLocaleDateString('en-GB', { weekday: 'short' })} <span>${new Date(d).getDate()} ${new Date(d).toLocaleDateString('en-GB', { month: 'short' })}</span></h4>
            ${list.map(s => `<button type="button" class="rshift ${cls(s)}" data-action="shift-modal" data-id="${s.id}"><b>${fmtTime(s.start)}–${fmtTime(s.end)} ${s.candidateId ? esc(shortName(candName(s.candidateId))) : 'Unfilled'}</b><small>${esc(employerName(s.clientId))}</small><small>${esc(s.role)}</small></button>`).join('') || '<small class="muted" style="padding:4px">No shifts</small>'}</div>`;
        }).join('')}</div></div>
        <p class="legend" style="margin-top:12px"><span><i style="background:var(--navy)"></i>Booked</span><span><i style="background:var(--blue)"></i>On site</span><span><i style="background:var(--green)"></i>Completed</span><span><i style="background:var(--amber)"></i>Unfilled</span><span><i style="background:var(--red)"></i>Late or no-show</span></p>`)}
      ${card('Unfilled shifts', '', unfilled.length ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Client</th><th>Role</th><th>Assign a worker</th></tr></thead><tbody>
        ${unfilled.map(s => `<tr><td class="nowrap"><b>${fmtDay(s.start)}</b><span class="sub">${fmtTime(s.start)}–${fmtTime(s.end)}</span></td><td>${esc(employerName(s.clientId))}<span class="sub">${esc(s.site)}</span></td><td>${esc(s.role)}</td>
          <td><div class="btn-row"><select id="as-${s.id}" data-assign="${s.id}" aria-label="Choose worker" style="max-width:260px">${workerOptions(s.role, '')}</select><button type="button" class="btn primary sm" data-action="assign" data-id="${s.id}">Assign</button></div></td></tr>`).join('')}
      </tbody></table></div>` : empty('Every upcoming shift has a worker.'))}`;
    },

    timesheets() {
      const all = db.shifts.filter(s => s.clockOut);
      const counts = { Submitted: all.filter(s => s.ts === 'Submitted').length, Queried: all.filter(s => s.ts === 'Queried').length };
      const list = all.filter(s => ui.ts === 'All' || s.ts === ui.ts).sort((a, b) => ms(b.start) - ms(a.start)).slice(0, 80);
      const totalH = sum(list.map(hoursOf));
      return `<div class="stats">
        ${stat('Waiting for approval', counts.Submitted, 'Submitted by workers', counts.Submitted ? 'accent' : '')}
        ${stat('Queried', counts.Queried, 'Need checking', counts.Queried ? 'bad' : '')}
        ${stat('Approved, not yet paid', all.filter(s => s.ts === 'Approved' && !s.payrunId).length, '<a href="#/admin/payroll">Go to payroll</a>')}
        ${stat('Approved, not yet invoiced', all.filter(s => s.ts === 'Approved' && !s.invoiceId).length, '<a href="#/admin/invoices">Go to invoices</a>')}
      </div>
      ${card('Timesheets', `<div class="btn-row">${tabs('ts', ['Submitted', 'Queried', 'Approved', 'All'], counts)}${counts.Submitted ? `<button type="button" class="btn success sm" data-action="approve-all">${ic('check')}Approve all submitted</button>` : ''}</div>`,
        list.length ? `<div class="table-wrap"><table><thead><tr><th>Worker</th><th>Client</th><th>Date</th><th class="num">Booked</th><th class="num">In</th><th class="num">Out</th><th class="num">Break</th><th class="num">Hours</th><th class="num">Pay</th><th class="num">Charge</th><th>Status</th><th></th></tr></thead><tbody>
        ${list.map(s => { const c = cand(s.candidateId), lb = lateBy(s); return `<tr><td>${personCell(c, s.role)}</td><td class="small">${esc(employerName(s.clientId))}</td><td class="nowrap">${fmtDay(s.start)}</td>
          <td class="num small">${fmtTime(s.start)}–${fmtTime(s.end)}</td><td class="num">${fmtTime(s.clockIn)}${lb > db.settings.graceMins ? `<span class="flag">${lb} min late</span>` : ''}</td><td class="num">${fmtTime(s.clockOut)}</td><td class="num">${s.breakMins}m</td>
          <td class="num"><b>${hrs(hoursOf(s))}</b></td><td class="num">${money(grossOf(s))}</td><td class="num">${money(chargeOf(s))}</td>
          <td>${chip(s.ts || '—')}${s.tsBy === 'client' ? '<span class="sub">by client</span>' : ''}${s.tsNote ? `<span class="sub" title="${esc(s.tsNote)}">${esc(s.tsNote.length > 46 ? s.tsNote.slice(0, 46) + '…' : s.tsNote)}</span>` : ''}</td>
          <td><div class="btn-row">${s.ts !== 'Approved' ? `<button type="button" class="btn success sm" data-action="ts-approve" data-id="${s.id}">Approve</button>` : ''}${s.ts === 'Submitted' ? `<button type="button" class="btn danger sm" data-action="ts-query" data-id="${s.id}">Query</button>` : ''}${!s.payrunId ? `<button type="button" class="btn ghost sm" data-action="ts-edit" data-id="${s.id}" aria-label="Edit times">${ic('edit')}</button>` : ''}</div></td></tr>`; }).join('')}
        </tbody><tfoot><tr><td colspan="7">${list.length} timesheets</td><td class="num">${hrs(totalH)}</td><td class="num">${money(sum(list.map(s => grossOf(s))))}</td><td class="num">${money(sum(list.map(chargeOf)))}</td><td colspan="2"></td></tr></tfoot></table></div>` : empty('No timesheets in this list.'))}`;
    },

    candidates() {
      const f = ui.cands, q = f.q.trim().toLowerCase();
      const ws = weekStart(Date.now()).getTime();
      const live = liveShifts();
      const status = c => { if (c.status === 'Suspended') return 'Suspended'; const s = live.find(x => x.candidateId === c.id && ['On site', 'On break'].includes(shiftState(x))); if (s) return 'On site'; return c.availability.status; };
      const list = db.candidates.filter(c => (!q || (c.name + ' ' + c.email + ' ' + c.role + ' ' + c.city + ' ' + c.postcode).toLowerCase().includes(q)) && (!f.role || c.role === f.role) && (!f.status || status(c) === f.status)).sort((a, b) => a.name.localeCompare(b.name));
      return `<div class="stats">
        ${stat('Candidates', db.candidates.length, db.candidates.filter(c => c.status === 'Active').length + ' active', 'accent')}
        ${stat('Ready to work', db.candidates.filter(compliant).length, 'All checks complete', 'good')}
        ${stat('On site now', db.candidates.filter(c => status(c) === 'On site').length, 'Clocked in right now')}
        ${stat('New this month', db.candidates.filter(c => ms(c.createdAt) >= monthStart(Date.now()).getTime()).length, 'Registrations')}
      </div>
      ${card('All candidates', `<button type="button" class="btn outline sm" data-action="export" data-what="candidates">${ic('download')}Export CSV</button>`, `
        <div class="toolbar" style="margin-bottom:14px"><div class="search">${ic('search')}<input id="f-c-q" data-filter="cands.q" value="${esc(f.q)}" placeholder="Search name, role, town or postcode" aria-label="Search candidates"></div>
          <select id="f-c-role" data-filter="cands.role" aria-label="Role">${opts(ROLES, f.role, 'All roles')}</select>
          <select id="f-c-status" data-filter="cands.status" aria-label="Status">${opts(['On site', 'Available now', 'Available from date', 'Not available', 'Suspended'], f.status, 'Any status')}</select></div>
        ${list.length ? `<div class="table-wrap"><table><thead><tr><th>Candidate</th><th>Location</th><th>Licence</th><th>Checks</th><th class="num">Hours this week</th><th>Status</th><th></th></tr></thead><tbody>
        ${list.map(c => `<tr><td>${personCell(c, c.role + ' · ' + c.experience + ' yrs')}</td><td>${esc(c.city)}<span class="sub">${esc(c.postcode)}</span></td><td class="small">${esc(c.licence.join(', '))}</td><td>${docsSummary(c)}</td>
          <td class="num">${hrs(sum(db.shifts.filter(s => s.candidateId === c.id && s.clockOut && ms(s.start) >= ws).map(hoursOf)))}</td><td>${chip(status(c))}</td>
          <td><button type="button" class="btn outline sm" data-action="view-candidate" data-id="${c.id}">Open</button></td></tr>`).join('')}
        </tbody></table></div>` : empty('No candidates match your search.')}`)}`;
    },

    compliance() {
      const items = complianceItems();
      const tabMap = { 'Needs check': ['Needs check'], 'Expiring soon': ['Expiring'], 'Expired': ['Expired'], 'Missing': ['Missing', 'Rejected'], 'All': null };
      const counts = { 'Needs check': items.filter(x => x.state === 'Needs check').length, 'Expiring soon': items.filter(x => x.state === 'Expiring').length, 'Expired': items.filter(x => x.state === 'Expired').length, 'Missing': items.filter(x => ['Missing', 'Rejected'].includes(x.state)).length };
      const sel = tabMap[ui.comp];
      const list = items.filter(x => !sel || sel.includes(x.state)).sort((a, b) => (a.dl == null ? 9999 : a.dl) - (b.dl == null ? 9999 : b.dl));
      return `<div class="stats">
        ${stat('Waiting for a check', counts['Needs check'], 'Uploaded by workers', counts['Needs check'] ? 'accent' : '')}
        ${stat('Expiring in 60 days', counts['Expiring soon'], 'Send a reminder')}
        ${stat('Expired', counts.Expired, 'Worker cannot be booked', counts.Expired ? 'bad' : '')}
        ${stat('Fully compliant', Math.round(db.candidates.filter(compliant).length / db.candidates.length * 100) + '%', db.candidates.filter(compliant).length + ' of ' + db.candidates.length + ' workers', 'good')}
      </div>
      ${card('Documents', tabs('comp', ['Needs check', 'Expiring soon', 'Expired', 'Missing', 'All'], counts), list.length ? `<div class="table-wrap"><table><thead><tr><th>Worker</th><th>Document</th><th>File</th><th>Expiry</th><th>Status</th><th></th></tr></thead><tbody>
        ${list.map(({ c, d, type, state, dl }) => `<tr><td>${personCell(c)}</td><td><b>${esc(DOC_TYPES[type])}</b>${requiredDocs(c).includes(type) ? '<span class="sub">Required for role</span>' : ''}</td>
          <td class="small">${d ? esc(d.fileName) + `<span class="sub">uploaded ${ago(d.uploaded)}</span>` : '<span class="muted">Not uploaded</span>'}</td>
          <td class="nowrap">${d && d.expiry ? fmtDate(d.expiry) + `<span class="flag ${dl > 60 ? 'ok' : ''}">${dl < 0 ? 'Expired ' + (-dl) + ' days ago' : dl + ' days left'}</span>` : '<span class="muted">No expiry</span>'}</td>
          <td>${chip(state)}${d && d.status === 'Rejected' && d.note ? `<span class="sub">${esc(d.note)}</span>` : ''}</td>
          <td><div class="btn-row">${d ? `<button type="button" class="btn ghost sm" data-action="view-doc" data-c="${c.id}" data-d="${d.id}">View</button>` : ''}
            ${d && d.status === 'Pending' ? `<button type="button" class="btn success sm" data-action="verify-doc" data-c="${c.id}" data-d="${d.id}">Verify</button><button type="button" class="btn danger sm" data-action="reject-doc" data-c="${c.id}" data-d="${d.id}">Reject</button>` : ''}
            ${['Expiring', 'Expired', 'Missing', 'Rejected'].includes(state) ? `<button type="button" class="btn outline sm" data-action="remind-doc" data-c="${c.id}" data-type="${type}">${ic('send')}Remind</button>` : ''}</div></td></tr>`).join('')}
      </tbody></table></div>` : empty('Nothing in this list.'))}`;
    },

    applications() {
      const counts = { Pending: db.applications.filter(a => a.status === 'Pending').length };
      const list = db.applications.filter(a => ui.apps === 'All' || a.status === ui.apps).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return card('Applications', `<div class="btn-row">${tabs('apps', ['All', 'Pending', 'Interview', 'Approved', 'Rejected'], counts)}<button type="button" class="btn outline sm" data-action="export" data-what="applications">${ic('download')}CSV</button></div>`,
        list.length ? `<div class="table-wrap"><table><thead><tr><th>Candidate</th><th>Job</th><th>Applied</th><th>Checks</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        ${list.map(a => { const c = cand(a.candidateId), j = job(a.jobId); if (!c || !j) return ''; return `<tr>
          <td>${personCell(c, c.role + ' · ' + c.experience + ' yrs')}</td><td><b>${esc(j.title)}</b><span class="sub">${esc(employerName(j.employerId))} · ${esc(j.location)}</span></td>
          <td class="nowrap">${ago(a.createdAt)}</td><td>${docsSummary(c)}</td><td>${chip(a.status)}${a.status === 'Interview' ? `<span class="sub">${fmtDT(a.interviewDate)}</span>` : ''}</td>
          <td><div class="btn-row">
            ${a.status !== 'Approved' ? `<button type="button" class="btn success sm" data-action="app-status" data-id="${a.id}" data-status="Approved">Approve</button>` : ''}
            ${a.status === 'Pending' ? `<button type="button" class="btn outline sm" data-action="app-interview" data-id="${a.id}">Interview</button>` : ''}
            ${a.status !== 'Rejected' ? `<button type="button" class="btn danger sm" data-action="app-status" data-id="${a.id}" data-status="Rejected">Reject</button>` : ''}
            <button type="button" class="btn ghost sm" data-action="view-candidate" data-id="${c.id}">Profile</button></div></td></tr>`; }).join('')}
        </tbody></table></div>` : empty('No applications in this list.'));
    },

    jobs() {
      const counts = { 'Pending approval': db.jobs.filter(j => j.status === 'Pending approval').length };
      const list = db.jobs.filter(j => ui.ajobs === 'All' || j.status === ui.ajobs).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return card('Jobs', `<div class="btn-row">${tabs('ajobs', ['All', 'Pending approval', 'Open', 'Closed'], counts)}<button type="button" class="btn primary sm" data-action="admin-post-job">${ic('plus')}Post job</button></div>`,
        list.length ? `<div class="table-wrap"><table><thead><tr><th>Job</th><th>Client</th><th>Type</th><th class="num">Applicants</th><th>Status</th><th></th></tr></thead><tbody>
        ${list.map(j => `<tr><td><b>${esc(j.title)}</b><span class="sub">${esc(j.location)} · ${esc(j.pay)} · ${esc(j.positions)} position${j.positions == 1 ? '' : 's'}</span></td>
          <td>${esc(employerName(j.employerId))}</td><td>${esc(j.type)}</td><td class="num">${db.applications.filter(a => a.jobId === j.id).length}</td><td>${chip(j.status)}</td>
          <td><div class="btn-row"><button type="button" class="btn ghost sm" data-action="view-job" data-id="${j.id}">View</button>
          ${j.status === 'Pending approval' ? `<button type="button" class="btn success sm" data-action="job-status" data-id="${j.id}" data-status="Open">Approve</button><button type="button" class="btn danger sm" data-action="job-status" data-id="${j.id}" data-status="Rejected">Reject</button>` : ''}
          ${j.status === 'Open' ? `<button type="button" class="btn outline sm" data-action="job-status" data-id="${j.id}" data-status="Closed">Close</button>` : ''}
          ${j.status === 'Closed' ? `<button type="button" class="btn outline sm" data-action="job-status" data-id="${j.id}" data-status="Open">Reopen</button>` : ''}</div></td></tr>`).join('')}
        </tbody></table></div>` : empty('No jobs in this list.'));
    },

    clients() {
      const list = db.employers.slice().sort((a, b) => a.company.localeCompare(b.company));
      const fy = dayKey(fyStart(Date.now()));
      return card('Client companies (' + list.length + ')', '', `<div class="table-wrap"><table><thead><tr><th>Company</th><th>Contact</th><th>Sector</th><th class="num">Revenue this FY</th><th class="num">Unpaid</th><th class="num">Credit limit</th><th>Status</th><th></th></tr></thead><tbody>
        ${list.map(e => { const inv = db.invoices.filter(i => i.clientId === e.id && i.status !== 'Draft'); const unpaid = sum(inv.filter(i => i.status === 'Sent').map(i => i.total)); const od = inv.some(i => invState(i) === 'Overdue'); return `<tr>
          <td><div class="person">${avatar(e.company)}<div><b>${esc(e.company)}</b><span class="sub">${esc(e.address)}</span></div></div></td>
          <td>${esc(e.contact)}<span class="sub">${esc(e.email)} · ${esc(e.phone)}</span></td><td>${esc(e.sector)}</td>
          <td class="num">${money(sum(inv.filter(i => i.issued >= fy).map(i => i.net)), 0)}</td><td class="num">${money(unpaid, 0)}${od ? '<span class="flag">Overdue</span>' : ''}</td>
          <td class="num">${money(e.creditLimit, 0)}${unpaid > e.creditLimit * 0.8 ? '<span class="flag">Near limit</span>' : ''}</td><td>${chip(e.status)}</td>
          <td><div class="btn-row"><button type="button" class="btn ghost sm" data-action="view-client" data-id="${e.id}">Open</button>${e.status !== 'Approved' ? `<button type="button" class="btn success sm" data-action="client-status" data-id="${e.id}" data-status="Approved">Approve</button>` : ''}
          ${e.status === 'Approved' ? `<button type="button" class="btn danger sm" data-action="client-status" data-id="${e.id}" data-status="Suspended">Suspend</button>` : ''}</div></td></tr>`; }).join('')}
      </tbody></table></div>`);
    },

    requests() {
      const list = db.bookings.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return card('Staff requests from clients', '', list.length ? `<div class="table-wrap"><table><thead><tr><th>Client</th><th>Role</th><th class="num">Qty</th><th>Start</th><th>Notes</th><th>Status</th><th></th></tr></thead><tbody>
        ${list.map(b => { const c = b.candidateId ? cand(b.candidateId) : null; return `<tr><td><b>${esc(employerName(b.employerId))}</b><span class="sub">${ago(b.createdAt)}</span></td>
          <td>${esc(b.role)}<span class="sub">${esc(b.type)} · ${esc(b.shift)}</span></td><td class="num">${esc(b.qty)}</td><td class="nowrap">${fmtDate(b.start)}</td>
          <td class="small">${c ? `<b>Asked for: ${esc(c.name)}</b><br>` : ''}${esc(b.notes)}<span class="sub">${esc(b.site)}</span></td><td>${chip(b.status)}</td>
          <td><div class="btn-row">${['Requested', 'In progress'].includes(b.status) ? `<button type="button" class="btn primary sm" data-action="create-shift" data-booking="${b.id}">${ic('calendar')}Create shifts</button>` : ''}
            <select id="bk-st-${b.id}" data-booking="${b.id}" aria-label="Request status" style="width:auto">${opts(['Requested', 'In progress', 'Filled', 'Cancelled'], b.status)}</select></div></td></tr>`; }).join('')}
      </tbody></table></div>` : empty('No staff requests yet.'));
    },

    payroll() {
      const ready = db.shifts.filter(s => s.clockOut && s.ts === 'Approved' && !s.payrunId && s.candidateId);
      const waiting = db.shifts.filter(s => s.clockOut && (s.ts === 'Submitted' || s.ts === 'Queried') && !s.payrunId).length;
      const byC = {};
      ready.forEach(s => { (byC[s.candidateId] = byC[s.candidateId] || []).push(s); });
      const rows = Object.keys(byC).map(cid => { const l = byC[cid]; const basic = sum(l.map(payOf)), hol = round2(basic * db.settings.holidayPct / 100); return { c: cand(cid), l, hours: sum(l.map(hoursOf)), basic, hol, gross: basic + hol }; }).sort((a, b) => a.c.name.localeCompare(b.c.name));
      const tot = { hours: sum(rows.map(r => r.hours)), basic: sum(rows.map(r => r.basic)), hol: sum(rows.map(r => r.hol)), gross: sum(rows.map(r => r.gross)) };
      const runs = db.payruns.slice().sort((a, b) => b.date.localeCompare(a.date));
      const fy = dayKey(fyStart(Date.now()));
      return `<div class="stats">
        ${stat('Ready to pay', money(tot.gross), rows.length + ' workers · ' + hrs(tot.hours) + ' hours', 'accent')}
        ${stat('Holiday pay accrued', money(tot.hol), db.settings.holidayPct + '% of basic pay')}
        ${stat('Timesheets not approved', waiting, waiting ? '<a href="#/admin/timesheets">Approve them first</a>' : 'Nothing held back', waiting ? 'bad' : '')}
        ${stat('Paid this financial year', moneyK(sum(runs.filter(r => r.date >= fy).map(r => r.gross))), runs.filter(r => r.date >= fy).length + ' pay runs')}
      </div>
      ${card('Next pay run', rows.length ? `<button type="button" class="btn primary" data-action="run-payroll">${ic('wallet')}Run payroll for ${rows.length} worker${rows.length === 1 ? '' : 's'}</button>` : '', rows.length ? `<div class="table-wrap"><table><thead><tr><th>Worker</th><th class="num">Shifts</th><th class="num">Hours</th><th class="num">Avg rate</th><th class="num">Basic pay</th><th class="num">Holiday pay</th><th class="num">Gross pay</th></tr></thead><tbody>
        ${rows.map(r => `<tr><td>${personCell(r.c)}</td><td class="num">${r.l.length}</td><td class="num">${hrs(r.hours)}</td><td class="num">${money(r.hours ? r.basic / r.hours : 0)}</td><td class="num">${money(r.basic)}</td><td class="num">${money(r.hol)}</td><td class="num"><b>${money(r.gross)}</b></td></tr>`).join('')}
        </tbody><tfoot><tr><td>Total</td><td class="num">${sum(rows.map(r => r.l.length))}</td><td class="num">${hrs(tot.hours)}</td><td></td><td class="num">${money(tot.basic)}</td><td class="num">${money(tot.hol)}</td><td class="num">${money(tot.gross)}</td></tr></tfoot></table></div>
        <p class="muted small" style="margin-top:12px">Gross pay before PAYE tax, National Insurance and pension. In the live system these figures are sent to your payroll software for RTI submission to HMRC.</p>` : empty('No approved timesheets waiting to be paid.'))}
      ${card('Pay run history', '', `<div class="table-wrap"><table><thead><tr><th>Pay date</th><th>Pay run</th><th class="num">Workers</th><th class="num">Hours</th><th class="num">Holiday pay</th><th class="num">Gross pay</th><th>Status</th><th></th></tr></thead><tbody>
        ${runs.map(r => `<tr><td class="nowrap">${fmtDate(r.date)}</td><td>${esc(r.label)}</td><td class="num">${r.workers}</td><td class="num">${hrs(r.hours)}</td><td class="num">${money(r.holiday)}</td><td class="num"><b>${money(r.gross)}</b></td><td>${chip(r.status)}</td><td>${r.lines.length ? `<button type="button" class="btn ghost sm" data-action="view-payrun" data-id="${r.id}">View</button>` : ''}</td></tr>`).join('')}
      </tbody></table></div>`)}`;
    },

    invoices() {
      const ready = db.shifts.filter(s => s.clockOut && s.ts === 'Approved' && !s.invoiceId);
      const byE = {};
      ready.forEach(s => { (byE[s.clientId] = byE[s.clientId] || []).push(s); });
      const all = db.invoices;
      const counts = { Draft: all.filter(i => i.status === 'Draft').length, Overdue: all.filter(i => invState(i) === 'Overdue').length };
      const list = all.filter(i => ui.inv === 'All' || invState(i) === ui.inv).sort((a, b) => b.issued.localeCompare(a.issued) || b.number.localeCompare(a.number));
      const unpaid = all.filter(i => i.status === 'Sent');
      const mStart = dayKey(monthStart(Date.now()));
      return `<div class="stats">
        ${stat('Ready to invoice', money(sum(ready.map(chargeOf))), Object.keys(byE).length + ' clients · approved hours', 'accent')}
        ${stat('Unpaid', money(sum(unpaid.map(i => i.total)), 0), unpaid.length + ' invoices')}
        ${stat('Overdue', money(sum(unpaid.filter(i => invState(i) === 'Overdue').map(i => i.total)), 0), counts.Overdue + ' invoices', counts.Overdue ? 'bad' : '')}
        ${stat('Paid this month', money(sum(all.filter(i => i.status === 'Paid' && i.paidAt >= mStart).map(i => i.total)), 0), 'Including VAT', 'good')}
      </div>
      ${card('Ready to invoice', '', Object.keys(byE).length ? `<div class="table-wrap"><table><thead><tr><th>Client</th><th class="num">Shifts</th><th class="num">Hours</th><th class="num">Net</th><th class="num">VAT</th><th class="num">Total</th><th></th></tr></thead><tbody>
        ${Object.keys(byE).map(eid => { const l = byE[eid], net = sum(l.map(chargeOf)), vat = net * db.settings.vatRate / 100; return `<tr><td><b>${esc(employerName(eid))}</b><span class="sub">${fmtDay(Math.min(...l.map(s => ms(s.start))))} – ${fmtDay(Math.max(...l.map(s => ms(s.start))))}</span></td><td class="num">${l.length}</td><td class="num">${hrs(sum(l.map(hoursOf)))}</td><td class="num">${money(net)}</td><td class="num">${money(vat)}</td><td class="num"><b>${money(net + vat)}</b></td><td><button type="button" class="btn primary sm" data-action="create-invoice" data-client="${eid}">${ic('receipt')}Create invoice</button></td></tr>`; }).join('')}
      </tbody></table></div>` : empty('No approved hours waiting to be invoiced.'))}
      ${card('All invoices', `<div class="btn-row">${tabs('inv', ['All', 'Draft', 'Sent', 'Overdue', 'Paid'], counts)}<button type="button" class="btn outline sm" data-action="export" data-what="invoices">${ic('download')}CSV</button></div>`, invoiceTable(list, true))}`;
    },

    finance() {
      const now = Date.now();
      const periods = { 'This month': monthStart(now), 'This quarter': quarterStart(now), 'Financial year': fyStart(now) };
      const from = dayKey(periods[ui.period]);
      const inv = db.invoices.filter(i => i.status !== 'Draft' && i.issued >= from);
      const revenue = sum(inv.map(i => i.net));
      const pay = sum(db.payruns.filter(p => p.date >= from).map(p => p.gross));
      const onCost = pay * db.settings.onCostPct / 100;
      const exps = db.expenses.filter(x => x.date >= from);
      const expTotal = sum(exps.map(x => x.net));
      const gp = revenue - pay - onCost, np = gp - expTotal;
      const byCat = {};
      exps.forEach(x => { byCat[x.category] = (byCat[x.category] || 0) + x.net; });
      const uninvoiced = sum(db.shifts.filter(s => s.clockOut && !s.invoiceId).map(chargeOf));
      const q0 = quarterStart(now), lq0 = new Date(q0.getFullYear(), q0.getMonth() - 3, 1);
      const vatFor = (a, b) => { const A = dayKey(a), B = dayKey(b); const out = sum(db.invoices.filter(i => i.status !== 'Draft' && i.issued >= A && i.issued < B).map(i => i.vat)); const inp = sum(db.expenses.filter(x => x.date >= A && x.date < B).map(x => x.vat)); return { out, inp, due: out - inp }; };
      const vNow = vatFor(q0, new Date(q0.getFullYear(), q0.getMonth() + 3, 1)), vLast = vatFor(lq0, q0);
      const qLabel = d => d.toLocaleDateString('en-GB', { month: 'short' }) + '–' + new Date(d.getFullYear(), d.getMonth() + 2, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      const tax = ctax(np);
      const recent = db.expenses.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
      return `<div class="card-head" style="margin:0"><div class="tabs">${Object.keys(periods).map(p => `<button type="button" class="${ui.period === p ? 'on' : ''}" data-action="set-tab" data-key="period" data-val="${p}">${p}</button>`).join('')}</div><span class="muted small">From ${fmtDate(from)} to today · figures exclude VAT</span></div>
      <div class="stats">
        ${stat('Revenue', moneyK(revenue), inv.length + ' invoices issued', 'accent')}
        ${stat('Gross profit', moneyK(gp), (revenue ? (gp / revenue * 100).toFixed(1) : '0.0') + '% margin')}
        ${stat('Business expenses', moneyK(expTotal), exps.length + ' items recorded')}
        ${stat('Net profit before tax', moneyK(np), (revenue ? (np / revenue * 100).toFixed(1) : '0.0') + '% of revenue', np >= 0 ? 'good' : 'bad')}
      </div>
      <div class="grid-2">
        ${card('Profit and loss', '', `<table class="pl"><tbody>
          <tr><td>Revenue (invoiced to clients)</td><td>${money(revenue)}</td></tr>
          <tr><td>Worker pay (gross, incl. holiday pay)</td><td>-${money(pay)}</td></tr>
          <tr><td>Employer NI and pension (estimate, ${db.settings.onCostPct}%)</td><td>-${money(onCost)}</td></tr>
          <tr class="total"><td>Gross profit</td><td>${money(gp)}</td></tr>
          ${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr class="minor"><td>${esc(k)}</td><td>-${money(v)}</td></tr>`).join('')}
          <tr><td>Total business expenses</td><td>-${money(expTotal)}</td></tr>
          <tr class="total"><td>Net profit before tax</td><td>${money(np)}</td></tr>
        </tbody></table>
        <p class="muted small" style="margin-top:10px">Also ${money(uninvoiced)} of completed work is not invoiced yet.</p>`)}
        <div style="display:grid;gap:20px;align-content:start">
          ${card('VAT returns', '', `<table class="pl"><tbody>
            <tr><td><b>This quarter (${qLabel(q0)})</b></td><td></td></tr>
            <tr class="minor"><td>VAT charged on invoices</td><td>${money(vNow.out)}</td></tr>
            <tr class="minor"><td>VAT you can reclaim on expenses</td><td>-${money(vNow.inp)}</td></tr>
            <tr><td>VAT to pay so far</td><td>${money(vNow.due)}</td></tr>
            <tr><td><b>Last quarter (${qLabel(lq0)})</b></td><td></td></tr>
            <tr class="minor"><td>VAT charged on invoices</td><td>${money(vLast.out)}</td></tr>
            <tr class="minor"><td>VAT you can reclaim on expenses</td><td>-${money(vLast.inp)}</td></tr>
            <tr class="total"><td>VAT return total</td><td>${money(vLast.due)}</td></tr>
          </tbody></table>`)}
          ${card('Corporation tax estimate', '', `<table class="pl"><tbody>
            <tr><td>Profit for the period</td><td>${money(np)}</td></tr>
            <tr><td>Effective rate</td><td>${np > 0 ? (tax / np * 100).toFixed(1) : '0.0'}%</td></tr>
            <tr class="total"><td>Estimated corporation tax</td><td>${money(tax)}</td></tr>
          </tbody></table><p class="muted small" style="margin-top:10px">Uses the 19% small profits rate, 25% main rate and marginal relief between £50,000 and £250,000, as if this were a full year's profit. Planning figure only.</p>`)}
        </div>
      </div>
      <div class="grid-2">
        ${card('Ways to lower your tax bill legally', '', `<ul class="tips">
          <li>${ic('check')}<span>Record every business cost here: rent, job ads, software, fuel, PPE, insurance, training and accountancy fees all reduce taxable profit.</span></li>
          <li>${ic('check')}<span>Reclaim the VAT on business purchases in each VAT return. This quarter so far: ${money(vNow.inp)}.</span></li>
          <li>${ic('check')}<span>Claim capital allowances on vans, computers and equipment. The Annual Investment Allowance usually lets you deduct the full cost in the year you buy.</span></li>
          <li>${ic('check')}<span>Employer pension contributions are normally a deductible business expense.</span></li>
          <li>${ic('check')}<span>Check whether you can claim the Employment Allowance to reduce employer National Insurance.</span></li>
          <li>${ic('check')}<span>Keep receipts attached to each expense, so your accountant can include them all.</span></li>
        </ul><p class="muted small" style="margin-top:12px">General guidance only. Confirm with your accountant before filing.</p>`)}
        ${card('Expenses by category', '', Object.keys(byCat).length ? hbars(Object.entries(byCat).sort((a, b) => b[1] - a[1]), v => moneyK(v)) : empty('No expenses in this period.'))}
      </div>
      ${card('Expenses', `<div class="btn-row"><button type="button" class="btn primary sm" data-action="add-expense">${ic('plus')}Add expense</button><button type="button" class="btn outline sm" data-action="export" data-what="expenses">${ic('download')}CSV</button></div>`, `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Category</th><th>Supplier</th><th class="num">Net</th><th class="num">VAT</th><th class="num">Total</th><th>Receipt</th><th></th></tr></thead><tbody>
        ${recent.map(x => `<tr><td class="nowrap">${fmtDate(x.date)}</td><td>${esc(x.category)}</td><td>${esc(x.supplier)}${x.note ? `<span class="sub">${esc(x.note)}</span>` : ''}</td><td class="num">${money(x.net)}</td><td class="num">${money(x.vat)}</td><td class="num"><b>${money(x.net + x.vat)}</b></td><td class="small">${x.receipt ? esc(x.receipt) : '<span class="muted">—</span>'}</td><td><button type="button" class="btn ghost sm" data-action="delete-expense" data-id="${x.id}" aria-label="Delete expense">${ic('x')}</button></td></tr>`).join('')}
      </tbody></table></div><p class="muted small" style="margin-top:10px">Showing the 12 most recent of ${db.expenses.length} expenses.</p>`)}`;
    },

    reports() {
      const now = Date.now();
      const fy = fyStart(now), fyKey = dayKey(fy);
      const months = [];
      for (let m = new Date(fy); m <= now; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
        const a = dayKey(m), b = dayKey(new Date(m.getFullYear(), m.getMonth() + 1, 1));
        months.push({ label: m.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), short: m.toLocaleDateString('en-GB', { month: 'short' }), v: sum(db.invoices.filter(i => i.status !== 'Draft' && i.issued >= a && i.issued < b).map(i => i.net)) });
      }
      const byClient = {};
      db.invoices.filter(i => i.status !== 'Draft' && i.issued >= fyKey).forEach(i => { byClient[i.clientId] = (byClient[i.clientId] || 0) + i.net; });
      const from = now - 14 * DAY;
      const recent = db.shifts.filter(s => ms(s.start) >= from && ms(s.start) <= now && (s.clockOut || s.status === 'No-show'));
      const worked = recent.filter(s => s.clockOut);
      const lateN = worked.filter(s => lateBy(s) > db.settings.graceMins).length;
      const nsN = recent.filter(s => s.status === 'No-show').length;
      const byRole = {};
      worked.forEach(s => { byRole[s.role] = (byRole[s.role] || 0) + hoursOf(s); });
      const mClient = {};
      worked.forEach(s => { const m = mClient[s.clientId] = mClient[s.clientId] || { h: 0, c: 0, p: 0 }; m.h += hoursOf(s); m.c += chargeOf(s); m.p += grossOf(s); });
      return `<div class="stats">
        ${stat('Revenue this FY', moneyK(sum(months.map(m => m.v))), 'Invoiced, excluding VAT', 'accent')}
        ${stat('On-time arrivals', (worked.length ? Math.round((worked.length - lateN) / worked.length * 100) : 100) + '%', lateN + ' late in the last 14 days', 'good')}
        ${stat('No-shows', nsN, 'Last 14 days', nsN ? 'bad' : '')}
        ${stat('Hours worked', hrs(sum(worked.map(hoursOf))), worked.length + ' shifts, last 14 days')}
      </div>
      <div class="grid-2">
        ${card('Revenue by month', '<span class="muted small">Financial year to date</span>', vbars(months, moneyK, true))}
        ${card('Revenue by client', '<span class="muted small">Financial year to date</span>', hbars(Object.entries(byClient).sort((a, b) => b[1] - a[1]).map(([k, v]) => [employerName(k), v]), v => moneyK(v)))}
        ${card('Hours by role', '<span class="muted small">Last 14 days</span>', Object.keys(byRole).length ? hbars(Object.entries(byRole).sort((a, b) => b[1] - a[1]), v => hrs(v)) : empty('No hours yet.'))}
        ${card('Margin by client', '<span class="muted small">Last 14 days</span>', `<div class="table-wrap"><table><thead><tr><th>Client</th><th class="num">Hours</th><th class="num">Charged</th><th class="num">Pay cost</th><th class="num">Margin</th></tr></thead><tbody>
          ${Object.entries(mClient).sort((a, b) => b[1].c - a[1].c).map(([k, m]) => `<tr><td>${esc(employerName(k))}</td><td class="num">${hrs(m.h)}</td><td class="num">${money(m.c, 0)}</td><td class="num">${money(m.p, 0)}</td><td class="num"><b>${m.c ? ((m.c - m.p) / m.c * 100).toFixed(1) : '0.0'}%</b></td></tr>`).join('')}
        </tbody></table></div>`)}
      </div>
      ${card('Export data', '<span class="muted small">CSV files open in Excel or Google Sheets</span>', `<div class="btn-row">${[['candidates', 'Candidates'], ['timesheets', 'Timesheets'], ['invoices', 'Invoices'], ['expenses', 'Expenses'], ['applications', 'Applications'], ['jobs', 'Jobs']].map(([k, t]) => `<button type="button" class="btn outline" data-action="export" data-what="${k}">${ic('download')}${t}</button>`).join('')}</div>`)}`;
    },

    notify() {
      const sent = db.notifications.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12);
      const toLabel = to => { if (to === 'all-candidates') return 'All candidates'; if (to === 'all-employers') return 'All clients'; const [r, id] = to.split(':'); return r === 'candidate' ? candName(id) : employerName(id); };
      return `<div class="grid-2">
        ${card('Send a notification', '', `<div class="btn-row" style="margin-bottom:14px"><span class="muted small">Templates:</span>${TEMPLATES.map((t, i) => `<button type="button" class="btn outline sm" data-action="tpl" data-i="${i}">${esc(t[0])}</button>`).join('')}</div>
          <form class="form" data-form="send-notification">
            <label>Send to<select id="nt-to" name="to" required>
              <option value="all-candidates">All candidates</option><option value="all-employers">All clients</option><option value="on-shift">Workers on shift today</option>
              <optgroup label="Candidates">${db.candidates.map(c => `<option value="candidate:${c.id}">${esc(c.name)} – ${esc(c.role)}</option>`).join('')}</optgroup>
              <optgroup label="Clients">${db.employers.map(e => `<option value="employer:${e.id}">${esc(e.company)}</option>`).join('')}</optgroup>
            </select></label>
            <label>Title<input id="nt-title" name="title" required placeholder="e.g. Night shifts available this weekend"></label>
            <label>Message<textarea id="nt-body" name="body" required></textarea></label>
            <p class="muted small">In the live app this also goes out as a push notification, text message or email.</p>
            <div class="form-actions"><button class="btn primary">${ic('send')}Send</button></div>
          </form>`)}
        ${card('Recently sent', '', `<div class="list">${sent.map(n => `<div class="list-item"><span class="step-ic">${ic('bell')}</span><div class="grow"><b>${esc(n.title)}</b><p class="muted small">To ${esc(toLabel(n.to))} · ${ago(n.createdAt)}</p></div></div>`).join('')}</div>`)}
      </div>`;
    },

    activity() {
      const areas = Array.from(new Set(db.activity.map(a => a.area))).sort();
      const q = ui.act.q.trim().toLowerCase();
      const list = db.activity.filter(a => (!ui.act.area || a.area === ui.act.area) && (!q || (a.who + ' ' + a.text).toLowerCase().includes(q))).slice(0, 150);
      return card('Activity log', '<span class="muted small">Every change in all three panels, newest first</span>', `
        <div class="toolbar" style="margin-bottom:14px"><div class="search">${ic('search')}<input id="f-act-q" data-filter="act.q" value="${esc(ui.act.q)}" placeholder="Search person or action" aria-label="Search activity"></div>
        <select id="f-act-area" data-filter="act.area" aria-label="Area">${opts(areas, ui.act.area, 'All areas')}</select></div>
        ${list.length ? `<div class="table-wrap"><table><thead><tr><th>When</th><th>Who</th><th>Area</th><th>What happened</th></tr></thead><tbody>
        ${list.map(a => `<tr><td class="nowrap">${fmtDT(a.at)}<span class="sub">${ago(a.at)}</span></td><td>${esc(a.who)}</td><td>${chip(a.area, false)}</td><td>${esc(a.text)}</td></tr>`).join('')}
        </tbody></table></div>` : empty('No activity matches.')}`);
    },

    team() {
      return `${card('Team members', `<button type="button" class="btn primary sm" data-action="invite">${ic('plus')}Add team member</button>`, `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Last active</th><th>Status</th></tr></thead><tbody>
        ${db.team.map(t => `<tr><td>${personCell(t, t.id === ME.admin ? 'You' : '')}</td><td>${esc(t.email)}</td>
          <td>${t.id === ME.admin ? esc(t.role) : `<select id="tr-${t.id}" data-team-role="${t.id}" aria-label="Role for ${esc(t.name)}" style="width:auto">${opts(TEAM_ROLES, t.role)}</select>`}</td>
          <td>${ago(t.lastActive)}</td><td>${chip(t.status)}</td></tr>`).join('')}
      </tbody></table></div>`)}
      ${card('What each role can do', '<span class="muted small">Tick to give a role access. Directors always have full access.</span>', `<div class="table-wrap"><table class="perm"><thead><tr><th>Area</th>${TEAM_ROLES.map(r => `<th>${esc(r)}</th>`).join('')}</tr></thead><tbody>
        ${FEATURES.map(f => `<tr><td>${esc(f)}</td>${TEAM_ROLES.map(r => `<td><input type="checkbox" aria-label="${esc(r)}: ${esc(f)}" data-perm="${esc(r)}|${esc(f)}" ${(db.perms[r] || []).includes(f) ? 'checked' : ''} ${r === 'Director' ? 'disabled' : ''}></td>`).join('')}</tr>`).join('')}
      </tbody></table></div>`)}`;
    },

    settings() {
      const s = db.settings;
      return `<div class="grid-2">
      ${card('Company details', '', `<form class="form" data-form="settings-company"><div class="form-grid">
        <label class="full">Company name<input id="st-co" name="company" value="${esc(s.company)}" required></label>
        <label>VAT number<input id="st-vat" name="vatNo" value="${esc(s.vatNo)}"></label>
        <label>Company number<input id="st-cno" name="companyNo" value="${esc(s.companyNo)}"></label>
        <label>Email<input id="st-email" type="email" name="email" value="${esc(s.email)}"></label>
        <label>Phone<input id="st-phone" name="phone" value="${esc(s.phone)}"></label>
        <label class="full">Address<input id="st-addr" name="address" value="${esc(s.address)}"></label>
      </div><div class="form-actions"><button class="btn primary">Save</button></div></form>`)}
      ${card('Attendance rules', '', `<form class="form" data-form="settings-attendance"><div class="form-grid">
        <label>Late after (minutes)<input id="st-grace" type="number" min="0" max="120" name="graceMins" value="${s.graceMins}"></label>
        <label>Location radius (metres)<input id="st-geo" type="number" min="50" max="2000" step="10" name="geofence" value="${s.geofence}"></label>
        <label>Auto clock-out after (hours)<input id="st-auto" type="number" min="8" max="24" name="autoClockOutHrs" value="${s.autoClockOutHrs}"></label>
        <label class="check full"><input id="st-geoon" type="checkbox" name="geofenceOn" value="yes" ${s.geofenceOn ? 'checked' : ''}> Check the worker's location when they clock in</label>
      </div><div class="form-actions"><button class="btn primary">Save</button></div></form>`)}
      </div>
      ${card('Pay and charge rates', '<span class="muted small">Used for new shifts. Existing shifts keep the rate they were booked at.</span>', `<form class="form" data-form="settings-rates"><div class="table-wrap"><table><thead><tr><th>Role</th><th>Pay to worker (per hour)</th><th>Charge to client (per hour)</th><th class="num">Margin</th></tr></thead><tbody>
        ${ROLES.map((r, i) => { const v = s.rates[r]; return `<tr><td><b>${esc(r)}</b></td><td><input id="rt-p${i}" type="number" step="0.01" min="0" name="pay_${i}" value="${v.pay.toFixed(2)}" aria-label="Pay rate for ${esc(r)}" style="max-width:140px"></td><td><input id="rt-c${i}" type="number" step="0.01" min="0" name="charge_${i}" value="${v.charge.toFixed(2)}" aria-label="Charge rate for ${esc(r)}" style="max-width:140px"></td><td class="num">${money(v.charge - v.pay)} · ${((v.charge - v.pay) / v.charge * 100).toFixed(1)}%</td></tr>`; }).join('')}
      </tbody></table></div><div class="form-actions"><button class="btn primary">Save rates</button></div></form>`)}
      <div class="grid-2">
      ${card('Payroll, VAT and invoices', '', `<form class="form" data-form="settings-finance"><div class="form-grid">
        <label>Holiday pay (%)<input id="st-hol" type="number" step="0.01" min="0" max="30" name="holidayPct" value="${s.holidayPct}"></label>
        <label>Employer NI and pension estimate (%)<input id="st-onc" type="number" step="0.1" min="0" max="40" name="onCostPct" value="${s.onCostPct}"></label>
        <label>VAT rate (%)<input id="st-vatr" type="number" step="0.1" min="0" max="30" name="vatRate" value="${s.vatRate}"></label>
        <label>Payment terms (days)<input id="st-terms" type="number" min="0" max="120" name="paymentTerms" value="${s.paymentTerms}"></label>
        <label>Invoice prefix<input id="st-pref" name="invoicePrefix" value="${esc(s.invoicePrefix)}"></label>
        <label>Next invoice number<input id="st-next" type="number" min="1" name="nextInvoice" value="${s.nextInvoice}"></label>
      </div><div class="form-actions"><button class="btn primary">Save</button></div></form>`)}
      ${card('Markets', '', `<div class="list">
        <div class="list-item"><span class="step-ic ok">${ic('pin')}</span><div class="grow"><b>United Kingdom</b><p class="muted small">GBP · VAT ${s.vatRate}% · right to work, licence and CPC checks</p></div>${chip('Live', false)}</div>
        <div class="list-item"><span class="step-ic warn">${ic('globe')}</span><div class="grow"><b>Dubai, UAE</b><p class="muted small">AED · VAT 5% · Emirates ID, visa and UAE driving licence checks</p></div>
          <label class="check"><input id="st-dxb" type="checkbox" data-action="toggle-dubai" ${s.dubaiEnabled ? 'checked' : ''}> Show as opening soon</label></div>
      </div>
      <div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--line)"><b>Demo data</b><p class="muted small" style="margin:4px 0 10px">Put back all the sample candidates, clients, shifts and invoices.</p><button type="button" class="btn danger sm" data-action="reset-demo">Reset demo data</button></div>`)}
      </div>`;
    }
  };
  const TEMPLATES = [
    ['Shift reminder', 'on-shift', 'Shift reminder', 'Your shift starts soon. Please clock in from the app when you arrive on site.'],
    ['New jobs', 'all-candidates', 'New jobs this week', 'We have new van, HGV and warehouse roles near you. Open Find jobs to apply.'],
    ['Documents', 'all-candidates', 'Check your documents', 'Please make sure your licence, CPC card and right-to-work documents are up to date in the app.'],
    ['Bank holiday', 'all-employers', 'Bank holiday cover', 'Book your bank holiday staff now. Reply to this message or use Request staff.']
  ];

  function liveTable(list, compact) {
    if (!list.length) return empty('No shifts in this list.');
    return `<div class="table-wrap"><table><thead><tr><th>Worker</th><th>${compact ? 'Client' : 'Client & site'}</th><th class="num">Shift</th><th>Status</th><th class="num">Clocked in</th><th class="num">${compact ? 'Time on site' : 'Time on site / hours'}</th>${compact ? '' : '<th>Location</th>'}<th></th></tr></thead><tbody>
      ${list.map(s => {
        const c = cand(s.candidateId), st = shiftState(s), lb = lateBy(s);
        let time = '—';
        if (st === 'On site') time = `<span class="elapsed" data-since="${s.clockIn}">${dur(Date.now() - ms(s.clockIn))}</span>`;
        else if (st === 'On break') time = `<span class="elapsed" data-since="${s.clockIn}">${dur(Date.now() - ms(s.clockIn))}</span><span class="flag" style="color:var(--blue)">break <span data-since="${s.breakStart}" data-short="1">${durShort(Date.now() - ms(s.breakStart))}</span></span>`;
        else if (st === 'Completed') time = `<b>${hrs(hoursOf(s))} hrs</b>`;
        else if (st === 'Late') time = `<span class="flag" data-countdown="${s.start}">${countdown(s.start)}</span>`;
        else time = `<span class="muted small" data-countdown="${s.start}">${countdown(s.start)}</span>`;
        const actions = clockButtons(s, 'sm') + (st === 'Late' ? `<button type="button" class="btn danger sm" data-action="clock" data-op="noshow" data-id="${s.id}">No-show</button>` : '') + (compact ? '' : `<button type="button" class="btn ghost sm" data-action="shift-modal" data-id="${s.id}" aria-label="Shift details">${ic('eye')}</button>`);
        return `<tr><td>${personCell(c, s.role)}</td><td class="small"><b>${esc(employerName(s.clientId))}</b>${compact ? '' : `<span class="sub">${esc(s.site.split(',')[0])}</span>`}</td><td class="num small">${fmtTime(s.start)}–${fmtTime(s.end)}</td><td>${chip(st)}</td>
          <td class="num">${s.clockIn ? fmtTime(s.clockIn) + (lb > db.settings.graceMins ? `<span class="flag">${lb} min late</span>` : '<span class="flag ok">on time</span>') : '—'}</td><td class="num">${time}</td>
          ${compact ? '' : `<td class="small">${s.gps && s.gps.ok ? `<span style="color:var(--green);font-weight:600">${ic('shield')} ${s.gps.dist} m</span>` : s.gps && s.gps.manual ? 'Set by admin' : '—'}</td>`}
          <td><div class="btn-row" style="flex-wrap:nowrap">${actions}</div></td></tr>`;
      }).join('')}
    </tbody></table></div>`;
  }
  function workerOptions(role, selected) {
    const list = db.candidates.filter(c => c.status === 'Active').slice().sort((a, b) => (b.role === role) - (a.role === role) || a.name.localeCompare(b.name));
    return `<option value="">Choose a worker</option>` + list.map(c => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${esc(c.name)} – ${esc(c.role)}${compliant(c) ? '' : ' (checks incomplete)'}</option>`).join('');
  }

  /* ================= Modals ================= */
  function jobModal(id) {
    const j = job(id); if (!j) return;
    const c = curRole === 'candidate' ? actor('candidate') : null;
    const applied = c && hasApplied(c, j.id);
    openModal(j.title, `<p class="muted" style="margin-bottom:14px">${esc(employerName(j.employerId))}</p>
      <dl class="kv"><dt>Location</dt><dd>${esc(j.location)}</dd><dt>Pay</dt><dd>${esc(j.pay)}</dd><dt>Contract</dt><dd>${esc(j.type)}</dd><dt>Shift</dt><dd>${esc(j.shift)}</dd><dt>Positions</dt><dd>${esc(j.positions)}</dd><dt>Start date</dt><dd>${fmtDate(j.start)}</dd><dt>Status</dt><dd>${chip(j.status)}</dd></dl>
      <h4 class="section-title">About the job</h4><p>${esc(j.description)}</p>
      ${j.requirements ? `<h4 class="section-title">Requirements</h4><p>${esc(j.requirements)}</p>` : ''}
      ${c ? `<div class="form-actions" style="margin-top:20px">${applied ? chip('Applied') : `<button type="button" class="btn primary" data-action="apply" data-id="${j.id}">Apply for this job</button>`}</div>` : ''}`);
  }

  function candidateModal(id) {
    const c = cand(id); if (!c) return;
    const full = curRole === 'admin';
    const req = requiredDocs(c);
    const shifts = db.shifts.filter(s => s.candidateId === c.id && s.clockOut).sort((a, b) => ms(b.start) - ms(a.start));
    const apps = db.applications.filter(a => a.candidateId === c.id);
    const docsHtml = req.concat(c.docs.map(d => d.type).filter(t => !req.includes(t))).map(t => {
      const d = docOf(c, t), st = docState(d);
      return `<div class="list-item"><span class="step-ic">${ic('file')}</span><div class="grow"><b>${esc(DOC_TYPES[t])}</b><p class="muted small">${d ? esc(d.fileName) + (d.expiry ? ' · expires ' + fmtDate(d.expiry) : '') : 'Not uploaded'}</p></div>${chip(st)}
        ${full && d ? `<div class="btn-row"><button type="button" class="btn ghost sm" data-action="view-doc" data-c="${c.id}" data-d="${d.id}">View</button>${d.status === 'Pending' ? `<button type="button" class="btn success sm" data-action="verify-doc" data-c="${c.id}" data-d="${d.id}" data-reopen="1">Verify</button>` : ''}</div>` : ''}</div>`;
    }).join('');
    const days = DAYS.filter(d => c.availability.days[d]).join(', ') || 'Not set';
    openModal(full ? c.name : shortName(c.name), `
      <div class="profile-head">${avatar(c.name, 'lg')}<div><h3>${esc(full ? c.name : shortName(c.name))}</h3><p class="muted">${esc(c.role)} · ${esc(c.experience)} years · ${esc(c.city)}</p></div><span style="margin-left:auto">${chip(c.status)}</span></div>
      ${full ? `<div class="stats" style="margin-bottom:16px">${stat('Shifts worked', shifts.length, 'Last 14 days')}${stat('Hours', hrs(sum(shifts.map(hoursOf))), 'Last 14 days')}${stat('Earned', money(sum(shifts.map(s => grossOf(s))), 0), 'Gross')}</div>` : ''}
      <dl class="kv">
        ${full ? `<dt>Email</dt><dd>${esc(c.email)}</dd><dt>Mobile</dt><dd>${esc(c.phone)}</dd><dt>Postcode</dt><dd>${esc(c.postcode)}</dd>` : `<dt>Area</dt><dd>${esc(c.postcode.split(' ')[0])}</dd>`}
        <dt>Licence</dt><dd>${esc((c.licence || []).join(', ') || 'None')}</dd>
        <dt>Availability</dt><dd>${esc(c.availability.status)}</dd><dt>Days</dt><dd>${esc(days)}</dd><dt>Shifts</dt><dd>${esc(c.availability.shifts.join(', ') || 'Any')}</dd>
      </dl>
      ${c.about ? `<h4 class="section-title">About</h4><p>${esc(c.about)}</p>` : ''}
      <h4 class="section-title">Checks</h4><div class="list">${docsHtml}</div>
      ${full ? `<h4 class="section-title">Applications</h4>${apps.length ? `<div class="list">${apps.map(a => { const j = job(a.jobId); return `<div class="list-item"><div class="grow"><b>${esc(j ? j.title : 'Removed job')}</b><p class="muted small">${ago(a.createdAt)}</p></div>${chip(a.status)}</div>`; }).join('')}</div>` : '<p class="muted">No applications yet.</p>'}
        <div class="form-actions" style="margin-top:20px"><button type="button" class="btn ${c.status === 'Active' ? 'danger' : 'success'}" data-action="cand-status" data-id="${c.id}">${c.status === 'Active' ? 'Suspend worker' : 'Reactivate worker'}</button><button type="button" class="btn outline" data-action="message-cand" data-id="${c.id}">${ic('send')}Message</button><button type="button" class="btn primary" data-action="create-shift" data-cand="${c.id}">${ic('calendar')}Book a shift</button></div>` : ''}`, true);
  }

  function docModal(cid, did) {
    const c = cand(cid); if (!c) return;
    const d = c.docs.find(x => x.id === did); if (!d) return;
    let preview;
    if (d.data && d.data.startsWith('data:image')) preview = `<img src="${d.data}" alt="${esc(d.fileName)}">`;
    else if (d.data && d.data.startsWith('data:application/pdf')) preview = `<iframe src="${d.data}" title="${esc(d.fileName)}"></iframe>`;
    else preview = `<div class="mock-doc"><b>${esc(d.fileName)}</b><p class="muted small">${esc(DOC_TYPES[d.type])} · ${fmtSize(d.size)}</p><i style="width:90%"></i><i style="width:70%"></i><i style="width:82%"></i><i style="width:55%"></i><p class="muted small" style="margin-top:12px">Sample file. In the live app the original document opens here from secure storage.</p></div>`;
    const admin = curRole === 'admin';
    openModal(DOC_TYPES[d.type] + ' – ' + c.name, `<div class="doc-preview">${preview}</div>
      <div class="btn-row" style="justify-content:space-between;margin-top:16px"><span>${chip(docState(d))} <span class="muted small">Uploaded ${fmtDate(d.uploaded)}${d.expiry ? ' · expires ' + fmtDate(d.expiry) : ''}</span></span>
      ${admin && d.status === 'Pending' ? `<div class="btn-row"><button type="button" class="btn success" data-action="verify-doc" data-c="${c.id}" data-d="${d.id}">Verify</button><button type="button" class="btn danger" data-action="reject-doc" data-c="${c.id}" data-d="${d.id}">Reject</button></div>` : ''}</div>`, true);
  }

  function invoiceModal(id) {
    const i = invById(id); if (!i) return;
    const e = emp(i.clientId) || {}, s = db.settings, st = invState(i);
    openModal('Invoice ' + i.number, `<div class="invoice">
      <div class="inv-head"><div><div class="brand">${LOGO}<span><b>${esc(s.company)}</b><small>Recruitment</small></span></div>
        <p class="inv-from">${esc(s.address)}<br>${esc(s.email)} · ${esc(s.phone)}<br>VAT ${esc(s.vatNo)} · Company no. ${esc(s.companyNo)}</p></div>
        <div class="inv-meta"><h2>Invoice</h2><dl><dt>Number</dt><dd>${esc(i.number)}</dd><dt>Issued</dt><dd>${fmtDate(i.issued)}</dd><dt>Due</dt><dd>${fmtDate(i.due)}</dd><dt>Status</dt><dd>${chip(st)}</dd></dl></div></div>
      <div class="inv-to"><span>Bill to</span><b>${esc(e.company || '')}</b><br>${esc(e.contact || '')}<br>${esc(e.address || '')}<br><span style="text-transform:none;letter-spacing:0;font-weight:400;margin-top:6px">Period: ${esc(i.period)}</span></div>
      <div class="table-wrap"><table><thead><tr><th>Description</th><th class="num">Hours</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>
        ${i.lines.map(l => `<tr><td>${esc(l.desc)}</td><td class="num">${hrs(l.qty)}</td><td class="num">${money(l.rate)}</td><td class="num">${money(l.amount)}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="inv-tot"><div><span>Net</span><span>${money(i.net)}</span></div><div><span>VAT ${i.vatRate}%</span><span>${money(i.vat)}</span></div><div class="grand"><span>Total</span><span>${money(i.total)}</span></div></div>
      <p class="muted small" style="margin-top:16px">Payment terms: ${s.paymentTerms} days. ${i.paidAt ? 'Paid on ' + fmtDate(i.paidAt) + '.' : 'Bank details appear here in the live system.'}</p>
    </div>
    ${curRole === 'admin' && i.status !== 'Paid' ? `<div class="form-actions" style="margin-top:16px">${i.status === 'Draft' ? `<button type="button" class="btn primary" data-action="invoice-status" data-id="${i.id}" data-status="Sent">${ic('send')}Send to client</button>` : `<button type="button" class="btn success" data-action="invoice-status" data-id="${i.id}" data-status="Paid">Mark as paid</button>`}</div>` : ''}`, true);
  }

  function payslipModal(pid, cid) {
    const p = db.payruns.find(x => x.id === pid), c = cand(cid); if (!p || !c) return;
    const l = p.lines.find(x => x.candidateId === cid); if (!l) return;
    const shifts = l.shiftIds.map(shiftById).filter(Boolean).sort((a, b) => ms(a.start) - ms(b.start));
    openModal('Payslip – ' + fmtDate(p.date), `<dl class="kv"><dt>Employee</dt><dd>${esc(c.name)}</dd><dt>Employer</dt><dd>${esc(db.settings.company)}</dd><dt>Pay date</dt><dd>${fmtDate(p.date)}</dd></dl>
      <div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>Date</th><th>Site</th><th class="num">Hours</th><th class="num">Rate</th><th class="num">Pay</th></tr></thead><tbody>
        ${shifts.map(s => `<tr><td class="nowrap">${fmtDay(s.start)}</td><td class="small">${esc(s.site)}</td><td class="num">${hrs(hoursOf(s))}</td><td class="num">${money(s.payRate)}</td><td class="num">${money(payOf(s))}</td></tr>`).join('')}
      </tbody></table></div>
      <table class="pl" style="margin-top:12px"><tbody><tr><td>Basic pay</td><td>${money(l.basic)}</td></tr><tr><td>Holiday pay</td><td>${money(l.holiday)}</td></tr><tr class="total"><td>Gross pay</td><td>${money(l.gross)}</td></tr></tbody></table>
      <p class="muted small" style="margin-top:10px">Tax, National Insurance and pension deductions appear here in the live system.</p>`, true);
  }

  function payrunModal(pid) {
    const p = db.payruns.find(x => x.id === pid); if (!p) return;
    openModal(p.label, `<div class="table-wrap"><table><thead><tr><th>Worker</th><th class="num">Shifts</th><th class="num">Hours</th><th class="num">Basic</th><th class="num">Holiday</th><th class="num">Gross</th></tr></thead><tbody>
      ${p.lines.map(l => `<tr><td>${esc(candName(l.candidateId))}</td><td class="num">${l.shiftIds.length}</td><td class="num">${hrs(l.hours)}</td><td class="num">${money(l.basic)}</td><td class="num">${money(l.holiday)}</td><td class="num"><b>${money(l.gross)}</b></td></tr>`).join('')}
    </tbody><tfoot><tr><td>Total</td><td></td><td class="num">${hrs(p.hours)}</td><td class="num">${money(p.basic)}</td><td class="num">${money(p.holiday)}</td><td class="num">${money(p.gross)}</td></tr></tfoot></table></div>`, true);
  }

  function shiftModal(id) {
    const s = shiftById(id); if (!s) return;
    const st = shiftState(s), c = s.candidateId ? cand(s.candidateId) : null;
    const editable = !s.clockIn && s.status === 'Scheduled';
    openModal('Shift – ' + fmtDay(s.start), `
      <dl class="kv"><dt>Client</dt><dd>${esc(employerName(s.clientId))}</dd><dt>Site</dt><dd>${esc(s.site)}</dd><dt>Role</dt><dd>${esc(s.role)}</dd><dt>Booked</dt><dd>${fmtTime(s.start)}–${fmtTime(s.end)}</dd><dt>Worker</dt><dd>${c ? esc(c.name) : 'Unfilled'}</dd><dt>Status</dt><dd>${chip(st)}</dd>
        <dt>Rates</dt><dd>Pay ${money(s.payRate)} · charge ${money(s.chargeRate)}</dd>
        ${s.clockIn ? `<dt>Clocked in</dt><dd>${fmtTime(s.clockIn)}${s.gps && s.gps.ok ? ' · ' + s.gps.dist + ' m from site' : ''}</dd>` : ''}${s.clockOut ? `<dt>Clocked out</dt><dd>${fmtTime(s.clockOut)} · ${hrs(hoursOf(s))} hours</dd>` : ''}</dl>
      ${clockButtons(s, 'sm') ? `<div class="btn-row" style="margin-top:16px">${clockButtons(s, 'sm')}${st === 'Late' ? `<button type="button" class="btn danger sm" data-action="clock" data-op="noshow" data-id="${s.id}">Mark no-show</button>` : ''}</div>` : ''}
      ${editable ? `<form class="form" data-form="edit-shift" style="margin-top:18px;padding-top:16px;border-top:1px solid var(--line)"><input type="hidden" name="id" value="${s.id}">
        <div class="form-grid"><label class="full">Worker<select id="es-worker" name="candidateId">${workerOptions(s.role, s.candidateId || '')}</select></label>
        <label>Start<input id="es-start" type="datetime-local" name="start" value="${dtLocal(s.start)}" required></label><label>End<input id="es-end" type="datetime-local" name="end" value="${dtLocal(s.end)}" required></label></div>
        <div class="form-actions"><button type="button" class="btn danger" data-action="cancel-shift" data-id="${s.id}">Cancel shift</button><button class="btn primary">Save changes</button></div></form>` : ''}`);
  }

  function createShiftModal(pre) {
    pre = pre || {};
    const b = pre.booking ? db.bookings.find(x => x.id === pre.booking) : null;
    const c = pre.cand ? cand(pre.cand) : null;
    const clientId = b ? b.employerId : 'e1', role = b ? b.role : c ? c.role : 'Van Driver';
    const startTime = b && b.shift === 'Nights' ? '22:00' : '07:00', endTime = b && b.shift === 'Nights' ? '07:00' : '16:00';
    openModal(b ? 'Create shifts for ' + employerName(b.employerId) : 'Create shift', `<form class="form" data-form="create-shift">${b ? `<input type="hidden" name="booking" value="${b.id}">` : ''}
      <div class="form-grid">
        <label>Client<select id="cs-client" name="clientId" required>${opts(db.employers.filter(e => e.status === 'Approved').map(e => [e.id, e.company]), clientId)}</select></label>
        <label>Role<select id="cs-role" name="role" required>${opts(ROLES, role)}</select></label>
        <label>Date<input id="cs-date" type="date" name="date" value="${b ? b.start : dayKey(Date.now() + DAY)}" required></label>
        <label>Start time<input id="cs-st" type="time" name="startTime" value="${startTime}" required></label>
        <label>End time<input id="cs-en" type="time" name="endTime" value="${endTime}" required><span class="hint">Earlier than start means overnight</span></label>
        <label>Workers needed<input id="cs-qty" type="number" name="qty" min="1" max="30" value="${b ? b.qty : 1}" required></label>
        <label>Repeat for following days<input id="cs-rep" type="number" name="repeat" min="0" max="13" value="0"><span class="hint">0 = this day only</span></label>
        <label class="full">Worker (optional)<select id="cs-worker" name="candidateId">${workerOptions(role, c ? c.id : '')}</select><span class="hint">Leave empty to post as unfilled. Only used for the first shift each day.</span></label>
      </div>
      <div class="form-actions"><button type="button" class="btn ghost" data-action="close-modal">Cancel</button><button class="btn primary">Create</button></div></form>`, true);
  }

  /* ================= Clock actions ================= */
  function doClock(s, op) {
    const now = new Date().toISOString(), c = cand(s.candidateId), set = db.settings;
    const by = curRole === 'admin' ? 'admin' : 'app';
    const ev = (type, text) => db.clockEvents.push({ id: uid('k'), at: now, candidateId: s.candidateId, type, text, by });
    if (op === 'in') {
      if (s.clockIn) return;
      s.clockIn = now;
      s.gps = by === 'admin' ? { ok: false, manual: true } : set.geofenceOn ? { ok: true, dist: 15 + Math.round(Math.random() * Math.max(10, set.geofence * 0.6)) } : null;
      const lb = lateBy(s);
      const where = s.site.split(',')[0];
      const txt = (lb > set.graceMins ? 'Clocked in ' + lb + ' min late' : 'Clocked in') + ' at ' + where + (s.gps && s.gps.ok ? ' (' + s.gps.dist + ' m from site)' : '');
      ev('in', txt); log('Attendance', txt + (by === 'admin' ? ' for ' + c.name : ''));
      notify('employer:' + s.clientId, 'Worker on site', shortName(c.name) + ' ' + txt.charAt(0).toLowerCase() + txt.slice(1) + '.');
      toast(by === 'admin' ? c.name + ' clocked in' : 'Clocked in. Have a safe shift.');
    } else if (op === 'break') {
      s.breakStart = now; ev('break', 'Started break'); log('Attendance', 'Started break' + (by === 'admin' ? ' for ' + c.name : ''));
      toast('Break started');
    } else if (op === 'resume') {
      const m = Math.max(1, Math.round((Date.now() - ms(s.breakStart)) / MIN));
      s.breakMins = (s.breakMins || 0) + m; s.breakStart = null;
      ev('resume', 'Ended break after ' + m + ' min'); log('Attendance', 'Ended break after ' + m + ' min' + (by === 'admin' ? ' for ' + c.name : ''));
      toast('Break ended. Timer running again.');
    } else if (op === 'out') {
      if (s.breakStart) { s.breakMins = (s.breakMins || 0) + Math.max(1, Math.round((Date.now() - ms(s.breakStart)) / MIN)); s.breakStart = null; }
      s.clockOut = now; s.status = 'Completed'; s.ts = 'Submitted'; s.tsBy = '';
      const txt = 'Clocked out. ' + hrs(hoursOf(s)) + ' hours worked';
      ev('out', txt); log('Attendance', txt + (by === 'admin' ? ' for ' + c.name : ''));
      notify('employer:' + s.clientId, 'Timesheet ready to approve', shortName(c.name) + ' worked ' + hrs(hoursOf(s)) + ' hours on ' + fmtDay(s.start) + '.');
      toast('Clocked out. Timesheet sent for approval.');
    } else if (op === 'noshow') {
      s.status = 'No-show';
      ev('noshow', 'Marked as no-show'); log('Attendance', 'Marked ' + c.name + ' as no-show at ' + employerName(s.clientId));
      notify('employer:' + s.clientId, 'Worker did not arrive', shortName(c.name) + ' did not arrive for the ' + fmtTime(s.start) + ' shift. We are finding cover.');
      notify('candidate:' + c.id, 'Missed shift', 'You were marked as a no-show for your ' + fmtTime(s.start) + ' shift. Please call the office.');
      toast(c.name + ' marked as no-show', 'warn');
    }
    save();
  }

  /* ================= Form handlers ================= */
  const FORMS = {
    'cand-profile'(d, f, fd) {
      const c = actor('candidate');
      Object.assign(c, { name: d.name.trim(), email: d.email.trim().toLowerCase(), phone: d.phone.trim(), city: d.city.trim(), postcode: d.postcode.trim().toUpperCase(), role: d.role, experience: Number(d.experience) || 0, licence: fd.getAll('licence'), about: d.about.trim() });
      log('Candidates', 'Updated profile'); save(); toast('Profile saved'); render();
    },
    availability(d, f, fd) {
      const c = actor('candidate'), days = fd.getAll('days');
      if (d.status === 'Available from date' && !d.from) return toast('Choose the date you are available from', 'error');
      c.availability = { days: Object.fromEntries(DAYS.map(x => [x, days.includes(x)])), shifts: fd.getAll('shifts'), status: d.status, from: d.from };
      log('Candidates', 'Updated availability: ' + d.status); save(); toast('Availability saved'); render();
    },
    'upload-doc'(d, f, fd) {
      const file = fd.get('file');
      if (!file || !file.name) return toast('Choose a file to upload', 'error');
      if (file.size > 5 * 1024 * 1024) return toast('This file is over 5 MB. Choose a smaller file.', 'error');
      if (!/\.(pdf|jpe?g|png|docx?)$/i.test(file.name)) return toast('Upload a PDF, JPG, PNG or Word file', 'error');
      const c = actor('candidate'), type = d.type;
      const finish = data => {
        c.docs = c.docs.filter(x => x.type !== type);
        const doc = { id: uid('d'), type, fileName: file.name, size: file.size, uploaded: new Date().toISOString(), status: 'Pending', note: '', expiry: d.expiry || '', data };
        c.docs.push(doc);
        log('Compliance', 'Uploaded ' + DOC_TYPES[type]);
        if (!save()) { doc.data = null; save(); }
        closeModal(); toast(DOC_TYPES[type] + ' uploaded. We will check it within 24 hours.'); render();
      };
      if (file.size <= 900 * 1024 && /^(image\/(png|jpe?g)|application\/pdf)$/.test(file.type) && window.FileReader) {
        const rd = new FileReader(); rd.onload = () => finish(rd.result); rd.onerror = () => finish(null); rd.readAsDataURL(file);
      } else finish(null);
    },
    'post-job'(d) {
      const admin = curRole === 'admin';
      const j = { id: uid('j'), title: d.title.trim(), category: d.category, location: d.location.trim(), type: d.type, pay: d.pay.trim(), shift: d.shift.trim(), positions: Number(d.positions) || 1, start: d.start, description: d.description.trim(), requirements: (d.requirements || '').trim(), employerId: admin ? (d.employerId || null) : ME.employer, status: admin ? 'Open' : 'Pending approval', createdAt: new Date().toISOString() };
      db.jobs.push(j);
      log('Jobs', 'Posted job: ' + j.title);
      if (admin) { notify('all-candidates', 'New job: ' + j.title, j.location + ' · ' + j.pay + ' · ' + j.type); if (j.employerId) notify('employer:' + j.employerId, 'Job published', 'Vision Transit published "' + j.title + '" for you.'); }
      save(); closeModal(); toast(admin ? 'Job published and candidates notified' : 'Job sent to Vision Transit for approval');
      go(admin ? '#/admin/jobs' : '#/employer/jobs');
    },
    booking(d) {
      const e = actor('employer');
      db.bookings.push({ id: uid('b'), employerId: e.id, role: d.role, qty: Number(d.qty) || 1, type: d.type, start: d.start, shift: d.shift, site: d.site.trim(), notes: d.notes.trim(), candidateId: null, status: 'Requested', createdAt: new Date().toISOString() });
      log('Clients', 'Requested ' + d.qty + ' × ' + d.role); save(); toast('Request sent to Vision Transit'); render();
    },
    company(d) {
      const e = actor('employer');
      Object.assign(e, { company: d.company.trim(), contact: d.contact.trim(), phone: d.phone.trim(), email: d.email.trim().toLowerCase(), sector: d.sector, address: d.address.trim(), companyNo: d.companyNo.trim() });
      log('Clients', 'Updated company details'); save(); toast('Company details saved'); render();
    },
    interview(d) {
      const a = db.applications.find(x => x.id === d.appId); if (!a) return;
      a.status = 'Interview'; a.interviewDate = d.when; a.interviewNote = d.note.trim();
      const j = job(a.jobId);
      notify('candidate:' + a.candidateId, 'Interview booked', (j ? j.title : 'Job') + ' on ' + fmtDT(d.when) + (a.interviewNote ? '. ' + a.interviewNote : ''));
      log('Recruitment', 'Booked interview for ' + candName(a.candidateId));
      save(); closeModal(); toast('Interview booked and candidate notified'); render();
    },
    'reject-doc'(d) {
      const c = cand(d.cid), doc = c && c.docs.find(x => x.id === d.did); if (!doc) return;
      doc.status = 'Rejected'; doc.note = d.reason.trim();
      notify('candidate:' + c.id, DOC_TYPES[doc.type] + ' needs re-uploading', doc.note || 'Your document could not be accepted. Please upload a clearer copy.');
      log('Compliance', 'Rejected ' + DOC_TYPES[doc.type] + ' for ' + c.name + ': ' + doc.note);
      save(); closeModal(); toast('Document rejected and candidate told why'); render();
    },
    'ts-query'(d) {
      const s = shiftById(d.id); if (!s) return;
      s.ts = 'Queried'; s.tsNote = d.reason.trim(); s.tsBy = '';
      notify('candidate:' + s.candidateId, 'Timesheet queried', 'Your timesheet for ' + fmtDay(s.start) + ' was queried: ' + s.tsNote);
      log('Timesheets', 'Queried timesheet for ' + candName(s.candidateId) + ': ' + s.tsNote);
      save(); closeModal(); toast('Timesheet queried'); render();
    },
    'ts-edit'(d) {
      const s = shiftById(d.id); if (!s) return;
      const ci = new Date(d.clockIn), co = new Date(d.clockOut);
      if (isNaN(ci) || isNaN(co) || co <= ci) return toast('Clock-out must be after clock-in', 'error');
      s.clockIn = ci.toISOString(); s.clockOut = co.toISOString(); s.breakMins = Math.max(0, Number(d.breakMins) || 0);
      s.tsNote = 'Edited by admin: ' + d.reason.trim(); s.ts = 'Submitted';
      log('Timesheets', 'Edited times for ' + candName(s.candidateId) + ' on ' + fmtDay(s.start) + ': ' + d.reason.trim());
      save(); closeModal(); toast('Timesheet updated. It now needs approval again.'); render();
    },
    'create-shift'(d) {
      const qty = Math.max(1, Math.min(30, Number(d.qty) || 1)), rep = Math.max(0, Math.min(13, Number(d.repeat) || 0));
      const e = emp(d.clientId), rate = db.settings.rates[d.role];
      let made = 0;
      for (let k = 0; k <= rep; k++) {
        const st = new Date(d.date + 'T' + d.startTime); st.setDate(st.getDate() + k);
        const en = new Date(d.date + 'T' + d.endTime); en.setDate(en.getDate() + k);
        if (en <= st) en.setDate(en.getDate() + 1);
        for (let q = 0; q < qty; q++) {
          db.shifts.push({ id: uid('s'), candidateId: q === 0 && d.candidateId ? d.candidateId : null, clientId: e.id, role: d.role, site: e.sites[0], start: st.toISOString(), end: en.toISOString(), payRate: rate.pay, chargeRate: rate.charge, clockIn: null, clockOut: null, breakStart: null, breakMins: 0, gps: null, status: 'Scheduled', ts: null, tsNote: '', tsBy: '', invoiceId: null, payrunId: null, manual: false });
          made++;
        }
      }
      if (d.candidateId) notify('candidate:' + d.candidateId, 'New shift booked', d.role + ' at ' + e.sites[0] + ', ' + fmtDay(d.date + 'T12:00') + ' from ' + d.startTime + '.');
      if (d.booking) { const b = db.bookings.find(x => x.id === d.booking); if (b) { b.status = 'In progress'; notify('employer:' + b.employerId, 'Staff request in progress', made + ' shifts created for ' + b.qty + ' × ' + b.role + '. We are assigning workers now.'); } }
      log('Shifts', 'Created ' + made + ' shift' + (made === 1 ? '' : 's') + ' for ' + e.company);
      save(); closeModal(); toast(made + ' shift' + (made === 1 ? '' : 's') + ' created');
      const dt = new Date(d.date + 'T12:00'); ui.week = Math.round((weekStart(dt) - weekStart(Date.now())) / (7 * DAY));
      go('#/admin/shifts');
    },
    'edit-shift'(d) {
      const s = shiftById(d.id); if (!s) return;
      const st = new Date(d.start), en = new Date(d.end);
      if (isNaN(st) || isNaN(en) || en <= st) return toast('End must be after start', 'error');
      const prev = s.candidateId;
      s.start = st.toISOString(); s.end = en.toISOString(); s.candidateId = d.candidateId || null;
      if (s.candidateId && s.candidateId !== prev) notify('candidate:' + s.candidateId, 'New shift booked', s.role + ' at ' + s.site + ', ' + fmtDT(s.start) + '.');
      log('Shifts', 'Updated shift on ' + fmtDay(s.start) + ' at ' + employerName(s.clientId));
      save(); closeModal(); toast('Shift saved'); render();
    },
    expense(d, f, fd) {
      const net = Number(d.net); if (!(net > 0)) return toast('Enter the amount before VAT', 'error');
      const file = fd.get('receipt');
      db.expenses.push({ id: uid('x'), date: d.date, category: d.category, supplier: d.supplier.trim(), net: round2(net), vat: round2(net * Number(d.vatRate) / 100), note: d.note.trim(), receipt: file && file.name ? file.name : '' });
      log('Finance', 'Recorded expense: ' + d.category + ' (' + d.supplier.trim() + ')');
      save(); closeModal(); toast('Expense saved'); render();
    },
    'send-notification'(d) {
      if (d.to === 'on-shift') {
        const ids = Array.from(new Set(liveShifts().filter(s => !s.clockOut).map(s => s.candidateId)));
        ids.forEach(id => notify('candidate:' + id, d.title.trim(), d.body.trim()));
        log('Notifications', 'Sent "' + d.title.trim() + '" to ' + ids.length + ' workers on shift');
        save(); toast('Sent to ' + ids.length + ' workers'); render(); return;
      }
      notify(d.to, d.title.trim(), d.body.trim());
      log('Notifications', 'Sent "' + d.title.trim() + '"');
      save(); toast('Notification sent'); render();
    },
    invite(d) {
      if (db.team.some(t => t.email.toLowerCase() === d.email.trim().toLowerCase())) return toast('That email is already on the team', 'error');
      db.team.push({ id: uid('t'), name: d.name.trim(), role: d.role, email: d.email.trim().toLowerCase(), status: 'Invited', lastActive: new Date().toISOString() });
      log('Team', 'Invited ' + d.name.trim() + ' as ' + d.role);
      save(); closeModal(); toast('Invitation sent to ' + d.email.trim()); render();
    },
    'settings-company'(d) { Object.assign(db.settings, { company: d.company.trim(), vatNo: d.vatNo.trim(), companyNo: d.companyNo.trim(), email: d.email.trim(), phone: d.phone.trim(), address: d.address.trim() }); log('Settings', 'Updated company details'); save(); toast('Company details saved'); render(); },
    'settings-attendance'(d) {
      Object.assign(db.settings, { graceMins: Math.max(0, Number(d.graceMins) || 0), geofence: Math.max(50, Number(d.geofence) || 200), autoClockOutHrs: Math.max(8, Number(d.autoClockOutHrs) || 14), geofenceOn: d.geofenceOn === 'yes' });
      log('Settings', 'Updated attendance rules'); save(); toast('Attendance rules saved'); render();
    },
    'settings-rates'(d) {
      ROLES.forEach((r, i) => { const p = Number(d['pay_' + i]), c = Number(d['charge_' + i]); if (p > 0 && c > 0) db.settings.rates[r] = { pay: round2(p), charge: round2(c) }; });
      log('Settings', 'Updated pay and charge rates'); save(); toast('Rates saved. New shifts use them.'); render();
    },
    'settings-finance'(d) {
      Object.assign(db.settings, { holidayPct: Number(d.holidayPct) || 0, onCostPct: Number(d.onCostPct) || 0, vatRate: Number(d.vatRate) || 0, paymentTerms: Number(d.paymentTerms) || 0, invoicePrefix: d.invoicePrefix.trim() || 'INV-', nextInvoice: Math.max(1, Number(d.nextInvoice) || 1) });
      log('Settings', 'Updated payroll, VAT and invoice settings'); save(); toast('Settings saved'); render();
    }
  };

  /* ================= Click actions ================= */
  const ACTIONS = {
    'toggle-nav'() { document.body.classList.toggle('nav-open'); },
    backdrop(el, e) { if (e.target === el) closeModal(); },
    'close-modal'() { closeModal(); },
    'set-tab'(el) { ui[el.dataset.key] = el.dataset.val; render(); },
    week(el) { const op = Number(el.dataset.op); ui.week = op === 0 ? 0 : ui.week + op; render(); },
    'view-job'(el) { jobModal(el.dataset.id); },
    'view-candidate'(el) { candidateModal(el.dataset.id); },
    'view-doc'(el) { docModal(el.dataset.c, el.dataset.d); },
    'view-invoice'(el) { invoiceModal(el.dataset.id); },
    'view-payslip'(el) { payslipModal(el.dataset.id, el.dataset.c); },
    'view-payrun'(el) { payrunModal(el.dataset.id); },
    'shift-modal'(el) { shiftModal(el.dataset.id); },
    'create-shift'(el) { createShiftModal({ booking: el.dataset.booking, cand: el.dataset.cand }); },
    'admin-post-job'() { openModal('Post a job', jobForm(true), true); },
    'post-job-modal'() { openModal('Post a job', jobForm(false), true); },
    'view-applicants'(el) {
      const j = job(el.dataset.id); if (!j) return;
      const apps = db.applications.filter(a => a.jobId === j.id);
      openModal('Applicants – ' + j.title, apps.length ? `<div class="list">${apps.map(a => { const c = cand(a.candidateId); return c ? `<div class="list-item">${avatar(c.name)}<div class="grow"><b>${esc(shortName(c.name))}</b><p class="muted small">${esc(c.role)} · ${esc(c.experience)} yrs · ${esc(c.city)}</p></div>${docsSummary(c)} ${chip(a.status)}<button type="button" class="btn ghost sm" data-action="view-candidate" data-id="${c.id}">Profile</button></div>` : ''; }).join('')}</div><p class="muted small" style="margin-top:14px">Vision Transit checks every applicant's documents before confirming them to you.</p>` : empty('No applicants yet. We are promoting this job to matching candidates.'), true);
    },
    'view-client'(el) {
      const e = emp(el.dataset.id); if (!e) return;
      const inv = db.invoices.filter(i => i.clientId === e.id).sort((a, b) => b.issued.localeCompare(a.issued)).slice(0, 6);
      const upcoming = db.shifts.filter(s => s.clientId === e.id && s.status === 'Scheduled' && ms(s.start) > Date.now()).length;
      openModal(e.company, `<dl class="kv"><dt>Contact</dt><dd>${esc(e.contact)}</dd><dt>Email</dt><dd>${esc(e.email)}</dd><dt>Phone</dt><dd>${esc(e.phone)}</dd><dt>Sector</dt><dd>${esc(e.sector)}</dd><dt>Site</dt><dd>${esc(e.address)}</dd><dt>Credit limit</dt><dd>${money(e.creditLimit, 0)}</dd><dt>Upcoming shifts</dt><dd>${upcoming}</dd><dt>Client since</dt><dd>${fmtDate(e.createdAt)}</dd></dl>
        <h4 class="section-title">Recent invoices</h4>${invoiceTable(inv, true)}`, true);
    },
    apply(el) {
      const c = actor('candidate'), j = job(el.dataset.id);
      if (!c || !j || hasApplied(c, j.id)) return;
      db.applications.push({ id: uid('a'), jobId: j.id, candidateId: c.id, status: 'Pending', createdAt: new Date().toISOString() });
      log('Recruitment', 'Applied for ' + j.title);
      save(); closeModal();
      toast(compliant(c) ? 'Applied for ' + j.title : 'Applied. Finish your document checks so we can place you.', compliant(c) ? '' : 'warn');
      render();
    },
    'upload-doc'(el) {
      const t = el.dataset.type, needsExp = EXPIRY_TYPES.includes(t);
      openModal('Upload ' + DOC_TYPES[t], `<form class="form" data-form="upload-doc"><input type="hidden" name="type" value="${t}">
        <p class="muted">${esc(DOC_HINT[t])}</p>
        <label>File<input id="up-file" type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" required><span class="hint">PDF, JPG, PNG or Word · max 5 MB</span></label>
        ${needsExp ? `<label>Expiry date<input id="up-exp" type="date" name="expiry" ${t === 'rtw' ? '' : 'required'}><span class="hint">${t === 'rtw' ? 'Leave empty if it does not expire, for example a British passport or settled status.' : 'We will remind you before it runs out.'}</span></label>` : ''}
        <div class="form-actions"><button type="button" class="btn ghost" data-action="close-modal">Cancel</button><button class="btn primary">${ic('upload')}Upload</button></div></form>`);
    },
    clock(el) { const s = shiftById(el.dataset.id); if (!s) return; doClock(s, el.dataset.op); if (modalRoot.innerHTML) closeModal(); render(); },
    assign(el) {
      const s = shiftById(el.dataset.id), sel = document.querySelector(`[data-assign="${el.dataset.id}"]`);
      if (!s || !sel || !sel.value) return toast('Choose a worker first', 'error');
      const c = cand(sel.value);
      if (!compliant(c)) toast(c.name + ' still has document checks open', 'warn');
      s.candidateId = c.id;
      notify('candidate:' + c.id, 'New shift booked', s.role + ' at ' + s.site + ', ' + fmtDT(s.start) + '.');
      notify('employer:' + s.clientId, 'Shift filled', shortName(c.name) + ' will cover your ' + fmtDT(s.start) + ' shift.');
      log('Shifts', 'Assigned ' + c.name + ' to ' + employerName(s.clientId) + ' on ' + fmtDay(s.start));
      save(); toast(c.name + ' booked and notified'); render();
    },
    'cancel-shift'(el) {
      const s = shiftById(el.dataset.id); if (!s) return;
      s.status = 'Cancelled';
      if (s.candidateId) notify('candidate:' + s.candidateId, 'Shift cancelled', 'Your shift on ' + fmtDT(s.start) + ' at ' + s.site + ' has been cancelled.');
      log('Shifts', 'Cancelled shift on ' + fmtDay(s.start) + ' at ' + employerName(s.clientId));
      save(); closeModal(); toast('Shift cancelled'); render();
    },
    'ts-approve'(el) {
      const s = shiftById(el.dataset.id); if (!s) return;
      s.ts = 'Approved'; s.tsBy = curRole === 'employer' ? 'client' : 'admin';
      log('Timesheets', 'Approved timesheet for ' + candName(s.candidateId) + ' on ' + fmtDay(s.start));
      save(); toast('Timesheet approved'); render();
    },
    'approve-all'(el) {
      const list = db.shifts.filter(s => s.ts === 'Submitted' && (!el.dataset.client || s.clientId === el.dataset.client));
      list.forEach(s => { s.ts = 'Approved'; s.tsBy = curRole === 'employer' ? 'client' : 'admin'; });
      log('Timesheets', 'Approved ' + list.length + ' timesheets');
      save(); toast(list.length + ' timesheets approved'); render();
    },
    'ts-query'(el) {
      const s = shiftById(el.dataset.id); if (!s) return;
      openModal('Query timesheet', `<form class="form" data-form="ts-query"><input type="hidden" name="id" value="${s.id}">
        <p class="muted">${esc(candName(s.candidateId))} · ${fmtDay(s.start)} · ${fmtTime(s.clockIn)}–${fmtTime(s.clockOut)}</p>
        <label>What is wrong?<textarea id="tq-reason" name="reason" required placeholder="e.g. Worker left site at 15:30, not 16:10"></textarea></label>
        <div class="form-actions"><button type="button" class="btn ghost" data-action="close-modal">Cancel</button><button class="btn danger">Send query</button></div></form>`);
    },
    'ts-edit'(el) {
      const s = shiftById(el.dataset.id); if (!s) return;
      openModal('Edit timesheet', `<form class="form" data-form="ts-edit"><input type="hidden" name="id" value="${s.id}">
        <p class="muted">${esc(candName(s.candidateId))} · ${esc(employerName(s.clientId))} · booked ${fmtTime(s.start)}–${fmtTime(s.end)}</p>
        <div class="form-grid"><label>Clocked in<input id="te-in" type="datetime-local" name="clockIn" value="${dtLocal(s.clockIn)}" required></label><label>Clocked out<input id="te-out" type="datetime-local" name="clockOut" value="${dtLocal(s.clockOut)}" required></label>
        <label>Break (minutes)<input id="te-brk" type="number" min="0" max="240" name="breakMins" value="${s.breakMins}"></label>
        <label class="full">Reason for change<input id="te-reason" name="reason" required placeholder="e.g. Client confirmed finish time"></label></div>
        <div class="form-actions"><button type="button" class="btn ghost" data-action="close-modal">Cancel</button><button class="btn primary">Save</button></div></form>`);
    },
    'run-payroll'() {
      const ready = db.shifts.filter(s => s.clockOut && s.ts === 'Approved' && !s.payrunId && s.candidateId);
      if (!ready.length) return;
      const pid = uid('p'), byC = {};
      ready.forEach(s => { (byC[s.candidateId] = byC[s.candidateId] || []).push(s); s.payrunId = pid; });
      const lines = Object.keys(byC).map(cid => { const l = byC[cid], basic = round2(sum(l.map(payOf))), hol = round2(basic * db.settings.holidayPct / 100); return { candidateId: cid, shiftIds: l.map(s => s.id), hours: round2(sum(l.map(hoursOf))), basic, holiday: hol, gross: round2(basic + hol) }; });
      const run = { id: pid, date: dayKey(Date.now()), label: 'Weekly payroll – ' + fmtDate(Date.now()), workers: lines.length, hours: round2(sum(lines.map(l => l.hours))), basic: round2(sum(lines.map(l => l.basic))), holiday: round2(sum(lines.map(l => l.holiday))), gross: round2(sum(lines.map(l => l.gross))), lines, status: 'Paid' };
      db.payruns.push(run);
      lines.forEach(l => notify('candidate:' + l.candidateId, 'Payslip ready', 'You have been paid ' + money(l.gross) + ' gross for ' + hrs(l.hours) + ' hours. See My shifts & pay.'));
      log('Payroll', 'Ran payroll: ' + lines.length + ' workers, ' + money(run.gross) + ' gross');
      save(); toast('Payroll run: ' + money(run.gross) + ' to ' + lines.length + ' workers'); render();
    },
    'create-invoice'(el) {
      const eid = el.dataset.client;
      const list = db.shifts.filter(s => s.clockOut && s.ts === 'Approved' && !s.invoiceId && s.clientId === eid);
      if (!list.length) return;
      const set = db.settings, lines = linesFromShifts(list), net = round2(sum(lines.map(l => l.amount))), vat = round2(net * set.vatRate / 100);
      const first = Math.min(...list.map(s => ms(s.start))), last = Math.max(...list.map(s => ms(s.start)));
      const inv = { id: uid('i'), number: set.invoicePrefix + (set.nextInvoice++), clientId: eid, issued: dayKey(Date.now()), due: dayKey(Date.now() + set.paymentTerms * DAY), period: fmtDay(first) + ' – ' + fmtDay(last), lines, net, vatRate: set.vatRate, vat, total: round2(net + vat), status: 'Draft', paidAt: '', shiftIds: list.map(s => s.id) };
      db.invoices.push(inv);
      list.forEach(s => { s.invoiceId = inv.id; });
      log('Invoices', 'Created invoice ' + inv.number + ' for ' + employerName(eid) + ' (' + money(inv.total) + ')');
      save(); toast('Invoice ' + inv.number + ' created as draft'); render(); invoiceModal(inv.id);
    },
    'invoice-status'(el) {
      const i = invById(el.dataset.id); if (!i) return;
      i.status = el.dataset.status;
      if (i.status === 'Paid') i.paidAt = dayKey(Date.now());
      if (i.status === 'Sent') { i.issued = dayKey(Date.now()); i.due = dayKey(Date.now() + db.settings.paymentTerms * DAY); notify('employer:' + i.clientId, 'New invoice ' + i.number, money(i.total) + ' due on ' + fmtDate(i.due) + '.'); }
      log('Invoices', (i.status === 'Paid' ? 'Marked invoice paid: ' : 'Sent invoice ') + i.number);
      save(); closeModal(); toast(i.status === 'Paid' ? 'Payment recorded' : 'Invoice sent to ' + employerName(i.clientId)); render();
    },
    'add-expense'() {
      openModal('Add expense', `<form class="form" data-form="expense"><div class="form-grid">
        <label>Date<input id="ex-date" type="date" name="date" value="${dayKey(Date.now())}" required></label>
        <label>Category<select id="ex-cat" name="category" required>${opts(EXPENSE_CATS, 'Job advertising')}</select></label>
        <label class="full">Supplier<input id="ex-sup" name="supplier" required placeholder="e.g. Indeed, fuel card, accountants"></label>
        <label>Amount before VAT (${cur()})<input id="ex-net" type="number" step="0.01" min="0" name="net" required></label>
        <label>VAT rate<select id="ex-vat" name="vatRate">${opts([['20', '20% standard'], ['5', '5% reduced'], ['0', '0% / exempt']], '20')}</select></label>
        <label class="full">Receipt<input id="ex-rec" type="file" name="receipt" accept=".pdf,.jpg,.jpeg,.png"></label>
        <label class="full">Note<input id="ex-note" name="note" placeholder="Optional"></label>
      </div><div class="form-actions"><button type="button" class="btn ghost" data-action="close-modal">Cancel</button><button class="btn primary">Save expense</button></div></form>`);
    },
    'delete-expense'(el) {
      const x = db.expenses.find(e => e.id === el.dataset.id); if (!x) return;
      db.expenses = db.expenses.filter(e => e.id !== x.id);
      log('Finance', 'Deleted expense: ' + x.category + ' (' + x.supplier + ')');
      save(); toast('Expense deleted'); render();
    },
    'verify-doc'(el) {
      const c = cand(el.dataset.c), d = c && c.docs.find(x => x.id === el.dataset.d); if (!d) return;
      d.status = 'Verified'; d.note = '';
      notify('candidate:' + c.id, DOC_TYPES[d.type] + ' verified', compliant(c) ? 'All your documents are verified. You are ready to be placed.' : 'Thanks, this document has been checked and approved.');
      log('Compliance', 'Verified ' + DOC_TYPES[d.type] + ' for ' + c.name);
      save(); toast(DOC_TYPES[d.type] + ' verified for ' + c.name);
      if (el.dataset.reopen) candidateModal(c.id); else closeModal();
      render();
    },
    'reject-doc'(el) {
      const c = cand(el.dataset.c), d = c && c.docs.find(x => x.id === el.dataset.d); if (!d) return;
      openModal('Reject ' + DOC_TYPES[d.type], `<form class="form" data-form="reject-doc"><input type="hidden" name="cid" value="${c.id}"><input type="hidden" name="did" value="${d.id}">
        <p class="muted">${esc(c.name)} · ${esc(d.fileName)}</p>
        <label>Reason (sent to the candidate)<select id="rj-reason" name="reason">${opts(['Image is blurry or unreadable', 'Document has expired', 'Back of licence is missing. Please upload both sides.', 'Name does not match your profile', 'Wrong document type uploaded'], '')}</select></label>
        <div class="form-actions"><button type="button" class="btn ghost" data-action="close-modal">Cancel</button><button class="btn danger">Reject document</button></div></form>`);
    },
    'remind-doc'(el) {
      const c = cand(el.dataset.c), t = el.dataset.type; if (!c) return;
      notify('candidate:' + c.id, 'Please update your ' + DOC_TYPES[t].toLowerCase(), 'Upload the new document in the app so we can keep booking you.');
      log('Compliance', 'Sent reminder to ' + c.name + ' about ' + DOC_TYPES[t]);
      save(); toast('Reminder sent to ' + c.name);
    },
    'app-status'(el) {
      const a = db.applications.find(x => x.id === el.dataset.id); if (!a) return;
      const c = cand(a.candidateId), j = job(a.jobId);
      if (el.dataset.status === 'Approved' && c && !compliant(c)) toast(c.name + ' still has document checks open', 'warn');
      a.status = el.dataset.status;
      if (a.status === 'Approved') {
        notify('candidate:' + a.candidateId, 'You got the job', 'You have been approved for ' + (j ? j.title : 'the job') + '. Our team will call you with start details.');
        if (j && j.employerId && c) notify('employer:' + j.employerId, 'Candidate confirmed', shortName(c.name) + ' has been approved for ' + j.title + '.');
      } else notify('candidate:' + a.candidateId, 'Application update', 'Thank you for applying for ' + (j ? j.title : 'the job') + '. This time you have not been successful.');
      log('Recruitment', a.status + ' application from ' + (c ? c.name : 'candidate') + ' for ' + (j ? j.title : 'job'));
      save(); toast('Application ' + a.status.toLowerCase()); render();
    },
    'app-interview'(el) {
      const a = db.applications.find(x => x.id === el.dataset.id); if (!a) return;
      openModal('Book interview', `<form class="form" data-form="interview"><input type="hidden" name="appId" value="${a.id}">
        <p class="muted">${esc(candName(a.candidateId))} · ${esc((job(a.jobId) || {}).title || '')}</p>
        <label>Date and time<input id="iv-when" type="datetime-local" name="when" value="${dtLocal(Date.now() + 2 * DAY).slice(0, 11)}10:00" required></label>
        <label>Location and instructions<textarea id="iv-note" name="note" placeholder="e.g. Assessment drive at the depot. Bring licence and CPC card."></textarea></label>
        <div class="form-actions"><button type="button" class="btn ghost" data-action="close-modal">Cancel</button><button class="btn primary">Book and notify</button></div></form>`);
    },
    'job-status'(el) {
      const j = job(el.dataset.id); if (!j) return;
      const was = j.status; j.status = el.dataset.status;
      if (was === 'Pending approval' && j.status === 'Open') { if (j.employerId) notify('employer:' + j.employerId, 'Job approved', '"' + j.title + '" is now live to candidates.'); notify('all-candidates', 'New job: ' + j.title, j.location + ' · ' + j.pay + ' · ' + j.type); }
      if (j.status === 'Rejected' && j.employerId) notify('employer:' + j.employerId, 'Job not approved', '"' + j.title + '" needs changes. Our team will contact you.');
      log('Jobs', j.status + ': ' + j.title);
      save(); toast('Job ' + (j.status === 'Open' ? (was === 'Closed' ? 'reopened' : 'is live') : j.status.toLowerCase())); render();
    },
    'client-status'(el) {
      const e = emp(el.dataset.id); if (!e) return;
      e.status = el.dataset.status;
      notify('employer:' + e.id, 'Account ' + e.status.toLowerCase(), e.status === 'Approved' ? 'Your company account is approved.' : 'Your account has been suspended. Please contact Vision Transit.');
      log('Clients', e.status + ': ' + e.company);
      save(); toast(e.company + ' ' + e.status.toLowerCase()); render();
    },
    'cand-status'(el) {
      const c = cand(el.dataset.id); if (!c) return;
      c.status = c.status === 'Active' ? 'Suspended' : 'Active';
      log('Candidates', (c.status === 'Active' ? 'Reactivated ' : 'Suspended ') + c.name);
      save(); toast(c.name + (c.status === 'Active' ? ' reactivated' : ' suspended')); candidateModal(c.id); render();
    },
    'message-cand'(el) {
      closeModal(); go('#/admin/notify');
      setTimeout(() => { const s = document.getElementById('nt-to'); if (s) s.value = 'candidate:' + el.dataset.id; const t = document.getElementById('nt-title'); if (t) t.focus(); }, 30);
    },
    tpl(el) {
      const t = TEMPLATES[Number(el.dataset.i)]; if (!t) return;
      document.getElementById('nt-to').value = t[1]; document.getElementById('nt-title').value = t[2]; document.getElementById('nt-body').value = t[3];
    },
    invite() {
      openModal('Add team member', `<form class="form" data-form="invite"><div class="form-grid">
        <label class="full">Full name<input id="iv-name" name="name" required></label>
        <label>Email<input id="iv-email" type="email" name="email" required></label>
        <label>Role<select id="iv-role" name="role">${opts(TEAM_ROLES, 'Recruitment consultant')}</select></label></div>
        <div class="form-actions"><button type="button" class="btn ghost" data-action="close-modal">Cancel</button><button class="btn primary">Send invitation</button></div></form>`);
    },
    'toggle-dubai'(el) {
      db.settings.dubaiEnabled = el.checked;
      log('Settings', 'Dubai branch ' + (el.checked ? 'shown as opening soon' : 'set back to planned'));
      save(); toast(el.checked ? 'Dubai now shows as opening soon' : 'Dubai set back to planned');
    },
    export(el) {
      const w = el.dataset.what; let rows;
      if (w === 'candidates') rows = [['Name', 'Email', 'Phone', 'Role', 'City', 'Postcode', 'Experience', 'Checks', 'Availability', 'Status']].concat(db.candidates.map(c => [c.name, c.email, c.phone, c.role, c.city, c.postcode, c.experience, verifiedCount(c) + '/' + requiredDocs(c).length, c.availability.status, c.status]));
      else if (w === 'applications') rows = [['Candidate', 'Job', 'Client', 'Status', 'Applied']].concat(db.applications.map(a => { const j = job(a.jobId) || {}; return [candName(a.candidateId), j.title, employerName(j.employerId), a.status, fmtDate(a.createdAt)]; }));
      else if (w === 'jobs') rows = [['Title', 'Category', 'Client', 'Location', 'Type', 'Pay', 'Positions', 'Status']].concat(db.jobs.map(j => [j.title, j.category, employerName(j.employerId), j.location, j.type, j.pay, j.positions, j.status]));
      else if (w === 'timesheets') rows = [['Worker', 'Client', 'Date', 'Clock in', 'Clock out', 'Break (min)', 'Hours', 'Pay rate', 'Gross pay', 'Charge rate', 'Charge', 'Status']].concat(db.shifts.filter(s => s.clockOut).map(s => [candName(s.candidateId), employerName(s.clientId), dayKey(s.start), fmtTime(s.clockIn), fmtTime(s.clockOut), s.breakMins, hrs(hoursOf(s)), s.payRate, grossOf(s), s.chargeRate, chargeOf(s), s.ts]));
      else if (w === 'invoices') rows = [['Number', 'Client', 'Period', 'Issued', 'Due', 'Net', 'VAT', 'Total', 'Status']].concat(db.invoices.map(i => [i.number, employerName(i.clientId), i.period, i.issued, i.due, i.net, i.vat, i.total, invState(i)]));
      else rows = [['Date', 'Category', 'Supplier', 'Net', 'VAT', 'Total', 'Note']].concat(db.expenses.map(x => [x.date, x.category, x.supplier, x.net, x.vat, round2(x.net + x.vat), x.note]));
      const csv = '﻿' + rows.map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
      try {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = 'vision-transit-' + w + '.csv';
        document.body.appendChild(a); a.click(); a.remove();
        toast('Downloading ' + w + '.csv');
      } catch (e) { toast('Downloads are blocked in this preview. Open index.html directly to export.', 'warn'); }
    },
    'reset-demo'() {
      openModal('Reset demo data', `<p>This removes everything added during the demo and puts back the sample candidates, clients, shifts and invoices.</p><div class="form-actions" style="margin-top:18px"><button type="button" class="btn ghost" data-action="close-modal">Cancel</button><button type="button" class="btn danger" data-action="reset-confirm">Reset</button></div>`);
    },
    'reset-confirm'() { db = seed(); save(); closeModal(); toast('Demo data reset'); go('#/'); }
  };

  /* ================= Events ================= */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = ACTIONS[el.dataset.action];
    if (!fn) return;
    if (el.tagName === 'BUTTON') e.preventDefault();
    fn(el, e);
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('form[data-form]');
    if (!f) return;
    e.preventDefault();
    const fd = new FormData(f), d = {};
    fd.forEach((v, k) => { if (typeof v === 'string') d[k] = v; });
    const fn = FORMS[f.dataset.form];
    if (fn) fn(d, f, fd);
  });
  document.addEventListener('input', e => {
    const el = e.target.closest('[data-filter]');
    if (!el) return;
    const [k1, k2] = el.dataset.filter.split('.');
    if (ui[k1][k2] === el.value) return;
    ui[k1][k2] = el.value;
    ui.focus = { key: el.dataset.filter, pos: el.selectionStart };
    render();
  });
  document.addEventListener('change', e => {
    const bk = e.target.closest('select[data-booking]');
    if (bk) {
      const b = db.bookings.find(x => x.id === bk.dataset.booking); if (!b) return;
      b.status = bk.value;
      notify('employer:' + b.employerId, 'Staff request ' + b.status.toLowerCase(), b.qty + ' × ' + b.role + ' starting ' + fmtDate(b.start) + ' is now ' + b.status.toLowerCase() + '.');
      log('Clients', 'Staff request from ' + employerName(b.employerId) + ' marked ' + b.status.toLowerCase());
      save(); toast('Request marked ' + b.status.toLowerCase()); render(); return;
    }
    const tr = e.target.closest('select[data-team-role]');
    if (tr) { const t = db.team.find(x => x.id === tr.dataset.teamRole); if (t) { t.role = tr.value; log('Team', t.name + ' is now ' + t.role); save(); toast(t.name + ' is now ' + t.role); } return; }
    const pm = e.target.closest('input[data-perm]');
    if (pm) {
      const [r, f] = pm.dataset.perm.split('|');
      const list = db.perms[r] = db.perms[r] || [];
      if (pm.checked && !list.includes(f)) list.push(f);
      if (!pm.checked) db.perms[r] = list.filter(x => x !== f);
      log('Team', (pm.checked ? 'Gave ' : 'Removed ') + r + (pm.checked ? ' access to ' : ' access from ') + f);
      save(); toast('Access updated');
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modalRoot.innerHTML) closeModal(); });

  /* Live timers */
  function tick() {
    const now = Date.now();
    document.querySelectorAll('[data-since]').forEach(el => { const t = ms(el.dataset.since); if (!isNaN(t)) el.textContent = el.dataset.short ? durShort(now - t) : dur(now - t); });
    document.querySelectorAll('[data-countdown]').forEach(el => { el.textContent = countdown(el.dataset.countdown); });
    document.querySelectorAll('[data-clock]').forEach(el => {
      const d = new Date();
      el.textContent = el.dataset.clock === 'full' ? d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('en-GB') : d.toLocaleTimeString('en-GB');
    });
  }
  setInterval(tick, 1000);
  setInterval(() => {
    const a = document.activeElement;
    if (modalRoot.innerHTML || (a && /INPUT|SELECT|TEXTAREA/.test(a.tagName))) return;
    if (curRole) { autoClose(); render(); }
  }, 30000);

  /* ================= Router ================= */
  const VIEWS = { candidate: CANDIDATE, employer: EMPLOYER, admin: ADMIN };
  function render() {
    const parts = (location.hash || '#/').replace(/^#\/?/, '').split('/');
    const role = parts[0] || '', sec = parts[1] || '';
    let html;
    if (VIEWS[role]) {
      const view = VIEWS[role][sec];
      if (!view) { location.hash = '#/' + role + '/' + HOME[role]; return; }
      curRole = role;
      html = shell(role, sec, view(actor(role)));
    } else {
      curRole = null;
      html = landingView();
    }
    const y = window.scrollY;
    app.innerHTML = html;
    document.body.classList.remove('nav-open');
    if (location.hash !== lastHash) { window.scrollTo(0, 0); lastHash = location.hash; } else window.scrollTo(0, y);
    tick();
    if (ui.focus) {
      const el = app.querySelector(`[data-filter="${ui.focus.key}"]`);
      if (el) { el.focus(); if (el.setSelectionRange && ui.focus.pos != null) { try { el.setSelectionRange(ui.focus.pos, ui.focus.pos); } catch (e) { /* not a text field */ } } }
      ui.focus = null;
    }
  }
  window.addEventListener('hashchange', () => { closeModal(); render(); });
  autoClose();
  render();
})();
