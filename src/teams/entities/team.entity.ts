import { ObjectType, Field, Int } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Candidate } from 'src/candidates/entities/candidate.entity';
import { Expose } from 'class-transformer';
import { Credential } from 'src/credentials/entities/credential.entity';
import { Zone } from 'src/zone/entities/zone.entity';

@ObjectType()
@Entity()
export class Team {
  // Primary generated ID

  @PrimaryGeneratedColumn()
  @Field(() => Int, { nullable: true })
  id: number;

  // Normal Columns

  @Column({ unique: true })
  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  shortName: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  description: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  color: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  totalPoint: number;

  @Column({ nullable: true })
  @Field({ nullable: true })
  lastResultPoint: number;

  @Column({ nullable: true })
  @Field({ nullable: true })
  HousePoint: number;

  @Column({ nullable: true })
  @Field({ nullable: true })
  GroupPoint: number;

  @Column({ nullable: true })
  @Field({ nullable: true })
  IndividualPoint: number;

  @Column({ nullable: true })
  @Field({ nullable: true })
  totalSportsPoint: number;

  @Column({ nullable: true })
  @Field({ nullable: true })
  HouseSportsPoint: number;

  @Column({ nullable: true })
  @Field({ nullable: true })
  GroupSportsPoint: number;

  @Column({ nullable: true })
  @Field({ nullable: true })
  IndividualSportsPoint: number;

  @Expose({ name: 'chest_no_series' })
  @Column({ nullable: true })
  @Field(() => Int, { nullable: true })
  chestNoSeries: number;

  // OneToOne relations

  @OneToMany(() => Credential, creadetial => creadetial.team)
  @Field(() => [Credential], { nullable: true })
  credentials: Credential[];

  // OneToMany relations

  @OneToMany(() => Candidate, candidate => candidate.team)
  @Field(() => [Candidate], { nullable: true })
  candidates: Candidate[];

  // many to one relationship with zone

  @ManyToOne(() => Zone, zone => zone.teams)
  @JoinColumn()
  @Field(() => Zone, { nullable: true })
  zone: Zone;

  // Dates

  @CreateDateColumn()
  @Field(() => Date, { nullable: true })
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date, { nullable: true })
  updatedAt: Date;
}
