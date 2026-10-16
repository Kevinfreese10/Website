import fs from 'fs';
import path from 'path';

const STATE_FILE = 'C:/Users/kev/.gemini/antigravity/scratch/master_inbox_state.json';
const ARTIFACT_DIR = 'C:/Users/kev/.gemini/antigravity/brain/86e7bb35-dfbd-41c9-9e96-86ced90512a2';
const PUBLIC_DIR = 'c:/myacc/public';

export function generateDashboardHtml(): string {
  let state: any = {
    accounts: ['info@myacc.co.za', 'kev@thinkestry.co.za'],
    lastChecked: new Date().toISOString(),
    pendingApprovals: []
  };

  if (fs.existsSync(STATE_FILE)) {
    try {
      state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch {}
  }

  const items = state.pendingApprovals || [];
  const activeItems = items.filter((p: any) => p.status === 'PENDING');
  const ordersCount = activeItems.filter((p: any) => p.category === 'ACTIVE_ORDER_UPDATE').length;
  const regulatorsCount = activeItems.filter((p: any) => p.category === 'REGULATOR_NOTICE').length;
  const retainersCount = activeItems.filter((p: any) => p.category === 'RETAINER_INQUIRY').length;
  const consultsCount = activeItems.filter((p: any) => p.category === 'GENERAL_CONSULTATION').length;

  const serializedItems = JSON.stringify(activeItems);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Accountant — Master Inbox Command Center</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
    code, .font-mono { font-family: 'JetBrains Mono', monospace; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.4); }
    .kpi-card {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 1.25rem 1.5rem;
      border-radius: 1rem;
      transition: all 0.2s ease;
    }
    .kpi-card:hover {
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateY(-1px);
    }
    .matter-card {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.07);
      padding: 1.25rem 1.5rem;
      border-radius: 1rem;
      transition: all 0.2s ease;
    }
    .matter-card:hover {
      border-color: rgba(99, 102, 241, 0.35);
      background: rgba(30, 41, 59, 0.6);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }
  </style>
</head>
<body class="bg-[#090d16] text-slate-100 min-h-screen antialiased selection:bg-indigo-500/30 selection:text-indigo-200">

  <!-- Ambient background glow -->
  <div class="fixed top-0 left-1/3 w-[500px] h-[300px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
  <div class="fixed top-1/4 right-1/4 w-[400px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

  <div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

    <!-- Top Navigation Header -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 shrink-0">
          MA
        </div>
        <div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold tracking-tight text-white">Master Inbox Command Center</h1>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live Agent Active
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
            <span>Autonomous Practice Triage</span>
            <span class="text-slate-600">•</span>
            <span>Monitoring <span class="text-slate-200 font-mono font-medium">info@myacc.co.za</span> & <span class="text-slate-200 font-mono font-medium">kev@thinkestry.co.za</span></span>
          </p>
        </div>
      </div>

      <!-- Header Controls -->
      <div class="flex items-center gap-3 shrink-0">
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs text-slate-300 font-mono">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Dual Mailbox Synced</span>
        </div>
        <button
          onclick="window.location.reload()"
          class="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition shadow-sm cursor-pointer active:scale-95"
          title="Refresh dashboard state"
        >
          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          <span>Refresh</span>
        </button>
      </div>
    </header>

    <!-- Top KPI Metric Cards (Clean, Generous Padding) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      
      <!-- Action Required -->
      <div class="kpi-card flex flex-col justify-between min-h-[115px] border-amber-500/20">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">Action Required</span>
          <span class="text-base">⏳</span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-amber-400">${activeItems.length}</span>
          <span class="text-xs text-slate-400 font-medium">items in queue</span>
        </div>
      </div>

      <!-- Orders to Audit -->
      <div class="kpi-card flex flex-col justify-between min-h-[115px] border-blue-500/20">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-blue-400 uppercase tracking-wider">Orders to Audit</span>
          <span class="text-base">📦</span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-blue-400">${ordersCount}</span>
          <span class="text-xs text-slate-400 font-medium">deliverables</span>
        </div>
      </div>

      <!-- Regulator Notices -->
      <div class="kpi-card flex flex-col justify-between min-h-[115px] border-rose-500/20">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-rose-400 uppercase tracking-wider">Regulator Notices</span>
          <span class="text-base">🏛️</span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-rose-400">${regulatorsCount}</span>
          <span class="text-xs text-slate-400 font-medium">NCR / CIPC</span>
        </div>
      </div>

      <!-- Retainer Leads -->
      <div class="kpi-card flex flex-col justify-between min-h-[115px] border-emerald-500/20">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">Retainer Leads</span>
          <span class="text-base">💎</span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-emerald-400">${retainersCount}</span>
          <span class="text-xs text-slate-400 font-medium">quotes to scope</span>
        </div>
      </div>

    </div>

    <!-- Filter Bar & Search Toolbar -->
    <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl shadow-sm">
      
      <!-- Category Tabs (Full Styled Buttons) -->
      <div class="flex flex-wrap items-center gap-2">
        <button onclick="setFilter('ALL')" id="tab-ALL" class="tab-btn px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition cursor-pointer">
          All Matters (${activeItems.length})
        </button>
        <button onclick="setFilter('ACTIVE_ORDER_UPDATE')" id="tab-ACTIVE_ORDER_UPDATE" class="tab-btn px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer">
          Orders (${ordersCount})
        </button>
        <button onclick="setFilter('REGULATOR_NOTICE')" id="tab-REGULATOR_NOTICE" class="tab-btn px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer">
          Regulators (${regulatorsCount})
        </button>
        <button onclick="setFilter('RETAINER_INQUIRY')" id="tab-RETAINER_INQUIRY" class="tab-btn px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer">
          Retainers (${retainersCount})
        </button>
        <button onclick="setFilter('GENERAL_CONSULTATION')" id="tab-GENERAL_CONSULTATION" class="tab-btn px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer">
          Queries (${consultsCount})
        </button>
      </div>

      <!-- Search Input -->
      <div class="relative min-w-[280px]">
        <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        <input
          type="text"
          id="searchInput"
          oninput="handleSearch(this.value)"
          placeholder="Search by client, order #, subject..."
          class="w-full bg-slate-950 border border-slate-700/70 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner"
        />
      </div>
    </div>

    <!-- Active Matters List -->
    <div id="itemsContainer" class="space-y-3">
      <!-- Injected via JavaScript -->
    </div>

  </div>

  <!-- Toast Notification Feedback -->
  <div id="toast" class="fixed bottom-6 right-6 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-medium transform translate-y-24 opacity-0 transition-all duration-300 pointer-events-none flex items-center gap-3 z-50">
    <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">✓</span>
    <div>
      <div class="font-bold text-white" id="toastTitle">Command Copied</div>
      <div class="text-[11px] text-slate-400 font-mono truncate max-w-xs" id="toastMessage"></div>
    </div>
  </div>

  <script>
    const items = ${serializedItems};
    let currentFilter = 'ALL';
    let searchQuery = '';

    function showToast(title, msg) {
      const toast = document.getElementById('toast');
      document.getElementById('toastTitle').innerText = title;
      document.getElementById('toastMessage').innerText = msg;
      toast.classList.remove('translate-y-24', 'opacity-0');
      setTimeout(() => {
        toast.classList.add('translate-y-24', 'opacity-0');
      }, 2800);
    }

    function copyText(cmd) {
      navigator.clipboard.writeText(cmd);
      showToast('Copied to Clipboard', cmd);
    }

    function setFilter(filter) {
      currentFilter = filter;
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-md', 'shadow-indigo-600/30');
        btn.classList.add('text-slate-300', 'hover:text-white', 'bg-slate-800/70', 'hover:bg-slate-800', 'border', 'border-slate-700/60');
      });
      const activeBtn = document.getElementById('tab-' + filter);
      if (activeBtn) {
        activeBtn.classList.remove('text-slate-300', 'hover:text-white', 'bg-slate-800/70', 'hover:bg-slate-800', 'border', 'border-slate-700/60');
        activeBtn.classList.add('bg-indigo-600', 'text-white', 'shadow-md', 'shadow-indigo-600/30');
      }
      render();
    }

    function handleSearch(query) {
      searchQuery = (query || '').toLowerCase();
      render();
    }

    function getInitials(name) {
      const parts = (name || 'Client').replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return (parts[0] || 'C').slice(0, 2).toUpperCase();
    }

    function getCategoryConfig(category) {
      switch(category) {
        case 'ACTIVE_ORDER_UPDATE':
          return {
            badge: '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Active Order</span>',
            actionText: '⚡ Audit & Compile Pack',
            actionClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20',
            avatarBg: 'bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/30'
          };
        case 'REGULATOR_NOTICE':
          return {
            badge: '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Statutory Notice</span>',
            actionText: '🏛️ Inspect Filing',
            actionClass: 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-500/20',
            avatarBg: 'bg-rose-600/20 text-rose-300 ring-1 ring-rose-500/30'
          };
        case 'RETAINER_INQUIRY':
          return {
            badge: '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Retainer Lead</span>',
            actionText: '💎 Scope Retainer',
            actionClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20',
            avatarBg: 'bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-500/30'
          };
        default:
          return {
            badge: '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-700/40 text-slate-300 border border-slate-600/40 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Advisory Query</span>',
            actionText: '💬 Review Scope',
            actionClass: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
            avatarBg: 'bg-slate-800 text-slate-300 ring-1 ring-slate-700'
          };
      }
    }

    function render() {
      const container = document.getElementById('itemsContainer');
      const filtered = items.filter(item => {
        const matchesFilter = currentFilter === 'ALL' || item.category === currentFilter;
        const matchesSearch = !searchQuery ||
          item.subject.toLowerCase().includes(searchQuery) ||
          item.sender.toLowerCase().includes(searchQuery) ||
          (item.orderId && item.orderId.includes(searchQuery)) ||
          item.proposedAction.toLowerCase().includes(searchQuery);
        return matchesFilter && matchesSearch;
      });

      if (filtered.length === 0) {
        container.innerHTML = \`
          <div class="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <div class="w-12 h-12 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-xl">🎉</div>
            <div class="text-base font-semibold text-white">All Caught Up in this Category</div>
            <p class="text-xs text-slate-400 max-w-sm mx-auto">No pending items requiring review or approval under the selected filter.</p>
          </div>
        \`;
        return;
      }

      container.innerHTML = filtered.map((item, idx) => {
        const cfg = getCategoryConfig(item.category);
        const cmd = 'npx tsx .agents/skills/master-inbox-agent/scripts/master_orchestrator.ts --' + item.approvalCommand;
        const initials = getInitials(item.sender.split('@')[0]);

        return \`
          <div class="matter-card flex flex-col md:flex-row md:items-center justify-between gap-4 group">
            
            <!-- Left Info Block -->
            <div class="flex items-start gap-4 flex-1 min-w-0">
              <!-- Avatar -->
              <div class="w-10 h-10 rounded-xl \${cfg.avatarBg} shrink-0 flex items-center justify-center font-bold text-xs mt-0.5">
                \${initials}
              </div>

              <!-- Content Body -->
              <div class="space-y-1.5 flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  \${cfg.badge}
                  \${item.orderId ? '<span class="px-2 py-0.5 rounded-md text-[11px] font-bold text-blue-300 bg-blue-950/70 border border-blue-800/60 font-mono">#' + item.orderId + '</span>' : ''}
                  <span class="text-xs text-slate-400 font-mono truncate max-w-[220px]" title="\${item.sender}">
                    \${item.sender}
                  </span>
                  <span class="text-xs text-slate-600">•</span>
                  <span class="text-[11px] text-slate-500 font-mono">
                    via \${item.mailbox}
                  </span>
                </div>

                <h3 class="text-sm font-bold text-white tracking-tight leading-snug group-hover:text-indigo-200 transition-colors" title="\${item.subject}">
                  \${item.subject}
                </h3>

                <p class="text-xs text-slate-400 line-clamp-1">
                  \${item.proposedAction}
                </p>
              </div>
            </div>

            <!-- Right Action Controls -->
            <div class="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
              <button
                onclick="copyText('\${cmd}')"
                class="px-4 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition active:scale-95 cursor-pointer \${cfg.actionClass}"
                title="Copy execution command for Antigravity"
              >
                <span>\${cfg.actionText}</span>
              </button>
            </div>

          </div>
        \`;
      }).join('');
    }

    render();

    // Auto-refresh every 60 seconds
    setTimeout(() => {
      window.location.reload();
    }, 60000);
  </script>
</body>
</html>`;
}

export function writeDashboardFiles(): void {
  const html = generateDashboardHtml();

  // 1. Write to Antigravity brain artifact directory
  if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const artifactPath = path.join(ARTIFACT_DIR, 'master_inbox_dashboard.html');
  fs.writeFileSync(artifactPath, html, 'utf8');

  // 2. Write to public web directory
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const publicPath = path.join(PUBLIC_DIR, 'master_inbox_dashboard.html');
  fs.writeFileSync(publicPath, html, 'utf8');

  console.log(`[dashboard] Visual Dashboard generated successfully:`);
  console.log(`   Artifact: ${artifactPath}`);
  console.log(`   Public Web: ${publicPath}`);
}

if (require.main === module) {
  writeDashboardFiles();
}
