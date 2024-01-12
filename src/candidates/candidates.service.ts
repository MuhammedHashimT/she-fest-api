import { HttpException, HttpStatus, Injectable, UsePipes, ValidationPipe } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryService } from 'src/category/category.service';
import { TeamsService } from 'src/teams/teams.service';
import { In, Like, Repository } from 'typeorm';
import { CreateCandidateInput } from './dto/create-candidate.input';
import { UpdateCandidateInput } from './dto/update-candidate.input';
import { Candidate } from './entities/candidate.entity';
import { Category } from 'src/category/entities/category.entity';
import { Credential } from 'src/credentials/entities/credential.entity';
import { CandidateProgrammeService } from 'src/candidate-programme/candidate-programme.service';
import { Team } from 'src/teams/entities/team.entity';
import { CreateInput } from './dto/create-input.dto';
import { CredentialsService } from 'src/credentials/credentials.service';
import { fieldsIdChecker, fieldsValidator } from 'src/utils/util';
import { Type } from 'src/programmes/entities/programme.entity';
import { CategorySettings } from 'src/category-settings/entities/category-setting.entity';
import { CategorySettingsService } from 'src/category-settings/category-settings.service';
import { ProgrammesService } from 'src/programmes/programmes.service';
import { CandidateProgramme } from 'src/candidate-programme/entities/candidate-programme.entity';
import { CloudinaryResponse } from 'src/cloudinary/cloudinary-response';
import { v2 as cloudinary } from 'cloudinary';

const streamifier = require('streamifier');
// import { drive } from 'src/utils/googleApi.auth';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate) private candidateRepository: Repository<Candidate>,
    private teamService: TeamsService,
    private categoryService: CategoryService,
    private candidateProgrammeService: CandidateProgrammeService,
    private credentialService: CredentialsService,
    private categorySettingsService: CategorySettingsService,
    private programmeService: ProgrammesService,
  ) { }

  //  To create many candidates at a time , Normally using on Excel file upload

  async createMany(createCandidateInputArray: CreateInput, user: Credential) {
    // the final data variable
    var FinalData: Candidate[] = [];
    var allData: {
      category: Category;
      chestNO: string;
      name: string;
      team: Team;
    }[] = [];

    // Iterate the values and taking all the individuals

    for (let index = 0; index < createCandidateInputArray.inputs.length; index++) {
      const createCandidateInput = createCandidateInputArray.inputs[index];

      //  checking is category exist

      const category_id = await this.categoryService.findOneByName(createCandidateInput.category);

      if (!category_id) {
        throw new HttpException(
          `Cant find a category named ${createCandidateInput.category}  ,ie: check on Category of ${createCandidateInput.name}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // authenticating the user have permission to create the candidates

      this.credentialService.checkPermissionOnCategories(user, category_id.name);

      //  checking is team exist

      const team_id = await this.teamService.findOneByName(createCandidateInput.team, ['id']);

      if (!team_id) {
        throw new HttpException(
          `Cant find a team named ${createCandidateInput.team} ,ie: check on Team of ${createCandidateInput.name}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // checking is chessNo already exist
      const candidate = await this.candidateRepository.findOne({
        where: {
          chestNO: createCandidateInput.chestNO,
        },
      });

      if (candidate) {
        throw new HttpException(
          `Candidate with chess no ${createCandidateInput.chestNO} already exists ,ie: check on chessNo of ${createCandidateInput.name}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // checking is chestNo already exist in the array

      const chestNoExists = allData.some(data => data.chestNO === createCandidateInput.chestNO);

      if (chestNoExists) {
        throw new HttpException(
          `Multiple candidates have same chest no ${createCandidateInput.chestNO} ,ie: check on chestNo of ${createCandidateInput.name}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      allData.push({
        category: category_id,
        chestNO: createCandidateInput.chestNO,
        name: createCandidateInput.name,
        team: team_id,
      });
    }

    // looping the values

    try {
      // checking all candidates are checked

      if (allData.length !== createCandidateInputArray.inputs.length) {
        throw new HttpException(
          `Some candidates are not eligible to create ,ie: check on candidates`,
          HttpStatus.BAD_REQUEST,
        );
      }

      for (let index = 0; index < allData.length; index++) {
        const data = allData[index];

        // creating a instance of Candidate
        const input = new Candidate();

        // updating Value to candidate
        input.category = data.category;
        input.chestNO = data.chestNO;
        input.name = data.name;
        input.team = data.team;

        let saveData = await this.candidateRepository.save(input);

        FinalData.push(saveData);
      }

      return FinalData;
    } catch (e) {
      throw new HttpException(
        'An Error have when inserting data , please check the all required fields are filled ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  // create a single candidate
  async create(createCandidateInput: CreateCandidateInput, user: Credential): Promise<Candidate> {
    //  checking is category exist

    const category_id = await this.categoryService.findOneByName(createCandidateInput.category);

    if (!category_id) {
      throw new HttpException(
        `Cant find a category named ${createCandidateInput.category}  ,ie: check on Category of ${createCandidateInput.name}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // authenticating the user have permission to update the category

    this.credentialService.checkPermissionOnCategories(user, category_id.name);

    //  checking is team exist

    const team_id = await this.teamService.findOneByName(createCandidateInput.team, ['id']);

    if (!team_id) {
      throw new HttpException(
        `Cant find a team named ${createCandidateInput.team} ,ie: check on Team of ${createCandidateInput.name}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // checking is chessNo already exist
    const candidate = await this.candidateRepository.findOne({
      where: {
        chestNO: createCandidateInput.chestNO,
      },
    });

    if (candidate) {
      throw new HttpException(
        `Candidate with chess no ${createCandidateInput.chestNO} already exists ,ie: check on chessNo of ${createCandidateInput.name}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // creating a instance of Candidate
      const input = new Candidate();

      // updating Value to candidate
      input.category = category_id;
      input.chestNO = createCandidateInput.chestNO;
      input.name = createCandidateInput.name;
      input.team = team_id;

      return this.candidateRepository.save(input);
    } catch (e) {
      throw new HttpException(
        'An Error have when inserting data , please check the all required fields are filled ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  // upload many

  async uploadFile(file: Express.Multer.File, chestNo: string, iamReady: boolean) {

    if (!file || !chestNo) {
      throw new HttpException(`File or Chest No not found`, HttpStatus.BAD_REQUEST);
    }

    // check the file cant be more than 1mb

    if (file.size > 1000000) {
      throw new HttpException(`File size must be less than 1 MB`, HttpStatus.BAD_REQUEST);
    }

    // upload the file to cloudinary

    const cludinaryResponse = new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });


    cludinaryResponse.then(async (data) => {
      const url = data.secure_url;

      // add url to candidate avatar

      const candidate = await this.candidateRepository.findOneBy({
        chestNO: chestNo,
      });


      if (!candidate) {
        throw new HttpException(`Cant find a candidate to add avatar`, HttpStatus.BAD_REQUEST);
      }


      try {

        if (typeof iamReady !== 'boolean') {
          console.log("not boolean");
          
          iamReady = iamReady == "true" ? true : false;
        }
        
        console.log(iamReady);
        
        const avt = await this.candidateRepository.save({
          ...candidate,
          avatar: url,
          iamReady: iamReady,
        });
        
        console.log(avt);
        
        return avt;
      } catch (err) {
        throw new HttpException(
          'An Error have when updating candidate\'s avatar ',
          HttpStatus.INTERNAL_SERVER_ERROR,
          { cause: err },
        );
      }
    }).catch((err) => {
      throw new HttpException(
        'An Error have when uploading file ' + err,
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: err },
      );
    }

    );

  }

  async findAll(fields: string[]) {
    const allowedRelations = [
      'category',
      'team',
      'candidateProgrammes',
      'candidateProgrammes.programme',
      'team.zone',
    ];

    // validating fields
    fields = fieldsValidator(fields, allowedRelations);
    // checking if fields contains id
    fields = fieldsIdChecker(fields);

    try {
      const queryBuilder = this.candidateRepository
        .createQueryBuilder('candidate')
        .leftJoinAndSelect('candidate.category', 'category')
        .leftJoinAndSelect('candidate.team', 'team')
        .leftJoinAndSelect('team.zone', 'zone')
        .leftJoinAndSelect('candidate.candidateProgrammes', 'candidateProgrammes')
        .leftJoinAndSelect('candidateProgrammes.programme', 'programme');

      queryBuilder.select(
        fields.map(column => {
          const splitted = column.split('.');

          if (splitted.length > 1) {
            return `${splitted[splitted.length - 2]}.${splitted[splitted.length - 1]}`;
          } else {
            return `candidate.${column}`;
          }
        }),
      );
      const candidate = await queryBuilder.getMany();
      return candidate;
    } catch (e) {
      throw new HttpException(
        'An Error have when finding candidate ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  async findAllFinal(fields: string[]) {
    const allowedRelations = [
      'category',
      'team',
      'candidateProgrammes',
      'candidateProgrammes.programme',
      'team.zone',
    ];

    // validating fields
    fields = fieldsValidator(fields, allowedRelations);
    // checking if fields contains id
    fields = fieldsIdChecker(fields);

    try {
      const queryBuilder = this.candidateRepository
        .createQueryBuilder('candidate')
        .leftJoinAndSelect('candidate.category', 'category')
        .leftJoinAndSelect('candidate.team', 'team')
        .leftJoinAndSelect('team.zone', 'zone')
        .leftJoinAndSelect('candidate.candidateProgrammes', 'candidateProgrammes')
        .leftJoinAndSelect('candidateProgrammes.programme', 'programme');

      queryBuilder.select(
        fields.map(column => {
          const splitted = column.split('.');

          if (splitted.length > 1) {
            return `${splitted[splitted.length - 2]}.${splitted[splitted.length - 1]}`;
          } else {
            return `candidate.${column}`;
          }
        }),
      );
      const candidate = await queryBuilder.getMany();



      return candidate;
    } catch (e) {
      throw new HttpException(
        'An Error have when finding candidate ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  async findByCategories(categories: string[], fields: string[]) {
    const allowedRelations = ['category', 'team'];

    // validating fields
    fields = fieldsValidator(fields, allowedRelations);
    // checking if fields contains id
    fields = fieldsIdChecker(fields);

    try {
      const queryBuilder = this.candidateRepository
        .createQueryBuilder('candidate')
        .leftJoinAndSelect('candidate.category', 'category')
        .where('category.name IN (:...categories)', { categories })
        .leftJoinAndSelect('candidate.team', 'team');

      queryBuilder.select(
        fields.map(column => {
          const splitted = column.split('.');

          if (splitted.length > 1) {
            return `${splitted[splitted.length - 2]}.${splitted[splitted.length - 1]}`;
          } else {
            return `candidate.${column}`;
          }
        }),
      );
      const candidate = await queryBuilder.getMany();
      return candidate;
    } catch (e) {
      throw new HttpException(
        'An Error have when finding candidate ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  // find candidates by category name and team name

  async findByCategoryNamesAndTeamName(categories: string[], teamName: string, fields: string[]) {
    const allowedRelations = ['category', 'team'];

    // validating fields
    fields = fieldsValidator(fields, allowedRelations);
    // checking if fields contains id
    fields = fieldsIdChecker(fields);
    try {
      const queryBuilder = this.candidateRepository
        .createQueryBuilder('candidate')
        .where('candidate.category.name IN (:...categories)', { categories })
        .andWhere('candidate.team.name = :teamName', { teamName })
        .leftJoinAndSelect('candidate.category', 'category')
        .leftJoinAndSelect('candidate.team', 'team');

      queryBuilder.select(
        fields.map(column => {
          const splitted = column.split('.');

          if (splitted.length > 1) {
            return `${splitted[splitted.length - 2]}.${splitted[splitted.length - 1]}`;
          } else {
            return `candidate.${column}`;
          }
        }),
      );
      const candidate = await queryBuilder.getMany();
      return candidate;
    } catch (e) {
      throw new HttpException(
        'An Error have when finding candidate ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  async findOne(id: number, fields: string[]) {
    const allowedRelations = [
      'cgp',
      'cgp.programme',
      'category',
      'team',
      'team.zone',
      'candidateProgrammes',
      'candidateProgrammes.programme',
      'candidateProgrammes.position',
      'candidateProgrammes.grade',
    ];

    // validating fields
    fields = fieldsValidator(fields, allowedRelations);
    // checking if fields contains id
    fields = fieldsIdChecker(fields);
    try {
      const candidate = await this.candidateRepository.findOne({
        where: {
          id,
        },
        relations: ['category', 'team', 'candidateProgrammes', 'cgp', 'team.zone'],
      });

      if (!candidate) {
        throw new HttpException(`Cant find candidate with chest no ${id} `, HttpStatus.BAD_REQUEST);
      }

      const cgp = candidate.cgp || [];

      const candidateProgrammes = candidate.candidateProgrammes || [];

      // if cgp.programme is not already in candidateProgrammes.programme then push cgp to
      // candidateProgrammes

      cgp.forEach(cgp => {
        const isAlready = candidateProgrammes.some(
          candidateProgramme => candidateProgramme.programme.id === cgp.programme.id,
        );

        if (!isAlready) {
          candidateProgrammes.push(cgp);
        }
      });

      candidate.candidateProgrammes = candidateProgrammes;

      return candidate;
    } catch (e) {
      throw new HttpException(
        'An Error have when finding candidate',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  async findOneByChestNo(chestNO: string) {
    try {
      const candidate = await this.candidateRepository.findOne({
        where: {
          chestNO,
        },
        relations: ['category', 'team', 'candidateProgrammes', 'cgp', 'team.zone', 'candidateProgrammes.zonalgrade', 'candidateProgrammes.zonalposition', 'candidateProgrammes.finalgrade', 'candidateProgrammes.finalposition', 'candidateProgrammes.programme'],
      });

      if (!candidate) {
        throw new HttpException(
          `Cant find candidate with chest no ${chestNO} `,
          HttpStatus.BAD_REQUEST,
        );
      }

      const zoneName = candidate.team.zone.name;

      // // change what in cgp to candidateProgrammes with what already in candidateProgrammes
      const cgp = candidate.cgp || [];

      const candidateProgrammes = candidate.candidateProgrammes || [];

      // if cgp.programme is not already in candidateProgrammes.programme then push cgp to

      cgp.forEach(cgp => {
        const isAlready = candidateProgrammes.some(
          candidateProgramme => candidateProgramme.programme.id === cgp.programme.id,
        );

        if (!isAlready) {
          candidateProgrammes.push(cgp);
        }
      });

      // if result is not published then remove the result from candidateProgrammes

      candidateProgrammes.forEach(candidateProgramme => {

        // check the result is published in the way of published[herezonename]

        const published = candidateProgramme.programme['published' + zoneName];

        // console.log('====================================');
        // console.log(published);
        // console.log('====================================');

        if (!published) {
          candidateProgramme.zonalpoint = null;
          candidateProgramme.finalpoint = null;
          candidateProgramme.zonalgrade = null;
          candidateProgramme.zonalposition = null;
          candidateProgramme.finalgrade = null;
          candidateProgramme.finalposition = null;
        }
      });


      candidate.candidateProgrammes = candidateProgrammes;

      return candidate;
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR, { cause: e });
    }
  }

  async findOneByChestNoWithoutError(chestNO: string) {
    console.log(chestNO);

    try {
      const candidate = await this.candidateRepository.findOne({
        where: {
          chestNO,
        },
        relations: ['category', 'team', 'candidateProgrammes', 'cgp', 'team.zone'],
      });

      if (!candidate) {
        return null;
      }

      return candidate;
    } catch (e) {
      return null;
    }
  }

  async findOneByChesNoByFields(chestNO: string, fields: string[]) {
    const allowedRelations = ['category', 'team', 'candidateProgrammes', 'cgp', 'team.zone'];

    // validating fields
    fields = fieldsValidator(fields, allowedRelations);
    // checking if fields contains id
    fields = fieldsIdChecker(fields);
    try {
      const queryBuilder = this.candidateRepository
        .createQueryBuilder('candidate')
        .where('candidate.chestNO = :chestNO', { chestNO })
        .leftJoinAndSelect('candidate.category', 'category')
        .leftJoinAndSelect('candidate.team', 'team')
        .leftJoinAndSelect('team.zone', 'zone')
        .leftJoinAndSelect('candidate.candidateProgrammes', 'candidateProgrammes')
        .leftJoinAndSelect('candidateProgrammes.programme', 'programme');

      queryBuilder.select(
        fields.map(column => {
          const splitted = column.split('.');

          if (splitted.length > 1) {
            return `${splitted[splitted.length - 2]}.${splitted[splitted.length - 1]}`;
          } else {
            return `candidate.${column}`;
          }
        }),
      );
      const candidate = await queryBuilder.getOne();
      return candidate;
    } catch (e) {
      throw new HttpException(
        'An Error have when finding candidate ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  // check is candidate in a programme

  async findOneByChestNoAndProgrammeId(chestNO: string, programmeCode: string) {
    // checking is candidate exist

    const candidate = await this.candidateRepository.findOne({
      where: {
        chestNO,
      },
      relations: ['candidateProgrammes'],
    });

    if (!candidate) {
      throw new HttpException(`Cant find candidate with name ${chestNO} `, HttpStatus.BAD_REQUEST);
    }

    // checking is candidate in programme

    const candidateProgramme = candidate.candidateProgrammes?.find(
      candidateProgramme => candidateProgramme.programme?.programCode === programmeCode,
    );

    return candidateProgramme;
  }

  // search candidates by name or chestNo with team name , the total count and candidates needed if team given then the total candiates of that team , follow the limit

  async findByNameOrChestNo(name: string, chestNo: string, limit: number, teamName: string = null) {
    const candidates = [];
    let totalCandidates = 0;

    // if team name is given then search by team name

    if (teamName) {
      const team = await this.teamService.findOneByName(teamName, [
        'id',
        'name',
        // 'candidates',
        'candidates.name',
        'candidates.chestNO',
        'candidates.category',
        'candidates.category.name',
        'candidates.cgp.programme',
        'candidates.cgp.programme.name',
        'candidates.cgp.programme.type',
        // 'candidates.candidateProgrammes',
        'candidates.candidateProgrammes.programme',
        'candidates.candidateProgrammes.programme.name',
        'candidates.candidateProgrammes.programme.type',
        'candidates.candidateProgrammes.programme.programCode',
        'candidates.candidateProgrammes.programme.resultPublished',
      ]);

      if (!team) {
        throw new HttpException(`Cant find team with name ${teamName} `, HttpStatus.BAD_REQUEST);
      }

      // if team found then check the candidates of the team

      const teamCandidates = team.candidates;

      // if candidates found then search by name or chestNo

      if (teamCandidates) {
        // if name is given then search by name

        totalCandidates = teamCandidates.length;

        if (name) {
          const filteredCandidates = teamCandidates.filter(candidate =>
            candidate.name?.toLocaleLowerCase().includes(name.toLocaleLowerCase()),
          );
          // push the candidates to candidates array by limit
          candidates.push(...filteredCandidates.slice(0, limit));
        } else if (chestNo) {
          const filteredCandidates = teamCandidates.filter(candidate =>
            candidate.chestNO.toLocaleLowerCase()?.includes(chestNo.toLocaleLowerCase()),
          );
          // push the candidates to candidates array by limit
          candidates.push(...filteredCandidates.slice(0, limit));
        } else {
          // push the candidates to candidates array by limit
          candidates.push(...teamCandidates.slice(0, limit));
        }
      }
    } else {
      // if team name is not given then search by name or chestNo

      // if name is given then search by name

      if (name) {
        const queryBuilder = this.candidateRepository
          .createQueryBuilder('candidate')
          .leftJoinAndSelect('candidate.category', 'category')
          .leftJoinAndSelect('candidate.team', 'team')
          .leftJoinAndSelect('candidate.candidateProgrammes', 'candidateProgrammes')
          .leftJoinAndSelect('candidateProgrammes.programme', 'programme')
          .where('candidate.name LIKE :name', { name: `%${name}%` })
          .orWhere('candidate.chestNO LIKE :chestNO', { chestNO: `%${name}%` })
          .take(limit);

        totalCandidates = await queryBuilder.getCount();

        candidates.push(...(await queryBuilder.getMany()));
      } else if (chestNo) {
        const queryBuilder = this.candidateRepository
          .createQueryBuilder('candidate')
          .leftJoinAndSelect('candidate.category', 'category')
          .leftJoinAndSelect('candidate.team', 'team')
          .leftJoinAndSelect('candidate.candidateProgrammes', 'candidateProgrammes')
          .leftJoinAndSelect('candidateProgrammes.programme', 'programme')
          .where('candidate.name LIKE :name', { name: `%${chestNo}%` })
          .orWhere('candidate.chestNO LIKE :chestNO', { chestNO: `%${chestNo}%` })
          .take(limit);

        // total count must be the total candidates not the searched candidates

        totalCandidates = await queryBuilder.getCount();

        candidates.push(...(await queryBuilder.getMany()));
      } else {
        // if name and chestNo is not given then return all candidates

        const queryBuilder = this.candidateRepository
          .createQueryBuilder('candidate')
          .leftJoinAndSelect('candidate.category', 'category')
          .leftJoinAndSelect('candidate.team', 'team')
          .leftJoinAndSelect('candidate.candidateProgrammes', 'candidateProgrammes')
          .leftJoinAndSelect('candidateProgrammes.programme', 'programme')
          .take(limit);

        // total count must be the total candidates not the searched candidates

        totalCandidates = await queryBuilder.getCount();

        candidates.push(...(await queryBuilder.getMany()));
      }
    }

    return {
      totalCandidates,
      candidates,
    };
  }

  async findByNameOrChestNoInFinal(name: string, chestNo: string, limit: number, teamName: string = null) {
    const candidates = [];
    let totalCandidates = 0;

    // if team name is given then search by team name

    if (teamName) {
      const team = await this.teamService.findOneByName(teamName, [
        'id',
        'name',
        // 'candidates',
        'candidates.name',
        'candidates.chestNO',
        'candidates.category',
        'candidates.category.name',
        'candidates.cgp.programme',
        'candidates.cgp.programme.name',
        'candidates.cgp.programme.type',
        // 'candidates.candidateProgrammes',
        'candidates.candidateProgrammes.zonalposition',
        'candidates.candidateProgrammes.finalposition',
        'candidates.candidateProgrammes.candidatesOfGroup',
        'candidates.candidateProgrammes.programme',
        'candidates.candidateProgrammes.programme.name',
        'candidates.candidateProgrammes.programme.type',
        'candidates.candidateProgrammes.programme.programCode',
        'candidates.candidateProgrammes.programme.resultPublished',
      ]);

      if (!team) {
        throw new HttpException(`Cant find team with name ${teamName} `, HttpStatus.BAD_REQUEST);
      }

      // if team found then check the candidates of the team

      const teamCandidates = team.candidates;

      const finalTeamCandidates = teamCandidates.filter((candidate) => {
        const candidateProgrammes = candidate.candidateProgrammes;

        const finalCp = candidateProgrammes.filter(candidateProgramme => {
          if (candidateProgramme.zonalposition?.value === 1 || candidateProgramme.zonalposition?.value === 2) {
            console.log("yse");
            return candidateProgramme;
          }
        }
        );

        candidate.candidateProgrammes = finalCp || [];

        const isZonalPosition = candidateProgrammes.some(
          candidateProgramme => candidateProgramme.zonalposition?.value === 1 || candidateProgramme.zonalposition?.value === 2,
        );

        console.log(isZonalPosition);


        if (isZonalPosition) {
          return true;
        }

        return false;
      })

      // if candidates found then search by name or chestNo

      if (finalTeamCandidates) {
        // if name is given then search by name

        totalCandidates = finalTeamCandidates.length;

        if (name) {
          const filteredCandidates = finalTeamCandidates.filter(candidate =>
            candidate.name?.toLocaleLowerCase().includes(name.toLocaleLowerCase()),
          );
          // push the candidates to candidates array by limit
          candidates.push(...filteredCandidates.slice(0, limit));
        } else if (chestNo) {
          const filteredCandidates = finalTeamCandidates.filter(candidate =>
            candidate.chestNO.toLocaleLowerCase()?.includes(chestNo.toLocaleLowerCase()),
          );
          // push the candidates to candidates array by limit
          candidates.push(...filteredCandidates.slice(0, limit));
        } else {
          // push the candidates to candidates array by limit
          candidates.push(...finalTeamCandidates.slice(0, limit));
        }
      }

    } else {
      // if team name is not given then search by name or chestNo

      // if name is given then search by name

      if (name) {
        const queryBuilder = this.candidateRepository
          .createQueryBuilder('candidate')
          .leftJoinAndSelect('candidate.category', 'category')
          .leftJoinAndSelect('candidate.cgp', 'cgp')
          .leftJoinAndSelect('cgp.zonalposition', 'zonalpositioncgp')
          .leftJoinAndSelect('cgp.programme', 'programmecgp')
          .leftJoinAndSelect('candidate.team', 'team')
          .leftJoinAndSelect('candidate.candidateProgrammes', 'candidateProgrammes')
          // where candidateProgrammes.zonalposition.value is 1 or 2
          .leftJoinAndSelect('candidateProgrammes.zonalposition', 'zonalposition')
          .leftJoinAndSelect('candidateProgrammes.programme', 'programme')
          .where('candidate.name LIKE :name', { name: `%${name}%` })
          .orWhere('candidate.chestNO LIKE :chestNO', { chestNO: `%${name}%` })
          // .take(limit);


        const candidatesData = await queryBuilder.getMany();
        const candidatesFinal = candidatesData?.map(candidate => {

          const candidateProgrammes = [];

          candidate.cgp?.map(cgp => {
            candidateProgrammes.push(cgp);
          })

          candidate.candidateProgrammes?.map(candidateProgramme => {
            const isAlreadyIn = candidateProgrammes.find(cgp => cgp.id === candidateProgramme.id);

            if (!isAlreadyIn) {
              candidateProgrammes.push(candidateProgramme);
            }
          })

          return {
            ...candidate,
            candidateProgrammes
          }
        })

        const finalCandidates = candidatesFinal.filter(candidate => {
          // check all candidate programmes and if any of them have zonalposition 1 or 2 then return true and only return the candidateProgrammes that have with zonalposition 1 or 2

          const candidateProgrammes = candidate.candidateProgrammes;

          const finalCp = candidateProgrammes.filter(candidateProgramme => {
            if (candidateProgramme.zonalposition?.value === 1 || candidateProgramme.zonalposition?.value === 2) {
              console.log("yse");
              return candidateProgramme;
            }
          }
          );

          candidate.candidateProgrammes = finalCp || [];

          const isZonalPosition = candidateProgrammes.some(
            candidateProgramme => candidateProgramme.zonalposition?.value === 1 || candidateProgramme.zonalposition?.value === 2,
          );

          console.log(isZonalPosition);


          if (isZonalPosition) {
            return true;
          }

          return false;
        }
        );

        totalCandidates = finalCandidates.length;
        candidates.push(...finalCandidates);
      } else if (chestNo) {
        const queryBuilder = this.candidateRepository
          .createQueryBuilder('candidate')
          .leftJoinAndSelect('candidate.cgp', 'cgp')
          .leftJoinAndSelect('cgp.zonalposition', 'zonalpositioncgp')
          .leftJoinAndSelect('cgp.programme', 'programmecgp')
          .leftJoinAndSelect('candidate.category', 'category')
          .leftJoinAndSelect('candidate.team', 'team')
          .leftJoinAndSelect('candidate.candidateProgrammes', 'candidateProgrammes')
          .leftJoinAndSelect('candidateProgrammes.zonalposition', 'zonalposition')
          .leftJoinAndSelect('candidateProgrammes.programme', 'programme')
          .where('candidate.name LIKE :name', { name: `%${chestNo}%` })
          .orWhere('candidate.chestNO LIKE :chestNO', { chestNO: `%${chestNo}%` })
          // .take(limit);

        // total count must be the total candidates not the searched candidates

        totalCandidates = await queryBuilder.getCount();

        const candidatesData = await queryBuilder.getMany();
        const candidatesFinal = candidatesData?.map(candidate => {

          const candidateProgrammes = [];

          candidate.cgp?.map(cgp => {
            console.log(cgp);

            candidateProgrammes.push(cgp);
          })

          candidate.candidateProgrammes?.map(candidateProgramme => {
            // check if the candidateProgramme is already in the candidateProgrammes
            const isAlreadyIn = candidateProgrammes.find(cgp => cgp.id === candidateProgramme.id);

            if (!isAlreadyIn) {
              candidateProgrammes.push(candidateProgramme);
            }
          })

          return {
            ...candidate,
            candidateProgrammes
          }
        })

        const finalCandidates = candidatesFinal.filter(candidate => {
          // check all candidate programmes and if any of them have zonalposition 1 or 2 then return true and only return the candidateProgrammes that have with zonalposition 1 or 2



          const candidateProgrammes = candidate.candidateProgrammes;

          // console.log(candidateProgrammes);


          const finalCp = candidateProgrammes.filter(candidateProgramme => {
            if (candidateProgramme.zonalposition?.value === 1 || candidateProgramme.zonalposition?.value === 2) {
              return candidateProgramme;
            }
          }
          );

          candidate.candidateProgrammes = finalCp;

          const isZonalPosition = candidateProgrammes.some(
            candidateProgramme => candidateProgramme.zonalposition?.value === 1 || candidateProgramme.zonalposition?.value === 2,
          );

          if (isZonalPosition) {
            return true;
          }

          return false;
        }
        );

        totalCandidates = finalCandidates.length;
        candidates.push(...finalCandidates);
      } else {
        // if name and chestNo is not given then return all candidates

        const queryBuilder = this.candidateRepository
          .createQueryBuilder('candidate')
          .leftJoinAndSelect('candidate.cgp', 'cgp')
          .leftJoinAndSelect('cgp.zonalposition', 'zonalpositioncgp')
          .leftJoinAndSelect('cgp.programme', 'programmecgp')
          .leftJoinAndSelect('candidate.category', 'category')
          .leftJoinAndSelect('candidate.team', 'team')
          .leftJoinAndSelect('candidate.candidateProgrammes', 'candidateProgrammes')
          .leftJoinAndSelect('candidateProgrammes.zonalposition', 'zonalposition')
          .leftJoinAndSelect('candidateProgrammes.programme', 'programme')
        // .take(limit);

        // total count must be the total candidates not the searched candidates



        const candidatesData = await queryBuilder.getMany();
        const candidatesFinal = candidatesData?.map(candidate => {

          const candidateProgrammes = [];

          candidate.cgp?.map(cgp => {
            candidateProgrammes.push(cgp);
          })

          candidate.candidateProgrammes?.map(candidateProgramme => {
            const isAlreadyIn = candidateProgrammes.find(cgp => cgp.id === candidateProgramme.id);

            if (!isAlreadyIn) {
              candidateProgrammes.push(candidateProgramme);
            }
          })

          return {
            ...candidate,
            candidateProgrammes
          }
        })


        const finalCandidates = candidatesFinal.filter(candidate => {
          // check all candidate programmes and if any of them have zonalposition 1 or 2 then return true and only return the candidateProgrammes that have with zonalposition 1 or 2

          const candidateProgrammes = candidate.candidateProgrammes;

          const finalCp = candidateProgrammes.filter(candidateProgramme => {
            if (candidateProgramme.zonalposition?.value === 1 || candidateProgramme.zonalposition?.value === 2) {
              return candidateProgramme;
            }
          }
          );

          candidate.candidateProgrammes = finalCp;

          const isZonalPosition = candidateProgrammes.some(
            candidateProgramme => candidateProgramme.zonalposition?.value === 1 || candidateProgramme.zonalposition?.value === 2,
          );

          if (isZonalPosition) {
            return true;
          }

          return false;
        }
        );

        totalCandidates = finalCandidates.length;


        candidates.push(...finalCandidates);
      }
    }

    return {
      totalCandidates,
      candidates,
    };
  }

  async findOverallToppers(fields: string[]) {
    const allowedRelations = [
      'category',
      'team',
      'candidateProgrammes',
      'candidateProgrammes.programme',
      'team.zone',
    ];

    // validating fields
    fields = fieldsValidator(fields, allowedRelations);
    // checking if fields contains id
    fields = fieldsIdChecker(fields);

    try {
      const queryBuilder = this.candidateRepository
        .createQueryBuilder('candidate')
        .leftJoinAndSelect('candidate.category', 'category')
        .leftJoinAndSelect('candidate.team', 'team')
        .leftJoinAndSelect('candidate.candidateProgrammes', 'candidateProgrammes')
        .leftJoinAndSelect('candidateProgrammes.programme', 'programme')
        .leftJoinAndSelect('team.zone', 'zone')
        .orderBy('candidate.individualPoint', 'ASC');

      queryBuilder.select(
        fields.map(column => {
          const splitted = column.split('.');

          if (splitted.length > 1) {
            return `${splitted[splitted.length - 2]}.${splitted[splitted.length - 1]}`;
          } else {
            return `candidate.${column}`;
          }
        }),
      );
      const candidates: Candidate[] = await queryBuilder.getMany();

      // sort the candidates by individual point
      const candidatePromises = candidates.map(async (candidate: Candidate) => {
        const total: CategorySettings = await this.categorySettingsService.findOne(
          candidate.category.id,
          ['id', 'maxSingle'],
        );

        return { candidate, total };
      });

      Promise.all(candidatePromises)
        .then(candidateTotals => {
          // Sort the candidates based on the totals
          const sortedCandidates = candidateTotals.sort((a, b) => {
            const aMax = a.total.maxSingle * 8;
            const bMax = b.total.maxSingle * 8;
            const aTotal = a.candidate.individualPoint
              ? a.candidate.individualPoint
              : (0 / aMax) * 100;
            const bTotal = b.candidate.individualPoint
              ? b.candidate.individualPoint
              : (0 / bMax) * 100;

            if (a.candidate.category.name == 'THANAWIYYA' || 'ALIYA') {
              return bTotal - aTotal;
            }
            return bTotal - aTotal;
          });

          // Now you have sortedCandidates as an array of objects with candidate and total properties
        })
        .catch(error => {
          // Handle any errors that occurred during data retrieval or sorting
          console.error(error);
        });

      return candidates;
    } catch (e) {
      throw new HttpException(
        'An Error have when finding candidate ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  // category based toppers

  async getCategoryBasedToppers() {
    // get all candidates and their candidate programmes then add the points in candiate programmes to candiate and sort them by points and return the top 5
    // candidates must be category based

    // get all candidates

    const candidates = await this.candidateRepository.find({
      relations: [
        'candidateProgrammes',
        'category',
        'candidateProgrammes.programme',
        'team',
        'team.zone',
      ],
    });

    const categories = await this.categoryService.findAll(['id', 'name']);

    const pointedCandidates = candidates.map((candidate, i) => {
      let total = 0;
      let totalSports = 0;
      candidate.candidateProgrammes.forEach(candidateProgramme => {
        if (candidateProgramme.programme?.type === Type.SINGLE) {
          total = total + candidateProgramme.zonalpoint;
        }
      });

      return {
        ...candidate,
        individualPoint: total,
        individualSportsPoint: totalSports,
      };
    });

    // setting the category based toppers

    const candaidatedByCategory = categories.map(category => {
      const candidates = pointedCandidates.filter(
        candidate => candidate.category.name === category.name,
      );

      const sortedCandidates = candidates
        .slice()
        .sort((a, b) => b.individualPoint - a.individualPoint);
      const sortedSportsCandidates = candidates
        .slice()
        .sort((a, b) => b.individualSportsPoint - a.individualSportsPoint);

      return {
        ...category,
        candidates: [...sortedCandidates.slice(0, 5), ...sortedSportsCandidates.slice(0, 5)],
      };
    });

    // log first 5 candidates
    // console.log(pointedCandidates.sort((a, b) => b.total - a.total).slice(0, 5));

    return candaidatedByCategory;
  }

  // async getPublishedCategoryBasedToppers() {
  //   // get all candidates and their candidate programmes then add the points in candiate programmes to candiate and sort them by points and return the top 5
  //   // candidates must be category based

  //   // get all candidates

  //   const candidates = await this.candidateRepository.find({
  //     relations: [
  //       'candidateProgrammes',
  //       'category',
  //       'candidateProgrammes.programme',
  //       'team',
  //       'team.zone',
  //     ],
  //   });

  //   const categories = await this.categoryService.findAll(['id', 'name']);

  //   const pointedCandidates = candidates.map((candidate, i) => {
  //     let total = 0;
  //     let totalSports = 0;
  //     candidate.candidateProgrammes.forEach(candidateProgramme => {
  //       if (
  //         candidateProgramme.programme?.type === Type.SINGLE &&
  //         candidateProgramme.programme?.resultPublished
  //       ) {
  //         total = total + candidateProgramme.zonalpoint;
  //       }
  //     });

  //     return {
  //       ...candidate,
  //       individualPoint: total,
  //       individualSportsPoint: totalSports,
  //     };
  //   });

  //   // setting the category based toppers

  //   const candaidatedByCategory = categories.map(category => {
  //     const candidates = pointedCandidates.filter(
  //       candidate => candidate.category.name === category.name,
  //     );

  //     const sortedCandidates = candidates
  //       .slice()
  //       .sort((a, b) => b.individualPoint - a.individualPoint);
  //     const sortedSportsCandidates = candidates
  //       .slice()
  //       .sort((a, b) => b.individualSportsPoint - a.individualSportsPoint);

  //     return {
  //       ...category,
  //       candidates: [...sortedCandidates.slice(0, 5), ...sortedSportsCandidates.slice(0, 5)],
  //     };
  //   });

  //   // log first 5 candidates
  //   // console.log(pointedCandidates.sort((a, b) => b.total - a.total).slice(0, 5));

  //   return candaidatedByCategory;
  // }

  // Update data

  async update(id: number, updateCandidateInput: UpdateCandidateInput, user: Credential) {
    // --------------------
    // checking .........
    // --------------------
    //  checking is category exist

    const category_id = await this.categoryService.findOneByName(updateCandidateInput.category);

    if (!category_id) {
      throw new HttpException(
        `Cant find a category named ${updateCandidateInput.category}  ,ie: check on Category of ${updateCandidateInput.name}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // authenticating the user have permission to update the category

    this.credentialService.checkPermissionOnCategories(user, category_id.name);

    // checking is candidate exist

    const candidate = await this.candidateRepository.findOneBy({ id });

    if (!candidate) {
      throw new HttpException(
        `Cant find a candidate named ${updateCandidateInput.name}}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    //  checking is team exist

    const team_id = await this.teamService.findOneByName(updateCandidateInput.team, ['id']);

    if (!team_id) {
      throw new HttpException(
        `Cant find a team named ${updateCandidateInput.team} ,ie: check on Team of ${updateCandidateInput.name}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // updating Value to candidate
      candidate.category = category_id;
      candidate.chestNO = updateCandidateInput.chestNO;
      candidate.name = updateCandidateInput.name;
      candidate.team = team_id;

      return this.candidateRepository.save(candidate);
    } catch (e) {
      throw new HttpException(
        'An Error have when updating data , please check the all required fields are filled ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  async remove(id: number, user: Credential) {
    // --------------------
    // checking .........
    // --------------------

    // checking is candidate exist

    const candidate = await this.findOne(id, ['category.name']);

    const category_id = await this.categoryService.findOneByName(candidate?.category?.name);

    if (!category_id) {
      throw new HttpException(
        `Cant find a category named ${candidate?.category?.name}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // authenticating the user have permission to update the category

    this.credentialService.checkPermissionOnCategories(user, category_id.name);

    if (!candidate) {
      throw new HttpException(`Cant find a candidate to delete`, HttpStatus.BAD_REQUEST);
    }

    try {
      return this.candidateRepository.delete(id);
    } catch (e) {
      throw new HttpException(
        'An Error have when deleting data ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e },
      );
    }
  }

  // add individual or group point to candidate

  async addPoint(id: number, indPoint: number = 0, groupPoint: number = 0) {
    const candidate = await this.candidateRepository.findOneBy({ id });

    if (!candidate) {
      throw new HttpException(`Cant find a candidate to add point`, HttpStatus.BAD_REQUEST);
    }

    let individualPoint = candidate.individualPoint || 0;
    let groupGeneralPoint = candidate.groupPoint || 0;

    individualPoint = individualPoint + indPoint;
    groupGeneralPoint = groupGeneralPoint + groupPoint;

    try {
      return this.candidateRepository.save({
        ...candidate,
        individualPoint,
        groupPoint: groupGeneralPoint,
      });
    } catch (err) {
      throw new HttpException(
        'An Error have when updating candidate point ',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: err },
      );
    }
  }

  async candidateChecker(chestNo, mimeType) {
    const candidate = await this.findOneByChesNoByFields(chestNo, ['id']);

    if (!candidate) {
      throw new HttpException(
        `can't find candidate with chest no ${chestNo}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // check the file is image
    if (!mimeType.includes('image')) {
      throw new HttpException(`File is not an image`, HttpStatus.BAD_REQUEST);
    }

    return candidate;
  }
}
