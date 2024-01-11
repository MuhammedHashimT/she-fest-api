// app.controller.ts
import {
    Controller,
    Post,
    UploadedFile,
    UploadedFiles,
    UseInterceptors,
  } from '@nestjs/common';
  import { CloudinaryService } from '../cloudinary/cloudinary.service';
  import { AnyFilesInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
  
  @Controller('candidates')
  export class CandidatesController {
    constructor(private readonly cloudinaryService: CloudinaryService) { }
  
    @Post('avatar')
    @UseInterceptors(FileInterceptor('file'))
    uploadImage(@UploadedFile() file: Express.Multer.File) {
      return this.cloudinaryService.uploadFile(file);
    }
  
    @Post('uploads')
    @UseInterceptors(AnyFilesInterceptor())
    uploadImages(@UploadedFiles() files: Array<Express.Multer.File>) {
      return this.cloudinaryService.uploadFiles(files);
    }
  }