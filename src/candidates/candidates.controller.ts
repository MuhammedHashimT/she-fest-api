// app.controller.ts
import {
  Body,
    Controller,
    Post,
    UploadedFile,
    UploadedFiles,
    UseInterceptors,
  } from '@nestjs/common';
  import { CloudinaryService } from '../cloudinary/cloudinary.service';
  import { AnyFilesInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CandidatesService } from './candidates.service';
  
  @Controller('candidates')
  export class CandidatesController {
    constructor(private readonly cloudinaryService: CloudinaryService , 
        private readonly candidateService: CandidatesService
      ) { }
  
    @Post('avatar')
    @UseInterceptors(FileInterceptor('file'))
   async uploadImage(@UploadedFile() file: Express.Multer.File , @Body('chestNo') chestNo: string , @Body('IamReady') iamReady: boolean ) {
      const cdt = await this.candidateService.uploadFile(file , chestNo , iamReady);
      console.log(cdt);
      return cdt;
      
    }
  
    @Post('uploads')
    @UseInterceptors(AnyFilesInterceptor())
    uploadImages(@UploadedFiles() files: Array<Express.Multer.File>) {
      return this.cloudinaryService.uploadFiles(files);
    }
  }