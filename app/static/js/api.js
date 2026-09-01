// ApexScout Hockey API Client
const API = {
    async getProspects(filters = {}) {
        const params = new URLSearchParams();
        if (filters.league && filters.league !== 'ALL') params.append('league', filters.league);
        if (filters.position && filters.position !== 'ALL') params.append('position', filters.position);
        if (filters.tier) params.append('tier', filters.tier);
        if (filters.search) params.append('search', filters.search);
        if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
        
        const res = await fetch(`/api/prospects?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch prospects');
        return await res.json();
    },

    async getProspect(id) {
        const res = await fetch(`/api/prospects/${id}`);
        if (!res.ok) throw new Error(`Failed to fetch prospect ${id}`);
        return await res.json();
    },

    async updateTier(id, tier) {
        const res = await fetch(`/api/prospects/${id}/tier`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tier })
        });
        if (!res.ok) throw new Error('Failed to update tier');
        return await res.json();
    },

    async getDraftBoard() {
        const res = await fetch('/api/draft-board');
        if (!res.ok) throw new Error('Failed to fetch draft board');
        return await res.json();
    },

    async getPortalPlayers() {
        const res = await fetch('/api/portal');
        if (!res.ok) throw new Error('Failed to fetch portal players');
        return await res.json();
    },

    async updatePortalPlayer(id, payload) {
        const res = await fetch(`/api/portal/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to update portal player');
        return await res.json();
    },

    async getScholarships() {
        const res = await fetch('/api/scholarships');
        if (!res.ok) throw new Error('Failed to fetch scholarships');
        return await res.json();
    },

    async getDepthChart() {
        const res = await fetch('/api/depth-chart');
        if (!res.ok) throw new Error('Failed to fetch depth chart');
        return await res.json();
    },

    async addLiveEvent(eventData) {
        const res = await fetch('/api/live-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
        if (!res.ok) throw new Error('Failed to add live event');
        return await res.json();
    },

    async getLiveEvents(prospectId = null) {
        const url = prospectId ? `/api/live-events?prospect_id=${prospectId}` : '/api/live-events';
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch live events');
        return await res.json();
    },

    async synthesizeDossier(prospectId, focusArea = 'All-Around') {
        const res = await fetch('/api/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prospect_id: prospectId, focus_area: focusArea })
        });
        if (!res.ok) throw new Error('Failed to synthesize AI dossier');
        return await res.json();
    }
};

window.API = API;
