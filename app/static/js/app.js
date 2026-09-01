class ApexScoutApp {
    constructor() {
        this.currentTab = 'overview'; // 'overview', 'prospects', 'rink', 'draft', 'draftfloor', 'timemachine', 'nilhub', 'visionlab', 'portal', 'depth', 'livescout'
        this.prospects = [];
        this.selectedProspect = null;
        this.compareProspect = null;
        this.filters = {
            league: 'ALL',
            position: 'ALL',
            tier: null,
            search: ''
        };
        
        this.rinkVis = null;
        this.radarChart = null;
        this.modalRadarChart = null;
    }

    async init() {
        try {
            await this.loadProspects();
            this.setupGlobalEvents();
            this.switchTab('overview');
        } catch (err) {
            console.error('App init failed:', err);
        }
    }

    async loadProspects() {
        this.prospects = await API.getProspects(this.filters);
        this.renderProspectsList();
        this.updateHeaderStats();
    }

    updateHeaderStats() {
        const countEl = document.getElementById('stat-total-prospects');
        if (countEl) countEl.innerText = this.prospects.length;
    }

    setupGlobalEvents() {
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
            let timeout = null;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.filters.search = e.target.value;
                    this.loadProspects();
                }, 200);
            });
        }
    }

    switchTab(tabId) {
        this.currentTab = tabId;
        const tabs = ['overview', 'prospects', 'rink', 'draft', 'draftfloor', 'timemachine', 'nilhub', 'visionlab', 'portal', 'depth', 'chemistry', 'livescout', 'scoutwire'];
        
        tabs.forEach(t => {
            const btn = document.getElementById(`tab-btn-${t}`);
            const view = document.getElementById(`tab-view-${t}`);
            if (btn) {
                if (t === tabId) {
                    btn.classList.add('nav-tab-active', 'text-cyan-300', 'bg-sky-500/20');
                    btn.classList.remove('text-slate-400');
                } else {
                    btn.classList.remove('nav-tab-active', 'text-cyan-300', 'bg-sky-500/20');
                    btn.classList.add('text-slate-400');
                }
            }
            if (view) {
                view.classList.toggle('hidden', t !== tabId);
            }
        });

        // Tab specific initializations
        if (tabId === 'scoutwire') {
            if (window.ScoutWire) window.ScoutWire.init();
        } else if (tabId === 'draft') {
            if (!window.DraftBoard) window.DraftBoard = new DraftBoardManager('draft-board-container');
            window.DraftBoard.init();
        } else if (tabId === 'draftfloor') {
            if (!window.DraftSim) window.DraftSim = new DraftFloorSimulator('draftfloor-container');
            window.DraftSim.init();
        } else if (tabId === 'timemachine') {
            if (!window.Comparator) window.Comparator = new TimeMachineComparator('timemachine-container');
            window.Comparator.init();
        } else if (tabId === 'nilhub') {
            if (!window.NILHub) window.NILHub = new NILHubManager('nilhub-container');
            window.NILHub.init();
        } else if (tabId === 'visionlab') {
            if (!window.VisionLab) window.VisionLab = new VisionLabManager('visionlab-container');
            window.VisionLab.init();
        } else if (tabId === 'portal') {
            if (!window.PortalHub) window.PortalHub = new PortalHubManager('portal-hub-container');
            window.PortalHub.init();
        } else if (tabId === 'depth') {
            if (!window.DepthChart) window.DepthChart = new DepthChartManager('depth-chart-container');
            window.DepthChart.init();
        } else if (tabId === 'chemistry') {
            if (!window.LineChem) window.LineChem = new LineChemistryManager('line-chemistry-container');
            window.LineChem.init();
        } else if (tabId === 'livescout') {
            if (!window.LiveScout) window.LiveScout = new LiveScoutManager('livescout-container');
            window.LiveScout.init();
        } else if (tabId === 'rink') {
            this.initRinkAnalyticsView();
        }
        
        if (window.lucide) window.lucide.createIcons();
    }

    setFilter(key, value) {
        this.filters[key] = value;
        
        // Update active button styling
        if (key === 'league') {
            const leagueButtons = ['ALL', 'NHL', 'NCAA_D1', 'NCAA_D3', 'CHL', 'JUNIOR_A', 'EURO', 'FREE_AGENT'];
            leagueButtons.forEach(lg => {
                const btn = document.getElementById(`flt-lg-${lg}`);
                if (btn) {
                    if (lg === value) {
                        btn.className = 'px-3 py-1 text-xs font-bold rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40';
                    } else {
                        btn.className = 'px-3 py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-200';
                    }
                }
            });
        } else if (key === 'status') {
            const statusButtons = ['ALL', 'ACTIVE', 'FREE_AGENT', 'PORTAL', 'UNCOMMITTED'];
            statusButtons.forEach(st => {
                const btn = document.getElementById(`flt-st-${st}`);
                if (btn) {
                    if (st === value) {
                        btn.className = 'px-2.5 py-1 text-xs font-semibold rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40';
                    } else {
                        btn.className = 'px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-200';
                    }
                }
            });
        } else if (key === 'position') {
            const posButtons = ['ALL', 'C', 'FORWARD', 'DEFENSE', 'G'];
            posButtons.forEach(pos => {
                const btn = document.getElementById(`flt-pos-${pos}`);
                if (btn) {
                    if (pos === value) {
                        btn.className = 'px-2.5 py-1 text-xs font-semibold rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40';
                    } else {
                        btn.className = 'px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-200';
                    }
                }
            });
        }

        this.loadProspects();
    }

    renderProspectsList() {
        const container = document.getElementById('prospects-grid');
        if (!container) return;

        if (this.prospects.length === 0) {
            container.innerHTML = `
                <div class="col-span-full p-12 text-center text-slate-500">
                    <i data-lucide="search-x" class="w-12 h-12 mx-auto mb-3 opacity-40"></i>
                    <p class="text-base font-semibold text-slate-400">No players or prospects match the selected filter criteria</p>
                    <button onclick="window.App.resetFilters()" class="mt-4 px-4 py-2 bg-sky-500/20 text-sky-400 border border-sky-500/40 rounded-lg text-xs font-bold">
                        Reset Filters
                    </button>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        let html = '';
        this.prospects.forEach(p => {
            const g = p.grades;
            const ovr = g.overall_grade;
            let ovrClass = 'grade-badge-average';
            if (ovr >= 75) ovrClass = 'grade-badge-elite';
            else if (ovr >= 65) ovrClass = 'grade-badge-plus';

            const isFreeAgent = p.team_status && p.team_status !== 'Active Roster';
            const statusBadgeHtml = isFreeAgent ? 
                `<div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-mono font-bold">
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                    ${p.status_badge || 'Looking for Team'}
                </div>` : 
                `<div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    ${p.league} · ${p.current_team}
                </div>`;

            html += `
                <div class="glass-card rounded-2xl p-5 cursor-pointer hover:border-cyan-500/50 flex flex-col justify-between transition-all group"
                     onclick="window.App.openProspectModal('${p.id}')">
                    
                    <div class="space-y-3">
                        <!-- Top Level Status Pill -->
                        <div class="flex items-center justify-between">
                            ${statusBadgeHtml}
                            <span class="text-xs px-2.5 py-1 rounded-lg font-mono font-extrabold ${ovrClass}">
                                ${ovr} <span class="text-[9px] font-normal opacity-80">OVR</span>
                            </span>
                        </div>

                        <!-- Player Identity Bar -->
                        <div class="flex items-start justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-extrabold text-cyan-400 text-sm group-hover:border-cyan-400 transition-all">
                                    #${p.consensus_rank}
                                </div>
                                <div>
                                    <h3 class="text-base font-bold text-white leading-tight flex items-center gap-2 group-hover:text-cyan-300 transition-all">
                                        ${p.first_name} ${p.last_name}
                                        <span class="text-xs font-normal text-slate-400 font-mono">(${p.nationality})</span>
                                    </h3>
                                    <div class="text-xs text-slate-400 mt-0.5 font-medium">
                                        ${p.position} • ${p.shoots_catches} • <span class="text-slate-300 font-semibold">${p.current_team}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 20-80 Pro Tool Bars (High Contrast Numbers) -->
                        <div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                            <div class="bg-slate-900/90 p-2 rounded-lg text-center border border-slate-800">
                                <div class="text-[10px] text-slate-400 uppercase tracking-wider">Skating</div>
                                <div class="text-xs font-mono font-black text-cyan-400 mt-0.5">${g.skating_speed}/80</div>
                            </div>
                            <div class="bg-slate-900/90 p-2 rounded-lg text-center border border-slate-800">
                                <div class="text-[10px] text-slate-400 uppercase tracking-wider">Hockey IQ</div>
                                <div class="text-xs font-mono font-black text-emerald-400 mt-0.5">${g.hockey_iq}/80</div>
                            </div>
                            <div class="bg-slate-900/90 p-2 rounded-lg text-center border border-slate-800">
                                <div class="text-[10px] text-slate-400 uppercase tracking-wider">Puck Skills</div>
                                <div class="text-xs font-mono font-black text-amber-400 mt-0.5">${g.puck_skills}/80</div>
                            </div>
                        </div>

                        <!-- Tactical Summary Snippet -->
                        <div class="text-[11px] text-slate-300 line-clamp-2 bg-slate-950/60 p-2 rounded-lg border-l-2 border-cyan-400 font-medium">
                            ${p.what_they_do || 'High-impact player controlling transition pace and offensive generation.'}
                        </div>

                        <!-- Micro-stats / Measurables -->
                        <div class="text-xs text-slate-400 flex items-center justify-between pt-1 font-mono">
                            <span>${p.biometrics.height_display}, ${p.biometrics.weight_lbs} lbs</span>
                            <span class="text-cyan-300 font-extrabold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">${p.points} PTS (${p.points_per_game} PPG)</span>
                        </div>
                    </div>

                    <!-- Footer Action -->
                    <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                            ${p.draft_status}
                        </span>
                        <span class="text-xs text-cyan-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-all">
                            360° Dossier & Audio <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                        </span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
    }

    resetFilters() {
        this.filters = { league: 'ALL', position: 'ALL', tier: null, search: '', status: 'ALL' };
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.value = '';
        this.setFilter('league', 'ALL');
        this.setFilter('status', 'ALL');
        this.setFilter('position', 'ALL');
    }

    initRinkAnalyticsView() {
        if (!this.selectedProspect && this.prospects.length > 0) {
            this.selectedProspect = this.prospects[0];
        }
        if (!this.selectedProspect) return;

        const selector = document.getElementById('rink-prospect-select');
        if (selector) {
            selector.innerHTML = this.prospects.map(p => `
                <option value="${p.id}" ${p.id === this.selectedProspect.id ? 'selected' : ''}>
                    #${p.consensus_rank} ${p.first_name} ${p.last_name} (${p.position}, ${p.current_team})
                </option>
            `).join('');
        }

        if (!this.rinkVis) {
            this.rinkVis = new HockeyRinkVisualizer('rink-analytics-canvas', {
                mode: 'offensive',
                onHover: (shot) => this.updateShotTooltip(shot)
            });
        }
        this.rinkVis.setShots(this.selectedProspect.shots);
        this.updateRinkMetrics();
    }

    changeRinkProspect(prospectId) {
        this.selectedProspect = this.prospects.find(p => p.id === prospectId) || this.prospects[0];
        if (this.rinkVis) {
            this.rinkVis.setShots(this.selectedProspect.shots);
            this.updateRinkMetrics();
        }
    }

    filterRinkShots(filterType) {
        if (this.rinkVis) {
            this.rinkVis.setShots(this.selectedProspect.shots, { filterType });
        }
    }

    updateShotTooltip(shot) {
        const tooltip = document.getElementById('shot-inspector-card');
        if (!tooltip) return;

        if (!shot) {
            tooltip.innerHTML = `
                <div class="text-xs text-slate-500 italic p-3 text-center">
                    Hover over any shot marker on the ice rink to inspect xG, velocity, and play context.
                </div>
            `;
            return;
        }

        const isGoal = shot.result === 'goal';
        tooltip.innerHTML = `
            <div class="p-4 glass-card rounded-xl border border-slate-700">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold font-mono ${isGoal ? 'text-emerald-400' : 'text-slate-300'} uppercase">
                        ${shot.result.toUpperCase()} (${shot.shot_type.toUpperCase()} SHOT)
                    </span>
                    <span class="text-xs font-mono font-extrabold px-2 py-0.5 rounded ${shot.xg >= 0.20 ? 'bg-rose-500/20 text-rose-300' : 'bg-sky-500/20 text-sky-300'}">
                        xG: ${shot.xg}
                    </span>
                </div>
                <div class="text-xs text-slate-400 mt-2 space-y-1">
                    <div>Period: <strong class="text-white">${shot.period}</strong> ? Clock: <strong class="text-white">${shot.time}</strong></div>
                    <div>Zone: <strong class="text-white">${shot.danger_zone.toUpperCase()} DANGER</strong> ? Coordinates: <span class="font-mono">X:${shot.x}ft, Y:${shot.y}ft</span></div>
                    <div>Type: <strong class="text-sky-300">${shot.is_rush ? 'Off Rush Transition' : 'Sustained In-Zone Cycle'}</strong> ${shot.is_powerplay ? '(Power Play)' : '(5v5)'}</div>
                </div>
            </div>
        `;
    }

    updateRinkMetrics() {
        if (!this.selectedProspect) return;
        const p = this.selectedProspect;
        const t = p.transition_stats;

        const container = document.getElementById('rink-transition-metrics');
        if (container) {
            container.innerHTML = `
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div class="glass-card p-3 rounded-lg text-center">
                        <div class="text-[10px] text-slate-400 uppercase">Controlled Entries/60</div>
                        <div class="text-lg font-bold font-mono text-sky-400 mt-0.5">${t.controlled_entries_per_60}</div>
                        <div class="text-[10px] text-emerald-400 font-semibold">${t.controlled_entry_success_pct}% Success</div>
                    </div>
                    <div class="glass-card p-3 rounded-lg text-center">
                        <div class="text-[10px] text-slate-400 uppercase">Controlled Exits/60</div>
                        <div class="text-lg font-bold font-mono text-sky-400 mt-0.5">${t.controlled_exits_per_60}</div>
                        <div class="text-[10px] text-emerald-400 font-semibold">${t.controlled_exit_success_pct}% Success</div>
                    </div>
                    <div class="glass-card p-3 rounded-lg text-center">
                        <div class="text-[10px] text-slate-400 uppercase">Puck Battle Win %</div>
                        <div class="text-lg font-bold font-mono text-emerald-400 mt-0.5">${t.puck_battle_win_pct}%</div>
                        <div class="text-[10px] text-slate-400">${t.puck_recoveries_under_pressure}/60 Under Pressure</div>
                    </div>
                    <div class="glass-card p-3 rounded-lg text-center">
                        <div class="text-[10px] text-slate-400 uppercase">High Danger Passes/60</div>
                        <div class="text-lg font-bold font-mono text-purple-400 mt-0.5">${t.high_danger_passes_per_60}</div>
                        <div class="text-[10px] text-slate-400">Primary Assist Driver</div>
                    </div>
                </div>
            `;
        }
    }

    async openProspectModal(prospectId) {
        const modal = document.getElementById('global-modal');
        const modalContent = document.getElementById('global-modal-content');
        if (!modal || !modalContent) return;

        const p = await API.getProspect(prospectId);
        this.selectedProspect = p;
        const g = p.grades;
        const b = p.biometrics;
        const t = p.transition_stats;

        let videoClipsHtml = p.video_clips.map(v => `
            <div class="glass-card p-3 rounded-lg border border-slate-800 flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
                    <i data-lucide="play" class="w-4 h-4"></i>
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-white">${v.title}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-sky-300 font-mono">P${v.period} ${v.timestamp}</span>
                    </div>
                    <div class="text-xs text-slate-400 mt-1">${v.notes}</div>
                </div>
            </div>
        `).join('');

        let scoutReportsHtml = p.scout_reports.map(r => `
            <div class="glass-panel p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-xs font-bold text-white">${r.scout_name} <span class="text-slate-400 font-normal">(${r.scout_role})</span></div>
                        <div class="text-[10px] text-slate-500">${r.game} ? ${r.date}</div>
                    </div>
                    <span class="text-xs font-mono font-bold px-2 py-1 rounded bg-sky-500/20 text-sky-300">Grade ${r.overall_rating}/80</span>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed">${r.summary}</p>
                <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                    <div>
                        <span class="text-[10px] font-bold text-emerald-400 uppercase">Key Strengths</span>
                        <ul class="list-disc list-inside text-slate-300 mt-0.5 text-[11px]">
                            ${r.strengths.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <span class="text-[10px] font-bold text-rose-400 uppercase">Vulnerabilities</span>
                        <ul class="list-disc list-inside text-slate-300 mt-0.5 text-[11px]">
                            ${r.weaknesses.map(w => `<li>${w}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                <div class="text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <strong>NHL Comparable:</strong> <span class="text-sky-300">${r.nhl_comparable}</span> ? 
                    <strong>Projected Role:</strong> <span class="text-emerald-300">${r.projected_role}</span>
                </div>
            </div>
        `).join('');

        modalContent.innerHTML = `
            <div class="p-6 max-h-[85vh] overflow-y-auto">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-extrabold text-sky-400 text-xl">
                            #${p.consensus_rank}
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h2 class="text-2xl font-bold text-white">${p.first_name} ${p.last_name}</h2>
                                <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">${p.draft_status}</span>
                            </div>
                            <div class="text-xs text-slate-400 mt-1">
                                ${p.position} ? Shoots: ${p.shoots_catches} ? Born: ${p.birth_date} (${p.nationality}) ? <strong class="text-white">${p.current_team}</strong> (${p.league})
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 self-start md:self-auto">
                        <button onclick="window.App.synthesizeAI('${p.id}')" class="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/30">
                            <i data-lucide="sparkles" class="w-4 h-4"></i>
                            Synthesize AI Dossier
                        </button>
                        <button onclick="window.App.printDossier('${p.id}')" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-700">
                            <i data-lucide="printer" class="w-4 h-4"></i>
                            Draft Floor Packet
                        </button>
                        <button onclick="window.App.closeModal()" class="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>

                <!-- AI Dossier Banner Placeholder -->
                <div id="ai-synthesis-container" class="mt-4 ${p.ai_synthesis ? '' : 'hidden'}">
                    <div class="glass-panel p-4 rounded-xl border border-purple-500/40 bg-purple-950/20">
                        <div class="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">
                            <i data-lucide="bot" class="w-4 h-4"></i>
                            Executive AI Scouting Consensus Dossier
                        </div>
                        <p class="text-xs text-slate-200 leading-relaxed font-medium" id="ai-synthesis-text">${p.ai_synthesis || ''}</p>
                    </div>
                </div>

                <!-- NEW: Tactical "What They Do & How They Do It" Box (High Contrast) -->
                <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="tactical-box">
                        <div class="flex items-center gap-2 text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-1.5">
                            <i data-lucide="crosshair" class="w-4 h-4 text-cyan-400"></i>
                            What They Do (Tactical Profile)
                        </div>
                        <p class="text-xs text-slate-100 leading-relaxed font-medium">
                            ${p.what_they_do || 'Dictates transition pace and generates high-danger opportunities across all 200 feet.'}
                        </p>
                    </div>

                    <div class="tactical-box border-l-emerald-400">
                        <div class="flex items-center gap-2 text-xs font-extrabold text-emerald-300 uppercase tracking-wider mb-1.5">
                            <i data-lucide="zap" class="w-4 h-4 text-emerald-400"></i>
                            How They Do It (Mechanical Breakdown)
                        </div>
                        <p class="text-xs text-slate-100 leading-relaxed font-medium">
                            ${p.how_they_do_it || 'Leverages four-way mobility, high-level processing speed under pressure, and elite East-West deception.'}
                        </p>
                    </div>
                </div>

                <!-- 2-Col Main Section -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                    <!-- Left Col (5 cols): Biometrics & Radar Chart -->
                    <div class="lg:col-span-5 space-y-6">
                        <!-- Biometrics -->
                        <div class="glass-panel p-4 rounded-xl border border-slate-800">
                            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Verified Combine Measurables</h3>
                            <div class="grid grid-cols-2 gap-2.5 text-xs">
                                <div class="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">Height: <strong class="text-white">${b.height_display}</strong></div>
                                <div class="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">Weight: <strong class="text-white">${b.weight_lbs} lbs</strong></div>
                                <div class="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">Top Speed: <strong class="text-cyan-400 font-mono font-bold">${b.top_skating_speed_mph} MPH</strong></div>
                                <div class="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">Wingspan: <strong class="text-white">${b.wingspan_in || '--'}"</strong></div>
                            </div>
                        </div>

                        <!-- Percentile Rankings (High Contrast) -->
                        <div class="glass-panel p-4 rounded-xl border border-slate-800">
                            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                                <span>Percentile Rankings vs League</span>
                                <span class="text-[10px] text-cyan-400 font-mono font-bold">TOP QUARTILE</span>
                            </h3>
                            <div class="space-y-2 text-xs">
                                ${Object.entries(p.percentile_rankings || { "Controlled Entries": 94.2, "High-Danger Passing": 91.5, "Puck Protection": 88.0, "Shot Generation": 96.4, "Defensive Recovery": 82.0 }).map(([metric, pct]) => `
                                    <div>
                                        <div class="flex justify-between text-[11px] mb-0.5">
                                            <span class="text-slate-300 font-medium">${metric}</span>
                                            <span class="font-mono font-extrabold text-cyan-400">${pct}th %</span>
                                        </div>
                                        <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                                            <div class="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full" style="width: ${pct}%"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 20-80 Radar Chart -->
                        <div class="glass-panel p-4 rounded-xl border border-slate-800">
                            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">20-80 Pro Tool Scale Radar</h3>
                            <div class="h-[280px]">
                                <canvas id="modal-radar-canvas"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Right Col (7 cols): Scout Reports & Micro-Clips -->
                    <div class="lg:col-span-7 space-y-6">
                        <!-- Microstat Summary (High Contrast Numbers) -->
                        <div class="glass-panel p-4 rounded-xl border border-slate-800">
                            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Microstat Transition Rates</h3>
                            <div class="grid grid-cols-3 gap-2.5 text-center text-xs">
                                <div class="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                                    <div class="text-[10px] text-slate-400 uppercase">Entry Success</div>
                                    <div class="text-lg font-black font-mono text-cyan-400 mt-0.5">${t.controlled_entry_success_pct}%</div>
                                </div>
                                <div class="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                                    <div class="text-[10px] text-slate-400 uppercase">Exit Success</div>
                                    <div class="text-lg font-black font-mono text-emerald-400 mt-0.5">${t.controlled_exit_success_pct}%</div>
                                </div>
                                <div class="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                                    <div class="text-[10px] text-slate-400 uppercase">Battle Win %</div>
                                    <div class="text-lg font-black font-mono text-amber-400 mt-0.5">${t.puck_battle_win_pct}%</div>
                                </div>
                            </div>
                        </div>

                        <!-- Scout Voice Memos Section -->
                        <div class="glass-panel p-4 rounded-xl border border-sky-500/30 space-y-3">
                            <div class="flex items-center justify-between">
                                <h3 class="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                                    <i data-lucide="mic" class="w-4 h-4 text-rose-400"></i>
                                    Scout Voice Memos & Transcripts
                                </h3>
                                <button onclick="window.App.closeModal(); window.App.switchTab('scoutwire');" class="text-[10px] px-2 py-1 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 font-bold border border-sky-500/40">
                                    + Add Voice Note in ScoutWire
                                </button>
                            </div>
                            <div class="space-y-2">
                                ${(p.voice_memos || []).map(m => `
                                    <div class="p-3 bg-slate-950/90 rounded-xl border border-slate-800 flex flex-col space-y-1.5">
                                        <div class="flex items-center justify-between text-xs">
                                            <span class="font-bold text-white">${m.scout_name}</span>
                                            <span class="text-[10px] text-slate-400 font-mono">${m.date} (${m.duration_sec}s)</span>
                                        </div>
                                        <p class="text-xs text-slate-300 italic">"${m.transcript}"</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Video Bookmarks -->
                        <div class="glass-panel p-4 rounded-xl border border-slate-800">
                            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                                <i data-lucide="video" class="w-4 h-4 text-sky-400"></i>
                                Video Event Bookmarks & Micro-Clips
                            </h3>
                            <div class="space-y-2">
                                ${videoClipsHtml}
                            </div>
                        </div>

                        <!-- Detailed Scout Reports -->
                        <div>
                            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                                <i data-lucide="file-text" class="w-4 h-4 text-sky-400"></i>
                                Scout Evaluations (${p.scout_reports.length})
                            </h3>
                            <div class="space-y-3">
                                ${scoutReportsHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();

        // Render modal radar
        setTimeout(() => {
            const radar = new ScoutRadarChart('modal-radar-canvas');
            radar.render(p);
        }, 50);
    }

    async synthesizeAI(prospectId) {
        const container = document.getElementById('ai-synthesis-container');
        const textEl = document.getElementById('ai-synthesis-text');
        if (container && textEl) {
            container.classList.remove('hidden');
            textEl.innerHTML = '<span class="animate-pulse text-purple-300">Synthesizing multiple scout notes, combine metrics, and microstats into executive GM brief...</span>';
            
            try {
                const res = await API.synthesizeDossier(prospectId);
                textEl.innerHTML = `<strong>${res.consensus_tier} (${res.suggested_draft_range})</strong><br>${res.executive_summary}<br><br><span class="text-purple-300"><strong>NHL Projection:</strong> ${res.nhl_role_projection}</span>`;
            } catch (err) {
                textEl.innerText = 'Failed to generate AI synthesis.';
            }
        }
    }

    printDossier(prospectId) {
        window.print();
    }

    closeModal() {
        const modal = document.getElementById('global-modal');
        if (modal) modal.classList.add('hidden');
    }
}

window.App = new ApexScoutApp();
document.addEventListener('DOMContentLoaded', () => window.App.init());
