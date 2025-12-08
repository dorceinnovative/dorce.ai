import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { TradingService } from './trading.service';
import { TradingPortfolioService } from './trading-portfolio.service';
import { TradingMarketService } from './trading-market.service';
import { TradingOrderService } from './trading-order.service';
import { TradingRiskService } from './trading-risk.service';
import { TradingAnalyticsService } from './trading-analytics.service';
import { TradingIntegrationService } from './trading-integration.service';

@Controller('trading')
export class TradingController {
  constructor(
    private readonly tradingService: TradingService,
    private readonly portfolioService: TradingPortfolioService,
    private readonly marketService: TradingMarketService,
    private readonly orderService: TradingOrderService,
    private readonly riskService: TradingRiskService,
    private readonly analyticsService: TradingAnalyticsService,
    private readonly integrationService: TradingIntegrationService,
  ) {}

  @Post('assets')
  async createAsset(@Body() assetData: any, @Req() req: any) {
    return this.tradingService.createAsset(assetData, req.user.id);
  }

  @Get('assets')
  async getAssets(@Req() req: any) {
    return this.tradingService.getAssets(req.user.id);
  }

  @Get('assets/:id')
  async getAsset(@Param('id') id: string, @Req() req: any) {
    return this.tradingService.getAsset(id, req.user.id);
  }

  @Post('portfolio/create')
  async createPortfolio(@Body() portfolioData: any, @Req() req: any) {
    return this.portfolioService.createPortfolio(portfolioData, req.user.id);
  }

  @Get('portfolio/:id')
  async getPortfolio(@Param('id') id: string, @Req() req: any) {
    return this.portfolioService.getPortfolio(id, req.user.id);
  }

  @Get('portfolio/:id/performance')
  async getPortfolioPerformance(@Param('id') id: string, @Req() req: any) {
    return this.portfolioService.getPortfolioPerformance(id, req.user.id);
  }

  @Post('orders')
  async createOrder(@Body() orderData: any, @Req() req: any) {
    return this.orderService.createOrder(orderData, req.user.id);
  }

  @Get('orders')
  async getOrders(@Req() req: any) {
    return this.orderService.getOrders(req.user.id);
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string, @Req() req: any) {
    return this.orderService.getOrder(id, req.user.id);
  }

  @Post('orders/:id/cancel')
  async cancelOrder(@Param('id') id: string, @Req() req: any) {
    return this.orderService.cancelOrder(id, req.user.id);
  }

  @Get('market/data')
  async getMarketData(@Req() req: any) {
    return this.marketService.getMarketData(req.user.id);
  }

  @Get('market/trends')
  async getMarketTrends(@Req() req: any) {
    return this.marketService.getMarketTrends(req.user.id);
  }

  @Post('market/analysis')
  async analyzeMarket(@Body() analysisData: any, @Req() req: any) {
    return this.marketService.analyzeMarket(analysisData, req.user.id);
  }

  @Get('risk/profile')
  async getRiskProfile(@Req() req: any) {
    // Get risk limits as risk profile
    return this.riskService.checkRiskLimits(req.user.id, { quantity: 0, price: 0, symbol: '' });
  }

  @Post('risk/assess')
  async assessRisk(@Body() riskData: any, @Req() req: any) {
    return this.riskService.assessRisk(riskData, req.user.id);
  }

  @Get('analytics/dashboard')
  async getAnalyticsDashboard(@Req() req: any) {
    return this.analyticsService.getTradingAnalytics(req.user.id, 'monthly');
  }

  @Get('analytics/portfolio/:id')
  async getPortfolioAnalytics(@Param('id') id: string, @Req() req: any) {
    return this.portfolioService.getPortfolioAnalytics(id, req.user.id);
  }

  @Post('integration/connect')
  async connectBroker(@Body() brokerData: any, @Req() req: any) {
    return this.integrationService.connectBroker(brokerData, req.user.id);
  }

  @Get('integration/brokers')
  async getConnectedBrokers(@Req() req: any) {
    return this.integrationService.getConnectedBrokers(req.user.id);
  }

  @Post('execute-trade')
  async executeTrade(@Body() tradeData: any, @Req() req: any) {
    return this.tradingService.executeTrade(tradeData, req.user.id);
  }

  @Get('positions')
  async getPositions(@Req() req: any) {
    return this.tradingService.getPositions(req.user.id);
  }

  @Get('performance')
  async getPerformance(@Req() req: any) {
    return this.tradingService.getPerformance(req.user.id);
  }

  @Post('rebalance')
  async rebalancePortfolio(@Body() rebalanceData: any, @Req() req: any) {
    return this.portfolioService.rebalancePortfolio(rebalanceData, req.user.id);
  }

  @Get('alerts')
  async getAlerts(@Req() req: any) {
    return this.tradingService.getAlerts(req.user.id);
  }

  @Post('alerts')
  async createAlert(@Body() alertData: any, @Req() req: any) {
    return this.tradingService.createAlert(alertData, req.user.id);
  }

  @Get('analytics/insights')
  async getInsights(@Req() req: any) {
    return this.analyticsService.getPortfolioPerformance(req.user.id);
  }

  @Post('analytics/backtest')
  async backtestStrategy(@Body() strategyData: any, @Req() req: any) {
    // Use portfolio performance as simplified backtest
    return this.analyticsService.getPortfolioPerformance(req.user.id);
  }
}