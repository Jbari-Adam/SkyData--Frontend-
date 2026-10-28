import apiClient from './apiClient'

export const locationApi = {
    list: () => apiClient.get('/api/saved-locations'),
    save: (location) => apiClient.post('/api/saved-locations', location),
    remove: (id) => apiClient.delete(`/api/saved-locations/${id}`),
}
