import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateZoneInput } from './dto/create-zone.input';
import { UpdateZoneInput } from './dto/update-zone.input';
import { Repository } from 'typeorm';
import { Zone } from './entities/zone.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ZoneService {

  constructor(@InjectRepository(Zone) private zoneRepository: Repository<Zone>,) {
    
  }

  create(createZoneInput: CreateZoneInput) {
    // create zone

    try{
      const newZone = this.zoneRepository.create({
        name: createZoneInput.name,
      });
      return this.zoneRepository.save(newZone);
    }catch(e){
      throw new HttpException(
        'An Error have when inserting data , please check the all required fields are filled ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
    
  }

  findAll() {
    try{
      return this.zoneRepository.find({
        relations: ['teams'],
      });
    }
    catch(e){
      throw new HttpException(
        'An Error have when inserting data , please check the all required fields are filled ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  findOne(id: number) {
    try{
      return this.zoneRepository.findOne({
        where: {
          id: id,
        },
      });
    }
    catch(e){
      throw new HttpException(
        'An Error have when inserting data , please check the all required fields are filled ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  update(id: number, updateZoneInput: UpdateZoneInput) {
    try{
      const updateZone = this.zoneRepository.create({
        id: id,
        name: updateZoneInput.name,
      });
      return this.zoneRepository.save(updateZone);
    }
    catch(e){
      throw new HttpException(
        'An Error have when inserting data , please check the all required fields are filled ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  remove(id: number) {
    try{
      return this.zoneRepository.delete({
        id: id,
      });
    }
    catch(e){
      throw new HttpException(
        'An Error have when inserting data , please check the all required fields are filled ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }
}
