import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Photo, PhotoDocument } from './schemas/photo.schema';

@Injectable()
export class PhotosService {
  constructor(@InjectModel(Photo.name) private photoModel: Model<PhotoDocument>) {}

  async create(filename: string, guestId: string): Promise<Photo> {
    const newPhoto = new this.photoModel({ filename, guestId });
    return newPhoto.save();
  }

  async findAll(): Promise<Photo[]> {
    return this.photoModel.find().sort({ createdAt: -1 }).exec();
  }

  async delete(id: string): Promise<any> {
    const photo = await this.photoModel.findById(id).exec();
    if (photo) {
      const filePath = `./uploads/${photo.filename}`;
      const fs = await import('fs');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return this.photoModel.deleteOne({ _id: id }).exec();
    }
  }
}
