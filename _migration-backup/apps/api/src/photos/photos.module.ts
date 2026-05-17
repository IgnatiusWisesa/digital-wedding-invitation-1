import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { Photo, PhotoSchema } from './schemas/photo.schema';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Photo.name, schema: PhotoSchema }]),
    ConfigModule,
  ],
  controllers: [PhotosController],
  providers: [PhotosService],
})
export class PhotosModule {}
