import { apiGet, apiPost, setAuthToken, setCsrfToken } from './apiClient';
import { AuthenticatedUser } from '@saksham/shared';

export interface LoginResponse {
  success: boolean;
  data: {
    user: AuthenticatedUser;
    token?: string;
    csrfToken: string;
    message: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  data: {
    user: AuthenticatedUser;
    csrfToken?: string;
  };
}

export interface LogoutResponse {
  success: boolean;
  data: {
    message: string;
  };
}

export interface RegisterInstitutionData {
  institutionName: string;
  trustName: string;
  institutionType?: string;
  region?: string;
  state: string;
  district?: string;
  address?: string;
  pincode?: string;
  permanentInstituteId?: string;
  representativeName: string;
  email: string;
  mobilePhone?: string;
  password: string;
}

/**
 * Real Backend Authentication API Calls
 */
export async function loginWithCredentials(
  usernameOrEmail: string,
  password: string
): Promise<AuthenticatedUser> {
  const response = await apiPost<LoginResponse>('/auth/login', {
    usernameOrEmail,
    password,
  });
  if (response.data.token) {
    setAuthToken(response.data.token);
  }
  if (response.data.csrfToken) {
    setCsrfToken(response.data.csrfToken);
  }
  return response.data.user;
}

export async function fetchCurrentOfficerProfile(): Promise<AuthenticatedUser> {
  const response = await apiGet<ProfileResponse>('/auth/me');
  if (response.data?.csrfToken) {
    setCsrfToken(response.data.csrfToken);
  }
  return response.data.user;
}

export async function logoutOfficer(): Promise<void> {
  try {
    await apiPost<LogoutResponse>('/auth/logout', {});
  } finally {
    setAuthToken(null);
    setCsrfToken(null);
  }
}

export async function registerInstitution(data: RegisterInstitutionData): Promise<{
  userId: string;
  institutionId: string;
  email: string;
  isEmailVerified: boolean;
  message: string;
}> {
  const response = await apiPost<{ success: boolean; data: any }>('/auth/register-institution', data);
  return response.data;
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  const response = await apiPost<{ success: boolean; data: any }>('/auth/verify-email', { token });
  return response.data;
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  const response = await apiPost<{ success: boolean; data: any }>('/auth/forgot-password', { email });
  return response.data;
}

export async function resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
  const response = await apiPost<{ success: boolean; data: any }>('/auth/reset-password', { token, password });
  return response.data;
}

export async function fetchDevEmails(): Promise<any[]> {
  try {
    const res = await apiGet<{ success: boolean; data: { outbox: any[] } }>('/auth/dev-outbox');
    return res.data?.outbox || [];
  } catch {
    return [];
  }
}
