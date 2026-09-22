const rawApiUrl = import.meta.env.VITE_API_URL || '';
const API_URL = rawApiUrl.replace(/\/+$/, '');

const getHeaders = (includeJson = true) => {
  const headers = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const authService = {
  register: (name, email, password, role) =>
    fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password, role }),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      return data;
    }),
  login: (email, password) =>
    fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      return data;
    }),

  me: () =>
    fetch(`${API_URL}/auth/me`, {
      headers: getHeaders(false),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');
      return data;
    }),

  updateProfile: (profileData) =>
    fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');
      return data;
    }),
};

export const adminService = {
  getStats: () => fetch(`${API_URL}/admin/stats`, { headers: getHeaders() }).then(res => res.json()),
  getListings: () => fetch(`${API_URL}/admin/listings`, { headers: getHeaders() }).then(res => res.json()),
  approveListing: (id) => fetch(`${API_URL}/admin/listings/${id}/approve`, { method: 'POST', headers: getHeaders() }).then(res => res.json()),
  rejectListing: (id, reason) => fetch(`${API_URL}/admin/listings/${id}/reject`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ reason }) }).then(res => res.json()),
  getKycs: () => fetch(`${API_URL}/admin/verification`, { headers: getHeaders() }).then(res => res.json()),
  approveKyc: (id) => fetch(`${API_URL}/admin/verification/${id}/approve`, { method: 'POST', headers: getHeaders() }).then(res => res.json()),
  rejectKyc: (id, reason) => fetch(`${API_URL}/admin/verification/${id}/reject`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ reason }) }).then(res => res.json()),
  getAuditLogs: () => fetch(`${API_URL}/admin/audit`, { headers: getHeaders() }).then(res => res.json()),
  getKycDocumentUrl: (id) => fetch(`${API_URL}/kyc/admin/documents/${id}/url`, { headers: getHeaders() }).then(async res => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch document URL');
    return data;
  }),
};

export const listingsService = {
  getMyListings: () =>
    fetch(`${API_URL}/listings/my-listings`, {
      headers: getHeaders(),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch listings');
      return data;
    }),

  createListing: (listingData) =>
    fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(listingData),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create listing');
      return data;
    }),

  updateListing: (id, listingData) =>
    fetch(`${API_URL}/listings/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(listingData),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update listing');
      return data;
    }),

  deleteListing: (id) =>
    fetch(`${API_URL}/listings/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete listing');
      return data;
    }),

  getListingDetails: (id) =>
    fetch(`${API_URL}/listings/${id}`, {
      headers: getHeaders(),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch listing details');
      return data;
    }),

  toggleFavorite: (id) =>
    fetch(`${API_URL}/listings/${id}/favorite`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to toggle favorite');
      return data;
    }),

  checkIsFavorited: (id) =>
    fetch(`${API_URL}/listings/${id}/is-favorited`, {
      headers: getHeaders(),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to check favorite status');
      return data;
    }),

  recordView: (id) =>
    fetch(`${API_URL}/listings/${id}/view`, {
      method: 'POST',
      headers: getHeaders(false),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to record view');
      return data;
    }),

  getAllListings: () =>
    fetch(`${API_URL}/listings`, {
      headers: getHeaders(false),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch listings');
      return data;
    }),

  uploadListingImages: (id, formData) =>
    fetch(`${API_URL}/listings/${id}/images`, {
      method: 'POST',
      headers: getHeaders(false),
      body: formData,
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to upload images');
      return data;
    }),

  deleteListingImage: (id, imageId) =>
    fetch(`${API_URL}/listings/${id}/images/${imageId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete image');
      return data;
    }),

  setCoverImage: (id, imageId) =>
    fetch(`${API_URL}/listings/${id}/images/${imageId}/cover`, {
      method: 'PUT',
      headers: getHeaders(),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to set cover image');
      return data;
    }),

  getAgentProfile: (userId) =>
    fetch(`${API_URL}/listings/agent/${userId}`, {
      headers: getHeaders(false),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch agent profile');
      return data;
    }),

  sendInquiry: (id, inquiryData) =>
    fetch(`${API_URL}/listings/${id}/inquire`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(inquiryData),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send inquiry');
      return data;
    }),
};

export const dashboardService = {
  getAgentDashboard: () =>
    fetch(`${API_URL}/dashboard/agent`, {
      headers: getHeaders(),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch agent dashboard analytics');
      return data;
    }),

  getBuyerDashboard: () =>
    fetch(`${API_URL}/dashboard/buyer`, {
      headers: getHeaders(),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch buyer dashboard analytics');
      return data;
    }),
};


export const messagesService = {
  getConversations: () =>
    fetch(`${API_URL}/messages/conversations`, {
      headers: getHeaders(false),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch conversations');
      return data;
    }),

  getConversation: (id) =>
    fetch(`${API_URL}/messages/conversations/${id}`, {
      headers: getHeaders(false),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch conversation');
      return data;
    }),

  sendMessage: (id, message) =>
    fetch(`${API_URL}/messages/conversations/${id}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message }),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send message');
      return data;
    }),
};

export const aiService = {
  sendChatMessage: (message, conversationId) =>
    fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, conversationId }),
    }).then(async res => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `Request failed with status ${res.status}`);
      }
      return data;
    }),
};
export const kycService = {
  getMyKyc: () =>
    fetch(`${API_URL}/kyc`, {
      headers: getHeaders(false),
    }).then(async res => {
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to load KYC records');
      }

      return data;
    }),

  uploadDocument: (documentType, file) => {
    const formData = new FormData();

    formData.append('documentType', documentType);
    formData.append('document', file);

    return fetch(`${API_URL}/kyc/documents`, {
      method: 'POST',
      headers: getHeaders(false),
      body: formData,
    }).then(async res => {
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload document');
      }

      return data;
    });
  },
};