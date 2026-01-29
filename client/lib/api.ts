/**
 * API client for backend communication
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
}

interface FetchOptions extends RequestInit {
  token?: string;
}

/**
 * Generic fetch wrapper with authentication support
 */
async function fetchAPI<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    ...fetchOptions.headers,
  };

  // Add Content-Type for JSON requests (skip for FormData)
  if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add Authorization header if token is provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Include cookies for authentication
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }

  return data;
}

// ============= Authentication API =============

export interface SignUpData {
  full_name: string;
  email: string;
  password: string;
  role?: 'admin' | 'student';
}

export interface SignInData {
  email: string;
  password: string;
}

export interface User {
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'student';
  avatar_url?: string;
  created_at: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileData {
  full_name: string;
}

/**
 * Sign up a new user
 */
export async function signUp(data: SignUpData): Promise<ApiResponse<User>> {
  return fetchAPI('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Sign in user
 */
export async function signIn(data: SignInData): Promise<ApiResponse<User & { accessToken: string }>> {
  return fetchAPI('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Sign out user
 */
export async function signOut(token: string): Promise<ApiResponse> {
  return fetchAPI('/api/auth/signout', {
    method: 'POST',
    token,
  });
}

/**
 * Update user profile
 */
export async function updateProfile(
  data: UpdateProfileData,
  token: string
): Promise<ApiResponse<User>> {
  return fetchAPI('/api/auth/update-profile', {
    method: 'PUT',
    body: JSON.stringify(data),
    token,
  });
}

/**
 * Update profile picture
 */
export async function updateProfilePicture(
  file: File,
  token: string
): Promise<ApiResponse<User>> {
  const formData = new FormData();
  formData.append('avatar', file);

  return fetchAPI('/api/auth/update-profile-picture', {
    method: 'PUT',
    body: formData,
    token,
  });
}

/**
 * Change password
 */
export async function changePassword(
  data: ChangePasswordData,
  token: string
): Promise<ApiResponse> {
  return fetchAPI('/api/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify(data),
    token,
  });
}

// ============= AI Bot API =============

export interface GenerateFromImageData {
  generatedText: string;
  prompt: string;
  imageInfo: {
    originalFilename: string;
    mimeType: string;
    size: number;
  };
}

/**
 * Generate text from image using AI
 */
export async function generateTextFromImage(
  file: File,
  prompt?: string
): Promise<ApiResponse<GenerateFromImageData>> {
  const formData = new FormData();
  formData.append('image', file);
  if (prompt) {
    formData.append('prompt', prompt);
  }

  return fetchAPI('/api/ai/generate-from-image', {
    method: 'POST',
    body: formData,
  });
}

// ============= Export API URL for direct use =============
export { API_URL };
