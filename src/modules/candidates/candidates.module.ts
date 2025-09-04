import { Module } from '@nestjs/common';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { CandidateSelfController } from './candidate-self.controller';

@Module({
  controllers: [
    CandidatesController,
    CandidateSelfController
  ],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
