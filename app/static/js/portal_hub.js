// ApexScout NCAA Transfer Portal & 18-Scholarship Cap Optimizer
class PortalHubManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.players = [];
        this.budget = null;
    }

    async init() {
        if (!this.container) return;
        try {
            const [players, budget] = await Promise.all([
                API.getPortalPlayers(),
                API.getScholarships()
            ]);
            this.players = players;
            this.budget = budget;
            this.render();
        } catch (err) {
            console.error('Failed to load portal hub:', err);
        }
    }

    render() {
        if (!this.container) return;

        let playerRows = '';
        this.players.forEach(p => {
            playerRows += `
                <div class="glass-card rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 hover:border-sky-500/30 transition-all">
                    <div class="flex items-start gap-3.5">
                        <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sky-400 text-sm">
                            ${p.position}
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h4 class="font-bold text-white text-base">${p.first_name} ${p.last_name}</h4>
                                <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                    p.status === 'Open - High Priority' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                    p.status === 'In Discussions' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                    p.status === 'Committed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                    'bg-slate-700 text-slate-300'
                                }">${p.status}</span>
                            </div>
                            <div class="text-xs text-slate-400 mt-0.5">
                                Prev: <strong class="text-slate-200">${p.previous_team}</strong> (${p.previous_conference}) ? 
                                <span class="text-sky-300 font-semibold">${p.eligibility_remaining_years} Yrs Remaining</span> ? 
                                Entered: ${p.portal_entry_date}
                            </div>
                            <div class="text-xs text-slate-300 mt-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                                <strong>Scout Eval (${p.scout_eval_grade}/80):</strong> ${p.scouting_notes}
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-wrap md:flex-col items-end gap-2.5 min-w-[200px] border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
                        <div class="text-right w-full">
                            <div class="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Scholarship Equiv</div>
                            <div class="flex items-center justify-end gap-2 mt-1">
                                <select onchange="window.PortalHub.updateScholarship('${p.id}', this.value)" class="bg-slate-900 border border-slate-700 text-white text-xs rounded px-2.5 py-1 font-mono font-bold">
                                    <option value="1.0" ${p.scholarship_target === 1.0 ? 'selected' : ''}>1.00 (Full Ride)</option>
                                    <option value="0.85" ${p.scholarship_target === 0.85 ? 'selected' : ''}>0.85 Equiv</option>
                                    <option value="0.75" ${p.scholarship_target === 0.75 ? 'selected' : ''}>0.75 Equiv</option>
                                    <option value="0.50" ${p.scholarship_target === 0.50 ? 'selected' : ''}>0.50 Half-Equiv</option>
                                    <option value="0.0" ${p.scholarship_target === 0.0 ? 'selected' : ''}>0.00 (Walk-On/NIL)</option>
                                </select>
                            </div>
                        </div>

                        <div class="text-right w-full">
                            <div class="text-[11px] text-slate-400">NIL Range: <strong class="text-emerald-400 font-mono">${p.nil_bracket_estimate}</strong></div>
                            <div class="text-[11px] text-slate-400">Visit: <strong class="text-sky-300">${p.visit_date || 'No Visit Scheduled'}</strong></div>
                        </div>

                        <div class="flex items-center gap-1.5 mt-1 w-full justify-end">
                            <select onchange="window.PortalHub.updateStatus('${p.id}', this.value)" class="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded px-2 py-1">
                                <option value="Open - High Priority" ${p.status === 'Open - High Priority' ? 'selected' : ''}>High Priority</option>
                                <option value="In Discussions" ${p.status === 'In Discussions' ? 'selected' : ''}>In Discussions</option>
                                <option value="Committed" ${p.status === 'Committed' ? 'selected' : ''}>Committed</option>
                                <option value="Evaluating" ${p.status === 'Evaluating' ? 'selected' : ''}>Evaluating</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
        });

        this.container.innerHTML = `
            <!-- Top Metric Banner -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="glass-panel rounded-xl p-4 border-l-4 border-sky-400">
                    <div class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Scholarships Cap</div>
                    <div class="text-2xl font-bold font-mono text-white mt-1">
                        ${this.budget.allocated} <span class="text-sm font-normal text-slate-400">/ ${this.budget.total_allowed}</span>
                    </div>
                    <div class="text-xs text-emerald-400 font-semibold mt-1">
                        ${this.budget.remaining} Equivs Available
                    </div>
                </div>

                <div class="glass-panel rounded-xl p-4 border-l-4 border-emerald-400">
                    <div class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Roster Projection</div>
                    <div class="text-2xl font-bold font-mono text-white mt-1">
                        ${this.budget.projected_roster_count} <span class="text-sm font-normal text-slate-400">Athletes</span>
                    </div>
                    <div class="text-xs text-slate-400 mt-1">
                        ${this.budget.total_committed_athletes} Scholarship + ${this.budget.walk_ons} Walk-ons
                    </div>
                </div>

                <div class="glass-panel rounded-xl p-4 border-l-4 border-amber-400">
                    <div class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Portal Targets</div>
                    <div class="text-2xl font-bold font-mono text-white mt-1">${this.players.length}</div>
                    <div class="text-xs text-amber-400 font-semibold mt-1">3 High Priority In Flight</div>
                </div>

                <div class="glass-panel rounded-xl p-4 border-l-4 border-purple-400">
                    <div class="text-xs text-slate-400 uppercase tracking-wider font-semibold">NIL Collective Pool</div>
                    <div class="text-2xl font-bold font-mono text-white mt-1">$420,000</div>
                    <div class="text-xs text-purple-300 font-semibold mt-1">68% Allocated to Top 6</div>
                </div>
            </div>

            <!-- Portal List Header -->
            <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                    <i data-lucide="arrow-right-left" class="w-4 h-4 text-sky-400"></i>
                    Live NCAA Division I Transfer Portal Pipeline
                </h3>
                <span class="text-xs text-slate-400">Updates live with NCAA Compliance Registry</span>
            </div>

            <!-- List -->
            <div class="space-y-3">
                ${playerRows}
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
    }

    async updateScholarship(id, value) {
        try {
            await API.updatePortalPlayer(id, { scholarship_target: parseFloat(value) });
            await this.init();
        } catch (err) {
            console.error('Failed to update scholarship:', err);
        }
    }

    async updateStatus(id, status) {
        try {
            await API.updatePortalPlayer(id, { status: status });
            await this.init();
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    }
}

window.PortalHubManager = PortalHubManager;
