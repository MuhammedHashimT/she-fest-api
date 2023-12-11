import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Category } from 'src/category/entities/category.entity';
import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@ObjectType()
@Entity()
export class CategorySettings {

  @Field(() => Int , {nullable : true})
  @PrimaryGeneratedColumn()
  id: number

  // MAX

  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  maxProgram: number;
 
  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  maxSingle: number;
  
  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  maxGroup : number;

  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  maxStage: number;

  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  maxNonStage: number;

  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  maxOutDoor: number;

  // ON SPORTS

  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  maxSports: number;

  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  maxSportsSingle: number;

  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  maxSportsGroup : number;

  // MIN
  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  minProgram: number;

  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  minSingle: number;

  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  minGroup : number;
  
  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  minStage: number;

  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  minNonStage: number;

  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  minOutDoor: number;
  
  // ON SPORTS

  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  minSports: number;

  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  minSportsSingle: number;

  @Field(() => Int , {nullable : true})
  @Column({nullable : true})
  minSportsGroup : number;

  @Field(() => Boolean , {defaultValue : false})
  @Column({default : false})
  isProgrammeListUpdatable: boolean;

  @OneToOne(()=> Category , (category)=> category.settings)
  @Field(()=>Category , {nullable : true})
  category:Category;

  // Date Time
  @Field(() => Date , {nullable : true})
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date , {nullable : true})
  @UpdateDateColumn()
  updatedAt: Date;

}
