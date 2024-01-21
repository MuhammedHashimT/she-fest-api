import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateProgramme } from './entities/candidate-programme.entity';
import { AddResult } from './dto/add-result.dto';
import { GradesService } from 'src/grades/grades.service';
import { Grade } from 'src/grades/entities/grade.entity';
import { PositionService } from 'src/position/position.service';
import { Position } from 'src/position/entities/position.entity';
import { CandidateProgrammeService } from './candidate-programme.service';
import { ProgrammesService } from 'src/programmes/programmes.service';
import { Mode, Programme, Type } from 'src/programmes/entities/programme.entity';
import { DetailsService } from 'src/details/details.service';
import { arrayInput } from './dto/array-input.dto';
import { TeamsService } from 'src/teams/teams.service';
import { CandidatesService } from 'src/candidates/candidates.service';
import { AddManual } from './dto/add-manual.dto';

@Injectable()
export class ResultGenService {
  constructor(
    @InjectRepository(CandidateProgramme)
    private candidateProgrammeRepository: Repository<CandidateProgramme>,
    private readonly gradeService: GradesService,
    private readonly positionService: PositionService,
    private readonly candidateProgrammeService: CandidateProgrammeService,
    private readonly programmeService: ProgrammesService,
    private readonly DetailService: DetailsService,
    private readonly teamService: TeamsService,
    private readonly candidateService: CandidatesService,
  ) { }

  // upload Normal Result by controller

  // async addResult(programCode: string, input: arrayInput) {
  //   // check if programme exist

  //   const programme: Programme = await this.programmeService.findOneByCode(programCode);

  //   // all candidates of programme

  //   let candidatesOfProgramme: CandidateProgramme[] = programme.candidateProgramme;

  //   if (!programme) {
  //     throw new HttpException('Programme does not exist', HttpStatus.BAD_REQUEST);
  //   }

  //   // checking the programme is already published

  //   if (programme.resultPublished) {
  //     throw new HttpException('Programme is already published', HttpStatus.BAD_REQUEST);
  //   }

  //   // verify the result
  //   await this.verifyResult(input.inputs, programCode);

  //   for (let index = 0; index < programme.candidateProgramme.length; index++) {
  //     const candidate = candidatesOfProgramme[index];

  //     candidate.mark = input.inputs[index].mark;
  //   }

  //   // process the result
  //   candidatesOfProgramme = await this.processResult(programme);
  //   try {
  //     await this.programmeService.enterResult(programCode);
  //     return this.candidateProgrammeRepository.save(candidatesOfProgramme);
  //   } catch (error) {
  //     throw new HttpException('Error on updating result', HttpStatus.BAD_REQUEST);
  //   }
  // }

  // result upload process

  async processResult(programme: Programme) {
    // Clear the grade first before generating new one
    let candidatesOfProgramme: CandidateProgramme[] = programme.candidateProgramme;

    for (let index = 0; index < candidatesOfProgramme.length; index++) {
      const candidate = candidatesOfProgramme[index];
      candidate.zonalgrade = null;
    }

    //  Generating Grade for each candidate
    for (let index = 0; index < candidatesOfProgramme.length; index++) {
      const candidate = candidatesOfProgramme[index];
      const grade: Grade = await this.generateGrade(candidate.mark, programme);
      candidate.zonalgrade = grade;
    }
    // Generating Position for each candidate

    // Clear the position first before generating new one
    for (let index = 0; index < candidatesOfProgramme.length; index++) {
      const candidate = candidatesOfProgramme[index];
      candidate.zonalposition = null;
    }

    candidatesOfProgramme = await this.generatePosition(
      candidatesOfProgramme,
      programme.programCode,
    );

    // set the point for each candidate
    for (let index = 0; index < candidatesOfProgramme.length; index++) {
      let candidate = candidatesOfProgramme[index];
      candidate = await this.generatePoint(candidate);
    }

    return candidatesOfProgramme;
  }

  // verify the result

  async verifyResult(input: AddResult[], programCode: string) {
    // CHANGED SOME FOR DH HOUSING ONLY

    // all candidates of programme
    const candidatesOfProgramme: CandidateProgramme[] =
      await this.candidateProgrammeService.getCandidatesOfProgramme(programCode);

    // checking the two input ore equal

    const isSameLength = candidatesOfProgramme.length === input.length;

    // sorting data

    let sortedCandidateProgramme = candidatesOfProgramme.sort(
      (a: CandidateProgramme, b: CandidateProgramme) => {
        // here each chest no have 4 letters , fist one is letter and other 3 are numbers , so we are taking the last 3 numbers

        const chestNoA = parseInt(a.candidate?.chestNO.slice(1, 4));
        const chestNoB = parseInt(b.candidate?.chestNO.slice(1, 4));

        return chestNoA - chestNoB;
      },
    );

    const sortedInput = input.sort((a: AddResult, b: AddResult) => {
      // here each chest no have 4 letters , fist one is letter and other 3 are numbers , so we are taking the last 3 numbers

      const chestNoA = parseInt(a.chestNo.slice(1, 4));
      const chestNoB = parseInt(b.chestNo.slice(1, 4));

      return chestNoA - chestNoB;
    });

    if (!isSameLength) {
      throw new HttpException(
        `An error form of result upload , please check the result of all candidates of programme ${programCode} is uploaded`,
        HttpStatus.BAD_REQUEST,
      );
    } else {
      for (let index = 0; index < input.length; index++) {
        const input: AddResult = sortedInput[index];

        const cProgramme: CandidateProgramme = sortedCandidateProgramme[index];

        // checking is candidate have in this programme
        if (input?.chestNo != cProgramme.candidate?.chestNO) {
          throw new HttpException(
            `An error form of result upload , please check the candidate ${input.chestNo} is in programme ${programCode}`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }
  }

  // verify the result mannualy

  async verifyResultManual(input: AddManual[], programCode: string) {
    // CHANGED SOME FOR DH HOUSING ONLY

    // all candidates of programme
    const candidatesOfProgramme: CandidateProgramme[] =
      await this.candidateProgrammeService.getCandidatesOfProgramme(programCode);

    const programme = await this.programmeService.findOneByCode(programCode);

    const finalCandidates: CandidateProgramme[] = candidatesOfProgramme.filter(
      (candidateProgramme: CandidateProgramme) => {
        if (programme.mode == Mode.STAGE) {
          return candidateProgramme.zonalposition.value <= 2
        } else {
          return candidateProgramme.zonalposition.value == 1
        }
      },
    );

    // checking the two input ore equal

    const isSameLength = finalCandidates.length === input.length;

    // sorting data

    let sortedCandidateProgramme = finalCandidates.sort(
      (a: CandidateProgramme, b: CandidateProgramme) => {
        // sort by chest no which is a string
        const chestNoA: string = a.candidate?.chestNO;
        const chestNoB: string = b.candidate?.chestNO;

        return chestNoA.localeCompare(chestNoB);
      },
    );

    const sortedInput = input.sort((a: AddManual, b: AddManual) => {
      // sort by chest no which is a string
      const chestNoA: string = a.chestNo;
      const chestNoB: string = b.chestNo;

      return chestNoA.localeCompare(chestNoB);
    });

    if (!isSameLength) {
      throw new HttpException(
        `An error form of result upload , please check the result of all candidates of programme ${programCode} is uploaded`,
        HttpStatus.BAD_REQUEST,
      );
    } else {
      for (let index = 0; index < input.length; index++) {
        const input: AddManual = sortedInput[index];

        const cProgramme: CandidateProgramme = sortedCandidateProgramme[index];

        // checking is candidate have in this programme
        if (input?.chestNo != cProgramme.candidate?.chestNO) {
          throw new HttpException(
            `An error form of result upload , please check the candidate ${input.chestNo} is in programme ${programCode}`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }
  }

  // generating grade

  async generateGrade(mark: number, programme: Programme) {
    const allGrades: Grade[] = await this.gradeService.findAll(['id', 'percentage']);
    // Descending sorting
    const sortedGrade: Grade[] = allGrades.sort((a: Grade, b: Grade) => {
      return b.percentage - a.percentage;
    });

    //  checking each grades percentage and the eligibility of the candidate
    for (let index = 0; index < sortedGrade.length; index++) {
      const grade: Grade = sortedGrade[index];
      if (mark >= (grade.percentage / 100) * programme.totalMark) {
        return grade;
      }
    }
    return null;
  }

  // generate position

  async generatePosition(CandidateProgramme: CandidateProgramme[], programCode: string) {
    const Positions: Position[] = await this.positionService.findAll([
      'id',
      'name',
      'pointSingle',
      'pointGroup',
      'pointHouse',
      'programme.id',
      'programme.type',
    ]);

    // giving the position

    CandidateProgramme = await this.multiplePosition(CandidateProgramme, Positions, programCode);

    return CandidateProgramme;
  }

  async multiplePosition(
    CandidateProgramme: CandidateProgramme[],
    Positions: Position[],
    programCode: string,
  ) {
    var totals = [];
    for (var i = 0; i < CandidateProgramme.length; i++) {
      var total = CandidateProgramme[i].mark;
      totals.push(total);
    }
    const sorted = [...new Set(totals)].sort((a, b) => b - a);
    const rank = new Map(sorted.map((x, i) => [x, i + 1]));
    const changed = totals.map(x => rank.get(x));

    // checking is there have multiple position
    if (this.containsDuplicates(changed, Positions.length)) {
      const isMultiplePositionAllowed: boolean = (await this.DetailService.findIt())
        .isMultipleResultAllowed; // || false;

      if (!isMultiplePositionAllowed) {
        await this.programmeService.setAnyIssue(programCode, true);
      }
    } else {
      await this.programmeService.setAnyIssue(programCode, false);
    }

    // giving the position
    for (let index = 0; index < CandidateProgramme.length; index++) {
      const candidateProgramme: CandidateProgramme = CandidateProgramme[index];
      const position: Position = Positions[changed[index] - 1];

      if (position) {
        candidateProgramme.zonalposition = position;
      }
    }

    return CandidateProgramme;
  }

  async generatePoint(CandidateProgramme: CandidateProgramme) {
    console.log(CandidateProgramme);

    // giving the point of grade
    const grade: Grade = CandidateProgramme.zonalgrade;

    CandidateProgramme.zonalpoint = 0;

    if (grade) {
      const gradeWithPoint = await this.gradeService.findOne(grade.id, [
        'id',
        'name',
        'pointSingle',
        'pointGroup',
        'pointHouse',
      ]);
      if (CandidateProgramme.programme.type == Type.SINGLE) {
        CandidateProgramme.zonalpoint = grade.pointSingle;
        CandidateProgramme.zonalpoint = gradeWithPoint.pointSingle;
      } else if (CandidateProgramme.programme.type == Type.GROUP) {
        CandidateProgramme.zonalpoint = grade.pointGroup;
        CandidateProgramme.zonalpoint = gradeWithPoint.pointGroup;
      } else if (CandidateProgramme.programme.type == Type.HOUSE) {
        CandidateProgramme.zonalpoint = grade.pointHouse;
        CandidateProgramme.zonalpoint = gradeWithPoint.pointHouse;
      }
    }

    // giving the point of position
    const position: Position = CandidateProgramme.zonalposition;

    if (position) {
      if (CandidateProgramme.programme.type == Type.SINGLE) {
        CandidateProgramme.zonalpoint += position.pointSingle;
      } else if (CandidateProgramme.programme.type == Type.GROUP) {
        CandidateProgramme.zonalpoint += position.pointGroup;
      } else if (CandidateProgramme.programme.type == Type.HOUSE) {
        CandidateProgramme.zonalpoint += position.pointHouse;
      }
    }

    return CandidateProgramme;
  }

  // checking as array contains duplicates
  containsDuplicates(array: number[], positionCount: number) {
    const allowedNumbers = [];
    for (let index = 1; index <= positionCount; index++) {
      allowedNumbers.push(index);
    }
    const encounteredNumbers = new Set();

    for (const num of array) {
      if (allowedNumbers.includes(num)) {
        if (encounteredNumbers.has(num)) {
          return true; // Found a duplicate of 1, 2, or 3
        } else {
          encounteredNumbers.add(num);
        }
      }
    }

    return false; // No duplicate of 1, 2, or 3 found
  }

  judgeResultCheck(
    input: AddResult[],
    candidateProgrammes: CandidateProgramme[],
    judgeName: string,
  ) {
    // SOME FOR DH HOUSING ONLY
    const sortedInput = input.sort((a: AddResult, b: AddResult) => {
      // here each chest no have 4 letters , fist one is letter and other 3 are numbers , so we are taking the last 3 numbers
      const aChestNo = parseInt(a.chestNo.slice(1, 4));
      const bChestNo = parseInt(b.chestNo.slice(1, 4));

      return aChestNo - bChestNo;
    });

    const sortedCandidateProgramme = candidateProgrammes.sort(
      (a: CandidateProgramme, b: CandidateProgramme) => {
        // here each chest no have 4 letters , fist one is letter and other 3 are numbers , so we are taking the last 3 numbers

        const aChestNo = parseInt(a.candidate.chestNO.slice(1, 4));
        const bChestNo = parseInt(b.candidate.chestNO.slice(1, 4));

        return aChestNo - bChestNo;
      },
    );

    for (let i = 0; i < sortedInput.length; i++) {
      const input = sortedInput[i];
      const candidateProgramme = sortedCandidateProgramme[i];

      if (input.chestNo != candidateProgramme.candidate.chestNO) {
        throw new HttpException(
          `Chest No ${input.chestNo} is not match with ${candidateProgramme.candidate.chestNO}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      candidateProgramme[judgeName] = input.mark;

      // save the candidate programme
      this.candidateProgrammeRepository.save(candidateProgramme);
    }

    return sortedCandidateProgramme;
  }

  // async approveJudgeResult(programCode: string, judgeName: string) {
  //   // check if programme exist

  //   const programme: Programme = await this.programmeService.findOneByCode(programCode);

  //   if (!programme) {
  //     throw new HttpException('Programme does not exist', HttpStatus.BAD_REQUEST);
  //   }

  //   // checking the programme is already published

  //   if (programme.resultPublished) {
  //     throw new HttpException('Programme is already published', HttpStatus.BAD_REQUEST);
  //   }

  //   // check if judge name is correct format
  //   const regex = new RegExp(/^judge[1-7]$/);

  //   if (!regex.test(judgeName)) {
  //     throw new HttpException('Judge name is not in correct format', HttpStatus.BAD_REQUEST);
  //   }

  //   // all candidates of programme

  //   let candidatesOfProgrammes: CandidateProgramme[] = programme.candidateProgramme;

  //   // add the mark of judge to mark of candidate programme

  //   for (let index = 0; index < candidatesOfProgrammes.length; index++) {
  //     const candidateProgramme = candidatesOfProgrammes[index];

  //     if (!candidateProgramme[judgeName]) {
  //       throw new HttpException(
  //         `Judge ${judgeName} result is not uploaded`,
  //         HttpStatus.BAD_REQUEST,
  //       );
  //     }

  //     if (candidateProgramme.mark) {
  //       candidateProgramme.mark =
  //         ((candidateProgramme.mark + candidateProgramme[judgeName]) / 20) * 10;
  //     } else {
  //       candidateProgramme.mark = candidateProgramme[judgeName];
  //     }
  //   }

  //   // process the result
  //   candidatesOfProgrammes = await this.processResult(programme);

  //   // set null to judge result
  //   for (let index = 0; index < candidatesOfProgrammes.length; index++) {
  //     const candidateProgramme = candidatesOfProgrammes[index];
  //     candidateProgramme[judgeName] = null;
  //   }

  //   try {
  //     await this.programmeService.enterResult(programCode);
  //     return this.candidateProgrammeRepository.save(candidatesOfProgrammes);
  //   } catch (error) {
  //     throw new HttpException('Error on updating result', HttpStatus.BAD_REQUEST);
  //   }
  // }

  async publishResult(programCode: string) {
    // checking the programme exist

    const programme: Programme = await this.programmeService.findOneByCode(programCode);

    if (!programme) {
      throw new HttpException('Programme does not exist', HttpStatus.BAD_REQUEST);
    }




    // add the point to total point of candidate's team

    // const candidatesOfProgramme: CandidateProgramme[] = programme.candidateProgramme;

    // for (let index = 0; index < candidatesOfProgramme.length; index++) {
    //   const candidateProgramme = candidatesOfProgramme[index];

    //   let Hpoint = 0;
    //   let Gpoint = 0;
    //   let Ipoint = 0;

    //   let ICpoint = 0;
    //   let GCpoint = 0;

    //   if (candidateProgramme.programme?.type == Type.HOUSE) {
    //     Hpoint = candidateProgramme.zonalpoint;
    //   } else if (candidateProgramme.programme?.type == Type.GROUP) {
    //     Gpoint = candidateProgramme.zonalpoint;
    //     GCpoint = candidateProgramme.zonalpoint;
    //   } else if (candidateProgramme.programme?.type == Type.SINGLE) {
    //     Ipoint = candidateProgramme.zonalpoint;
    //     ICpoint = candidateProgramme.zonalpoint;
    //   }

    //   if (candidateProgramme.candidate?.team) {
    //     await this.teamService.setTeamPoint(
    //       candidateProgramme.candidate.team.id,
    //       candidateProgramme.zonalpoint,
    //       Gpoint,
    //       Ipoint,
    //       Hpoint,
    //     );
    //   }

    //   // set the point to candidate

    //   await this.candidateService.addPoint(candidateProgramme.candidate.id, ICpoint, GCpoint);
    // }

    // set the result published to true

    this.programmeService.publishResult(programCode);

    return;
  }

  async publishResults(programCode: [string]) {
    let data = [];
    for (let index = 0; index < programCode.length; index++) {
      const program = programCode[index];
      let programme = await this.publishResult(program);
      data.push(programme);
    }

    return data;
  }

  // upload result mannualy by controller
  async uploadResultManually(programCode: string, input: AddManual[]) {
    // check if programme exist

    const programme: Programme = await this.programmeService.findOneByCode(programCode);

    // all candidates of programme

    let candidatesOfProgramme: CandidateProgramme[] = programme.candidateProgramme.filter(
      (candidateProgramme: CandidateProgramme) => {
        if (programme.mode == Mode.STAGE) {
          return candidateProgramme.zonalposition.value <= 2
        } else {
          return candidateProgramme.zonalposition.value == 1
        }
      },
    );

    if (!programme) {
      throw new HttpException('Programme does not exist', HttpStatus.BAD_REQUEST);
    }

    // checking the programme is already published

    // if (programme.resultPublished) {
    //   throw new HttpException('Programme is already published', HttpStatus.BAD_REQUEST);
    // }

    // verify the result

    await this.verifyResultManual(input, programme.programCode);

    // giving grade to each candidate

    // sort the input

    const sortedInput = input.sort((a: AddManual, b: AddManual) => {
      // sort by chest no which is a string
      const chestNoA: string = a?.chestNo;
      const chestNoB: string = b?.chestNo;

      return chestNoA.localeCompare(chestNoB);
    });

    // sort the candidate programme


    let sortedCandidateProgramme = candidatesOfProgramme.sort(
      (a: CandidateProgramme, b: CandidateProgramme) => {
        // sort by chest no which is a string
        const chestNoA: string = a.candidate?.chestNO;
        const chestNoB: string = b.candidate?.chestNO;

        return chestNoA.localeCompare(chestNoB);
      },
    );

    // mapping the candidates and input

    for (let index = 0; index < sortedInput.length; index++) {
      const input: AddManual = sortedInput[index];
      const candidateProgramme: CandidateProgramme = sortedCandidateProgramme[index];

      let mark = 0;
      candidateProgramme.zonalgrade = null;
      if (input.grade) {
        const grade: Grade = await this.gradeService.findOneByName(input.grade, [
          'id',
          'pointSingle',
          'pointGroup',
          'pointHouse',
          'percentage',
        ]);

        if (grade) {

          candidateProgramme.finalgrade = grade;


          // calculating the mark
          if (programme.type == Type.SINGLE) {
            mark = grade.pointSingle;
          } else if (programme.type == Type.GROUP) {
            mark = grade.pointGroup;
          } else if (programme.type == Type.HOUSE) {
            mark = grade.pointHouse;
          }
        }
      }

      candidateProgramme.zonalposition = null;

      if (input.position) {
        const position: Position = await this.positionService.findOneByName(input.position, [
          'id',
          'pointSingle',
          'pointGroup',
          'pointHouse',
          'name',
        ]);

        if (position) {

          candidateProgramme.finalposition = position;

          // calculating the mark

          if (programme.type == Type.SINGLE) {
            mark += position.pointSingle;
          } else if (programme.type == Type.GROUP) {
            mark += position.pointGroup;
          } else if (programme.type == Type.HOUSE) {
            mark += position.pointHouse;
          }
        }
      }


      candidateProgramme.finalpoint = mark;


      // save the candidate programme

      await this.candidateProgrammeRepository.save(candidateProgramme);
    }

    // make the programme result entered

    await this.programmeService.enterResult(programCode);

    return programme;
  }
}
