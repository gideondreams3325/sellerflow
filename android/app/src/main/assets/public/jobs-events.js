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

function getJobsEventsDb() {
  if (typeof window.db !== 'undefined' && window.db && (typeof window.db.collection === 'function' || typeof window.db.doc === 'function')) {
    return window.db;
  }
  if (typeof db !== 'undefined' && db && (typeof db.collection === 'function' || typeof db.doc === 'function')) {
    return db;
  }
  if (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') {
    try {
      const d = firebase.firestore();
      window.db = d;
      return d;
    } catch (_) {}
  }
  return {
    collection: (name) => ({
      doc: (id) => ({
        get: async () => ({ exists: false, data: () => null }),
        set: async () => {},
        update: async () => {},
        delete: async () => {}
      }),
      where: () => ({
        where: () => ({
          limit: () => ({ get: async () => ({ empty: true, docs: [], forEach: () => {} }) }),
          get: async () => ({ empty: true, docs: [], forEach: () => {} })
        }),
        limit: () => ({ get: async () => ({ empty: true, docs: [], forEach: () => {} }) }),
        orderBy: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [], forEach: () => {} }) }), get: async () => ({ empty: true, docs: [], forEach: () => {} }) }),
        get: async () => ({ empty: true, docs: [], forEach: () => {} })
      }),
      orderBy: () => ({
        limit: () => ({ get: async () => ({ empty: true, docs: [], forEach: () => {} }) }),
        get: async () => ({ empty: true, docs: [], forEach: () => {} })
      }),
      limit: () => ({ get: async () => ({ empty: true, docs: [], forEach: () => {} }) }),
      get: async () => ({ empty: true, docs: [], forEach: () => {} }),
      add: async () => ({ id: 'mock_' + Date.now() })
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

const DEFAULT_FEATURED_JOBS = [
  {
    id: 'job_gh_01',
    title: 'Senior Store & Inventory Manager',
    companyName: 'Accra Premier Retail Hub',
    category: 'Retail & Sales',
    region: 'Greater Accra',
    locationType: 'on_site',
    employmentType: 'Full-time',
    salaryMin: 3500,
    salaryMax: 5500,
    salaryPeriod: 'monthly',
    description: 'We are seeking an experienced Store Manager to oversee inventory tracking, customer relationships, staff coordination, and point-of-sale operations at our East Legon flagship branch. Applicants must have 2+ years of retail experience.',
    requirements: '• 2+ years retail or store management experience\n• Proficiency with digital POS systems and inventory logs\n• Strong communication and team leadership skills',
    contactEmail: 'careers@accraretailhub.com',
    contactPhone: '+233 24 123 4567',
    creatorName: 'Accra Premier Retail Hub',
    status: 'approved',
    createdAt: Date.now() - 86400000 * 2,
    verifiedEmployer: true
  },
  {
    id: 'job_gh_02',
    title: 'Logistics & Dispatch Coordinator',
    companyName: 'SwiftFlow Courier Services',
    category: 'Logistics & Delivery',
    region: 'Greater Accra',
    locationType: 'on_site',
    employmentType: 'Full-time',
    salaryMin: 2200,
    salaryMax: 3200,
    salaryPeriod: 'monthly',
    description: 'Responsible for routing parcel dispatches, managing rider schedules, coordinating with marketplace merchants, and ensuring rapid same-day package delivery across Accra and Tema.',
    requirements: '• Knowledge of Accra-Tema route network\n• Prior dispatch or warehouse logistics experience\n• Punctual and customer-oriented attitude',
    contactEmail: 'jobs@swiftflowdelivery.com',
    contactPhone: '+233 50 987 6543',
    creatorName: 'SwiftFlow Courier Services',
    status: 'approved',
    createdAt: Date.now() - 86400000 * 3,
    verifiedEmployer: true
  },
  {
    id: 'job_gh_03',
    title: 'Digital Marketing & Content Creator',
    companyName: 'GoldCoast Commerce Agency',
    category: 'Creative & Media',
    region: 'Ashanti',
    locationType: 'hybrid',
    employmentType: 'Full-time',
    salaryMin: 2800,
    salaryMax: 4200,
    salaryPeriod: 'monthly',
    description: 'Create engaging short-form video reels, promotional product campaigns, and community engagement posts across TikTok, Instagram, and SellerFlow for leading Ghanaian retail merchants.',
    requirements: '• Portfolio of viral or high-engagement video content\n• Proficiency in CapCut, Canva, or Adobe Premiere\n• Strong understanding of Ghanaian digital consumer trends',
    contactEmail: 'talent@goldcoastcommerce.com',
    creatorName: 'GoldCoast Commerce Agency',
    status: 'approved',
    createdAt: Date.now() - 86400000 * 4,
    verifiedEmployer: true
  },
  {
    id: 'job_gh_04',
    title: 'Customer Support Representative',
    companyName: 'Oseikrom Hub Kumasi',
    category: 'Customer Service',
    region: 'Ashanti',
    locationType: 'remote',
    employmentType: 'Full-time',
    salaryMin: 2000,
    salaryMax: 2800,
    salaryPeriod: 'monthly',
    description: 'Provide omnichannel customer support (live chat, WhatsApp, and phone support) to online shoppers and marketplace buyers. Must have excellent written English and Twi communication.',
    requirements: '• Fluency in English and Twi\n• Reliable laptop and high-speed internet connection\n• Friendly problem-solving disposition',
    contactEmail: 'support-jobs@oseikromhub.com',
    creatorName: 'Oseikrom Hub Kumasi',
    status: 'approved',
    createdAt: Date.now() - 86400000 * 5,
    verifiedEmployer: true
  }
];

const DEFAULT_FEATURED_EVENTS = [
  {
    id: 'event_gh_01',
    title: 'Ghana E-Commerce & Retail Expo 2026',
    organizerName: 'Ghana Retailers Association',
    category: 'Business & Networking',
    region: 'Greater Accra',
    venue: 'Accra International Conference Centre (AICC)',
    eventDate: '2026-10-15',
    eventTime: '09:00',
    ticketPrice: 0,
    description: 'The premier annual gathering for Ghanaian retail entrepreneurs, online sellers, logistics providers, and digital payment innovators. Connect with over 500+ merchants and industry experts.',
    bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    registeredCount: 142,
    status: 'approved',
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: 'event_gh_02',
    title: 'Accra Creators & Pop-Up Marketplace',
    organizerName: 'Osu Artisan Network',
    category: 'Pop-up & Marketplace',
    region: 'Greater Accra',
    venue: 'Oxford Street Pavilion, Osu, Accra',
    eventDate: '2026-10-24',
    eventTime: '10:00',
    ticketPrice: 20,
    description: 'A vibrant weekend open-air market showcasing fashion designers, handcrafted goods, organic skincare, food vendors, and live music performances from top local creators.',
    bannerUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
    registeredCount: 88,
    status: 'approved',
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: 'event_gh_03',
    title: 'Kumasi Tech & Startup Founders Meetup',
    organizerName: 'Asante Tech Collective',
    category: 'Tech & Innovation',
    region: 'Ashanti',
    venue: 'KNUST Tech Center, Kumasi',
    eventDate: '2026-11-05',
    eventTime: '14:00',
    ticketPrice: 0,
    description: 'Monthly workshop and networking hub for software builders, designers, and e-commerce founders in Kumasi. Featuring pitching sessions, mentorship, and seed funding insights.',
    bannerUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80',
    registeredCount: 65,
    status: 'approved',
    createdAt: Date.now() - 86400000 * 4
  }
];

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
    snap.forEach(doc => jobs.push({ id: doc.id, ...doc.data() }));
    if (!jobs.length) {
      _cachedJobs = DEFAULT_FEATURED_JOBS.slice();
    } else {
      _cachedJobs = jobs;
    }
    _lastJobsFetchTime = Date.now();
    return _cachedJobs;
  } catch (_) {
    if (!_cachedJobs) _cachedJobs = DEFAULT_FEATURED_JOBS.slice();
    return _cachedJobs;
  }
}
window._sfPrefetchJobs = prefetchJobsData;

async function prefetchEventsData() {
  if (_cachedEvents && (Date.now() - _lastEventsFetchTime < CACHE_TTL_MS)) return _cachedEvents;
  try {
    const snap = await getJobsEventsDb().collection('events').where('status', '==', 'approved').limit(40).get();
    const events = [];
    snap.forEach(doc => events.push({ id: doc.id, ...doc.data() }));
    if (!events.length) {
      _cachedEvents = DEFAULT_FEATURED_EVENTS.slice();
    } else {
      _cachedEvents = events;
    }
    _lastEventsFetchTime = Date.now();
    return _cachedEvents;
  } catch (_) {
    if (!_cachedEvents) _cachedEvents = DEFAULT_FEATURED_EVENTS.slice();
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
  if (!user) {
    if (typeof showAuthPrompt === 'function') {
      showAuthPrompt(actionType);
    } else if (typeof showAuth === 'function') {
      showAuth('login');
    }
    return false;
  }

  // 1. Identity Check
  const isVerified = (currentProfile && (currentProfile.verified || currentProfile.verificationStatus === 'approved')) || (user && user.verified);
  if (!isVerified && !isAdmin) {
    openIdentityRequiredModal(actionType);
    return false;
  }

  // 2. Terms Acceptance Check
  const hasAccepted = await checkUserAcceptedTerms(user.uid);
  if (!hasAccepted) {
    openTermsAcceptanceModal(actionType);
    return false;
  }

  return true;
}
window.checkJobsEventsEligibility = checkJobsEventsEligibility;

async function checkUserAcceptedTerms(uid) {
  if (!uid) return false;
  try {
    const snap = await getJobsEventsDb().collection('termsAcceptances').doc(uid).get();
    if (!snap.exists) return false;
    const data = snap.data();
    return data.termsVersion === JOBS_TERMS_VERSION;
  } catch (_) {
    return false;
  }
}

// Modal: Identity Verification Required
function openIdentityRequiredModal(actionType = 'post') {
  const modal = document.createElement('div');
  modal.id = 'identityRequiredModal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in';
  modal.innerHTML = `
    <div class="bg-[#181824] border border-amber-500/40 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
      <div class="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto">
        🪪
      </div>
      <div class="text-center space-y-1.5">
        <h3 class="text-lg font-black text-amber-300">Identity Verification Required</h3>
        <p class="text-xs text-zinc-300 leading-relaxed">
          To protect Ghanaian jobseekers and attendees from fraud, SellerFlow requires all users to complete <b>Ghana Card identity verification</b> before ${_esc(actionType)}.
        </p>
      </div>
      <div class="p-3.5 rounded-2xl bg-[#12121a] border border-[#2a2a3c] text-xs text-zinc-400 space-y-1.5">
        <div class="flex items-center gap-2 text-zinc-300">
          <span class="text-amber-400">✓</span> <span>Encrypted Ghana Card KYC storage</span>
        </div>
        <div class="flex items-center gap-2 text-zinc-300">
          <span class="text-amber-400">✓</span> <span>Compliance with Data Protection Act, 2012 (Act 843)</span>
        </div>
        <div class="flex items-center gap-2 text-zinc-300">
          <span class="text-amber-400">✓</span> <span>Fast automated and security team review</span>
        </div>
      </div>
      <div class="flex gap-3 pt-2">
        <button id="closeIdReqBtn" type="button" class="flex-1 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition">
          Cancel
        </button>
        <button id="goToKycBtn" type="button" class="flex-1 py-2.5 rounded-xl bg-gold text-black hover:brightness-110 text-xs font-black transition shadow-md">
          Verify Ghana Card →
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#closeIdReqBtn').onclick = () => modal.remove();
  modal.querySelector('#goToKycBtn').onclick = () => {
    modal.remove();
    if (typeof openBuyerKycModal === 'function') openBuyerKycModal();
    else if (typeof openGhanaCardModal === 'function') openGhanaCardModal();
    else navigate('profile');
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
      const token = currentUser ? await currentUser.getIdToken() : '';
      await fetch('/api/terms/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          termsVersion: JOBS_TERMS_VERSION,
          privacyVersion: JOBS_PRIVACY_VERSION,
          identityVerificationVersion: IDENTITY_VERIFICATION_VERSION
        })
      });
      await getJobsEventsDb().collection('termsAcceptances').doc(currentUser.uid).set({
        userId: currentUser.uid,
        termsVersion: JOBS_TERMS_VERSION,
        acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

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
    const eligible = await checkJobsEventsEligibility(currentUser, 'post a job opening');
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
      try {
        const snap = await getJobsEventsDb().collection('jobs').where('status', '==', 'approved').limit(50).get();
        jobs = [];
        if (snap && snap.forEach) {
          snap.forEach(doc => jobs.push({ id: doc.id, ...doc.data() }));
        }
      } catch (err) {
        console.warn('Firestore jobs query fallback:', err);
      }
      if (!jobs || !jobs.length) {
        jobs = DEFAULT_FEATURED_JOBS.slice();
      }
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
      currentList.innerHTML = `
        <div class="text-center py-14 bg-[#14141e] border border-zinc-800/80 rounded-2xl p-6 space-y-2">
          <span class="text-3xl block">🔍</span>
          <p class="text-sm font-bold text-zinc-300">No verified job listings found</p>
          <p class="text-xs text-zinc-500">Try adjusting your search terms or filters.</p>
        </div>
      `;
      return;
    }

    currentList.innerHTML = filtered.map(job => renderJobCardHtml(job)).join('');

    // Attach card action handlers
    currentList.querySelectorAll('[data-view-job]').forEach(b => {
      b.onclick = () => openJobDetailModal(b.dataset.viewJob);
    });
    currentList.querySelectorAll('[data-apply-job]').forEach(b => {
      b.onclick = async () => {
        const eligible = await checkJobsEventsEligibility(currentUser, 'apply for this job');
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

  return `
    <div class="bg-[#14141e] hover:bg-[#181826] border border-zinc-800/80 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 transition shadow-sm space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div class="space-y-1 min-w-0">
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

        <div class="flex items-center gap-2 shrink-0">
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
            <p class="text-[11px] text-zinc-400">List your vacancy for verified Ghanaian jobseekers.</p>
          </div>
        </div>
        <button id="closePostJobModalBtn" class="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold">✕</button>
      </div>

      <form id="postJobForm" class="flex-1 overflow-y-auto pr-2 space-y-3.5 text-xs text-zinc-300">
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

  modal.querySelector('#closePostJobModalBtn').onclick = () => modal.remove();
  modal.querySelector('#cancelPostJobBtn').onclick = () => modal.remove();

  modal.querySelector('#postJobForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = modal.querySelector('#submitJobBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting & Scanning...';

    try {
      const token = currentUser ? await currentUser.getIdToken() : '';
      const payload = {
        title: _$('jobTitle').value.trim(),
        companyName: _$('jobCompany').value.trim(),
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

      const res = await fetch('/api/jobs/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Submission failed');
      }

      modal.remove();
      toast(data.message || 'Job submitted successfully', 'success');
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
      jobData = DEFAULT_FEATURED_JOBS.find(j => j.id === jobId);
    }
  } catch (_) {
    jobData = DEFAULT_FEATURED_JOBS.find(j => j.id === jobId);
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
          <input type="text" id="applicantName" required value="${_esc(currentProfile?.name || currentUser?.displayName || '')}" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Email Address *</label>
            <input type="email" id="applicantEmail" required value="${_esc(currentUser?.email || '')}" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
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

      const token = currentUser ? await currentUser.getIdToken() : '';
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

      const res = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit application');
      }

      modal.remove();
      toast('Application submitted successfully!', 'success');
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
      job = DEFAULT_FEATURED_JOBS.find(j => j.id === jobId);
    }
    if (!job) {
      toast('Job not found', 'error');
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
      const eligible = await checkJobsEventsEligibility(currentUser, 'apply for this job');
      if (eligible) openApplyJobModal(jobId);
    };
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

// Sub-view: My Applications
async function renderMyApplications(container) {
  if (!container) return;
  if (!currentUser) {
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
    const snap = await getJobsEventsDb().collection('jobApplications')
      .where('applicantId', '==', currentUser.uid)
      .get();

    const target = _$('jobsContentArea') || container;
    if (!target) return;

    if (snap.empty) {
      target.innerHTML = `
        <div class="text-center py-14 bg-[#14141e] border border-zinc-800 rounded-2xl p-6 space-y-2">
          <span class="text-3xl block">📄</span>
          <p class="text-sm font-bold text-zinc-300">You haven't applied to any jobs yet</p>
          <p class="text-xs text-zinc-500">Explore the jobs feed and submit your CV to verified employers.</p>
        </div>
      `;
      return;
    }

    const apps = [];
    snap.forEach(d => apps.push({ id: d.id, ...d.data() }));

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
  if (!currentUser) {
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
    const snap = await getJobsEventsDb().collection('jobs')
      .where('creatorId', '==', currentUser.uid)
      .get();

    const target = _$('jobsContentArea') || container;
    if (!target) return;

    if (snap.empty) {
      target.innerHTML = `
        <div class="text-center py-14 bg-[#14141e] border border-zinc-800 rounded-2xl p-6 space-y-3">
          <span class="text-3xl block">🏢</span>
          <p class="text-sm font-bold text-zinc-300">You haven't posted any jobs yet</p>
          <button id="deskPostJobBtn" class="px-4 py-2 rounded-xl bg-gold text-black font-bold text-xs hover:brightness-110">
            Post Your First Job Opening
          </button>
        </div>
      `;
      _$('deskPostJobBtn')?.addEventListener('click', () => openPostJobModal());
      return;
    }

    const myJobs = [];
    snap.forEach(d => myJobs.push({ id: d.id, ...d.data() }));

    target.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-2">
          <h3 class="text-sm font-bold text-white">Your Posted Jobs (${myJobs.length})</h3>
          <button id="deskPostJobBtn2" class="px-3.5 py-1.5 rounded-xl bg-gold text-black font-bold text-xs hover:brightness-110">
            ＋ Post Another Job
          </button>
        </div>

        <div class="space-y-3">
          ${myJobs.map(job => `
            <div class="bg-[#14141e] border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h4 class="text-base font-bold text-white">${_esc(job.title)}</h4>
                  <p class="text-xs text-zinc-400">📍 ${_esc(job.region)} · Category: ${_esc(job.category)}</p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  job.status === 'approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  job.status === 'rejected' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                }">
                  ${_esc(job.status || 'Pending')}
                </span>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                <span class="text-zinc-400">Applications: <b class="text-amber-300">${job.applicationsCount || 0}</b></span>
                <button data-view-applicants="${job.id}" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs">
                  Review Candidates →
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    _$('deskPostJobBtn2')?.addEventListener('click', () => openPostJobModal());
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
    const eligible = await checkJobsEventsEligibility(currentUser, 'host an event');
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
      try {
        const snap = await getJobsEventsDb().collection('events').where('status', '==', 'approved').limit(40).get();
        events = [];
        if (snap && snap.forEach) {
          snap.forEach(doc => events.push({ id: doc.id, ...doc.data() }));
        }
      } catch (err) {
        console.warn('Firestore events query fallback:', err);
      }
      if (!events || !events.length) {
        events = DEFAULT_FEATURED_EVENTS.slice();
      }
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
      currentList.innerHTML = `
        <div class="col-span-full text-center py-14 bg-[#14141e] border border-zinc-800/80 rounded-2xl p-6 space-y-2">
          <span class="text-3xl block">🎟️</span>
          <p class="text-sm font-bold text-zinc-300">No verified events found</p>
          <p class="text-xs text-zinc-500">Check back soon or host your own community event.</p>
        </div>
      `;
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
        const eligible = await checkJobsEventsEligibility(currentUser, 'register for this event');
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
      ev = DEFAULT_FEATURED_EVENTS.find(e => e.id === eventId);
    }
  } catch (_) {
    ev = DEFAULT_FEATURED_EVENTS.find(e => e.id === eventId);
  }

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
    const eligible = await checkJobsEventsEligibility(currentUser, 'register for this event');
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
            <p class="text-[11px] text-zinc-400">Publish your gathering for verified attendees.</p>
          </div>
        </div>
        <button id="closeCreateEventModalBtn" class="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold">✕</button>
      </div>

      <form id="createEventForm" class="flex-1 overflow-y-auto pr-2 space-y-3.5 text-xs text-zinc-300">
        <div>
          <label class="block font-bold text-zinc-300 mb-1">Event Title *</label>
          <input type="text" id="eventTitle" required placeholder="e.g. Accra Creators & Sellers Summit 2026" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-zinc-300 mb-1">Organizer / Host Name *</label>
            <input type="text" id="eventOrganizer" required value="${_esc(currentProfile?.name || '')}" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
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

  modal.querySelector('#closeCreateEventModalBtn').onclick = () => modal.remove();
  modal.querySelector('#cancelCreateEventBtn').onclick = () => modal.remove();

  modal.querySelector('#createEventForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = modal.querySelector('#submitEventBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting & Scanning...';

    try {
      const token = currentUser ? await currentUser.getIdToken() : '';
      const payload = {
        title: _$('eventTitle').value.trim(),
        organizerName: _$('eventOrganizer').value.trim(),
        category: _$('eventCategory').value,
        startDate: _$('eventDate').value,
        startTime: _$('eventTime').value,
        region: _$('eventRegion').value,
        venue: _$('eventVenue').value.trim(),
        ticketType: _$('eventTicketType').value,
        ticketPrice: Number(_$('eventPrice').value) || 0,
        description: _$('eventDesc').value.trim()
      };

      const res = await fetch('/api/events/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Event submission failed');
      }

      modal.remove();
      toast(data.message || 'Event submitted successfully', 'success');
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
      eventData = DEFAULT_FEATURED_EVENTS.find(e => e.id === eventId);
    }
  } catch (_) {
    eventData = DEFAULT_FEATURED_EVENTS.find(e => e.id === eventId);
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
          <input type="text" id="regName" required value="${_esc(currentProfile?.name || currentUser?.displayName || '')}" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
        </div>

        <div>
          <label class="block font-bold text-zinc-300 mb-1">Email Address *</label>
          <input type="email" id="regEmail" required value="${_esc(currentUser?.email || '')}" class="w-full bg-[#12121a] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-gold/60 focus:outline-none" />
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
      const token = currentUser ? await currentUser.getIdToken() : '';
      const payload = {
        eventId,
        attendeeName: _$('regName').value.trim(),
        attendeeEmail: _$('regEmail').value.trim(),
        attendeePhone: _$('regPhone').value.trim(),
        ticketCount: 1
      };

      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      modal.remove();
      toast('Registration confirmed! Check your tickets.', 'success');
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
  if (!currentUser) {
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
    const snap = await getJobsEventsDb().collection('eventRegistrations')
      .where('attendeeId', '==', currentUser.uid)
      .get();

    const target = _$('eventsContentArea') || container;
    if (!target) return;

    if (snap.empty) {
      target.innerHTML = `
        <div class="text-center py-14 bg-[#14141e] border border-zinc-800 rounded-2xl p-6 space-y-2">
          <span class="text-3xl block">🎟️</span>
          <p class="text-sm font-bold text-zinc-300">You have no upcoming event tickets</p>
          <p class="text-xs text-zinc-500">Explore discover tab to find and RSVP for events in Ghana.</p>
        </div>
      `;
      return;
    }

    const regs = [];
    snap.forEach(d => regs.push({ id: d.id, ...d.data() }));

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
  if (!currentUser) {
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
    const snap = await getJobsEventsDb().collection('events')
      .where('creatorId', '==', currentUser.uid)
      .get();

    const target = _$('eventsContentArea') || container;
    if (!target) return;

    if (snap.empty) {
      target.innerHTML = `
        <div class="text-center py-14 bg-[#14141e] border border-zinc-800 rounded-2xl p-6 space-y-3">
          <span class="text-3xl block">🎪</span>
          <p class="text-sm font-bold text-zinc-300">You haven't hosted any events yet</p>
          <button id="deskCreateEvBtn" class="px-4 py-2 rounded-xl bg-gold text-black font-bold text-xs hover:brightness-110">
            Host Your First Event
          </button>
        </div>
      `;
      _$('deskCreateEvBtn')?.addEventListener('click', () => openCreateEventModal());
      return;
    }

    const myEvents = [];
    snap.forEach(d => myEvents.push({ id: d.id, ...d.data() }));

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

    _$('deskCreateEvBtn2')?.addEventListener('click', () => openCreateEventModal());
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

async function renderAdminJobsDesk(tabContainer) {
  if (!tabContainer) return;
  tabContainer.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div>
          <h3 class="text-base font-black text-white">💼 Jobs & Events Security Desk</h3>
          <p class="text-xs text-zinc-400">Authoritative safety moderation & anti-scam review queue.</p>
        </div>
        <button id="refreshJobsDeskBtn" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300">
          🔄 Refresh Queues
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Pending Jobs Queue -->
        <div class="bg-[#14141e] border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h4 class="font-bold text-amber-300 text-sm flex items-center gap-1.5">
              <span>💼</span><span>Pending Jobs Review</span>
            </h4>
          </div>
          <div id="adminJobsQueue" class="space-y-3 min-h-[150px] text-xs">
            <div class="text-center py-6 text-zinc-500">Loading jobs queue...</div>
          </div>
        </div>

        <!-- Pending Events Queue -->
        <div class="bg-[#14141e] border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h4 class="font-bold text-amber-300 text-sm flex items-center gap-1.5">
              <span>🎟️</span><span>Pending Events Review</span>
            </h4>
          </div>
          <div id="adminEventsQueue" class="space-y-3 min-h-[150px] text-xs">
            <div class="text-center py-6 text-zinc-500">Loading events queue...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  _$('refreshJobsDeskBtn')?.addEventListener('click', () => loadAdminQueues());
  loadAdminQueues();
}
window.renderAdminJobsDesk = renderAdminJobsDesk;

async function loadAdminQueues() {
  const jobsArea = _$('adminJobsQueue');
  const eventsArea = _$('adminEventsQueue');
  if (!jobsArea && !eventsArea) return;

  try {
    const jobsSnap = await getJobsEventsDb().collection('jobs').where('status', '==', 'pending_review').get();
    const currentJobsArea = _$('adminJobsQueue') || jobsArea;
    if (currentJobsArea) {
      if (jobsSnap.empty) {
        currentJobsArea.innerHTML = `<div class="text-center py-8 text-zinc-500">✅ No pending jobs in review queue.</div>`;
      } else {
        const jobs = [];
        jobsSnap.forEach(d => jobs.push({ id: d.id, ...d.data() }));
        currentJobsArea.innerHTML = jobs.map(j => `
          <div class="p-3 rounded-xl bg-[#181824] border border-zinc-800 space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div>
                <b class="text-white block font-bold text-xs">${_esc(j.title)}</b>
                <span class="text-zinc-400 text-[11px]">🏢 ${_esc(j.companyName)} · 📍 ${_esc(j.region)}</span>
              </div>
              <span class="text-[10px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">Under Review</span>
            </div>
            <p class="text-zinc-400 text-[11px] line-clamp-2">${_esc(j.description)}</p>
            <div class="flex gap-2 pt-1 border-t border-zinc-800">
              <button data-admin-approve-job="${j.id}" class="flex-1 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-bold text-xs">
                ✓ Approve Job
              </button>
              <button data-admin-reject-job="${j.id}" class="flex-1 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs">
                ✕ Reject
              </button>
            </div>
          </div>
        `).join('');

        currentJobsArea.querySelectorAll('[data-admin-approve-job]').forEach(b => {
          b.onclick = () => performSecurityAction('job', b.dataset.adminApproveJob, 'approve');
        });
        currentJobsArea.querySelectorAll('[data-admin-reject-job]').forEach(b => {
          b.onclick = () => performSecurityAction('job', b.dataset.adminRejectJob, 'reject');
        });
      }
    }

    const eventsSnap = await getJobsEventsDb().collection('events').where('status', '==', 'pending_review').get();
    const currentEventsArea = _$('adminEventsQueue') || eventsArea;
    if (currentEventsArea) {
      if (eventsSnap.empty) {
        currentEventsArea.innerHTML = `<div class="text-center py-8 text-zinc-500">✅ No pending events in review queue.</div>`;
      } else {
        const events = [];
        eventsSnap.forEach(d => events.push({ id: d.id, ...d.data() }));
        currentEventsArea.innerHTML = events.map(ev => `
          <div class="p-3 rounded-xl bg-[#181824] border border-zinc-800 space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div>
                <b class="text-white block font-bold text-xs">${_esc(ev.title)}</b>
                <span class="text-zinc-400 text-[11px]">👤 ${_esc(ev.organizerName)} · 📍 ${_esc(ev.venue)}</span>
              </div>
              <span class="text-[10px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">Under Review</span>
            </div>
            <div class="flex gap-2 pt-1 border-t border-zinc-800">
              <button data-admin-approve-event="${ev.id}" class="flex-1 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-bold text-xs">
                ✓ Approve Event
              </button>
              <button data-admin-reject-event="${ev.id}" class="flex-1 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs">
                ✕ Reject
              </button>
            </div>
          </div>
        `).join('');

        currentEventsArea.querySelectorAll('[data-admin-approve-event]').forEach(b => {
          b.onclick = () => performSecurityAction('event', b.dataset.adminApproveEvent, 'approve');
        });
        currentEventsArea.querySelectorAll('[data-admin-reject-event]').forEach(b => {
          b.onclick = () => performSecurityAction('event', b.dataset.adminRejectEvent, 'reject');
        });
      }
    }
  } catch (err) {
    console.warn('Admin queue load error:', err);
  }
}

async function performSecurityAction(targetType, targetId, action) {
  try {
    const token = currentUser ? await currentUser.getIdToken() : '';
    const res = await fetch('/api/jobs/security-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        targetType,
        targetId,
        action,
        reason: action === 'reject' ? 'Listing does not comply with community guidelines.' : ''
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Action failed');
    }

    toast(`Listing ${action}d successfully`, 'success');
    loadAdminQueues();
  } catch (err) {
    toast('Error: ' + err.message, 'error');
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

