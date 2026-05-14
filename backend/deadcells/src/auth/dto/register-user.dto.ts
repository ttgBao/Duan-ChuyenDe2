// register-user.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Matches,
  MinLength,
  Min,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @Matches(/@fit\.tdc\.edu\.vn$/, {
    message: 'Chỉ chấp nhận email sinh viên @fit.tdc.edu.vn',
  })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  @Matches(/(?=.*[A-Z])/, { message: 'Mật khẩu phải có ít nhất 1 chữ hoa' })
  @Matches(/(?=.*[a-z])/, { message: 'Mật khẩu phải có ít nhất 1 chữ thường' })
  @Matches(/(?=.*\d)/, { message: 'Mật khẩu phải có ít nhất 1 chữ số' })
  password: string;

  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  nickname: string;

  @IsOptional()
  @Matches(/^[0-9]{10}$/, { message: 'Số điện thoại phải gồm đúng 10 chữ số' })
  phone?: string;

  @IsNumber()
  @Min(1, { message: 'Vui lòng chọn Khoa hợp lệ' })
  group_id: number;
}
