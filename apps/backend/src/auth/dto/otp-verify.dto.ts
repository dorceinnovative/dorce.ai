import { IsString, Matches } from "class-validator"

export class OtpVerifyDto {
  @IsString()
  contact: string

  @IsString()
  @Matches(/^\d{6}$/, { message: "OTP must be 6 digits" })
  code: string
}
