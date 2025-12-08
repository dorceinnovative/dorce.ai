import { IsEmail, IsString, MinLength, IsPhoneNumber } from "class-validator"

export class RegisterDto {
  @IsEmail()
  email: string

  @IsPhoneNumber("NG")
  phone: string

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  password: string

  @IsString()
  firstName?: string

  @IsString()
  lastName?: string
}
