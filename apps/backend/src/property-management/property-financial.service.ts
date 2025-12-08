import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface PropertyFinancialSummary {
  propertyId: string;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  monthlyAverage: number;
  annualProjection: number;
  expenseBreakdown: Record<string, number>;
}

export interface PropertyCashFlow {
  propertyId: string;
  monthlyCashFlow: Array<{
    month: string;
    income: number;
    expenses: number;
    netCashFlow: number;
  }>;
  totalCashFlow: number;
  averageMonthlyCashFlow: number;
  cashFlowTrend: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

@Injectable()
export class PropertyFinancialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async getPropertyFinancialSummary(userId: string, propertyId: string): Promise<PropertyFinancialSummary> {
    try {
      // Get property data
      const propertyDoc = await this.prisma.document.findFirst({
        where: {
          id: propertyId,
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_RECORD'
        }
      });

      if (!propertyDoc) {
        throw new Error('Property not found');
      }

      const property = JSON.parse(propertyDoc.fileUrl || '{}');
      
      // Calculate financial summary (simplified)
      const monthlyRent = property.monthlyRent || 0;
      const totalIncome = monthlyRent * 12; // Annual income
      const totalExpenses = totalIncome * 0.3; // Assume 30% expenses
      const netIncome = totalIncome - totalExpenses;
      const monthlyAverage = netIncome / 12;
      const annualProjection = netIncome;

      const expenseBreakdown = {
        'Maintenance': totalExpenses * 0.4,
        'Property Management': totalExpenses * 0.2,
        'Insurance': totalExpenses * 0.15,
        'Taxes': totalExpenses * 0.15,
        'Utilities': totalExpenses * 0.1
      };

      await this.auditService.log({
        userId,
        action: 'PROPERTY_FINANCIAL_SUMMARY_ACCESSED',
        resourceType: 'PROPERTY',
        resourceId: propertyId,
        actionDetails: { 
          totalIncome, 
          netIncome, 
          monthlyAverage 
        }
      });

      return {
        propertyId,
        totalIncome,
        totalExpenses,
        netIncome,
        monthlyAverage,
        annualProjection,
        expenseBreakdown
      };
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'PROPERTY_FINANCIAL_SUMMARY_ACCESS_FAILED',
        resourceType: 'PROPERTY',
        resourceId: propertyId,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getPropertyCashFlow(userId: string, propertyId: string, months: number = 12): Promise<PropertyCashFlow> {
    try {
      const propertyDoc = await this.prisma.document.findFirst({
        where: {
          id: propertyId,
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_RECORD'
        }
      });

      if (!propertyDoc) {
        throw new Error('Property not found');
      }

      const property = JSON.parse(propertyDoc.fileUrl || '{}');
      
      // Generate monthly cash flow data (simplified)
      const monthlyCashFlow: any[] = [];
      let totalCashFlow = 0;

      for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toISOString().slice(0, 7); // YYYY-MM format

        const income = property.monthlyRent || 0;
        const expenses = income * 0.3; // 30% expenses
        const netCashFlow = income - expenses;

        monthlyCashFlow.push({
          month,
          income,
          expenses,
          netCashFlow
        });

        totalCashFlow += netCashFlow;
      }

      const averageMonthlyCashFlow = totalCashFlow / months;
      
      // Determine trend
      let cashFlowTrend: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
      if (averageMonthlyCashFlow > 100) {
        cashFlowTrend = 'POSITIVE';
      } else if (averageMonthlyCashFlow < -100) {
        cashFlowTrend = 'NEGATIVE';
      } else {
        cashFlowTrend = 'NEUTRAL';
      }

      await this.auditService.log({
        userId,
        action: 'PROPERTY_CASH_FLOW_ACCESSED',
        resourceType: 'PROPERTY',
        resourceId: propertyId,
        actionDetails: { 
          totalCashFlow, 
          averageMonthlyCashFlow, 
          cashFlowTrend 
        }
      });

      return {
        propertyId,
        monthlyCashFlow,
        totalCashFlow,
        averageMonthlyCashFlow,
        cashFlowTrend
      };
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'PROPERTY_CASH_FLOW_ACCESS_FAILED',
        resourceType: 'PROPERTY',
        resourceId: propertyId,
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getPortfolioFinancialSummary(userId: string): Promise<{
    totalPortfolioValue: number;
    totalMonthlyIncome: number;
    totalMonthlyExpenses: number;
    totalNetIncome: number;
    properties: PropertyFinancialSummary[];
  }> {
    try {
      const propertyDocs = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_RECORD'
        }
      });

      const properties = propertyDocs.map(doc => JSON.parse(doc.fileUrl || '{}'));
      
      const propertySummaries: any[] = [];
      let totalPortfolioValue = 0;
      let totalMonthlyIncome = 0;
      let totalMonthlyExpenses = 0;

      for (const doc of propertyDocs) {
        const summary = await this.getPropertyFinancialSummary(userId, doc.id);
        propertySummaries.push(summary);
        
        totalPortfolioValue += summary.totalIncome; // Simplified
        totalMonthlyIncome += summary.totalIncome / 12;
        totalMonthlyExpenses += summary.totalExpenses / 12;
      }

      const totalNetIncome = totalMonthlyIncome - totalMonthlyExpenses;

      await this.auditService.log({
        userId,
        action: 'PORTFOLIO_FINANCIAL_SUMMARY_ACCESSED',
        resourceType: 'PROPERTY',
        actionDetails: { 
          totalPortfolioValue, 
          totalMonthlyIncome, 
          totalNetIncome 
        }
      });

      return {
        totalPortfolioValue,
        totalMonthlyIncome,
        totalMonthlyExpenses,
        totalNetIncome,
        properties: propertySummaries
      };
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'PORTFOLIO_FINANCIAL_SUMMARY_ACCESS_FAILED',
        resourceType: 'PROPERTY',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getFinancialOverview(userId: string): Promise<any> {
    try {
      const propertyDocs = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_RECORD'
        }
      });

      const properties = propertyDocs.map(doc => JSON.parse(doc.fileUrl || '{}'));
      
      const totalProperties = properties.length;
      const totalValue = properties.reduce((sum, prop) => sum + (prop.currentValue || 0), 0);
      const totalMonthlyIncome = properties.reduce((sum, prop) => sum + (prop.monthlyRent || 0), 0);
      const totalAnnualIncome = totalMonthlyIncome * 12;

      const overview = {
        totalProperties,
        totalValue,
        totalMonthlyIncome,
        totalAnnualIncome,
        averagePropertyValue: totalProperties > 0 ? totalValue / totalProperties : 0,
        averageMonthlyRent: totalProperties > 0 ? totalMonthlyIncome / totalProperties : 0
      };

      await this.auditService.log({
        userId,
        action: 'FINANCIAL_OVERVIEW_ACCESSED',
        resourceType: 'PROPERTY_FINANCIAL',
        resourceId: 'OVERVIEW',
        actionDetails: { totalProperties, totalValue }
      });

      return overview;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'FINANCIAL_OVERVIEW_FAILED',
        resourceType: 'PROPERTY_FINANCIAL',
        resourceId: 'OVERVIEW',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async getFinancialReports(userId: string): Promise<any> {
    try {
      const propertyDocs = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_RECORD'
        }
      });

      const properties = propertyDocs.map(doc => JSON.parse(doc.fileUrl || '{}'));
      
      const reports = properties.map(property => ({
        propertyId: property.id,
        propertyTitle: property.title,
        monthlyRent: property.monthlyRent || 0,
        annualRent: (property.monthlyRent || 0) * 12,
        estimatedExpenses: (property.monthlyRent || 0) * 12 * 0.3, // 30% of annual rent
        netIncome: (property.monthlyRent || 0) * 12 * 0.7, // 70% of annual rent
        currentValue: property.currentValue || 0
      }));

      await this.auditService.log({
        userId,
        action: 'FINANCIAL_REPORTS_ACCESSED',
        resourceType: 'PROPERTY_FINANCIAL',
        resourceId: 'REPORTS',
        actionDetails: { propertyCount: properties.length }
      });

      return reports;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'FINANCIAL_REPORTS_FAILED',
        resourceType: 'PROPERTY_FINANCIAL',
        resourceId: 'REPORTS',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }

  async generateReport(userId: string, reportData: any): Promise<any> {
    try {
      const propertyDocs = await this.prisma.document.findMany({
        where: {
          userId,
          type: 'OTHER',
          fileName: 'PROPERTY_RECORD'
        }
      });

      const properties = propertyDocs.map(doc => JSON.parse(doc.fileUrl || '{}'));
      
      // Generate custom report based on reportData criteria
      const report = {
        generatedAt: new Date().toISOString(),
        reportType: reportData.type || 'GENERAL',
        properties: properties.map(property => ({
          id: property.id,
          title: property.title,
          value: property.currentValue || 0,
          monthlyRent: property.monthlyRent || 0,
          status: property.status || 'UNKNOWN'
        })),
        summary: {
          totalProperties: properties.length,
          totalValue: properties.reduce((sum, prop) => sum + (prop.currentValue || 0), 0),
          totalMonthlyRent: properties.reduce((sum, prop) => sum + (prop.monthlyRent || 0), 0)
        }
      };

      await this.auditService.log({
        userId,
        action: 'FINANCIAL_REPORT_GENERATED',
        resourceType: 'PROPERTY_FINANCIAL',
        resourceId: 'REPORT',
        actionDetails: { reportType: reportData.type || 'GENERAL', propertyCount: properties.length }
      });

      return report;
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'FINANCIAL_REPORT_GENERATION_FAILED',
        resourceType: 'PROPERTY_FINANCIAL',
        resourceId: 'REPORT',
        actionDetails: { error: (error as Error).message }
      });
      throw error;
    }
  }
}