// ApexScout War Room & Tiered Draft Board Manager
class DraftBoardManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.boardData = null;
        this.prospectsMap = {};
    }

    async init() {
        if (!this.container) return;
        try {
            const [board, prospects] = await Promise.all([
                API.getDraftBoard(),
                API.getProspects()
            ]);
            this.boardData = board;
            this.prospectsMap = {};
            prospects.forEach(p => this.prospectsMap[p.id] = p);
            this.render();
        } catch (err) {
            console.error('Failed to init draft board:', err);
        }
    }

    render() {
        if (!this.container || !this.boardData) return;

        let html = `
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div>
                    <h2 class="text-xl font-bold text-white flex items-center gap-2">
                        <i data-lucide="layers" class="w-5 h-5 text-sky-400"></i>
                        War Room Big Board & Consensus Matrix
                    </h2>
                    <p class="text-xs text-slate-400 mt-1">
                        Drag or promote prospects between tiers. System automatically computes scout consensus vs. regional & analytics outliers.
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                        Total Ranked: <strong class="text-sky-400">${Object.keys(this.prospectsMap).length}</strong>
                    </span>
                    <button onclick="window.DraftBoard.showConsensusAnalysis()" class="px-3.5 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-semibold hover:bg-sky-500/30 flex items-center gap-1.5">
                        <i data-lucide="trending-up" class="w-3.5 h-3.5"></i>
                        Variance Breakdown
                    </button>
                </div>
            </div>
            
            <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        `;

        this.boardData.tiers.forEach(tier => {
            const tierPlayers = (tier.prospect_ids || [])
                .map(id => this.prospectsMap[id])
                .filter(Boolean);

            html += `
                <div class="glass-panel rounded-xl p-4 flex flex-col h-full border-t-4" style="border-top-color: ${tier.color_hex};" ondragover="event.preventDefault()" ondrop="window.DraftBoard.handleDrop(event, ${tier.tier_number})">
                    <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                        <div>
                            <div class="text-sm font-bold text-white flex items-center gap-2">
                                <span class="w-2.5 h-2.5 rounded-full" style="background: ${tier.color_hex};"></span>
                                Tier ${tier.tier_number}
                            </div>
                            <div class="text-[11px] text-slate-400 leading-tight mt-0.5">${tier.description}</div>
                        </div>
                        <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            ${tierPlayers.length}
                        </span>
                    </div>

                    <div class="space-y-2.5 flex-1 overflow-y-auto max-h-[620px] pr-1">
            `;

            tierPlayers.forEach(p => {
                const variance = this.boardData.variances.find(v => v.prospect_id === p.id);
                const isBull = variance && variance.divergence_type.includes('Bull');
                const isCaution = variance && variance.divergence_type.includes('Caution');

                let badge = '';
                if (isBull) {
                    badge = `<span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Bull +${Math.abs(p.consensus_rank - p.regional_rank)}</span>`;
                } else if (isCaution) {
                    badge = `<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Variance ?${variance.variance_score}</span>`;
                }

                html += `
                    <div class="glass-card rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-sky-500/40 relative group"
                         draggable="true" 
                         ondragstart="window.DraftBoard.handleDragStart(event, '${p.id}')"
                         onclick="window.App.openProspectModal('${p.id}')">
                        
                        <div class="flex items-start justify-between">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-mono font-extrabold text-sky-400 w-5">#${p.consensus_rank}</span>
                                <div>
                                    <div class="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                                        ${p.first_name} ${p.last_name}
                                    </div>
                                    <div class="text-[11px] text-slate-400">
                                        ${p.position} ? ${p.shoots_catches} ? ${p.current_team} (${p.league})
                                    </div>
                                </div>
                            </div>
                            <div class="flex flex-col items-end">
                                <span class="text-xs font-mono font-bold text-slate-300">${p.grades.overall_grade}</span>
                                <span class="text-[9px] text-slate-500 uppercase">20-80 OVR</span>
                            </div>
                        </div>

                        <div class="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                            <div class="flex items-center gap-1.5">
                                ${badge || `<span class="text-[10px] text-slate-500">Lock #${p.consensus_rank}</span>`}
                            </div>
                            <div class="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                                <span>${p.points} PTS</span> ? <span>${p.points_per_game} PPG</span>
                            </div>
                        </div>

                        <!-- Quick Move controls -->
                        <div class="hidden group-hover:flex items-center justify-end gap-1 mt-2 pt-2 border-t border-slate-700">
                            ${tier.tier_number > 1 ? `
                                <button onclick="event.stopPropagation(); window.DraftBoard.moveTier('${p.id}', ${tier.tier_number - 1})" class="px-2 py-0.5 rounded bg-slate-700 hover:bg-sky-600 text-[10px] text-slate-200">
                                    ? Up Tier
                                </button>
                            ` : ''}
                            ${tier.tier_number < 4 ? `
                                <button onclick="event.stopPropagation(); window.DraftBoard.moveTier('${p.id}', ${tier.tier_number + 1})" class="px-2 py-0.5 rounded bg-slate-700 hover:bg-amber-600 text-[10px] text-slate-200">
                                    ? Down Tier
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        this.container.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
    }

    handleDragStart(event, prospectId) {
        event.dataTransfer.setData('text/plain', prospectId);
    }

    async handleDrop(event, targetTier) {
        event.preventDefault();
        const prospectId = event.dataTransfer.getData('text/plain');
        if (prospectId) {
            await this.moveTier(prospectId, targetTier);
        }
    }

    async moveTier(prospectId, newTier) {
        try {
            await API.updateTier(prospectId, newTier);
            await this.init();
        } catch (err) {
            console.error('Failed to move tier:', err);
        }
    }

    showConsensusAnalysis() {
        if (!this.boardData) return;
        const modal = document.getElementById('global-modal');
        const modalContent = document.getElementById('global-modal-content');
        if (!modal || !modalContent) return;

        let rows = '';
        this.boardData.variances.forEach(v => {
            const p = this.prospectsMap[v.prospect_id];
            if (!p) return;
            rows += `
                <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4 font-bold text-white">${v.player_name} (${p.position})</td>
                    <td class="py-3 px-4 font-mono text-sky-400 font-bold">#${v.consensus_rank}</td>
                    <td class="py-3 px-4 font-mono text-emerald-400">#${v.regional_scout_rank}</td>
                    <td class="py-3 px-4 font-mono text-purple-400">#${v.analytics_rank}</td>
                    <td class="py-3 px-4">
                        <span class="text-xs px-2 py-1 rounded font-semibold ${
                            v.divergence_type.includes('Bull') ? 'bg-emerald-500/20 text-emerald-300' :
                            v.divergence_type.includes('Caution') ? 'bg-amber-500/20 text-amber-300' :
                            'bg-slate-700 text-slate-300'
                        }">
                            ${v.divergence_type}
                        </span>
                    </td>
                    <td class="py-3 px-4 text-xs text-slate-300 leading-relaxed">${v.notes}</td>
                </tr>
            `;
        });

        modalContent.innerHTML = `
            <div class="p-6">
                <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                    <div>
                        <h3 class="text-lg font-bold text-white flex items-center gap-2">
                            <i data-lucide="compass" class="w-5 h-5 text-sky-400"></i>
                            Scout Consensus Discrepancy & Variance Analysis
                        </h3>
                        <p class="text-xs text-slate-400 mt-1">Cross-check between Regional In-Rink Scouts, European Observers, and Micro-Stat Analytics Models.</p>
                    </div>
                    <button onclick="window.App.closeModal()" class="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <div class="overflow-x-auto max-h-[500px]">
                    <table class="w-full text-left text-xs">
                        <thead class="text-slate-400 bg-slate-900 sticky top-0 uppercase tracking-wider text-[11px]">
                            <tr>
                                <th class="py-2.5 px-4">Prospect</th>
                                <th class="py-2.5 px-4">Consensus</th>
                                <th class="py-2.5 px-4">Regional Scout</th>
                                <th class="py-2.5 px-4">Analytics Model</th>
                                <th class="py-2.5 px-4">Variance Classification</th>
                                <th class="py-2.5 px-4">Scout Rationale</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
    }
}

window.DraftBoardManager = DraftBoardManager;
