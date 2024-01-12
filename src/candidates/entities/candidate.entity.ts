import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { CandidateProgramme } from 'src/candidate-programme/entities/candidate-programme.entity';
import { Category } from 'src/category/entities/category.entity';
import { Team } from 'src/teams/entities/team.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';



@Entity()
@ObjectType()
export class Candidate {
  // Primary generated ID

  @PrimaryGeneratedColumn()
  @Field(() => Int, { description: 'Example field (placeholder)', nullable: true })
  id: number;

  // Normal columns

  @Column()
  @Field({ nullable: true })
  name: string;


  @Column({ nullable: true, unique: true })
  @Field({ nullable: true })
  chestNO: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  avatar: string;

  @Column({ nullable: true  , default : false} )
  @Field( () => Boolean , { nullable: false } )
  iamReady: boolean;

  @Column({ nullable: true  , default : false} )
  @Field( () => Boolean , { nullable: false } )
  iNeedFoodAndAccommodation: boolean;

  @Column({ nullable: true })
  @Field({ nullable: true })
  individualPoint: number;

  @Column({ nullable: true })
  @Field({ nullable: true })
  groupPoint: number;

  // OneTOMany relations

  @OneToMany(() => CandidateProgramme, candidateProgramme => candidateProgramme.candidate)
  @Field(() => [CandidateProgramme], { nullable: true })
  candidateProgrammes: CandidateProgramme[];

  // ManyToOne relations

  @ManyToOne(() => Team, team => team.candidates, { eager: true, onDelete: 'SET NULL' })
  @Field(() => Team, { nullable: true })
  team: Team;

  @ManyToOne(() => Category, category => category.candidates, { eager: true, onDelete: 'SET NULL' })
  @Field(() => Category, { nullable: true })
  category: Category;

  @ManyToMany(() => CandidateProgramme, candidateProgramme => candidateProgramme.candidatesOfGroup)
  @Field(() => [CandidateProgramme], { nullable: true })
  cgp: CandidateProgramme[];



  // Dates

  @CreateDateColumn()
  @Field(() => Date, { nullable: true })
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date, { nullable: true })
  updatedAt: Date;  
}
