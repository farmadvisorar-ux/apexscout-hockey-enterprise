// ApexScout 20-80 Pro Scout Tool Radar Chart
class ScoutRadarChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.chart = null;
    }

    render(prospect, compareProspect = null) {
        if (!this.canvas || typeof Chart === 'undefined') return;
        const g = prospect.grades;
        
        const labels = [
            'Skating Pace',
            'Agility & Edges',
            'Puck Handling',
            'Vision & Passing',
            'Hockey Sense (IQ)',
            'Shot Threat',
            'Compete & Motor',
            'Physicality',
            'Defensive Reliability'
        ];

        const dataPrimary = [
            g.skating_speed,
            Math.round((g.skating_agility + g.skating_edges) / 2),
            g.puck_skills,
            g.passing_vision,
            g.hockey_iq,
            Math.round((g.shot_release + g.shot_power) / 2),
            g.compete_motor,
            g.physicality,
            g.defensive_reliability
        ];

        const datasets = [
            {
                label: `${prospect.first_name} ${prospect.last_name}`,
                data: dataPrimary,
                fill: true,
                backgroundColor: 'rgba(56, 189, 248, 0.25)',
                borderColor: '#38bdf8',
                pointBackgroundColor: '#38bdf8',
                pointBorderColor: '#ffffff',
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: '#38bdf8',
                borderWidth: 2.5
            },
            {
                label: 'NHL Average Baseline (50)',
                data: [50, 50, 50, 50, 50, 50, 50, 50, 50],
                fill: false,
                borderColor: 'rgba(148, 163, 184, 0.4)',
                borderDash: [5, 5],
                pointRadius: 0,
                borderWidth: 1.5
            }
        ];

        if (compareProspect) {
            const cg = compareProspect.grades;
            datasets.push({
                label: `${compareProspect.first_name} ${compareProspect.last_name}`,
                data: [
                    cg.skating_speed,
                    Math.round((cg.skating_agility + cg.skating_edges) / 2),
                    cg.puck_skills,
                    cg.passing_vision,
                    cg.hockey_iq,
                    Math.round((cg.shot_release + cg.shot_power) / 2),
                    cg.compete_motor,
                    cg.physicality,
                    cg.defensive_reliability
                ],
                fill: true,
                backgroundColor: 'rgba(244, 63, 94, 0.2)',
                borderColor: '#f43f5e',
                pointBackgroundColor: '#f43f5e',
                pointBorderColor: '#ffffff',
                borderWidth: 2
            });
        }

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(this.canvas, {
            type: 'radar',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
                        grid: { color: 'rgba(255, 255, 255, 0.08)' },
                        pointLabels: {
                            color: '#cbd5e1',
                            font: { size: 11, family: 'Plus Jakarta Sans', weight: '600' }
                        },
                        ticks: {
                            stepSize: 10,
                            color: '#64748b',
                            backdropColor: 'transparent',
                            font: { size: 9 }
                        },
                        suggestedMin: 20,
                        suggestedMax: 80
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#e2e8f0',
                            font: { size: 11, family: 'Plus Jakarta Sans' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#38bdf8',
                        bodyColor: '#f1f5f9',
                        borderColor: '#334155',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                const val = context.raw;
                                let desc = 'Average (50)';
                                if (val >= 75) desc = 'Generational / Elite Plus (75-80)';
                                else if (val >= 70) desc = 'Plus-Plus / High End (70)';
                                else if (val >= 60) desc = 'Plus / Above Average (60)';
                                else if (val < 45) desc = 'Fringe / Area of Improvement (<45)';
                                return `${context.dataset.label}: ${val}/80 (${desc})`;
                            }
                        }
                    }
                }
            }
        });
    }
}

window.ScoutRadarChart = ScoutRadarChart;
