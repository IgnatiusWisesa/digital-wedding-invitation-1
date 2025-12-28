import { IsString, IsNotEmpty, IsOptional, MaxLength, IsIn, IsNumber, Min, Max } from 'class-validator';

export class CreateRsvpDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    attendanceChoice: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    note?: string;

    @IsString()
    @IsNotEmpty()
    @IsIn(['Hadir', 'Tidak'])
    attendanceStatus: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(20)
    guestQuota?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(20)
    guestCount?: number;
}
