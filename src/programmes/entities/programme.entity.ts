import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { CandidateProgramme } from 'src/candidate-programme/entities/candidate-programme.entity';
import { Category } from 'src/category/entities/category.entity';
import { CustomSetting } from 'src/custom-settings/entities/custom-setting.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum Mode {
  STAGE = 'STAGE',
  NON_STAGE = 'NON_STAGE',
  OUTDOOR_STAGE = 'OUTDOOR_STAGE',
}

export enum Type {
  SINGLE = 'SINGLE',
  GROUP = 'GROUP',
  HOUSE = 'HOUSE',
}

registerEnumType(Mode, {
  name: 'Modes',
});

registerEnumType(Type, {
  name: 'Types',
});


@ObjectType()
@Entity()
export class Programme {
  // Primary generated ID

  @Field(() => Int, { description: 'Example field (placeholder)', nullable: true })
  @PrimaryGeneratedColumn()
  id: number;

  // Normal columns

  @Column({ unique: true })
  @Field({ nullable: true })
  programCode: string;

  @Column()
  @Field({ nullable: true })
  name: string;

  @Column()
  @Field(() => Mode, { nullable: true })
  mode: Mode;

  @Column()
  @Field(() => Type, { nullable: true })
  type: Type;


  @Column({ nullable: true })
  @Field(() => Int, { nullable: true })
  groupCount: number;

  @Column()
  @Field(() => Int, { nullable: true })
  candidateCount: number;

  @Column({ nullable: true })
  @Field(() => Date, { nullable: true })
  date: Date;

  @Column({ nullable: true })
  @Field(() => Int, { nullable: true })
  venue: number;

  @Column()
  @Field(() => Int)
  duration: number;

  @Field(() => Int, { nullable: true })
  @Column({ default: 10 })
  totalMark: number;

  @Column()
  @Field({ nullable: true })
  conceptNote: string;
  @Column({ default: false })
  @Field(() => Boolean, { defaultValue: false })
  enteredA: Boolean;

  @Column({ default: false })
  @Field(() => Boolean, { defaultValue: false })
  enteredB: Boolean;

  @Column({ default: false })
  @Field(() => Boolean, { defaultValue: false })
  enteredC: Boolean;

  @Column({ default: false })
  @Field(() => Boolean, { defaultValue: false })
  enteredD: Boolean;

  @Column({ default: false })
  @Field(() => Boolean, { defaultValue: false })
  enteredE: Boolean;

  @Column({ default: false })
  @Field(() => Boolean, { defaultValue: false })
  enteredFinal: Boolean;

  @Column({ default: false })
  @Field(() => Boolean, { defaultValue: false })
  publishedA: Boolean;

  @Column({ default: false })
  @Field(() => Boolean, { defaultValue: false })
  publishedB: Boolean;

  @Column({ default: false })
  @Field(() => Boolean, { defaultValue: false })
  publishedC: Boolean;

  @Column({ default: false })
  @Field(() => Boolean, { defaultValue: false })
  publishedD: Boolean;

  @Column({ default: false })
  @Field(() => Boolean, { defaultValue: false })
  publishedE: Boolean;

  @Column({ default: false })
  @Field(() => Boolean, { defaultValue: false })
  publishedFinal: Boolean;


  @Field(() => Boolean, { defaultValue: false })
  resultPublished: Boolean;

  @Field(() => Boolean, { defaultValue: false })
  resultEntered: Boolean;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  checkToReadNo: number;

  @Column({ default: false })
  @Field(() => Boolean, { defaultValue: false })
  anyIssue: boolean;


  // OneToMany relations

  @OneToMany(() => CandidateProgramme, CandidateProgramme => CandidateProgramme.programme)
  @JoinTable()
  @Field(() => [CandidateProgramme], { nullable: true })
  candidateProgramme: CandidateProgramme[];


  @ManyToOne(() => Category, category => category.programmes, { eager: true, onDelete: 'SET NULL' })
  @Field(() => Category, { nullable: true })
  category: Category;

  @ManyToOne(() => CustomSetting , customSetting => customSetting.programmes, { eager: true, onDelete: 'SET NULL' })
  @Field(() => CustomSetting, { nullable: true })
  customSetting: CustomSetting;

  // Dates

  @Expose()
  @Field(() => Date, { nullable: true })
  @CreateDateColumn()
  createdAt: Date;

  @Expose()
  @Field(() => Date, { nullable: true })
  @UpdateDateColumn()
  updatedAt: Date;
}
