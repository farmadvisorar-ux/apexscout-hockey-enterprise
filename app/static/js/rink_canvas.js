// ApexScout 2D NHL Regulation Ice Rink Visualizer Engine
class HockeyRinkVisualizer {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.options = Object.assign({
            mode: 'offensive', // 'offensive' (half rink) or 'full'
            showTransitions: true,
            showHeatmap: false,
            filterType: 'all', // 'all', 'goals', 'rush', 'pp'
            onHover: null
        }, options);
        
        this.shots = [];
        this.hoveredShot = null;
        this.initCanvasDPI();
        this.setupEvents();
    }

    initCanvasDPI() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.width = rect.width || 600;
        this.height = rect.height || 400;
        
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
    }

    setupEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            this.handleMouseMove(mouseX, mouseY);
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredShot = null;
            this.render();
            if (this.options.onHover) this.options.onHover(null);
        });
        
        window.addEventListener('resize', () => {
            this.initCanvasDPI();
            this.render();
        });
    }

    setShots(shots, options = {}) {
        this.shots = shots || [];
        if (options.filterType) this.options.filterType = options.filterType;
        if (options.mode) this.options.mode = options.mode;
        this.render();
    }

    // Convert NHL coordinate feet (x: 0 to 100, y: -42.5 to 42.5) to Canvas pixels
    toCanvasCoord(x, y) {
        const w = this.width;
        const h = this.height;
        const pad = 20;
        
        if (this.options.mode === 'offensive') {
            // Offensive zone: x from 25 (blue line) to 100 (end boards), y: -42.5 to 42.5
            const rinkFeetX = 75; // 100 - 25
            const rinkFeetY = 85; // 42.5 * 2
            
            const px = pad + ((x - 25) / rinkFeetX) * (w - pad * 2);
            const py = pad + ((y + 42.5) / rinkFeetY) * (h - pad * 2);
            return { x: px, y: py };
        } else {
            // Full rink: x: -100 to 100, y: -42.5 to 42.5
            const px = pad + ((x + 100) / 200) * (w - pad * 2);
            const py = pad + ((y + 42.5) / 85) * (h - pad * 2);
            return { x: px, y: py };
        }
    }

    drawRinkBase() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const pad = 16;
        
        // Ice surface background
        ctx.fillStyle = '#0a1628';
        ctx.fillRect(0, 0, w, h);
        
        // Rink boards container
        ctx.save();
        ctx.beginPath();
        const rw = w - pad * 2;
        const rh = h - pad * 2;
        const radius = 32;
        
        ctx.roundRect(pad, pad, rw, rh, radius);
        ctx.fillStyle = '#0f1f38';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#334155';
        ctx.stroke();
        ctx.clip();
        
        // Blue line (x = 25 ft)
        const blCoord = this.toCanvasCoord(25, 0);
        ctx.beginPath();
        ctx.moveTo(blCoord.x, pad);
        ctx.lineTo(blCoord.x, h - pad);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#3b82f6';
        ctx.stroke();
        
        // Goal line (x = 89 ft, 11 ft from back boards)
        const glCoord = this.toCanvasCoord(89, 0);
        ctx.beginPath();
        ctx.moveTo(glCoord.x, pad + 8);
        ctx.lineTo(glCoord.x, h - pad - 8);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ef4444';
        ctx.stroke();
        
        // Goal Crease (Semi-circle at goal line)
        const creaseRadius = 26;
        ctx.beginPath();
        ctx.arc(glCoord.x, h / 2, creaseRadius, 0.5 * Math.PI, 1.5 * Math.PI, true);
        ctx.fillStyle = 'rgba(2, 132, 199, 0.35)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ef4444';
        ctx.stroke();
        
        // Goal Net
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(glCoord.x, h / 2 - 12, 10, 24);
        ctx.strokeRect(glCoord.x, h / 2 - 12, 10, 24);
        
        // Goal Line Trapezoid lines behind goal
        ctx.beginPath();
        ctx.moveTo(glCoord.x, h / 2 - 28);
        ctx.lineTo(w - pad, h / 2 - 42);
        ctx.moveTo(glCoord.x, h / 2 + 28);
        ctx.lineTo(w - pad, h / 2 + 42);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ef4444';
        ctx.stroke();
        
        // Faceoff Circles (Left and Right in Offensive Zone at x=69ft, y=+-22ft)
        const topCircle = this.toCanvasCoord(69, -22);
        const botCircle = this.toCanvasCoord(69, 22);
        const circleRad = (h / 85) * 15;
        
        [topCircle, botCircle].forEach(center => {
            // Outer circle
            ctx.beginPath();
            ctx.arc(center.x, center.y, circleRad, 0, 2 * Math.PI);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ef4444';
            ctx.stroke();
            
            // Faceoff dot
            ctx.beginPath();
            ctx.arc(center.x, center.y, 4.5, 0, 2 * Math.PI);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            
            // Hash marks
            ctx.beginPath();
            ctx.moveTo(center.x - circleRad, center.y - 8);
            ctx.lineTo(center.x - circleRad - 6, center.y - 8);
            ctx.moveTo(center.x - circleRad, center.y + 8);
            ctx.lineTo(center.x - circleRad - 6, center.y + 8);
            ctx.moveTo(center.x + circleRad, center.y - 8);
            ctx.lineTo(center.x + circleRad + 6, center.y - 8);
            ctx.moveTo(center.x + circleRad, center.y + 8);
            ctx.lineTo(center.x + circleRad + 6, center.y + 8);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        
        // High-Danger Slot Overlay Box (x: 65-85, y: -14 to 14)
        const slotTopLeft = this.toCanvasCoord(65, -14);
        const slotBottomRight = this.toCanvasCoord(88, 14);
        ctx.beginPath();
        ctx.rect(slotTopLeft.x, slotTopLeft.y, slotBottomRight.x - slotTopLeft.x, slotBottomRight.y - slotTopLeft.y);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.06)';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.restore();
    }

    drawTransitions() {
        if (!this.options.showTransitions) return;
        const ctx = this.ctx;
        
        // Draw sample high-probability controlled entry vectors
        const entries = [
            { from: { x: 20, y: -24 }, to: { x: 60, y: -18 }, success: true },
            { from: { x: 20, y: 0 }, to: { x: 68, y: -4 }, success: true },
            { from: { x: 20, y: 26 }, to: { x: 55, y: 20 }, success: false }
        ];
        
        entries.forEach(e => {
            const start = this.toCanvasCoord(e.from.x, e.from.y);
            const end = this.toCanvasCoord(e.to.x, e.to.y);
            
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.quadraticCurveTo((start.x + end.x) / 2, start.y, end.x, end.y);
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = e.success ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.35)';
            ctx.stroke();
            
            // Arrow head
            ctx.beginPath();
            ctx.arc(end.x, end.y, 3.5, 0, 2 * Math.PI);
            ctx.fillStyle = e.success ? '#10b981' : '#f43f5e';
            ctx.fill();
        });
    }

    drawShots() {
        const ctx = this.ctx;
        const filter = this.options.filterType;
        
        const filtered = this.shots.filter(s => {
            if (filter === 'goals') return s.result === 'goal';
            if (filter === 'rush') return s.is_rush;
            if (filter === 'pp') return s.is_powerplay;
            return true;
        });

        filtered.forEach(shot => {
            const pos = this.toCanvasCoord(shot.x, shot.y);
            const isHovered = this.hoveredShot && this.hoveredShot.id === shot.id;
            const isGoal = shot.result === 'goal';
            
            let color = '#38bdf8'; // Perimeter
            let radius = 5.5;
            
            if (shot.xg >= 0.20) {
                color = '#f43f5e'; // High Danger Ruby
                radius = 7.5;
            } else if (shot.xg >= 0.08) {
                color = '#f59e0b'; // Medium Danger Amber
                radius = 6.0;
            }
            
            if (isHovered) radius += 3;
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = isGoal ? 14 : (isHovered ? 10 : 4);
            ctx.fill();
            
            // Goal indicator: glowing gold border ring
            if (isGoal) {
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = '#fbbf24';
                ctx.stroke();
                
                // Star / center dot
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 2, 0, 2 * Math.PI);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            } else {
                ctx.lineWidth = 1.2;
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();
            }
            
            ctx.restore();
        });
    }

    handleMouseMove(mouseX, mouseY) {
        let found = null;
        for (const shot of this.shots) {
            const pos = this.toCanvasCoord(shot.x, shot.y);
            const dist = Math.hypot(pos.x - mouseX, pos.y - mouseY);
            if (dist < 10) {
                found = shot;
                break;
            }
        }
        
        if (this.hoveredShot !== found) {
            this.hoveredShot = found;
            this.render();
            if (this.options.onHover) {
                this.options.onHover(found);
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawRinkBase();
        this.drawTransitions();
        this.drawShots();
    }
}

window.HockeyRinkVisualizer = HockeyRinkVisualizer;
