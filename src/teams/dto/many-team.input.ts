import { InputType, Field } from '@nestjs/graphql';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTeamInput } from './create-team.input';

@InputType()
export class ManyTeamInput {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTeamInput)
  @Field(() => [CreateTeamInput])
  inputs: CreateTeamInput[];
}
