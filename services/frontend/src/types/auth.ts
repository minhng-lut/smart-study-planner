export type AuthRole = 'student' | 'admin';

export type AuthUser = {
  id: number;
  email: string;
  role: AuthRole;
};

export type Credentials = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: AuthUser;
};

export type CurrentUserResponse = {
  user: AuthUser;
};
