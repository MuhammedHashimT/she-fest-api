import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { Candidate } from 'src/candidates/entities/candidate.entity';
import { Grade } from 'src/grades/entities/grade.entity';
import { Position } from 'src/position/entities/position.entity';
import { Programme } from 'src/programmes/entities/programme.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity()
export class CandidateProgramme {
  // Primary generated ID

  @Field(() => Int, { description: '' , nullable: true })
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
  })
  id: number;

  // Normal columns


  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  zonalpoint: number;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  finalpoint: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  link: string;

  @Field(() => Float, { nullable: true })
  @Column({ nullable: true , type:'float'})
  mark: number;

  // ManyToOne relations

  @Field(() => Position, { nullable: true })
  @ManyToOne(() => Position, position => position.zonalcandidateProgramme, {
    eager: true,
    onDelete: 'SET NULL',
  })
  zonalposition: Position;

  @Field(() => Grade, { nullable: true })
  @ManyToOne(() => Grade, grade => grade.zonalcandidateProgramme, { eager: true, onDelete: 'SET NULL' })
  zonalgrade: Grade;

  @Field(() => Position, { nullable: true })
  @ManyToOne(() => Position, position => position.finalcandidateProgramme, {
    eager: true,
    onDelete: 'SET NULL',
  })
  finalposition: Position;

  @Field(() => Grade, { nullable: true })
  @ManyToOne(() => Grade, grade => grade.finalcandidateProgramme, { eager: true, onDelete: 'SET NULL' })
  finalgrade: Grade;


  @Field(() => Programme , { nullable: true })
  @ManyToOne(() => Programme, programme => programme.candidateProgramme, {
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinTable()
  programme: Programme;

  @Field(() => Candidate , { nullable: true })
  @ManyToOne(() => Candidate, candidate => candidate.candidateProgrammes, {
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinTable()
  candidate: Candidate;

  @Field(() => [Candidate] , { nullable: true } )  
  @ManyToMany(() => Candidate , candidate => candidate.cgp)
  @JoinTable()
  candidatesOfGroup : Candidate[];

  // Dates

  @CreateDateColumn()
  @Field(() => Date , { nullable: true })
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date , { nullable: true })
  updatedAt: Date;
}
