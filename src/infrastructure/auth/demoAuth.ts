/**
 * DEMO AUTH — Solo para MVP/desarrollo.
 * ⚠️  En producción reemplazar por: Cloudflare Access, JWT firmado,
 *     Supabase Auth real, o proveedor de identidad corporativo.
 *     Las contraseñas aquí son de demostración y NO deben usarse en producción.
 */

import type { Permission } from '../../application/services/rbac';
import { ALL_PERMISSIONS } from '../../application/services/rbac';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'agent';
  permissions: Permission[];
  isActive: boolean;
}

export interface DemoSession {
  userId: string;
  email: string;
  loginAt: string;
}

// ⚠️  CREDENCIALES DEMO — reemplazar en producción
const DEMO_USERS: DemoUser[] = [
  {
    id: 'u_prueba1',
    name: 'Admin Maihue',
    email: 'prueba1@maihue.cl',
    role: 'admin',
    permissions: ALL_PERMISSIONS,
    isActive: true,
  },
  {
    id: 'u_franco',
    name: 'Franco Viveros',
    email: 'franco@maihue.cl',
    role: 'admin',
    permissions: ALL_PERMISSIONS,
    isActive: true,
  },
  {
    id: 'u_carla',
    name: 'Carla Ventas',
    email: 'carla@maihue.cl',
    role: 'agent',
    permissions: [
      'conversations.read.assigned',
      'conversations.assign',
      'conversations.close',
      'funnels.read',
      'campaigns.read',
      'pools.read',
      'users.read',
    ],
    isActive: true,
  },
  {
    id: 'u_paula',
    name: 'Paula SAC',
    email: 'paula@maihue.cl',
    role: 'agent',
    permissions: [
      'conversations.read.assigned',
      'conversations.assign',
      'conversations.close',
      'funnels.read',
      'campaigns.read',
      'pools.read',
      'users.read',
    ],
    isActive: true,
  },
];

// ⚠️  Passwords en texto plano solo válido para demo MVP
const DEMO_PASSWORDS: Record<string, string> = {
  'prueba1@maihue.cl': 'prueba1',
  'franco@maihue.cl': 'franco123',
  'carla@maihue.cl': 'carla123',
  'paula@maihue.cl': 'paula123',
};

export function demoLogin(email: string, password: string): DemoUser {
  const normalizedEmail = email.trim().toLowerCase();
  const expectedPassword = DEMO_PASSWORDS[normalizedEmail];
  if (!expectedPassword || expectedPassword !== password) {
    throw new Error('Credenciales incorrectas');
  }
  const user = DEMO_USERS.find((u) => u.email === normalizedEmail);
  if (!user) throw new Error('Usuario no encontrado');
  if (!user.isActive) throw new Error('Usuario inactivo');
  return user;
}

export function getDemoUserById(id: string): DemoUser | undefined {
  return DEMO_USERS.find((u) => u.id === id);
}

export function getDemoUserByEmail(email: string): DemoUser | undefined {
  return DEMO_USERS.find((u) => u.email === email.trim().toLowerCase());
}

export { DEMO_USERS };
