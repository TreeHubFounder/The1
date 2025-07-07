
import { BaseAIAgent, AIAgentContext, AIAgentResult } from '../ai-agent-core';
import { prisma } from '@/lib/db';
import { AIAgentType } from '@prisma/client';

export class EquipmentIntelligenceAgent extends BaseAIAgent {
  constructor(agentId: string, name: string, config: any = {}) {
    super(agentId, name, 'EQUIPMENT_INTELLIGENCE', config);
  }

  async execute(context: AIAgentContext): Promise<AIAgentResult> {
    const { equipmentId, analysisType = 'full' } = context.inputData;

    try {
      if (equipmentId) {
        // Analyze specific equipment
        return await this.analyzeSingleEquipment(equipmentId);
      } else {
        // Analyze all equipment
        return await this.analyzeAllEquipment(analysisType);
      }
    } catch (error) {
      throw new Error(`Equipment intelligence execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Analyze a single piece of equipment
  private async analyzeSingleEquipment(equipmentId: string): Promise<AIAgentResult> {
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        owner: true,
        transactions: true,
        intelligence: true,
      },
    });

    if (!equipment) {
      throw new Error(`Equipment not found: ${equipmentId}`);
    }

    console.log(`🔧 Analyzing equipment: ${equipment.title} (${equipment.category})`);

    // Perform comprehensive analysis
    const maintenanceAnalysis = await this.analyzeMaintenanceNeeds(equipment);
    const marketAnalysis = await this.analyzeMarketValue(equipment);
    const utilizationAnalysis = await this.analyzeUtilization(equipment);
    const revenueOptimization = await this.optimizeRevenue(equipment);

    // Create or update equipment intelligence record
    const intelligence = await this.updateEquipmentIntelligence(equipment, {
      maintenanceAnalysis,
      marketAnalysis,
      utilizationAnalysis,
      revenueOptimization,
    });

    const revenueImpact = revenueOptimization.additionalRevenue;

    return {
      success: true,
      outputData: {
        equipmentId,
        intelligence,
        recommendations: this.generateRecommendations(equipment, {
          maintenanceAnalysis,
          marketAnalysis,
          utilizationAnalysis,
          revenueOptimization,
        }),
        revenueImpact,
      },
      metrics: {
        revenueGenerated: revenueImpact,
        processingTime: 0,
      },
    };
  }

  // Analyze all equipment
  private async analyzeAllEquipment(analysisType: string): Promise<AIAgentResult> {
    const equipment = await prisma.equipment.findMany({
      where: { status: 'ACTIVE' },
      include: {
        owner: true,
        transactions: true,
        intelligence: true,
      },
    });

    console.log(`🔧 Analyzing ${equipment.length} pieces of equipment (${analysisType} analysis)`);

    let totalRevenueImpact = 0;
    let processedCount = 0;
    const results = [];

    for (const item of equipment) {
      try {
        const result = await this.analyzeSingleEquipment(item.id);
        if (result.success && result.metrics?.revenueGenerated) {
          totalRevenueImpact += result.metrics.revenueGenerated;
        }
        processedCount++;
        results.push(result.outputData);
      } catch (error) {
        console.error(`Failed to analyze equipment ${item.id}:`, error);
      }
    }

    // Generate market insights
    const marketInsights = await this.generateMarketInsights(equipment);

    return {
      success: true,
      outputData: {
        processedCount,
        totalEquipment: equipment.length,
        marketInsights,
        topRecommendations: this.getTopRecommendations(results),
        totalRevenueImpact,
      },
      metrics: {
        revenueGenerated: totalRevenueImpact,
        processingTime: 0,
      },
    };
  }

  // Analyze maintenance needs
  private async analyzeMaintenanceNeeds(equipment: any): Promise<any> {
    const hoursUsed = equipment.hoursUsed || 0;
    const age = equipment.year ? new Date().getFullYear() - equipment.year : 0;
    
    // Maintenance scoring based on equipment type, age, and usage
    const maintenanceScore = this.calculateMaintenanceScore(equipment.category, age, hoursUsed);
    const nextMaintenanceDate = this.predictNextMaintenance(equipment.category, hoursUsed);
    const predictedFailures = this.predictFailures(equipment.category, age, hoursUsed);

    return {
      maintenanceScore,
      nextMaintenanceDate,
      predictedFailures,
      urgency: maintenanceScore < 30 ? 'High' : maintenanceScore < 60 ? 'Medium' : 'Low',
      estimatedCost: this.estimateMaintenanceCost(equipment.category, maintenanceScore),
    };
  }

  private calculateMaintenanceScore(category: string, age: number, hoursUsed: number): number {
    // Base score starts at 100 (perfect condition)
    let score = 100;

    // Age degradation
    const ageFactors: { [key: string]: number } = {
      'CHAINSAWS': 8,      // 8 points per year
      'CHIPPERS': 6,       // 6 points per year
      'STUMP_GRINDERS': 5, // 5 points per year
      'CRANES': 3,         // 3 points per year
      'BUCKET_TRUCKS': 4,  // 4 points per year
      'TRUCKS': 5,         // 5 points per year
    };

    const ageFactor = ageFactors[category] || 5;
    score -= age * ageFactor;

    // Usage degradation
    const usageFactors: { [key: string]: number } = {
      'CHAINSAWS': 0.01,      // 1 point per 100 hours
      'CHIPPERS': 0.005,      // 1 point per 200 hours
      'STUMP_GRINDERS': 0.008, // 1 point per 125 hours
      'CRANES': 0.003,        // 1 point per 333 hours
      'BUCKET_TRUCKS': 0.004, // 1 point per 250 hours
      'TRUCKS': 0.006,        // 1 point per 167 hours
    };

    const usageFactor = usageFactors[category] || 0.005;
    score -= hoursUsed * usageFactor;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private predictNextMaintenance(category: string, hoursUsed: number): Date {
    const maintenanceIntervals: { [key: string]: number } = {
      'CHAINSAWS': 50,        // Every 50 hours
      'CHIPPERS': 100,        // Every 100 hours
      'STUMP_GRINDERS': 80,   // Every 80 hours
      'CRANES': 200,          // Every 200 hours
      'BUCKET_TRUCKS': 150,   // Every 150 hours
      'TRUCKS': 120,          // Every 120 hours
    };

    const interval = maintenanceIntervals[category] || 100;
    const nextMaintenanceHours = Math.ceil((hoursUsed + 1) / interval) * interval;
    const hoursToNext = nextMaintenanceHours - hoursUsed;
    
    // Assume 8 hours of use per day
    const daysToNext = Math.ceil(hoursToNext / 8);
    
    return new Date(Date.now() + daysToNext * 24 * 60 * 60 * 1000);
  }

  private predictFailures(category: string, age: number, hoursUsed: number): string[] {
    const commonFailures: { [key: string]: string[] } = {
      'CHAINSAWS': ['Chain', 'Bar', 'Engine', 'Clutch'],
      'CHIPPERS': ['Blades', 'Engine', 'Hydraulics', 'Belts'],
      'STUMP_GRINDERS': ['Teeth', 'Engine', 'Hydraulics', 'Tracks'],
      'CRANES': ['Hydraulics', 'Engine', 'Boom', 'Cables'],
      'BUCKET_TRUCKS': ['Hydraulics', 'Engine', 'Transmission', 'Boom'],
      'TRUCKS': ['Engine', 'Transmission', 'Brakes', 'Tires'],
    };

    const failures = commonFailures[category] || ['Engine', 'Hydraulics'];
    const predictions = [];

    // Higher probability of failure with age and usage
    const failureProbability = Math.min(0.8, (age * 0.1) + (hoursUsed * 0.0001));

    if (failureProbability > 0.6) {
      predictions.push(failures[0], failures[1]);
    } else if (failureProbability > 0.4) {
      predictions.push(failures[0]);
    }

    return predictions;
  }

  private estimateMaintenanceCost(category: string, maintenanceScore: number): number {
    const baseCosts: { [key: string]: number } = {
      'CHAINSAWS': 150,
      'CHIPPERS': 800,
      'STUMP_GRINDERS': 1200,
      'CRANES': 3500,
      'BUCKET_TRUCKS': 2200,
      'TRUCKS': 1800,
    };

    const baseCost = baseCosts[category] || 500;
    
    // Higher cost for lower maintenance scores
    const multiplier = maintenanceScore < 30 ? 2.5 : 
                      maintenanceScore < 60 ? 1.8 : 1.2;

    return Math.round(baseCost * multiplier);
  }

  // Analyze market value
  private async analyzeMarketValue(equipment: any): Promise<any> {
    const currentValue = await this.calculateCurrentMarketValue(equipment);
    const demandScore = await this.calculateDemandScore(equipment);
    const competitorPricing = await this.analyzeCompetitorPricing(equipment);

    return {
      currentMarketValue: currentValue,
      demandScore,
      competitorPricing,
      priceRecommendation: this.calculateOptimalPricing(currentValue, demandScore, competitorPricing),
    };
  }

  private async calculateCurrentMarketValue(equipment: any): Promise<number> {
    // Get similar equipment sales
    const similarSales = await prisma.equipment.findMany({
      where: {
        category: equipment.category,
        make: equipment.make,
        status: 'SOLD',
        soldAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
      },
      orderBy: { soldAt: 'desc' },
      take: 10,
    });

    if (similarSales.length === 0) {
      // Fallback to depreciation calculation
      return this.calculateDepreciatedValue(equipment);
    }

    // Calculate average selling price
    const totalValue = similarSales.reduce((sum, item) => sum + Number(item.salePrice || 0), 0);
    const averageValue = totalValue / similarSales.length;

    // Adjust for condition and age
    const conditionMultipliers = {
      'NEW': 1.0,
      'EXCELLENT': 0.9,
      'GOOD': 0.75,
      'FAIR': 0.6,
      'POOR': 0.4,
    };

    const conditionMultiplier = conditionMultipliers[equipment.condition] || 0.7;
    
    return Math.round(averageValue * conditionMultiplier);
  }

  private calculateDepreciatedValue(equipment: any): number {
    if (!equipment.year || !equipment.salePrice) {
      return 0;
    }

    const age = new Date().getFullYear() - equipment.year;
    const originalPrice = Number(equipment.salePrice);

    // Depreciation rates by category
    const depreciationRates: { [key: string]: number } = {
      'CHAINSAWS': 0.15,      // 15% per year
      'CHIPPERS': 0.12,       // 12% per year
      'STUMP_GRINDERS': 0.10, // 10% per year
      'CRANES': 0.08,         // 8% per year
      'BUCKET_TRUCKS': 0.10,  // 10% per year
      'TRUCKS': 0.12,         // 12% per year
    };

    const depreciationRate = depreciationRates[equipment.category] || 0.12;
    const currentValue = originalPrice * Math.pow(1 - depreciationRate, age);

    return Math.round(Math.max(originalPrice * 0.1, currentValue)); // Min 10% of original value
  }

  private async calculateDemandScore(equipment: any): Promise<number> {
    // Analyze view count, inquiry count, and market activity
    const viewScore = Math.min(100, equipment.viewCount * 2);
    const inquiryScore = Math.min(100, equipment.inquiryCount * 10);
    
    // Check seasonal demand
    const seasonalMultiplier = this.getSeasonalDemandMultiplier(equipment.category);
    
    // Average the scores and apply seasonal adjustment
    const baseScore = (viewScore + inquiryScore) / 2;
    
    return Math.round(baseScore * seasonalMultiplier);
  }

  private getSeasonalDemandMultiplier(category: string): number {
    const month = new Date().getMonth() + 1; // 1-12
    
    // Spring/Summer = higher demand for tree service equipment
    const seasonalFactors: { [key: string]: { [key: number]: number } } = {
      'CHAINSAWS': { 3: 1.3, 4: 1.4, 5: 1.3, 6: 1.2, 7: 1.1, 8: 1.1, 9: 1.2, 10: 1.3 },
      'CHIPPERS': { 3: 1.4, 4: 1.5, 5: 1.4, 6: 1.3, 7: 1.2, 8: 1.2, 9: 1.3, 10: 1.4 },
      'STUMP_GRINDERS': { 3: 1.3, 4: 1.4, 5: 1.3, 6: 1.2, 7: 1.1, 8: 1.1, 9: 1.2, 10: 1.3 },
    };

    const factors = seasonalFactors[category];
    return factors?.[month] || 1.0;
  }

  private async analyzeCompetitorPricing(equipment: any): Promise<number> {
    // Find similar active listings
    const competitors = await prisma.equipment.findMany({
      where: {
        category: equipment.category,
        status: 'ACTIVE',
        listingType: equipment.listingType,
        id: { not: equipment.id },
      },
      take: 20,
    });

    if (competitors.length === 0) {
      return Number(equipment.salePrice) || 0;
    }

    const prices = competitors
      .map(comp => Number(comp.salePrice || comp.rentalPriceDaily || 0))
      .filter(price => price > 0);

    if (prices.length === 0) {
      return Number(equipment.salePrice) || 0;
    }

    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
  }

  private calculateOptimalPricing(marketValue: number, demandScore: number, competitorPrice: number): any {
    // Base price on market value
    let optimalPrice = marketValue;

    // Adjust for demand
    if (demandScore > 80) {
      optimalPrice *= 1.15; // 15% premium for high demand
    } else if (demandScore > 60) {
      optimalPrice *= 1.08; // 8% premium for medium-high demand
    } else if (demandScore < 30) {
      optimalPrice *= 0.92; // 8% discount for low demand
    }

    // Consider competitor pricing
    if (competitorPrice > 0) {
      const avgPrice = (optimalPrice + competitorPrice) / 2;
      optimalPrice = avgPrice;
    }

    return {
      suggested: Math.round(optimalPrice),
      current: marketValue,
      competitor: Math.round(competitorPrice),
      adjustment: Math.round(((optimalPrice / marketValue) - 1) * 100),
    };
  }

  // Analyze utilization
  private async analyzeUtilization(equipment: any): Promise<any> {
    const rentalTransactions = equipment.transactions.filter((t: any) => 
      t.transactionType === 'EQUIPMENT_RENTAL' && 
      t.status === 'COMPLETED'
    );

    const utilizationRate = this.calculateUtilizationRate(equipment, rentalTransactions);
    const peakPeriods = this.identifyPeakUsagePeriods(rentalTransactions);
    const downtimeAnalysis = this.analyzeDowntime(equipment, rentalTransactions);

    return {
      utilizationRate,
      peakPeriods,
      downtimeAnalysis,
      efficiency: this.calculateEfficiencyScore(utilizationRate, downtimeAnalysis),
    };
  }

  private calculateUtilizationRate(equipment: any, rentalTransactions: any[]): number {
    if (equipment.listingType !== 'RENT') {
      return 0;
    }

    const totalDaysListed = Math.floor((Date.now() - new Date(equipment.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const rentalDays = rentalTransactions.length * 3; // Assume average 3-day rentals

    return totalDaysListed > 0 ? Math.round((rentalDays / totalDaysListed) * 100) : 0;
  }

  private identifyPeakUsagePeriods(rentalTransactions: any[]): string[] {
    const monthCounts: { [key: number]: number } = {};
    
    rentalTransactions.forEach(transaction => {
      const month = new Date(transaction.createdAt).getMonth() + 1;
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    const averagePerMonth = Object.values(monthCounts).reduce((sum, count) => sum + count, 0) / 12;
    
    const peakMonths = Object.entries(monthCounts)
      .filter(([month, count]) => count > averagePerMonth * 1.2)
      .map(([month, count]) => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return monthNames[parseInt(month) - 1];
      });

    return peakMonths;
  }

  private analyzeDowntime(equipment: any, rentalTransactions: any[]): any {
    // Calculate downtime between rentals
    const totalDaysListed = Math.floor((Date.now() - new Date(equipment.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const rentalDays = rentalTransactions.length * 3;
    const downtimeDays = totalDaysListed - rentalDays;

    return {
      totalDowntimeDays: downtimeDays,
      downtimePercentage: totalDaysListed > 0 ? Math.round((downtimeDays / totalDaysListed) * 100) : 0,
      averageDaysBetweenRentals: rentalTransactions.length > 1 ? Math.round(downtimeDays / (rentalTransactions.length - 1)) : 0,
    };
  }

  private calculateEfficiencyScore(utilizationRate: number, downtimeAnalysis: any): number {
    // Higher utilization = higher efficiency
    const utilizationScore = utilizationRate;
    
    // Lower downtime percentage = higher efficiency
    const downtimeScore = Math.max(0, 100 - downtimeAnalysis.downtimePercentage);
    
    return Math.round((utilizationScore + downtimeScore) / 2);
  }

  // Optimize revenue
  private async optimizeRevenue(equipment: any): Promise<any> {
    const currentRevenue = await this.calculateCurrentRevenue(equipment);
    const optimizedPricing = await this.optimizePricing(equipment);
    const marketingRecommendations = this.generateMarketingRecommendations(equipment);

    const projectedRevenue = this.calculateProjectedRevenue(equipment, optimizedPricing);
    const additionalRevenue = projectedRevenue - currentRevenue;

    return {
      currentRevenue,
      projectedRevenue,
      additionalRevenue,
      optimizedPricing,
      marketingRecommendations,
      roi: currentRevenue > 0 ? Math.round((additionalRevenue / currentRevenue) * 100) : 0,
    };
  }

  private async calculateCurrentRevenue(equipment: any): Promise<number> {
    const transactions = equipment.transactions.filter((t: any) => 
      t.status === 'COMPLETED' &&
      t.createdAt >= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
    );

    return transactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  }

  private async optimizePricing(equipment: any): Promise<any> {
    const marketAnalysis = await this.analyzeMarketValue(equipment);
    
    if (equipment.listingType === 'RENT') {
      return this.optimizeRentalPricing(equipment, marketAnalysis);
    } else {
      return this.optimizeSalePricing(equipment, marketAnalysis);
    }
  }

  private optimizeRentalPricing(equipment: any, marketAnalysis: any): any {
    const currentDaily = Number(equipment.rentalPriceDaily) || 0;
    const currentWeekly = Number(equipment.rentalPriceWeekly) || 0;
    const currentMonthly = Number(equipment.rentalPriceMonthly) || 0;

    // Optimize based on demand and market conditions
    const demandMultiplier = marketAnalysis.demandScore > 80 ? 1.2 : 
                            marketAnalysis.demandScore > 60 ? 1.1 : 
                            marketAnalysis.demandScore < 30 ? 0.9 : 1.0;

    return {
      daily: Math.round(currentDaily * demandMultiplier),
      weekly: Math.round(currentWeekly * demandMultiplier),
      monthly: Math.round(currentMonthly * demandMultiplier),
      adjustment: Math.round((demandMultiplier - 1) * 100),
    };
  }

  private optimizeSalePricing(equipment: any, marketAnalysis: any): any {
    return {
      suggested: marketAnalysis.priceRecommendation.suggested,
      current: Number(equipment.salePrice) || 0,
      adjustment: marketAnalysis.priceRecommendation.adjustment,
    };
  }

  private generateMarketingRecommendations(equipment: any): string[] {
    const recommendations = [];

    if (equipment.viewCount < 10) {
      recommendations.push('Improve listing photos and description');
    }

    if (equipment.inquiryCount < 2) {
      recommendations.push('Consider promotional pricing or featured listing');
    }

    if (!equipment.images || equipment.images.length < 3) {
      recommendations.push('Add more high-quality images');
    }

    if (equipment.listingType === 'RENT' && !equipment.deliveryAvailable) {
      recommendations.push('Consider offering delivery service');
    }

    recommendations.push('Update listing during peak season months');

    return recommendations;
  }

  private calculateProjectedRevenue(equipment: any, optimizedPricing: any): number {
    // Simple projection based on pricing optimization
    const currentRevenue = Number(equipment.salePrice || equipment.rentalPriceDaily || 0);
    
    if (equipment.listingType === 'RENT') {
      // Assume equipment rents 10 days per month
      const monthlyRevenue = optimizedPricing.daily * 10;
      return monthlyRevenue * 12; // Annual projection
    } else {
      return optimizedPricing.suggested || currentRevenue;
    }
  }

  // Update equipment intelligence record
  private async updateEquipmentIntelligence(equipment: any, analyses: any): Promise<any> {
    const data = {
      nextMaintenanceDate: analyses.maintenanceAnalysis.nextMaintenanceDate,
      maintenanceScore: analyses.maintenanceAnalysis.maintenanceScore,
      predictedFailures: analyses.maintenanceAnalysis.predictedFailures,
      totalOperatingHours: equipment.hoursUsed || 0,
      averageDailyUsage: 8, // Default assumption
      peakUsagePeriods: analyses.utilizationAnalysis.peakPeriods,
      efficiencyScore: analyses.utilizationAnalysis.efficiency,
      downtimeHours: analyses.utilizationAnalysis.downtimeAnalysis.totalDowntimeDays * 24,
      maintenanceCost: analyses.maintenanceAnalysis.estimatedCost,
      currentMarketValue: analyses.marketAnalysis.currentMarketValue,
      demandScore: analyses.marketAnalysis.demandScore,
      optimalPricing: analyses.marketAnalysis.priceRecommendation.suggested,
      competitorPricing: analyses.marketAnalysis.competitorPricing,
      rentalUtilization: analyses.utilizationAnalysis.utilizationRate,
      suggestedRentalPrice: analyses.revenueOptimization.optimizedPricing.daily || null,
      projectedRevenue: analyses.revenueOptimization.projectedRevenue,
    };

    return await prisma.equipmentIntelligence.upsert({
      where: { equipmentId: equipment.id },
      update: data,
      create: {
        equipmentId: equipment.id,
        ...data,
      },
    });
  }

  // Generate recommendations
  private generateRecommendations(equipment: any, analyses: any): any[] {
    const recommendations = [];

    // Maintenance recommendations
    if (analyses.maintenanceAnalysis.maintenanceScore < 30) {
      recommendations.push({
        type: 'maintenance',
        priority: 'high',
        title: 'Urgent Maintenance Required',
        description: `Equipment requires immediate attention. Predicted issues: ${analyses.maintenanceAnalysis.predictedFailures.join(', ')}`,
        estimatedCost: analyses.maintenanceAnalysis.estimatedCost,
        timeline: 'Immediate',
      });
    }

    // Pricing recommendations
    if (Math.abs(analyses.marketAnalysis.priceRecommendation.adjustment) > 10) {
      recommendations.push({
        type: 'pricing',
        priority: 'medium',
        title: 'Price Adjustment Recommended',
        description: `Consider ${analyses.marketAnalysis.priceRecommendation.adjustment > 0 ? 'increasing' : 'decreasing'} price by ${Math.abs(analyses.marketAnalysis.priceRecommendation.adjustment)}%`,
        potentialRevenue: analyses.revenueOptimization.additionalRevenue,
        timeline: 'This week',
      });
    }

    // Utilization recommendations
    if (analyses.utilizationAnalysis.utilizationRate < 50 && equipment.listingType === 'RENT') {
      recommendations.push({
        type: 'utilization',
        priority: 'medium',
        title: 'Improve Equipment Utilization',
        description: 'Low utilization rate detected. Consider marketing improvements or pricing adjustments.',
        suggestions: analyses.revenueOptimization.marketingRecommendations,
        timeline: 'Next month',
      });
    }

    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  // Generate market insights for all equipment
  private async generateMarketInsights(equipment: any[]): Promise<any> {
    const categoryBreakdown = equipment.reduce((acc: any, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    const averageUtilization = equipment.reduce((sum, item) => {
      return sum + (item.intelligence?.rentalUtilization || 0);
    }, 0) / equipment.length;

    const totalMaintenanceCosts = equipment.reduce((sum, item) => {
      return sum + (item.intelligence?.maintenanceCost || 0);
    }, 0);

    return {
      totalEquipment: equipment.length,
      categoryBreakdown,
      averageUtilization: Math.round(averageUtilization),
      totalMaintenanceCosts,
      equipmentNeedingMaintenance: equipment.filter(item => 
        item.intelligence?.maintenanceScore < 60
      ).length,
      underutilizedEquipment: equipment.filter(item => 
        item.intelligence?.rentalUtilization < 30
      ).length,
    };
  }

  private getTopRecommendations(results: any[]): any[] {
    const allRecommendations = results.flatMap(result => result.recommendations || []);
    
    // Sort by priority and potential revenue impact
    return allRecommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return (b.potentialRevenue || 0) - (a.potentialRevenue || 0);
      })
      .slice(0, 10);
  }
}
