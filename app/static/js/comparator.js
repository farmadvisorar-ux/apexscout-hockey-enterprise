// ApexScout "Time-Machine" Historical Benchmark & Head-to-Head Comparator
class TimeMachineComparator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.prospects = [];
        this.historical = [];
        this.playerAId = 'p-01'; // Default: Gavin McKenna
        this.playerBId = 'hist-bedard'; // Default: Connor Bedard (Draft Year)
        this.comparison = null;
        this.radarChart = null;
    }

    async init() {
        if (!this.container) return;
        try {
            const [prospects, historical] = await Promise.all([
                fetch('/api/prospects').then(r => r.json()),
                fetch('/api/benchmarks/historical').then(r => r.json())
            ]);
            this.prospects = prospects;
            this.historical = historical;

            await this.loadComparison();
            this.render();
        } catch (err) {
            console.error('Failed to init comparator:', err);
        }
    }

    async loadComparison() {
        try {
            const res = await fetch('/api/benchmarks/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_a_id: this.playerAId,
                    player_b_id: this.playerBId
                })
            });
            if (res.ok) {
                this.comparison = await res.json();
            }
        } catch (err) {
            console.error('Compare fetch error:', err);
        }
    }

    render() {
        if (!this.container || !this.comparison) return;

        const c = this.comparison;
        const pa = c.player_a;
        const pb = c.player_b;
        const t = c.trajectory;

        // Player A Options (Current Prospects)
        let optionsA = this.prospects.map(p => `
            <option value="${p.id}" ${p.id === this.playerAId ? 'selected' : ''}>
                #${p.consensus_rank} ${p.first_name} ${p.last_name} (${p.position}, ${p.current_team})
            </option>
        `).join('');

        // Player B Options (Historical Superstars + Current Prospects)
        let optionsB = `
            <optgroup label="? Historical Draft-Year Baselines (Age 17-18)">
                ${this.historical.map(h => `
                    <option value="${h.id}" ${h.id === this.playerBId ? 'selected' : ''}>
                        ${h.name} (${h.draft_year} ${h.draft_league})
                    </option>
                `).join('')}
            </optgroup>
            <optgroup label="?? 2026/2027 Draft Class Peers">
                ${this.prospects.map(p => `
                    <option value="${p.id}" ${p.id === this.playerBId ? 'selected' : ''}>
                        ${p.first_name} ${p.last_name} (${p.position})
                    </option>
                `).join('')}
            </optgroup>
        `;

        this.container.innerHTML = `
            <!-- Top Controls & Selector Ribbon -->
            <div class="glass-panel rounded-2xl p-6 mb-6 border border-sky-500/30 bg-gradient-to-r from-[#0a1120] via-[#0f1d36] to-[#0a1120] shadow-2xl">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                            <span class="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">HISTORICAL COHORT BENCHMARK & COMPARATOR</span>
                        </div>
                        <h2 class="text-2xl font-extrabold text-white mt-1 flex items-center gap-2">
                            "Time-Machine" Draft-Year Benchmark & Tale of the Tape
                        </h2>
                        <p class="text-xs text-slate-400 mt-0.5">
                            Benchmark current 17-year-old prospects against landmark draft-year seasons at the exact same age stage.
                        </p>
                    </div>

                    <!-- Similarity Badge -->
                    <div class="flex items-center gap-3 bg-slate-950/80 border border-slate-700/80 rounded-2xl px-5 py-3 shadow-inner">
                        <div class="text-right">
                            <div class="text-[10px] text-slate-400 font-mono uppercase">Profile Similarity Match</div>
                            <div class="text-xs text-slate-300 font-semibold">${pa.name} vs ${pb.name}</div>
                        </div>
                        <div class="text-2xl font-mono font-extrabold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-xl">
                            ${c.similarity_score_pct}%
                        </div>
                    </div>
                </div>

                <!-- Dual Selectors -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-5 border-t border-slate-800">
                    <!-- Left: Player A -->
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <label class="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span class="w-3 h-3 rounded-full bg-sky-400 inline-block"></span>
                                Primary Prospect (Cyan Profile)
                            </label>
                            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">Grade: ${pa.overall_grade}/80</span>
                        </div>
                        <select onchange="window.Comparator.setPlayerA(this.value)" class="w-full bg-slate-900 border border-sky-500/40 text-white font-bold text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400">
                            ${optionsA}
                        </select>
                    </div>

                    <!-- Right: Player B -->
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <label class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span class="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                                Comparison Benchmark (Amber Profile)
                            </label>
                            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Grade: ${pb.overall_grade}/80</span>
                        </div>
                        <select onchange="window.Comparator.setPlayerB(this.value)" class="w-full bg-slate-900 border border-amber-500/40 text-white font-bold text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-400">
                            ${optionsB}
                        </select>
                    </div>
                </div>
            </div>

            <!-- Main Comparison Grid: Spider Radar (Left) + Tale-of-the-Tape & Trajectory (Right) -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <!-- Left: Dual-Overlaid Spider Radar (5 cols) -->
                <div class="lg:col-span-5 space-y-6">
                    <div class="glass-panel rounded-xl p-5 border border-slate-800">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300">20-80 Pro Tool Dual Overlay</h3>
                            <div class="flex items-center gap-3 text-[11px] font-mono font-bold">
                                <span class="text-sky-400 flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-sky-400"></span> ${pa.name.split(' ')[0]}</span>
                                <span class="text-amber-400 flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span> ${pb.name.split(' ')[0]}</span>
                            </div>
                        </div>
                        <div class="h-[340px]">
                            <canvas id="comparator-radar-canvas"></canvas>
                        </div>
                    </div>

                    <!-- AI Career Trajectory Forecast Card -->
                    <div class="glass-panel rounded-xl p-5 border border-purple-500/40 bg-purple-950/20 space-y-3">
                        <div class="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                            <i data-lucide="sparkles" class="w-4 h-4 text-purple-400"></i>
                            AI Career Trajectory & NHL Outcome Forecaster
                        </div>
                        <div class="space-y-2 text-xs">
                            <div class="bg-slate-900/80 p-2.5 rounded-lg border border-purple-500/20">
                                <div class="text-[10px] text-emerald-400 font-bold uppercase">90th Percentile Ceiling:</div>
                                <div class="text-white font-medium mt-0.5">${t.ceiling_projection}</div>
                            </div>
                            <div class="bg-slate-900/80 p-2.5 rounded-lg border border-purple-500/20">
                                <div class="text-[10px] text-sky-400 font-bold uppercase">50th Percentile Median:</div>
                                <div class="text-white font-medium mt-0.5">${t.median_projection}</div>
                            </div>
                            <div class="bg-slate-900/80 p-2.5 rounded-lg border border-purple-500/20">
                                <div class="text-[10px] text-slate-400 font-bold uppercase">Floor Scenario:</div>
                                <div class="text-slate-300 font-medium mt-0.5">${t.floor_projection}</div>
                            </div>
                        </div>
                        <p class="text-xs text-slate-200 italic leading-relaxed pt-2 border-t border-purple-500/30">
                            "${t.trajectory_verdict}"
                        </p>
                    </div>
                </div>

                <!-- Right: Tale-of-the-Tape Comparison Matrix (7 cols) -->
                <div class="lg:col-span-7 space-y-6">
                    <div class="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
                        <h3 class="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                            <i data-lucide="swords" class="w-4 h-4 text-sky-400"></i>
                            Side-by-Side Tale of the Tape (Draft-Year Stage)
                        </h3>

                        <!-- Comparison Table -->
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs">
                                <thead>
                                    <tr class="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                                        <th class="py-2.5 text-left font-bold text-sky-400">${pa.name}</th>
                                        <th class="py-2.5 text-center font-semibold">METRIC CATEGORY</th>
                                        <th class="py-2.5 text-right font-bold text-amber-400">${pb.name}</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-800/60 font-mono">
                                    <tr>
                                        <td class="py-2.5 text-left text-white font-bold">${pa.overall_grade}/80</td>
                                        <td class="py-2.5 text-center text-slate-400 font-sans">Overall Scout Grade</td>
                                        <td class="py-2.5 text-right text-white font-bold">${pb.overall_grade}/80</td>
                                    </tr>
                                    <tr>
                                        <td class="py-2.5 text-left text-white font-bold">${pa.ppg} PPG</td>
                                        <td class="py-2.5 text-center text-slate-400 font-sans">Points Per Game (Draft Season)</td>
                                        <td class="py-2.5 text-right text-white font-bold">${pb.ppg} PPG</td>
                                    </tr>
                                    <tr>
                                        <td class="py-2.5 text-left text-white">${pa.ev_pts_60}</td>
                                        <td class="py-2.5 text-center text-slate-400 font-sans">Even-Strength Pts/60</td>
                                        <td class="py-2.5 text-right text-white">${pb.ev_pts_60}</td>
                                    </tr>
                                    <tr>
                                        <td class="py-2.5 text-left text-emerald-400 font-bold">${pa.controlled_entry_pct}%</td>
                                        <td class="py-2.5 text-center text-slate-400 font-sans">Controlled Entry Rate %</td>
                                        <td class="py-2.5 text-right text-emerald-400 font-bold">${pb.controlled_entry_pct}%</td>
                                    </tr>
                                    <tr>
                                        <td class="py-2.5 text-left text-white">${pa.puck_battle_win_pct}%</td>
                                        <td class="py-2.5 text-center text-slate-400 font-sans">Puck Battle Win %</td>
                                        <td class="py-2.5 text-right text-white">${pb.puck_battle_win_pct}%</td>
                                    </tr>
                                    <tr>
                                        <td class="py-2.5 text-left text-slate-300 font-sans">${pa.league}</td>
                                        <td class="py-2.5 text-center text-slate-400 font-sans">Draft League</td>
                                        <td class="py-2.5 text-right text-slate-300 font-sans">${pb.league}</td>
                                    </tr>
                                    <tr>
                                        <td class="py-2.5 text-left text-slate-300 font-sans">${pa.biometrics}</td>
                                        <td class="py-2.5 text-center text-slate-400 font-sans">Measurables</td>
                                        <td class="py-2.5 text-right text-slate-300 font-sans">${pb.biometrics}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- 20-80 Tool Advantage Badges Grid -->
                        <div class="pt-4 border-t border-slate-800">
                            <span class="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">Head-to-Head Tool Advantage Breakdown</span>
                            <div class="grid grid-cols-3 gap-2">
                                ${Object.entries(c.tool_advantages).map(([tool, winner]) => {
                                    const isA = winner === pa.name;
                                    const isB = winner === pb.name;
                                    return `
                                        <div class="p-2 rounded-lg bg-slate-900/80 border ${isA ? 'border-sky-500/40 text-sky-300' : isB ? 'border-amber-500/40 text-amber-300' : 'border-slate-800 text-slate-400'} text-center">
                                            <div class="text-[10px] uppercase font-sans text-slate-400">${tool.replace('_', ' ')}</div>
                                            <div class="text-xs font-bold mt-0.5 truncate">${winner}</div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <!-- Executive Comparison Summary -->
                        <div class="glass-card p-4 rounded-xl border border-slate-700 mt-3">
                            <div class="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">Executive Matchup Synthesis</div>
                            <p class="text-xs text-slate-300 leading-relaxed">${c.ai_comparison_summary}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        // Render dual overlaid radar
        setTimeout(() => this.renderRadar(pa, pb), 50);
    }

    renderRadar(pa, pb) {
        const canvas = document.getElementById('comparator-radar-canvas');
        if (!canvas) return;

        if (this.radarChart) {
            this.radarChart.destroy();
        }

        const labels = ['Skating Speed', 'Agility/Edges', 'Puck Skills', 'Vision', 'Hockey IQ', 'Shot Gen', 'Compete', 'Physicality', 'Defense'];
        const ga = pa.grades;
        const gb = pb.grades;

        const dataA = [ga.skating_speed, ga.skating_agility, ga.puck_skills, ga.passing_vision, ga.hockey_iq, ga.shot_generation, ga.compete_level, ga.physicality, ga.defensive_impact];
        const dataB = [gb.skating_speed, gb.skating_agility, gb.puck_skills, gb.passing_vision, gb.hockey_iq, gb.shot_generation, gb.compete_level, gb.physicality, gb.defensive_impact];

        const ctx = canvas.getContext('2d');
        this.radarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: pa.name,
                        data: dataA,
                        backgroundColor: 'rgba(56, 189, 248, 0.25)',
                        borderColor: '#38bdf8',
                        pointBackgroundColor: '#38bdf8',
                        pointBorderColor: '#ffffff',
                        borderWidth: 2.5
                    },
                    {
                        label: pb.name,
                        data: dataB,
                        backgroundColor: 'rgba(251, 191, 36, 0.25)',
                        borderColor: '#fbbf24',
                        pointBackgroundColor: '#fbbf24',
                        pointBorderColor: '#ffffff',
                        borderWidth: 2.5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
                        grid: { color: 'rgba(255, 255, 255, 0.08)' },
                        pointLabels: {
                            color: '#94a3b8',
                            font: { size: 10, weight: 'bold' }
                        },
                        ticks: {
                            display: false,
                            stepSize: 10,
                            min: 20,
                            max: 80
                        },
                        min: 20,
                        max: 80
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    async setPlayerA(id) {
        this.playerAId = id;
        await this.loadComparison();
        this.render();
    }

    async setPlayerB(id) {
        this.playerBId = id;
        await this.loadComparison();
        this.render();
    }
}

window.TimeMachineComparator = TimeMachineComparator;
