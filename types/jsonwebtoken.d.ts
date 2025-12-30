declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: any;
  }

  export interface SignOptions {
    expiresIn?: string | number;
    [key: string]: any;
  }

  export function sign(payload: string | Buffer | object, secretOrPrivateKey: string, options?: SignOptions): string;
  export function verify(token: string, secretOrPublicKey: string): JwtPayload | string;
}
