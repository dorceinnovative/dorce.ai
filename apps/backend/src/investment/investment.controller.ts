import { Controller, Get, Post, Put, Delete, Body, Param, Req } from '@nestjs/common';
import { InvestmentService } from './investment.service';
import { InvestmentPortfolioService } from './investment-portfolio.service';
import { InvestmentRiskService } from './investment-risk.service';
import { InvestmentRecommendationService } from './investment-recommendation.service';
import { InvestmentMarketService } from './investment-market.service';

@Controller('investment')
export class InvestmentController {
  constructor(
    private readonly investmentService: InvestmentService,
    private readonly portfolioService: InvestmentPortfolioService,
    private readonly riskService: InvestmentRiskService,
    private readonly recommendationService: InvestmentRecommendationService,
    private readonly marketService: InvestmentMarketService,
  ) {}

  @Post('portfolios')
  async createPortfolio(@Body() portfolioData: any, @Req() req: any) {
    return this.portfolioService.createPortfolio({
      ...portfolioData,
      userId: req.user.id
    });
  }

  @Get('portfolios')
  async getPortfolios(@Req() req: any) {
    return this.portfolioService.getUserPortfolios(req.user.id);
  }

  @Get('portfolios/:id')
  async getPortfolio(@Param('id') id: string, @Req() req: any) {
    return this.portfolioService.getPortfolio(id, req.user.id);
  }

  @Put('portfolios/:id')
  async updatePortfolio(@Param('id') id: string, @Body() portfolioData: any, @Req() req: any) {
    return this.portfolioService.updatePortfolioAllocation(id, req.user.id, portfolioData.allocation);
  }

  @Post('portfolios/:id/performance')
  async updatePortfolioPerformance(@Param('id') id: string, @Body() performanceData: any, @Req() req: any) {
    return this.portfolioService.updatePortfolioPerformance(id, req.user.id, performanceData);
  }

  @Post('investments')
  async createInvestment(@Body() investmentData: any, @Req() req: any) {
    return this.investmentService.createInvestment({
      ...investmentData,
      userId: req.user.id
    });
  }

  @Get('investments/:id')
  async getInvestment(@Param('id') id: string, @Req() req: any) {
    return this.investmentService.getInvestment(id, req.user.id);
  }

  // Analytics methods removed - service not implemented

  // Risk methods removed - methods not implemented in service

  @Get('recommendations')
  async getRecommendations(@Req() req: any) {
    return this.recommendationService.getUserRecommendations(req.user.id);
  }

  @Post('recommendations/generate')
  async generateRecommendations(@Body() recommendationData: any, @Req() req: any) {
    return this.recommendationService.generateRecommendations(recommendationData);
  }

  @Get('market/data')
  async getMarketData(@Body() symbolsData: any, @Req() req: any) {
    return this.marketService.getMarketData(symbolsData.symbols || ['AAPL', 'GOOGL', 'MSFT']);
  }

  @Get('market/trends')
  async getMarketTrends(@Body() symbolsData: any, @Req() req: any) {
    return this.marketService.getMarketTrends(symbolsData.symbols || ['AAPL', 'GOOGL', 'MSFT']);
  }
}