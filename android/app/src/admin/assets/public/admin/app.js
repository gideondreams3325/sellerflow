/**
 * SELLER FLOW ADMIN — Authoritative Application Core
 * Connected to Firebase project: sellerflow-efaab
 */

// 1. Firebase Initialization
const firebaseConfig = {
  apiKey: 'AIzaSyCyEdrUXAfgThfpStPY-Yvz8BG3LrhYuWk',
  authDomain: 'sellerflow-efaab.firebaseapp.com',
  databaseURL: 'https://sellerflow-efaab-default-rtdb.firebaseio.com',
  projectId: 'sellerflow-efaab',
  storageBucket: 'sellerflow-efaab.firebasestorage.app',
  messagingSenderId: '987175352360',
  appId: '1:987175352360:web:53e44304aaf11b98c61d1d'
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// 2. Application State Store
const state = {
  currentUser: null,
  currentIdToken: null,
  isAdmin: false,
  activeTab: 'dashboard',
  refreshing: false,
  data: {
    users: [],
    stores: [],
    products: [],
    posts: [],
    orders: [],
    buyerKycRecords: [],
    scamReports: [],
    fraudReports: [],
    jobs: [],
    events: [],
    auditLogs: []
  },
  pendingAction: null,
  activeKycItem: null,
  activePostItem: null
};

// 3. UI Helper Utilities
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : ''}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span class="text-base">${icon}</span><span class="flex-1">${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(val) {
  if (!val) return '—';
  try {
    const d = val.toDate ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (_) {
    return '—';
  }
}

function formatCurrency(val) {
  const num = Number(val) || 0;
  return `GH₵${num.toFixed(2)}`;
}

// 4. Modal Helpers
function openConfirmModal(config) {
  state.pendingAction = config;
  const modal = document.getElementById('confirmActionModal');
  const title = document.getElementById('confirmModalTitle');
  const prompt = document.getElementById('confirmModalPrompt');
  const durWrapper = document.getElementById('durationSelectWrapper');
  const reasonInput = document.getElementById('confirmReasonInput');
  const executeBtn = document.getElementById('confirmExecuteBtn');

  if (title) title.textContent = config.title || 'Confirm Action';
  if (prompt) prompt.textContent = config.prompt || 'Are you sure you want to proceed with this action?';
  if (reasonInput) reasonInput.value = '';
  
  if (durWrapper) {
    durWrapper.classList.toggle('hidden', config.action !== 'suspend');
  }

  if (executeBtn) {
    executeBtn.className = `btn ${config.destructive ? 'btn-danger' : 'btn-primary'}`;
    executeBtn.textContent = config.btnText || 'Confirm & Execute';
  }

  modal?.classList.add('open');
}

window.closeConfirmModal = function() {
  document.getElementById('confirmActionModal')?.classList.remove('open');
  state.pendingAction = null;
};

window.closeKycModal = function() {
  document.getElementById('kycInspectorModal')?.classList.remove('open');
  state.activeKycItem = null;
  document.getElementById('kycRejectOptions')?.classList.add('hidden');
};

window.closePostModal = function() {
  document.getElementById('postInspectorModal')?.classList.remove('open');
  state.activePostItem = null;
};

// 5. Authentication & Authorization Lifecycle
const ADMIN_EMAILS = ['gideondreams3325@gmail.com', 'gfappiah3325@gmail.com'];
function isAuthorizedAdminEmail(email) {
  if (!email) return false;
  const em = String(email).toLowerCase().trim();
  return em === 'gideondreams3325@gmail.com' || em === 'gfappiah3325@gmail.com' || ADMIN_EMAILS.includes(em);
}

function maskGhanaCard(val) {
  if (!val) return '—';
  const str = String(val).trim();
  if (str.length < 8) return 'GHA-***-X';
  const head = str.substring(0, 6);
  const tail = str.slice(-2);
  return `${head}***${tail}`;
}

auth.onAuthStateChanged(async (user) => {
  const loginScreen = document.getElementById('loginScreen');
  const adminShell = document.getElementById('adminShell');
  const loginAlert = document.getElementById('loginAlert');

  if (!user) {
    state.currentUser = null;
    state.currentIdToken = null;
    state.isAdmin = false;
    loginScreen?.classList.remove('hidden');
    adminShell?.classList.add('hidden');
    return;
  }

  try {
    const idToken = await user.getIdToken(true);
    state.currentUser = user;
    state.currentIdToken = idToken;

    // Verify admin privileges directly against authorized admin identity
    const isAdmin = isAuthorizedAdminEmail(user.email);

    if (!isAdmin) {
      console.warn('[Admin Gate] Non-admin user access attempt:', user.email);
      await auth.signOut();
      if (loginAlert) {
        loginAlert.className = 'mb-4 p-3.5 rounded-xl text-xs font-medium border bg-rose-500/10 border-rose-500/30 text-rose-300 block';
        loginAlert.innerHTML = `<strong>Access Denied:</strong> Account <em>${escapeHtml(user.email)}</em> does not possess administrative clearance. Only authorized administrators (e.g. gideondreams3325@gmail.com) can access SellerFlow Admin.`;
      }
      return;
    }

    state.isAdmin = true;

    // Update UI profile
    const emailEl = document.getElementById('adminUserEmail');
    const settingsEmail = document.getElementById('settingsCurrentEmail');
    const avatarEl = document.getElementById('adminAvatarLetter');
    if (emailEl) emailEl.textContent = user.email || 'Admin';
    if (settingsEmail) settingsEmail.textContent = user.email || 'Admin';
    if (avatarEl) avatarEl.textContent = (user.email ? user.email[0].toUpperCase() : 'A');

    // Switch views
    loginScreen?.classList.add('hidden');
    adminShell?.classList.remove('hidden');

    // Populate administrative data directly through Firebase Web SDK
    await fetchAdminData();

    // Render dashboard and current tab
    renderCurrentTab();
    fetchAuditLogs();
    showToast(`Signed in as ${user.email}`, 'success');

  } catch (err) {
    console.error('Admin Auth Check Error:', err);
    await auth.signOut();
    if (loginAlert) {
      loginAlert.className = 'mb-4 p-3.5 rounded-xl text-xs font-medium border bg-rose-500/10 border-rose-500/30 text-rose-300 block';
      loginAlert.textContent = `Authorization check failed: ${err.message}`;
    }
  }
});

// Periodic Token Refresh (Every 45 minutes to keep session alive)
setInterval(async () => {
  if (auth.currentUser && state.isAdmin) {
    try {
      state.currentIdToken = await auth.currentUser.getIdToken(true);
      console.log('[Admin Session] ID token refreshed successfully');
    } catch (e) {
      console.warn('Session refresh warning:', e);
    }
  }
}, 45 * 60 * 1000);

// 6. Data Fetching & Sync
async function fetchAdminData(force = false) {
  if (!state.isAdmin || state.refreshing) return;
  state.refreshing = true;
  const refreshIcon = document.getElementById('refreshIcon');
  if (refreshIcon) refreshIcon.classList.add('animate-spin');

  try {
    const serializeDoc = (d) => ({ id: d.id, ...d.data() });

    const [
      usersSnap,
      publicProfilesSnap,
      postsSnap,
      storesSnap,
      productsSnap,
      fraudSnap,
      scamSnap,
      kycSnap,
      ordersSnap,
      jobsSnap,
      eventsSnap,
      adminReviewsSnap
    ] = await Promise.all([
      db.collection('users').limit(400).get().catch(err => { console.warn('users fetch error', err); return { docs: [] }; }),
      db.collection('publicProfiles').limit(400).get().catch(() => ({ docs: [] })),
      db.collection('posts').limit(300).get().catch(err => { console.warn('posts fetch error', err); return { docs: [] }; }),
      db.collection('stores').limit(400).get().catch(err => { console.warn('stores fetch error', err); return { docs: [] }; }),
      db.collection('products').limit(400).get().catch(err => { console.warn('products fetch error', err); return { docs: [] }; }),
      db.collection('fraudReports').limit(200).get().catch(() => ({ docs: [] })),
      db.collection('scamReports').limit(200).get().catch(() => ({ docs: [] })),
      db.collection('buyerKycRecords').limit(400).get().catch(() => ({ docs: [] })),
      db.collection('orders').limit(400).get().catch(() => ({ docs: [] })),
      db.collection('jobs').limit(300).get().catch(() => ({ docs: [] })),
      db.collection('events').limit(300).get().catch(() => ({ docs: [] })),
      db.collection('adminReviews').where('action', '==', 'takedown').limit(100).get().catch(() => ({ docs: [] }))
    ]);

    // Build unified posts list (merging archived reviews if any)
    const postMap = new Map();
    (postsSnap.docs || []).forEach(d => {
      postMap.set(d.id, serializeDoc(d));
    });
    (adminReviewsSnap.docs || []).forEach(d => {
      const rev = d.data() || {};
      if (rev.targetId && rev.postSnapshot && !postMap.has(rev.targetId)) {
        postMap.set(rev.targetId, {
          id: rev.targetId,
          ...rev.postSnapshot,
          status: 'taken_down',
          reviewStatus: 'removed',
          takedownReason: rev.reason || 'Taken down by Security Team',
          removedAt: rev.timestamp || null
        });
      }
    });

    // Build unified map of users
    const userMap = new Map();
    (publicProfilesSnap.docs || []).forEach(d => {
      userMap.set(d.id, { id: d.id, uid: d.id, ...d.data() });
    });
    (usersSnap.docs || []).forEach(d => {
      const existing = userMap.get(d.id) || {};
      userMap.set(d.id, { ...existing, id: d.id, uid: d.id, ...d.data() });
    });

    state.data = {
      users: Array.from(userMap.values()),
      stores: (storesSnap.docs || []).map(serializeDoc),
      products: (productsSnap.docs || []).map(serializeDoc),
      posts: Array.from(postMap.values()),
      orders: (ordersSnap.docs || []).map(serializeDoc),
      buyerKycRecords: (kycSnap.docs || []).map(d => {
        const doc = serializeDoc(d);
        const rawPin = doc.ghanaCardNumber || doc.ghanaCardPin || '';
        const masked = doc.ghanaCardMasked || (rawPin ? maskGhanaCard(rawPin) : '—');
        return {
          ...doc,
          ghanaCardNumber: masked,
          ghanaCardMasked: masked
        };
      }),
      scamReports: (scamSnap.docs || []).map(serializeDoc),
      fraudReports: (fraudSnap.docs || []).map(serializeDoc),
      jobs: (jobsSnap.docs || []).map(serializeDoc),
      events: (eventsSnap.docs || []).map(serializeDoc),
      auditLogs: state.data.auditLogs || []
    };

    const lastSync = document.getElementById('lastSyncedTime');
    if (lastSync) lastSync.textContent = `Synced: ${new Date().toLocaleTimeString()}`;

    renderCurrentTab();
    await fetchAuditLogs();
    if (force) showToast('All administrative data refreshed from Firestore', 'success');
  } catch (err) {
    console.error('Data fetch error:', err);
    showToast(`Failed to refresh data: ${err.message}`, 'error');
  } finally {
    state.refreshing = false;
    if (refreshIcon) refreshIcon.classList.remove('animate-spin');
  }
}

// Fetch Audit Logs directly from securityReviews & adminReviews
async function fetchAuditLogs() {
  if (!state.isAdmin) return;
  try {
    const logs = [];
    const secSnap = await db.collection('securityReviews').orderBy('timestamp', 'desc').limit(100).get().catch(() => null);
    if (secSnap) {
      secSnap.forEach(doc => {
        logs.push({ id: doc.id, ...doc.data(), source: 'securityReviews' });
      });
    }

    const admSnap = await db.collection('adminReviews').orderBy('timestamp', 'desc').limit(100).get().catch(() => null);
    if (admSnap) {
      admSnap.forEach(doc => {
        logs.push({ id: doc.id, ...doc.data(), source: 'adminReviews' });
      });
    }

    logs.sort((a, b) => {
      const ta = a.timestamp?.toMillis ? a.timestamp.toMillis() : (new Date(a.timestamp || 0).getTime());
      const tb = b.timestamp?.toMillis ? b.timestamp.toMillis() : (new Date(b.timestamp || 0).getTime());
      return tb - ta;
    });

    state.data.auditLogs = logs;
    renderAuditLogsTable();
  } catch (e) {
    console.warn('Audit logs fetch warning:', e);
  }
}

// 7. Navigation & Tab Switching
function switchTab(tabId) {
  state.activeTab = tabId;
  window.location.hash = `#${tabId}`;

  // Update navigation styles
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    const isTarget = btn.getAttribute('data-tab') === tabId;
    btn.classList.toggle('active', isTarget);
  });

  // Update Section Header Title
  const titles = {
    dashboard: 'Dashboard Overview',
    users: 'User Account Management',
    stores: 'Storefront Directory',
    products: 'Marketplace Products',
    moderation: 'Content Moderation & Restoration',
    verifications: 'Ghana Card & KYC Verification Center',
    reports: 'Community Safety & Scam Reports',
    orders: 'Commerce Orders Oversight',
    jobs: 'Employment Listings & Anti-Scam',
    events: 'Events & Expos',
    audit: 'Immutable Audit Logs',
    settings: 'Admin Roles & System'
  };
  const titleEl = document.getElementById('currentSectionTitle');
  if (titleEl) titleEl.textContent = titles[tabId] || 'Admin Management';

  // Toggle Tab Panes
  document.querySelectorAll('.admin-tab-pane').forEach(pane => {
    pane.classList.toggle('hidden', pane.id !== `tab-${tabId}`);
  });

  renderCurrentTab();

  // Close mobile sidebar if open
  document.getElementById('adminSidebar')?.classList.add('-translate-x-full');
  document.getElementById('sidebarBackdrop')?.classList.add('hidden');
}

function renderCurrentTab() {
  updateBadges();
  switch (state.activeTab) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'users':
      renderUsersTable();
      break;
    case 'stores':
      renderStoresTable();
      break;
    case 'products':
      renderProductsTable();
      break;
    case 'moderation':
      renderModerationPosts();
      break;
    case 'verifications':
      renderKycTable();
      break;
    case 'reports':
      renderReportsTable();
      break;
    case 'orders':
      renderOrdersTable();
      break;
    case 'jobs':
      renderJobsTable();
      break;
    case 'events':
      renderEventsTable();
      break;
    case 'audit':
      renderAuditLogsTable();
      break;
    case 'settings':
      break;
  }
}

function updateBadges() {
  const usersCount = state.data.users.length;
  const storesCount = state.data.stores.length;
  const productsCount = state.data.products.length;
  const ordersCount = state.data.orders.length;
  const jobsCount = state.data.jobs.length;
  const eventsCount = state.data.events.length;

  const pendingKycCount = state.data.buyerKycRecords.filter(r => r.verificationStatus === 'pending' || r.verificationStatus === 'REVIEW').length;
  const pendingReportsCount = [...state.data.scamReports, ...state.data.fraudReports].filter(r => r.status === 'pending' || !r.status).length;
  const flaggedPostsCount = state.data.posts.filter(p => p.violationDetected || p.reviewStatus === 'under_review' || p.reviewStatus === 'violation' || p.needsAdminReview).length;

  const setBadge = (id, count) => {
    const el = document.getElementById(id);
    if (el) el.textContent = count;
  };

  setBadge('badgeUsersCount', usersCount);
  setBadge('badgeStoresCount', storesCount);
  setBadge('badgeProductsCount', productsCount);
  setBadge('badgeOrdersCount', ordersCount);
  setBadge('badgeJobsCount', jobsCount);
  setBadge('badgeEventsCount', eventsCount);
  setBadge('badgePendingKyc', pendingKycCount);
  setBadge('badgePendingReports', pendingReportsCount);
  setBadge('badgeFlaggedPosts', flaggedPostsCount);
}

// 8. TAB 1: RENDER DASHBOARD
function renderDashboard() {
  const totalUsers = state.data.users.length;
  const sellers = state.data.users.filter(u => u.role === 'seller').length;
  const activeSellers = state.data.stores.filter(s => s.status === 'approved' || !s.status).length;
  const stores = state.data.stores.length;
  const products = state.data.products.length;
  const posts = state.data.posts.length;
  const orders = state.data.orders.length;
  const pendingKyc = state.data.buyerKycRecords.filter(r => r.verificationStatus === 'pending' || r.verificationStatus === 'REVIEW').length;
  const pendingReports = [...state.data.scamReports, ...state.data.fraudReports].filter(r => r.status === 'pending' || !r.status).length;
  const takenDownCount = state.data.posts.filter(p => p.status === 'taken_down' || p.status === 'hidden').length +
                         state.data.products.filter(pr => pr.status === 'taken_down').length +
                         state.data.stores.filter(st => st.status === 'taken_down').length;

  document.getElementById('kpiTotalUsers').textContent = totalUsers;
  document.getElementById('kpiTotalSellers').textContent = sellers;
  document.getElementById('kpiActiveSellers').textContent = activeSellers;
  document.getElementById('kpiStores').textContent = stores;
  document.getElementById('kpiProducts').textContent = products;
  document.getElementById('kpiPosts').textContent = posts;
  document.getElementById('kpiOrders').textContent = orders;
  document.getElementById('kpiPendingKyc').textContent = pendingKyc;
  document.getElementById('kpiPendingReports').textContent = pendingReports;
  document.getElementById('kpiTakenDown').textContent = takenDownCount;

  // Render 4 feeds
  // 1. Recent Reports
  const reportsList = [...state.data.scamReports.map(s => ({ ...s, reportKind: 'Scam' })), ...state.data.fraudReports.map(f => ({ ...f, reportKind: 'Fraud' }))]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const reportsBody = document.getElementById('recentReportsTableBody');
  if (reportsBody) {
    if (!reportsList.length) {
      reportsBody.innerHTML = '<tr><td colspan="5" class="text-center text-zinc-500 py-6">No recent reports found</td></tr>';
    } else {
      reportsBody.innerHTML = reportsList.map(r => `
        <tr>
          <td><span class="badge ${r.reportKind === 'Fraud' ? 'badge-danger' : 'badge-warning'}">${escapeHtml(r.reportKind)}</span></td>
          <td class="font-mono text-xs text-zinc-300 truncate max-w-[120px]">${escapeHtml(r.reportedName || r.targetId || r.reportedId || 'Target')}</td>
          <td class="text-xs text-zinc-300 truncate max-w-[150px]">${escapeHtml(r.reason || r.description || 'Policy flag')}</td>
          <td><span class="badge ${r.status === 'resolved' ? 'badge-success' : 'badge-zinc'}">${escapeHtml(r.status || 'pending')}</span></td>
          <td><button onclick="window.location.hash = '#reports'" class="btn btn-secondary btn-sm">Inspect</button></td>
        </tr>
      `).join('');
    }
  }

  // 2. Recent KYC Requests
  const kycList = [...state.data.buyerKycRecords]
    .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
    .slice(0, 5);

  const kycBody = document.getElementById('recentKycTableBody');
  if (kycBody) {
    if (!kycList.length) {
      kycBody.innerHTML = '<tr><td colspan="5" class="text-center text-zinc-500 py-6">No pending KYC records</td></tr>';
    } else {
      kycBody.innerHTML = kycList.map(k => `
        <tr>
          <td class="font-bold text-white text-xs">${escapeHtml(k.fullName || 'Applicant')}</td>
          <td class="font-mono text-xs text-[#f5b942]">${escapeHtml(k.ghanaCardMasked || k.ghanaCardNumber ? 'GHA-***' : 'Pending')}</td>
          <td><span class="badge badge-success text-[10px]">Verified Liveness</span></td>
          <td><span class="badge ${k.verificationStatus === 'approved' ? 'badge-success' : 'badge-warning'}">${escapeHtml(k.verificationStatus || 'pending')}</span></td>
          <td><button onclick="inspectKyc('${k.uid || k.id}')" class="btn btn-primary btn-sm">Review</button></td>
        </tr>
      `).join('');
    }
  }

  // 3. Recent Moderation Actions
  const modActions = state.data.posts.filter(p => p.violationDetected || p.reviewStatus === 'violation' || p.status === 'taken_down').slice(0, 5);
  const modBody = document.getElementById('recentModerationTableBody');
  if (modBody) {
    if (!modActions.length) {
      modBody.innerHTML = '<tr><td colspan="5" class="text-center text-zinc-500 py-6">No recent violation flags</td></tr>';
    } else {
      modBody.innerHTML = modActions.map(m => `
        <tr>
          <td class="font-mono text-xs text-zinc-300 truncate max-w-[120px]">${escapeHtml(m.id)}</td>
          <td class="text-xs text-rose-400 font-bold">${escapeHtml(m.violationRule || 'AI Safety Flag')}</td>
          <td><span class="badge badge-danger">${escapeHtml(m.status || 'Flagged')}</span></td>
          <td class="text-xs font-mono text-zinc-400">${Math.round((m.violationConfidence || 0.95) * 100)}%</td>
          <td class="text-xs text-zinc-400">${formatDate(m.createdAt)}</td>
        </tr>
      `).join('');
    }
  }

  // 4. Recent Orders
  const ordersList = [...state.data.orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
  const ordersBody = document.getElementById('recentOrdersTableBody');
  if (ordersBody) {
    if (!ordersList.length) {
      ordersBody.innerHTML = '<tr><td colspan="5" class="text-center text-zinc-500 py-6">No recent commerce orders</td></tr>';
    } else {
      ordersBody.innerHTML = ordersList.map(o => `
        <tr>
          <td class="font-mono text-xs font-bold text-white">${escapeHtml((o.id || '').substring(0, 10))}...</td>
          <td class="text-xs text-zinc-300">${escapeHtml(o.buyerName || o.buyerId || 'Buyer')}</td>
          <td class="font-mono font-bold text-emerald-400 text-xs">${formatCurrency(o.total)}</td>
          <td class="text-xs text-zinc-400 uppercase">${escapeHtml(o.paymentMethod || 'MOMO')}</td>
          <td><span class="badge ${o.status === 'delivered' ? 'badge-success' : 'badge-info'}">${escapeHtml(o.status || 'pending')}</span></td>
        </tr>
      `).join('');
    }
  }
}

// 9. TAB 2: USER MANAGEMENT
function renderUsersTable() {
  const search = (document.getElementById('userSearchInput')?.value || '').toLowerCase().trim();
  const filterRole = document.getElementById('userFilterRole')?.value || '';
  const filterKyc = document.getElementById('userFilterKyc')?.value || '';
  const filterStatus = document.getElementById('userFilterStatus')?.value || '';

  const filtered = state.data.users.filter(u => {
    if (search) {
      const matchName = (u.name || '').toLowerCase().includes(search);
      const matchUsername = (u.username || '').toLowerCase().includes(search);
      const matchEmail = (u.email || '').toLowerCase().includes(search);
      const matchPhone = (u.phone || '').toLowerCase().includes(search);
      const matchUid = (u.uid || u.id || '').toLowerCase().includes(search);
      if (!matchName && !matchUsername && !matchEmail && !matchPhone && !matchUid) return false;
    }
    if (filterRole && u.role !== filterRole) return false;
    if (filterKyc) {
      const status = u.verificationStatus || (u.verified ? 'approved' : 'none');
      if (status !== filterKyc) return false;
    }
    if (filterStatus) {
      if (filterStatus === 'suspended' && !u.suspended) return false;
      if (filterStatus === 'blocked' && !u.blocked) return false;
      if (filterStatus === 'active' && (u.suspended || u.blocked)) return false;
    }
    return true;
  });

  const countEl = document.getElementById('userResultsCount');
  if (countEl) countEl.textContent = `Showing ${filtered.length} of ${state.data.users.length} users`;

  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-zinc-500">No users match criteria</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(u => {
    const isSuspended = !!u.suspended;
    const isBlocked = !!u.blocked;
    const isVerified = !!u.verified || u.verificationStatus === 'approved';

    let accountBadge = '<span class="badge badge-success">Active</span>';
    if (isBlocked) {
      accountBadge = '<span class="badge badge-danger">Blocked</span>';
    } else if (isSuspended) {
      accountBadge = `<span class="badge badge-warning" title="${escapeHtml(u.suspensionReason || '')}">Suspended</span>`;
    }

    let kycBadge = '<span class="badge badge-zinc">Unverified</span>';
    if (isVerified) {
      kycBadge = '<span class="badge badge-gold">✓ Verified</span>';
    } else if (u.verificationStatus === 'pending') {
      kycBadge = '<span class="badge badge-warning">Pending Review</span>';
    } else if (u.verificationStatus === 'rejected') {
      kycBadge = '<span class="badge badge-danger">Rejected</span>';
    }

    return `
      <tr>
        <td>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-[#27272a] border border-[#3f3f46] flex items-center justify-center font-bold text-xs text-[#f5b942]">
              ${escapeHtml((u.name || u.username || 'U')[0].toUpperCase())}
            </div>
            <div>
              <div class="font-bold text-white text-xs">${escapeHtml(u.name || 'Unnamed')}</div>
              <div class="text-[11px] text-zinc-400">@${escapeHtml(u.username || 'user')}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="text-xs text-zinc-300">${escapeHtml(u.email || '—')}</div>
          <div class="text-[11px] text-zinc-500">${escapeHtml(u.phone || 'No phone')}</div>
        </td>
        <td>
          <span class="badge ${u.role === 'admin' ? 'badge-gold' : u.role === 'seller' ? 'badge-info' : 'badge-zinc'}">
            ${escapeHtml(u.role || 'user')}
          </span>
        </td>
        <td>${kycBadge}</td>
        <td>${accountBadge}</td>
        <td class="text-xs text-zinc-400">${formatDate(u.createdAt)}</td>
        <td class="text-right">
          <div class="flex items-center justify-end gap-1.5">
            ${isSuspended ? `
              <button onclick="handleUserAction('${u.uid || u.id}', 'unsuspend')" class="btn btn-secondary btn-sm">Unsuspend</button>
            ` : `
              <button onclick="handleUserAction('${u.uid || u.id}', 'suspend')" class="btn btn-secondary btn-sm text-amber-400 hover:border-amber-500">Suspend</button>
            `}
            ${isBlocked ? `
              <button onclick="handleUserAction('${u.uid || u.id}', 'unblock')" class="btn btn-secondary btn-sm">Unblock</button>
            ` : `
              <button onclick="handleUserAction('${u.uid || u.id}', 'block')" class="btn btn-danger btn-sm">Block</button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.handleUserAction = function(userId, action) {
  const user = state.data.users.find(u => (u.uid || u.id) === userId);
  const userName = user ? (user.name || user.username || userId) : userId;

  const titles = {
    suspend: `Suspend Account: ${userName}`,
    unsuspend: `Reactivate Account: ${userName}`,
    block: `Permanently Block Account: ${userName}`,
    unblock: `Remove Block: ${userName}`
  };

  const prompts = {
    suspend: 'Suspending this account will restrict the user from publishing posts, accepting orders, or posting job listings.',
    unsuspend: 'Reactivating this user will restore their account standing and marketplace capabilities.',
    block: 'Blocking an account is a high-severity security measure for fraudulent accounts or repeat policy violators.',
    unblock: 'Are you sure you want to lift the permanent block for this account?'
  };

  openConfirmModal({
    action,
    userId,
    title: titles[action],
    prompt: prompts[action],
    destructive: action === 'suspend' || action === 'block',
    btnText: action === 'suspend' ? 'Confirm Suspension' : action === 'block' ? 'Confirm Permanent Block' : 'Confirm Restoration',
    onExecute: async (reason, durationDays) => {
      try {
        const isSusp = action === 'suspend';
        const isBlk = action === 'block';
        const statusVal = isSusp ? 'suspended' : isBlk ? 'blocked' : 'active';

        const updates = {
          isSuspended: isSusp,
          isBlocked: isBlk,
          status: statusVal,
          suspensionReason: reason || null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (isSusp && durationDays) {
          const until = new Date();
          until.setDate(until.getDate() + Number(durationDays));
          updates.suspendedUntil = until.toISOString();
        }

        await Promise.all([
          db.collection('users').doc(userId).set(updates, { merge: true }),
          db.collection('publicProfiles').doc(userId).set({
            isSuspended: isSusp,
            isBlocked: isBlk,
            status: statusVal,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true })
        ]);

        // Record immutable audit entry in adminReviews
        await db.collection('adminReviews').add({
          action,
          targetType: 'user',
          targetId: userId,
          reason: reason || 'Administrative user moderation',
          durationDays: durationDays || null,
          adminEmail: state.currentUser?.email || 'admin',
          adminUid: state.currentUser?.uid || '',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast(`User account status updated: ${action}`, 'success');
        closeConfirmModal();
        await fetchAdminData();
      } catch (err) {
        console.error('User action error:', err);
        showToast(`Failed: ${err.message}`, 'error');
      }
    }
  });
};

// 10. TAB 3: STORE MANAGEMENT
function renderStoresTable() {
  const search = (document.getElementById('storeSearchInput')?.value || '').toLowerCase().trim();
  const filterStatus = document.getElementById('storeFilterStatus')?.value || '';

  const filtered = state.data.stores.filter(s => {
    if (search) {
      const matchName = (s.storeName || '').toLowerCase().includes(search);
      const matchLoc = (s.location || '').toLowerCase().includes(search);
      const matchSeller = (s.sellerId || '').toLowerCase().includes(search);
      if (!matchName && !matchLoc && !matchSeller) return false;
    }
    if (filterStatus && (s.status || 'approved') !== filterStatus) return false;
    return true;
  });

  const countEl = document.getElementById('storeResultsCount');
  if (countEl) countEl.textContent = `Showing ${filtered.length} of ${state.data.stores.length} stores`;

  const tbody = document.getElementById('storesTableBody');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-zinc-500">No stores found</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(s => {
    const isTakenDown = s.status === 'taken_down' || s.status === 'suspended';
    const storeProducts = state.data.products.filter(p => p.sellerId === s.sellerId).length;

    return `
      <tr>
        <td>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#222] border border-[#333] overflow-hidden flex items-center justify-center font-bold text-xs text-[#f5b942]">
              ${s.bannerUrl ? `<img src="${escapeHtml(s.bannerUrl)}" class="w-full h-full object-cover">` : '🏪'}
            </div>
            <div>
              <div class="font-bold text-white text-xs">${escapeHtml(s.storeName || 'Store')}</div>
              <div class="text-[11px] text-zinc-400 truncate max-w-[200px]">${escapeHtml(s.tagline || 'Seller storefront')}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="text-xs text-zinc-300 font-mono">${escapeHtml((s.sellerId || '').substring(0, 14))}...</div>
        </td>
        <td>
          <div class="text-xs text-zinc-300">${escapeHtml(s.location || 'Accra, Ghana')}</div>
          <div class="text-[11px] text-zinc-500">${escapeHtml(s.phone || '—')}</div>
        </td>
        <td>
          <span class="badge badge-zinc font-mono">${storeProducts} items</span>
        </td>
        <td>
          <span class="badge ${isTakenDown ? 'badge-danger' : 'badge-success'}">
            ${escapeHtml(s.status || 'approved')}
          </span>
        </td>
        <td class="text-right">
          ${isTakenDown ? `
            <button onclick="handleStoreRestore('${s.id || s.sellerId}')" class="btn btn-secondary btn-sm text-emerald-400">Restore Store</button>
          ` : `
            <button onclick="handleStoreTakedown('${s.id || s.sellerId}')" class="btn btn-danger btn-sm">Suspend Store</button>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

window.handleStoreTakedown = function(storeId) {
  openConfirmModal({
    action: 'takedown',
    title: `Suspend Store: ${storeId}`,
    prompt: 'Taking down this storefront will hide the vendor presence and related products from public browse.',
    destructive: true,
    btnText: 'Confirm Takedown',
    onExecute: async (reason) => {
      try {
        await db.collection('stores').doc(storeId).set({
          status: 'suspended',
          reviewStatus: 'removed',
          takedownReason: reason || 'Suspended by Administrator',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await db.collection('adminReviews').add({
          action: 'takedown',
          targetType: 'store',
          targetId: storeId,
          reason: reason || 'Storefront suspension',
          adminEmail: state.currentUser?.email || 'admin',
          adminUid: state.currentUser?.uid || '',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast('Store suspended successfully', 'success');
        closeConfirmModal();
        await fetchAdminData();
      } catch (err) {
        showToast(`Failed: ${err.message}`, 'error');
      }
    }
  });
};

window.handleStoreRestore = function(storeId) {
  openConfirmModal({
    action: 'restore',
    title: `Restore Store: ${storeId}`,
    prompt: 'Reinstating this storefront will make it and its approved products visible again across SellerFlow.',
    destructive: false,
    btnText: 'Restore Storefront',
    onExecute: async (reason) => {
      try {
        await db.collection('stores').doc(storeId).set({
          status: 'approved',
          reviewStatus: 'approved',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await db.collection('adminReviews').add({
          action: 'restore',
          targetType: 'store',
          targetId: storeId,
          reason: reason || 'Storefront reinstated',
          adminEmail: state.currentUser?.email || 'admin',
          adminUid: state.currentUser?.uid || '',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast('Store restored successfully', 'success');
        closeConfirmModal();
        await fetchAdminData();
      } catch (err) {
        showToast(`Failed: ${err.message}`, 'error');
      }
    }
  });
};

// 11. TAB 4: PRODUCT MANAGEMENT
function renderProductsTable() {
  const search = (document.getElementById('productSearchInput')?.value || '').toLowerCase().trim();
  const filterCat = document.getElementById('productFilterCategory')?.value || '';
  const filterStatus = document.getElementById('productFilterStatus')?.value || '';

  const filtered = state.data.products.filter(p => {
    if (search) {
      const matchTitle = (p.title || p.name || '').toLowerCase().includes(search);
      const matchSeller = (p.sellerId || '').toLowerCase().includes(search);
      if (!matchTitle && !matchSeller) return false;
    }
    if (filterCat && p.category !== filterCat) return false;
    if (filterStatus && (p.status || 'approved') !== filterStatus) return false;
    return true;
  });

  const countEl = document.getElementById('productResultsCount');
  if (countEl) countEl.textContent = `Showing ${filtered.length} of ${state.data.products.length} products`;

  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-zinc-500">No products match criteria</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const isTakenDown = p.status === 'taken_down';

    return `
      <tr>
        <td>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#222] border border-[#333] overflow-hidden flex items-center justify-center font-bold text-xs text-zinc-400">
              ${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" class="w-full h-full object-cover">` : '📦'}
            </div>
            <div>
              <div class="font-bold text-white text-xs">${escapeHtml(p.title || p.name || 'Product')}</div>
              <div class="text-[11px] text-zinc-400 font-mono">ID: ${(p.id || '').substring(0, 10)}...</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-zinc">${escapeHtml(p.category || 'General')}</span></td>
        <td class="font-mono font-bold text-emerald-400 text-xs">${formatCurrency(p.price)}</td>
        <td class="font-mono text-xs text-zinc-300">${p.stock !== undefined ? p.stock : 1}</td>
        <td class="text-xs text-zinc-400 font-mono truncate max-w-[120px]">${escapeHtml(p.sellerId || '—')}</td>
        <td>
          <span class="badge ${isTakenDown ? 'badge-danger' : 'badge-success'}">
            ${escapeHtml(p.status || 'approved')}
          </span>
        </td>
        <td class="text-right">
          ${isTakenDown ? `
            <button onclick="handleProductRestore('${p.id}')" class="btn btn-secondary btn-sm text-emerald-400">Restore</button>
          ` : `
            <button onclick="handleProductTakedown('${p.id}')" class="btn btn-danger btn-sm">Take Down</button>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

window.handleProductTakedown = function(productId) {
  openConfirmModal({
    action: 'takedown',
    title: `Take Down Product: ${productId}`,
    prompt: 'Removing this product listing will immediately delist it from the marketplace catalogue.',
    destructive: true,
    btnText: 'Confirm Delisting',
    onExecute: async (reason) => {
      try {
        await db.collection('products').doc(productId).set({
          status: 'taken_down',
          reviewStatus: 'removed',
          takedownReason: reason || 'Delisted by Administrator',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await db.collection('adminReviews').add({
          action: 'takedown',
          targetType: 'product',
          targetId: productId,
          reason: reason || 'Product delisting',
          adminEmail: state.currentUser?.email || 'admin',
          adminUid: state.currentUser?.uid || '',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast('Product taken down successfully', 'success');
        closeConfirmModal();
        await fetchAdminData();
      } catch (err) {
        showToast(`Failed: ${err.message}`, 'error');
      }
    }
  });
};

window.handleProductRestore = function(productId) {
  openConfirmModal({
    action: 'restore',
    title: `Restore Product: ${productId}`,
    prompt: 'Reinstating this product will make it live and purchasable in the marketplace again.',
    destructive: false,
    btnText: 'Restore Product',
    onExecute: async (reason) => {
      try {
        await db.collection('products').doc(productId).set({
          status: 'approved',
          reviewStatus: 'approved',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await db.collection('adminReviews').add({
          action: 'restore',
          targetType: 'product',
          targetId: productId,
          reason: reason || 'Product reinstated',
          adminEmail: state.currentUser?.email || 'admin',
          adminUid: state.currentUser?.uid || '',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast('Product restored successfully', 'success');
        closeConfirmModal();
        await fetchAdminData();
      } catch (err) {
        showToast(`Failed: ${err.message}`, 'error');
      }
    }
  });
};

// 12. TAB 5: CONTENT MODERATION (POSTS & MEDIA)
let currentModFilter = 'all';

function renderModerationPosts() {
  const container = document.getElementById('moderationPostsContainer');
  if (!container) return;

  const filtered = state.data.posts.filter(p => {
    if (currentModFilter === 'pending') {
      return p.reviewStatus === 'under_review' || p.reviewStatus === 'pending' || p.status === 'pending';
    }
    if (currentModFilter === 'ai_flagged') {
      return p.violationDetected || p.reviewStatus === 'violation' || p.needsAdminReview;
    }
    if (currentModFilter === 'copyright') {
      return p.copyrightDetected || p.audioMutedByCopyright;
    }
    if (currentModFilter === 'taken_down') {
      return p.status === 'taken_down' || p.status === 'hidden';
    }
    return true;
  });

  const countEl = document.getElementById('moderationCount');
  if (countEl) countEl.textContent = `${filtered.length} posts displayed`;

  if (!filtered.length) {
    container.innerHTML = '<div class="col-span-full text-center py-12 text-zinc-500">No posts in this moderation view</div>';
    return;
  }

  container.innerHTML = filtered.map(p => {
    const isTakenDown = p.status === 'taken_down' || p.status === 'hidden';
    const isAiFlag = p.violationDetected || p.reviewStatus === 'violation';
    const isCopyright = p.audioMutedByCopyright || p.copyrightDetected;

    return `
      <div class="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden flex flex-col justify-between">
        <div class="p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="badge ${isTakenDown ? 'badge-danger' : isAiFlag ? 'badge-warning' : 'badge-success'}">
              ${escapeHtml(p.status || 'published')}
            </span>
            <span class="text-[11px] text-zinc-400">${formatDate(p.createdAt)}</span>
          </div>

          <!-- Media preview thumbnail -->
          <div class="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center relative border border-[#222]">
            ${p.mediaUrl ? (
              p.mediaType === 'video' || (p.mediaUrl || '').endsWith('.mp4') ? `
                <video src="${escapeHtml(p.mediaUrl)}" class="w-full h-full object-cover" muted></video>
                <div class="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span class="text-2xl">▶️</span>
                </div>
              ` : `
                <img src="${escapeHtml(p.mediaUrl)}" class="w-full h-full object-cover">
              `
            ) : `<span class="text-zinc-600 text-xs">Text post</span>`}

            ${isCopyright ? `
              <div class="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 border border-amber-500/50 text-[10px] text-amber-400 font-bold flex items-center gap-1">
                <span>🔇</span> Audio Muted
              </div>
            ` : ''}
          </div>

          <!-- Caption -->
          <p class="text-xs text-zinc-200 line-clamp-2">${escapeHtml(p.text || 'No caption')}</p>

          <!-- AI Finding Notice -->
          ${isAiFlag ? `
            <div class="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] space-y-1">
              <div class="font-bold text-rose-400 flex items-center justify-between">
                <span>⚠️ Gemini 3.8 Flash Flag</span>
                <span class="font-mono">${Math.round((p.violationConfidence || 0.9) * 100)}% Conf.</span>
              </div>
              <p class="text-zinc-300 text-[11px]">${escapeHtml(p.violationReason || p.violationRule || 'Policy safety threshold exceeded')}</p>
            </div>
          ` : ''}

          ${isCopyright ? `
            <div class="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px]">
              <span class="font-bold text-amber-400">Content ID Copyright Match:</span>
              <p class="text-zinc-300 mt-0.5">${escapeHtml(p.copyrightMatch?.track || 'Commercial master recording')} (${escapeHtml(p.copyrightMatch?.claimant || 'Label')})</p>
            </div>
          ` : ''}
        </div>

        <div class="p-3 bg-[#111] border-t border-[#262626] flex items-center justify-between gap-2">
          <button onclick="inspectPostDetails('${p.id}')" class="btn btn-secondary btn-sm flex-1">Inspect</button>
          ${isTakenDown ? `
            <button onclick="handlePostRestore('${p.id}')" class="btn btn-success btn-sm flex-1">Restore</button>
          ` : `
            <button onclick="handlePostTakedown('${p.id}')" class="btn btn-danger btn-sm flex-1">Take Down</button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

window.inspectPostDetails = function(postId) {
  const post = state.data.posts.find(p => p.id === postId);
  if (!post) return;
  state.activePostItem = post;

  const modal = document.getElementById('postInspectorModal');
  const mediaContainer = document.getElementById('postModalMediaContainer');
  const textEl = document.getElementById('postModalText');
  const sellerIdEl = document.getElementById('postModalSellerId');
  const aiWrap = document.getElementById('postModalAiWrap');
  const aiFinding = document.getElementById('postModalAiFinding');
  const actionBtn = document.getElementById('postModalActionBtn');

  if (textEl) textEl.textContent = post.text || 'No caption';
  if (sellerIdEl) sellerIdEl.textContent = post.sellerId || '—';

  if (mediaContainer) {
    if (post.mediaUrl) {
      if (post.mediaType === 'video' || (post.mediaUrl || '').endsWith('.mp4')) {
        mediaContainer.innerHTML = `<video src="${escapeHtml(post.mediaUrl)}" controls autoplay class="max-h-80 w-auto"></video>`;
      } else {
        mediaContainer.innerHTML = `<img src="${escapeHtml(post.mediaUrl)}" class="max-h-80 w-auto object-contain">`;
      }
    } else {
      mediaContainer.innerHTML = '<span class="text-zinc-600 text-xs py-8">Text-only post</span>';
    }
  }

  if (aiWrap && aiFinding) {
    if (post.violationDetected || post.violationReason) {
      aiWrap.classList.remove('hidden');
      aiFinding.textContent = `${post.violationRule || 'Policy'}: ${post.violationReason || 'Flagged'}`;
    } else {
      aiWrap.classList.add('hidden');
    }
  }

  if (actionBtn) {
    const isTakenDown = post.status === 'taken_down' || post.status === 'hidden';
    actionBtn.className = `btn ${isTakenDown ? 'btn-success' : 'btn-danger'} btn-sm`;
    actionBtn.textContent = isTakenDown ? 'Restore Post' : 'Take Down Post';
    actionBtn.onclick = () => {
      closePostModal();
      if (isTakenDown) handlePostRestore(post.id);
      else handlePostTakedown(post.id);
    };
  }

  modal?.classList.add('open');
};

window.handlePostTakedown = function(postId) {
  openConfirmModal({
    action: 'takedown',
    title: `Take Down Post: ${postId}`,
    prompt: 'Removing this post will immediately hide it from all user feeds and save an immutable copy in the Security archive.',
    destructive: true,
    btnText: 'Confirm Removal',
    onExecute: async (reason) => {
      try {
        const post = state.data.posts.find(p => p.id === postId);

        await db.collection('posts').doc(postId).set({
          status: 'taken_down',
          reviewStatus: 'removed',
          takedownReason: reason || 'Content policy violation',
          removedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await db.collection('adminReviews').add({
          action: 'takedown',
          targetType: 'post',
          targetId: postId,
          reason: reason || 'Policy violation removal',
          postSnapshot: post || null,
          adminEmail: state.currentUser?.email || 'admin',
          adminUid: state.currentUser?.uid || '',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast('Post taken down and logged to security archive', 'success');
        closeConfirmModal();
        await fetchAdminData();
      } catch (err) {
        showToast(`Failed: ${err.message}`, 'error');
      }
    }
  });
};

window.handlePostRestore = function(postId) {
  openConfirmModal({
    action: 'restore',
    title: `Restore Post: ${postId}`,
    prompt: 'Reinstating this post will return it to the live For You feed and mark its status as published.',
    destructive: false,
    btnText: 'Restore Content',
    onExecute: async (reason) => {
      try {
        await db.collection('posts').doc(postId).set({
          status: 'active',
          reviewStatus: 'approved',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await db.collection('adminReviews').add({
          action: 'restore',
          targetType: 'post',
          targetId: postId,
          reason: reason || 'Post restored to live feed',
          adminEmail: state.currentUser?.email || 'admin',
          adminUid: state.currentUser?.uid || '',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast('Post restored to live feed successfully', 'success');
        closeConfirmModal();
        await fetchAdminData();
      } catch (err) {
        showToast(`Failed: ${err.message}`, 'error');
      }
    }
  });
};

// 13. TAB 6: GHANA CARD / KYC VERIFICATION CENTER
function renderKycTable() {
  const search = (document.getElementById('kycSearchInput')?.value || '').toLowerCase().trim();
  const filterStatus = document.getElementById('kycFilterStatus')?.value || 'pending';

  const filtered = state.data.buyerKycRecords.filter(k => {
    if (search) {
      const matchName = (k.fullName || '').toLowerCase().includes(search);
      const matchPin = (k.ghanaCardNumber || k.ghanaCardMasked || '').toLowerCase().includes(search);
      if (!matchName && !matchPin) return false;
    }
    const status = (k.verificationStatus || 'pending').toLowerCase();
    if (filterStatus === 'pending' && status !== 'pending' && status !== 'review') return false;
    if (filterStatus === 'approved' && status !== 'approved' && status !== 'verified') return false;
    if (filterStatus === 'rejected' && status !== 'rejected') return false;
    return true;
  });

  const queueStatus = document.getElementById('kycQueueStatus');
  if (queueStatus) queueStatus.textContent = `${filtered.length} Submissions`;

  const tbody = document.getElementById('kycTableBody');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-zinc-500">No verification submissions found</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(k => {
    const isApproved = k.verificationStatus === 'approved' || k.verificationStatus === 'VERIFIED';
    const isRejected = k.verificationStatus === 'rejected' || k.verificationStatus === 'REJECTED';

    return `
      <tr>
        <td>
          <div class="font-bold text-white text-xs">${escapeHtml(k.fullName || 'Applicant')}</div>
          <div class="text-[11px] text-zinc-400 font-mono">UID: ${(k.uid || k.id || '').substring(0, 12)}...</div>
        </td>
        <td class="font-mono text-xs text-[#f5b942]">
          ${escapeHtml(k.ghanaCardMasked || (k.ghanaCardNumber ? `GHA-${k.ghanaCardNumber.substring(4, 7)}***-X` : 'GHA-***'))}
        </td>
        <td>
          <span class="badge badge-success text-[10px]">Biometric Pass</span>
        </td>
        <td class="text-xs text-zinc-400">${formatDate(k.submittedAt)}</td>
        <td>
          <span class="badge ${isApproved ? 'badge-success' : isRejected ? 'badge-danger' : 'badge-warning'}">
            ${escapeHtml(k.verificationStatus || 'pending')}
          </span>
        </td>
        <td class="text-right">
          <button onclick="inspectKyc('${k.uid || k.id}')" class="btn btn-primary btn-sm">Inspect & Audit</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.inspectKyc = function(userId) {
  const item = state.data.buyerKycRecords.find(k => (k.uid || k.id) === userId);
  if (!item) return;
  state.activeKycItem = item;

  const modal = document.getElementById('kycInspectorModal');
  const nameEl = document.getElementById('kycModalApplicantName');
  const pinEl = document.getElementById('kycModalPin');
  const dobEl = document.getElementById('kycModalDob');
  const frontContainer = document.getElementById('kycFrontContainer');
  const backContainer = document.getElementById('kycBackContainer');
  const selfieContainer = document.getElementById('kycSelfieContainer');

  if (nameEl) nameEl.textContent = item.fullName || 'Applicant';
  if (pinEl) pinEl.textContent = item.ghanaCardMasked || item.ghanaCardNumber || 'GHA-XXXXXXXXX-X';
  if (dobEl) dobEl.textContent = item.dateOfBirth || '1990-01-01';

  // Secure Document Renderers
  const renderDocImage = (container, path) => {
    if (!container) return;
    if (path) {
      const src = path.startsWith('http') || path.startsWith('/') ? path : `/uploads/${path}`;
      container.innerHTML = `<img src="${escapeHtml(src)}" class="w-full h-full object-contain">`;
    } else {
      container.innerHTML = '<span class="text-zinc-600 text-xs">Document not provided</span>';
    }
  };

  renderDocImage(frontContainer, item.ghanaCardFrontPath || item.frontPath);
  renderDocImage(backContainer, item.ghanaCardBackPath || item.backPath);
  renderDocImage(selfieContainer, item.selfieStoragePath || item.selfiePath);

  // Wire decision buttons
  const approveBtn = document.getElementById('kycApproveBtn');
  const rejectToggleBtn = document.getElementById('kycRejectToggleBtn');
  const rejectOptions = document.getElementById('kycRejectOptions');

  if (approveBtn) {
    approveBtn.onclick = () => executeKycDecision(item.uid || item.id, 'approve');
  }

  if (rejectToggleBtn && rejectOptions) {
    rejectToggleBtn.onclick = () => {
      const isHidden = rejectOptions.classList.contains('hidden');
      rejectOptions.classList.toggle('hidden', !isHidden);
      if (isHidden) {
        rejectToggleBtn.textContent = 'Confirm Rejection';
        rejectToggleBtn.onclick = () => {
          const reason = document.getElementById('kycRejectReasonInput')?.value || 'Statutory criteria not met';
          const instructions = document.getElementById('kycCorrectionInstructionsInput')?.value || '';
          executeKycDecision(item.uid || item.id, 'reject', reason, instructions);
        };
      }
    };
  }

  modal?.classList.add('open');
};

async function executeKycDecision(userId, action, reason = '', correctionInstructions = '') {
  try {
    const isApprove = action === 'approve';
    const statusVal = isApprove ? 'approved' : 'rejected';

    const kycUpdates = {
      verificationStatus: statusVal,
      status: statusVal,
      reviewedBy: state.currentUser?.email || 'admin',
      reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (!isApprove) {
      kycUpdates.rejectionReason = reason || 'Statutory criteria not met';
      kycUpdates.correctionInstructions = correctionInstructions || '';
    }

    const userUpdates = {
      isVerifiedSeller: isApprove,
      verificationStatus: statusVal,
      kycStatus: statusVal,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await Promise.all([
      db.collection('buyerKycRecords').doc(userId).set(kycUpdates, { merge: true }),
      db.collection('users').doc(userId).set(userUpdates, { merge: true }),
      db.collection('publicProfiles').doc(userId).set({ isVerifiedSeller: isApprove, verified: isApprove, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true })
    ]);

    await db.collection('securityReviews').add({
      action: `kyc_${action}`,
      targetType: 'buyerKyc',
      targetId: userId,
      reason: reason || (isApprove ? 'Ghana Card identity verified' : 'KYC verification rejected'),
      adminEmail: state.currentUser?.email || 'admin',
      adminUid: state.currentUser?.uid || '',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    showToast(isApprove ? 'KYC application approved: Vendor verified' : 'KYC application rejected', 'success');
    closeKycModal();
    await fetchAdminData();
  } catch (err) {
    console.error('KYC decision error:', err);
    showToast(`Failed: ${err.message}`, 'error');
  }
}

// 14. TAB 7: REPORTS DESK
function renderReportsTable() {
  const search = (document.getElementById('reportSearchInput')?.value || '').toLowerCase().trim();
  const filterStatus = document.getElementById('reportFilterStatus')?.value || 'pending';
  const filterType = document.getElementById('reportFilterType')?.value || 'all';

  const combined = [
    ...state.data.scamReports.map(s => ({ ...s, reportType: 'scam' })),
    ...state.data.fraudReports.map(f => ({ ...f, reportType: 'fraud' }))
  ];

  const filtered = combined.filter(r => {
    if (search) {
      const matchReason = (r.reason || r.description || '').toLowerCase().includes(search);
      const matchTarget = (r.targetId || r.reportedId || r.reportedName || '').toLowerCase().includes(search);
      const matchReporter = (r.reporterId || r.reporterEmail || '').toLowerCase().includes(search);
      if (!matchReason && !matchTarget && !matchReporter) return false;
    }
    if (filterType !== 'all' && r.reportType !== filterType) return false;
    const status = (r.status || 'pending').toLowerCase();
    if (filterStatus !== 'all' && status !== filterStatus) return false;
    return true;
  });

  const countEl = document.getElementById('reportsQueueCount');
  if (countEl) countEl.textContent = `${filtered.length} reports`;

  const tbody = document.getElementById('reportsTableBody');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-zinc-500">No reports matching filter</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td><span class="badge ${r.reportType === 'fraud' ? 'badge-danger' : 'badge-warning'}">${escapeHtml(r.reportType)}</span></td>
      <td>
        <div class="font-bold text-white text-xs">${escapeHtml(r.reportedName || r.targetType || 'Target')}</div>
        <div class="text-[11px] text-zinc-500 font-mono">${escapeHtml(r.targetId || r.reportedId || '—')}</div>
      </td>
      <td class="text-xs text-zinc-400 font-mono">${escapeHtml(r.reporterEmail || r.reporterId || 'Anonymous')}</td>
      <td class="text-xs text-zinc-300 max-w-[200px] truncate" title="${escapeHtml(r.reason || r.description || '')}">
        ${escapeHtml(r.reason || r.description || 'Alleged violation')}
      </td>
      <td>
        <span class="badge ${r.status === 'resolved' ? 'badge-success' : r.status === 'investigating' ? 'badge-info' : 'badge-zinc'}">
          ${escapeHtml(r.status || 'pending')}
        </span>
      </td>
      <td class="text-xs text-zinc-400">${formatDate(r.createdAt)}</td>
      <td class="text-right">
        <div class="flex items-center justify-end gap-1.5">
          <button onclick="handleReportStatus('${r.id}', '${r.reportType}', 'investigating')" class="btn btn-secondary btn-sm text-blue-400">Investigate</button>
          <button onclick="handleReportStatus('${r.id}', '${r.reportType}', 'resolved')" class="btn btn-success btn-sm">Resolve</button>
          <button onclick="handleReportStatus('${r.id}', '${r.reportType}', 'dismissed')" class="btn btn-secondary btn-sm text-zinc-500">Dismiss</button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.handleReportStatus = async function(reportId, reportType, status) {
  try {
    const collectionName = reportType === 'fraud' ? 'fraudReports' : 'scamReports';
    await db.collection(collectionName).doc(reportId).set({
      status,
      resolvedBy: state.currentUser?.email || 'admin',
      resolvedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await db.collection('adminReviews').add({
      action: `report_${status}`,
      targetType: reportType,
      targetId: reportId,
      status,
      adminEmail: state.currentUser?.email || 'admin',
      adminUid: state.currentUser?.uid || '',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    showToast(`Report status updated: ${status}`, 'success');
    await fetchAdminData();
  } catch (err) {
    showToast(`Failed: ${err.message}`, 'error');
  }
};

// 15. TAB 8: ORDERS OVERSIGHT
function renderOrdersTable() {
  const search = (document.getElementById('orderSearchInput')?.value || '').toLowerCase().trim();
  const filterStatus = document.getElementById('orderFilterStatus')?.value || 'all';

  const filtered = state.data.orders.filter(o => {
    if (search) {
      const matchId = (o.id || '').toLowerCase().includes(search);
      const matchBuyer = (o.buyerName || o.buyerId || '').toLowerCase().includes(search);
      const matchPhone = (o.phone || '').toLowerCase().includes(search);
      if (!matchId && !matchBuyer && !matchPhone) return false;
    }
    if (filterStatus !== 'all' && (o.status || 'pending') !== filterStatus) return false;
    return true;
  });

  const totalVol = filtered.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const volEl = document.getElementById('ordersTotalVolume');
  if (volEl) volEl.textContent = `Total: ${formatCurrency(totalVol)}`;

  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-zinc-500">No orders found</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(o => `
    <tr>
      <td class="font-mono text-xs font-bold text-white">${escapeHtml((o.id || '').substring(0, 12))}...</td>
      <td>
        <div class="font-bold text-white text-xs">${escapeHtml(o.buyerName || 'Buyer')}</div>
        <div class="text-[11px] text-zinc-500">${escapeHtml(o.phone || o.deliveryAddress || 'Ghana')}</div>
      </td>
      <td class="text-xs text-zinc-300">
        ${Array.isArray(o.items) ? `${o.items.length} items (${o.items[0]?.title || 'item'}...)` : 'Standard package'}
      </td>
      <td class="font-mono font-bold text-emerald-400 text-xs">${formatCurrency(o.total)}</td>
      <td class="text-xs text-zinc-400 uppercase font-bold">${escapeHtml(o.paymentMethod || 'MOMO')}</td>
      <td>
        <span class="badge ${o.status === 'delivered' ? 'badge-success' : o.status === 'cancelled' ? 'badge-danger' : 'badge-info'}">
          ${escapeHtml(o.status || 'pending')}
        </span>
      </td>
      <td class="text-xs text-zinc-400">${formatDate(o.createdAt)}</td>
      <td class="text-right">
        <button onclick="alert('Order #${o.id}\\nTotal: ${formatCurrency(o.total)}\\nAddress: ${o.deliveryAddress || 'N/A'}\\nStatus: ${o.status}')" class="btn btn-secondary btn-sm">
          Details
        </button>
      </td>
    </tr>
  `).join('');
}

// 16. TAB 9 & 10: JOBS & EVENTS MANAGEMENT
function renderJobsTable() {
  const tbody = document.getElementById('jobsTableBody');
  if (!tbody) return;

  if (!state.data.jobs.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-zinc-500">No job listings found in database</td></tr>';
    return;
  }

  tbody.innerHTML = state.data.jobs.map(j => `
    <tr>
      <td>
        <div class="font-bold text-white text-xs">${escapeHtml(j.title || 'Job Title')}</div>
        <div class="text-[11px] text-zinc-400">${escapeHtml(j.companyName || 'Company')}</div>
      </td>
      <td class="text-xs text-zinc-300">${escapeHtml(j.location || 'Accra')} (${escapeHtml(j.region || 'Greater Accra')})</td>
      <td>
        <div class="text-xs text-zinc-300">${escapeHtml(j.employmentType || 'Full-time')}</div>
        <div class="text-[11px] font-mono text-emerald-400">GH₵${j.salaryMin || 0} - GH₵${j.salaryMax || 0}</div>
      </td>
      <td class="font-mono text-xs text-zinc-400 truncate max-w-[120px]">${escapeHtml(j.creatorId || '—')}</td>
      <td>
        <span class="badge ${j.status === 'approved' ? 'badge-success' : j.status === 'rejected' ? 'badge-danger' : 'badge-warning'}">
          ${escapeHtml(j.status || 'pending_review')}
        </span>
      </td>
      <td class="text-right">
        <div class="flex items-center justify-end gap-1.5">
          <button onclick="handleSecurityAction('job', '${j.id}', 'approve')" class="btn btn-success btn-sm">Approve</button>
          <button onclick="handleSecurityAction('job', '${j.id}', 'remove')" class="btn btn-danger btn-sm">Take Down</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderEventsTable() {
  const tbody = document.getElementById('eventsTableBody');
  if (!tbody) return;

  if (!state.data.events.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-zinc-500">No events found in database</td></tr>';
    return;
  }

  tbody.innerHTML = state.data.events.map(e => `
    <tr>
      <td>
        <div class="font-bold text-white text-xs">${escapeHtml(e.title || 'Event')}</div>
        <div class="text-[11px] text-zinc-400">${escapeHtml(e.organizerName || 'Organizer')}</div>
      </td>
      <td class="text-xs text-zinc-300">${escapeHtml(e.venue || 'Venue')}, ${escapeHtml(e.city || 'Accra')}</td>
      <td class="text-xs text-zinc-400">${formatDate(e.startDate)}</td>
      <td class="font-mono text-xs text-emerald-400 font-bold">${e.ticketPrice ? `GH₵${e.ticketPrice}` : 'Free'}</td>
      <td>
        <span class="badge ${e.status === 'approved' ? 'badge-success' : 'badge-warning'}">
          ${escapeHtml(e.status || 'pending_review')}
        </span>
      </td>
      <td class="text-right">
        <div class="flex items-center justify-end gap-1.5">
          <button onclick="handleSecurityAction('event', '${e.id}', 'approve')" class="btn btn-success btn-sm">Approve</button>
          <button onclick="handleSecurityAction('event', '${e.id}', 'remove')" class="btn btn-danger btn-sm">Take Down</button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.handleSecurityAction = function(targetType, targetId, action) {
  openConfirmModal({
    action,
    title: `Security Action: ${action.toUpperCase()} ${targetType}`,
    prompt: `Execute security moderation action "${action}" on ${targetType} listing ${targetId}?`,
    destructive: action === 'remove' || action === 'reject' || action === 'delete',
    btnText: `Execute ${action}`,
    onExecute: async (reason) => {
      try {
        const collectionName = targetType === 'job' ? 'jobs' : 'events';
        const isApprove = action === 'approve';
        const statusVal = isApprove ? 'approved' : 'removed';

        await db.collection(collectionName).doc(targetId).set({
          status: statusVal,
          reviewStatus: statusVal,
          moderationReason: reason || null,
          moderatedBy: state.currentUser?.email || 'admin',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await db.collection('securityReviews').add({
          action: `${targetType}_${action}`,
          targetType,
          targetId,
          reason: reason || `Security moderation: ${action}`,
          adminEmail: state.currentUser?.email || 'admin',
          adminUid: state.currentUser?.uid || '',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast(`${targetType === 'job' ? 'Job' : 'Event'} listing ${action === 'approve' ? 'approved' : 'removed'} successfully`, 'success');
        closeConfirmModal();
        await fetchAdminData();
      } catch (err) {
        showToast(`Failed: ${err.message}`, 'error');
      }
    }
  });
};

// 17. TAB 11: AUDIT LOGS
function renderAuditLogsTable() {
  const search = (document.getElementById('auditSearchInput')?.value || '').toLowerCase().trim();
  const filterAction = document.getElementById('auditFilterAction')?.value || 'all';

  const filtered = state.data.auditLogs.filter(log => {
    if (search) {
      const matchAdmin = (log.reviewerUid || log.takenDownBy || '').toLowerCase().includes(search);
      const matchTarget = (log.targetId || log.postId || '').toLowerCase().includes(search);
      const matchReason = (log.reason || log.notes || '').toLowerCase().includes(search);
      if (!matchAdmin && !matchTarget && !matchReason) return false;
    }
    if (filterAction !== 'all') {
      const act = (log.action || '').toLowerCase();
      if (!act.includes(filterAction)) return false;
    }
    return true;
  });

  const tbody = document.getElementById('auditLogsTableBody');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-zinc-500">No audit logs recorded yet</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(l => `
    <tr>
      <td class="text-xs text-zinc-400 font-mono">${formatDate(l.timestamp)}</td>
      <td class="font-mono text-xs text-zinc-300">${escapeHtml(l.reviewerUid || l.takenDownBy || 'System')}</td>
      <td><span class="badge badge-zinc uppercase text-[10px]">${escapeHtml(l.action || 'moderation')}</span></td>
      <td>
        <span class="text-xs text-white font-bold">${escapeHtml(l.targetType || 'post')}</span>
        <span class="text-[11px] text-zinc-500 font-mono block">${escapeHtml(l.targetId || l.postId || '—')}</span>
      </td>
      <td class="text-xs text-zinc-300 max-w-[280px]">${escapeHtml(l.reason || l.notes || 'Administrative review')}</td>
    </tr>
  `).join('');
}

// 18. Event Listeners & Bootstrapping
document.addEventListener('DOMContentLoaded', () => {
  // Hash routing
  const initialHash = window.location.hash.replace('#', '') || 'dashboard';
  switchTab(initialHash);

  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace('#', '') || 'dashboard';
    switchTab(h);
  });

  // Nav Links
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });

  // Sidebar toggle
  document.getElementById('openSidebarBtn')?.addEventListener('click', () => {
    document.getElementById('adminSidebar')?.classList.remove('-translate-x-full');
    document.getElementById('sidebarBackdrop')?.classList.remove('hidden');
  });

  document.getElementById('closeSidebarBtn')?.addEventListener('click', () => {
    document.getElementById('adminSidebar')?.classList.add('-translate-x-full');
    document.getElementById('sidebarBackdrop')?.classList.add('hidden');
  });

  document.getElementById('sidebarBackdrop')?.addEventListener('click', () => {
    document.getElementById('adminSidebar')?.classList.add('-translate-x-full');
    document.getElementById('sidebarBackdrop')?.classList.add('hidden');
  });

  // Global Refresh
  document.getElementById('globalRefreshBtn')?.addEventListener('click', () => fetchAdminData(true));

  // Mod Pills Filter
  document.querySelectorAll('.mod-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.mod-pill').forEach(p => {
        p.classList.remove('bg-[#f5b942]', 'text-black');
        p.classList.add('bg-[#1e1e1e]', 'text-zinc-300');
      });
      pill.classList.remove('bg-[#1e1e1e]', 'text-zinc-300');
      pill.classList.add('bg-[#f5b942]', 'text-black');
      currentModFilter = pill.getAttribute('data-mod-filter') || 'all';
      renderModerationPosts();
    });
  });

  // Filter change inputs
  ['userSearchInput', 'userFilterRole', 'userFilterKyc', 'userFilterStatus'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderUsersTable);
  });

  ['storeSearchInput', 'storeFilterStatus'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderStoresTable);
  });

  ['productSearchInput', 'productFilterCategory', 'productFilterStatus'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderProductsTable);
  });

  ['kycSearchInput', 'kycFilterStatus'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderKycTable);
  });

  ['reportSearchInput', 'reportFilterStatus', 'reportFilterType'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderReportsTable);
  });

  ['orderSearchInput', 'orderFilterStatus'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderOrdersTable);
  });

  ['auditSearchInput', 'auditFilterAction'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderAuditLogsTable);
  });

  // Confirm Modal Execution
  document.getElementById('confirmExecuteBtn')?.addEventListener('click', async () => {
    if (!state.pendingAction || !state.pendingAction.onExecute) return;
    const reason = document.getElementById('confirmReasonInput')?.value.trim();
    if (!reason) {
      alert('Please provide a mandatory administrative reason or compliance justification.');
      return;
    }
    const durationDays = Number(document.getElementById('confirmDurationSelect')?.value) || 0;
    await state.pendingAction.onExecute(reason, durationDays);
  });

  // Email/Password Login
  document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmailInput')?.value.trim();
    const password = document.getElementById('adminPasswordInput')?.value;
    const loginBtn = document.getElementById('adminLoginBtn');
    const loginText = document.getElementById('loginBtnText');
    const loginSpinner = document.getElementById('loginSpinner');
    const alertEl = document.getElementById('loginAlert');

    if (!email || !password) return;

    if (loginBtn) loginBtn.disabled = true;
    if (loginText) loginText.textContent = 'Verifying Clearance...';
    if (loginSpinner) loginSpinner.classList.remove('hidden');
    if (alertEl) alertEl.classList.add('hidden');

    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      if (alertEl) {
        alertEl.className = 'mb-4 p-3.5 rounded-xl text-xs font-medium border bg-rose-500/10 border-rose-500/30 text-rose-300 block';
        alertEl.textContent = `Sign in error: ${err.message}`;
      }
      if (loginBtn) loginBtn.disabled = false;
      if (loginText) loginText.textContent = 'Sign In to Admin Portal';
      if (loginSpinner) loginSpinner.classList.add('hidden');
    }
  });

  // Google Login
  document.getElementById('adminGoogleLoginBtn')?.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    const alertEl = document.getElementById('loginAlert');
    try {
      await auth.signInWithPopup(provider);
    } catch (err) {
      if (alertEl) {
        alertEl.className = 'mb-4 p-3.5 rounded-xl text-xs font-medium border bg-rose-500/10 border-rose-500/30 text-rose-300 block';
        alertEl.textContent = `Google Sign-In failed: ${err.message}`;
      }
    }
  });

  // Logout
  document.getElementById('adminLogoutBtn')?.addEventListener('click', async () => {
    await auth.signOut();
    showToast('Signed out of admin session', 'info');
  });
});
