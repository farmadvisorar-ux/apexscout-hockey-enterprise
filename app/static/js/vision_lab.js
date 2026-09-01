// ApexScout VisionLab Optical Tracking & Biomechanical Stride Analyzer
class VisionLabManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.prospects = [];
        this.selectedProspectId = 'p-01';
        this.currentReport = null;
        this.benchmarks = null;
        this.mode = 'stride'; // 'stride', 'edge', 'shot'
        this.animFrameId = null;
        this.simAngle = 44.0;
        this.simCadence = 3.35;
        this.simEdge = 54.5;
        this.simResults = null;
    }

    async init() {
        if (!this.container) return;
        try {
            await this.loadInitialData();
            this.render();
            this.initCanvasAnimation();
        } catch (err) {
            console.error('VisionLab init error:', err);
        }
    }

    async loadInitialData() {
        const [prospects, benchmarks] = await Promise.all([
            fetch('/api/prospects').then(r => r.json()),
            fetch('/api/biomechanics/benchmarks').then(r => r.json())
        ]);
        this.prospects = prospects;
        this.benchmarks = benchmarks;
        await this.loadReport(this.selectedProspectId);
    }

    async loadReport(prospectId) {
        this.selectedProspectId = prospectId;
        const rep = await fetch(`/api/biomechanics/prospect/${prospectId}`).then(r => r.json());
        this.currentReport = rep;
        this.simAngle = rep.skating.joint_angles.knee_extension_deg;
        this.simCadence = rep.skating.stride_frequency_hz;
        this.simEdge = rep.skating.joint_angles.edge_lean_deg;
        await this.runStrideSimulation();
    }

    async runStrideSimulation() {
        const res = await fetch('/api/biomechanics/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                extension_angle_deg: parseFloat(this.simAngle),
                cadence_hz: parseFloat(this.simCadence),
                edge_lean_deg: parseFloat(this.simEdge)
            })
        });
        if (res.ok) {
            this.simResults = await res.json();
        }
    }

    setMode(mode) {
        this.mode = mode;
        this.render();
        this.initCanvasAnimation();
    }

    render() {
        if (!this.container || !this.currentReport) return;
        const rep = this.currentReport;
        const s = rep.skating;
        const j = s.joint_angles;
        const shot = rep.shooting;
        const sim = this.simResults || {};

        this.container.innerHTML = `
            <!-- Top VisionLab Header Banner -->
            <div class="glass-panel rounded-2xl p-6 mb-6 border border-cyan-500/40 bg-gradient-to-r from-[#081520] via-[#0b1f2d] to-[#081520] shadow-2xl">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                            <span class="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">VISIONLAB? OPTICAL TRACKING & COMPUTER VISION LAB</span>
                        </div>
                        <h2 class="text-2xl font-extrabold text-white mt-1 flex items-center gap-2">
                            Biomechanical Stride & Kinematics Analyzer
                        </h2>
                        <p class="text-xs text-slate-400 mt-0.5">
                            High-frequency joint vector tracking, ground-reaction impulse forces, and pro gold-standard benchmarking.
                        </p>
                    </div>

                    <!-- Prospect Selector & Mode Toggle -->
                    <div class="flex flex-wrap items-center gap-3">
                        <select onchange="window.VisionLab.changeProspect(this.value)" class="bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-cyan-400">
                            ${this.prospects.map(p => `
                                <option value="${p.id}" ${p.id === this.selectedProspectId ? 'selected' : ''}>
                                    #${p.consensus_rank} ${p.first_name} ${p.last_name} (${p.position})
                                </option>
                            `).join('')}
                        </select>

                        <div class="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                            <button onclick="window.VisionLab.setMode('stride')" class="px-3 py-1.5 rounded-lg transition-all ${this.mode === 'stride' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}">
                                Stride Extension
                            </button>
                            <button onclick="window.VisionLab.setMode('edge')" class="px-3 py-1.5 rounded-lg transition-all ${this.mode === 'edge' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}">
                                10-and-2 Mohawk Edge
                            </button>
                            <button onclick="window.VisionLab.setMode('shot')" class="px-3 py-1.5 rounded-lg transition-all ${this.mode === 'shot' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}">
                                Blade Flex Release
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 4 Top Optical Radar Metrics -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800">
                    <div class="glass-card p-3.5 rounded-xl border border-cyan-500/30 text-center">
                        <div class="text-[10px] text-slate-400 font-mono uppercase">0?15 MPH Burst</div>
                        <div class="text-2xl font-bold font-mono text-cyan-400 mt-0.5">${s.burst_0_15_mph_sec}s</div>
                        <div class="text-[10px] text-emerald-400 font-semibold">NHL Top 5% Elite</div>
                    </div>
                    <div class="glass-card p-3.5 rounded-xl border border-sky-500/30 text-center">
                        <div class="text-[10px] text-slate-400 font-mono uppercase">Optical Speed Radar</div>
                        <div class="text-2xl font-bold font-mono text-sky-300 mt-0.5">${s.peak_speed_mph} <span class="text-xs font-normal">MPH</span></div>
                        <div class="text-[10px] text-slate-400 font-mono">${s.stride_length_ft} ft Stride Length</div>
                    </div>
                    <div class="glass-card p-3.5 rounded-xl border border-purple-500/30 text-center">
                        <div class="text-[10px] text-slate-400 font-mono uppercase">Kinematic Efficiency</div>
                        <div class="text-2xl font-bold font-mono text-purple-400 mt-0.5">${s.kinematic_efficiency_score} / 100</div>
                        <div class="text-[10px] text-purple-300 font-mono">${s.stride_frequency_hz} Hz Cadence</div>
                    </div>
                    <div class="glass-card p-3.5 rounded-xl border border-amber-500/30 text-center">
                        <div class="text-[10px] text-slate-400 font-mono uppercase">Release Velocity</div>
                        <div class="text-2xl font-bold font-mono text-amber-400 mt-0.5">${shot.puck_release_speed_mph} <span class="text-xs font-normal">MPH</span></div>
                        <div class="text-[10px] text-slate-400 font-mono">${shot.release_time_ms}ms Quick-Release</div>
                    </div>
                </div>
            </div>

            <!-- Main 2-Col Layout: Canvas Pose Tracker + Kinematic Breakdown -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <!-- Left: 2D Skeleton Pose & Stride Canvas (7 cols) -->
                <div class="lg:col-span-7 glass-panel rounded-xl p-5 space-y-4">
                    <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div class="flex items-center gap-2">
                            <i data-lucide="activity" class="w-4 h-4 text-cyan-400"></i>
                            <h3 class="text-sm font-bold text-white">
                                2D Computer Vision Pose & Skeleton Tracker (${this.mode.toUpperCase()})
                            </h3>
                        </div>
                        <span class="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">60 FPS Optical Mesh</span>
                    </div>

                    <!-- Canvas Area -->
                    <div class="w-full h-[360px] bg-[#050b14] rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center">
                        <canvas id="vision-pose-canvas" width="640" height="360" class="w-full h-full"></canvas>
                        
                        <!-- Overlay Joint Angle Tags -->
                        <div class="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-[10px] font-mono space-y-0.5">
                            <div>Knee Ext: <span class="text-cyan-400 font-bold">${j.knee_extension_deg}?</span></div>
                            <div>Hip Flex: <span class="text-sky-300 font-bold">${j.hip_flexion_deg}?</span></div>
                            <div>Edge Lean: <span class="text-emerald-400 font-bold">${j.edge_lean_deg}?</span></div>
                        </div>

                        <div class="absolute top-3 right-3 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-mono text-cyan-300">
                            Propulsion: <strong>${s.propulsion_force_n} N</strong>
                        </div>
                    </div>

                    <!-- Interactive Angle Slider Simulator -->
                    <div class="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
                        <div class="flex items-center justify-between text-xs font-bold">
                            <span class="text-slate-300">Interactive Extension Angle Simulator:</span>
                            <span class="font-mono text-cyan-400 text-sm font-extrabold" id="extension-angle-val">${this.simAngle}?</span>
                        </div>
                        <input type="range" min="30" max="60" step="0.5" value="${this.simAngle}"
                               oninput="window.VisionLab.updateSimAngle(this.value)"
                               class="w-full accent-cyan-500 cursor-pointer">
                        <div class="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>30? (Short/Restricted)</span>
                            <span class="text-emerald-400">42? - 46? (Optimal Gold Standard)</span>
                            <span>60? (Over-Extended)</span>
                        </div>
                    </div>
                </div>

                <!-- Right: AI Biomechanical Coach Diagnosis (5 cols) -->
                <div class="lg:col-span-5 space-y-6">
                    <div class="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
                        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div>
                                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                                    <i data-lucide="bot" class="w-4 h-4 text-purple-400"></i>
                                    AI Biomechanical Diagnosis
                                </h3>
                                <p class="text-[11px] text-slate-400">Pro Comparison: <strong class="text-cyan-300">${rep.nhl_comparable_mechanics}</strong></p>
                            </div>
                        </div>

                        <!-- Coach Verdict -->
                        <div class="glass-card p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 text-xs text-slate-200 leading-relaxed font-medium">
                            ${rep.coach_verdict}
                        </div>

                        <!-- Key Mechanical Strengths -->
                        <div>
                            <span class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1.5">Kinematic Strengths</span>
                            <ul class="space-y-1.5 text-xs text-slate-300">
                                ${rep.diagnosis_strengths.map(st => `
                                    <li class="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg">
                                        <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5"></i>
                                        <span>${st}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>

                        <!-- Flags & Corrective Drills -->
                        <div>
                            <span class="text-[11px] font-bold text-rose-400 uppercase tracking-wider block mb-1.5">Efficiency Flags & Corrective Drills</span>
                            <div class="space-y-2">
                                ${rep.biomechanical_flags.map(fl => `
                                    <div class="text-xs text-rose-300 bg-rose-950/20 border border-rose-500/30 p-2.5 rounded-lg flex items-start gap-2">
                                        <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5"></i>
                                        <span>${fl}</span>
                                    </div>
                                `).join('')}
                                <div class="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
                                    <span class="text-[10px] font-bold text-sky-400 uppercase">Recommended Stride Drills:</span>
                                    <ul class="list-disc list-inside text-slate-400 text-[11px] space-y-0.5">
                                        ${rep.corrective_drills.map(d => `<li>${d}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
    }

    changeProspect(id) {
        this.loadReport(id).then(() => {
            this.render();
            this.initCanvasAnimation();
        });
    }

    updateSimAngle(val) {
        this.simAngle = parseFloat(val);
        const disp = document.getElementById('extension-angle-val');
        if (disp) disp.innerText = `${this.simAngle}?`;
        this.runStrideSimulation().then(() => {
            if (this.simResults) {
                // Update live simulation speed metrics
            }
        });
    }

    initCanvasAnimation() {
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        const canvas = document.getElementById('vision-pose-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let frame = 0;
        const animate = () => {
            frame++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Grid Background
            ctx.strokeStyle = '#0e1f33';
            ctx.lineWidth = 1;
            for (let x = 0; x < canvas.width; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += 40) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Draw Ice Surface Line
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(40, 300);
            ctx.lineTo(600, 300);
            ctx.stroke();

            // Animated Skater Skeleton Center Coordinates
            const centerX = 280;
            const groundY = 300;
            const t = frame * 0.05;
            const extAngleRad = (this.simAngle * Math.PI) / 180;

            let hipX = centerX;
            let hipY = 160 + Math.sin(t * 2) * 4;
            let headX = hipX + 30;
            let headY = hipY - 60;
            let shoulderX = hipX + 15;
            let shoulderY = hipY - 35;

            // Stride Leg (Pushing Backwards)
            let legOffset = Math.sin(t) * 50;
            let pushFootX = hipX - 80 - Math.cos(extAngleRad) * 40;
            let pushFootY = groundY;
            let pushKneeX = (hipX + pushFootX) / 2 - 10;
            let pushKneeY = hipY + 65;

            // Lead Leg (Glide/Recovery)
            let glideFootX = hipX + 60 + Math.sin(t) * 20;
            let glideFootY = groundY;
            let glideKneeX = hipX + 30;
            let glideKneeY = hipY + 65;

            // Draw Skeletal Bones
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#00f0ff';
            ctx.fillStyle = '#ffffff';

            const drawBone = (x1, y1, x2, y2) => {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            };

            const drawJoint = (x, y, r = 6) => {
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#00f0ff';
                ctx.stroke();
            };

            // Spine / Trunk
            drawBone(headX, headY, shoulderX, shoulderY);
            drawBone(shoulderX, shoulderY, hipX, hipY);

            // Push Leg
            drawBone(hipX, hipY, pushKneeX, pushKneeY);
            drawBone(pushKneeX, pushKneeY, pushFootX, pushFootY);

            // Glide Leg
            drawBone(hipX, hipY, glideKneeX, glideKneeY);
            drawBone(glideKneeX, glideKneeY, glideFootX, glideFootY);

            // Arms & Hockey Stick
            let handX = shoulderX + 45;
            let handY = shoulderY + 40;
            drawBone(shoulderX, shoulderY, handX, handY);

            // Stick Vector
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#f59e0b';
            drawBone(handX, handY, glideFootX + 30, groundY);

            // Puck
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(glideFootX + 35, groundY - 4, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw Joints
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#00f0ff';
            drawJoint(headX, headY, 10);
            drawJoint(shoulderX, shoulderY);
            drawJoint(hipX, hipY);
            drawJoint(pushKneeX, pushKneeY);
            drawJoint(pushFootX, pushFootY);
            drawJoint(glideKneeX, glideKneeY);
            drawJoint(glideFootX, glideFootY);
            drawJoint(handX, handY);

            // Extension Angle Arc Vector
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pushKneeX, pushKneeY, 25, 0, extAngleRad);
            ctx.stroke();

            this.animFrameId = requestAnimationFrame(animate);
        };

        animate();
    }
}

window.VisionLab = new VisionLabManager('visionlab-container');
