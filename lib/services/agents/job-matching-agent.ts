
import { BaseAIAgent, AIAgentContext, AIAgentResult, calculateJobMatchScore } from '../ai-agent-core';
import { prisma } from '@/lib/db';
import { AIAgentType } from '@prisma/client';

export class JobMatchingAgent extends BaseAIAgent {
  constructor(agentId: string, name: string, config: any = {}) {
    super(agentId, name, 'JOB_MATCHING', config);
  }

  async execute(context: AIAgentContext): Promise<AIAgentResult> {
    const { jobId, maxMatches = 10, autoNotify = true } = context.inputData;

    try {
      // Get job details
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          poster: true,
        },
      });

      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      console.log(`🎯 Finding matches for job: ${job.title} (${job.jobType})`);

      // Find potential contractors
      const contractors = await this.findPotentialContractors(job);
      
      // Calculate match scores for each contractor
      const matches = await this.calculateMatches(job, contractors);
      
      // Sort by match score and take top matches
      const topMatches = matches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, maxMatches);

      // Create job match records
      const jobMatches = await this.createJobMatches(job, topMatches);
      
      // Notify contractors if auto-notify is enabled
      let notificationResults = [];
      if (autoNotify) {
        notificationResults = await this.notifyContractors(jobMatches);
      }

      // Calculate revenue projection from potential matches
      const revenueProjection = this.calculateRevenueProjection(job, topMatches);

      return {
        success: true,
        outputData: {
          jobId,
          matchesFound: topMatches.length,
          topMatches: topMatches.slice(0, 5), // Return top 5 for display
          notifications: notificationResults.length,
          revenueProjection,
        },
        metrics: {
          jobsMatched: topMatches.length,
          revenueGenerated: revenueProjection.commission,
          processingTime: 0, // Will be set by base class
        },
      };
    } catch (error) {
      throw new Error(`Job matching execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Find potential contractors based on job requirements
  private async findPotentialContractors(job: any): Promise<any[]> {
    const whereClause: any = {
      role: { in: ['PROFESSIONAL', 'COMPANY'] },
      status: 'ACTIVE',
    };

    // Filter by location if job has geographic constraints
    if (job.city && job.state) {
      whereClause.OR = [
        { city: job.city, state: job.state },
        { 
          AND: [
            { state: job.state },
            { serviceRadius: { gte: this.calculateDistance(job.latitude, job.longitude) } }
          ]
        }
      ];
    }

    const contractors = await prisma.user.findMany({
      where: whereClause,
      include: {
        professionalProfile: true,
        companyProfile: true,
        reviews: {
          where: { targetId: undefined }, // Reviews they received
          select: {
            rating: true,
            qualityRating: true,
            timelinessRating: true,
            communicationRating: true,
            valueRating: true,
          },
        },
        bids: {
          where: {
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
          },
          select: {
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return contractors.filter(contractor => 
      this.meetsCertificationRequirements(contractor, job) &&
      this.meetsExperienceRequirements(contractor, job)
    );
  }

  private meetsCertificationRequirements(contractor: any, job: any): boolean {
    if (!job.requiredCertifications || job.requiredCertifications.length === 0) {
      return true;
    }

    // Check if contractor has required certifications
    const contractorCertifications = contractor.professionalProfile?.specializations || [];
    
    return job.requiredCertifications.some((required: string) =>
      contractorCertifications.some((cert: string) =>
        cert.toLowerCase().includes(required.toLowerCase())
      )
    );
  }

  private meetsExperienceRequirements(contractor: any, job: any): boolean {
    if (!job.requiredExperience) {
      return true;
    }

    const experience = contractor.professionalProfile?.yearsExperience || 
                     contractor.companyProfile?.foundedYear ? 
                     new Date().getFullYear() - contractor.companyProfile.foundedYear : 0;

    return experience >= job.requiredExperience;
  }

  // Calculate match scores for contractors
  private async calculateMatches(job: any, contractors: any[]): Promise<any[]> {
    const matches = [];

    for (const contractor of contractors) {
      const locationScore = this.calculateLocationScore(job, contractor);
      const skillScore = this.calculateSkillScore(job, contractor);
      const availabilityScore = this.calculateAvailabilityScore(job, contractor);
      const priceScore = await this.calculatePriceScore(job, contractor);
      
      const matchScore = calculateJobMatchScore(
        locationScore,
        skillScore,
        availabilityScore,
        priceScore
      );

      const suggestedBid = this.calculateSuggestedBid(job, contractor);
      const winProbability = this.calculateWinProbability(matchScore, priceScore);

      matches.push({
        contractor,
        matchScore: Math.round(matchScore * 100) / 100,
        locationScore,
        skillScore,
        availabilityScore,
        priceScore,
        suggestedBid,
        winProbability,
        travelDistance: this.calculateTravelDistance(job, contractor),
        competitorCount: contractors.length - 1,
      });
    }

    return matches;
  }

  private calculateLocationScore(job: any, contractor: any): number {
    if (!job.latitude || !job.longitude || !contractor.latitude || !contractor.longitude) {
      // Fallback to city/state matching
      if (job.city === contractor.city && job.state === contractor.state) {
        return 1.0;
      }
      if (job.state === contractor.state) {
        return 0.6;
      }
      return 0.3;
    }

    const distance = this.calculateDistance(
      job.latitude, job.longitude,
      contractor.latitude, contractor.longitude
    );

    // Score based on distance (closer = higher score)
    if (distance <= 10) return 1.0;
    if (distance <= 25) return 0.8;
    if (distance <= 50) return 0.6;
    if (distance <= 100) return 0.4;
    return 0.2;
  }

  private calculateSkillScore(job: any, contractor: any): number {
    const jobType = job.jobType;
    const specializations = contractor.professionalProfile?.specializations || 
                           contractor.companyProfile?.serviceTypes || [];

    // Check for exact matches
    const exactMatch = specializations.some((spec: string) =>
      spec.toLowerCase().includes(jobType.toLowerCase().replace('_', ' '))
    );

    if (exactMatch) return 1.0;

    // Check for related skills
    const relatedSkills = this.getRelatedSkills(jobType);
    const hasRelatedSkill = specializations.some((spec: string) =>
      relatedSkills.some(related =>
        spec.toLowerCase().includes(related.toLowerCase())
      )
    );

    if (hasRelatedSkill) return 0.7;

    // General tree service capability
    const hasGeneralSkill = specializations.some((spec: string) =>
      ['tree', 'arborist', 'forestry'].some(keyword =>
        spec.toLowerCase().includes(keyword)
      )
    );

    return hasGeneralSkill ? 0.5 : 0.2;
  }

  private getRelatedSkills(jobType: string): string[] {
    const skillMap: { [key: string]: string[] } = {
      'TREE_REMOVAL': ['tree cutting', 'tree service', 'emergency response'],
      'TREE_PRUNING': ['tree trimming', 'tree health', 'arborist'],
      'STUMP_GRINDING': ['stump removal', 'tree service'],
      'EMERGENCY_RESPONSE': ['storm cleanup', 'tree removal', 'emergency'],
      'STORM_CLEANUP': ['emergency response', 'tree removal', 'debris removal'],
      'TREE_PLANTING': ['landscaping', 'tree service', 'arborist'],
      'TREE_HEALTH_ASSESSMENT': ['arborist', 'tree health', 'consultation'],
      'CRANE_SERVICE': ['heavy lifting', 'tree removal', 'equipment operation'],
      'LOT_CLEARING': ['land clearing', 'forestry', 'tree removal'],
      'COMMERCIAL_MAINTENANCE': ['tree service', 'landscaping', 'maintenance'],
    };

    return skillMap[jobType] || ['tree service'];
  }

  private calculateAvailabilityScore(job: any, contractor: any): number {
    // Check recent bid activity as proxy for availability
    const recentBids = contractor.bids.filter((bid: any) =>
      new Date(bid.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    // Lower recent activity = higher availability
    if (recentBids.length === 0) return 1.0;
    if (recentBids.length <= 2) return 0.8;
    if (recentBids.length <= 5) return 0.6;
    if (recentBids.length <= 10) return 0.4;
    return 0.2;
  }

  private async calculatePriceScore(job: any, contractor: any): Promise<number> {
    // Get market pricing for similar jobs
    const marketPrice = await this.getMarketPrice(job);
    const contractorRate = this.getContractorRate(contractor);

    if (!marketPrice || !contractorRate) {
      return 0.5; // Neutral score if no pricing data
    }

    // Score based on competitiveness (lower price = higher score, but with quality considerations)
    const priceRatio = contractorRate / marketPrice;
    
    if (priceRatio <= 0.8) return 1.0; // 20% below market
    if (priceRatio <= 0.9) return 0.9; // 10% below market
    if (priceRatio <= 1.0) return 0.8; // At market price
    if (priceRatio <= 1.1) return 0.6; // 10% above market
    if (priceRatio <= 1.2) return 0.4; // 20% above market
    return 0.2; // More than 20% above market
  }

  private async getMarketPrice(job: any): Promise<number | null> {
    // Get average bid amounts for similar jobs
    const similarJobs = await prisma.job.findMany({
      where: {
        jobType: job.jobType,
        city: job.city,
        state: job.state,
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
      include: {
        bids: {
          where: { status: 'accepted' },
          select: { amount: true },
        },
      },
    });

    const acceptedBids = similarJobs.flatMap(j => j.bids);
    
    if (acceptedBids.length === 0) {
      return null;
    }

    const totalAmount = acceptedBids.reduce((sum, bid) => sum + Number(bid.amount), 0);
    return totalAmount / acceptedBids.length;
  }

  private getContractorRate(contractor: any): number | null {
    const hourlyRate = contractor.professionalProfile?.hourlyRate;
    const estimatedHours = 8; // Default estimated hours for rate calculation
    
    if (hourlyRate) {
      return Number(hourlyRate) * estimatedHours;
    }

    // Fallback to recent bid average
    if (contractor.bids.length > 0) {
      const totalBids = contractor.bids.reduce((sum: number, bid: any) => sum + Number(bid.amount), 0);
      return totalBids / contractor.bids.length;
    }

    return null;
  }

  private calculateSuggestedBid(job: any, contractor: any): number {
    const basePrice = this.estimateJobValue(job);
    const contractorRate = this.getContractorRate(contractor);
    
    if (contractorRate) {
      // Adjust based on contractor's typical rates
      return Math.round((basePrice + contractorRate) / 2);
    }

    // Adjust based on job urgency and contractor competitiveness
    let multiplier = 1.0;
    
    if (job.urgency === 'EMERGENCY') multiplier += 0.5;
    else if (job.urgency === 'URGENT') multiplier += 0.3;
    else if (job.urgency === 'WITHIN_DAYS') multiplier += 0.1;

    // Factor in contractor rating
    const avgRating = this.getContractorRating(contractor);
    if (avgRating >= 4.5) multiplier += 0.1;
    else if (avgRating <= 3.0) multiplier -= 0.1;

    return Math.round(basePrice * multiplier);
  }

  private estimateJobValue(job: any): number {
    // Base pricing by job type
    const basePrices: { [key: string]: number } = {
      'TREE_REMOVAL': 1500,
      'TREE_PRUNING': 800,
      'STUMP_GRINDING': 400,
      'EMERGENCY_RESPONSE': 2500,
      'STORM_CLEANUP': 2000,
      'TREE_PLANTING': 600,
      'TREE_HEALTH_ASSESSMENT': 300,
      'CRANE_SERVICE': 3000,
      'LOT_CLEARING': 2500,
      'COMMERCIAL_MAINTENANCE': 1200,
    };

    let basePrice = basePrices[job.jobType] || 1000;

    // Adjust for job budget if available
    if (job.budgetMax) {
      basePrice = Math.min(basePrice, Number(job.budgetMax));
    }
    if (job.budgetMin) {
      basePrice = Math.max(basePrice, Number(job.budgetMin));
    }

    return basePrice;
  }

  private getContractorRating(contractor: any): number {
    if (contractor.reviews.length === 0) {
      return 4.0; // Default neutral rating
    }

    const totalRating = contractor.reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    return totalRating / contractor.reviews.length;
  }

  private calculateWinProbability(matchScore: number, priceScore: number): number {
    // Combine match score and price competitiveness
    const baseProbability = (matchScore * 0.7 + priceScore * 0.3) * 100;
    
    // Adjust for market competition (more contractors = lower probability)
    const competitionFactor = Math.max(0.5, 1 - (this.getCompetitorCount() * 0.05));
    
    return Math.round(baseProbability * competitionFactor);
  }

  private getCompetitorCount(): number {
    // This would be dynamic based on actual contractor pool
    return 8; // Average number of competitors per job
  }

  // Create job match records in database
  private async createJobMatches(job: any, matches: any[]): Promise<any[]> {
    const jobMatches = [];

    for (const match of matches) {
      try {
        const jobMatch = await prisma.jobMatch.create({
          data: {
            matchScore: match.matchScore,
            matchReason: this.generateMatchReason(match),
            travelDistance: match.travelDistance,
            skillMatch: match.skillScore * 100,
            availabilityMatch: match.availabilityScore * 100,
            priceMatch: match.priceScore * 100,
            suggestedBid: match.suggestedBid,
            winProbability: match.winProbability,
            competitorCount: match.competitorCount,
            averageMarketPrice: await this.getMarketPrice(job) || 0,
            jobId: job.id,
            contractorId: match.contractor.id,
            aiAgentId: this.agentId,
          },
        });

        jobMatches.push({
          ...jobMatch,
          contractor: match.contractor,
        });
      } catch (error) {
        console.error('Failed to create job match:', error);
      }
    }

    return jobMatches;
  }

  private generateMatchReason(match: any): string[] {
    const reasons = [];

    if (match.locationScore >= 0.8) {
      reasons.push('Location');
    }
    if (match.skillScore >= 0.8) {
      reasons.push('Skills');
    }
    if (match.availabilityScore >= 0.8) {
      reasons.push('Availability');
    }
    if (match.priceScore >= 0.8) {
      reasons.push('Pricing');
    }

    if (reasons.length === 0) {
      reasons.push('General Match');
    }

    return reasons;
  }

  // Notify contractors about job matches
  private async notifyContractors(jobMatches: any[]): Promise<any[]> {
    const notifications = [];

    for (const match of jobMatches) {
      try {
        // Update match record to indicate notification sent
        await prisma.jobMatch.update({
          where: { id: match.id },
          data: { contractorNotified: true },
        });

        notifications.push({
          contractorId: match.contractorId,
          jobId: match.jobId,
          matchScore: match.matchScore,
          suggestedBid: match.suggestedBid,
          notified: true,
        });

        // In a real implementation, this would send actual notifications
        // (email, SMS, push notifications, etc.)
        console.log(`📧 Notified contractor ${match.contractor.email} about job match (Score: ${match.matchScore})`);
      } catch (error) {
        console.error('Failed to notify contractor:', error);
      }
    }

    return notifications;
  }

  private calculateRevenueProjection(job: any, matches: any[]): any {
    const averageWinProbability = matches.reduce((sum, match) => sum + match.winProbability, 0) / matches.length;
    const averageBidAmount = matches.reduce((sum, match) => sum + match.suggestedBid, 0) / matches.length;
    
    // Platform commission (typically 5-10% of job value)
    const commissionRate = 0.07; // 7%
    const expectedCommission = averageBidAmount * (averageWinProbability / 100) * commissionRate;

    return {
      averageBidAmount: Math.round(averageBidAmount),
      averageWinProbability: Math.round(averageWinProbability),
      commission: Math.round(expectedCommission),
      commissionRate,
    };
  }

  // Utility methods
  private calculateDistance(lat1: number, lon1: number, lat2?: number, lon2?: number): number {
    if (!lat2 || !lon2) return 999; // Large distance if coordinates not available

    const R = 3959; // Earth's radius in miles
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private calculateTravelDistance(job: any, contractor: any): number {
    return this.calculateDistance(
      job.latitude, job.longitude,
      contractor.latitude, contractor.longitude
    );
  }
}
