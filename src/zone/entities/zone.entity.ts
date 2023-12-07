import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Team } from 'src/teams/entities/team.entity';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Zone {
  // Primary generated ID

  @Field(() => Int, { description: '', nullable: true })
  @PrimaryGeneratedColumn()
  id: number;

  // Normal columns

  @Column({ unique: true })
  @Field({ nullable: true })
  name: string;

  // one to many relationship with zone

  @OneToMany(() => Team, (team) => team.zone)
  @Field(() => [Team], { nullable: true })
  teams: Team[];

  // Dates

  @CreateDateColumn()
  @Field(() => Date, { nullable: true })
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date, { nullable: true })
  updatedAt: Date;
}
