import type { UserRole } from '../../domain/types';

export interface UserOption {
  name: string;
  role: UserRole;
}

export const mockUsers: UserOption[] = [
  {
    name: 'Admin Maihue',
    role: 'admin'
  },
  {
    name: 'Supervisor Comercial',
    role: 'supervisor'
  },
  {
    name: 'Ejecutiva Ventas',
    role: 'agent'
  }
];