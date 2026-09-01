// ApexScout In-Rink Live Scout Quick-Tagging & RinkMic Voice Deck
class LiveScoutManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.prospects = [];
        this.selectedProspectId = null;
        this.recentEvents = [];
        this.currentPeriod = 1;
    }

    async init() {
        if (!this.container) return;
        try {
            const [prospects, events] = await Promise.all([
                API.getProspects(),
                API.getLiveEvents()
            ]);
            this.prospects = prospects;
            if (this.prospects.length > 0 && !this.selectedProspectId) {
                this.selectedProspectId = this.prospects[0].id;
            }
            this.recentEvents = events;
            this.render();
        } catch (err) {
            console.error('Failed to initialize live scout session:', err);
        }
    }

    render() {
        if (!this.container) return;

        const currentProspect = this.prospects.find(p => p.id === this.selectedProspectId) || this.prospects[0];

        let prospectOptions = this.prospects.map(p => `
            <option value="${p.id}" ${p.id === this.selectedProspectId ? 'selected' : ''}>
                #${p.consensus_rank} ${p.first_name} ${p.last_name} (${p.position}, ${p.current_team})
            </option>
        `).join('');

        let eventStreamHtml = this.recentEvents.slice(0, 10).map(e => {
            const p = this.prospects.find(pr => pr.id === e.prospect_id);
            const pName = p ? `${p.first_name} ${p.last_name}` : 'Prospect';
            const isPos = !e.event_type.includes('Turnover') && !e.event_type.includes('Loss') && !e.event_type.includes('Blown');

            return `
                <div class="glass-card rounded-lg p-3 border-l-4 ${isPos ? 'border-emerald-500' : 'border-rose-500'} flex items-start justify-between">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-white">${pName}</span>
                            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">P${e.period} ${e.game_clock}</span>
                            <span class="text-xs font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}">${e.event_type}</span>
                        </div>
                        ${e.notes ? `<div class="text-xs text-slate-300 mt-1 italic">"${e.notes}"</div>` : ''}
                    </div>
                    <div class="text-right text-[10px] text-slate-500 font-mono">${e.timestamp}</div>
                </div>
            `;
        }).join('') || `<div class="text-xs text-slate-500 italic p-4 text-center">No shifts logged yet in this session.</div>`;

        this.container.innerHTML = `
            <!-- Top Header & RinkMic Voice Deck -->
            <div class="glass-panel rounded-2xl p-6 mb-6 border border-sky-500/30 bg-gradient-to-r from-slate-900 via-[#0d1829] to-slate-900 shadow-2xl">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div class="flex items-center gap-5">
                        <button id="rinkmic-record-btn" onclick="window.RinkMic.toggleRecording()" 
                                class="w-14 h-14 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all">
                            <i data-lucide="mic" class="w-6 h-6"></i>
                        </button>
                        <div>
                            <div class="flex items-center gap-2.5" id="rinkmic-status-badge">
                                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                <span class="text-xs font-bold text-slate-300 font-mono">RINKMIC READY ? AIRPODS / HANDS-FREE ACTIVE</span>
                            </div>
                            <h2 class="text-lg font-bold text-white mt-1 flex items-center gap-2">
                                RinkMic? In-Arena Voice Dictation & Shift Auto-Tagger
                            </h2>
                            <p class="text-xs text-slate-400 mt-0.5">
                                Speak observations hands-free. NLP extracts the player, period, game clock, tactical event, and 20-80 scout traits.
                            </p>
                        </div>
                    </div>

                    <!-- Actions & Preset Prompts -->
                    <div class="flex flex-wrap items-center gap-2.5">
                        <button onclick="window.RinkMic.simulateQuickPrompt(0)" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-sky-500/20 text-sky-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5">
                            <i data-lucide="play" class="w-3.5 h-3.5"></i> Test: McKenna Breakout
                        </button>
                        <button onclick="window.RinkMic.simulateQuickPrompt(1)" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-sky-500/20 text-sky-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5">
                            <i data-lucide="play" class="w-3.5 h-3.5"></i> Test: Verhoeff Gap
                        </button>
                        <button onclick="window.RinkMic.compileToOfficialReport()" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all">
                            <i data-lucide="file-check" class="w-4 h-4"></i> Compile Scout Report
                        </button>
                    </div>
                </div>

                <!-- Recent Voice Memos Tray -->
                <div class="mt-5 pt-4 border-t border-slate-800">
                    <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                        <i data-lucide="audio-lines" class="w-3.5 h-3.5 text-sky-400"></i>
                        Parsed Voice Stream & Real-Time Extracted Entities
                    </div>
                    <div id="rinkmic-memos-list" class="space-y-2 max-h-[160px] overflow-y-auto">
                        <div class="text-xs text-slate-500 italic p-2">No voice observations dictated yet. Tap the microphone or sample test prompt above.</div>
                    </div>
                </div>
            </div>

            <!-- Manual Pad + Live Stream Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <!-- Left: Quick Tagging Pad (7 cols) -->
                <div class="lg:col-span-7 glass-panel rounded-xl p-5 space-y-5">
                    <!-- Prospect Selector -->
                    <div>
                        <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Target Prospect Under Evaluation</label>
                        <select onchange="window.LiveScout.setProspect(this.value)" class="w-full bg-slate-900 border border-slate-700 text-white font-bold text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400">
                            ${prospectOptions}
                        </select>
                    </div>

                    <!-- Period & Game Clock -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 mb-1.5">Period</label>
                            <div class="flex rounded-lg overflow-hidden border border-slate-700">
                                <button type="button" onclick="window.LiveScout.setPeriod(1)" id="period-btn-1" class="flex-1 py-2 text-xs font-bold ${this.currentPeriod === 1 ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">1st</button>
                                <button type="button" onclick="window.LiveScout.setPeriod(2)" id="period-btn-2" class="flex-1 py-2 text-xs font-bold ${this.currentPeriod === 2 ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">2nd</button>
                                <button type="button" onclick="window.LiveScout.setPeriod(3)" id="period-btn-3" class="flex-1 py-2 text-xs font-bold ${this.currentPeriod === 3 ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">3rd</button>
                                <button type="button" onclick="window.LiveScout.setPeriod(4)" id="period-btn-4" class="flex-1 py-2 text-xs font-bold ${this.currentPeriod === 4 ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">OT</button>
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 mb-1.5">Game Clock</label>
                            <input type="text" id="live-game-clock" value="14:20" class="w-full bg-slate-900 border border-slate-700 text-white font-mono text-center font-bold text-sm rounded-lg py-2 focus:outline-none focus:border-sky-400">
                        </div>
                    </div>

                    <!-- Event Grid -->
                    <div>
                        <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">One-Tap Micro-Event Tagging</label>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <button onclick="window.LiveScout.logEvent('Controlled Entry')" class="p-3.5 rounded-xl bg-slate-800/90 hover:bg-emerald-600/30 text-white border border-slate-700 hover:border-emerald-400 text-xs font-bold text-center transition-all active:scale-95 flex flex-col items-center gap-1.5 shadow-sm">
                                <i data-lucide="chevrons-right" class="w-4 h-4 text-emerald-400"></i>
                                Controlled Entry
                            </button>
                            <button onclick="window.LiveScout.logEvent('Entry Denial')" class="p-3.5 rounded-xl bg-slate-800/90 hover:bg-emerald-600/30 text-white border border-slate-700 hover:border-emerald-400 text-xs font-bold text-center transition-all active:scale-95 flex flex-col items-center gap-1.5 shadow-sm">
                                <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i>
                                Entry Denial
                            </button>
                            <button onclick="window.LiveScout.logEvent('Puck Battle Win')" class="p-3.5 rounded-xl bg-slate-800/90 hover:bg-emerald-600/30 text-white border border-slate-700 hover:border-emerald-400 text-xs font-bold text-center transition-all active:scale-95 flex flex-col items-center gap-1.5 shadow-sm">
                                <i data-lucide="swords" class="w-4 h-4 text-emerald-400"></i>
                                Puck Battle Win
                            </button>
                            <button onclick="window.LiveScout.logEvent('High Danger Pass')" class="p-3.5 rounded-xl bg-slate-800/90 hover:bg-sky-600/30 text-white border border-slate-700 hover:border-sky-400 text-xs font-bold text-center transition-all active:scale-95 flex flex-col items-center gap-1.5 shadow-sm">
                                <i data-lucide="send" class="w-4 h-4 text-sky-400"></i>
                                High Danger Pass
                            </button>
                            <button onclick="window.LiveScout.logEvent('Slot Shot On Goal')" class="p-3.5 rounded-xl bg-slate-800/90 hover:bg-sky-600/30 text-white border border-slate-700 hover:border-sky-400 text-xs font-bold text-center transition-all active:scale-95 flex flex-col items-center gap-1.5 shadow-sm">
                                <i data-lucide="crosshair" class="w-4 h-4 text-sky-400"></i>
                                Slot Shot
                            </button>
                            <button onclick="window.LiveScout.logEvent('Goal Scored!')" class="p-3.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/50 text-xs font-bold text-center transition-all active:scale-95 flex flex-col items-center gap-1.5 shadow-sm">
                                <i data-lucide="flame" class="w-4 h-4 text-emerald-400"></i>
                                Goal Scored!
                            </button>
                            <button onclick="window.LiveScout.logEvent('Turnover Under Pressure')" class="p-3.5 rounded-xl bg-slate-800/90 hover:bg-rose-600/30 text-white border border-slate-700 hover:border-rose-400 text-xs font-bold text-center transition-all active:scale-95 flex flex-col items-center gap-1.5 shadow-sm">
                                <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-400"></i>
                                D-Zone Turnover
                            </button>
                            <button onclick="window.LiveScout.logEvent('Blown Gap / Coverage')" class="p-3.5 rounded-xl bg-slate-800/90 hover:bg-rose-600/30 text-white border border-slate-700 hover:border-rose-400 text-xs font-bold text-center transition-all active:scale-95 flex flex-col items-center gap-1.5 shadow-sm">
                                <i data-lucide="slash" class="w-4 h-4 text-rose-400"></i>
                                Lost Gap
                            </button>
                        </div>
                    </div>

                    <!-- Quick Scout Notes -->
                    <div>
                        <label class="block text-xs font-semibold text-slate-400 mb-1.5">Scout Typed Note (Optional)</label>
                        <div class="flex gap-2">
                            <input type="text" id="live-scout-notes" placeholder="e.g. Clean edge deception shifts defender hips..." class="flex-1 bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400">
                            <button onclick="window.LiveScout.logCustomNote()" class="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition-all">
                                Log Note
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Right: Live Feed of Logged Shifts (5 cols) -->
                <div class="lg:col-span-5 glass-panel rounded-xl p-5 flex flex-col">
                    <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                        <h3 class="text-sm font-bold text-white flex items-center gap-2">
                            <i data-lucide="list-ordered" class="w-4 h-4 text-sky-400"></i>
                            Live Shift Log Stream
                        </h3>
                        <span class="text-xs font-mono text-slate-400">${this.recentEvents.length} Events</span>
                    </div>

                    <div class="space-y-2.5 flex-1 overflow-y-auto max-h-[480px] pr-1" id="live-events-stream">
                        ${eventStreamHtml}
                    </div>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
    }

    setProspect(prospectId) {
        this.selectedProspectId = prospectId;
    }

    setPeriod(pNum) {
        this.currentPeriod = pNum;
        for (let i = 1; i <= 4; i++) {
            const btn = document.getElementById(`period-btn-${i}`);
            if (btn) {
                if (i === pNum) {
                    btn.className = 'flex-1 py-2 text-xs font-bold bg-sky-600 text-white';
                } else {
                    btn.className = 'flex-1 py-2 text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700';
                }
            }
        }
    }

    async logEvent(eventType) {
        const clock = document.getElementById('live-game-clock')?.value || '14:20';
        const noteInput = document.getElementById('live-scout-notes');
        const notes = noteInput?.value || '';

        const eventData = {
            id: `evt-${Date.now()}`,
            prospect_id: this.selectedProspectId || 'p-01',
            period: this.currentPeriod || 1,
            game_clock: clock,
            event_type: eventType,
            notes: notes || null,
            rating: 4,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        try {
            const created = await API.addLiveEvent(eventData);
            this.recentEvents.unshift(created);
            if (noteInput) noteInput.value = '';
            this.render();
        } catch (err) {
            console.error('Failed to log shift event:', err);
        }
    }

    async logCustomNote() {
        const noteInput = document.getElementById('live-scout-notes');
        if (!noteInput || !noteInput.value.trim()) return;
        await this.logEvent('Observation');
    }
}

window.LiveScoutManager = LiveScoutManager;
