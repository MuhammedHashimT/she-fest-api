// app.controller.ts
import {
  Body,
    Controller,
    HttpException,
    HttpStatus,
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
   async uploadImage(@UploadedFile() file: Express.Multer.File , @Body('chestNo') chestNo: string , @Body('IamReady') iamReady: boolean , @Body('iNeedFoodAndAccommodation') iNeedFoodAndAccommodation: boolean  ) {
    if ( !chestNo) {
      throw new HttpException(`Chest No not found`, HttpStatus.BAD_REQUEST);
    }



     // Check the file size
     if (file?.size > 1000000) {
      throw new HttpException(`File size must be less than 1 MB`, HttpStatus.BAD_REQUEST);
    }

      const cdt = await  this.candidateService.uploadFile(file , chestNo , iamReady , iNeedFoodAndAccommodation);
      console.log(cdt);
      return cdt;
      
    }
  
    @Post('uploads')
    @UseInterceptors(AnyFilesInterceptor())
    uploadImages(@UploadedFiles() files: Array<Express.Multer.File>) {
      return this.cloudinaryService.uploadFiles(files);
    }
  }