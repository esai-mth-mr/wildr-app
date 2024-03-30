import { IsString } from 'class-validator';

export class PostSearchBodyDTO {
  @IsString()
  searchQuery: string;
}
