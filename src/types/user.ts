export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
}

// Interface para dados de registro
export interface UserRegistrationData {
  email: string;
  password: string;
  name: string;
}

// Interface para dados de login
export interface UserLoginData {
  email: string;
  password: string;
}

// Interface para o payload do JWT
export interface JwtPayload {
  userId: string;
}

// Interface para usuário sem dados sensíveis (para retornar ao cliente)
export interface SafeUser {
  id: string;
  email: string;
  name: string;
}
