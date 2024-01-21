import { Field, ObjectType } from "@nestjs/graphql"
import { Programme } from "../entities/programme.entity"
import { candidateWithPoint, teamWithPoint, zonesWithPoint } from "../programmes.service"

@ObjectType()
export class ResultsRead {

    @Field(() => [Programme])
    programmes: [Programme];

    @Field(() => [teamWithPoint])
    topTeams: [teamWithPoint];

    @Field(() => [candidateWithPoint])
    topCandidates: [candidateWithPoint]
}

@ObjectType()
export class ResultsReadFinal {

    @Field(() => [Programme])
    programmes: [Programme];

    @Field(() => [teamWithPoint])
    topTeams: [teamWithPoint];

    @Field(() => [candidateWithPoint])
    topCandidates: [candidateWithPoint]

    @Field(() => [zonesWithPoint])
    zonesWithPoint: [zonesWithPoint]
}