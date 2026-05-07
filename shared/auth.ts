export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
};

export type AuthSessionResponse = {
  user: AuthUser | null;
};

export type AuthRegisterRequest = {
  email: string;
  password: string;
  displayName?: string;
};

export type AuthLoginRequest = {
  email: string;
  password: string;
};
