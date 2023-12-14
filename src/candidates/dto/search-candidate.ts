import { Field, ObjectType } from "@nestjs/graphql";
import { Candidate } from "../entities/candidate.entity";

@ObjectType()
export class SearchCandidate {
    @Field()
    totalCandidates: number;

    @Field(()=>[Candidate])
    candidates: Candidate[];
}