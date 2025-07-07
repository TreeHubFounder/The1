
import { db } from '@/lib/db';
import type { 
  KPIMetric,
  KPIDataPoint,
  KPIAlert,
  PredictiveModel,
  Prediction,
  BusinessIntelligenceReport,
  MetricType,
  MetricFrequency
} from '@prisma/client';

export interface CreateKPIData {
  name: string;
  description: string;
  type: MetricType;
  category?: string;
  calculationMethod: string;
  formula?: string;
  sourceTable?: string;
  sourceColumn?: string;
  targetValue?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  unit?: string;
  displayFormat?: string;
  frequency: MetricFrequency;
}

export interface KPIDashboard {
  totalMetrics: number;
  activeAlerts: number;
  criticalAlerts: number;
  metricsOnTarget: number;
  metricsAtRisk: number;
  recentDataPoints: KPIDataPoint[];
  trendingMetrics: Array<{
    metric: KPIMetric;
    trend: 'up' | 'down' | 'stable';
    change: number;
  }>;
}

export interface PredictiveInsights {
  accuracyScore: number;
  confidenceLevel: number;
  predictions: Prediction[];
  recommendations: string[];
  riskFactors: string[];
}

export interface BusinessReport {
  reportId: string;
  executiveSummary: string;
  keyMetrics: Record<string, any>;
  trends: Array<{
    metric: string;
    direction: 'up' | 'down' | 'stable';
    significance: 'high' | 'medium' | 'low';
  }>;
  alerts: KPIAlert[];
  recommendations: string[];
  generatedAt: Date;
}

export class BusinessIntelligenceService {
  // KPI Management
  async createKPI(data: CreateKPIData): Promise<KPIMetric> {
    return await db.kPIMetric.create({
      data: {
        ...data,
        isActive: true,
        isPublic: false,
      },
    });
  }

  async recordKPIDataPoint(
    metricId: string,
    value: number,
    period: Date,
    periodType: string = 'day',
    additionalData?: any
  ): Promise<KPIDataPoint> {
    const dataPoint = await db.kPIDataPoint.create({
      data: {
        metricId,
        value,
        period,
        periodType,
        additionalData,
      },
    });

    // Check for threshold breaches and create alerts
    await this.checkThresholds(metricId, value);

    return dataPoint;
  }

  async updateKPITarget(
    metricId: string,
    targetValue: number,
    warningThreshold?: number,
    criticalThreshold?: number
  ): Promise<KPIMetric> {
    return await db.kPIMetric.update({
      where: { id: metricId },
      data: {
        targetValue,
        warningThreshold,
        criticalThreshold,
      },
    });
  }

  async getKPIDashboard(
    dateFrom?: Date,
    dateTo?: Date,
    category?: string
  ): Promise<KPIDashboard> {
    const whereClause: any = { isActive: true };
    if (category) whereClause.category = category;

    const dataPointsWhere: any = {};
    if (dateFrom || dateTo) {
      dataPointsWhere.period = {};
      if (dateFrom) dataPointsWhere.period.gte = dateFrom;
      if (dateTo) dataPointsWhere.period.lte = dateTo;
    }

    const [
      totalMetrics,
      activeAlerts,
      criticalAlerts,
      recentDataPoints,
      metrics,
    ] = await Promise.all([
      db.kPIMetric.count({ where: whereClause }),
      db.kPIAlert.count({
        where: { isActive: true, isAcknowledged: false },
      }),
      db.kPIAlert.count({
        where: { 
          isActive: true, 
          isAcknowledged: false,
          severity: 'Critical',
        },
      }),
      db.kPIDataPoint.findMany({
        where: dataPointsWhere,
        orderBy: { recordedAt: 'desc' },
        take: 50,
        include: { metric: true },
      }),
      db.kPIMetric.findMany({
        where: whereClause,
        include: { 
          dataPoints: {
            orderBy: { period: 'desc' },
            take: 2,
          },
        },
      }),
    ]);

    // Calculate trending metrics
    const trendingMetrics = metrics.map(metric => {
      const dataPoints = metric.dataPoints;
      let trend: 'up' | 'down' | 'stable' = 'stable';
      let change = 0;

      if (dataPoints.length >= 2) {
        const latest = dataPoints[0].value.toNumber();
        const previous = dataPoints[1].value.toNumber();
        change = ((latest - previous) / previous) * 100;
        
        if (Math.abs(change) < 5) {
          trend = 'stable';
        } else if (change > 0) {
          trend = 'up';
        } else {
          trend = 'down';
        }
      }

      return {
        metric,
        trend,
        change,
      };
    });

    // Count metrics on target vs at risk
    const metricsOnTarget = metrics.filter(metric => {
      const latest = metric.dataPoints[0];
      if (!latest || !metric.targetValue) return false;
      
      const value = latest.value.toNumber();
      const target = metric.targetValue.toNumber();
      const variance = Math.abs((value - target) / target);
      return variance <= 0.1; // Within 10% of target
    }).length;

    const metricsAtRisk = totalMetrics - metricsOnTarget;

    return {
      totalMetrics,
      activeAlerts,
      criticalAlerts,
      metricsOnTarget,
      metricsAtRisk,
      recentDataPoints,
      trendingMetrics,
    };
  }

  // Predictive Analytics
  async createPredictiveModel(data: {
    name: string;
    description: string;
    modelType: string;
    targetMetric: string;
    predictionHorizon: number;
    features: string[];
    algorithm?: string;
    hyperparameters?: any;
  }): Promise<PredictiveModel> {
    return await db.predictiveModel.create({
      data: {
        ...data,
        isActive: true,
        version: '1.0',
      },
    });
  }

  async trainPredictiveModel(
    modelId: string,
    trainingDataSize: number,
    accuracy: number
  ): Promise<PredictiveModel> {
    return await db.predictiveModel.update({
      where: { id: modelId },
      data: {
        lastTrainingDate: new Date(),
        trainingDataSize,
        accuracy,
      },
    });
  }

  async generatePrediction(
    modelId: string,
    inputFeatures: any,
    targetDate: Date,
    scenario: string = 'Expected'
  ): Promise<Prediction> {
    const model = await db.predictiveModel.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      throw new Error('Model not found');
    }

    // Simulate prediction calculation (would use actual ML model in production)
    const predictedValue = this.calculatePrediction(inputFeatures, model);
    const confidence = (model.accuracy?.toNumber() || 50);

    return await db.prediction.create({
      data: {
        modelId,
        predictedValue,
        confidence,
        predictionDate: new Date(),
        targetDate,
        inputFeatures,
        scenario,
      },
    });
  }

  async validatePrediction(
    predictionId: string,
    actualValue: number
  ): Promise<Prediction> {
    const prediction = await db.prediction.findUnique({
      where: { id: predictionId },
    });

    if (!prediction) {
      throw new Error('Prediction not found');
    }

    const predictedValue = prediction.predictedValue.toNumber();
    const accuracy = 100 - Math.abs((actualValue - predictedValue) / actualValue) * 100;

    return await db.prediction.update({
      where: { id: predictionId },
      data: {
        actualValue,
        accuracy,
      },
    });
  }

  async getPredictiveInsights(
    modelId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<PredictiveInsights> {
    const whereClause: any = { modelId };
    if (dateFrom || dateTo) {
      whereClause.predictionDate = {};
      if (dateFrom) whereClause.predictionDate.gte = dateFrom;
      if (dateTo) whereClause.predictionDate.lte = dateTo;
    }

    const [model, predictions] = await Promise.all([
      db.predictiveModel.findUnique({ where: { id: modelId } }),
      db.prediction.findMany({
        where: whereClause,
        orderBy: { predictionDate: 'desc' },
        take: 100,
      }),
    ]);

    if (!model) {
      throw new Error('Model not found');
    }

    // Calculate accuracy score from validated predictions
    const validatedPredictions = predictions.filter(p => p.actualValue !== null);
    const accuracyScore = validatedPredictions.length > 0
      ? validatedPredictions.reduce((sum, p) => sum + (p.accuracy?.toNumber() || 0), 0) / validatedPredictions.length
      : model.accuracy?.toNumber() || 0;

    const confidenceLevel = model.accuracy?.toNumber() || 0;

    // Generate recommendations based on predictions
    const recommendations = this.generateRecommendations(predictions, model);
    const riskFactors = this.identifyRiskFactors(predictions);

    return {
      accuracyScore,
      confidenceLevel,
      predictions: predictions.slice(0, 10), // Return latest 10 predictions
      recommendations,
      riskFactors,
    };
  }

  // Business Intelligence Reports
  async createReport(data: {
    name: string;
    description: string;
    reportType: string;
    reportData: any;
    visualizations?: any;
    keyInsights: string[];
    recommendations: string[];
    isScheduled?: boolean;
    frequency?: string;
    authorizedUsers?: string[];
    createdById: string;
  }): Promise<BusinessIntelligenceReport> {
    return await db.businessIntelligenceReport.create({
      data: {
        ...data,
        isPublic: false,
        isScheduled: data.isScheduled || false,
        authorizedUsers: data.authorizedUsers || [],
        lastGeneratedAt: new Date(),
      },
      include: {
        createdBy: true,
      },
    });
  }

  async generateBusinessReport(
    reportType: string = 'Executive_Summary',
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<BusinessReport> {
    const reportId = `report_${Date.now()}`;
    
    // Gather key metrics
    const keyMetrics = await this.gatherKeyMetrics(dateFrom, dateTo);
    
    // Analyze trends
    const trends = await this.analyzeTrends(dateFrom, dateTo);
    
    // Get active alerts
    const alerts = await db.kPIAlert.findMany({
      where: { isActive: true },
      include: { metric: true },
      orderBy: { triggeredAt: 'desc' },
      take: 10,
    });

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(keyMetrics, trends, alerts);
    
    // Generate recommendations
    const recommendations = this.generateBusinessRecommendations(keyMetrics, trends, alerts);

    return {
      reportId,
      executiveSummary,
      keyMetrics,
      trends,
      alerts,
      recommendations,
      generatedAt: new Date(),
    };
  }

  async scheduleReport(
    reportId: string,
    frequency: string,
    nextRunDate: Date
  ): Promise<BusinessIntelligenceReport> {
    return await db.businessIntelligenceReport.update({
      where: { id: reportId },
      data: {
        isScheduled: true,
        frequency,
        nextRunDate,
      },
    });
  }

  // Alert Management
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<KPIAlert> {
    return await db.kPIAlert.update({
      where: { id: alertId },
      data: {
        isAcknowledged: true,
        acknowledgedBy,
        acknowledgedAt: new Date(),
      },
    });
  }

  async getActiveAlerts(severity?: string): Promise<KPIAlert[]> {
    const whereClause: any = { 
      isActive: true, 
      isAcknowledged: false,
    };
    
    if (severity) {
      whereClause.severity = severity;
    }

    return await db.kPIAlert.findMany({
      where: whereClause,
      include: { metric: true },
      orderBy: { triggeredAt: 'desc' },
    });
  }

  // Private Helper Methods
  private async checkThresholds(metricId: string, value: number): Promise<void> {
    const metric = await db.kPIMetric.findUnique({
      where: { id: metricId },
    });

    if (!metric) return;

    let alertType = '';
    let severity = '';

    if (metric.criticalThreshold && 
        ((value >= metric.criticalThreshold.toNumber() && metric.type === 'REVENUE') ||
         (value <= metric.criticalThreshold.toNumber() && metric.type !== 'REVENUE'))) {
      alertType = 'Threshold';
      severity = 'Critical';
    } else if (metric.warningThreshold && 
               ((value >= metric.warningThreshold.toNumber() && metric.type === 'REVENUE') ||
                (value <= metric.warningThreshold.toNumber() && metric.type !== 'REVENUE'))) {
      alertType = 'Threshold';
      severity = 'Warning';
    }

    if (alertType) {
      await db.kPIAlert.create({
        data: {
          metricId,
          alertType,
          severity,
          message: `${metric.name} ${severity === 'Critical' ? 'critical' : 'warning'} threshold breached: ${value}`,
          triggerValue: value,
          thresholdBreached: severity,
        },
      });
    }
  }

  private calculatePrediction(inputFeatures: any, model: PredictiveModel): number {
    // Simplified prediction calculation - would use actual ML model in production
    const baseValue = Object.values(inputFeatures).reduce((sum: number, val: any) => 
      sum + (typeof val === 'number' ? val : 0), 0) as number;
    
    // Apply some model-specific transformation
    const modelAccuracy = model.accuracy?.toNumber() || 50;
    const variance = (100 - modelAccuracy) / 100;
    const randomFactor = 1 + (Math.random() - 0.5) * variance;
    
    return baseValue * randomFactor;
  }

  private generateRecommendations(predictions: Prediction[], model: PredictiveModel): string[] {
    const recommendations: string[] = [];
    
    if (predictions.length === 0) return recommendations;

    const latestPrediction = predictions[0];
    const avgConfidence = predictions.reduce(
      (sum, p) => sum + (p.confidence?.toNumber() || 0), 0
    ) / predictions.length;

    if (avgConfidence < 70) {
      recommendations.push('Consider collecting more training data to improve model accuracy');
    }

    if (model.targetMetric.includes('revenue') && latestPrediction.predictedValue.toNumber() < 0) {
      recommendations.push('Revenue forecast shows potential decline - review pricing and acquisition strategies');
    }

    if (model.targetMetric.includes('churn') && latestPrediction.predictedValue.toNumber() > 10) {
      recommendations.push('Customer churn rate may increase - implement retention initiatives');
    }

    return recommendations;
  }

  private identifyRiskFactors(predictions: Prediction[]): string[] {
    const riskFactors: string[] = [];
    
    if (predictions.length < 2) return riskFactors;

    // Analyze prediction volatility
    const values = predictions.map(p => p.predictedValue.toNumber());
    const variance = this.calculateVariance(values);
    
    if (variance > values[0] * 0.2) { // High variance
      riskFactors.push('High prediction volatility detected');
    }

    // Check for declining trends
    if (values[0] < values[1] && values[1] < values[2]) {
      riskFactors.push('Consistent declining trend identified');
    }

    return riskFactors;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    return squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private async gatherKeyMetrics(dateFrom?: Date, dateTo?: Date): Promise<Record<string, any>> {
    const whereClause: any = {};
    if (dateFrom || dateTo) {
      whereClause.period = {};
      if (dateFrom) whereClause.period.gte = dateFrom;
      if (dateTo) whereClause.period.lte = dateTo;
    }

    // Gather metrics by type
    const [revenueMetrics, userMetrics, performanceMetrics] = await Promise.all([
      db.kPIDataPoint.findMany({
        where: {
          ...whereClause,
          metric: { type: 'REVENUE' },
        },
        include: { metric: true },
        orderBy: { period: 'desc' },
        take: 10,
      }),
      db.kPIDataPoint.findMany({
        where: {
          ...whereClause,
          metric: { type: 'USERS' },
        },
        include: { metric: true },
        orderBy: { period: 'desc' },
        take: 10,
      }),
      db.kPIDataPoint.findMany({
        where: {
          ...whereClause,
          metric: { type: 'PERFORMANCE' },
        },
        include: { metric: true },
        orderBy: { period: 'desc' },
        take: 10,
      }),
    ]);

    return {
      revenue: revenueMetrics,
      users: userMetrics,
      performance: performanceMetrics,
    };
  }

  private async analyzeTrends(dateFrom?: Date, dateTo?: Date): Promise<Array<{
    metric: string;
    direction: 'up' | 'down' | 'stable';
    significance: 'high' | 'medium' | 'low';
  }>> {
    const metrics = await db.kPIMetric.findMany({
      where: { isActive: true },
      include: {
        dataPoints: {
          where: {
            period: {
              gte: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              lte: dateTo || new Date(),
            },
          },
          orderBy: { period: 'desc' },
          take: 10,
        },
      },
    });

    return metrics.map(metric => {
      const dataPoints = metric.dataPoints;
      let direction: 'up' | 'down' | 'stable' = 'stable';
      let significance: 'high' | 'medium' | 'low' = 'low';

      if (dataPoints.length >= 3) {
        const recent = dataPoints.slice(0, 3).map(dp => dp.value.toNumber());
        const older = dataPoints.slice(-3).map(dp => dp.value.toNumber());
        
        const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
        const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
        
        const change = Math.abs((recentAvg - olderAvg) / olderAvg) * 100;
        
        if (change > 20) significance = 'high';
        else if (change > 10) significance = 'medium';
        
        if (recentAvg > olderAvg * 1.05) direction = 'up';
        else if (recentAvg < olderAvg * 0.95) direction = 'down';
      }

      return {
        metric: metric.name,
        direction,
        significance,
      };
    });
  }

  private generateExecutiveSummary(
    keyMetrics: Record<string, any>,
    trends: any[],
    alerts: KPIAlert[]
  ): string {
    const criticalAlerts = alerts.filter(a => a.severity === 'Critical').length;
    const warningAlerts = alerts.filter(a => a.severity === 'Warning').length;
    const positiveTrends = trends.filter(t => t.direction === 'up' && t.significance === 'high').length;
    const negativeTrends = trends.filter(t => t.direction === 'down' && t.significance === 'high').length;

    let summary = 'Business Intelligence Summary: ';
    
    if (criticalAlerts > 0) {
      summary += `${criticalAlerts} critical alerts require immediate attention. `;
    }
    
    if (positiveTrends > negativeTrends) {
      summary += 'Overall business metrics show positive momentum. ';
    } else if (negativeTrends > positiveTrends) {
      summary += 'Several key metrics are trending downward, requiring strategic review. ';
    } else {
      summary += 'Business performance is relatively stable. ';
    }

    summary += `${warningAlerts} metrics are approaching threshold limits.`;

    return summary;
  }

  private generateBusinessRecommendations(
    keyMetrics: Record<string, any>,
    trends: any[],
    alerts: KPIAlert[]
  ): string[] {
    const recommendations: string[] = [];

    if (alerts.some(a => a.severity === 'Critical')) {
      recommendations.push('Address critical KPI alerts immediately to prevent business impact');
    }

    const decliningSales = trends.find(t => 
      t.metric.toLowerCase().includes('revenue') && t.direction === 'down'
    );
    if (decliningSales) {
      recommendations.push('Review sales and marketing strategies to address declining revenue trends');
    }

    const increasingCosts = trends.find(t => 
      t.metric.toLowerCase().includes('cost') && t.direction === 'up'
    );
    if (increasingCosts) {
      recommendations.push('Implement cost optimization initiatives to control expense growth');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring key metrics and maintain current operational excellence');
    }

    return recommendations;
  }
}

export const businessIntelligenceService = new BusinessIntelligenceService();
