// ApexScout NCAA 2026/2027 Revenue-Share & NIL ROI Optimizer Hub
class NILHubManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.budget = null;
        this.roster = [];
        this.portalTargets = [];
        this.selectedTargetId = 'port-roi-01';
        this.offeredComp = 210000;
        this.simulatedCandidate = null;
    }

    async init() {
        if (!this.container) return;
        try {
            await this.refreshData();
            await this.runSimulateOffer();
            this.render();
        } catch (err) {
            console.error('Failed to init NIL Hub:', err);
        }
    }

    async refreshData() {
        const [budget, roster, targets] = await Promise.all([
            fetch('/api/nil/budget').then(r => r.json()),
            fetch('/api/nil/roster').then(r => r.json()),
            fetch('/api/nil/portal-targets').then(r => r.json())
        ]);
        this.budget = budget;
        this.roster = roster;
        this.portalTargets = targets;
    }

    async runSimulateOffer() {
        try {
            const res = await fetch('/api/nil/simulate-offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidate_id: this.selectedTargetId,
                    offered_comp: parseInt(this.offeredComp)
                })
            });
            if (res.ok) {
                this.simulatedCandidate = await res.json();
            }
        } catch (err) {
            console.error('Simulate offer error:', err);
        }
    }

    render() {
        if (!this.container || !this.budget) return;

        const b = this.budget;
        const cand = this.simulatedCandidate;

        const revSharePct = Math.min(100, Math.round((b.allocated_rev_share / b.department_revenue_share_pool) * 100));
        const nilPct = Math.min(100, Math.round((b.allocated_nil / b.nil_collective_pool) * 100));

        // Group roster by line slots
        const f1 = this.roster.filter(r => r.line_slot.includes('1st Line'));
        const f2 = this.roster.filter(r => r.line_slot.includes('2nd Line'));
        const f3 = this.roster.filter(r => r.line_slot.includes('3rd Line'));
        const f4 = this.roster.filter(r => r.line_slot.includes('4th Line'));
        const d1 = this.roster.filter(r => r.line_slot.includes('1st Pair'));
        const d2 = this.roster.filter(r => r.line_slot.includes('2nd Pair'));
        const d3 = this.roster.filter(r => r.line_slot.includes('3rd Pair'));
        const goalies = this.roster.filter(r => r.position === 'G');
        const reserves = this.roster.filter(r => r.line_slot.includes('Reserve'));

        const renderRosterCard = (r) => `
            <div class="glass-card p-2.5 rounded-xl border border-slate-800 hover:border-sky-500/30 flex items-center justify-between">
                <div>
                    <div class="flex items-center gap-1.5">
                        <span class="text-xs font-bold text-white">${r.name}</span>
                        <span class="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">${r.position}</span>
                    </div>
                    <div class="text-[10px] text-slate-400 font-mono mt-0.5">
                        Rev: <strong class="text-sky-300">$${(r.base_rev_share / 1000).toFixed(0)}k</strong> ? NIL: <strong class="text-amber-300">$${(r.nil_collective / 1000).toFixed(0)}k</strong>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-xs font-mono font-bold text-emerald-400">$${(r.total_comp / 1000).toFixed(0)}k</div>
                    <span class="text-[9px] font-mono px-1.5 py-0.2 rounded ${
                        r.roi_grade.includes('A+') ? 'bg-emerald-500/20 text-emerald-300' :
                        r.roi_grade.includes('A') ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-400'
                    }">${r.roi_grade.split(' ')[0]} ROI</span>
                </div>
            </div>
        `;

        this.container.innerHTML = `
            <!-- Top Revenue Share & 26-Man Cap Banner -->
            <div class="glass-panel rounded-2xl p-6 mb-6 border border-emerald-500/40 bg-gradient-to-r from-[#0a1815] via-[#0d211d] to-[#0a1815] shadow-2xl">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                            <span class="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">HOUSE V. NCAA SETTLEMENT HUB (2026-2027)</span>
                        </div>
                        <h2 class="text-2xl font-extrabold text-white mt-1 flex items-center gap-2">
                            NCAA Revenue-Sharing & NIL Roster Optimizer
                        </h2>
                        <p class="text-xs text-slate-400 mt-0.5">
                            Direct Department Revenue Share ($3.2M Pool) + Third-Party NIL Collective ($1.2M Pool) under the 26-Man Hard Roster Cap.
                        </p>
                    </div>

                    <!-- 26-Man Roster Cap Pill & AI Optimize Button -->
                    <div class="flex flex-wrap items-center gap-3">
                        <div class="bg-slate-950/80 border border-slate-700/80 rounded-2xl px-5 py-2.5 text-center shadow-inner">
                            <div class="text-[10px] text-slate-400 font-mono uppercase">26-Man Roster Cap</div>
                            <div class="text-xl font-mono font-extrabold ${b.is_compliant ? 'text-emerald-400' : 'text-rose-400'}">
                                ${b.total_roster_count} / ${b.max_roster_cap} Active
                            </div>
                        </div>

                        <button onclick="window.NILHub.optimizeRoster()" class="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                            <i data-lucide="sparkles" class="w-4 h-4 text-slate-950"></i>
                            AI Roster Optimization
                        </button>
                    </div>
                </div>

                <!-- Budget Meters Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-emerald-950/80">
                    <!-- 1. Department Revenue Share -->
                    <div class="glass-card p-4 rounded-xl border border-sky-500/30 bg-sky-950/20">
                        <div class="flex items-center justify-between text-xs font-bold text-sky-300 mb-1">
                            <span>Dept. Revenue-Sharing Pool</span>
                            <span class="font-mono">$${(b.allocated_rev_share / 1000000).toFixed(2)}M / $${(b.department_revenue_share_pool / 1000000).toFixed(2)}M</span>
                        </div>
                        <div class="w-full h-2 rounded-full bg-slate-900 overflow-hidden mt-2">
                            <div class="h-full bg-sky-400 rounded-full" style="width: ${revSharePct}%"></div>
                        </div>
                        <div class="text-[10px] text-slate-400 font-mono mt-2">
                            Remaining: <strong class="text-sky-300">$${( (b.department_revenue_share_pool - b.allocated_rev_share) / 1000 ).toFixed(0)}k</strong> (${100 - revSharePct}% available)
                        </div>
                    </div>

                    <!-- 2. NIL Collective Fund -->
                    <div class="glass-card p-4 rounded-xl border border-amber-500/30 bg-amber-950/20">
                        <div class="flex items-center justify-between text-xs font-bold text-amber-300 mb-1">
                            <span>Third-Party NIL Collective</span>
                            <span class="font-mono">$${(b.allocated_nil / 1000000).toFixed(2)}M / $${(b.nil_collective_pool / 1000000).toFixed(2)}M</span>
                        </div>
                        <div class="w-full h-2 rounded-full bg-slate-900 overflow-hidden mt-2">
                            <div class="h-full bg-amber-400 rounded-full" style="width: ${nilPct}%"></div>
                        </div>
                        <div class="text-[10px] text-slate-400 font-mono mt-2">
                            Remaining: <strong class="text-amber-300">$${( (b.nil_collective_pool - b.allocated_nil) / 1000 ).toFixed(0)}k</strong> (${100 - nilPct}% available)
                        </div>
                    </div>

                    <!-- 3. Total Team Projected Win Efficiency -->
                    <div class="glass-card p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
                        <div class="flex items-center justify-between text-xs font-bold text-emerald-300 mb-1">
                            <span>Projected Scoring & Wins</span>
                            <span class="font-mono">${b.projected_team_wins} Wins (${b.projected_team_points} Pts)</span>
                        </div>
                        <div class="text-xs text-slate-300 mt-2">
                            Total Remaining Reserve: <strong class="text-emerald-400 font-mono">$${(b.remaining_total / 1000).toFixed(0)}k</strong>
                        </div>
                        <div class="text-[10px] text-slate-400 font-mono mt-1">
                            Cap Compliance: <span class="text-emerald-400 font-bold">100% NCAA COMPLIANT</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2-Col Layout: Transfer Portal ROI Simulator (Left) + Line-by-Line Salary Grid (Right) -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <!-- Left: Transfer Portal Target ROI Simulator (5 cols) -->
                <div class="lg:col-span-5 space-y-6">
                    <div class="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
                        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div>
                                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                                    <i data-lucide="calculator" class="w-4 h-4 text-emerald-400"></i>
                                    Transfer Portal ROI & Offer Simulator
                                </h3>
                                <p class="text-[11px] text-slate-400">Points-Per-Dollar Value Index Calculator</p>
                            </div>
                        </div>

                        <!-- Target Candidate Selector -->
                        <div>
                            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Select Portal Target</label>
                            <select onchange="window.NILHub.setTargetCandidate(this.value)" class="w-full bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-400">
                                ${this.portalTargets.map(t => `
                                    <option value="${t.id}" ${t.id === this.selectedTargetId ? 'selected' : ''}>
                                        ${t.name} (${t.position}, ex-${t.previous_school}) ? Asking: $${(t.requested_comp / 1000).toFixed(0)}k
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- Compensation Offer Slider -->
                        <div class="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                            <div class="flex items-center justify-between text-xs font-bold">
                                <span class="text-slate-300">Simulated Offer Package:</span>
                                <span class="text-base font-mono text-emerald-400 font-extrabold" id="offer-display-val">$${(this.offeredComp / 1000).toFixed(0)},000</span>
                            </div>
                            <input type="range" min="50000" max="350000" step="5000" value="${this.offeredComp}"
                                   oninput="window.NILHub.updateOfferSlider(this.value)"
                                   class="w-full accent-emerald-500 cursor-pointer">
                            <div class="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                <span>$50k (Depth)</span>
                                <span>$200k (Core)</span>
                                <span>$350k (Max Franchise)</span>
                            </div>
                        </div>

                        <!-- Simulated ROI Card -->
                        ${cand ? `
                        <div class="glass-card p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold text-white">${cand.name} (${cand.position})</span>
                                <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                                    cand.roi_grade.includes('A+') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                    cand.roi_grade.includes('A') ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }">${cand.roi_grade}</span>
                            </div>
                            <div class="grid grid-cols-2 gap-2 text-xs font-mono">
                                <div class="bg-slate-900/80 p-2 rounded-lg">Cost/Pt: <strong class="text-sky-300">$${cand.cost_per_point.toLocaleString()}</strong></div>
                                <div class="bg-slate-900/80 p-2 rounded-lg">Proj. Pts: <strong class="text-emerald-300">${cand.projected_points} PTS</strong></div>
                            </div>
                            <p class="text-xs text-slate-300 leading-relaxed">${cand.verdict}</p>
                            <div class="text-xs pt-2 border-t border-slate-800 text-purple-300 font-semibold flex items-center gap-1.5">
                                <i data-lucide="bot" class="w-4 h-4"></i>
                                <span>${cand.ai_recommendation}</span>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Right: Line-by-Line 26-Man Salary Grid (7 cols) -->
                <div class="lg:col-span-7 glass-panel rounded-xl p-5 space-y-4">
                    <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                        <h3 class="text-sm font-bold text-white flex items-center gap-2">
                            <i data-lucide="layers" class="w-4 h-4 text-sky-400"></i>
                            2026-27 Line-by-Line Roster Compensation Matrix
                        </h3>
                        <span class="text-xs font-mono text-slate-400">${this.roster.length} Players Active</span>
                    </div>

                    <div class="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                        <!-- Forward Line 1 -->
                        <div>
                            <span class="text-[11px] font-bold text-sky-400 uppercase tracking-wider block mb-1.5">Forward Line 1 (Tier 1 Franchise)</span>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                                ${f1.map(renderRosterCard).join('')}
                            </div>
                        </div>

                        <!-- Forward Line 2 -->
                        <div>
                            <span class="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">Forward Line 2 (Tier 2 Core)</span>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                                ${f2.map(renderRosterCard).join('')}
                            </div>
                        </div>

                        <!-- Forward Lines 3 & 4 -->
                        <div>
                            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Bottom-6 Forwards (Lines 3 & 4)</span>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                                ${[...f3, ...f4].map(renderRosterCard).join('')}
                            </div>
                        </div>

                        <!-- Defense Pairs -->
                        <div>
                            <span class="text-[11px] font-bold text-sky-400 uppercase tracking-wider block mb-1.5">Defense Core (Pairs 1, 2, 3)</span>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                                ${[...d1, ...d2, ...d3].map(renderRosterCard).join('')}
                            </div>
                        </div>

                        <!-- Goalies & Reserves -->
                        <div>
                            <span class="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1.5">Goaltending & Active Reserves (26-Man Cap)</span>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                                ${[...goalies, ...reserves].map(renderRosterCard).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
    }

    setTargetCandidate(id) {
        this.selectedTargetId = id;
        const cand = this.portalTargets.find(t => t.id === id);
        if (cand) this.offeredComp = cand.requested_comp;
        this.runSimulateOffer().then(() => this.render());
    }

    updateOfferSlider(val) {
        this.offeredComp = parseInt(val);
        const displayEl = document.getElementById('offer-display-val');
        if (displayEl) displayEl.innerText = `$${(this.offeredComp / 1000).toFixed(0)},000`;
        this.runSimulateOffer().then(() => this.render());
    }

    async optimizeRoster() {
        try {
            const res = await fetch('/api/nil/optimize', { method: 'POST' });
            if (!res.ok) throw new Error('Optimize failed');
            const data = await res.json();
            alert(data.executive_recommendation);
            await this.refreshData();
            this.render();
        } catch (err) {
            console.error('Optimize error:', err);
        }
    }
}

window.NILHub = new NILHubManager('nilhub-container');
