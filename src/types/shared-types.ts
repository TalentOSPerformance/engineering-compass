/** Tipos extraídos para uso standalone (Lovable). */
export type UserRole = 'admin' | 'developer' | 'viewer';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  organizationId?: string;
  personId?: string;
}
