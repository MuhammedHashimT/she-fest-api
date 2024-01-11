import { Module, forwardRef } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CandidatesResolver } from './candidates.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from './entities/candidate.entity';
import { TeamsModule } from 'src/teams/teams.module';
import { CategoryModule } from 'src/category/category.module';
import { CredentialsModule } from 'src/credentials/credentials.module';
import { CandidateProgrammeModule } from 'src/candidate-programme/candidate-programme.module';
import { CategorySettingsModule } from 'src/category-settings/category-settings.module';
import { ProgrammesModule } from 'src/programmes/programmes.module';
import { CandidatesController } from './candidates.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidate]),
    TeamsModule,
    CategoryModule,
    CredentialsModule,
    CategorySettingsModule ,
    ProgrammesModule,
    forwardRef(() => CandidateProgrammeModule),
    CloudinaryModule
  ],
  providers: [CandidatesResolver, CandidatesService],
  controllers : [CandidatesController],
  exports: [CandidatesService],
})
export class CandidatesModule {}
