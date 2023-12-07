import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { Category } from './entities/category.entity';
import { fieldsIdChecker, fieldsValidator } from '../utils/util';
import { Stream } from 'stream';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category) private categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryInput: CreateCategoryInput) {

    try {
      const newCategoryInput = this.categoryRepository.create({
        name: createCategoryInput.name,
      });
      return this.categoryRepository.save(newCategoryInput);
    } catch (e) {
      throw new HttpException(
        'An Error have when inserting data , please check the all required fields are filled ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

 async findAll( fields: string[]) {
    const allowedRelations = [
      'candidates',
      'settings',
      'candidates.team',
    ];

    // validating fields
    fields = fieldsValidator(fields, allowedRelations);
    // checking if fields contains id
    fields = fieldsIdChecker(fields);

    try {
      const queryBuilder = this.categoryRepository.createQueryBuilder('category')
        .leftJoinAndSelect('category.candidates', 'candidates')
        .leftJoinAndSelect('category.settings', 'settings')
        .leftJoinAndSelect('candidates.team', 'team');


      queryBuilder.select(
        fields.map(column => {   
          const splitted = column.split('.');

          if (splitted.length > 1) {
            return `${splitted[splitted.length - 2]}.${splitted[splitted.length - 1]}`;
          } else {
            return `category.${column}`;
          }
        }),
      );
      const category = await queryBuilder.getMany();
      return category;
    } catch (e) {
      throw new HttpException(
        'An Error have when finding category ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

 async findOne(id: number , fields: string[]) {
  const allowedRelations = [
    'candidates',
    'programmes',
    'settings',
    'candidates.team'
  ];

  // validating fields
  fields = fieldsValidator(fields, allowedRelations);
  // checking if fields contains id
  fields = fieldsIdChecker(fields);
  
    const queryBuilder = this.categoryRepository.createQueryBuilder('category')
      .where('category.id = :id', { id })
        .leftJoinAndSelect('category.candidates', 'candidates')
        .leftJoinAndSelect('category.programmes', 'programmes')
        .leftJoinAndSelect('category.settings', 'settings')
        .leftJoinAndSelect('candidates.team', 'team');

        try {

      queryBuilder.select(
        fields.map(column => {
          const splitted = column.split('.');

          if (splitted.length > 1) {
            return `${splitted[splitted.length - 2]}.${splitted[splitted.length - 1]}`;
          } else {
            return `category.${column}`;
          }
        }),
      );
      const category = await queryBuilder.getOne();
      
      return category;
    } catch (e) {
      throw new HttpException(
        'An Error have when finding category ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  findOneByName(name: string) {
    if (!name) {
      throw new HttpException(`category cannot be undefined`, HttpStatus.BAD_REQUEST);
    }
    try {
      const category = this.categoryRepository.findOne({
        where: {
          name,
        },
        relations: [ 'programmes', 'settings'],
      });
      if (!category) {
        throw new HttpException(`can't find category with id ${name}`, HttpStatus.BAD_REQUEST);
      }

      return category;
    } catch (e) {
      throw new HttpException(
        'An Error have when finding data ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  async findManyByName(names: string[] , fields: string[] , team : string ='') {
    const allowedRelations = [
      'candidates',
      'programmes',
      'programmes.candidateProgramme',
      'programmes.candidateProgramme.candidate',
      'programmes.CandidateProgramme.zonalgrade',
      'programmes.candidateProgramme.position',
      'settings',
      'candidates.team',
    ];

    // validating fields
    fields = fieldsValidator(fields, allowedRelations);
    // checking if fields contains id
    fields = fieldsIdChecker(fields);

    const queryBuilder = this.categoryRepository.createQueryBuilder('category')
      .where('category.name IN (:...names)', { names })
      .leftJoinAndSelect('category.candidates', 'candidates')
      .leftJoinAndSelect('category.programmes', 'programmes')
      .leftJoinAndSelect('programmes.candidateProgramme', 'candidateProgramme')
      .leftJoinAndSelect('candidateProgramme.candidate', 'candidate')
      .leftJoinAndSelect('CandidateProgramme.zonalgrade', 'grade')
      .leftJoinAndSelect('candidateProgramme.position', 'position')
      .leftJoinAndSelect('category.settings', 'settings')
      .leftJoinAndSelect('candidates.team', 'team');
      
    try {
      queryBuilder.select(
        fields.map(column => {  
          const splitted = column.split('.');

          if (splitted.length > 1) {
            return `${splitted[splitted.length - 2]}.${splitted[splitted.length - 1]}`;
          } else {
            return `category.${column}`;
          }
        }),
      );

      // if candidate is not empty then add the fields of team to the query
      if(team){
        queryBuilder.addSelect(['team.id' , 'team.name']);
      }

      const category = await queryBuilder.getMany();

      if(team){
        const filteredCategory = category.filter((category ) => {
          if(category.candidates ){
            console.log(category.candidates);
            
          const filteredCandidates = category.candidates.filter((candidate) => {
            return candidate.team.name === team;
          });
          category.candidates = filteredCandidates;
        }
        })
        
        if(filteredCategory.length > 0){
          return filteredCategory;
        }
      }

      return category;
    }
    catch (e) {
      console.log(e.message);
      
      throw new HttpException(
        'An Error have when finding data ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }


  }

  async update(id: number, updateCategoryInput: UpdateCategoryInput) {

    const category = await this.findOne(id , ['id'])


    try {
      Object.assign(category,{
        id,
        name: updateCategoryInput.name,
      })
      return this.categoryRepository.save(category);
    } catch (e) {
      throw new HttpException(
        'An Error have when updating data , please check the all required fields are filled ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  async remove(id: number) {
    const programme = await this.categoryRepository.findOneBy({ id });

    if (!programme) {
      throw new HttpException(`Cant find a category to delete`, HttpStatus.BAD_REQUEST);
    }

    try {
      return this.categoryRepository.delete(id);
    } catch (e) {
      throw new HttpException(
        'An Error have when deleting data ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }


  async addSettingsToCategory(id: number, category: Category) {
    // checking is category exist
    const categoryData = this.categoryRepository.findOneBy({ id });

    if (!categoryData) {
      throw new HttpException('Invalid category name ', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      return this.categoryRepository.save(category);
    } catch (e) {
      throw new HttpException(
        'An Error have when finding data of category',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }
  
}
