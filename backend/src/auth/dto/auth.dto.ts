import { Transform } from 'class-transformer';
import {
  IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength,
} from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class LoginDto {
   @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(1, { message: 'Vui lòng nhập mật khẩu' })
  @MaxLength(128, { message: 'Mật khẩu tối đa 128 ký tự' })
  password: string;
}

export class RegisterDto {
 @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @MaxLength(72, { message: 'Mật khẩu tối đa 72 ký tự' })
  password: string;

  @IsOptional()
  @IsString({ message: 'Tên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  @MaxLength(100, { message: 'Tên tối đa 100 ký tự' })
  name?: string;
}