import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchService {
  constructor(private readonly prisma: PrismaService) {}

  create(businessId: string, dto: CreateBranchDto) {
    return this.prisma.branch.create({ data: { businessId, ...dto } });
  }

  findAll(businessId: string) {
    return this.prisma.branch.findMany({ where: { businessId } });
  }

  async update(businessId: string, branchId: string, dto: UpdateBranchDto) {
    await this.assertBelongsToBusiness(businessId, branchId);
    return this.prisma.branch.update({ where: { id: branchId }, data: dto });
  }

  private async assertBelongsToBusiness(businessId: string, branchId: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch || branch.businessId !== businessId) {
      throw new NotFoundException('شعبه یافت نشد');
    }
    return branch;
  }
}
