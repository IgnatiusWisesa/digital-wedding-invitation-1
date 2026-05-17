import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Photo, PhotoDocument } from './schemas/photo.schema';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';

@Injectable()
export class PhotosService implements OnModuleInit {
  constructor(
    @InjectModel(Photo.name) private photoModel: Model<PhotoDocument>,
    private configService: ConfigService,
  ) { }

  onModuleInit() {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadToCloudinary(filePath: string, guestId: string): Promise<Photo> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'wedding_invitation',
      });

      // Delete local temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const newPhoto = new this.photoModel({
        url: result.secure_url,
        public_id: result.public_id,
        filename: result.original_filename,
        guestId,
      });

      return newPhoto.save();
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  async findAll(): Promise<Photo[]> {
    return this.photoModel.find().sort({ createdAt: -1 }).exec();
  }

  async delete(id: string): Promise<any> {
    const photo = await this.photoModel.findById(id).exec();
    if (photo) {
      // Delete from Cloudinary
      if (photo.public_id) {
        await cloudinary.uploader.destroy(photo.public_id);
      } else {
        // Fallback for old local files
        const filePath = `./uploads/${photo.filename}`;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return this.photoModel.deleteOne({ _id: id }).exec();
    }
  }
}
