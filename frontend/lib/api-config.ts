/**
 * API Configuration
 * Centralized API URL management for different environments
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const API_ENDPOINTS = {
  // Auth
  login: `${API_BASE_URL}/api/v1/auth/login`,
  signup: `${API_BASE_URL}/api/v1/auth/signup`,
  
  // Chat
  chatStart: `${API_BASE_URL}/api/v1/patient/chat/start`,
  chatMessage: (conversationId: string) => `${API_BASE_URL}/api/v1/patient/chat/${conversationId}/message`,
  chatHistory: (conversationId: string) => `${API_BASE_URL}/api/v1/patient/chat/${conversationId}/history`,
  
  // Escalation
  professionals: `${API_BASE_URL}/api/v1/patient/professionals`,
  escalateRequest: `${API_BASE_URL}/api/v1/patient/escalate/request`,
  escalateStatus: (requestId: string) => `${API_BASE_URL}/api/v1/patient/escalate/request/${requestId}/status`,
  escalateCurrentRequest: `${API_BASE_URL}/api/v1/patient/escalate/request/current`,
  escalateAddDoctor: (requestId: string) => `${API_BASE_URL}/api/v1/patient/escalate/request/${requestId}/add-doctor`,
  escalateWithdrawDoctor: (requestId: string, doctorId: string) => `${API_BASE_URL}/api/v1/patient/escalate/request/${requestId}/withdraw-doctor/${doctorId}`,
  
  // Doctor
  doctorRequests: `${API_BASE_URL}/api/v1/doctor/escalate/requests`,
  doctorAcceptRequest: (requestId: string) => `${API_BASE_URL}/api/v1/doctor/escalate/request/${requestId}/accept`,
  doctorRejectRequest: (requestId: string) => `${API_BASE_URL}/api/v1/doctor/escalate/request/${requestId}/reject`,
  doctorDashboard: `${API_BASE_URL}/api/v1/doctor/dashboard`,
  
  // Appointments
  patientAppointments: `${API_BASE_URL}/api/v1/patient/appointments`,
  
  // WebSocket
  wsDoctor: (userId: number) => `${API_BASE_URL.replace('http', 'ws')}/api/v1/ws/doctor/${userId}`,
  wsPatient: (userId: number) => `${API_BASE_URL.replace('http', 'ws')}/api/v1/ws/patient/${userId}`,
}

export default API_BASE_URL
