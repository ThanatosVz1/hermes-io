// Hermes.io — AI Service & API Client
// Handles backend calls, defensive JSON validation, and error recovery

class HermesAIService {
  constructor() {
    this.apiBase = '/api';
  }

  // Get current auth headers
  getHeaders() {
    const token = localStorage.getItem('hermes_auth_token');
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Validate single node against §2 schema
  validateNode(node) {
    if (!node || typeof node !== 'object') {
      node = {};
    }
    return {
      id: node.id || `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: String(node.title || 'Untitled Checkpoint'),
      description: String(node.description || ''),
      status: ['locked', 'not_started', 'in_progress', 'completed'].includes(node.status) ? node.status : 'not_started',
      progress: typeof node.progress === 'number' && !isNaN(node.progress) ? Math.min(100, Math.max(0, node.progress)) : 0,
      estimatedHours: typeof node.estimatedHours === 'number' && !isNaN(node.estimatedHours) ? Math.max(1, node.estimatedHours) : 4,
      resources: Array.isArray(node.resources) ? node.resources.map(r => ({
        type: ['article', 'video', 'course', 'docs', 'practice', 'project'].includes(r.type) ? r.type : 'article',
        title: String(r.title || 'Learning Resource'),
        url: String(r.url || ''),
        isFree: Boolean(r.isFree !== false)
      })) : [],
      children: Array.isArray(node.children) ? node.children.map(child => this.validateNode(child)) : [],
      isExpandable: Boolean(node.isExpandable !== false),
      isExpanded: Boolean(node.isExpanded)
    };
  }

  // Validate complete roadmap
  validateRoadmap(roadmap) {
    if (!roadmap || typeof roadmap !== 'object') {
      throw new Error('Invalid roadmap payload');
    }
    return {
      id: roadmap.id || `rdm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: roadmap.userId || 'usr_guest',
      title: String(roadmap.title || 'Personalized Learning Roadmap'),
      goal: String(roadmap.goal || ''),
      targetRole: String(roadmap.targetRole || ''),
      interests: String(roadmap.interests || ''),
      skillLevel: String(roadmap.skillLevel || 'Beginner'),
      skillDetails: String(roadmap.skillDetails || ''),
      createdAt: roadmap.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: Array.isArray(roadmap.nodes) ? roadmap.nodes.map(n => this.validateNode(n)) : []
    };
  }

  // Request Flow A Initial Roadmap Generation
  async generateRoadmap(profile) {
    try {
      const res = await fetch(`${this.apiBase}/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(profile)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      return this.validateRoadmap(data);
    } catch (err) {
      console.error('Generation request failed:', err);
      throw err;
    }
  }

  // Request Flow A/B On-demand Submodule Expansion (§4b)
  async expandMilestone(milestone, context) {
    try {
      const res = await fetch(`${this.apiBase}/expand`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ milestone, context })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      const rawSubs = data.submodules || [];
      return rawSubs.map(s => this.validateNode(s));
    } catch (err) {
      console.error('Expansion request failed:', err);
      throw err;
    }
  }

  // Generate 10-20 Module Quiz Questions
  async generateQuiz(moduleTitle, moduleDescription, count = 15) {
    try {
      const res = await fetch(`${this.apiBase}/quiz`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ moduleTitle, moduleDescription, count })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate quiz');
      }

      return await res.json();
    } catch (err) {
      console.error('Quiz generation error:', err);
      throw err;
    }
  }

  // Request Milestone Level Adjustment / Section Regeneration
  async adjustMilestone(milestone, adjustmentType, currentLevel, promptNotes) {
    try {
      const res = await fetch(`${this.apiBase}/adjust`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ milestone, adjustmentType, currentLevel, promptNotes })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      return this.validateNode(data.milestone);
    } catch (err) {
      console.error('Adjustment request failed:', err);
      throw err;
    }
  }

  // Fetch all roadmaps for current user
  async getRoadmaps() {
    const res = await fetch(`${this.apiBase}/roadmaps`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch roadmaps');
    return await res.json();
  }

  // Fetch single roadmap by ID
  async getRoadmapById(id) {
    const res = await fetch(`${this.apiBase}/roadmaps/${id}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Roadmap not found');
    const data = await res.json();
    return this.validateRoadmap(data);
  }

  // Save / create roadmap
  async saveRoadmap(roadmap) {
    const validated = this.validateRoadmap(roadmap);
    const res = await fetch(`${this.apiBase}/roadmaps`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(validated)
    });
    if (!res.ok) throw new Error('Failed to save roadmap');
    return await res.json();
  }

  // Update existing roadmap
  async updateRoadmap(id, updatePayload) {
    const res = await fetch(`${this.apiBase}/roadmaps/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updatePayload)
    });
    if (!res.ok) throw new Error('Failed to update roadmap');
    return await res.json();
  }

  // Delete roadmap
  async deleteRoadmap(id) {
    const res = await fetch(`${this.apiBase}/roadmaps/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete roadmap');
    return await res.json();
  }

  // Auth: Signup
  async signup(name, email, password) {
    const res = await fetch(`${this.apiBase}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    return data;
  }

  // Auth: Login with username or email
  async login(identifier, password) {
    const res = await fetch(`${this.apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, username: identifier, identifier, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  }

  // Auth: Get Current Session
  async getCurrentUser() {
    const token = localStorage.getItem('hermes_auth_token');
    if (!token) return null;

    try {
      const res = await fetch(`${this.apiBase}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch {
      return null;
    }
  }

  // Auth: Demo Users
  async getDemoUsers() {
    const res = await fetch(`${this.apiBase}/auth/demo-users`);
    return await res.json();
  }

  // Claim Guest Roadmaps after login
  async claimGuestRoadmaps(roadmapIds) {
    const res = await fetch(`${this.apiBase}/auth/claim-guest-roadmaps`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ roadmapIds })
    });
    return await res.json();
  }
}

window.hermesAI = new HermesAIService();
