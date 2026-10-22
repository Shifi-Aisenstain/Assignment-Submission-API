import jwt from 'jsonwebtoken';

const SECRET_KEY: string = process.env.JWT_SECRET || (() => {
  throw new Error("JWT_SECRET is not set. Copy .env.example to .env and set it.");
})();

export class AuthService {
  generateToken(_id: string | object, role: string): string {
    const payload = { role, _id };
    return jwt.sign(payload, SECRET_KEY, { expiresIn: "1y" });
  }
  verifyToken(token: string): any {
        return jwt.verify(token, SECRET_KEY);
  }
}