import { z } from 'zod';
import { userSchema } from '@/contracts/auth';
import type { PasswordChange, ProfileUpdate } from '@/contracts/profile';
import { walletSchema, type WalletInput, type WalletRole } from '@/contracts/wallet';
import { http, request } from '@/lib/http';

export function fetchProfile(signal?: AbortSignal) {
  return request(userSchema, { url: '/profile', signal });
}

export function updateProfile(input: ProfileUpdate) {
  return request(userSchema, { method: 'PATCH', url: '/profile', data: input });
}

export function uploadAvatar(file: File) {
  const form = new FormData();
  form.append('avatar', file);
  return request(userSchema, {
    method: 'PUT',
    url: '/profile/avatar',
    data: form,
    headers: { 'Content-Type': null },
  });
}

export async function changePassword(input: PasswordChange) {
  await http.put('/profile/password', input);
}

export function fetchWallets(signal?: AbortSignal) {
  return request(z.array(walletSchema), { url: '/wallets', signal });
}

export function saveWallet({ role, input }: { role: WalletRole; input: WalletInput }) {
  return request(z.array(walletSchema), { method: 'PUT', url: `/wallets/${role}`, data: input });
}
