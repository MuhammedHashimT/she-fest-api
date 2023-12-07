import { InputType, Int, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class CreateZoneInput {
  @Field(() => String, { description: 'Example field (placeholder)' })
  @IsNotEmpty()
  name: string;
}
