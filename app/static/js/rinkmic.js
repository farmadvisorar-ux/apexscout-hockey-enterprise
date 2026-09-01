// ApexScout RinkMic - Voice-to-Dossier AI & Real-Time Shift Auto-Tagger
class RinkMicManager {
    constructor() {
        this.isRecording = false;
        this.recognition = null;
        this.recordedMemos = [];
        this.initSpeechRecognition();
    }

    initSpeechRecognition() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
            this.recognition = new SpeechRec();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = async (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('RinkMic Transcribed:', transcript);
                await this.processVoiceTranscript(transcript);
                this.setRecordingState(false);
            };

            this.recognition.onerror = (event) => {
                console.warn('RinkMic Speech error:', event.error);
                this.setRecordingState(false);
            };

            this.recognition.onend = () => {
                this.setRecordingState(false);
            };
        }
    }

    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        if (!this.recognition) {
            // Fallback if browser speech recognition is not supported or permitted
            this.simulateQuickPrompt(0);
            return;
        }

        try {
            this.recognition.start();
            this.setRecordingState(true);
        } catch (e) {
            console.error('Recognition start error:', e);
            this.simulateQuickPrompt(0);
        }
    }

    stopRecording() {
        if (this.recognition) {
            try { this.recognition.stop(); } catch(e){}
        }
        this.setRecordingState(false);
    }

    setRecordingState(recording) {
        this.isRecording = recording;
        const btn = document.getElementById('rinkmic-record-btn');
        const statusEl = document.getElementById('rinkmic-status-badge');
        const waveEl = document.getElementById('rinkmic-waveform');

        if (btn) {
            if (recording) {
                btn.className = 'w-14 h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 animate-pulse transition-all scale-105';
            } else {
                btn.className = 'w-14 h-14 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all';
            }
        }

        if (statusEl) {
            if (recording) {
                statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span><span class="text-rose-400 font-bold text-xs font-mono">LISTENING (SPEAK INTO MIC/AIRPODS)...</span>';
            } else {
                statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500"></span><span class="text-slate-400 font-semibold text-xs font-mono">RINKMIC READY ? HANDS-FREE ACTIVE</span>';
            }
        }

        if (waveEl) {
            waveEl.classList.toggle('opacity-100', recording);
            waveEl.classList.toggle('opacity-30', !recording);
        }
    }

    async processVoiceTranscript(transcript) {
        if (!transcript || !transcript.trim()) return;

        const liveClock = document.getElementById('live-game-clock')?.value || '14:20';
        const currentPeriod = window.LiveScout?.currentPeriod || 2;

        try {
            const res = await fetch('/api/rinkmic/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript: transcript,
                    current_period: currentPeriod,
                    current_clock: liveClock
                })
            });

            if (!res.ok) throw new Error('Parse error');
            const parsed = await res.json();

            this.recordedMemos.unshift({
                ...parsed,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            });

            // Automatically log to Live Scout Events stream
            if (window.LiveScout) {
                await window.LiveScout.logEvent(parsed.primary_event);
            }

            this.renderMemosList();
        } catch (err) {
            console.error('Failed to parse voice transcript:', err);
        }
    }

    simulateQuickPrompt(index) {
        const presets = [
            "McKenna picked up the rim under heavy forecheck pressure at 14:20 of the 2nd, turned his hips with elite edge work and threaded a tape-to-tape seam pass to the backdoor.",
            "Verhoeff closed the gap at the blue line at 09:30 of the 1st period, separated the forward with a clean body check and launched a breakout rim pass.",
            "Hagens beat the defenseman wide on the rush at 04:15 in the 3rd, delayed on the half wall and snapped a high danger slot shot top corner.",
            "Desnoyers won a crucial defensive zone faceoff on the PK at 18:40, blocked the point shot and cleared 200 feet under pressure.",
            "Schaefer executed an end-to-end rush at 07:15, backed off three defenders singlehandedly with elite four-way mobility."
        ];

        const text = presets[index % presets.length];
        this.processVoiceTranscript(text);
    }

    renderMemosList() {
        const listEl = document.getElementById('rinkmic-memos-list');
        if (!listEl) return;

        if (this.recordedMemos.length === 0) {
            listEl.innerHTML = '<div class="text-xs text-slate-500 italic p-3 text-center">No voice memos recorded yet. Tap the microphone or use a quick prompt.</div>';
            return;
        }

        let html = '';
        this.recordedMemos.forEach((m, idx) => {
            html += `
                <div class="glass-card p-3 rounded-xl border border-slate-700/80 space-y-2">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-sky-400">#${idx + 1} ${m.prospect_name}</span>
                            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">P${m.period} ${m.game_clock}</span>
                            <span class="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">${m.primary_event}</span>
                        </div>
                        <span class="text-[10px] font-mono text-slate-500">${m.timestamp}</span>
                    </div>
                    <p class="text-xs text-slate-200 italic leading-relaxed">"${m.original_transcript}"</p>
                    ${m.strengths && m.strengths.length > 0 ? `
                        <div class="text-[11px] text-sky-300 flex items-center gap-1">
                            <i data-lucide="sparkles" class="w-3 h-3 text-sky-400"></i>
                            <span>Extracted: ${m.strengths.join(', ')}</span>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        listEl.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
    }

    async compileToOfficialReport() {
        if (this.recordedMemos.length === 0) {
            alert('Please record at least one voice observation first.');
            return;
        }

        const targetProspectId = this.recordedMemos[0].prospect_id || window.LiveScout?.selectedProspectId || 'p-01';
        const memos = this.recordedMemos.map(m => m.original_transcript);

        try {
            const res = await fetch('/api/rinkmic/compile-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prospect_id: targetProspectId,
                    scout_name: 'Lead Arena Scout',
                    voice_memos: memos
                })
            });

            if (!res.ok) throw new Error('Failed to compile report');
            const report = await res.json();

            alert(`Official Scout Game Report compiled and posted to ${this.recordedMemos[0].prospect_name}'s Dossier!`);
            window.App.openProspectModal(targetProspectId);
        } catch (err) {
            console.error('Failed to compile report:', err);
            alert('Failed to compile report.');
        }
    }
}

window.RinkMic = new RinkMicManager();
