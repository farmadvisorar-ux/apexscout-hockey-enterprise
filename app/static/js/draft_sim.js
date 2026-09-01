// ApexScout Draft Day Floor Simulator & Pick Trade Machine
class DraftFloorSimulator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.state = null;
        this.availableProspects = [];
        this.timerInterval = null;
        this.tradeTeamAPicks = [14, 46];
        this.tradeTeamBPicks = [8];
        this.tradeEvaluation = null;
    }

    async init() {
        if (!this.container) return;
        try {
            await this.refreshState();
            await this.evaluateCurrentTrade();
            this.render();
            this.startTimer();
        } catch (err) {
            console.error('Failed to init draft simulation:', err);
        }
    }

    async refreshState() {
        const [state, available] = await Promise.all([
            fetch('/api/draft-sim/state').then(r => r.json()),
            fetch('/api/draft-sim/available').then(r => r.json())
        ]);
        this.state = state;
        this.availableProspects = available;
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.state && !this.state.is_paused && this.state.time_remaining_seconds > 0) {
                this.state.time_remaining_seconds -= 1;
                const clockEl = document.getElementById('draft-floor-clock');
                if (clockEl) {
                    const mins = Math.floor(this.state.time_remaining_seconds / 60);
                    const secs = this.state.time_remaining_seconds % 60;
                    clockEl.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                }
            }
        }, 1000);
    }

    render() {
        if (!this.container || !this.state) return;

        const currentPick = this.state.draft_order[this.state.current_pick_index] || this.state.draft_order[this.state.draft_order.length - 1];
        const isDraftFinished = this.state.current_pick_index >= this.state.total_picks;
        const bpa = this.availableProspects[0];
        const bestD = this.availableProspects.find(p => p.position.includes('D')) || this.availableProspects[1];

        const mins = Math.floor(this.state.time_remaining_seconds / 60);
        const secs = this.state.time_remaining_seconds % 60;

        // Draft order rows
        let draftOrderHtml = this.state.draft_order.map((p, idx) => {
            const isCurrent = idx === this.state.current_pick_index;
            const isCompleted = !!p.selected_prospect_id;

            return `
                <div class="p-3 rounded-xl flex items-center justify-between border transition-all ${
                    isCurrent ? 'bg-sky-500/20 border-sky-500 shadow-lg shadow-sky-500/20 animate-pulse' :
                    isCompleted ? 'bg-slate-900/90 border-slate-800 opacity-90' : 'bg-slate-900/40 border-slate-800/60'
                }">
                    <div class="flex items-center gap-3">
                        <span class="w-8 h-8 rounded-lg bg-slate-800 font-mono font-bold text-xs flex items-center justify-center ${isCurrent ? 'text-sky-400 font-extrabold text-sm' : 'text-slate-400'}">
                            #${p.overall_pick}
                        </span>
                        <div>
                            <div class="text-xs font-bold text-white flex items-center gap-1.5">
                                <span class="w-2 h-2 rounded-full" style="background-color: ${p.team_color}"></span>
                                ${p.team_name}
                                ${p.is_user_team ? '<span class="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/30 text-sky-300 font-mono font-bold">YOUR PICK</span>' : ''}
                            </div>
                            <div class="text-[10px] text-slate-400 font-mono">
                                Pick Value: <strong class="text-sky-300">${p.point_value} pts</strong>
                            </div>
                        </div>
                    </div>

                    <div class="text-right">
                        ${p.selected_prospect_id ? `
                            <span class="text-xs font-bold text-emerald-400">${p.selected_prospect_name}</span>
                            <div class="text-[10px] text-slate-400 font-mono">${p.selected_prospect_pos}</div>
                        ` : isCurrent ? `
                            <span class="text-xs font-bold text-sky-400 font-mono">ON THE CLOCK</span>
                        ` : `
                            <span class="text-[10px] text-slate-600 font-mono">UPCOMING</span>
                        `}
                    </div>
                </div>
            `;
        }).join('');

        // Available prospects for User Selection
        let availableHtml = this.availableProspects.slice(0, 8).map(p => `
            <div class="glass-card p-3 rounded-xl border border-slate-800 hover:border-sky-500/40 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-lg bg-slate-800 font-mono font-bold text-xs text-sky-400 flex items-center justify-center">
                        #${p.consensus_rank}
                    </span>
                    <div>
                        <div class="text-xs font-bold text-white">${p.first_name} ${p.last_name}</div>
                        <div class="text-[10px] text-slate-400">${p.position} ? ${p.current_team} (${p.league}) ? OVR: <strong class="text-sky-300">${p.grades.overall_grade}</strong></div>
                    </div>
                </div>
                <button onclick="window.DraftSim.makePick('${p.id}')" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95">
                    Draft Player
                </button>
            </div>
        `).join('');

        // Trade Machine Evaluation Summary
        const t = this.tradeEvaluation;

        this.container.innerHTML = `
            <!-- Top On-The-Clock Floor Banner -->
            <div class="glass-panel rounded-2xl p-6 mb-6 border border-sky-500/40 bg-gradient-to-r from-[#0d1424] via-[#0f1d36] to-[#0d1424] shadow-2xl">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div class="flex items-center gap-5">
                        <div class="w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex flex-col items-center justify-center shadow-lg">
                            <span class="text-[10px] font-mono text-sky-300 uppercase tracking-wider">PICK</span>
                            <span class="text-2xl font-extrabold text-white font-mono">#${currentPick ? currentPick.overall_pick : '--'}</span>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                                <span class="text-xs font-mono font-bold text-slate-300">ROUND 1 ? ON THE CLOCK</span>
                            </div>
                            <h2 class="text-2xl font-extrabold text-white mt-0.5 flex items-center gap-2">
                                ${currentPick ? currentPick.team_name : 'Draft Completed'}
                                ${currentPick && currentPick.is_user_team ? '<span class="text-xs px-2.5 py-0.5 rounded-full bg-sky-500 text-slate-950 font-bold uppercase tracking-wider">YOUR TURN</span>' : ''}
                            </h2>
                            <div class="text-xs text-slate-400 mt-1">
                                Slot Value: <strong class="text-sky-300 font-mono">${currentPick ? currentPick.point_value : 0} Surplus Points</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Countdown Timer & Actions -->
                    <div class="flex items-center gap-4">
                        <div class="bg-slate-950/80 border border-slate-700/80 rounded-2xl px-5 py-2.5 text-center shadow-inner">
                            <div class="text-[10px] text-slate-400 font-mono uppercase">Floor Clock</div>
                            <div id="draft-floor-clock" class="text-2xl font-mono font-extrabold text-sky-400 tracking-wider">
                                ${mins}:${secs < 10 ? '0' : ''}${secs}
                            </div>
                        </div>

                        <div class="flex flex-col gap-2">
                            <button onclick="window.DraftSim.autoPickNext()" class="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all active:scale-95">
                                <i data-lucide="fast-forward" class="w-4 h-4"></i>
                                Simulate Next Pick
                            </button>
                            <button onclick="window.DraftSim.resetDraft()" class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all">
                                Reset Draft Floor
                            </button>
                        </div>
                    </div>
                </div>

                <!-- AI Draft Advisor Recommendations -->
                ${bpa ? `
                <div class="mt-6 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="glass-card p-3 rounded-xl border border-sky-500/30 bg-sky-950/10">
                        <div class="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Best Player Available (BPA)
                        </div>
                        <div class="text-xs font-bold text-white">${bpa.first_name} ${bpa.last_name} (${bpa.position})</div>
                        <div class="text-[11px] text-slate-400">Consensus Grade: ${bpa.grades.overall_grade}/80 ? ${bpa.current_team}</div>
                    </div>
                    <div class="glass-card p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/10">
                        <div class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <i data-lucide="shield" class="w-3.5 h-3.5"></i> Positional Fit (D-Core Need)
                        </div>
                        <div class="text-xs font-bold text-white">${bestD.first_name} ${bestD.last_name} (${bestD.position})</div>
                        <div class="text-[11px] text-slate-400">Solves 3-Year Right Defense Pipeline Deficit</div>
                    </div>
                    <div class="glass-card p-3 rounded-xl border border-amber-500/30 bg-amber-950/10">
                        <div class="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <i data-lucide="arrow-left-right" class="w-3.5 h-3.5"></i> Trade-Down Signal
                        </div>
                        <div class="text-xs font-bold text-white">High Tier Density (4 Tier 1s Left)</div>
                        <div class="text-[11px] text-slate-400">Trade down 4?6 slots to capture +110 surplus pts.</div>
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- 2-Col Main Grid: Trade Machine (Left) + Draft Order / Board (Right) -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <!-- Left: PuckMatrix Trade Machine (5 cols) -->
                <div class="lg:col-span-5 space-y-6">
                    <div class="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
                        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div>
                                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                                    <i data-lucide="scale" class="w-4 h-4 text-sky-400"></i>
                                    PuckMatrix? Pick Value Trade Machine
                                </h3>
                                <p class="text-[11px] text-slate-400">Empirical NHL Draft Pick Value Curve Simulator</p>
                            </div>
                        </div>

                        <!-- Trade Inputs -->
                        <div class="grid grid-cols-2 gap-4">
                            <!-- Team A (Outgoing) -->
                            <div class="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                                <span class="text-xs font-bold text-slate-300 block mb-1">Your Outgoing Picks</span>
                                <div class="text-[10px] text-slate-400 mb-2">Comma separated overall picks (e.g. 14, 46):</div>
                                <input type="text" id="trade-input-a" value="${this.tradeTeamAPicks.join(', ')}" 
                                       onchange="window.DraftSim.updateTradePicks()"
                                       class="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-lg p-2 focus:outline-none focus:border-sky-400">
                                <div class="mt-2 text-xs text-sky-300 font-mono font-bold">
                                    Value: ${t ? t.team_a_total_value : 0} pts
                                </div>
                            </div>

                            <!-- Team B (Target) -->
                            <div class="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                                <span class="text-xs font-bold text-slate-300 block mb-1">Target Incoming Pick</span>
                                <div class="text-[10px] text-slate-400 mb-2">Target overall pick (e.g. 8):</div>
                                <input type="text" id="trade-input-b" value="${this.tradeTeamBPicks.join(', ')}" 
                                       onchange="window.DraftSim.updateTradePicks()"
                                       class="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-lg p-2 focus:outline-none focus:border-sky-400">
                                <div class="mt-2 text-xs text-emerald-300 font-mono font-bold">
                                    Value: ${t ? t.team_b_total_value : 0} pts
                                </div>
                            </div>
                        </div>

                        <!-- Trade Analysis Card -->
                        ${t ? `
                        <div class="glass-card p-4 rounded-xl border border-slate-700 space-y-2.5">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold text-slate-300">Fairness Rating:</span>
                                <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                                    t.fairness_rating.includes('Steal') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                    t.fairness_rating.includes('Fair') ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                                    'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }">${t.fairness_rating}</span>
                            </div>
                            <div class="text-xs text-slate-300 font-mono">
                                Point Differential: <strong class="${t.point_differential <= 0 ? 'text-emerald-400' : 'text-rose-400'}">${t.point_differential > 0 ? '+' : ''}${t.point_differential} pts (${t.percentage_diff}%)</strong>
                            </div>
                            <p class="text-xs text-slate-300 leading-relaxed">${t.verdict}</p>
                            <div class="text-xs pt-2 border-t border-slate-800 text-purple-300 font-semibold flex items-center gap-1.5">
                                <i data-lucide="bot" class="w-4 h-4"></i>
                                <span>${t.ai_recommendation}</span>
                            </div>
                        </div>
                        ` : ''}
                    </div>

                    <!-- Available Prospects Quick Draft List -->
                    <div class="glass-panel rounded-xl p-5 border border-slate-800">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                            <span>Top Available Draft Prospects (${this.availableProspects.length})</span>
                            <span class="text-[10px] text-sky-400 font-mono">1-Click Selection</span>
                        </h3>
                        <div class="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                            ${availableHtml}
                        </div>
                    </div>
                </div>

                <!-- Right: Full Round 1 Draft Order Board (7 cols) -->
                <div class="lg:col-span-7 glass-panel rounded-xl p-5 flex flex-col">
                    <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                        <h3 class="text-sm font-bold text-white flex items-center gap-2">
                            <i data-lucide="list" class="w-4 h-4 text-sky-400"></i>
                            2026 NHL Entry Draft - Round 1 Selection Board
                        </h3>
                        <span class="text-xs font-mono text-slate-400">32 Picks Total</span>
                    </div>

                    <div class="space-y-2 flex-1 overflow-y-auto max-h-[720px] pr-1">
                        ${draftOrderHtml}
                    </div>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
    }

    async makePick(prospectId) {
        try {
            const res = await fetch('/api/draft-sim/make-pick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prospect_id: prospectId })
            });

            if (!res.ok) throw new Error('Pick failed');
            await this.refreshState();
            this.render();
        } catch (err) {
            console.error('Make pick error:', err);
        }
    }

    async autoPickNext() {
        try {
            const res = await fetch('/api/draft-sim/auto-pick', { method: 'POST' });
            if (!res.ok) throw new Error('Auto pick failed');
            await this.refreshState();
            this.render();
        } catch (err) {
            console.error('Auto pick error:', err);
        }
    }

    async updateTradePicks() {
        const aVal = document.getElementById('trade-input-a')?.value || '14, 46';
        const bVal = document.getElementById('trade-input-b')?.value || '8';

        this.tradeTeamAPicks = aVal.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        this.tradeTeamBPicks = bVal.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

        await this.evaluateCurrentTrade();
        this.render();
    }

    async evaluateCurrentTrade() {
        try {
            const res = await fetch('/api/draft-sim/evaluate-trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    team_a_picks: this.tradeTeamAPicks,
                    team_b_picks: this.tradeTeamBPicks,
                    team_a_name: 'San Jose Sharks',
                    team_b_name: 'Seattle Kraken'
                })
            });
            if (res.ok) {
                this.tradeEvaluation = await res.json();
            }
        } catch (err) {
            console.error('Trade eval error:', err);
        }
    }

    async resetDraft() {
        try {
            await fetch('/api/draft-sim/reset', { method: 'POST' });
            await this.refreshState();
            this.render();
        } catch (err) {
            console.error('Reset error:', err);
        }
    }
}

window.DraftFloorSimulator = DraftFloorSimulator;
