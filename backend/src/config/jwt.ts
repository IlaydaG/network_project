import jwt from 'jsonwebtoken';
import { JwtYuku } from '../types';

const JWT_SIRRI = process.env.JWT_SECRET || 'varsayilan-gizli-anahtar-degistirin';
const JWT_SURESI = process.env.JWT_EXPIRES_IN || '8h';

export const tokenOlustur = (yuk: Omit<JwtYuku, 'iat' | 'exp'>): string => {
  return jwt.sign(yuk, JWT_SIRRI, { expiresIn: JWT_SURESI } as jwt.SignOptions);
};

export const tokenDogrula = (token: string): JwtYuku => {
  return jwt.verify(token, JWT_SIRRI) as JwtYuku;
};
