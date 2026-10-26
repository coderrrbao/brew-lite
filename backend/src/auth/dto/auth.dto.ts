import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
}

export class RegisterDto extends LoginDto {
  @IsOptional() @IsString() name?: string;
}
