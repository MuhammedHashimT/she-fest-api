import { Module } from '@nestjs/common';
import { ZoneService } from './zone.service';
import { ZoneResolver } from './zone.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Zone } from './entities/zone.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Zone,
    ]),
  ],
  providers: [ZoneResolver, ZoneService]
})
export class ZoneModule {}
