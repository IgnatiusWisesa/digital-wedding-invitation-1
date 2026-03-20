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
}
