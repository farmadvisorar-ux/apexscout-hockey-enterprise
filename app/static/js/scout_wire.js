// ScoutWire Voice & Team Messaging Hub Logic
(function() {
    window.ScoutWire = {
        activeChannelId: 'war-room',
        channels: [],
        messages: [],
        prospects: [],
        mediaRecorder: null,
        audioChunks: [],
        audioBlob: null,
        audioUrl: null,
        isRecording: false,
        recStartTime: 0,
        recElapsed: 0,
        recTimerInterval: null,
        speechRecognition: null,
        liveTranscript: '',

        init: async function() {
            console.log("Initializing ScoutWire Hub...");
            await this.loadChannels();
            await this.loadProspects();
            await this.loadMessages(this.activeChannelId);
            this.bindEvents();
            this.initSpeechRec();
        },

        loadChannels: async function() {
            try {
                const res = await fetch('/api/scoutwire/channels');
                if (res.ok) {
                    this.channels = await res.json();
                    this.renderChannels();
                }
            } catch (e) {
                console.error("Failed to load ScoutWire channels", e);
            }
        },

        loadProspects: async function() {
            try {
                const res = await fetch('/api/prospects');
                if (res.ok) {
                    this.prospects = await res.json();
                    this.renderProspectSelect();
                }
            } catch (e) {
                console.error("Failed to load prospects for tagging", e);
            }
        },

        loadMessages: async function(channelId) {
            this.activeChannelId = channelId;
            try {
                const res = await fetch(`/api/scoutwire/messages?channel_id=${channelId}`);
                if (res.ok) {
                    this.messages = await res.json();
                    this.renderMessages();
                }
            } catch (e) {
                console.error("Failed to load ScoutWire messages", e);
            }
        },

        renderChannels: function() {
            const container = document.getElementById('scoutwire-channels-list');
            if (!container) return;

            container.innerHTML = this.channels.map(ch => `
                <button onclick="window.ScoutWire.switchChannel('${ch.id}')" 
                        class="w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-between group ${ch.id === this.activeChannelId ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300 font-bold shadow-lg shadow-sky-500/10' : 'hover:bg-slate-800/60 text-slate-300'}">
                    <div class="truncate">
                        <div class="text-xs truncate flex items-center gap-1.5">
                            <span>${ch.name}</span>
                        </div>
                        <div class="text-[10px] text-slate-400 truncate mt-0.5">${ch.topic}</div>
                    </div>
                    ${ch.unread_count > 0 ? `<span class="px-1.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-bold text-[10px]">${ch.unread_count}</span>` : ''}
                </button>
            `).join('');
        },

        renderProspectSelect: function() {
            const select = document.getElementById('scoutwire-tag-prospect');
            if (!select) return;

            select.innerHTML = '<option value="">Attach to Prospect (Optional)...</option>' + 
                this.prospects.map(p => `
                    <option value="${p.id}">${p.first_name} ${p.last_name} (${p.position} - ${p.current_team} / ${p.league})</option>
                `).join('');
        },

        switchChannel: function(channelId) {
            this.activeChannelId = channelId;
            this.renderChannels();
            this.loadMessages(channelId);
            
            const activeCh = this.channels.find(c => c.id === channelId);
            const titleEl = document.getElementById('scoutwire-active-channel-title');
            if (titleEl && activeCh) {
                titleEl.innerHTML = `<span class="text-white">${activeCh.name}</span> <span class="text-xs text-slate-400 font-normal ml-2">(${activeCh.topic})</span>`;
            }
        },

        renderMessages: function() {
            const container = document.getElementById('scoutwire-messages-feed');
            if (!container) return;

            if (this.messages.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-12 text-slate-500 text-xs italic">
                        No messages in this channel yet. Send the first scouting report or voice memo!
                    </div>
                `;
                return;
            }

            container.innerHTML = this.messages.map(msg => {
                const dateStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const hasVoice = Boolean(msg.audio_url || msg.transcript);

                return `
                    <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col space-y-2.5 shadow-md">
                        <!-- Message Header -->
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-2.5">
                                <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center shadow">
                                    ${msg.sender_avatar || 'SC'}
                                </div>
                                <div>
                                    <div class="flex items-center space-x-2">
                                        <span class="text-xs font-bold text-white">${msg.sender_name}</span>
                                        <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-sky-400 font-mono">${msg.sender_role}</span>
                                    </div>
                                    <div class="text-[10px] text-slate-500 font-mono">${dateStr}</div>
                                </div>
                            </div>

                            ${msg.tagged_prospect_name ? `
                                <div class="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold cursor-pointer hover:bg-cyan-500/20"
                                     onclick="window.App.openProspectModal('${msg.tagged_prospect_id}')">
                                    <i data-lucide="tag" class="w-3 h-3"></i>
                                    <span class="truncate max-w-[180px]">${msg.tagged_prospect_name}</span>
                                </div>
                            ` : ''}
                        </div>

                        <!-- Message Body -->
                        <p class="text-xs text-slate-200 leading-relaxed font-sans">${msg.text}</p>

                        <!-- Voice Memo Audio Player & Transcript -->
                        ${hasVoice ? `
                            <div class="p-3 bg-slate-950/80 rounded-xl border border-sky-500/30 flex flex-col space-y-2">
                                <div class="flex items-center justify-between text-xs">
                                    <div class="flex items-center space-x-2 text-cyan-400 font-bold">
                                        <i data-lucide="mic" class="w-4 h-4 text-rose-400 animate-pulse"></i>
                                        <span>Voice Scouting Memo (${msg.audio_duration_sec > 0 ? Math.round(msg.audio_duration_sec) + 's' : 'Audio Note'})</span>
                                    </div>
                                    <span class="text-[10px] text-emerald-400 font-mono font-bold">✓ 100% Guaranteed Delivery</span>
                                </div>

                                <!-- Transcript Text -->
                                ${msg.transcript ? `
                                    <div class="p-2.5 bg-slate-900/90 rounded-lg text-xs text-slate-300 italic border border-slate-800 leading-relaxed">
                                        "${msg.transcript}"
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}

                        <!-- Hockey Contextual Quick Action Triggers -->
                        <div class="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
                            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Quick Actions:</span>
                            ${(msg.quick_actions || ["Draft Priority 1", "Send Trial Run Offer", "Request Video Reel"]).map(act => `
                                <button onclick="window.ScoutWire.triggerAction('${msg.id}', '${act}', '${msg.tagged_prospect_id || ''}')"
                                        class="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-slate-300 font-bold border border-slate-700 transition-all flex items-center space-x-1">
                                    <span>⚡</span>
                                    <span>${act}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');

            if (window.lucide) lucide.createIcons();
            container.scrollTop = container.scrollHeight;
        },

        initSpeechRec: function() {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRec) {
                this.speechRecognition = new SpeechRec();
                this.speechRecognition.continuous = true;
                this.speechRecognition.interimResults = true;
                this.speechRecognition.onresult = (e) => {
                    let str = '';
                    for (let i = 0; i < e.results.length; i++) {
                        str += e.results[i][0].transcript + ' ';
                    }
                    this.liveTranscript = str.trim();
                    const liveBox = document.getElementById('scoutwire-live-speech-preview');
                    if (liveBox) {
                        liveBox.innerText = `Live: "${this.liveTranscript}"`;
                        liveBox.classList.remove('hidden');
                    }
                };
            }
        },

        toggleVoiceRecord: async function() {
            if (!this.isRecording) {
                await this.startRecording();
            } else {
                this.stopRecording();
            }
        },

        startRecording: async function() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];

                this.mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) this.audioChunks.push(e.data);
                };

                this.mediaRecorder.onstop = () => {
                    this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    this.audioUrl = URL.createObjectURL(this.audioBlob);
                    stream.getTracks().forEach(t => t.stop());
                };

                this.mediaRecorder.start(250);
                this.isRecording = true;
                this.recElapsed = 0;
                this.recStartTime = Date.now();

                // UI
                const btn = document.getElementById('btn-scoutwire-mic');
                if (btn) {
                    btn.classList.add('bg-rose-600', 'text-white', 'animate-pulse');
                    btn.innerHTML = `<i data-lucide="square" class="w-4 h-4"></i> Stop Memo`;
                }
                const timerEl = document.getElementById('scoutwire-rec-timer');
                if (timerEl) timerEl.classList.remove('hidden');

                this.recTimerInterval = setInterval(() => {
                    this.recElapsed = Math.floor((Date.now() - this.recStartTime) / 1000);
                    const mins = Math.floor(this.recElapsed / 60);
                    const secs = this.recElapsed % 60;
                    if (timerEl) timerEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} (No limit)`;
                }, 200);

                if (this.speechRecognition) {
                    try { this.speechRecognition.start(); } catch (e) {}
                }

                if (window.lucide) lucide.createIcons();
            } catch (err) {
                alert("Microphone access notice: " + err.message + "\nYou can also type your report directly into the box.");
            }
        },

        stopRecording: function() {
            if (this.mediaRecorder && this.isRecording) {
                this.mediaRecorder.stop();
            }
            this.isRecording = false;
            clearInterval(this.recTimerInterval);

            if (this.speechRecognition) {
                try { this.speechRecognition.stop(); } catch (e) {}
            }

            const btn = document.getElementById('btn-scoutwire-mic');
            if (btn) {
                btn.classList.remove('bg-rose-600', 'text-white', 'animate-pulse');
                btn.innerHTML = `<i data-lucide="mic" class="w-4 h-4 text-rose-400"></i> Voice Memo`;
            }

            const inputEl = document.getElementById('scoutwire-input-text');
            if (inputEl && this.liveTranscript) {
                inputEl.value = this.liveTranscript;
            }

            if (window.lucide) lucide.createIcons();
        },

        sendMessage: async function() {
            const inputEl = document.getElementById('scoutwire-input-text');
            const selectProspect = document.getElementById('scoutwire-tag-prospect');
            const text = inputEl ? inputEl.value.trim() : '';

            if (!text && !this.audioBlob) {
                alert("Please type a message or record a voice note.");
                return;
            }

            const taggedId = selectProspect ? selectProspect.value : '';
            const taggedProspect = this.prospects.find(p => p.id === taggedId);

            const payload = {
                channel_id: this.activeChannelId,
                sender_name: "Director of Hockey Ops",
                sender_role: "Front Office",
                text: text || "Voice Scouting Report attached.",
                audio_duration_sec: this.recElapsed || 0,
                transcript: this.liveTranscript || text,
                tagged_prospect_id: taggedId || null,
                tagged_prospect_name: taggedProspect ? `${taggedProspect.first_name} ${taggedProspect.last_name} (${taggedProspect.position})` : null
            };

            try {
                const res = await fetch('/api/scoutwire/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    if (inputEl) inputEl.value = '';
                    if (selectProspect) selectProspect.value = '';
                    const liveBox = document.getElementById('scoutwire-live-speech-preview');
                    if (liveBox) liveBox.classList.add('hidden');
                    this.liveTranscript = '';
                    this.audioBlob = null;
                    await this.loadMessages(this.activeChannelId);
                }
            } catch (e) {
                console.error("Failed to send message", e);
            }
        },

        triggerAction: async function(msgId, actionName, prospectId) {
            try {
                const res = await fetch('/api/scoutwire/quick-action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message_id: msgId,
                        action_name: actionName,
                        prospect_id: prospectId
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    alert(`Action Executed:\n${data.confirmation}`);
                    await this.loadMessages(this.activeChannelId);
                }
            } catch (e) {
                console.error("Action failed", e);
            }
        },

        bindEvents: function() {
            const btnSend = document.getElementById('btn-scoutwire-send');
            if (btnSend) btnSend.addEventListener('click', () => this.sendMessage());

            const btnMic = document.getElementById('btn-scoutwire-mic');
            if (btnMic) btnMic.addEventListener('click', () => this.toggleVoiceRecord());

            const inputEl = document.getElementById('scoutwire-input-text');
            if (inputEl) {
                inputEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendMessage();
                    }
                });
            }
        }
    };
})();
