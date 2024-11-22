export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
}

export interface UserRegistrationData {
  email: string;
  password: string;
  name: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
}
