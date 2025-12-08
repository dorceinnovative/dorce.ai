import { Controller, Get, Post, Body, Param, UseGuards, Req, HttpStatus, ValidationPipe, HttpException, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LoanService, LoanApplicationDto, LoanRepaymentDto, LoanTopUpDto, LoanRestructureDto } from '../services/loan.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Loans')
@Controller('loans')
export class LoanController {
  constructor(
    private readonly loanService: LoanService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new loan application' })
  @ApiResponse({ status: 201, description: 'Loan application created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createApplication(
    @Req() req,
    @Body(new ValidationPipe()) createDto: LoanApplicationDto,
  ) {
    const application = await this.loanService.createApplication({
      ...createDto,
      userId: req.user.id,
    });
    return { success: true, message: 'Loan application submitted successfully', data: application };
  }

  @Get('applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user loan applications' })
  @ApiResponse({ status: 200, description: 'Applications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserApplications(@Request() req) {
    const applications = await this.loanService.getUserApplications(req.user.id);
    return { success: true, message: 'Loan applications retrieved successfully', data: applications };
  }

  @Get('applications/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get loan application by ID' })
  @ApiResponse({ status: 200, description: 'Application retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getApplicationById(@Request() req, @Param('id') id: string) {
    const application = await this.loanService.getApplicationById(id);
    if (application.userId !== req.user.id && !req.user.roles?.includes('admin')) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    return { success: true, message: 'Loan application retrieved successfully', data: application };
  }

  @Get('applications/:id/repayments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get loan repayment schedule' })
  @ApiResponse({ status: 200, description: 'Repayment schedule retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRepaymentSchedule(@Req() req, @Param('id') id: string) {
    const application = await this.loanService.getApplicationById(id);
    if (application.userId !== req.user.id) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    return { success: true, message: 'Repayment schedule retrieved successfully', data: application.repayments };
  }

  @Post('repayments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process loan repayment' })
  @ApiResponse({ status: 200, description: 'Repayment processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async processRepayment(
    @Req() req,
    @Body(new ValidationPipe()) repaymentDto: LoanRepaymentDto,
  ) {
    const result = await this.loanService.processRepayment(repaymentDto);
    return { success: true, message: 'Repayment processed successfully', data: result };
  }

  @Post('top-up')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request loan top-up' })
  @ApiResponse({ status: 200, description: 'Top-up processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async topUpLoan(
    @Req() req,
    @Body(new ValidationPipe()) topUpDto: LoanTopUpDto,
  ) {
    const loan = await this.prisma.loanApplication.findUnique({ where: { id: topUpDto.loanApplicationId }, select: { userId: true } });
    if (!loan || loan.userId !== req.user.id) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    const result = await this.loanService.topUpLoan(topUpDto);
    return { success: true, message: 'Loan top-up processed successfully', data: result };
  }

  @Post('restructure')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request loan restructuring' })
  @ApiResponse({ status: 200, description: 'Restructuring processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async restructureLoan(
    @Req() req,
    @Body(new ValidationPipe()) restructureDto: LoanRestructureDto,
  ) {
    const loan = await this.prisma.loanApplication.findUnique({ where: { id: restructureDto.loanApplicationId }, select: { userId: true } });
    if (!loan || loan.userId !== req.user.id) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    const result = await this.loanService.restructureLoan(restructureDto);
    return { success: true, message: 'Loan restructuring processed successfully', data: result };
  }

  @Get('overdue')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get overdue loans (for user)' })
  @ApiResponse({ status: 200, description: 'Overdue loans retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserOverdueLoans(@Req() req) {
    const allOverdue = await this.loanService.getOverdueLoans();
    const userOverdue = allOverdue.filter(repayment => repayment.loanApplication.userId === req.user.id);
    return { success: true, message: 'Overdue loans retrieved successfully', data: userOverdue };
  }

  @Post('applications/:id/reminder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send repayment reminder' })
  @ApiResponse({ status: 200, description: 'Reminder sent successfully' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendRepaymentReminder(@Req() req, @Param('id') id: string) {
    const loan = await this.prisma.loanApplication.findUnique({ where: { id }, select: { userId: true } });
    if (!loan || loan.userId !== req.user.id) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    const result = await this.loanService.sendRepaymentReminder(id);
    return { success: true, message: 'Reminder sent successfully', data: result };
  }
}
