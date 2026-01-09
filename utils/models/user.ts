export interface SecurityQuestion {
  id: number;
  question?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  passwordRepeat: string;
  securityQuestion: SecurityQuestion;
  securityAnswer: string;
}

export interface RegisteredUserData {
  username: string;
  role: string;
  deluxeToken: string;
  lastLoginIp: string;
  profileImage: string;
  isActive: boolean;
  id: number;
  email: string;
  updatedAt: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface RegisterUserResponse {
  status: string;
  data: RegisteredUserData;
}

// Helper to generate register payload with sensible defaults
export function createRegisterUserRequest(
  email: string,
  password: string,
  securityAnswer = '03/29/70',
  securityQuestionId = 3,
  securityQuestionText = "Mother's birth date? (MM/DD/YY)"
): RegisterUserRequest {
  const nowIso = new Date().toISOString();
  return {
    email,
    password,
    passwordRepeat: password,
    securityQuestion: {
      id: securityQuestionId,
      question: securityQuestionText,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    securityAnswer,
  };
}
