import { Injectable } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import * as jwt from "jsonwebtoken"
import { JwtSecretService } from "../jwt-secret.service"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private jwtSecretService: JwtSecretService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (request: any, rawJwtToken: string, done: (err: any, secret?: string | Buffer) => void) => {
        try {
          const header = jwt.decode(rawJwtToken, { complete: true }) as any
          const kid = header?.header?.kid
          const secret = jwtSecretService.findSecret(kid, 'access')
          done(null, secret || (process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "development-secret-key-change-in-production"))
        } catch (e) {
          done(null, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "development-secret-key-change-in-production")
        }
      },
    })
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email, role: payload.role }
  }
}
