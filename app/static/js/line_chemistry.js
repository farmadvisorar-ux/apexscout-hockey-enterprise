// LineChemistry Multi-League Synergy & Line Combinations Engine
class LineChemistryManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.lineupData = null;
        this.availablePlayers = [];
    }

    async init() {
        if (!this.container) return;
        this.container.innerHTML = '<div class="p-12 text-center text-slate-500 font-mono">Loading LineChemistry Synergy Matrix...</div>';
        try {
            const [lineup, players] = await Promise.all([
                fetch('/api/chemistry/current').then(r => r.json()),
                fetch('/api/prospects').then(r => r.json())
            ]);
            this.lineupData = lineup;
            this.availablePlayers = players;
            this.render();
        } catch (err) {
            console.error('Failed to init LineChemistry:', err);
            this.container.innerHTML = '<div class="p-8 text-center text-rose-400">Failed to load LineChemistry data.</div>';
        }
    }

    render() {
        if (!this.container || !this.lineupData) return;
        const d = this.lineupData;

        let html = `
            <div class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
                
                <!-- Header Toolbar -->
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold tracking-wider mb-1">
                            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                            PHASE 6: AI LINE COMBINATIONS & SYNERGY ENGINE
                        </div>
                        <h2 class="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                            <i data-lucide="workflow" class="w-6 h-6 text-cyan-400"></i>
                            LineChemistry? Roster Matrix & Synergy Predictor
                        </h2>
                        <p class="text-xs text-slate-400 mt-1">
                            Drag, drop, and optimize 5v5 forward triads, defense pairs, and special teams. Calculates archetype harmony, handedness physics, and projected goal differential.
                        </p>
                    </div>

                    <!-- Quick Metrics & 1-Click Optimizer -->
                    <div class="flex flex-wrap items-center gap-3">
                        <div class="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-center">
                            <div class="text-[10px] text-slate-500 uppercase font-mono font-bold">Team Chemistry</div>
                            <div class="text-lg font-black text-cyan-400 font-mono">${d.overall_chemistry_rating}%</div>
                        </div>
                        <div class="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-center">
                            <div class="text-[10px] text-slate-500 uppercase font-mono font-bold">Offensive Flow</div>
                            <div class="text-lg font-black text-emerald-400 font-mono">${d.offensive_flow_score}/100</div>
                        </div>
                        <div class="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-center">
                            <div class="text-[10px] text-slate-500 uppercase font-mono font-bold">Rush Suppression</div>
                            <div class="text-lg font-black text-sky-400 font-mono">${d.defensive_containment_score}%</div>
                        </div>
                        <div class="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-center">
                            <div class="text-[10px] text-slate-500 uppercase font-mono font-bold">Win Impact</div>
                            <div class="text-lg font-black text-amber-400 font-mono">+${d.projected_win_differential} W</div>
                        </div>
                        <button onclick="window.LineChem.optimize()" class="px-4 py-3 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all">
                            <i data-lucide="sparkles" class="w-4 h-4"></i>
                            AI 1-Click Optimize
                        </button>
                    </div>
                </div>

                <!-- 2-Column War Room Layout -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    <!-- Left: 4 Forward Lines & 3 Defense Pairs (8 Cols) -->
                    <div class="lg:col-span-8 space-y-6">
                        
                        <!-- FORWARD TRIADS -->
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <h3 class="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                                    <i data-lucide="users" class="w-4 h-4 text-cyan-400"></i>
                                    5v5 Forward Lines (Triad Synergy)
                                </h3>
                                <span class="text-xs text-slate-400 font-mono">12 Active Forwards</span>
                            </div>

                            <div class="space-y-3">
                                ${d.forward_lines.map((f, idx) => `
                                    <div class="bg-slate-900/80 rounded-xl p-4 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-3">
                                        <div class="flex items-center justify-between text-xs">
                                            <span class="font-mono font-extrabold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                                                LINE ${f.line_number} ? ${f.playstyle_tag}
                                            </span>
                                            <div class="flex items-center gap-3 font-mono text-[11px]">
                                                <span class="text-slate-400">xG/60: <strong class="text-emerald-400">${f.projected_xg_per_60}</strong></span>
                                                <span class="text-slate-400">xGA/60: <strong class="text-rose-400">${f.projected_xga_per_60}</strong></span>
                                                <span class="px-2 py-0.5 rounded font-extrabold ${f.synergy_score >= 85 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-sky-500/20 text-sky-300'}">
                                                    ${f.synergy_score}% Synergy
                                                </span>
                                            </div>
                                        </div>

                                        <!-- 3 Slots: LW - C - RW -->
                                        <div class="grid grid-cols-3 gap-3">
                                            <div class="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
                                                <div class="text-[10px] font-mono text-slate-500 uppercase font-bold">Left Wing</div>
                                                <div class="text-xs font-bold text-white mt-1">${f.lw_name}</div>
                                            </div>
                                            <div class="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
                                                <div class="text-[10px] font-mono text-cyan-400 uppercase font-bold">Center</div>
                                                <div class="text-xs font-bold text-white mt-1">${f.c_name}</div>
                                            </div>
                                            <div class="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
                                                <div class="text-[10px] font-mono text-slate-500 uppercase font-bold">Right Wing</div>
                                                <div class="text-xs font-bold text-white mt-1">${f.rw_name}</div>
                                            </div>
                                        </div>
                                        
                                        <div class="text-[11px] text-slate-400 italic">
                                            ?? ${f.chemistry_notes}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- DEFENSE PAIRS -->
                        <div class="space-y-3 pt-2">
                            <div class="flex items-center justify-between">
                                <h3 class="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                                    <i data-lucide="shield" class="w-4 h-4 text-sky-400"></i>
                                    Defense Pairings & Handedness
                                </h3>
                                <span class="text-xs text-slate-400 font-mono">6 Active Defensemen</span>
                            </div>

                            <div class="space-y-3">
                                ${d.defense_pairs.map((dp, idx) => `
                                    <div class="bg-slate-900/80 rounded-xl p-4 border border-slate-800 hover:border-sky-500/30 transition-all space-y-3">
                                        <div class="flex items-center justify-between text-xs">
                                            <span class="font-mono font-extrabold text-sky-400 px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/30">
                                                PAIR ${dp.pair_number} ? ${dp.handedness_balance}
                                            </span>
                                            <div class="flex items-center gap-3 font-mono text-[11px]">
                                                <span class="text-slate-400">Puck Moving: <strong class="text-sky-300">${dp.puck_moving_grade}/80</strong></span>
                                                <span class="text-slate-400">Entry Denial: <strong class="text-emerald-400">${dp.rush_suppression_pct}%</strong></span>
                                                <span class="px-2 py-0.5 rounded font-extrabold bg-sky-500/20 text-sky-300">
                                                    ${dp.synergy_score}% Synergy
                                                </span>
                                            </div>
                                        </div>

                                        <!-- 2 Slots: LD - RD -->
                                        <div class="grid grid-cols-2 gap-3">
                                            <div class="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
                                                <div class="text-[10px] font-mono text-slate-500 uppercase font-bold">Left Defense</div>
                                                <div class="text-xs font-bold text-white mt-1">${dp.ld_name}</div>
                                            </div>
                                            <div class="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
                                                <div class="text-[10px] font-mono text-sky-400 uppercase font-bold">Right Defense</div>
                                                <div class="text-xs font-bold text-white mt-1">${dp.rd_name}</div>
                                            </div>
                                        </div>

                                        <div class="text-[11px] text-slate-400 italic">
                                            ?? ${dp.chemistry_notes}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                    </div>

                    <!-- Right: Special Teams Units & AI Insights (4 Cols) -->
                    <div class="lg:col-span-4 space-y-6">
                        
                        <!-- GOALIE TANDEM CARD -->
                        <div class="glass-card p-5 rounded-2xl space-y-3">
                            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                                <i data-lucide="shield-alert" class="w-3.5 h-3.5 text-cyan-400"></i>
                                Goaltending Tandem
                            </h3>
                            <div class="space-y-2">
                                <div class="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                                    <div>
                                        <div class="text-[10px] font-mono text-emerald-400 font-bold uppercase">Starting Goalie</div>
                                        <div class="text-xs font-bold text-white mt-0.5">${d.goalies[0] || 'Starter'}</div>
                                    </div>
                                    <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">.928 SV% Proj</span>
                                </div>
                                <div class="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                                    <div>
                                        <div class="text-[10px] font-mono text-sky-400 font-bold uppercase">Backup Tandem</div>
                                        <div class="text-xs font-bold text-white mt-0.5">${d.goalies[1] || 'Backup'}</div>
                                    </div>
                                    <span class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold">.919 SV% Proj</span>
                                </div>
                            </div>
                        </div>

                        <!-- SPECIAL TEAMS (PP1 / PK1) -->
                        <div class="glass-card p-5 rounded-2xl space-y-4">
                            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                                <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-400"></i>
                                Special Teams Formations
                            </h3>

                            ${d.special_teams.map(st => `
                                <div class="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
                                    <div class="flex items-center justify-between">
                                        <span class="text-xs font-bold text-white">${st.unit_name} (${st.formation})</span>
                                        <span class="text-xs font-mono font-extrabold text-emerald-400">${st.effectiveness_pct}% Eff</span>
                                    </div>
                                    <div class="text-[11px] text-slate-400 font-mono space-y-1 pt-1 border-t border-slate-800/80">
                                        ${Object.entries(st.tactical_role_breakdown).map(([role, pName]) => `
                                            <div class="flex items-center justify-between">
                                                <span class="text-slate-500">${role}:</span>
                                                <span class="text-slate-300 font-bold">${pName}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- AI TACTICAL INSIGHTS -->
                        <div class="glass-card p-5 rounded-2xl space-y-3 border border-cyan-500/30 bg-cyan-950/20">
                            <h3 class="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
                                <i data-lucide="brain" class="w-3.5 h-3.5 text-cyan-400"></i>
                                AI Tactical Coach Insights
                            </h3>
                            <ul class="space-y-2 text-xs text-slate-300 leading-relaxed">
                                ${d.tactical_ai_insights.map(ins => `
                                    <li class="flex items-start gap-2">
                                        <span class="text-cyan-400 font-bold">?</span>
                                        <span>${ins}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>

                    </div>

                </div>

            </div>
        `;

        this.container.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
    }

    async optimize() {
        this.container.innerHTML = '<div class="p-12 text-center text-cyan-400 font-mono animate-pulse">AI Calculating Optimal 5v5 Synergy & Handedness...</div>';
        try {
            const res = await fetch('/api/chemistry/optimize', { method: 'POST' });
            this.lineupData = await res.json();
            this.render();
        } catch (err) {
            console.error('Failed to optimize lineup:', err);
        }
    }
}
