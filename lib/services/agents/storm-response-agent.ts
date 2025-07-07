
import { BaseAIAgent, AIAgentContext, AIAgentResult, calculateLeadCommission } from '../ai-agent-core';
import { prisma } from '@/lib/db';
import { AIAgentType } from '@prisma/client';

export class StormResponseAgent extends BaseAIAgent {
  constructor(agentId: string, name: string, config: any = {}) {
    super(agentId, name, 'STORM_RESPONSE', config);
  }

  async execute(context: AIAgentContext): Promise<AIAgentResult> {
    const { stormEventId, immediateResponse = true } = context.inputData;

    try {
      // Get storm event details
      const stormEvent = await prisma.stormEvent.findUnique({
        where: { id: stormEventId },
        include: { weatherData: true },
      });

      if (!stormEvent) {
        throw new Error(`Storm event not found: ${stormEventId}`);
      }

      console.log(`🌪️ Processing storm response for: ${stormEvent.type} (${stormEvent.severity})`);

      // Generate leads based on storm impact
      const leads = await this.generateStormLeads(stormEvent);
      
      // Alert crews in affected areas
      const crewAlerts = await this.alertCrews(stormEvent);
      
      // Stage equipment recommendations
      const equipmentRecommendations = await this.recommendEquipmentStaging(stormEvent);
      
      // Calculate revenue projections
      const revenueProjection = await this.calculateRevenueProjection(leads, stormEvent);

      // Create storm response record
      const stormResponse = await prisma.stormResponse.create({
        data: {
          responseType: immediateResponse ? 'Automated' : 'Manual',
          status: 'Active',
          leadsGenerated: leads.length,
          contactsReached: leads.filter(lead => lead.contacted).length,
          jobsCreated: 0, // Will be updated as leads convert
          crewsAlerted: crewAlerts.alerted,
          crewsResponded: 0, // Will be updated as crews respond
          equipmentStaged: equipmentRecommendations.map(rec => rec.equipmentType),
          estimatedRevenue: revenueProjection.estimated,
          actualRevenue: 0, // Will be updated as jobs complete
          leadsConverted: 0,
          conversionRate: 0,
          responseTime: immediateResponse ? 5 : 15, // minutes
          effectivenessScore: this.calculateEffectivenessScore(stormEvent, leads.length),
          stormEventId,
          aiAgentId: this.agentId,
        },
      });

      // Track revenue from leads
      const totalLeadValue = leads.reduce((sum, lead) => sum + lead.estimatedValue, 0);
      const commission = calculateLeadCommission(totalLeadValue);

      if (commission > 0) {
        await prisma.revenueTracking.create({
          data: {
            source: 'Storm_Response',
            sourceId: stormResponse.id,
            amount: commission,
            revenueType: 'Commission',
            category: 'Storm_Response',
            subcategory: stormEvent.type,
            aiAgentId: this.agentId,
          },
        });
      }

      return {
        success: true,
        outputData: {
          stormResponseId: stormResponse.id,
          leadsGenerated: leads.length,
          crewsAlerted: crewAlerts.alerted,
          equipmentRecommendations: equipmentRecommendations.length,
          estimatedRevenue: revenueProjection.estimated,
          commission,
        },
        metrics: {
          revenueGenerated: commission,
          leadsGenerated: leads.length,
          processingTime: 0, // Will be set by base class
        },
      };
    } catch (error) {
      throw new Error(`Storm response execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate leads based on storm impact
  private async generateStormLeads(stormEvent: any): Promise<any[]> {
    const leads = [];
    
    // Calculate lead generation based on storm severity and affected areas
    const leadsPerCity = this.calculateLeadsPerCity(stormEvent.severity);
    
    for (const city of stormEvent.affectedCities) {
      for (let i = 0; i < leadsPerCity; i++) {
        const lead = await this.createStormLead(stormEvent, city);
        if (lead) {
          leads.push(lead);
        }
      }
    }

    return leads;
  }

  private calculateLeadsPerCity(severity: string): number {
    const leadMultipliers = {
      'Extreme': 50,
      'Severe': 30,
      'Major': 20,
      'Moderate': 10,
      'Minor': 5,
    };
    
    return leadMultipliers[severity as keyof typeof leadMultipliers] || 5;
  }

  private async createStormLead(stormEvent: any, city: string): Promise<any | null> {
    try {
      // Generate realistic lead data (in production, this would come from various sources)
      const serviceTypes = ['Emergency', 'Storm_Cleanup', 'Tree_Removal', 'Debris_Removal'];
      const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      
      const estimatedValue = this.calculateEstimatedLeadValue(stormEvent.severity, serviceType);
      
      const lead = await prisma.leadGeneration.create({
        data: {
          source: 'Storm_Response',
          sourceDetails: {
            stormEventId: stormEvent.id,
            stormType: stormEvent.type,
            severity: stormEvent.severity,
            autoGenerated: true,
          },
          homeownerName: this.generateLeadName(),
          homeownerEmail: this.generateLeadEmail(),
          homeownerPhone: this.generateLeadPhone(),
          propertyAddress: this.generatePropertyAddress(city),
          city: city,
          state: stormEvent.affectedStates[0] || 'Unknown',
          zipCode: this.generateZipCode(),
          serviceType,
          urgency: stormEvent.severity === 'Extreme' || stormEvent.severity === 'Severe' ? 'Immediate' : 'Within_Week',
          estimatedValue,
          status: 'New',
          leadValue: estimatedValue,
          commissionEarned: calculateLeadCommission(estimatedValue),
          generatedById: this.agentId,
        },
      });

      return {
        id: lead.id,
        estimatedValue,
        contacted: false, // Would be updated by follow-up processes
      };
    } catch (error) {
      console.error('Failed to create storm lead:', error);
      return null;
    }
  }

  private calculateEstimatedLeadValue(severity: string, serviceType: string): number {
    const baseValues = {
      'Emergency': 2500,
      'Storm_Cleanup': 1800,
      'Tree_Removal': 1200,
      'Debris_Removal': 800,
    };
    
    const severityMultipliers = {
      'Extreme': 2.5,
      'Severe': 2.0,
      'Major': 1.5,
      'Moderate': 1.2,
      'Minor': 1.0,
    };
    
    const baseValue = baseValues[serviceType as keyof typeof baseValues] || 1000;
    const multiplier = severityMultipliers[severity as keyof typeof severityMultipliers] || 1.0;
    
    // Add some randomness
    const variance = 0.3; // ±30%
    const randomFactor = 1 + (Math.random() - 0.5) * 2 * variance;
    
    return Math.round(baseValue * multiplier * randomFactor);
  }

  // Alert crews in affected areas
  private async alertCrews(stormEvent: any): Promise<{ alerted: number; crews: any[] }> {
    try {
      // Find professionals and companies in affected areas
      const crews = await prisma.user.findMany({
        where: {
          role: { in: ['PROFESSIONAL', 'COMPANY'] },
          state: { in: stormEvent.affectedStates },
          emergencyAlerts: true, // Only alert users who opted in
        },
        include: {
          professionalProfile: true,
          companyProfile: true,
        },
      });

      // Create emergency alert
      const alert = await prisma.emergencyAlert.create({
        data: {
          title: `${stormEvent.type} Alert - ${stormEvent.severity} Severity`,
          message: `A ${stormEvent.severity.toLowerCase()} ${stormEvent.type.toLowerCase()} is affecting your service area. High tree service demand expected. Position your crews and equipment for rapid response.`,
          alertType: 'STORM_WARNING',
          priority: stormEvent.severity === 'Extreme' || stormEvent.severity === 'Severe' ? 'CRITICAL' : 'HIGH',
          affectedStates: stormEvent.affectedStates,
          affectedCities: stormEvent.affectedCities,
          weatherConditions: `${stormEvent.type}, max winds ${stormEvent.maxWindSpeed} mph`,
          windSpeed: Math.round(stormEvent.maxWindSpeed || 0),
          estimatedJobVolume: this.calculateEstimatedJobVolume(stormEvent),
          responseDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
          specialInstructions: this.generateStormInstructions(stormEvent),
          createdById: 'system', // System-generated alert
        },
      });

      return {
        alerted: crews.length,
        crews: crews.map(crew => ({
          id: crew.id,
          name: crew.firstName || crew.companyName,
          location: `${crew.city}, ${crew.state}`,
          type: crew.role,
        })),
      };
    } catch (error) {
      console.error('Failed to alert crews:', error);
      return { alerted: 0, crews: [] };
    }
  }

  private calculateEstimatedJobVolume(stormEvent: any): number {
    const baseVolume = stormEvent.affectedCities.length * 10;
    const severityMultipliers = {
      'Extreme': 5,
      'Severe': 3,
      'Major': 2,
      'Moderate': 1.5,
      'Minor': 1,
    };
    
    const multiplier = severityMultipliers[stormEvent.severity as keyof typeof severityMultipliers] || 1;
    return Math.round(baseVolume * multiplier);
  }

  private generateStormInstructions(stormEvent: any): string {
    const instructions = [
      `Ensure all safety equipment is ready and crews are briefed on ${stormEvent.type.toLowerCase()} response protocols.`,
      'Prioritize emergency calls involving power lines, blocked roads, and property damage.',
      'Stage equipment in central locations for rapid deployment.',
      'Coordinate with local emergency services and utility companies.',
    ];

    if (stormEvent.maxWindSpeed > 40) {
      instructions.push('High winds expected - exercise extreme caution during operations.');
    }

    return instructions.join(' ');
  }

  // Recommend equipment staging
  private async recommendEquipmentStaging(stormEvent: any): Promise<any[]> {
    const recommendations = [];
    
    // Equipment recommendations based on storm type and severity
    const equipmentNeeds = this.calculateEquipmentNeeds(stormEvent);
    
    for (const equipment of equipmentNeeds) {
      recommendations.push({
        equipmentType: equipment.type,
        quantity: equipment.quantity,
        priority: equipment.priority,
        stagingLocation: 'Central depot',
        reason: equipment.reason,
      });
    }

    return recommendations;
  }

  private calculateEquipmentNeeds(stormEvent: any): any[] {
    const needs = [];
    
    // Base equipment for all storms
    needs.push({
      type: 'Chainsaw',
      quantity: Math.ceil(stormEvent.affectedCities.length * 2),
      priority: 'High',
      reason: 'Tree cutting and debris removal',
    });

    needs.push({
      type: 'Chipper',
      quantity: Math.ceil(stormEvent.affectedCities.length * 0.5),
      priority: 'Medium',
      reason: 'On-site debris processing',
    });

    // Additional equipment for severe storms
    if (stormEvent.severity === 'Extreme' || stormEvent.severity === 'Severe') {
      needs.push({
        type: 'Crane',
        quantity: Math.ceil(stormEvent.affectedCities.length * 0.3),
        priority: 'High',
        reason: 'Large tree removal and emergency lifting',
      });

      needs.push({
        type: 'Bucket Truck',
        quantity: Math.ceil(stormEvent.affectedCities.length * 0.8),
        priority: 'High',
        reason: 'Power line clearance and elevated work',
      });
    }

    return needs;
  }

  // Calculate revenue projection
  private async calculateRevenueProjection(leads: any[], stormEvent: any): Promise<{ estimated: number; breakdown: any }> {
    const totalLeadValue = leads.reduce((sum, lead) => sum + lead.estimatedValue, 0);
    
    // Apply conversion rate based on storm severity (higher severity = higher conversion)
    const conversionRates = {
      'Extreme': 0.8,
      'Severe': 0.7,
      'Major': 0.6,
      'Moderate': 0.5,
      'Minor': 0.4,
    };
    
    const conversionRate = conversionRates[stormEvent.severity as keyof typeof conversionRates] || 0.5;
    const estimatedRevenue = totalLeadValue * conversionRate * 0.25; // 25% commission rate
    
    return {
      estimated: Math.round(estimatedRevenue),
      breakdown: {
        totalLeadValue,
        conversionRate,
        commission: 0.25,
        leads: leads.length,
      },
    };
  }

  private calculateEffectivenessScore(stormEvent: any, leadsGenerated: number): number {
    // Base score on lead generation relative to storm impact
    const expectedLeads = stormEvent.affectedCities.length * 10;
    const generationEfficiency = Math.min(leadsGenerated / expectedLeads, 1.0);
    
    // Severity bonus
    const severityBonuses = {
      'Extreme': 20,
      'Severe': 15,
      'Major': 10,
      'Moderate': 5,
      'Minor': 0,
    };
    
    const severityBonus = severityBonuses[stormEvent.severity as keyof typeof severityBonuses] || 0;
    
    return Math.round((generationEfficiency * 80) + severityBonus);
  }

  // Utility methods for generating realistic lead data
  private generateLeadName(): string {
    const firstNames = ['John', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda', 'David', 'Elizabeth'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Taylor', 'Miller', 'Wilson', 'Moore', 'Anderson', 'Jackson', 'White'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }

  private generateLeadEmail(): string {
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const name = this.generateLeadName().toLowerCase().replace(' ', '.');
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    return `${name}${Math.floor(Math.random() * 999)}@${domain}`;
  }

  private generateLeadPhone(): string {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const exchange = Math.floor(Math.random() * 900) + 100;
    const number = Math.floor(Math.random() * 9000) + 1000;
    
    return `${areaCode}-${exchange}-${number}`;
  }

  private generatePropertyAddress(city: string): string {
    const streetNumbers = [Math.floor(Math.random() * 9999) + 1];
    const streetNames = ['Oak', 'Pine', 'Maple', 'Cedar', 'Elm', 'Birch', 'Willow', 'Cherry', 'Walnut', 'Hickory'];
    const streetTypes = ['St', 'Ave', 'Dr', 'Ln', 'Ct', 'Way', 'Blvd'];
    
    const streetNumber = streetNumbers[0];
    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    const streetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];
    
    return `${streetNumber} ${streetName} ${streetType}`;
  }

  private generateZipCode(): string {
    return Math.floor(Math.random() * 90000 + 10000).toString();
  }
}
