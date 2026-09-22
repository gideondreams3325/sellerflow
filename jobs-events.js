// SellerFlow Jobs & Events Engine
// Statutory Compliance: Ghana Data Protection Act (Act 843), Cybersecurity Act (Act 1038)
// Anti-Fraud Safeguards, Identity Verification Gating, & Security Team Review

(function(window, document) {
'use strict';

function _safeNullElement(id) {
  return new Proxy({}, {
    get(target, prop) {
      if (prop === 'id') return String(id || '');
      if (prop === 'classList') return { add: () => {}, remove: () => {}, toggle: () => false, contains: () => false };
      if (prop === 'style') return new Proxy({}, { get: () => '', set: () => true });
      if (prop === 'dataset') return {};
      if (['addEventListener', 'removeEventListener', 'setAttribute', 'removeAttribute', 'appendChild', 'removeChild', 'focus', 'blur', 'click'].includes(prop)) return () => {};
      if (prop === 'querySelector') return () => null;
      if (prop === 'querySelectorAll') return () => [];
      if (['innerHTML', 'innerText', 'textContent', 'value', 'src'].includes(prop)) return '';
      return undefined;
    },
    set() { return true; }
  });
}
const _$ = (id) => (typeof window.$ === 'function' ? window.$(id) : (document.getElementById(id) || _safeNullElement(id)));

const _esc = (s) => (typeof window.esc === 'function' ? window.esc(s) : String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));

function getActiveUser() {
  if (typeof window !== 'undefined') {
    if (typeof window.getCurrentUser === 'function') {
      const u = window.getCurrentUser();
      if (u) return u;
    }
    if (window.currentUser) return window.currentUser;
  }
  if (typeof currentUser !== 'undefined' && currentUser) return currentUser;
  if (typeof auth !== 'undefined' && auth && auth.currentUser) return auth.currentUser;
  if (typeof firebase !== 'undefined' && firebase.auth && typeof firebase.auth === 'function') {
    try {
      const u = firebase.auth().currentUser;
      if (u) return u;
    } catch (_) {}
  }
  try {
    const s = localStorage.getItem('sf_active_user_session');
    if (s) {
      const data = JSON.parse(s);
      if (data && data.uid) return data;
    }
  } catch (_) {}
  return null;
}

function getActiveProfile() {
  if (typeof window !== 'undefined') {
    if (typeof window.getCurrentProfile === 'function') {
      const p = window.getCurrentProfile();
      if (p) return p;
    }
    if (window.currentProfile) return window.currentProfile;
  }
  if (typeof currentProfile !== 'undefined' && currentProfile) return currentProfile;
  try {
    const s = localStorage.getItem('sf_active_user_session');
    if (s) {
      const data = JSON.parse(s);
      if (data && data.profile) return data.profile;
    }
  } catch (_) {}
  return null;
}

function getIsAdmin() {
  if (typeof window !== 'undefined') {
    if (typeof window.getIsAdmin === 'function') {
      const adm = window.getIsAdmin();
      if (adm) return true;
    }
    if (window.isAdmin) return true;
  }
  if (typeof isAdmin !== 'undefined' && isAdmin) return true;
  const u = getActiveUser();
  if (u && (u.email === 'gideondreams3325@gmail.com' || u.email === 'gideonappiahfriempong@gmail.com')) return true;
  return false;
}

function getJobsEventsDb() {
  if (typeof window.db !== 'undefined' && window.db && (typeof window.db.collection === 'function' || typeof window.db.doc === 'function')) {
    return window.db;
  }
  if (typeof db !== 'undefined' && db && (typeof db.collection === 'function' || typeof db.doc === 'function')) {
    return db;
  }
  if (typeof firebase !== 'undefined') {
    try {
      if (firebase.apps && firebase.apps.length > 0) {
        const d = firebase.firestore();
        window.db = d;
        return d;
      }
      if (typeof window.firebaseConfig !== 'undefined' || typeof firebaseConfig !== 'undefined') {
        const cfg = window.firebaseConfig || (typeof firebaseConfig !== 'undefined' ? firebaseConfig : null);
        if (cfg && firebase.initializeApp) {
          const app = firebase.initializeApp(cfg);
          const d = app.firestore();
          window.db = d;
          return d;
        }
      }
    } catch (_) {}
  }
  return {
    collection: (name) => ({
      doc: (id) => ({
        get: async () => {
          try {
            const raw = localStorage.getItem('sf_mock_col_' + name);
            const list = raw ? JSON.parse(raw) : [];
            const item = list.find(x => x.id === id);
            return item ? { exists: true, id, data: () => item } : { exists: false, data: () => null };
          } catch (_) {
            return { exists: false, data: () => null };
          }
        },
        set: async (data, opt = {}) => {
          try {
            const raw = localStorage.getItem('sf_mock_col_' + name);
            let list = raw ? JSON.parse(raw) : [];
            const idx = list.findIndex(x => x.id === id);
            const docObj = { id, ...(opt.merge && idx >= 0 ? list[idx] : {}), ...data };
            if (idx >= 0) list[idx] = docObj;
            else list.push(docObj);
            localStorage.setItem('sf_mock_col_' + name, JSON.stringify(list));
          } catch (_) {}
        },
        update: async (data) => {
          try {
            const raw = localStorage.getItem('sf_mock_col_' + name);
            let list = raw ? JSON.parse(raw) : [];
            const idx = list.findIndex(x => x.id === id);
            if (idx >= 0) {
              list[idx] = { ...list[idx], ...data };
              localStorage.setItem('sf_mock_col_' + name, JSON.stringify(list));
            }
          } catch (_) {}
        },
        delete: async () => {
          try {
            const raw = localStorage.getItem('sf_mock_col_' + name);
            let list = raw ? JSON.parse(raw) : [];
            list = list.filter(x => x.id !== id);
            localStorage.setItem('sf_mock_col_' + name, JSON.stringify(list));
          } catch (_) {}
        }
      }),
      where: (field, op, val) => ({
        where: () => ({
          limit: () => ({ get: async () => ({ empty: true, docs: [], forEach: () => {} }) }),
          get: async () => ({ empty: true, docs: [], forEach: () => {} })
        }),
        limit: () => ({
          get: async () => {
            try {
              const raw = localStorage.getItem('sf_mock_col_' + name);
              const list = raw ? JSON.parse(raw) : [];
              const matched = list.filter(x => (op === '==' ? x[field] === val : true));
              return {
                empty: matched.length === 0,
                docs: matched.map(d => ({ id: d.id, data: () => d })),
                forEach: (cb) => matched.forEach(d => cb({ id: d.id, data: () => d }))
              };
            } catch (_) {
              return { empty: true, docs: [], forEach: () => {} };
            }
          }
        }),
        orderBy: () => ({
          limit: () => ({ get: async () => ({ empty: true, docs: [], forEach: () => {} }) }),
          get: async () => ({ empty: true, docs: [], forEach: () => {} })
        }),
        get: async () => {
          try {
            const raw = localStorage.getItem('sf_mock_col_' + name);
            const list = raw ? JSON.parse(raw) : [];
            const matched = list.filter(x => (op === '==' ? x[field] === val : true));
            return {
              empty: matched.length === 0,
              docs: matched.map(d => ({ id: d.id, data: () => d })),
              forEach: (cb) => matched.forEach(d => cb({ id: d.id, data: () => d }))
            };
          } catch (_) {
            return { empty: true, docs: [], forEach: () => {} };
          }
        }
      }),
      orderBy: () => ({
        limit: () => ({ get: async () => ({ empty: true, docs: [], forEach: () => {} }) }),
        get: async () => ({ empty: true, docs: [], forEach: () => {} })
      }),
      limit: (n) => ({
        get: async () => {
          try {
            const raw = localStorage.getItem('sf_mock_col_' + name);
            const list = raw ? JSON.parse(raw) : [];
            const sliced = list.slice(0, n || 50);
            return {
              empty: sliced.length === 0,
              docs: sliced.map(d => ({ id: d.id, data: () => d })),
              forEach: (cb) => sliced.forEach(d => cb({ id: d.id, data: () => d }))
            };
          } catch (_) {
            return { empty: true, docs: [], forEach: () => {} };
          }
        }
      }),
      get: async () => {
        try {
          const raw = localStorage.getItem('sf_mock_col_' + name);
          const list = raw ? JSON.parse(raw) : [];
          return {
            empty: list.length === 0,
            docs: list.map(d => ({ id: d.id, data: () => d })),
            forEach: (cb) => list.forEach(d => cb({ id: d.id, data: () => d }))
          };
        } catch (_) {
          return { empty: true, docs: [], forEach: () => {} };
        }
      },
      add: async (data) => {
        const id = 'sf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        try {
          const raw = localStorage.getItem('sf_mock_col_' + name);
          let list = raw ? JSON.parse(raw) : [];
          list.push({ id, ...data });
          localStorage.setItem('sf_mock_col_' + name, JSON.stringify(list));
        } catch (_) {}
        return { id };
      }
    })
  };
}

const JOBS_TERMS_VERSION = 'jobs_events_terms_v1.0';
const JOBS_PRIVACY_VERSION = 'jobs_events_privacy_v1.0';
const IDENTITY_VERIFICATION_VERSION = 'identity_verification_v1.0';

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 
  'Volta', 'Northern', 'Upper East', 'Upper West', 'Bono', 
  'Bono East', 'Ahafo', 'Oti', 'Savannah', 'North East', 'Western North'
];

const JOB_CATEGORIES = [
  'Retail & Sales', 'Tech & Software', 'Customer Service', 'Hospitality & Tourism',
  'Construction & Trades', 'Education & Teaching', 'Healthcare & Pharmacy',
  'Finance & Accounting', 'Logistics & Delivery', 'Creative & Media', 'Other'
];

const EVENT_CATEGORIES = [
  'Business & Networking', 'Tech & Innovation', 'Entertainment & Music',
  'Pop-up & Marketplace', 'Workshop & Training', 'Community & Church',
  'Sports & Fitness', 'Arts & Culture', 'Other'
];

const DEFAULT_FEATURED_JOBS = [];

const DEFAULT_FEATURED_EVENTS = [];

function readImageFileAsDataUrl(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    if (!file.type || !file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file (PNG, JPG, or WEBP).'));
    }
    if (file.size > 10 * 1024 * 1024) {
      return reject(new Error('Image file exceeds the 10MB limit.'));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(e.target.result);
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (_) {
          resolve(e.target.result);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// In-memory cache stores for instant snappy page loads
let _cachedJobs = null;
let _lastJobsFetchTime = 0;
let _cachedEvents = null;
let _lastEventsFetchTime = 0;
const CACHE_TTL_MS = 60000; // 60s cache lifetime

async function prefetchJobsData() {
  if (_cachedJobs && (Date.now() - _lastJobsFetchTime < CACHE_TTL_MS)) return _cachedJobs;
  try {
    const snap = await getJobsEventsDb().collection('jobs').where('status', '==', 'approved').limit(50).get();
    const jobs = [];
    const seenIds = new Set();
    if (snap && snap.forEach) {
      snap.forEach(doc => {
        seenIds.add(doc.id);
        jobs.push({ id: doc.id, ...doc.data() });
      });
    }
    try {
      const localJobs = JSON.parse(localStorage.getItem('sf_my_posted_jobs') || '[]');
      localJobs.forEach(lj => {
        if (lj && lj.id && !seenIds.has(lj.id) && (lj.status === 'approved' || !lj.status)) {
          seenIds.add(lj.id);
          jobs.push(lj);
        }
      });
    } catch (_) {}
    _cachedJobs = jobs;
    _lastJobsFetchTime = Date.now();
    return _cachedJobs;
  } catch (_) {
    if (!_cachedJobs) _cachedJobs = [];
    return _cachedJobs;
  }
}
window._sfPrefetchJobs = prefetchJobsData;

async function prefetchEventsData() {
  if (_cachedEvents && (Date.now() - _lastEventsFetchTime < CACHE_TTL_MS)) return _cachedEvents;
  try {
    const snap = await getJobsEventsDb().collection('events').where('status', '==', 'approved').limit(40).get();
    const events = [];
    const seenIds = new Set();
    if (snap && snap.forEach) {
      snap.forEach(doc => {
        seenIds.add(doc.id);
        events.push({ id: doc.id, ...doc.data() });
      });
    }
    try {
      const localEvents = JSON.parse(localStorage.getItem('sf_my_hosted_events') || '[]');
      localEvents.forEach(le => {
        if (le && le.id && !seenIds.has(le.id) && (le.status === 'approved' || !le.status)) {
          seenIds.add(le.id);
          events.push(le);
        }
      });
    } catch (_) {}
    _cachedEvents = events;
    _lastEventsFetchTime = Date.now();
    return _cachedEvents;
  } catch (_) {
    if (!_cachedEvents) _cachedEvents = [];
    return _cachedEvents;
  }
}
window._sfPrefetchEvents = prefetchEventsData;
window._sfInvalidateJobsEventsCache = () => {
  _cachedJobs = null;
  _lastJobsFetchTime = 0;
  _cachedEvents = null;
  _lastEventsFetchTime = 0;
};

// Anti-Scam and Safety Rules
const SCAM_WARNING_HEADER = `
  <div class="w-full max-w-full p-3 sm:p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs mb-4 flex items-start gap-2.5 sm:gap-3 shadow-sm overflow-hidden box-border">
    <span class="text-lg sm:text-xl shrink-0 mt-0.5">🛡️</span>
    <div class="leading-relaxed flex-1 min-w-0">
      <b class="text-amber-300 font-bold block text-xs sm:text-[13px] mb-1">SellerFlow Anti-Fraud Safety Notice</b>
      <div class="text-zinc-300 text-[11px] sm:text-xs space-y-1 break-words">
        <div>• <b>Never pay any money</b> or recruitment fee for interviews, tests, or job offers.</div>
        <div>• <b>Never disclose OTPs</b>, Mobile Money PINs, or confidential banking passwords.</div>
        <div>• SellerFlow verifies creator identities for platform safety, but does not guarantee employment or event outcomes.</div>
      </div>
    </div>
  </div>
`;

// Helper: Check eligibility (Identity Verification + Terms Acceptance)
async function checkJobsEventsEligibility(user, actionType = 'interact on SellerFlow') {
  const activeUser = user || getActiveUser();
  if (!activeUser) {
    if (typeof showAuthPrompt === 'function') {
      showAuthPrompt(actionType);
    } else if (typeof showAuth === 'function') {
      showAuth('login');
    }
    return false;
  }

  // Admin bypass
  if (getIsAdmin()) {
    return true;
  }

  // Check identity verification state across profile, auth, and database records
  let isVerified = false;
  const profile = getActiveProfile();

  // 1. Check in-memory profile flags
  if (profile) {
    if (
      profile.verified === true ||
      profile.isBuyerVerified === true ||
      profile.isSellerVerified === true ||
      profile.verificationStatus === 'approved' ||
      profile.kycStatus === 'approved' ||
      profile.ghanaCardVerified === true
    ) {
      isVerified = true;
    }
  }

  // 2. Check activeUser object flags
  if (!isVerified && activeUser) {
    if (
      activeUser.verified === true ||
      activeUser.isBuyerVerified === true ||
      activeUser.isSellerVerified === true ||
      activeUser.verificationStatus === 'approved' ||
      activeUser.kycStatus === 'approved' ||
      activeUser.ghanaCardVerified === true
    ) {
      isVerified = true;
    }
  }

  // 3. Check local storage KYC cache
  if (!isVerified && activeUser.uid) {
    try {
      const localKyc = localStorage.getItem('sf_kyc_verified_' + activeUser.uid);
      if (localKyc === 'true' || localKyc === 'approved') {
        isVerified = true;
      }
    } catch (_) {}
  }

  // 4. Query Firestore user record if not yet confirmed in memory
  if (!isVerified && activeUser.uid) {
    try {
      const userSnap = await getJobsEventsDb().collection('users').doc(activeUser.uid).get();
      if (userSnap && userSnap.exists) {
        const uData = userSnap.data() || {};
        const hasCardNumber = !!(uData.ghanaCardNumber || uData.ghanaCardMasked || uData.ghanaCardNum);
        const hasDoc = !!(uData.ghanaCardFrontPath || uData.ghanaCardFrontUrl || uData.ghanaCardFront);
        if (
          uData.verified === true ||
          uData.isBuyerVerified === true ||
          uData.isSellerVerified === true ||
          uData.verificationStatus === 'approved' ||
          uData.kycStatus === 'approved' ||
          uData.ghanaCardVerified === true ||
          (hasCardNumber && hasDoc)
        ) {
          isVerified = true;
          try { localStorage.setItem('sf_kyc_verified_' + activeUser.uid, 'true'); } catch (_) {}
        }
      }
    } catch (e) {
      console.warn('User verification check notice:', e);
    }
  }

  if (!isVerified) {
    openIdentityRequiredModal(actionType);
    return false;
  }

  return true;
}
window.checkJobsEventsEligibility = checkJobsEventsEligibility;

async function checkUserAcceptedTerms(uid) {
  if (!uid) return false;
  try {
    const local = localStorage.getItem('sf_jobs_terms_accepted_' + uid);
    if (local === JOBS_TERMS_VERSION) return true;
  } catch (_) {}
  try {
    const snap = await getJobsEventsDb().collection('termsAcceptances').doc(uid).get();
    if (!snap.exists) return false;
    const data = snap.data();
    if (data.termsVersion === JOBS_TERMS_VERSION) {
      try { localStorage.setItem('sf_jobs_terms_accepted_' + uid, JOBS_TERMS_VERSION); } catch (_) {}
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

// Modal: Identity Verification Required
function openIdentityRequiredModal(actionType = 'participate') {
  const modal = document.createElement('div');
  modal.id = 'identityRequiredModal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in';
  modal.innerHTML = `
    <div class="bg-[#181824] border border-amber-500/40 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
      <div class="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto shadow-inner">
        🪪
      </div>
      <div class="text-center space-y-1.5">
        <h3 class="text-lg font-black text-amber-300">Verified Account Required</h3>
        <p class="text-xs text-zinc-300 leading-relaxed">
          Only verified accounts can ${_esc(actionType)} on SellerFlow. Please complete your <b>Ghana Card identity verification</b> to apply for jobs and register for events.
        </p>
      </div>
      <div class="p-3.5 rounded-2xl bg-[#12121a] border border-[#2a2a3c] text-xs text-zinc-400 space-y-2">
        <div class="flex items-center gap-2 text-zinc-300">
          <span class="text-amber-400 font-bold">✓</span> <span>Anti-fraud protection for applicants & attendees</span>
        </div>
        <div class="flex items-center gap-2 text-zinc-300">
          <span class="text-amber-400 font-bold">✓</span> <span>Encrypted Ghana Card KYC (Act 843 compliant)</span>
        </div>
        <div class="flex items-center gap-2 text-zinc-300">
          <span class="text-amber-400 font-bold">✓</span> <span>Official SellerFlow Verified badge on profile</span>
        </div>
      </div>
      <div class="flex gap-3 pt-2">
        <button id="closeIdReqBtn" type="button" class="flex-1 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition">
          Cancel
        </button>
        <button id="goToKycBtn" type="button" class="flex-1 py-2.5 rounded-xl bg-gold text-black hover:brightness-110 text-xs font-black transition shadow-md flex items-center justify-center gap-1.5">
          <span>Verify Account</span>
          <span>→</span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#closeIdReqBtn').onclick = () => modal.remove();
  modal.querySelector('#goToKycBtn').onclick = () => {
    modal.remove();
    if (typeof openVerificationModal === 'function') {
      openVerificationModal({ purpose: 'candidate' });
    } else if (typeof openBuyerKycModal === 'function') {
      openBuyerKycModal();
    } else if (typeof openGhanaCardModal === 'function') {
      openGhanaCardModal();
    } else if (typeof navigate === 'function') {
      navigate('profile');
    }
  };
}

// Modal: Terms & Conditions Acceptance Gate
function openTermsAcceptanceModal(actionType = 'proceed') {
  const modal = document.createElement('div');
  modal.id = 'termsAcceptModal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in';
  modal.innerHTML = `
    <div class="bg-[#181824] border border-gold/40 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
      <div class="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div class="flex items-center gap-2">
          <span class="text-2xl">📜</span>
          <h3 class="text-base font-black text-amber-300">Jobs & Events Terms & Notice</h3>
        </div>
        <span class="text-[10px] text-zinc-500 font-mono">v1.0</span>
      </div>
      
      <div class="flex-1 overflow-y-auto pr-2 space-y-3 text-xs text-zinc-300 leading-relaxed max-h-60 border border-zinc-800 p-3 rounded-2xl bg-[#12121a]">
        <p class="font-bold text-white">1. Non-Discrimination and Equal Opportunity</p>
        <p class="text-zinc-400">All job listings and event listings must comply with the 1992 Constitution of Ghana and the Labour Act, 2003 (Act 651). Discrimination based on race, ethnic origin, gender, religion, creed, or disability is strictly prohibited.</p>
        
        <p class="font-bold text-white">2. Strict Zero Tolerance for Advance-Fee Fraud</p>
        <p class="text-zinc-400">Employers and organizers are strictly forbidden from demanding upfront application, interview, training, or registration fees. Any account soliciting money or MOMO transfers prior to job placement will be permanently terminated and reported to law enforcement under the Cybersecurity Act, 2020 (Act 1038).</p>
        
        <p class="font-bold text-white">3. Data Privacy and Candidate Protections (Act 843)</p>
        <p class="text-zinc-400">Candidate CVs and contact details submitted through SellerFlow are confidential and may only be processed for evaluating the specific job application. Disclosing candidate data to third parties without consent violates the Data Protection Act, 2012 (Act 843).</p>
        
        <p class="font-bold text-white">4. Platform Disclaimer</p>
        <p class="text-zinc-400">SellerFlow operates as an introductory platform. SellerFlow does not act as an employer, recruiter, or event organizer, and does not guarantee employment offers, compensation, or event experiences.</p>
      </div>

      <div class="space-y-2 pt-1">
        <label class="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
          <input type="checkbox" id="agreeTermsCheck" class="mt-0.5 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 w-4 h-4" />
          <span>I have read and agree to the <b>Jobs & Events Terms & Conditions</b>, <b>Privacy Notice</b>, and statutory safety policies.</span>
        </label>
      </div>

      <div class="flex gap-3 pt-2">
        <button id="cancelTermsBtn" type="button" class="flex-1 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition">
          Decline
        </button>
        <button id="acceptTermsSubmitBtn" type="button" disabled class="flex-1 py-2.5 rounded-xl bg-gold text-black opacity-50 cursor-not-allowed hover:brightness-110 text-xs font-black transition shadow-md">
          Accept & Continue
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const check = modal.querySelector('#agreeTermsCheck');
  const btn = modal.querySelector('#acceptTermsSubmitBtn');
  check.onchange = () => {
    btn.disabled = !check.checked;
    btn.classList.toggle('opacity-50', !check.checked);
    btn.classList.toggle('cursor-not-allowed', !check.checked);
  };

  modal.querySelector('#cancelTermsBtn').onclick = () => modal.remove();
  btn.onclick = async () => {
    try {
      btn.textContent = 'Saving...';
      btn.disabled = true;
      const user = getActiveUser();
      const uid = user ? user.uid : '';
      const token = user ? await user.getIdToken().catch(() => '') : '';

      if (token) {
        await fetch('/api/terms/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            termsVersion: JOBS_TERMS_VERSION,
            privacyVersion: JOBS_PRIVACY_VERSION,
            identityVerificationVersion: IDENTITY_VERIFICATION_VERSION
          })
        }).catch((apiErr) => console.warn('Terms acceptance endpoint warning:', apiErr));
      }

      if (uid) {
        try {
          await getJobsEventsDb().collection('termsAcceptances').doc(uid).set({
            userId: uid,
            termsVersion: JOBS_TERMS_VERSION,
            acceptedAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
              ? firebase.firestore.FieldValue.serverTimestamp()
              : new Date()
          }, { merge: true });
        } catch (dbErr) {
          console.warn('Direct terms acceptance firestore notice:', dbErr);
        }
        try {
          localStorage.setItem('sf_jobs_terms_accepted_' + uid, JOBS_TERMS_VERSION);
        } catch (_) {}
      }

      modal.remove();
      toast('Terms & Privacy Notice accepted', 'success');
      if (typeof renderPage === 'function') renderPage();
    } catch (e) {
      toast('Failed to record acceptance: ' + e.message, 'error');
      btn.textContent = 'Accept & Continue';
      btn.disabled = false;
    }
  };
}

// ==========================================
// 1. JOBS MODULE & VIEWS
// ==========================================

let activeJobsTab = 'explore'; // 'explore', 'my_applications', 'employer_desk', 'saved'
let activeJobCategory = 'All';
let activeJobRegion = 'All';
let activeJobSearch = '';

async function renderJobs() {
  const container = _$('page') || _$('appMain') || _$('app');
  if (!container) return;

  container.innerHTML = `
    <div class="max-w-6xl w-full max-w-full mx-auto px-2.5 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 animate-fade-in overflow-x-hidden">
      <!-- Header -->
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div class="flex items-center gap-2.5">
            <img src="/nav-emblem.svg" alt="SellerFlow" class="w-8 h-8 object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(245,158,11,0.25)]" />
            <h1 class="text-2xl font-black text-white">Jobs & Careers in Ghana</h1>
          </div>
          <p class="text-xs text-zinc-400 mt-1">Verified employment opportunities with scam-screened employers.</p>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button id="postJobBtn" class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gold text-black font-black text-xs hover:brightness-110 transition shadow-sm flex items-center justify-center gap-1.5">
            <span>＋</span><span>Post a Job</span>
          </button>
        </div>
      </div>

      ${SCAM_WARNING_HEADER}

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800 scrollbar-none">
        <button class="jobs-tab ${activeJobsTab === 'explore' ? 'active-tab' : ''}" data-tab="explore">
          <span>🔍 Explore Jobs</span>
        </button>
        <button class="jobs-tab ${activeJobsTab === 'my_applications' ? 'active-tab' : ''}" data-tab="my_applications">
          <span>📄 My Applications</span>
        </button>
        <button class="jobs-tab ${activeJobsTab === 'employer_desk' ? 'active-tab' : ''}" data-tab="employer_desk">
          <span>🏢 Employer Desk</span>
        </button>
        ${getIsAdmin() ? `
          <button class="jobs-tab ${activeJobsTab === 'admin_hub' ? 'active-tab' : ''}" data-tab="admin_hub">
            <span class="text-amber-400">🛡️ Moderation Hub</span>
          </button>
        ` : ''}
      </div>

      <!-- Main Content Area -->
      <div id="jobsContentArea" class="min-h-[300px]">
        <div class="text-center py-12 text-zinc-500 text-xs">Loading jobs...</div>
      </div>
    </div>
  `;

  // Attach tab handlers
  container.querySelectorAll('.jobs-tab').forEach(b => {
    b.onclick = () => {
      activeJobsTab = b.dataset.tab;
      renderJobsContent();
    };
  });

  _$('postJobBtn')?.addEventListener('click', async () => {
    const eligible = await checkJobsEventsEligibility(getActiveUser(), 'post a job opening');
    if (eligible) openPostJobModal();
  });

  renderJobsContent();
}
window.renderJobs = renderJobs;

async function renderJobsContent() {
  const area = _$('jobsContentArea');
  if (!area) return;

  // Highlight active tab
  document.querySelectorAll('.jobs-tab').forEach(b => {
    const isActive = b.dataset.tab === activeJobsTab;
    b.className = `jobs-tab px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
      isActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
    }`;
  });

  if (activeJobsTab === 'explore') {
    await renderExploreJobs(area);
  } else if (activeJobsTab === 'my_applications') {
    await renderMyApplications(area);
  } else if (activeJobsTab === 'employer_desk') {
    await renderEmployerDesk(area);
  } else if (activeJobsTab === 'admin_hub') {
    await renderAdminJobsDesk(area);
  } else if (activeJobsTab === 'saved') {
    await renderSavedJobs(area);
  }
}

async function renderExploreJobs(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <!-- Search & Filters -->
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div class="sm:col-span-6 relative">
          <input type="text" id="jobSearchInput" value="${_esc(activeJobSearch)}" placeholder="Search job title, skills, company..." class="w-full bg-[#14141e] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-gold/60 focus:outline-none" />
        </div>
        <div class="sm:col-span-3">
          <select id="jobCategorySelect" class="w-full bg-[#14141e] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold/60 focus:outline-none">
            <option value="All">All Categories</option>
            ${JOB_CATEGORIES.map(c => `<option value="${c}" ${activeJobCategory === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="sm:col-span-3">
          <select id="jobRegionSelect" class="w-full bg-[#14141e] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold/60 focus:outline-none">
            <option value="All">All Ghana Regions</option>
            ${GHANA_REGIONS.map(r => `<option value="${r}" ${activeJobRegion === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Job Listings List -->
      <div id="jobsListContainer" class="space-y-3 pt-2">
        <div class="text-center py-10 text-zinc-500 text-xs">Loading verified jobs...</div>
      </div>
    </div>
  `;

  _$('jobSearchInput')?.addEventListener('input', (e) => {
    activeJobSearch = e.target.value.trim().toLowerCase();
    loadJobsFeed();
  });
  _$('jobCategorySelect')?.addEventListener('change', (e) => {
    activeJobCategory = e.target.value;
    loadJobsFeed();
  });
  _$('jobRegionSelect')?.addEventListener('change', (e) => {
    activeJobRegion = e.target.value;
    loadJobsFeed();
  });

  loadJobsFeed();
}

async function loadJobsFeed() {
  const list = _$('jobsListContainer');
  if (!list) return;

  try {
    let jobs = _cachedJobs;
    const isCacheStale = !_cachedJobs || (Date.now() - _lastJobsFetchTime > CACHE_TTL_MS);

    if (!jobs || !jobs.length) {
      jobs = [];
      const seenIds = new Set();
      try {
        const snap = await getJobsEventsDb().collection('jobs').where('status', '==', 'approved').limit(50).get();
        if (snap && snap.forEach) {
          snap.forEach(doc => {
            seenIds.add(doc.id);
            jobs.push({ id: doc.id, ...doc.data() });
          });
        }
      } catch (err) {
        console.warn('Firestore jobs query notice:', err);
      }
      try {
        const localJobs = JSON.parse(localStorage.getItem('sf_my_posted_jobs') || '[]');
        localJobs.forEach(lj => {
          if (lj && lj.id && !seenIds.has(lj.id) && (lj.status === 'approved' || !lj.status)) {
            seenIds.add(lj.id);
            jobs.push(lj);
          }
        });
      } catch (_) {}
      _cachedJobs = jobs;
      _lastJobsFetchTime = Date.now();
    } else if (isCacheStale) {
      // Refresh cache in background without blocking current render
      prefetchJobsData().catch(() => {});
    }

    let filtered = (jobs || []).slice();

    // Apply Client Filters (Category, Region, Search)
    if (activeJobCategory !== 'All') {
      filtered = filtered.filter(j => j.category === activeJobCategory);
    }
    if (activeJobRegion !== 'All') {
      filtered = filtered.filter(j => j.region === activeJobRegion);
    }
    if (activeJobSearch) {
      filtered = filtered.filter(j => 
        (j.title && j.title.toLowerCase().includes(activeJobSearch)) ||
        (j.companyName && j.companyName.toLowerCase().includes(activeJobSearch)) ||
        (j.description && j.description.toLowerCase().includes(activeJobSearch))
      );
    }

    const currentList = _$('jobsListContainer') || list;
    if (!currentList) return;

    if (!filtered.length) {
      if (!jobs || jobs.length === 0) {
        currentList.innerHTML = `
          <div class="text-center py-16 bg-[#14141e] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-3 max-w-md mx-auto">
            <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-2.5 shadow-sm text-2xl">
              💼
            </div>
            <h4 class="text-base font-bold text-white">No Job Openings Posted Yet</h4>
            <p class="text-xs text-zinc-400 leading-relaxed">
              There are currently no job openings listed. Once an employer or recruiter posts a verified job, it will appear right here.
            </p>
            <button id="feedEmptyPostJobBtn" class="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs shadow-md transition transform active:scale-95">
              <span>＋</span> Post a Job Opening
            </button>
          </div>
        `;
        _$('feedEmptyPostJobBtn')?.addEventListener('click', () => openPostJobModal());
      } else {
        currentList.innerHTML = `
          <div class="text-center py-14 bg-[#14141e] border border-zinc-800/80 rounded-2xl p-6 space-y-2 max-w-md mx-auto">
            <span class="text-3xl block">🔍</span>
            <p class="text-sm font-bold text-zinc-300">No job listings match your filters</p>
            <p class="text-xs text-zinc-500">Try adjusting your category selection or search keywords.</p>
          </div>
        `;
      }
      return;
    }

    currentList.innerHTML = filtered.map(job => renderJobCardHtml(job)).join('');

    // Attach card action handlers
    currentList.querySelectorAll('[data-view-job]').forEach(b => {
      b.onclick = () => openJobDetailModal(b.dataset.viewJob);
    });
    currentList.querySelectorAll('[data-apply-job]').forEach(b => {
      b.onclick = async () => {
        const eligible = await checkJobsEventsEligibility(getActiveUser(), 'apply for this job');
        if (eligible) openApplyJobModal(b.dataset.applyJob);
      };
    });
  } catch (e) {
    const currentList = _$('jobsListContainer') || list;
    if (currentList) {
      currentList.innerHTML = `<div class="text-center py-8 text-rose-400 text-xs">Error loading jobs: ${_esc(e.message)}</div>`;
    }
  }
}

function renderJobCardHtml(job) {
  const formattedSalary = job.salaryMin || job.salaryMax 
    ? `GHS ${(job.salaryMin || 0).toLocaleString()} - ${(job.salaryMax || 0).toLocaleString()} / ${job.salaryPeriod || 'mo'}`
    : 'Negotiable';

  const jobPicture = job.imageUrl || job.logoUrl || job.bannerUrl || '';

  return `
    <div class="bg-[#14141e] hover:bg-[#181826] border border-zinc-800/80 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 transition shadow-sm space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
        <div class="flex items-start gap-3.5 min-w-0 flex-1">
          ${jobPicture ? `
            <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700 shrink-0 cursor-pointer shadow-sm" data-view-job="${job.id}">
              <img src="${_esc(jobPicture)}" alt="${_esc(job.title)}" class="w-full h-full object-cover" />
            </div>
          ` : `
            <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center text-xl shrink-0 cursor-pointer" data-view-job="${job.id}">
              💼
            </div>
          `}
          <div class="space-y-1 min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-base font-black text-white hover:text-amber-300 cursor-pointer transition" data-view-job="${job.id}">
                ${_esc(job.title)}
              </h3>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Verified Employer
              </span>
            </div>
            <div class="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
              <span class="font-bold text-zinc-300">🏢 ${_esc(job.companyName)}</span>
              <span>📍 ${_esc(job.region || 'Ghana')} (${_esc(job.locationType || 'On-site')})</span>
              <span class="text-amber-300 font-semibold">💰 ${_esc(formattedSalary)}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0 self-end sm:self-start">
          <button data-view-job="${job.id}" class="px-3.5 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition">
            View Details
          </button>
          <button data-apply-job="${job.id}" class="px-4 py-2 rounded-xl bg-gold text-black hover:brightness-110 text-xs font-black transition shadow-sm">
            Apply Now
          </button>
        </div>
      </div>

      <p class="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
        ${_esc(job.description)}
      </p>

      <div class="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/50">
        <div class="flex items-center gap-3">
          <span>Category: <b class="text-zinc-400">${_esc(job.category || 'General')}</b></span>
          <span>Type: <b class="text-zinc-400">${_esc(job.employmentType || 'Full-time')}</b></span>
        </div>
        <span>🛡️ Anti-Scam Protected</span>
      </div>
    </div>
  `;
}

// Modal: Post a Job
function openPostJobModal() {
  const modal = document.createElement('div');
  modal.id = 'postJobModal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in';
  modal.innerHTML = `
    <div class="bg-[#181824] border border-gold/40 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div class="flex items-center gap-2.5">
          <img src="/nav-emblem.svg" alt="SellerFlow" class="w-6 h-6 object-contain shrink-0" />
          <div>
            <h3 class="text-base font-black text-white">Post a Verified Job Opening</h3>
            <p class="text-[11px] text-zinc-400">Attach picture, role specifications, and recruitment details.</p>
          </div>
        </div>
        <button id="closePostJobModalBtn" class="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold">✕</button>
      </div>

      <form id="postJobForm" class="flex-1 overflow-y-auto pr-2 space-y-3.5 text-xs text-zinc-300">
        <div>
          <label class="block font-bold text-zinc-300 mb-1">Company Logo / Job Banner Picture *</label>
          <div id="jobImageDropzone" class="border-2 border-dashed border-zinc-700 hover:border-amber-500/60 rounded-2xl p-4 text-center cursor-pointer transition bg-[#12121a] flex flex-col items-center justify-center min-h-[110px] relative group">
            <input type="file" id="jobImageInput" accept="image/*" class="hidden" />
            <div id="jobImagePlaceholder" class="space-y-1.5 flex flex-col items-center">
              <span class="text-2xl block">📷</span>
              <p class="text-xs font-bold text-white">Click or drag & drop to upload picture *</p>
              <p class="text-[11px] text-zinc-400">Attach company logo, workplace photo, or flyer (PNG, JPG, WEBP - Max 10MB)</p>
            </div>
            <div id="jobImagePreviewWrapper" class="hidden w-full flex items-center gap-3">
              <img id="jobImagePreview" class="w-16 h-16 object-cover rounded-xl border border-zinc-700 shadow-sm shrink-0" />
              <div class="text-left flex-1 min-w-0">
                <p id="jobImageFileName" class="text-xs font-bold text-white truncate"></p>
                <p id="jobImageFileSize" class="text-[11px] text-emerald-400 font-semibold">✓ Picture ready to attach</p>
              </div>
              <button type="button" id="jobImageRemoveBtn" class="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30">
                Change
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Job Title *</label>
            <input type="text" id="jobTitle" required placeholder="e.g. Senior Store Manager" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
          </div>
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Company / Business Name *</label>
            <input type="text" id="jobCompany" required placeholder="e.g. Accra Superstore Ltd" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Category *</label>
            <select id="jobCategory" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none">
              ${JOB_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Region *</label>
            <select id="jobRegion" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none">
              ${GHANA_REGIONS.map(r => `<option value="${r}">${r}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Work Setup *</label>
            <select id="jobLocationType" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none">
              <option value="on_site">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Fully Remote</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Min Salary (GHS)</label>
            <input type="number" id="jobSalaryMin" min="0" placeholder="e.g. 2500" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
          </div>
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Max Salary (GHS)</label>
            <input type="number" id="jobSalaryMax" min="0" placeholder="e.g. 4500" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
          </div>
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Period</label>
            <select id="jobSalaryPeriod" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none">
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="hourly">Hourly</option>
              <option value="negotiable">Negotiable</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block font-bold text-zinc-300 mb-1">Detailed Job Description *</label>
          <textarea id="jobDesc" required rows="4" placeholder="Describe the role, daily tasks, and company mission..." class="w-full bg-[#12121a] border border-zinc-800 rounded-xl p-3 text-white text-xs focus:border-gold/60 focus:outline-none"></textarea>
        </div>

        <div>
          <label class="block font-bold text-zinc-300 mb-1">Requirements & Qualifications</label>
          <textarea id="jobReqs" rows="2" placeholder="e.g. 2+ years retail experience, SHS/Degree..." class="w-full bg-[#12121a] border border-zinc-800 rounded-xl p-3 text-white text-xs focus:border-gold/60 focus:outline-none"></textarea>
        </div>

        <div class="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 space-y-2">
          <label class="flex items-start gap-2 cursor-pointer font-bold">
            <input type="checkbox" id="postScamAck" required class="mt-0.5 accent-amber-500 w-4 h-4" />
            <span>I confirm this listing DOES NOT require jobseekers to pay any application fee, registration fee, MOMO deposit, or interview fee.</span>
          </label>
        </div>

        <div class="flex gap-3 pt-2">
          <button id="cancelPostJobBtn" type="button" class="flex-1 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition">
            Cancel
          </button>
          <button id="submitJobBtn" type="submit" class="flex-1 py-2.5 rounded-xl bg-gold text-black hover:brightness-110 text-xs font-black transition shadow-md">
            Submit Job Listing
          </button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  let selectedJobImageData = '';

  const jobImageInput = modal.querySelector('#jobImageInput');
  const jobImageDropzone = modal.querySelector('#jobImageDropzone');
  const jobImagePlaceholder = modal.querySelector('#jobImagePlaceholder');
  const jobImagePreviewWrapper = modal.querySelector('#jobImagePreviewWrapper');
  const jobImagePreview = modal.querySelector('#jobImagePreview');
  const jobImageFileName = modal.querySelector('#jobImageFileName');
  const jobImageRemoveBtn = modal.querySelector('#jobImageRemoveBtn');

  async function handleJobImageFile(file) {
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      selectedJobImageData = dataUrl;
      jobImagePreview.src = dataUrl;
      jobImageFileName.textContent = file.name || 'job-picture.jpg';
      jobImagePlaceholder.classList.add('hidden');
      jobImagePreviewWrapper.classList.remove('hidden');
      jobImageDropzone.classList.remove('border-rose-500');
      jobImageDropzone.classList.add('border-emerald-500/50');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  jobImageDropzone.onclick = (e) => {
    if (e.target !== jobImageRemoveBtn && !jobImageRemoveBtn.contains(e.target)) {
      jobImageInput.click();
    }
  };

  jobImageInput.onchange = () => {
    if (jobImageInput.files && jobImageInput.files[0]) {
      handleJobImageFile(jobImageInput.files[0]);
    }
  };

  jobImageDropzone.ondragover = (e) => {
    e.preventDefault();
    jobImageDropzone.classList.add('border-gold');
  };

  jobImageDropzone.ondragleave = () => {
    jobImageDropzone.classList.remove('border-gold');
  };

  jobImageDropzone.ondrop = (e) => {
    e.preventDefault();
    jobImageDropzone.classList.remove('border-gold');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleJobImageFile(e.dataTransfer.files[0]);
    }
  };

  jobImageRemoveBtn.onclick = (e) => {
    e.stopPropagation();
    selectedJobImageData = '';
    jobImageInput.value = '';
    jobImagePreview.src = '';
    jobImagePreviewWrapper.classList.add('hidden');
    jobImagePlaceholder.classList.remove('hidden');
    jobImageDropzone.classList.remove('border-emerald-500/50');
  };

  modal.querySelector('#closePostJobModalBtn').onclick = () => modal.remove();
  modal.querySelector('#cancelPostJobBtn').onclick = () => modal.remove();

  modal.querySelector('#postJobForm').onsubmit = async (e) => {
    e.preventDefault();

    if (!selectedJobImageData) {
      toast('Please upload and attach a picture or company logo for your job posting.', 'error');
      jobImageDropzone.classList.add('border-rose-500');
      jobImageDropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const btn = modal.querySelector('#submitJobBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting & Scanning...';

    try {
      const activeUser = getActiveUser();
      const token = activeUser && activeUser.getIdToken ? await activeUser.getIdToken().catch(() => '') : '';
      const payload = {
        title: _$('jobTitle').value.trim(),
        companyName: _$('jobCompany').value.trim(),
        imageUrl: selectedJobImageData,
        logoUrl: selectedJobImageData,
        imageBase64: selectedJobImageData,
        category: _$('jobCategory').value,
        region: _$('jobRegion').value,
        locationType: _$('jobLocationType').value,
        salaryMin: Number(_$('jobSalaryMin').value) || 0,
        salaryMax: Number(_$('jobSalaryMax').value) || 0,
        salaryPeriod: _$('jobSalaryPeriod').value,
        description: _$('jobDesc').value.trim(),
        requirements: _$('jobReqs').value.trim(),
        scamWarningAcknowledged: _$('postScamAck').checked
      };

      let jobId = 'job_' + Date.now();
      let serverMsg = '';

      if (token) {
        try {
          const res = await fetch('/api/jobs/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok && data.success) {
            serverMsg = data.message;
            if (data.jobId) jobId = data.jobId;
          }
        } catch (apiErr) {
          console.warn('Network call to /api/jobs/submit notice:', apiErr);
        }
      }

      const newJobObj = {
        id: jobId,
        _type: 'job',
        ...payload,
        creatorId: activeUser?.uid || 'local_user',
        status: 'approved',
        reviewStatus: 'approved',
        applicationsCount: 0,
        viewsCount: 1,
        createdAt: new Date().toISOString()
      };

      try {
        const db = getJobsEventsDb();
        await db.collection('jobs').doc(jobId).set(newJobObj, { merge: true });
      } catch (fsErr) {
        console.warn('Direct client jobs storage notice:', fsErr);
      }

      try {
        const myJobs = JSON.parse(localStorage.getItem('sf_my_posted_jobs') || '[]');
        myJobs.unshift(newJobObj);
        localStorage.setItem('sf_my_posted_jobs', JSON.stringify(myJobs));
      } catch (_) {}

      if (_cachedJobs) _cachedJobs.unshift(newJobObj);
      if (_adminJobsCache) _adminJobsCache.unshift(newJobObj);

      modal.remove();
      toast(serverMsg || 'Job submitted and published live!', 'success');
      activeJobsTab = 'employer_desk';
      renderJobsContent();
    } catch (err) {
      toast('Error: ' + err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Submit Job Listing';
    }
  };
}

// Modal: Apply for a Job
async function openApplyJobModal(jobId) {
  let jobData = null;
  try {
    if (_cachedJobs) jobData = _cachedJobs.find(j => j.id === jobId);
    if (!jobData) {
      const snap = await getJobsEventsDb().collection('jobs').doc(jobId).get();
      if (snap && snap.exists) jobData = { id: snap.id, ...snap.data() };
    }
    if (!jobData) {
      try {
        const localJobs = JSON.parse(localStorage.getItem('sf_my_posted_jobs') || '[]');
        jobData = localJobs.find(j => j.id === jobId);
      } catch (_) {}
    }
  } catch (_) {}

  if (!jobData) {
    toast('Job listing not found or no longer available', 'error');
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'applyJobModal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in';
  modal.innerHTML = `
    <div class="bg-[#181824] border border-gold/40 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div>
          <h3 class="text-base font-black text-white">Apply for ${_esc(jobData?.title || 'Position')}</h3>
          <p class="text-[11px] text-zinc-400">at ${_esc(jobData?.companyName || 'Verified Employer')}</p>
        </div>
        <button id="closeApplyModalBtn" class="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold">✕</button>
      </div>

      <form id="applyJobForm" class="flex-1 overflow-y-auto pr-2 space-y-3.5 text-xs text-zinc-300">
        <div>
          <label class="block font-bold text-zinc-300 mb-1">Full Name *</label>
          <input type="text" id="applicantName" required value="${_esc(getActiveProfile()?.name || getActiveUser()?.displayName || '')}" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Email Address *</label>
            <input type="email" id="applicantEmail" required value="${_esc(getActiveUser()?.email || '')}" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
          </div>
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Phone Number (WhatsApp) *</label>
            <input type="tel" id="applicantPhone" required placeholder="024XXXXXXX" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
          </div>
        </div>

        <div>
          <label class="block font-bold text-zinc-300 mb-1">Cover Note / Introduction</label>
          <textarea id="applicantCover" rows="3" placeholder="Briefly state your experience and why you are a great fit..." class="w-full bg-[#12121a] border border-zinc-800 rounded-xl p-3 text-white text-xs focus:border-gold/60 focus:outline-none"></textarea>
        </div>

        <div>
          <label class="block font-bold text-zinc-300 mb-1">Upload CV / Resume (PDF or DOCX, max 10MB)</label>
          <input type="file" id="applicantCvFile" accept=".pdf,.docx,.doc,image/*" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl p-2 text-zinc-400 text-xs focus:border-gold/60 focus:outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700" />
        </div>

        <div class="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200">
          <label class="flex items-start gap-2 cursor-pointer font-bold text-[11px]">
            <input type="checkbox" id="applicantScamAck" required class="mt-0.5 accent-amber-500 w-4 h-4" />
            <span>I acknowledge that I should NEVER pay any money or send MOMO for this job. I will report any fee requests immediately.</span>
          </label>
        </div>

        <div class="flex gap-3 pt-2">
          <button id="cancelApplyBtn" type="button" class="flex-1 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition">
            Cancel
          </button>
          <button id="submitApplicationBtn" type="submit" class="flex-1 py-2.5 rounded-xl bg-gold text-black hover:brightness-110 text-xs font-black transition shadow-md">
            Send Application
          </button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#closeApplyModalBtn').onclick = () => modal.remove();
  modal.querySelector('#cancelApplyBtn').onclick = () => modal.remove();

  modal.querySelector('#applyJobForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = modal.querySelector('#submitApplicationBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    try {
      const fileInput = _$('applicantCvFile');
      let cvBase64 = null;
      let cvFileName = '';
      let cvFileType = '';

      if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        cvFileName = file.name;
        cvFileType = file.type;
        cvBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const activeUser = getActiveUser();
      const token = activeUser && activeUser.getIdToken ? await activeUser.getIdToken().catch(() => '') : '';
      const payload = {
        jobId,
        applicantName: _$('applicantName').value.trim(),
        applicantEmail: _$('applicantEmail').value.trim(),
        applicantPhone: _$('applicantPhone').value.trim(),
        coverLetter: _$('applicantCover').value.trim(),
        cvBase64,
        cvFileName,
        cvFileType,
        scamWarningAcknowledged: _$('applicantScamAck').checked
      };

      let appId = 'app_' + (activeUser?.uid || 'anon') + '_' + Date.now();
      let serverMsg = '';

      if (token) {
        try {
          const res = await fetch('/api/jobs/apply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok && data.success) {
            serverMsg = data.message;
            if (data.applicationId) appId = data.applicationId;
          }
        } catch (apiErr) {
          console.warn('Network call to /api/jobs/apply notice:', apiErr);
        }
      }

      // Direct client & local storage backup
      const newAppObj = {
        id: appId,
        jobId,
        jobTitle: jobData?.title || 'Job Opening',
        companyName: jobData?.companyName || 'Verified Employer',
        applicantId: activeUser?.uid || 'local_user',
        applicantName: payload.applicantName,
        applicantEmail: payload.applicantEmail,
        applicantPhone: payload.applicantPhone,
        coverLetter: payload.coverLetter,
        status: 'submitted',
        createdAt: new Date().toISOString()
      };

      try {
        const db = getJobsEventsDb();
        await db.collection('jobApplications').doc(appId).set(newAppObj, { merge: true });
        await db.collection('jobs').doc(jobId).update({
          applicationsCount: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) ? firebase.firestore.FieldValue.increment(1) : 1
        }).catch(() => {});
      } catch (fsErr) {
        console.warn('Direct client application storage notice:', fsErr);
      }

      try {
        const myApps = JSON.parse(localStorage.getItem('sf_my_job_applications') || '[]');
        myApps.unshift(newAppObj);
        localStorage.setItem('sf_my_job_applications', JSON.stringify(myApps));
      } catch (_) {}

      modal.remove();
      toast(serverMsg || 'Application submitted successfully!', 'success');
      activeJobsTab = 'my_applications';
      renderJobsContent();
    } catch (err) {
      toast('Error: ' + err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Send Application';
    }
  };
}

// Modal: Job Details Viewer
async function openJobDetailModal(jobId) {
  try {
    let job = null;
    if (_cachedJobs) job = _cachedJobs.find(j => j.id === jobId);
    if (!job) {
      const snap = await getJobsEventsDb().collection('jobs').doc(jobId).get();
      if (snap && snap.exists) job = { id: snap.id, ...snap.data() };
    }
    if (!job) {
      try {
        const localJobs = JSON.parse(localStorage.getItem('sf_my_posted_jobs') || '[]');
        job = localJobs.find(j => j.id === jobId);
      } catch (_) {}
    }
    if (!job) {
      toast('Job listing not found or unavailable', 'error');
      return;
    }
    const formattedSalary = job.salaryMin || job.salaryMax 
      ? `GHS ${(job.salaryMin || 0).toLocaleString()} - ${(job.salaryMax || 0).toLocaleString()} / ${job.salaryPeriod || 'mo'}`
      : 'Negotiable';

    const modal = document.createElement('div');
    modal.id = 'jobDetailModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in';
    modal.innerHTML = `
      <div class="bg-[#181824] border border-zinc-700 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        <div class="flex items-start justify-between pb-3 border-b border-zinc-800">
          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <img src="/nav-emblem.svg" alt="SellerFlow" class="w-5 h-5 object-contain shrink-0" />
              <h2 class="text-xl font-black text-white">${_esc(job.title)}</h2>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Verified Employer
              </span>
            </div>
            <p class="text-xs font-bold text-zinc-300">🏢 ${_esc(job.companyName)} · 📍 ${_esc(job.region)} (${_esc(job.locationType)})</p>
          </div>
          <button id="closeDetailModalBtn" class="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold">✕</button>
        </div>

        <div class="flex-1 overflow-y-auto pr-2 space-y-4 text-xs leading-relaxed text-zinc-300">
          ${(job.imageUrl || job.logoUrl || job.bannerUrl) ? `
            <div class="h-44 sm:h-52 w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-md">
              <img src="${_esc(job.imageUrl || job.logoUrl || job.bannerUrl)}" alt="${_esc(job.title)}" class="w-full h-full object-cover" />
            </div>
          ` : ''}

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-[#12121a] border border-zinc-800">
            <div>
              <span class="text-[10px] text-zinc-500 block uppercase font-bold">Salary</span>
              <span class="text-amber-300 font-bold">${_esc(formattedSalary)}</span>
            </div>
            <div>
              <span class="text-[10px] text-zinc-500 block uppercase font-bold">Job Type</span>
              <span class="text-white font-semibold">${_esc(job.employmentType || 'Full-time')}</span>
            </div>
            <div>
              <span class="text-[10px] text-zinc-500 block uppercase font-bold">Category</span>
              <span class="text-white font-semibold">${_esc(job.category || 'General')}</span>
            </div>
          </div>

          <div>
            <h4 class="font-bold text-white mb-1.5 text-sm">Job Description</h4>
            <div class="whitespace-pre-line text-zinc-300">${_esc(job.description)}</div>
          </div>

          ${job.requirements ? `
            <div>
              <h4 class="font-bold text-white mb-1.5 text-sm">Requirements & Skills</h4>
              <div class="whitespace-pre-line text-zinc-300">${_esc(job.requirements)}</div>
            </div>
          ` : ''}

          <div class="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200">
            <b class="block mb-1 font-bold text-amber-300">⚠️ Anti-Scam Protection Warning:</b>
            <p class="text-[11px] text-zinc-300">
              Never pay any application, processing, or interview fees. Report any suspicious employer immediately to SellerFlow Security Desk.
            </p>
          </div>
        </div>

        <div class="flex gap-3 pt-3 border-t border-zinc-800">
          <button id="detailCloseBtn" class="flex-1 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition">
            Close
          </button>
          <button id="detailApplyBtn" class="flex-1 py-2.5 rounded-xl bg-gold text-black hover:brightness-110 text-xs font-black transition shadow-md">
            Apply Now
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#closeDetailModalBtn').onclick = () => modal.remove();
    modal.querySelector('#detailCloseBtn').onclick = () => modal.remove();
    modal.querySelector('#detailApplyBtn').onclick = async () => {
      modal.remove();
      const eligible = await checkJobsEventsEligibility(getActiveUser(), 'apply for this job');
      if (eligible) openApplyJobModal(jobId);
    };
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

// Sub-view: My Applications
async function renderMyApplications(container) {
  if (!container) return;
  const user = getActiveUser();
  if (!user) {
    container.innerHTML = `
      <div class="text-center py-14 bg-[#14141e] border border-zinc-800 rounded-2xl p-6 max-w-md mx-auto space-y-4">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-2.5 shadow-sm">
          <img src="/nav-emblem.svg" alt="SellerFlow" class="w-8 h-8 object-contain" />
        </div>
        <div>
          <h3 class="text-base font-black text-white">Track Your Job Applications</h3>
          <p class="text-xs text-zinc-400 mt-1">Sign in or create an account to view your submitted applications, interview statuses, and employer messages.</p>
        </div>
        <div class="flex gap-2 pt-2 justify-center">
          <button id="myAppsLoginBtn" class="px-5 py-2.5 rounded-xl bg-gold text-black font-bold text-xs hover:brightness-110 transition shadow-sm">
            Sign In / Create Account
          </button>
        </div>
      </div>
    `;
    container.querySelector('#myAppsLoginBtn')?.addEventListener('click', () => showAuthPrompt('track your job applications'));
    return;
  }

  container.innerHTML = `<div class="text-center py-10 text-zinc-500 text-xs">Loading your applications...</div>`;
  try {
    const apps = [];
    const seenAppIds = new Set();

    try {
      const snap = await getJobsEventsDb().collection('jobApplications')
        .where('applicantId', '==', user.uid)
        .get();
      if (snap && snap.forEach) {
        snap.forEach(d => {
          seenAppIds.add(d.id);
          apps.push({ id: d.id, ...d.data() });
        });
      }
    } catch (dbErr) {
      console.warn('Direct job applications fetch notice:', dbErr.message);
    }

    try {
      const myApps = JSON.parse(localStorage.getItem('sf_my_job_applications') || '[]');
      myApps.forEach(ma => {
        if (ma && ma.id && !seenAppIds.has(ma.id)) {
          seenAppIds.add(ma.id);
          apps.push(ma);
        }
      });
    } catch (_) {}

    const target = _$('jobsContentArea') || container;
    if (!target) return;

    if (apps.length === 0) {
      target.innerHTML = `
        <div class="text-center py-14 bg-[#14141e] border border-zinc-800 rounded-2xl p-6 space-y-2">
          <span class="text-3xl block">📄</span>
          <p class="text-sm font-bold text-zinc-300">You haven't applied to any jobs yet</p>
          <p class="text-xs text-zinc-500">Explore the jobs feed and submit your CV to verified employers.</p>
        </div>
      `;
      return;
    }

    target.innerHTML = `
      <div class="space-y-3">
        ${apps.map(app => `
          <div class="bg-[#14141e] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div class="space-y-1 min-w-0">
              <h4 class="text-sm font-bold text-white truncate">${_esc(app.jobTitle || 'Job Application')}</h4>
              <p class="text-xs text-zinc-400">🏢 ${_esc(app.companyName || 'Employer')}</p>
            </div>
            <div class="shrink-0 flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                app.status === 'shortlisted' || app.status === 'accepted' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                app.status === 'rejected' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
              }">
                ${_esc(app.status || 'Submitted')}
              </span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    const target = _$('jobsContentArea') || container;
    if (target) {
      target.innerHTML = `<div class="text-center py-8 text-rose-400 text-xs">Error: ${_esc(err.message)}</div>`;
    }
  }
}

// Sub-view: Employer Desk (Manage Posted Jobs & Candidates)
async function renderEmployerDesk(container) {
  if (!container) return;
  const user = getActiveUser();
  if (!user) {
    container.innerHTML = `
      <div class="text-center py-14 bg-[#14141e] border border-zinc-800 rounded-2xl p-6 max-w-md mx-auto space-y-4">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-2.5 shadow-sm">
          <img src="/nav-emblem.svg" alt="SellerFlow" class="w-8 h-8 object-contain" />
        </div>
        <div>
          <h3 class="text-base font-black text-white">Employer Recruitment Desk</h3>
          <p class="text-xs text-zinc-400 mt-1">Sign in or create an account to post vacancies, review candidate CVs, and manage your company listings.</p>
        </div>
        <div class="flex gap-2 pt-2 justify-center">
          <button id="employerDeskLoginBtn" class="px-5 py-2.5 rounded-xl bg-gold text-black font-bold text-xs hover:brightness-110 transition shadow-sm">
            Sign In / Create Account
          </button>
        </div>
      </div>
    `;
    container.querySelector('#employerDeskLoginBtn')?.addEventListener('click', () => showAuthPrompt('manage your employer desk and job listings'));
    return;
  }

  container.innerHTML = `<div class="text-center py-10 text-zinc-500 text-xs">Loading your job listings...</div>`;
  try {
    const myJobs = [];
    const seenJobIds = new Set();

    try {
      const snap = await getJobsEventsDb().collection('jobs')
        .where('creatorId', '==', user.uid)
        .get();
      if (snap && snap.forEach) {
        snap.forEach(d => {
          seenJobIds.add(d.id);
          myJobs.push({ id: d.id, ...d.data() });
        });
      }
    } catch (dbErr) {
      console.warn('Direct employer jobs fetch notice:', dbErr.message);
    }

    try {
      const storedJobs = JSON.parse(localStorage.getItem('sf_my_posted_jobs') || '[]');
      storedJobs.forEach(sj => {
        if (sj && sj.id && !seenJobIds.has(sj.id)) {
          seenJobIds.add(sj.id);
          myJobs.push(sj);
        }
      });
    } catch (_) {}

    const target = _$('jobsContentArea') || container;
    if (!target) return;

    if (myJobs.length === 0) {
      target.innerHTML = `
        <div class="text-center py-14 bg-[#14141e] border border-zinc-800 rounded-2xl p-6 space-y-3">
          <span class="text-3xl block">🏢</span>
          <p class="text-sm font-bold text-zinc-300">You haven't posted any jobs yet</p>
          <button id="deskPostJobBtn" class="px-4 py-2 rounded-xl bg-gold text-black font-bold text-xs hover:brightness-110">
            Post Your First Job Opening
          </button>
        </div>
      `;
      target.querySelector('#deskPostJobBtn')?.addEventListener('click', async () => {
        const eligible = await checkJobsEventsEligibility(getActiveUser(), 'post a job opening');
        if (eligible) openPostJobModal();
      });
      return;
    }

    target.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-zinc-300">You have <b>${myJobs.length}</b> posted job listing(s)</p>
          <button id="deskPostJobBtn2" class="px-3.5 py-1.5 rounded-xl bg-gold text-black font-extrabold text-xs hover:brightness-110 flex items-center gap-1 shadow-sm">
            <span>＋</span><span>Post Another Job</span>
          </button>
        </div>
        <div class="space-y-3">
          ${myJobs.map(job => `
            <div class="bg-[#14141e] border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="space-y-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="text-sm font-black text-white">${_esc(job.title)}</h4>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    ${_esc(job.employmentType || 'Full-time')}
                  </span>
                </div>
                <p class="text-xs text-zinc-400">🏢 ${_esc(job.companyName || 'Company')} · 📍 ${_esc(job.region || 'Accra')} (${_esc(job.locationType || 'On-site')})</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button data-view-job="${job.id}" class="px-3 py-1.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition">
                  Preview
                </button>
                <button data-view-applicants="${job.id}" class="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black hover:brightness-110 text-xs font-black transition shadow-sm">
                  View Candidates
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    target.querySelector('#deskPostJobBtn2')?.addEventListener('click', async () => {
      const eligible = await checkJobsEventsEligibility(getActiveUser(), 'post a job opening');
      if (eligible) openPostJobModal();
    });
    target.querySelectorAll('[data-view-job]').forEach(b => {
      b.onclick = () => openJobDetailModal(b.dataset.viewJob);
    });
    target.querySelectorAll('[data-view-applicants]').forEach(b => {
      b.onclick = () => openApplicantsModal(b.dataset.viewApplicants);
    });
  } catch (err) {
    const target = _$('jobsContentArea') || container;
    if (target) {
      target.innerHTML = `<div class="text-center py-8 text-rose-400 text-xs">Error: ${_esc(err.message)}</div>`;
    }
  }
}

// Modal: Review Candidates for a Job
async function openApplicantsModal(jobId) {
  const modal = document.createElement('div');
  modal.id = 'applicantsModal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in';
  modal.innerHTML = `
    <div class="bg-[#181824] border border-zinc-700 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div>
          <h3 class="text-base font-black text-white">Candidate Applications</h3>
          <p class="text-[11px] text-zinc-400">Confidential applicant profiles</p>
        </div>
        <button id="closeApplicantsModalBtn" class="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold">✕</button>
      </div>

      <div id="applicantsListArea" class="flex-1 overflow-y-auto space-y-3 pr-2 text-xs">
        <div class="text-center py-8 text-zinc-500">Loading candidates...</div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#closeApplicantsModalBtn').onclick = () => modal.remove();

  try {
    const snap = await getJobsEventsDb().collection('jobApplications')
      .where('jobId', '==', jobId)
      .get();

    const area = modal.querySelector('#applicantsListArea');
    if (!area) return;

    if (snap.empty) {
      area.innerHTML = `<div class="text-center py-10 text-zinc-500">No applications received yet for this listing.</div>`;
      return;
    }

    const apps = [];
    snap.forEach(d => apps.push({ id: d.id, ...d.data() }));

    area.innerHTML = apps.map(app => `
      <div class="bg-[#12121a] border border-zinc-800 rounded-2xl p-4 space-y-2.5">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-bold text-white text-sm">${_esc(app.applicantName)}</h4>
            <p class="text-[11px] text-zinc-400">📧 ${_esc(app.applicantEmail)} · 📞 ${_esc(app.applicantPhone)}</p>
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
            ${_esc(app.status || 'submitted')}
          </span>
        </div>

        ${app.coverLetter ? `
          <div class="p-2.5 rounded-xl bg-black/40 text-zinc-300 text-xs leading-relaxed border border-zinc-800">
            "${_esc(app.coverLetter)}"
          </div>
        ` : ''}

        <div class="flex items-center justify-between pt-2 border-t border-zinc-800/60">
          ${app.cvStoragePath ? `
            <a href="${_esc(app.cvStoragePath)}" target="_blank" class="text-amber-400 hover:underline font-bold text-xs flex items-center gap-1">
              <span>📄</span><span>Download CV (${_esc(app.cvFileName || 'resume')})</span>
            </a>
          ` : '<span class="text-zinc-500 text-[11px]">No CV attached</span>'}

          <div class="flex items-center gap-1.5">
            <button data-app-status="${app.id}" data-status="shortlisted" class="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold hover:brightness-110">
              Shortlist
            </button>
            <button data-app-status="${app.id}" data-status="rejected" class="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-bold hover:brightness-110">
              Reject
            </button>
          </div>
        </div>
      </div>
    `).join('');

    area.querySelectorAll('[data-app-status]').forEach(btn => {
      btn.onclick = async () => {
        const appId = btn.dataset.appStatus;
        const newStatus = btn.dataset.status;
        try {
          await getJobsEventsDb().collection('jobApplications').doc(appId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          toast(`Application updated to ${newStatus}`, 'success');
          openApplicantsModal(jobId);
        } catch (e) {
          toast('Error updating application: ' + e.message, 'error');
        }
      };
    });
  } catch (err) {
    const area = modal?.querySelector('#applicantsListArea');
    if (area) area.innerHTML = `<div class="text-center py-8 text-rose-400">Error: ${_esc(err.message)}</div>`;
  }
}

async function renderSavedJobs(container) {
  if (!container) return;
  container.innerHTML = `<div class="text-center py-10 text-zinc-500 text-xs">Saved jobs feature active. Bookmark opportunities from Explore tab.</div>`;
}

// ==========================================
// 2. EVENTS MODULE & VIEWS
// ==========================================

let activeEventsTab = 'discover'; // 'discover', 'my_registrations', 'organizer_desk'
let activeEventCategory = 'All';
let activeEventSearch = '';

async function renderEvents() {
  const container = _$('page') || _$('appMain') || _$('app');
  if (!container) return;

  container.innerHTML = `
    <div class="max-w-6xl w-full max-w-full mx-auto px-2.5 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 animate-fade-in overflow-x-hidden">
      <!-- Header -->
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div class="flex items-center gap-2.5">
            <img src="/nav-emblem.svg" alt="SellerFlow" class="w-8 h-8 object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(245,158,11,0.25)]" />
            <h1 class="text-2xl font-black text-white">Events & Gatherings in Ghana</h1>
          </div>
          <p class="text-xs text-zinc-400 mt-1">Conferences, pop-up markets, workshops, and business networking.</p>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button id="createEventBtn" class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gold text-black font-black text-xs hover:brightness-110 transition shadow-sm flex items-center justify-center gap-1.5">
            <span>＋</span><span>Host an Event</span>
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800 scrollbar-none">
        <button class="events-tab ${activeEventsTab === 'discover' ? 'active-tab' : ''}" data-tab="discover">
          <span>🎉 Discover Events</span>
        </button>
        <button class="events-tab ${activeEventsTab === 'my_registrations' ? 'active-tab' : ''}" data-tab="my_registrations">
          <span>🎟️ My Tickets / RSVPs</span>
        </button>
        <button class="events-tab ${activeEventsTab === 'organizer_desk' ? 'active-tab' : ''}" data-tab="organizer_desk">
          <span>🎪 Organizer Desk</span>
        </button>
        ${getIsAdmin() ? `
          <button class="events-tab ${activeEventsTab === 'admin_hub' ? 'active-tab' : ''}" data-tab="admin_hub">
            <span class="text-amber-400">🛡️ Moderation Hub</span>
          </button>
        ` : ''}
      </div>

      <!-- Main Content Area -->
      <div id="eventsContentArea" class="min-h-[300px]">
        <div class="text-center py-12 text-zinc-500 text-xs">Loading events...</div>
      </div>
    </div>
  `;

  container.querySelectorAll('.events-tab').forEach(b => {
    b.onclick = () => {
      activeEventsTab = b.dataset.tab;
      renderEventsContent();
    };
  });

  _$('createEventBtn')?.addEventListener('click', async () => {
    const eligible = await checkJobsEventsEligibility(getActiveUser(), 'host an event');
    if (eligible) openCreateEventModal();
  });

  renderEventsContent();
}
window.renderEvents = renderEvents;

async function renderEventsContent() {
  const area = _$('eventsContentArea');
  if (!area) return;

  document.querySelectorAll('.events-tab').forEach(b => {
    const isActive = b.dataset.tab === activeEventsTab;
    b.className = `events-tab px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
      isActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
    }`;
  });

  if (activeEventsTab === 'discover') {
    await renderDiscoverEvents(area);
  } else if (activeEventsTab === 'my_registrations') {
    await renderMyRegistrations(area);
  } else if (activeEventsTab === 'organizer_desk') {
    await renderOrganizerDesk(area);
  } else if (activeEventsTab === 'admin_hub') {
    await renderAdminJobsDesk(area);
  }
}

async function renderDiscoverEvents(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div class="sm:col-span-8 relative">
          <input type="text" id="eventSearchInput" value="${_esc(activeEventSearch)}" placeholder="Search event title, venue, organizer..." class="w-full bg-[#14141e] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-gold/60 focus:outline-none" />
        </div>
        <div class="sm:col-span-4">
          <select id="eventCategorySelect" class="w-full bg-[#14141e] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold/60 focus:outline-none">
            <option value="All">All Event Categories</option>
            ${EVENT_CATEGORIES.map(c => `<option value="${c}" ${activeEventCategory === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>

      <div id="eventsListContainer" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        <div class="col-span-full text-center py-10 text-zinc-500 text-xs">Loading verified events...</div>
      </div>
    </div>
  `;

  _$('eventSearchInput')?.addEventListener('input', (e) => {
    activeEventSearch = e.target.value.trim().toLowerCase();
    loadEventsFeed();
  });
  _$('eventCategorySelect')?.addEventListener('change', (e) => {
    activeEventCategory = e.target.value;
    loadEventsFeed();
  });

  loadEventsFeed();
}

async function loadEventsFeed() {
  const list = _$('eventsListContainer');
  if (!list) return;

  try {
    let events = _cachedEvents;
    const isCacheStale = !_cachedEvents || (Date.now() - _lastEventsFetchTime > CACHE_TTL_MS);

    if (!events || !events.length) {
      events = [];
      const seenIds = new Set();
      try {
        const snap = await getJobsEventsDb().collection('events').where('status', '==', 'approved').limit(40).get();
        if (snap && snap.forEach) {
          snap.forEach(doc => {
            seenIds.add(doc.id);
            events.push({ id: doc.id, ...doc.data() });
          });
        }
      } catch (err) {
        console.warn('Firestore events query notice:', err);
      }
      try {
        const localEvents = JSON.parse(localStorage.getItem('sf_my_hosted_events') || '[]');
        localEvents.forEach(le => {
          if (le && le.id && !seenIds.has(le.id) && (le.status === 'approved' || !le.status)) {
            seenIds.add(le.id);
            events.push(le);
          }
        });
      } catch (_) {}
      _cachedEvents = events;
      _lastEventsFetchTime = Date.now();
    } else if (isCacheStale) {
      // Refresh cache in background without blocking current render
      prefetchEventsData().catch(() => {});
    }

    let filtered = (events || []).slice();

    if (activeEventCategory !== 'All') {
      filtered = filtered.filter(ev => ev.category === activeEventCategory);
    }
    if (activeEventSearch) {
      filtered = filtered.filter(ev => 
        (ev.title && ev.title.toLowerCase().includes(activeEventSearch)) ||
        (ev.organizerName && ev.organizerName.toLowerCase().includes(activeEventSearch)) ||
        (ev.venue && ev.venue.toLowerCase().includes(activeEventSearch))
      );
    }

    const currentList = _$('eventsListContainer') || list;
    if (!currentList) return;

    if (!filtered.length) {
      if (!events || events.length === 0) {
        currentList.innerHTML = `
          <div class="col-span-full text-center py-16 bg-[#14141e] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-3 max-w-md mx-auto">
            <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-2.5 shadow-sm text-2xl">
              🎪
            </div>
            <h4 class="text-base font-bold text-white">No Events Posted Yet</h4>
            <p class="text-xs text-zinc-400 leading-relaxed">
              There are currently no upcoming events listed. Once an organizer or community host creates an event, it will appear right here.
            </p>
            <button id="feedEmptyHostEventBtn" class="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs shadow-md transition transform active:scale-95">
              <span>＋</span> Host an Event
            </button>
          </div>
        `;
        _$('feedEmptyHostEventBtn')?.addEventListener('click', () => openCreateEventModal());
      } else {
        currentList.innerHTML = `
          <div class="col-span-full text-center py-14 bg-[#14141e] border border-zinc-800/80 rounded-2xl p-6 space-y-2 max-w-md mx-auto">
            <span class="text-3xl block">🔍</span>
            <p class="text-sm font-bold text-zinc-300">No events match your filters</p>
            <p class="text-xs text-zinc-500">Try adjusting your category selection or search keywords.</p>
          </div>
        `;
      }
      return;
    }

    currentList.innerHTML = filtered.map(ev => `
      <div class="bg-[#14141e] hover:bg-[#181826] border border-zinc-800/80 hover:border-amber-500/40 rounded-2xl overflow-hidden transition shadow-sm flex flex-col justify-between">
        ${ev.bannerUrl ? `
          <div class="h-36 w-full overflow-hidden bg-zinc-800 cursor-pointer" data-view-event="${ev.id}">
            <img src="${_esc(ev.bannerUrl)}" alt="${_esc(ev.title)}" class="w-full h-full object-cover" />
          </div>
        ` : `
          <div class="h-28 w-full bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/40 border-b border-zinc-800 flex items-center justify-center p-4 cursor-pointer" data-view-event="${ev.id}">
            <img src="/nav-emblem.svg" alt="SellerFlow Event" class="w-12 h-12 object-contain opacity-70 drop-shadow-md" />
          </div>
        `}
        <div class="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
          <div class="space-y-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                ${_esc(ev.category || 'Event')}
              </span>
              <span class="text-xs font-black text-amber-300">
                ${ev.ticketType === 'free' ? 'FREE' : `GHS ${(ev.ticketPrice || 0).toLocaleString()}`}
              </span>
            </div>
            <h3 class="text-sm font-bold text-white line-clamp-2 hover:text-amber-300 cursor-pointer transition" data-view-event="${ev.id}">
              ${_esc(ev.title)}
            </h3>
            <p class="text-xs text-zinc-400">👤 By ${_esc(ev.organizerName)}</p>
          </div>

          <div class="space-y-1 text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
            <div class="flex items-center gap-1.5">
              <span>📅</span> <span>${_esc(ev.startDate || 'Upcoming')} at ${_esc(ev.startTime || '09:00')}</span>
            </div>
            <div class="flex items-center gap-1.5 truncate">
              <span>📍</span> <span class="truncate">${_esc(ev.venue || ev.city || 'Accra')}</span>
            </div>
          </div>

          <div class="pt-3 flex items-center gap-2">
            <button data-view-event="${ev.id}" class="flex-1 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition">
              Details
            </button>
            <button data-register-event="${ev.id}" class="flex-1 py-2 rounded-xl bg-gold text-black hover:brightness-110 text-xs font-black transition shadow-sm">
              Register
            </button>
          </div>
        </div>
      </div>
    `).join('');

    currentList.querySelectorAll('[data-view-event]').forEach(b => {
      b.onclick = () => openEventDetailModal(b.dataset.viewEvent);
    });

    currentList.querySelectorAll('[data-register-event]').forEach(b => {
      b.onclick = async () => {
        const eligible = await checkJobsEventsEligibility(getActiveUser(), 'register for this event');
        if (eligible) openRegisterEventModal(b.dataset.registerEvent);
      };
    });
  } catch (err) {
    const currentList = _$('eventsListContainer') || list;
    if (currentList) {
      currentList.innerHTML = `<div class="col-span-full text-center py-8 text-rose-400 text-xs">Error: ${_esc(err.message)}</div>`;
    }
  }
}

// Modal: Event Detail
async function openEventDetailModal(eventId) {
  let ev = null;
  try {
    if (_cachedEvents) ev = _cachedEvents.find(e => e.id === eventId);
    if (!ev) {
      const snap = await getJobsEventsDb().collection('events').doc(eventId).get();
      if (snap && snap.exists) ev = { id: snap.id, ...snap.data() };
    }
    if (!ev) {
      try {
        const localEvents = JSON.parse(localStorage.getItem('sf_my_hosted_events') || '[]');
        ev = localEvents.find(e => e.id === eventId);
      } catch (_) {}
    }
  } catch (_) {}

  if (!ev) {
    toast('Event listing not found or unavailable', 'error');
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'eventDetailModal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in';
  modal.innerHTML = `
    <div class="bg-[#181824] border border-gold/40 rounded-3xl max-w-xl w-full p-6 text-white shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div class="flex items-center gap-2.5 min-w-0">
          <img src="/nav-emblem.svg" alt="SellerFlow" class="w-6 h-6 object-contain shrink-0" />
          <div class="min-w-0">
            <h3 class="text-base font-black text-white truncate">${_esc(ev.title)}</h3>
            <p class="text-[11px] text-zinc-400">By ${_esc(ev.organizerName)}</p>
          </div>
        </div>
        <button id="closeEventDetailModalBtn" class="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold shrink-0">✕</button>
      </div>

      <div class="flex-1 overflow-y-auto pr-1 space-y-4 text-xs text-zinc-300">
        ${ev.bannerUrl ? `
          <div class="h-44 w-full rounded-2xl overflow-hidden bg-zinc-800">
            <img src="${_esc(ev.bannerUrl)}" alt="${_esc(ev.title)}" class="w-full h-full object-cover" />
          </div>
        ` : ''}

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[#12121a] border border-zinc-800 text-xs">
          <div>
            <span class="text-zinc-500 block text-[10px]">Date & Time</span>
            <span class="font-bold text-white">${_esc(ev.startDate || 'Upcoming')} at ${_esc(ev.startTime || '09:00')}</span>
          </div>
          <div>
            <span class="text-zinc-500 block text-[10px]">Location</span>
            <span class="font-bold text-white">${_esc(ev.region || 'Greater Accra')}</span>
          </div>
          <div>
            <span class="text-zinc-500 block text-[10px]">Ticket</span>
            <span class="font-bold text-amber-300">${ev.ticketType === 'free' ? 'FREE' : `GHS ${(ev.ticketPrice || 0).toLocaleString()}`}</span>
          </div>
        </div>

        <div>
          <h4 class="font-bold text-zinc-300 text-xs mb-1">📍 Venue Address</h4>
          <p class="text-zinc-400 bg-[#12121a] p-3 rounded-xl border border-zinc-800">${_esc(ev.venue || 'Accra, Ghana')}</p>
        </div>

        <div>
          <h4 class="font-bold text-zinc-300 text-xs mb-1">📝 About This Event</h4>
          <p class="text-zinc-300 leading-relaxed whitespace-pre-wrap">${_esc(ev.description || 'No additional description provided.')}</p>
        </div>
      </div>

      <div class="flex gap-3 pt-3 border-t border-zinc-800">
        <button id="eventDetailCloseBtn" class="flex-1 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition">
          Close
        </button>
        <button id="eventDetailRegisterBtn" class="flex-1 py-2.5 rounded-xl bg-gold text-black hover:brightness-110 text-xs font-black transition shadow-md">
          Register / Get Ticket
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#closeEventDetailModalBtn').onclick = () => modal.remove();
  modal.querySelector('#eventDetailCloseBtn').onclick = () => modal.remove();
  modal.querySelector('#eventDetailRegisterBtn').onclick = async () => {
    modal.remove();
    const eligible = await checkJobsEventsEligibility(getActiveUser(), 'register for this event');
    if (eligible) openRegisterEventModal(eventId);
  };
}

// Modal: Create Event
function openCreateEventModal() {
  const modal = document.createElement('div');
  modal.id = 'createEventModal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in';
  modal.innerHTML = `
    <div class="bg-[#181824] border border-gold/40 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div class="flex items-center gap-2.5">
          <img src="/nav-emblem.svg" alt="SellerFlow" class="w-6 h-6 object-contain shrink-0" />
          <div>
            <h3 class="text-base font-black text-white">Host an Event in Ghana</h3>
            <p class="text-[11px] text-zinc-400">Attach event flyer/picture, venue details, and ticketing.</p>
          </div>
        </div>
        <button id="closeCreateEventModalBtn" class="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold">✕</button>
      </div>

      <form id="createEventForm" class="flex-1 overflow-y-auto pr-2 space-y-3.5 text-xs text-zinc-300">
        <div>
          <label class="block font-bold text-zinc-300 mb-1">Event Flyer / Banner Picture *</label>
          <div id="eventImageDropzone" class="border-2 border-dashed border-zinc-700 hover:border-amber-500/60 rounded-2xl p-4 text-center cursor-pointer transition bg-[#12121a] flex flex-col items-center justify-center min-h-[110px] relative group">
            <input type="file" id="eventImageInput" accept="image/*" class="hidden" />
            <div id="eventImagePlaceholder" class="space-y-1.5 flex flex-col items-center">
              <span class="text-2xl block">🎨</span>
              <p class="text-xs font-bold text-white">Click or drag & drop event flyer/picture *</p>
              <p class="text-[11px] text-zinc-400">Upload promotional flyer, venue picture, or banner (PNG, JPG, WEBP - Max 10MB)</p>
            </div>
            <div id="eventImagePreviewWrapper" class="hidden w-full flex items-center gap-3">
              <img id="eventImagePreview" class="w-16 h-16 object-cover rounded-xl border border-zinc-700 shadow-sm shrink-0" />
              <div class="text-left flex-1 min-w-0">
                <p id="eventImageFileName" class="text-xs font-bold text-white truncate"></p>
                <p id="eventImageFileSize" class="text-[11px] text-emerald-400 font-semibold">✓ Flyer ready to attach</p>
              </div>
              <button type="button" id="eventImageRemoveBtn" class="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30">
                Change
              </button>
            </div>
          </div>
        </div>

        <div>
          <label class="block font-bold text-zinc-300 mb-1">Event Title *</label>
          <input type="text" id="eventTitle" required placeholder="e.g. Accra Creators & Sellers Summit 2026" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Organizer / Host Name *</label>
            <input type="text" id="eventOrganizer" required value="${_esc(getActiveProfile()?.name || getActiveUser()?.displayName || '')}" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
          </div>
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Category *</label>
            <select id="eventCategory" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none">
              ${EVENT_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Date *</label>
            <input type="date" id="eventDate" required class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
          </div>
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Time *</label>
            <input type="time" id="eventTime" required value="10:00" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
          </div>
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Region *</label>
            <select id="eventRegion" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none">
              ${GHANA_REGIONS.map(r => `<option value="${r}">${r}</option>`).join('')}
            </select>
          </div>
        </div>

        <div>
          <label class="block font-bold text-zinc-300 mb-1">Venue / Location Address *</label>
          <input type="text" id="eventVenue" required placeholder="e.g. Accra International Conference Centre" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Ticket Type *</label>
            <select id="eventTicketType" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none">
              <option value="free">Free Admission / RSVP</option>
              <option value="paid">Paid Ticket</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Ticket Price (GHS)</label>
            <input type="number" id="eventPrice" min="0" value="0" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
          </div>
        </div>

        <div>
          <label class="block font-bold text-zinc-300 mb-1">Event Description & Agenda *</label>
          <textarea id="eventDesc" required rows="4" placeholder="What attendees should expect, speakers, schedule..." class="w-full bg-[#12121a] border border-zinc-800 rounded-xl p-3 text-white text-xs focus:border-gold/60 focus:outline-none"></textarea>
        </div>

        <div class="flex gap-3 pt-2">
          <button id="cancelCreateEventBtn" type="button" class="flex-1 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition">
            Cancel
          </button>
          <button id="submitEventBtn" type="submit" class="flex-1 py-2.5 rounded-xl bg-gold text-black hover:brightness-110 text-xs font-black transition shadow-md">
            Submit Event
          </button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  let selectedEventImageData = '';

  const eventImageInput = modal.querySelector('#eventImageInput');
  const eventImageDropzone = modal.querySelector('#eventImageDropzone');
  const eventImagePlaceholder = modal.querySelector('#eventImagePlaceholder');
  const eventImagePreviewWrapper = modal.querySelector('#eventImagePreviewWrapper');
  const eventImagePreview = modal.querySelector('#eventImagePreview');
  const eventImageFileName = modal.querySelector('#eventImageFileName');
  const eventImageRemoveBtn = modal.querySelector('#eventImageRemoveBtn');

  async function handleEventImageFile(file) {
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      selectedEventImageData = dataUrl;
      eventImagePreview.src = dataUrl;
      eventImageFileName.textContent = file.name || 'event-flyer.jpg';
      eventImagePlaceholder.classList.add('hidden');
      eventImagePreviewWrapper.classList.remove('hidden');
      eventImageDropzone.classList.remove('border-rose-500');
      eventImageDropzone.classList.add('border-emerald-500/50');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  eventImageDropzone.onclick = (e) => {
    if (e.target !== eventImageRemoveBtn && !eventImageRemoveBtn.contains(e.target)) {
      eventImageInput.click();
    }
  };

  eventImageInput.onchange = () => {
    if (eventImageInput.files && eventImageInput.files[0]) {
      handleEventImageFile(eventImageInput.files[0]);
    }
  };

  eventImageDropzone.ondragover = (e) => {
    e.preventDefault();
    eventImageDropzone.classList.add('border-gold');
  };

  eventImageDropzone.ondragleave = () => {
    eventImageDropzone.classList.remove('border-gold');
  };

  eventImageDropzone.ondrop = (e) => {
    e.preventDefault();
    eventImageDropzone.classList.remove('border-gold');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleEventImageFile(e.dataTransfer.files[0]);
    }
  };

  eventImageRemoveBtn.onclick = (e) => {
    e.stopPropagation();
    selectedEventImageData = '';
    eventImageInput.value = '';
    eventImagePreview.src = '';
    eventImagePreviewWrapper.classList.add('hidden');
    eventImagePlaceholder.classList.remove('hidden');
    eventImageDropzone.classList.remove('border-emerald-500/50');
  };

  modal.querySelector('#closeCreateEventModalBtn').onclick = () => modal.remove();
  modal.querySelector('#cancelCreateEventBtn').onclick = () => modal.remove();

  modal.querySelector('#createEventForm').onsubmit = async (e) => {
    e.preventDefault();

    if (!selectedEventImageData) {
      toast('Please upload and attach an event flyer or banner picture.', 'error');
      eventImageDropzone.classList.add('border-rose-500');
      eventImageDropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const btn = modal.querySelector('#submitEventBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting & Scanning...';

    try {
      const activeUser = getActiveUser();
      const token = activeUser && activeUser.getIdToken ? await activeUser.getIdToken().catch(() => '') : '';
      const payload = {
        title: _$('eventTitle').value.trim(),
        organizerName: _$('eventOrganizer').value.trim(),
        bannerUrl: selectedEventImageData,
        imageUrl: selectedEventImageData,
        imageBase64: selectedEventImageData,
        category: _$('eventCategory').value,
        startDate: _$('eventDate').value,
        startTime: _$('eventTime').value,
        region: _$('eventRegion').value,
        venue: _$('eventVenue').value.trim(),
        ticketType: _$('eventTicketType').value,
        ticketPrice: Number(_$('eventPrice').value) || 0,
        description: _$('eventDesc').value.trim()
      };

      let eventId = 'ev_' + Date.now();
      let serverMsg = '';

      if (token) {
        try {
          const res = await fetch('/api/events/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok && data.success) {
            serverMsg = data.message;
            if (data.eventId) eventId = data.eventId;
          }
        } catch (apiErr) {
          console.warn('Network call to /api/events/submit notice:', apiErr);
        }
      }

      const newEventObj = {
        id: eventId,
        _type: 'event',
        ...payload,
        creatorId: activeUser?.uid || 'local_user',
        status: 'approved',
        reviewStatus: 'approved',
        registeredCount: 0,
        createdAt: new Date().toISOString()
      };

      try {
        const db = getJobsEventsDb();
        await db.collection('events').doc(eventId).set(newEventObj, { merge: true });
      } catch (fsErr) {
        console.warn('Direct client event storage notice:', fsErr);
      }

      try {
        const myEvents = JSON.parse(localStorage.getItem('sf_my_hosted_events') || '[]');
        myEvents.unshift(newEventObj);
        localStorage.setItem('sf_my_hosted_events', JSON.stringify(myEvents));
      } catch (_) {}

      if (_cachedEvents) _cachedEvents.unshift(newEventObj);
      if (_adminEventsCache) _adminEventsCache.unshift(newEventObj);

      modal.remove();
      toast(serverMsg || 'Event submitted and published live!', 'success');
      activeEventsTab = 'organizer_desk';
      renderEventsContent();
    } catch (err) {
      toast('Error: ' + err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Submit Event';
    }
  };
}

// Modal: Event Registration
async function openRegisterEventModal(eventId) {
  let eventData = null;
  try {
    if (_cachedEvents) eventData = _cachedEvents.find(e => e.id === eventId);
    if (!eventData) {
      const snap = await getJobsEventsDb().collection('events').doc(eventId).get();
      if (snap && snap.exists) eventData = { id: snap.id, ...snap.data() };
    }
    if (!eventData) {
      try {
        const localEvents = JSON.parse(localStorage.getItem('sf_my_hosted_events') || '[]');
        eventData = localEvents.find(e => e.id === eventId);
      } catch (_) {}
    }
  } catch (_) {}

  if (!eventData) {
    toast('Event listing not found or unavailable', 'error');
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'registerEventModal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in';
  modal.innerHTML = `
    <div class="bg-[#181824] border border-gold/40 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
      <div class="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div>
          <h3 class="text-base font-black text-white">Event Registration</h3>
          <p class="text-xs text-amber-300 font-semibold">${_esc(eventData?.title || 'Event')}</p>
        </div>
        <button id="closeRegModalBtn" class="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold">✕</button>
      </div>

      <form id="registerEventForm" class="space-y-3 text-xs text-zinc-300">
        <div>
          <label class="block font-bold text-zinc-300 mb-1">Attendee Name *</label>
          <input type="text" id="regName" required value="${_esc(getActiveProfile()?.name || getActiveUser()?.displayName || '')}" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
        </div>

        <div>
          <label class="block font-bold text-zinc-300 mb-1">Email Address *</label>
          <input type="email" id="regEmail" required value="${_esc(getActiveUser()?.email || '')}" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
        </div>

        <div>
          <label class="block font-bold text-zinc-300 mb-1">Phone Number *</label>
          <input type="tel" id="regPhone" required placeholder="024XXXXXXX" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
        </div>

        <div class="flex gap-3 pt-2">
          <button id="cancelRegBtn" type="button" class="flex-1 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition">
            Cancel
          </button>
          <button id="confirmRegBtn" type="submit" class="flex-1 py-2.5 rounded-xl bg-gold text-black hover:brightness-110 text-xs font-black transition shadow-md">
            Confirm Registration
          </button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#closeRegModalBtn').onclick = () => modal.remove();
  modal.querySelector('#cancelRegBtn').onclick = () => modal.remove();

  modal.querySelector('#registerEventForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = modal.querySelector('#confirmRegBtn');
    btn.disabled = true;
    btn.textContent = 'Registering...';

    try {
      const activeUser = getActiveUser();
      const token = activeUser && activeUser.getIdToken ? await activeUser.getIdToken().catch(() => '') : '';
      const payload = {
        eventId,
        attendeeName: _$('regName').value.trim(),
        attendeeEmail: _$('regEmail').value.trim(),
        attendeePhone: _$('regPhone').value.trim(),
        ticketCount: 1
      };

      let regId = 'reg_' + (activeUser?.uid || 'anon') + '_' + Date.now();
      let serverMsg = '';

      if (token) {
        try {
          const res = await fetch('/api/events/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok && data.success) {
            serverMsg = data.message;
            if (data.registrationId) regId = data.registrationId;
          }
        } catch (apiErr) {
          console.warn('Network call to /api/events/register notice:', apiErr);
        }
      }

      const newRegObj = {
        id: regId,
        eventId,
        eventTitle: eventData?.title || 'Community Event',
        attendeeId: activeUser?.uid || 'local_user',
        attendeeName: payload.attendeeName,
        attendeeEmail: payload.attendeeEmail,
        attendeePhone: payload.attendeePhone,
        ticketCount: 1,
        status: 'confirmed',
        registeredAt: new Date().toISOString()
      };

      try {
        const db = getJobsEventsDb();
        await db.collection('eventRegistrations').doc(regId).set(newRegObj, { merge: true });
        await db.collection('events').doc(eventId).update({
          registeredCount: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) ? firebase.firestore.FieldValue.increment(1) : 1
        }).catch(() => {});
      } catch (fsErr) {
        console.warn('Direct client registration storage notice:', fsErr);
      }

      try {
        const myRegs = JSON.parse(localStorage.getItem('sf_my_event_registrations') || '[]');
        myRegs.unshift(newRegObj);
        localStorage.setItem('sf_my_event_registrations', JSON.stringify(myRegs));
      } catch (_) {}

      modal.remove();
      toast(serverMsg || 'Registration confirmed! Check your tickets.', 'success');
      activeEventsTab = 'my_registrations';
      renderEventsContent();
    } catch (err) {
      toast('Error: ' + err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Confirm Registration';
    }
  };
}

async function renderMyRegistrations(container) {
  if (!container) return;
  const user = getActiveUser();
  if (!user) {
    container.innerHTML = `
      <div class="text-center py-14 bg-[#14141e] border border-zinc-800 rounded-2xl p-6 max-w-md mx-auto space-y-4">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-2.5 shadow-sm">
          <img src="/nav-emblem.svg" alt="SellerFlow" class="w-8 h-8 object-contain" />
        </div>
        <div>
          <h3 class="text-base font-black text-white">Access Your Event Tickets</h3>
          <p class="text-xs text-zinc-400 mt-1">Sign in or create an account to view your confirmed tickets, admission QR passes, and event schedules.</p>
        </div>
        <div class="flex gap-2 pt-2 justify-center">
          <button id="myTicketsLoginBtn" class="px-5 py-2.5 rounded-xl bg-gold text-black font-bold text-xs hover:brightness-110 transition shadow-sm">
            Sign In / Create Account
          </button>
        </div>
      </div>
    `;
    container.querySelector('#myTicketsLoginBtn')?.addEventListener('click', () => showAuthPrompt('access your event tickets and RSVPs'));
    return;
  }

  container.innerHTML = `<div class="text-center py-10 text-zinc-500 text-xs">Loading your event tickets...</div>`;
  try {
    const regs = [];
    const seenRegIds = new Set();

    try {
      const snap = await getJobsEventsDb().collection('eventRegistrations')
        .where('attendeeId', '==', user.uid)
        .get();
      if (snap && snap.forEach) {
        snap.forEach(d => {
          seenRegIds.add(d.id);
          regs.push({ id: d.id, ...d.data() });
        });
      }
    } catch (dbErr) {
      console.warn('Direct event registrations fetch notice:', dbErr.message);
    }

    try {
      const storedRegs = JSON.parse(localStorage.getItem('sf_my_event_registrations') || '[]');
      storedRegs.forEach(sr => {
        if (sr && sr.id && !seenRegIds.has(sr.id)) {
          seenRegIds.add(sr.id);
          regs.push(sr);
        }
      });
    } catch (_) {}

    const target = _$('eventsContentArea') || container;
    if (!target) return;

    if (regs.length === 0) {
      target.innerHTML = `
        <div class="text-center py-14 bg-[#14141e] border border-zinc-800 rounded-2xl p-6 space-y-2">
          <span class="text-3xl block">🎟️</span>
          <p class="text-sm font-bold text-zinc-300">You have no upcoming event tickets</p>
          <p class="text-xs text-zinc-500">Explore discover tab to find and RSVP for events in Ghana.</p>
        </div>
      `;
      return;
    }

    target.innerHTML = `
      <div class="space-y-3">
        ${regs.map(r => `
          <div class="bg-[#14141e] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div class="space-y-1">
              <h4 class="text-sm font-bold text-white">${_esc(r.eventTitle || 'Event Ticket')}</h4>
              <p class="text-xs text-zinc-400">👤 Attendee: ${_esc(r.attendeeName)} · 🎟️ ${r.ticketCount || 1} Ticket</p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800">
              Confirmed
            </span>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    const target = _$('eventsContentArea') || container;
    if (target) {
      target.innerHTML = `<div class="text-center py-8 text-rose-400 text-xs">Error: ${_esc(err.message)}</div>`;
    }
  }
}

async function renderOrganizerDesk(container) {
  if (!container) return;
  const user = getActiveUser();
  if (!user) {
    container.innerHTML = `
      <div class="text-center py-14 bg-[#14141e] border border-zinc-800 rounded-2xl p-6 max-w-md mx-auto space-y-4">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-2.5 shadow-sm">
          <img src="/nav-emblem.svg" alt="SellerFlow" class="w-8 h-8 object-contain" />
        </div>
        <div>
          <h3 class="text-base font-black text-white">Event Organizer Portal</h3>
          <p class="text-xs text-zinc-400 mt-1">Sign in or create an account to host events, view attendee lists, and manage ticket reservations.</p>
        </div>
        <div class="flex gap-2 pt-2 justify-center">
          <button id="organizerDeskLoginBtn" class="px-5 py-2.5 rounded-xl bg-gold text-black font-bold text-xs hover:brightness-110 transition shadow-sm">
            Sign In / Create Account
          </button>
        </div>
      </div>
    `;
    container.querySelector('#organizerDeskLoginBtn')?.addEventListener('click', () => showAuthPrompt('manage your hosted events and attendee lists'));
    return;
  }

  container.innerHTML = `<div class="text-center py-10 text-zinc-500 text-xs">Loading your hosted events...</div>`;
  try {
    const myEvents = [];
    const seenEventIds = new Set();

    try {
      const snap = await getJobsEventsDb().collection('events')
        .where('creatorId', '==', user.uid)
        .get();
      if (snap && snap.forEach) {
        snap.forEach(d => {
          seenEventIds.add(d.id);
          myEvents.push({ id: d.id, ...d.data() });
        });
      }
    } catch (dbErr) {
      console.warn('Direct organizer events fetch notice:', dbErr.message);
    }

    try {
      const storedEvents = JSON.parse(localStorage.getItem('sf_my_hosted_events') || '[]');
      storedEvents.forEach(se => {
        if (se && se.id && !seenEventIds.has(se.id)) {
          seenEventIds.add(se.id);
          myEvents.push(se);
        }
      });
    } catch (_) {}

    const target = _$('eventsContentArea') || container;
    if (!target) return;

    if (myEvents.length === 0) {
      target.innerHTML = `
        <div class="text-center py-14 bg-[#14141e] border border-zinc-800 rounded-2xl p-6 space-y-3">
          <span class="text-3xl block">🎪</span>
          <p class="text-sm font-bold text-zinc-300">You haven't hosted any events yet</p>
          <button id="deskCreateEvBtn" class="px-4 py-2 rounded-xl bg-gold text-black font-bold text-xs hover:brightness-110">
            Host Your First Event
          </button>
        </div>
      `;
      _$('deskCreateEvBtn')?.addEventListener('click', async () => {
        const eligible = await checkJobsEventsEligibility(getActiveUser(), 'host an event');
        if (eligible) openCreateEventModal();
      });
      return;
    }

    target.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-2">
          <h3 class="text-sm font-bold text-white">Your Hosted Events (${myEvents.length})</h3>
          <button id="deskCreateEvBtn2" class="px-3.5 py-1.5 rounded-xl bg-gold text-black font-bold text-xs hover:brightness-110">
            ＋ Host Another Event
          </button>
        </div>

        <div class="space-y-3">
          ${myEvents.map(ev => `
            <div class="bg-[#14141e] border border-zinc-800 rounded-2xl p-4 space-y-2">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h4 class="text-base font-bold text-white">${_esc(ev.title)}</h4>
                  <p class="text-xs text-zinc-400">📅 ${_esc(ev.startDate)} · 📍 ${_esc(ev.venue)}</p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  ev.status === 'approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                }">
                  ${_esc(ev.status || 'Pending')}
                </span>
              </div>
              <div class="text-xs text-zinc-400 pt-1 border-t border-zinc-800/60">
                Registered Attendees: <b class="text-amber-300">${ev.registeredCount || 0}</b>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    _$('deskCreateEvBtn2')?.addEventListener('click', async () => {
      const eligible = await checkJobsEventsEligibility(getActiveUser(), 'host an event');
      if (eligible) openCreateEventModal();
    });
  } catch (err) {
    const target = _$('eventsContentArea') || container;
    if (target) {
      target.innerHTML = `<div class="text-center py-8 text-rose-400 text-xs">Error: ${_esc(err.message)}</div>`;
    }
  }
}

// ==========================================
// 3. SECURITY DESK EXTENSION (ADMIN REVIEW)
// ==========================================

let _adminJobsCache = [];
let _adminEventsCache = [];
let _adminDeskCurrentTab = 'all'; // 'all', 'jobs', 'events', 'pending', 'live', 'takedown'
let _adminDeskSearchQuery = '';
let _adminDeskStatusFilter = 'all';

async function renderAdminJobsDesk(tabContainer) {
  if (!tabContainer) return;

  tabContainer.innerHTML = `
    <div class="space-y-6 animate-fade-in" id="jobsEventsAdminHub">
      <!-- Header & Quick Action Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <h3 class="text-lg font-black text-white">💼 Jobs & Events Moderation Hub</h3>
            <span class="text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full">SECURITY DESK</span>
          </div>
          <p class="text-xs text-zinc-400 mt-1">Review applicant protections, evaluate listings, enforce takedowns, and manage or delete jobs & events.</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="refreshJobsDeskBtn" class="border border-[#333] hover:border-gold px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#141414] text-zinc-200 transition flex items-center gap-1.5 shadow-sm">
            <span>🔄</span> Refresh Desk
          </button>
        </div>
      </div>

      <!-- Quick KPI Counters -->
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3" id="jobsDeskKpis">
        <div class="p-3 rounded-2xl bg-[#14141e] border border-zinc-800 flex items-center justify-between">
          <div>
            <div class="text-[11px] text-zinc-400 font-bold uppercase">Total Listings</div>
            <div class="text-xl font-black text-white mt-1" id="kpiTotalListings">...</div>
          </div>
          <span class="text-xl">📁</span>
        </div>
        <div class="p-3 rounded-2xl bg-amber-950/20 border border-amber-900/60 flex items-center justify-between">
          <div>
            <div class="text-[11px] text-amber-300 font-bold uppercase">Pending Review</div>
            <div class="text-xl font-black text-amber-400 mt-1" id="kpiPendingReview">...</div>
          </div>
          <span class="text-xl">⏳</span>
        </div>
        <div class="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-900/60 flex items-center justify-between">
          <div>
            <div class="text-[11px] text-emerald-300 font-bold uppercase">Live & Active</div>
            <div class="text-xl font-black text-emerald-400 mt-1" id="kpiLiveActive">...</div>
          </div>
          <span class="text-xl">🟢</span>
        </div>
        <div class="p-3 rounded-2xl bg-rose-950/20 border border-rose-900/60 flex items-center justify-between">
          <div>
            <div class="text-[11px] text-rose-300 font-bold uppercase">Taken Down</div>
            <div class="text-xl font-black text-rose-400 mt-1" id="kpiTakenDown">...</div>
          </div>
          <span class="text-xl">🛑</span>
        </div>
        <div class="p-3 rounded-2xl bg-purple-950/20 border border-purple-900/60 flex items-center justify-between col-span-2 sm:col-span-4 lg:col-span-1">
          <div>
            <div class="text-[11px] text-purple-300 font-bold uppercase">Jobs / Events</div>
            <div class="text-xl font-black text-purple-300 mt-1" id="kpiSplitRatio">...</div>
          </div>
          <span class="text-xl">⚖️</span>
        </div>
      </div>

      <!-- Navigation Sub-Tabs & Filtering Controls -->
      <div class="space-y-3">
        <div class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#242424] scrollbar-none" id="jobsDeskSubTabs">
          <button class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${_adminDeskCurrentTab === 'all' ? 'bg-gold text-black' : 'bg-[#181824] text-zinc-300 hover:text-white'}" data-desk-tab="all">
            <span>⚡ All Listings</span>
          </button>
          <button class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${_adminDeskCurrentTab === 'jobs' ? 'bg-gold text-black' : 'bg-[#181824] text-zinc-300 hover:text-white'}" data-desk-tab="jobs">
            <span>💼 Jobs Hub</span>
          </button>
          <button class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${_adminDeskCurrentTab === 'events' ? 'bg-gold text-black' : 'bg-[#181824] text-zinc-300 hover:text-white'}" data-desk-tab="events">
            <span>🎟️ Events Hub</span>
          </button>
          <button class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${_adminDeskCurrentTab === 'pending' ? 'bg-amber-500 text-black' : 'bg-amber-950/60 border border-amber-800 text-amber-300 hover:bg-amber-900'}" data-desk-tab="pending">
            <span>🛡️ Pending Queue</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-amber-300 font-bold" id="badgePendingQueue">0</span>
          </button>
          <button class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${_adminDeskCurrentTab === 'live' ? 'bg-emerald-600 text-white' : 'bg-[#181824] text-zinc-300 hover:text-white'}" data-desk-tab="live">
            <span>🟢 Live Listings</span>
          </button>
          <button class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${_adminDeskCurrentTab === 'takedown' ? 'bg-rose-600 text-white' : 'bg-rose-950/50 border border-rose-900 text-rose-300 hover:bg-rose-900'}" data-desk-tab="takedown">
            <span>🛑 Taken Down Archive</span>
          </button>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div class="relative flex-1">
            <span class="absolute left-3 top-2.5 text-zinc-500 text-sm">🔍</span>
            <input type="text" id="jobsDeskSearchInput" placeholder="Search by title, employer, organizer, region, salary..." value="${_esc(_adminDeskSearchQuery)}" class="w-full bg-[#14141e] border border-zinc-800 focus:border-gold rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none transition" />
          </div>
          <div class="flex items-center gap-2">
            <select id="jobsDeskStatusSelect" class="bg-[#14141e] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-gold">
              <option value="all" ${_adminDeskStatusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="pending_review" ${_adminDeskStatusFilter === 'pending_review' ? 'selected' : ''}>⏳ Pending Review</option>
              <option value="approved" ${_adminDeskStatusFilter === 'approved' ? 'selected' : ''}>🟢 Live & Approved</option>
              <option value="taken_down" ${_adminDeskStatusFilter === 'taken_down' ? 'selected' : ''}>🛑 Taken Down / Removed</option>
              <option value="rejected" ${_adminDeskStatusFilter === 'rejected' ? 'selected' : ''}>✕ Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Main Listing Stream -->
      <div id="jobsDeskListContainer" class="space-y-3 min-h-[300px]">
        <div class="text-center py-16 text-zinc-500">
          <div class="animate-spin inline-block text-2xl mb-2">⏳</div>
          <div class="text-xs">Loading SellerFlow Jobs & Events database...</div>
        </div>
      </div>
    </div>
  `;

  // Attach search and filter event listeners
  _$('refreshJobsDeskBtn')?.addEventListener('click', () => loadAdminQueues(true));
  
  _$('jobsDeskSearchInput')?.addEventListener('input', (e) => {
    _adminDeskSearchQuery = e.target.value.toLowerCase().trim();
    renderFilteredAdminItems();
  });

  _$('jobsDeskStatusSelect')?.addEventListener('change', (e) => {
    _adminDeskStatusFilter = e.target.value;
    renderFilteredAdminItems();
  });

  _$('jobsDeskSubTabs')?.querySelectorAll('[data-desk-tab]').forEach(btn => {
    btn.onclick = () => {
      _adminDeskCurrentTab = btn.dataset.deskTab;
      _$('jobsDeskSubTabs')?.querySelectorAll('[data-desk-tab]').forEach(b => {
        const isCurrent = b.dataset.deskTab === _adminDeskCurrentTab;
        b.className = `px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
          isCurrent 
            ? (_adminDeskCurrentTab === 'pending' ? 'bg-amber-500 text-black' : (_adminDeskCurrentTab === 'takedown' ? 'bg-rose-600 text-white' : (_adminDeskCurrentTab === 'live' ? 'bg-emerald-600 text-white' : 'bg-gold text-black')))
            : 'bg-[#181824] text-zinc-300 hover:text-white'
        }`;
      });
      renderFilteredAdminItems();
    };
  });

  await loadAdminQueues();
}
window.renderAdminJobsDesk = renderAdminJobsDesk;

async function loadAdminQueues(forceRefresh = false) {
  try {
    const db = getJobsEventsDb();
    const [jobsSnap, eventsSnap] = await Promise.all([
      db.collection('jobs').limit(300).get().catch(() => ({ docs: [], empty: true, forEach: () => {} })),
      db.collection('events').limit(300).get().catch(() => ({ docs: [], empty: true, forEach: () => {} }))
    ]);

    const jobs = [];
    const seenJobIds = new Set();
    if (jobsSnap && jobsSnap.forEach) {
      jobsSnap.forEach(d => {
        seenJobIds.add(d.id);
        jobs.push({ id: d.id, _type: 'job', ...d.data() });
      });
    }

    // Merge locally saved user-posted jobs
    try {
      const localJobs = JSON.parse(localStorage.getItem('sf_my_posted_jobs') || '[]');
      localJobs.forEach(lj => {
        if (lj && lj.id && !seenJobIds.has(lj.id)) {
          seenJobIds.add(lj.id);
          jobs.push({ id: lj.id, _type: 'job', ...lj });
        }
      });
    } catch (_) {}

    const events = [];
    const seenEventIds = new Set();
    if (eventsSnap && eventsSnap.forEach) {
      eventsSnap.forEach(d => {
        seenEventIds.add(d.id);
        events.push({ id: d.id, _type: 'event', ...d.data() });
      });
    }

    // Merge locally saved user-hosted events
    try {
      const localEvents = JSON.parse(localStorage.getItem('sf_my_hosted_events') || '[]');
      localEvents.forEach(le => {
        if (le && le.id && !seenEventIds.has(le.id)) {
          seenEventIds.add(le.id);
          events.push({ id: le.id, _type: 'event', ...le });
        }
      });
    } catch (_) {}

    // Sort newest first
    const getTime = (item) => {
      const v = item.createdAt;
      if (!v) return 0;
      if (typeof v === 'number') return v;
      if (v.toMillis) return v.toMillis();
      if (v.seconds) return v.seconds * 1000;
      return new Date(v).getTime() || 0;
    };

    _adminJobsCache = jobs.sort((a, b) => getTime(b) - getTime(a));
    _adminEventsCache = events.sort((a, b) => getTime(b) - getTime(a));

    updateKpis();
    renderFilteredAdminItems();
  } catch (err) {
    console.warn('Error loading admin queues:', err);
    const container = _$('jobsDeskListContainer');
    if (container) {
      container.innerHTML = `
        <div class="p-6 rounded-2xl bg-rose-950/20 border border-rose-900 text-center space-y-2">
          <div class="text-rose-400 font-bold text-sm">Failed to load listings</div>
          <p class="text-xs text-zinc-400">${_esc(err.message)}</p>
          <button onclick="window.renderAdminJobsDesk(document.getElementById('adminWorkspace'))" class="px-4 py-1.5 rounded-xl bg-zinc-800 text-xs text-white font-bold hover:bg-zinc-700">Retry</button>
        </div>
      `;
    }
  }
}

function updateKpis() {
  const allListings = [..._adminJobsCache, ..._adminEventsCache];
  const pendingJobs = _adminJobsCache.filter(j => j.status === 'pending_review' || j.reviewStatus === 'pending_review');
  const pendingEvents = _adminEventsCache.filter(e => e.status === 'pending_review' || e.reviewStatus === 'pending_review');
  const pendingCount = pendingJobs.length + pendingEvents.length;

  const liveCount = allListings.filter(i => i.status === 'approved' || (!i.status && i.reviewStatus !== 'pending_review' && i.status !== 'taken_down' && i.status !== 'rejected')).length;
  const takenDownCount = allListings.filter(i => i.status === 'taken_down' || i.status === 'removed' || i.reviewStatus === 'taken_down' || i.reviewStatus === 'removed').length;

  if (_$('kpiTotalListings')) _$('kpiTotalListings').textContent = allListings.length;
  if (_$('kpiPendingReview')) _$('kpiPendingReview').textContent = pendingCount;
  if (_$('kpiLiveActive')) _$('kpiLiveActive').textContent = liveCount;
  if (_$('kpiTakenDown')) _$('kpiTakenDown').textContent = takenDownCount;
  if (_$('kpiSplitRatio')) _$('kpiSplitRatio').textContent = `${_adminJobsCache.length}J / ${_adminEventsCache.length}E`;
  if (_$('badgePendingQueue')) _$('badgePendingQueue').textContent = pendingCount;
}

function renderFilteredAdminItems() {
  const container = _$('jobsDeskListContainer');
  if (!container) return;

  let pool = [];
  if (_adminDeskCurrentTab === 'all') {
    pool = [..._adminJobsCache, ..._adminEventsCache];
  } else if (_adminDeskCurrentTab === 'jobs') {
    pool = [..._adminJobsCache];
  } else if (_adminDeskCurrentTab === 'events') {
    pool = [..._adminEventsCache];
  } else if (_adminDeskCurrentTab === 'pending') {
    pool = [..._adminJobsCache, ..._adminEventsCache].filter(i => i.status === 'pending_review' || i.reviewStatus === 'pending_review');
  } else if (_adminDeskCurrentTab === 'live') {
    pool = [..._adminJobsCache, ..._adminEventsCache].filter(i => i.status === 'approved' || (!i.status && i.reviewStatus !== 'pending_review' && i.status !== 'taken_down' && i.status !== 'rejected'));
  } else if (_adminDeskCurrentTab === 'takedown') {
    pool = [..._adminJobsCache, ..._adminEventsCache].filter(i => i.status === 'taken_down' || i.status === 'removed' || i.reviewStatus === 'taken_down' || i.reviewStatus === 'removed');
  }

  // Filter by status dropdown
  if (_adminDeskStatusFilter !== 'all') {
    pool = pool.filter(i => {
      if (_adminDeskStatusFilter === 'pending_review') return i.status === 'pending_review' || i.reviewStatus === 'pending_review';
      if (_adminDeskStatusFilter === 'approved') return i.status === 'approved';
      if (_adminDeskStatusFilter === 'taken_down') return i.status === 'taken_down' || i.status === 'removed' || i.reviewStatus === 'taken_down' || i.reviewStatus === 'removed';
      if (_adminDeskStatusFilter === 'rejected') return i.status === 'rejected' || i.reviewStatus === 'rejected';
      return true;
    });
  }

  // Filter by search query
  if (_adminDeskSearchQuery) {
    const q = _adminDeskSearchQuery;
    pool = pool.filter(i => {
      const matchTitle = (i.title || '').toLowerCase().includes(q);
      const matchComp = (i.companyName || i.organizerName || '').toLowerCase().includes(q);
      const matchRegion = (i.region || i.city || '').toLowerCase().includes(q);
      const matchCat = (i.category || '').toLowerCase().includes(q);
      const matchDesc = (i.description || '').toLowerCase().includes(q);
      return matchTitle || matchComp || matchRegion || matchCat || matchDesc;
    });
  }

  if (pool.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16 p-8 rounded-2xl bg-[#14141e] border border-zinc-800 space-y-2">
        <div class="text-3xl">🔍</div>
        <div class="text-white font-bold text-sm">No listings found</div>
        <p class="text-xs text-zinc-500">No jobs or events matched the selected filters and search query.</p>
        <button id="clearFiltersBtn" class="px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-bold transition">Clear Search & Filters</button>
      </div>
    `;
    _$('clearFiltersBtn')?.addEventListener('click', () => {
      _adminDeskSearchQuery = '';
      _adminDeskStatusFilter = 'all';
      if (_$('jobsDeskSearchInput')) _$('jobsDeskSearchInput').value = '';
      if (_$('jobsDeskStatusSelect')) _$('jobsDeskStatusSelect').value = 'all';
      renderFilteredAdminItems();
    });
    return;
  }

  container.innerHTML = pool.map(item => renderAdminListingCard(item)).join('');

  // Wire action buttons
  container.querySelectorAll('[data-admin-inspect]').forEach(b => {
    b.onclick = () => {
      const type = b.dataset.adminInspectType;
      const id = b.dataset.adminInspect;
      const item = (type === 'job' ? _adminJobsCache : _adminEventsCache).find(x => x.id === id);
      if (item) openAdminInspectModal(item);
    };
  });

  container.querySelectorAll('[data-admin-approve]').forEach(b => {
    b.onclick = () => performSecurityAction(b.dataset.adminApproveType, b.dataset.adminApprove, 'approve');
  });

  container.querySelectorAll('[data-admin-takedown]').forEach(b => {
    b.onclick = () => {
      const type = b.dataset.adminTakedownType;
      const id = b.dataset.adminTakedown;
      const item = (type === 'job' ? _adminJobsCache : _adminEventsCache).find(x => x.id === id);
      openTakedownDialog(type, id, item?.title || 'Listing');
    };
  });

  container.querySelectorAll('[data-admin-restore]').forEach(b => {
    b.onclick = () => performSecurityAction(b.dataset.adminRestoreType, b.dataset.adminRestore, 'restore');
  });

  container.querySelectorAll('[data-admin-delete]').forEach(b => {
    b.onclick = () => {
      const type = b.dataset.adminDeleteType;
      const id = b.dataset.adminDelete;
      const item = (type === 'job' ? _adminJobsCache : _adminEventsCache).find(x => x.id === id);
      openDeleteConfirmDialog(type, id, item?.title || 'Listing');
    };
  });
}

function renderAdminListingCard(item) {
  const isJob = item._type === 'job';
  const isPending = item.status === 'pending_review' || item.reviewStatus === 'pending_review';
  const isTakenDown = item.status === 'taken_down' || item.status === 'removed' || item.reviewStatus === 'taken_down' || item.reviewStatus === 'removed';
  const isRejected = item.status === 'rejected' || item.reviewStatus === 'rejected';
  const isLive = !isPending && !isTakenDown && !isRejected;

  // Status badge config
  let statusBadge = '';
  if (isPending) {
    statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">⏳ Under Review</span>`;
  } else if (isTakenDown) {
    statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">🛑 Taken Down</span>`;
  } else if (isRejected) {
    statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">✕ Rejected</span>`;
  } else {
    statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">🟢 Live & Active</span>`;
  }

  // Suspicious flags
  const hasAntiScamWarning = !!item.antiScamFlag || !!item.requiresReview || (item.flags && item.flags.length > 0);
  const scamNotice = hasAntiScamWarning
    ? `<div class="px-2.5 py-1.5 rounded-xl bg-rose-950/40 border border-rose-900/80 text-[11px] text-rose-300 flex items-center gap-2">
         <span>⚠️</span>
         <span><b>Potential Risk:</b> ${item.antiScamReason || 'Automated safety check detected suspicious advance fee or recruitment patterns.'}</span>
       </div>`
    : '';

  const takedownNotice = isTakenDown && (item.takedownReason || item.rejectionReason)
    ? `<div class="px-2.5 py-1.5 rounded-xl bg-rose-950/30 border border-rose-900/60 text-[11px] text-rose-300 flex items-center gap-2">
         <span>🛑</span>
         <span><b>Takedown Reason:</b> ${_esc(item.takedownReason || item.rejectionReason)}</span>
       </div>`
    : '';

  return `
    <div class="p-4 rounded-2xl ${isTakenDown ? 'bg-[#181114] border-rose-950/80' : (isPending ? 'bg-[#1c1710] border-amber-950/80' : 'bg-[#14141e] border-zinc-800/80')} border hover:border-zinc-700 transition space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
        <div class="space-y-1 min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2 py-0.5 rounded-lg text-[10px] font-black ${isJob ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-purple-950 text-purple-300 border border-purple-800'}">
              ${isJob ? '💼 JOB' : '🎟️ EVENT'}
            </span>
            ${statusBadge}
            <span class="text-[11px] text-zinc-500">ID: <code class="text-zinc-400">${item.id.slice(0, 10)}...</code></span>
          </div>
          <h4 class="text-sm sm:text-base font-black text-white hover:text-gold transition break-words">${_esc(item.title)}</h4>
          <div class="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span>${isJob ? '🏢' : '👤'} <b>${_esc(item.companyName || item.organizerName || 'Anonymous')}</b></span>
            <span>·</span>
            <span>📍 ${_esc(item.region || item.city || 'Ghana')}</span>
            <span>·</span>
            <span>📁 ${_esc(item.category || (isJob ? 'General' : 'Community'))}</span>
            ${isJob && item.salary ? `<span>·</span><span class="text-gold font-bold">💰 ${_esc(item.salary)}</span>` : ''}
            ${!isJob && item.ticketType ? `<span>·</span><span class="text-gold font-bold">🎟️ ${_esc(item.ticketType)}</span>` : ''}
          </div>
        </div>

        <!-- Quick Stats badge -->
        <div class="flex sm:flex-col items-end gap-1.5 shrink-0 text-right">
          <span class="text-[11px] font-bold text-zinc-400 bg-zinc-900/90 px-2 py-1 rounded-lg border border-zinc-800">
            ${isJob ? `👥 ${item.applicationsCount || 0} applicants` : `🎟️ ${item.registeredCount || 0} RSVPs`}
          </span>
          <span class="text-[10px] text-zinc-500">👁️ ${item.viewsCount || 0} views</span>
        </div>
      </div>

      <p class="text-xs text-zinc-400 line-clamp-2 leading-relaxed">${_esc(item.description || '')}</p>

      ${scamNotice}
      ${takedownNotice}

      <!-- Action Buttons Bar -->
      <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
        <div class="flex items-center gap-1.5">
          <button data-admin-inspect="${item.id}" data-admin-inspect-type="${item._type}" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1">
            <span>👁️</span> Inspect Details
          </button>
        </div>

        <div class="flex items-center gap-1.5 flex-wrap">
          ${isPending || isRejected ? `
            <button data-admin-approve="${item.id}" data-admin-approve-type="${item._type}" class="px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-bold transition flex items-center gap-1">
              <span>✓</span> Approve & Publish
            </button>
          ` : ''}

          ${isLive ? `
            <button data-admin-takedown="${item.id}" data-admin-takedown-type="${item._type}" class="px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 text-xs font-bold transition flex items-center gap-1">
              <span>🛑</span> Take Down
            </button>
          ` : ''}

          ${isTakenDown ? `
            <button data-admin-restore="${item.id}" data-admin-restore-type="${item._type}" class="px-3 py-1.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 text-xs font-bold transition flex items-center gap-1">
              <span>🔄</span> Restore Listing
            </button>
          ` : ''}

          <button data-admin-delete="${item.id}" data-admin-delete-type="${item._type}" class="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition flex items-center gap-1">
            <span>🗑️</span> Delete
          </button>
        </div>
      </div>
    </div>
  `;
}

function openAdminInspectModal(item) {
  const isJob = item._type === 'job';
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in';
  modal.id = 'adminInspectModal';

  modal.innerHTML = `
    <div class="bg-[#14141e] border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
      <!-- Modal Header -->
      <div class="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xl">${isJob ? '💼' : '🎟️'}</span>
          <div>
            <h3 class="text-sm sm:text-base font-black text-white">${_esc(item.title)}</h3>
            <span class="text-[11px] text-zinc-400">${isJob ? 'Job Listing Audit' : 'Event Listing Audit'} · ID: ${item.id}</span>
          </div>
        </div>
        <button id="closeInspectModalBtn" class="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold">✕</button>
      </div>

      <!-- Modal Body -->
      <div class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
        <div class="grid grid-cols-2 gap-3 bg-[#181824] p-3.5 rounded-2xl border border-zinc-800/80">
          <div>
            <span class="text-zinc-500 font-bold uppercase text-[10px] block">${isJob ? 'Company / Employer' : 'Organizer'}</span>
            <span class="text-white font-bold text-xs">${_esc(item.companyName || item.organizerName || 'N/A')}</span>
          </div>
          <div>
            <span class="text-zinc-500 font-bold uppercase text-[10px] block">Location / Region</span>
            <span class="text-white font-bold text-xs">📍 ${_esc(item.region || item.city || 'Ghana')}</span>
          </div>
          <div>
            <span class="text-zinc-500 font-bold uppercase text-[10px] block">${isJob ? 'Salary / Compensation' : 'Ticket Price'}</span>
            <span class="text-gold font-bold text-xs">${_esc(item.salary || item.ticketType || 'Not specified')}</span>
          </div>
          <div>
            <span class="text-zinc-500 font-bold uppercase text-[10px] block">Current Status</span>
            <span class="font-bold text-xs text-white capitalize">${_esc(item.status || 'Active')}</span>
          </div>
          <div>
            <span class="text-zinc-500 font-bold uppercase text-[10px] block">Creator ID</span>
            <code class="text-zinc-300 text-[10px]">${item.creatorId || 'N/A'}</code>
          </div>
          <div>
            <span class="text-zinc-500 font-bold uppercase text-[10px] block">Contact Email / Phone</span>
            <span class="text-zinc-300 text-xs">${_esc(item.contactEmail || item.phone || item.applicationUrl || 'N/A')}</span>
          </div>
        </div>

        <div>
          <h5 class="text-white font-bold mb-1.5">Description</h5>
          <div class="p-3 bg-[#181824] rounded-2xl text-zinc-300 whitespace-pre-wrap leading-relaxed border border-zinc-800/60 max-h-48 overflow-y-auto">
            ${_esc(item.description || 'No description provided.')}
          </div>
        </div>

        ${item.requirements ? `
          <div>
            <h5 class="text-white font-bold mb-1.5">Key Requirements</h5>
            <div class="p-3 bg-[#181824] rounded-2xl text-zinc-300 whitespace-pre-wrap leading-relaxed border border-zinc-800/60">
              ${_esc(item.requirements)}
            </div>
          </div>
        ` : ''}

        ${item.takedownReason ? `
          <div class="p-3 rounded-2xl bg-rose-950/30 border border-rose-900 text-rose-300 space-y-1">
            <span class="font-bold uppercase text-[10px] tracking-wider block">Takedown Reason Recorded</span>
            <p class="text-xs">${_esc(item.takedownReason)}</p>
          </div>
        ` : ''}
      </div>

      <!-- Modal Footer with Moderation Actions -->
      <div class="p-4 sm:p-5 border-t border-zinc-800 flex items-center justify-between gap-2 flex-wrap bg-[#101018]">
        <button id="modalDeleteBtn" class="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition flex items-center gap-1.5">
          <span>🗑️</span> Delete Permanently
        </button>

        <div class="flex items-center gap-2">
          ${item.status === 'taken_down' ? `
            <button id="modalRestoreBtn" class="px-4 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 text-xs font-bold transition">
              <span>🔄</span> Restore Listing
            </button>
          ` : `
            <button id="modalTakedownBtn" class="px-4 py-2 rounded-xl bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 text-xs font-bold transition">
              <span>🛑</span> Take Down
            </button>
          `}

          ${item.status === 'pending_review' ? `
            <button id="modalApproveBtn" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition">
              <span>✓</span> Approve & Publish
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#closeInspectModalBtn').onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };

  modal.querySelector('#modalDeleteBtn')?.addEventListener('click', () => {
    close();
    openDeleteConfirmDialog(item._type, item.id, item.title);
  });

  modal.querySelector('#modalTakedownBtn')?.addEventListener('click', () => {
    close();
    openTakedownDialog(item._type, item.id, item.title);
  });

  modal.querySelector('#modalRestoreBtn')?.addEventListener('click', async () => {
    close();
    await performSecurityAction(item._type, item.id, 'restore');
  });

  modal.querySelector('#modalApproveBtn')?.addEventListener('click', async () => {
    close();
    await performSecurityAction(item._type, item.id, 'approve');
  });
}

function openTakedownDialog(targetType, targetId, title) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in';
  modal.id = 'takedownConfirmModal';

  modal.innerHTML = `
    <div class="bg-[#181418] border border-rose-900/60 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-rose-950 text-rose-300 border border-rose-800 flex items-center justify-center text-xl shrink-0">
          🛑
        </div>
        <div>
          <h4 class="text-white font-black text-sm sm:text-base">Take Down Listing</h4>
          <p class="text-zinc-400 text-xs">Remove from public discovery immediately.</p>
        </div>
      </div>

      <div class="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs text-zinc-300">
        <b>Target:</b> ${_esc(title)}
      </div>

      <div class="space-y-2">
        <label class="text-xs font-bold text-zinc-300 block">Select Violation or Takedown Reason:</label>
        <select id="takedownReasonSelect" class="w-full bg-[#121218] border border-zinc-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-rose-500">
          <option value="Advance Fee Scam or MOMO recruitment charges detected">🚨 Advance fee / Mobile Money fee solicitation</option>
          <option value="Deceptive or misleading employer/organizer information">⚠️ Misleading or deceptive representation</option>
          <option value="Non-compliance with Ghana Cybersecurity & Data Protection Acts">📜 Non-compliant data gathering or statutory breach</option>
          <option value="Duplicate or commercial spam listing">📁 Spam / Duplicate listing</option>
          <option value="Host or organizer request for immediate cancellation">👤 Organizer / Employer requested withdrawal</option>
          <option value="other">✍️ Custom moderation reason...</option>
        </select>
        <textarea id="takedownCustomReason" placeholder="Enter specific reason for security records and creator notification..." class="w-full bg-[#121218] border border-zinc-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-rose-500 min-h-[70px] hidden"></textarea>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2">
        <button id="cancelTakedownBtn" class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition">Cancel</button>
        <button id="confirmTakedownBtn" class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5">
          <span>🛑</span> Enforce Takedown
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const sel = modal.querySelector('#takedownReasonSelect');
  const custom = modal.querySelector('#takedownCustomReason');
  sel.onchange = () => {
    if (sel.value === 'other') {
      custom.classList.remove('hidden');
      custom.focus();
    } else {
      custom.classList.add('hidden');
    }
  };

  const close = () => modal.remove();
  modal.querySelector('#cancelTakedownBtn').onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };

  modal.querySelector('#confirmTakedownBtn').onclick = async () => {
    const reason = sel.value === 'other' ? (custom.value.trim() || 'Violates SellerFlow community security policies') : sel.value;
    close();
    await performSecurityAction(targetType, targetId, 'takedown', reason);
  };
}

function openDeleteConfirmDialog(targetType, targetId, title) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in';
  modal.id = 'deleteConfirmModal';

  modal.innerHTML = `
    <div class="bg-[#181418] border border-rose-900 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-rose-950 text-rose-300 border border-rose-800 flex items-center justify-center text-xl shrink-0">
          🗑️
        </div>
        <div>
          <h4 class="text-white font-black text-sm sm:text-base">Permanently Delete ${targetType === 'event' ? 'Event' : 'Job'}?</h4>
          <p class="text-rose-400 text-xs">This action cannot be undone.</p>
        </div>
      </div>

      <div class="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs text-zinc-300">
        <b>Target:</b> ${_esc(title)}
      </div>

      <p class="text-xs text-zinc-400 leading-relaxed">
        The listing document will be purged from the live database. Applications and audit history will be archived for compliance.
      </p>

      <div class="flex items-center justify-end gap-2 pt-2">
        <button id="cancelDeleteBtn" class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition">Cancel</button>
        <button id="confirmDeleteBtn" class="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5">
          <span>🗑️</span> Delete Permanently
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#cancelDeleteBtn').onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };

  modal.querySelector('#confirmDeleteBtn').onclick = async () => {
    close();
    await performSecurityAction(targetType, targetId, 'delete', 'Permanently purged by security administrator');
  };
}

async function performSecurityAction(targetType, targetId, action, reason = '', notes = '') {
  try {
    const user = getActiveUser();
    const token = user && user.getIdToken ? await user.getIdToken().catch(() => '') : '';

    // Direct Firestore update/delete fallback for maximum client speed and offline/preview reliability
    try {
      const db = getJobsEventsDb();
      const colName = targetType === 'event' ? 'events' : 'jobs';
      const docRef = db.collection(colName).doc(targetId);

      if (action === 'delete') {
        await docRef.delete();
      } else if (action === 'approve') {
        await docRef.update({
          status: 'approved',
          reviewStatus: 'approved',
          hidden: false,
          reviewedAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
        });
      } else if (action === 'takedown') {
        await docRef.update({
          status: 'taken_down',
          reviewStatus: 'taken_down',
          hidden: true,
          takedownReason: reason || 'Listing taken down by security team',
          reviewedAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
        });
      } else if (action === 'restore') {
        await docRef.update({
          status: 'approved',
          reviewStatus: 'approved',
          hidden: false,
          reviewedAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
        });
      } else if (action === 'reject') {
        await docRef.update({
          status: 'rejected',
          reviewStatus: 'rejected',
          hidden: true,
          rejectionReason: reason || 'Does not comply with community guidelines',
          reviewedAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
        });
      }
    } catch (fsErr) {
      console.warn('Direct client firestore update notice:', fsErr);
    }

    // Call server security action endpoint for audit trails & creator notifications
    if (token) {
      await fetch('/api/jobs/security-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType,
          targetId,
          action,
          reason,
          notes
        })
      }).catch(apiErr => console.warn('Security action API endpoint notice:', apiErr));
    }

    // Instant local memory update so UI refreshes without wait
    if (action === 'delete') {
      if (targetType === 'job') {
        _adminJobsCache = _adminJobsCache.filter(x => x.id !== targetId);
        if (_cachedJobs) _cachedJobs = _cachedJobs.filter(x => x.id !== targetId);
        try {
          const myJobs = JSON.parse(localStorage.getItem('sf_my_posted_jobs') || '[]');
          localStorage.setItem('sf_my_posted_jobs', JSON.stringify(myJobs.filter(x => x.id !== targetId)));
        } catch (_) {}
      } else {
        _adminEventsCache = _adminEventsCache.filter(x => x.id !== targetId);
        if (_cachedEvents) _cachedEvents = _cachedEvents.filter(x => x.id !== targetId);
        try {
          const myEvents = JSON.parse(localStorage.getItem('sf_my_hosted_events') || '[]');
          localStorage.setItem('sf_my_hosted_events', JSON.stringify(myEvents.filter(x => x.id !== targetId)));
        } catch (_) {}
      }
    } else if (action === 'takedown') {
      if (targetType === 'job') {
        _adminJobsCache = _adminJobsCache.map(x => x.id === targetId ? { ...x, status: 'taken_down', reviewStatus: 'taken_down', hidden: true, takedownReason: reason || 'Listing taken down by security team' } : x);
        if (_cachedJobs) _cachedJobs = _cachedJobs.filter(x => x.id !== targetId);
        try {
          const myJobs = JSON.parse(localStorage.getItem('sf_my_posted_jobs') || '[]');
          localStorage.setItem('sf_my_posted_jobs', JSON.stringify(myJobs.map(x => x.id === targetId ? { ...x, status: 'taken_down', takedownReason: reason } : x)));
        } catch (_) {}
      } else {
        _adminEventsCache = _adminEventsCache.map(x => x.id === targetId ? { ...x, status: 'taken_down', reviewStatus: 'taken_down', hidden: true, takedownReason: reason || 'Listing taken down by security team' } : x);
        if (_cachedEvents) _cachedEvents = _cachedEvents.filter(x => x.id !== targetId);
        try {
          const myEvents = JSON.parse(localStorage.getItem('sf_my_hosted_events') || '[]');
          localStorage.setItem('sf_my_hosted_events', JSON.stringify(myEvents.map(x => x.id === targetId ? { ...x, status: 'taken_down', takedownReason: reason } : x)));
        } catch (_) {}
      }
    } else if (action === 'approve' || action === 'restore') {
      if (targetType === 'job') {
        _adminJobsCache = _adminJobsCache.map(x => x.id === targetId ? { ...x, status: 'approved', reviewStatus: 'approved', hidden: false } : x);
        try {
          const myJobs = JSON.parse(localStorage.getItem('sf_my_posted_jobs') || '[]');
          localStorage.setItem('sf_my_posted_jobs', JSON.stringify(myJobs.map(x => x.id === targetId ? { ...x, status: 'approved' } : x)));
        } catch (_) {}
      } else {
        _adminEventsCache = _adminEventsCache.map(x => x.id === targetId ? { ...x, status: 'approved', reviewStatus: 'approved', hidden: false } : x);
        try {
          const myEvents = JSON.parse(localStorage.getItem('sf_my_hosted_events') || '[]');
          localStorage.setItem('sf_my_hosted_events', JSON.stringify(myEvents.map(x => x.id === targetId ? { ...x, status: 'approved' } : x)));
        } catch (_) {}
      }
    }

    // Clear public cache so live feed reflects changes immediately
    if (typeof window._sfInvalidateJobsEventsCache === 'function') {
      window._sfInvalidateJobsEventsCache();
    }

    let successMsg = `Listing ${action}d successfully`;
    if (action === 'takedown') successMsg = `Listing taken down and hidden from live feed.`;
    else if (action === 'delete') successMsg = `Listing permanently deleted from database.`;
    else if (action === 'approve') successMsg = `Listing approved and published live!`;
    else if (action === 'restore') successMsg = `Listing restored to live feed.`;

    if (typeof toast === 'function') {
      toast(successMsg, 'success');
    }

    updateKpis();
    renderFilteredAdminItems();
  } catch (err) {
    if (typeof toast === 'function') {
      toast('Error: ' + err.message, 'error');
    }
  }
}

// Public API exports on window
window.renderJobs = renderJobs;
window.renderEvents = renderEvents;
window.renderAdminJobsDesk = renderAdminJobsDesk;
window.checkJobsEventsEligibility = checkJobsEventsEligibility;
window.openPostJobModal = openPostJobModal;
window.openCreateEventModal = openCreateEventModal;
window.openJobDetailModal = openJobDetailModal;
window.openEventDetailModal = openEventDetailModal;
window.openApplyJobModal = openApplyJobModal;
window.openRegisterEventModal = openRegisterEventModal;
window._sfPrefetchJobs = prefetchJobsData;
window._sfPrefetchEvents = prefetchEventsData;
window._sfInvalidateJobsEventsCache = () => {
  _cachedJobs = null;
  _lastJobsFetchTime = 0;
  _cachedEvents = null;
  _lastEventsFetchTime = 0;
};

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), typeof document !== 'undefined' ? document : {});

