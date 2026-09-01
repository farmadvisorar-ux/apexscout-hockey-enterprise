// ApexScout 3-Year NHL Roster Pipeline & Depth Chart War Room
class DepthChartManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.depthData = null;
        this.projectionYearOffset = 0; // 0: 2026-27, 1: 2027-28, 2: 2028-29
    }

    async init() {
        if (!this.container) return;
        try {
            this.depthData = await API.getDepthChart();
            this.render();
        } catch (err) {
            console.error('Failed to load depth chart:', err);
        }
    }

    setYearOffset(offset) {
        this.projectionYearOffset = offset;
        this.render();
    }

    render() {
        if (!this.container || !this.depthData) return;

        const yearLabel = this.projectionYearOffset === 0 ? '2026-27 (Current)' :
                          this.projectionYearOffset === 1 ? '2027-28 (+1 Year)' :
                          '2028-29 (+2 Years Horizon)';

        let html = `
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
                <div>
                    <h2 class="text-xl font-bold text-white flex items-center gap-2">
                        <i data-lucide="git-branch" class="w-5 h-5 text-sky-400"></i>
                        3-Year Organization Roster & Prospect Pipeline Simulation
                    </h2>
                    <p class="text-xs text-slate-400 mt-1">
                        Forecast prospective roster progression, Entry-Level Contract (ELC) slides, and positional depth deficits.
                    </p>
                </div>
                
                <!-- Year Timeline Selector -->
                <div class="flex items-center bg-slate-900 p-1.5 rounded-xl border border-slate-800 gap-1 self-start">
                    <button onclick="window.DepthChart.setYearOffset(0)" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${this.projectionYearOffset === 0 ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'text-slate-400 hover:text-white'}">
                        2026-27 Current
                    </button>
                    <button onclick="window.DepthChart.setYearOffset(1)" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${this.projectionYearOffset === 1 ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'text-slate-400 hover:text-white'}">
                        2027-28 (+1 Yr)
                    </button>
                    <button onclick="window.DepthChart.setYearOffset(2)" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${this.projectionYearOffset === 2 ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'text-slate-400 hover:text-white'}">
                        2028-29 (+2 Yrs)
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Forward Lines (2 Cols) -->
                <div class="lg:col-span-2 space-y-4">
                    <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-sky-400"></span> Forward Lines (12 F)
                        </h3>
                        <span class="text-xs text-slate-500 font-mono">${yearLabel}</span>
                    </div>
        `;

        this.depthData.forward_lines.forEach((line, index) => {
            html += `
                <div class="glass-panel rounded-xl p-3 border border-slate-800">
                    <div class="text-[11px] font-bold text-slate-400 uppercase mb-2">Line ${index + 1}</div>
                    <div class="grid grid-cols-3 gap-3">
            `;
            line.forEach(slot => {
                const projectedAge = slot.age + this.projectionYearOffset;
                const ovr = this.projectionYearOffset === 0 ? slot.current_overall :
                            this.projectionYearOffset === 1 ? Math.round((slot.current_overall + slot.projected_overall) / 2) :
                            slot.projected_overall;

                html += `
                    <div class="glass-card rounded-lg p-2.5 flex flex-col justify-between ${slot.player_id ? 'cursor-pointer hover:border-sky-500/40' : ''}" 
                         ${slot.player_id ? `onclick="window.App.openProspectModal('${slot.player_id}')"` : ''}>
                        <div>
                            <div class="flex items-center justify-between">
                                <span class="text-[10px] font-mono font-bold text-sky-400">${slot.position_slot}</span>
                                <span class="text-xs font-mono font-bold text-white">${ovr} <span class="text-[9px] text-slate-500">OVR</span></span>
                            </div>
                            <div class="text-xs font-bold text-white mt-1 leading-tight line-clamp-1">${slot.player_name}</div>
                        </div>
                        <div class="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Age ${projectedAge}</span>
                            <span class="px-1.5 py-0.2 rounded ${slot.elc_slide_active ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'} font-mono">${slot.contract_status}</span>
                        </div>
                    </div>
                `;
            });
            html += `</div></div>`;
        });

        html += `
                </div>

                <!-- Defense & Goaltending & Pipeline (1 Col) -->
                <div class="space-y-6">
                    <!-- Defense Pairs -->
                    <div>
                        <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Defense Pairings (6 D)
                            </h3>
                        </div>
                        <div class="space-y-3">
        `;

        this.depthData.defense_pairs.forEach((pair, index) => {
            html += `
                <div class="glass-panel rounded-xl p-3 border border-slate-800">
                    <div class="text-[11px] font-bold text-slate-400 uppercase mb-2">Pair ${index + 1}</div>
                    <div class="grid grid-cols-2 gap-3">
            `;
            pair.forEach(slot => {
                const projectedAge = slot.age + this.projectionYearOffset;
                const ovr = this.projectionYearOffset === 0 ? slot.current_overall :
                            this.projectionYearOffset === 1 ? Math.round((slot.current_overall + slot.projected_overall) / 2) :
                            slot.projected_overall;

                html += `
                    <div class="glass-card rounded-lg p-2.5 flex flex-col justify-between ${slot.player_id ? 'cursor-pointer hover:border-sky-500/40' : ''}"
                         ${slot.player_id ? `onclick="window.App.openProspectModal('${slot.player_id}')"` : ''}>
                        <div>
                            <div class="flex items-center justify-between">
                                <span class="text-[10px] font-mono font-bold text-emerald-400">${slot.position_slot}</span>
                                <span class="text-xs font-mono font-bold text-white">${ovr} <span class="text-[9px] text-slate-500">OVR</span></span>
                            </div>
                            <div class="text-xs font-bold text-white mt-1 leading-tight line-clamp-1">${slot.player_name}</div>
                        </div>
                        <div class="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Age ${projectedAge}</span>
                            <span class="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">${slot.contract_status}</span>
                        </div>
                    </div>
                `;
            });
            html += `</div></div>`;
        });

        // Goalies & In-System Pipeline
        html += `
                        </div>
                    </div>

                    <!-- Goalies -->
                    <div>
                        <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-purple-400"></span> Goaltenders (2 G)
                            </h3>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
        `;

        this.depthData.goalies.forEach(slot => {
            const projectedAge = slot.age + this.projectionYearOffset;
            const ovr = this.projectionYearOffset === 0 ? slot.current_overall :
                        this.projectionYearOffset === 1 ? Math.round((slot.current_overall + slot.projected_overall) / 2) :
                        slot.projected_overall;

            html += `
                <div class="glass-panel rounded-xl p-3 border border-slate-800 ${slot.player_id ? 'cursor-pointer hover:border-purple-500/40' : ''}"
                     ${slot.player_id ? `onclick="window.App.openProspectModal('${slot.player_id}')"` : ''}>
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-mono font-bold text-purple-400">${slot.position_slot}</span>
                        <span class="text-xs font-mono font-bold text-white">${ovr} <span class="text-[9px] text-slate-500">OVR</span></span>
                    </div>
                    <div class="text-xs font-bold text-white mt-1 leading-tight">${slot.player_name}</div>
                    <div class="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Age ${projectedAge}</span>
                        <span class="font-mono text-slate-300">${slot.contract_status}</span>
                    </div>
                </div>
            `;
        });

        html += `
                        </div>
                    </div>

                    <!-- In-System Reserve Pipeline -->
                    <div>
                        <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                                <i data-lucide="shield" class="w-3.5 h-3.5 text-amber-400"></i>
                                Top System Pipeline (CHL / NCAA / USHL)
                            </h3>
                        </div>
                        <div class="space-y-2">
        `;

        this.depthData.pipeline_prospects.forEach(slot => {
            const projectedAge = slot.age + this.projectionYearOffset;
            const ovr = this.projectionYearOffset === 0 ? slot.current_overall :
                        this.projectionYearOffset === 1 ? Math.round((slot.current_overall + slot.projected_overall) / 2) :
                        slot.projected_overall;

            html += `
                <div class="glass-card rounded-lg p-2.5 flex items-center justify-between border border-slate-800 ${slot.player_id ? 'cursor-pointer hover:border-amber-500/40' : ''}"
                     ${slot.player_id ? `onclick="window.App.openProspectModal('${slot.player_id}')"` : ''}>
                    <div>
                        <div class="text-xs font-bold text-white">${slot.player_name} (${slot.position_slot})</div>
                        <div class="text-[10px] text-slate-400 mt-0.5">${slot.contract_status} ? Age ${projectedAge}</div>
                    </div>
                    <div class="text-right font-mono text-xs font-bold text-amber-400">
                        ${ovr} <span class="text-[9px] text-slate-500 font-normal">OVR</span>
                    </div>
                </div>
            `;
        });

        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
    }
}

window.DepthChartManager = DepthChartManager;
