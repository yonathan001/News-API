import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface JwtPayload {
  sub: string;
  role: 'author' | 'reader';
}

export const generateToken = (userId: string, role: 'author' | 'reader'): string => {
  const payload: JwtPayload = {
    sub: userId,
    role,
  };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiration });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
};
