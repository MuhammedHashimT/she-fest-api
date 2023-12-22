import { Module } from '@nestjs/common';
import { ProgrammesService } from './programmes.service';
import { ProgrammesResolver } from './programmes.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Programme } from './entities/programme.entity';
import { CategoryModule } from 'src/category/category.module';
import { CredentialsModule } from 'src/credentials/credentials.module';
import { DetailsModule } from 'src/details/details.module';
import { TeamsModule } from 'src/teams/teams.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Programme]),
    CategoryModule,
    CredentialsModule,
    DetailsModule,
    TeamsModule,
  ],
  providers: [ProgrammesResolver, ProgrammesService],
  exports: [ProgrammesService],
})
export class ProgrammesModule {}
