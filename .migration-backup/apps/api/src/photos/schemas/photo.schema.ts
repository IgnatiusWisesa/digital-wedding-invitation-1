import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PhotoDocument = Photo & Document;

@Schema({ timestamps: true })
export class Photo {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  public_id: string;

  @Prop()
  filename: string;

  @Prop()
  guestId: string;
}

export const PhotoSchema = SchemaFactory.createForClass(Photo);
