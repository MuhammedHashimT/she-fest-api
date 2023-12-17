import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTeamInput } from './dto/create-team.input';
import { UpdateTeamInput } from './dto/update-team.input';
import { Team } from './entities/team.entity';
import { fieldsIdChecker, fieldsValidator } from 'src/utils/util';
import { ZoneService } from 'src/zone/zone.service';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team) private teamRepository: Repository<Team>,
    private zoneService: ZoneService,
  ) {}

 async  create(createTeamInput: CreateTeamInput) {

    const { name,zoneId } = createTeamInput;

      const zone = await this.zoneService.findOne(zoneId);

      if (!zone) {
        throw new HttpException(
          `cant find zone with id ${zoneId}`,
          HttpStatus.BAD_REQUEST,
        );
      }

    try {
      const newTeamInput = this.teamRepository.create({
        name,
        zone,
      });
      return this.teamRepository.save(newTeamInput);
    } catch (e) {
      throw new HttpException(
        'An Error have when creating team ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  // create many teams

  async createMany(createTeamInput: CreateTeamInput[]) {
    const teams = []
    try {

    //  loop through the array and create each team
      for (let index = 0; index < createTeamInput.length; index++) {
        const element = createTeamInput[index];

        const { name,zoneId } = element;

        const zone = await this.zoneService.findOne(zoneId);

        if (!zone) {
          throw new HttpException(
            `cant find zone with id ${zoneId}`,
            HttpStatus.BAD_REQUEST,
          );
        }

        const newTeamInput = this.teamRepository.create({
          name,
          zone,
        });

        await this.teamRepository.save(newTeamInput);

        teams.push(newTeamInput);
      }

      return teams;

    } catch (e) {
      throw new HttpException(
        'An Error have when creating team ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  async findAll(fields: string[]) {
    const allowedRelations = [
      'candidates',
      'candidates.candidateProgrammes',
      'candidates.category',
      'candidates.candidateProgrammes.programme',
      'zone'
    ];

    // any field that contains . as relation and not in the list will removed from the list
    fields = fieldsValidator(fields, allowedRelations);

    fields = fieldsIdChecker(fields);

    try {
      const queryBuilder = this.teamRepository
        .createQueryBuilder('team')
        .leftJoinAndSelect('team.zone', 'zone')
        .leftJoinAndSelect('team.candidates', 'candidates')
        .leftJoinAndSelect('candidates.candidateProgrammes', 'candidateProgrammes')
        .leftJoinAndSelect('candidates.category', 'category')
        .leftJoinAndSelect('candidateProgrammes.programme', 'programme')
        .orderBy('team.name', 'ASC');

      queryBuilder.select(
        fields.map(column => {
          const splitted = column.split('.');

          if (splitted.length > 1) {
            return `${splitted[splitted.length - 2]}.${splitted[splitted.length - 1]}`;
          } else {
            return `team.${column}`;
          }
        }),
      );

      const team = await queryBuilder.getMany();
      return team;
    } catch (e) {
      throw new HttpException(
        'An Error have when finding team ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  async findOne(id: number, fields: string[]) {
    if (!id) {
      throw new HttpException(`team cannot be undefined`, HttpStatus.BAD_REQUEST);
    }

    const allowedRelations = [
      'candidates',
      'candidates.candidateProgrammes',
      'candidates.category',
      'candidates.candidateProgrammes.programme',
      'credentials',
      'credentials.categories',
    ];

    // validating fields
    fields = fieldsValidator(fields, allowedRelations);
    // checking if fields contains id
    fields = fieldsIdChecker(fields);

    try {
      const queryBuilder = this.teamRepository
        .createQueryBuilder('team')
        .where('team.id = :id', { id })
        .leftJoinAndSelect('team.candidates', 'candidates')
        .leftJoinAndSelect('candidates.candidateProgrammes', 'candidateProgrammes')
        .leftJoinAndSelect('candidates.category', 'category')
        .leftJoinAndSelect('candidateProgrammes.programme', 'programme')
        .leftJoinAndSelect('team.credentials', 'credentials')
        .leftJoinAndSelect('credentials.categories', 'categories');

      queryBuilder.select(
        fields.map(column => {
          const splitted = column.split('.');

          if (splitted.length > 1) {
            return `${splitted[splitted.length - 2]}.${splitted[splitted.length - 1]}`;
          } else {
            return `team.${column}`;
          }
        }),
      );
      const team = await queryBuilder.getOne();
      return team;
    } catch (e) {
      throw new HttpException(
        'An Error have when finding team ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  async findOneByName(name: string, fields: string[]) {
    if (!name) {
      throw new HttpException(`team cannot be undefined`, HttpStatus.BAD_REQUEST);
    }

    const allowedRelations = [
      'candidates',
      'candidates.cgp',
      'candidates.candidateProgrammes',
      'candidates.category',
      'candidates.candidateProgrammes.programme',
      'zone'
    ];

    // validating fields
    fields = fieldsValidator(fields, allowedRelations);
    // checking if fields contains id
    fields = fieldsIdChecker(fields);

    try {
      const queryBuilder = this.teamRepository
        .createQueryBuilder('team')
        .where('team.name = :name', { name })
        .leftJoinAndSelect('team.zone', 'zone')
        .leftJoinAndSelect('team.candidates', 'candidates')
        .leftJoinAndSelect('candidates.candidateProgrammes', 'candidateProgrammes')
        .leftJoinAndSelect('candidates.cgp', 'cgp')
        .leftJoinAndSelect('candidates.category', 'category')
        .leftJoinAndSelect('candidateProgrammes.programme', 'programme')
        .orderBy('team.name', 'ASC');

      queryBuilder.select(
        fields.map(column => {
          const splitted = column.split('.');

          if (splitted.length > 1) {
            return `${splitted[splitted.length - 2]}.${splitted[splitted.length - 1]}`;
          } else {
            return `team.${column}`;
          }
        }),
      );
      const team = await queryBuilder.getOne();

      if (!team) {
        throw new HttpException(`cant find team with name ${name}`, HttpStatus.BAD_REQUEST);
      }

      
      // change in team of candiates what in cgp to candidateProgrammes with what already in candidateProgrammes

      const candidates = team.candidates.map(candidate => {
        const candidateProgrammes = candidate.cgp.map(cgp => {
          return {
            ...cgp,
            candidateProgrammes: candidate.candidateProgrammes
          }
        })

        return {
          ...candidate,
          candidateProgrammes
        }
      })

      team.candidates = candidates;
       
      return team;
    } catch (e) {
      throw new HttpException(
        'An Error have when finding team ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  async update(id: number, updateTeamInput: UpdateTeamInput) {
    const team = await this.teamRepository.findOneBy({ id });

    if (!team) {
      throw new HttpException(`cant find team with id ${id}`, HttpStatus.BAD_REQUEST);
    }
    try {
      return this.teamRepository.update(id, updateTeamInput);
    } catch (e) {
      throw new HttpException(
        'An Error have when updating team ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  // update many teams

  async updateMany(updateTeamInput: UpdateTeamInput[]) {
    const teams = []
    try {

    //  loop through the array and create each team
      for (let index = 0; index < updateTeamInput.length; index++) {
        const element = updateTeamInput[index];

        const { id } = element;

        const team = await this.teamRepository.findOneBy({ id });

        if (!team) {
          throw new HttpException(`cant find team with id ${id}`, HttpStatus.BAD_REQUEST);
        }

        await this.teamRepository.update(id, element);

        teams.push(team);
      }

      return teams;

    } catch (e) {
      throw new HttpException(
        'An Error have when updating team ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  async remove(id: number) {
    const team = await this.teamRepository.findOneBy({ id });

    if (!team) {
      throw new HttpException(`cant find team with id ${id}`, HttpStatus.BAD_REQUEST);
    }
    try {
      return this.teamRepository.delete(id);
    } catch (e) {
      throw new HttpException(
        'An Error have when deleting team ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  // get category based team leader board

  async getCategoryBasedToppers() {
    // to do that check all candidate programmes of this category and team and add all of them to team point which initialized variable here

    // get all teams
    const teams = await this.teamRepository.find();

    // get all candidate programmes
    const candidateProgrammes = await this.teamRepository.find();

    // get all categories
    const categories = await this.teamRepository.find();


  }

  async setLastResult(id: number, lastResult: number) {
    const team = await this.teamRepository.findOneBy({ id });

    if (!team) {
      throw new HttpException(`cant find team with id ${id}`, HttpStatus.BAD_REQUEST);
    }

    try {
      return this.teamRepository.save({
        ...team,
        lastResultPoint: lastResult,
      });
    } catch (e) {
      throw new HttpException(
        'An Error have when inserting last result ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  async setTeamPoint(
    id: number,
    tPoint: number,
    gPoint: number = 0,
    iPoint: number = 0,
    hPoint: number = 0,
  ) {
    const team: Team = await this.teamRepository.findOneBy({ id });
    if (!team) {
      throw new HttpException(`cant find team with id ${id}`, HttpStatus.BAD_REQUEST);
    }

    // declaring variables

    let totalPoint: number = team.totalPoint || 0;
    let HousePoint: number =team.HousePoint || 0;
    let GroupPoint: number = team.GroupPoint || 0;
    let IndividualPoint: number = team.IndividualPoint || 0;

    // checking if the programme is arts or sports
      totalPoint = totalPoint + tPoint;
      HousePoint = HousePoint + hPoint;
      GroupPoint = GroupPoint + gPoint;
      IndividualPoint = IndividualPoint + iPoint;

    try {
      // saving the team
      return this.teamRepository.save({
        ...team,
        totalPoint,
        HousePoint,
        GroupPoint,
        IndividualPoint
      });
    } catch (e) {
      throw new HttpException(
        'An Error have when inserting total point ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }
}
