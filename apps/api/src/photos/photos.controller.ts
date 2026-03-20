import { Controller, Post, Get, UseInterceptors, UploadedFile, Body, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PhotosService } from './photos.service';
import * as fs from 'fs';

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      }
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit (we compress on frontend anyway)
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    }
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body('guestId') guestId: string) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const savedPhoto = await this.photosService.create(file.filename, guestId || 'anonymous');
    return {
      message: 'Photo uploaded successfully',
      photo: savedPhoto,
    };
  }

  @Get()
  async getPhotos() {
    return this.photosService.findAll();
  }

  @Post(':id/delete') // Using POST for easier admin bypass if needed, or stick to DELETE
  async deletePhoto(@Body('id') id: string) {
    return this.photosService.delete(id);
  }
}
