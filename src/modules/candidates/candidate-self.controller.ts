import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { JwtCandidateGuard } from '../../common/guards/jwt-candidate.guard';

import { CreateCandidateSkillDto } from './dto/skills/create-candidate-skill.dto';
import { UpdateCandidateSkillDto } from './dto/skills/update-candidate-skill.dto';
import { CreateCandidateWorkExpDto } from './dto/work-exps/create-candidate-work-exp.dto';
import { UpdateCandidateWorkExpDto } from './dto/work-exps/update-candidate-work-exp.dto';

/**
 * Self-service endpoints for authenticated candidates.
 * No RBAC permission checks; guarded by JwtCandidateGuard (user.typ === 'candidate').
 */
@UseGuards(JwtCandidateGuard)
@Controller('me')
export class CandidateSelfController {
  constructor(private readonly service: CandidatesService) {}

  @Get()
  getMe(@Req() req: any) {
    const candidateId: string = req.user.id;
    return this.service.detailsExpanded(candidateId);
  }
  // -------- Skills --------
  @Post('skills')
  addMySkill(@Body() dto: CreateCandidateSkillDto, @Req() req: any) {
    const candidateId: string = req.user.id;
    return this.service.addSkill(candidateId, dto);
  }

  @Put('skills/:skillId')
  updateMySkill(@Param('skillId') skillId: string, @Body() dto: UpdateCandidateSkillDto, @Req() req: any) {
    const candidateId: string = req.user.id;
    return this.service.updateSkill(candidateId, skillId, dto);
  }

  @Delete('skills/:skillId')
  deleteMySkill(@Param('skillId') skillId: string, @Req() req: any) {
    const candidateId: string = req.user.id;
    return this.service.deleteSkill(candidateId, skillId);
  }

  // -------- Work Experiences --------
  @Post('work-exps')
  addMyWorkExp(@Body() dto: CreateCandidateWorkExpDto, @Req() req: any) {
    const candidateId: string = req.user.id;
    return this.service.addWorkExp(candidateId, dto);
  }

  @Put('work-exps/:workId')
  updateMyWorkExp(@Param('workId') workId: string, @Body() dto: UpdateCandidateWorkExpDto, @Req() req: any) {
    const candidateId: string = req.user.id;
    return this.service.updateWorkExp(candidateId, workId, dto);
  }

  @Delete('work-exps/:workId')
  deleteMyWorkExp(@Param('workId') workId: string, @Req() req: any) {
    const candidateId: string = req.user.id;
    return this.service.deleteWorkExp(candidateId, workId);
  }
}
