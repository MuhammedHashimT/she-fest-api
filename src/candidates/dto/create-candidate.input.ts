import { InputType, Int, Field } from '@nestjs/graphql';
import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { IsFourCharactersWithNumbers } from 'src/utils/Validator';

@InputType()
export class CreateCandidateInput {
  @IsNotEmpty()
  @Field()
  name: string;


  // @IsFourCharactersWithNumbers({message:"chest number must be 4 characters and last 3 characters must be numbers"})
  @Field({ nullable: true })
  chestNO : string;

  @Field( { nullable: true })
  team: string;

  @Field({ nullable: true })
  category: string;
}
