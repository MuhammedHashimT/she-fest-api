import { Module, forwardRef } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryResolver } from './category.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CredentialsModule } from 'src/credentials/credentials.module';

@Module({
  imports:[ TypeOrmModule.forFeature([Category])  ,  forwardRef(() => CredentialsModule),],
  providers: [CategoryResolver, CategoryService],
  exports:[CategoryService]
})
export class CategoryModule {}
