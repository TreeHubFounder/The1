
import { db } from '@/lib/db';
import type { 
  SafetyCertificationTracking,
  TrustScore,
  OnlineReview,
  CrisisManagement,
  ReputationMonitoring,
  BrandMention,
  CertificationStatus,
  ReviewSource
} from '@prisma/client';

export interface CreateCertificationData {
  certificationType: string;
  certificationName: string;
  issuingOrganization: string;
  certificateNumber?: string;
  issueDate: Date;
  expirationDate?: Date;
  holderId: string;
  certificateFile?: string;
  proofOfTraining?: string[];
  trustScoreImpact?: number;
  isPubliclyDisplayed?: boolean;
}

export interface TrustScoreCalculation {
  overallScore: number;
  safetyScore: number;
  reliabilityScore: number;
  qualityScore: number;
  communicationScore: number;
  certificationScore: number;
  reviewScore: number;
  experienceScore: number;
  verificationScore: number;
  scoringFactors: any;
  recommendations: string[];
}

export interface ReputationSummary {
  overallSentiment: number;
  totalMentions: number;
  positiveMentions: number;
  negativeMentions: number;
  neutralMentions: number;
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  brandHealth: 'excellent' | 'good' | 'fair' | 'poor';
  trendingTopics: string[];
}

export interface CrisisResponse {
  responseTime: number;
  communicationChannels: string[];
  stakeholdersNotified: number;
  mediaQueries: number;
  socialMediaImpact: number;
  reputationImpact: string;
  recoveryTimeEstimate: number;
}

export class BrandTrustManagementService {
  // Safety Certification Management
  async addCertification(data: CreateCertificationData): Promise<SafetyCertificationTracking> {
    const certification = await db.safetyCertificationTracking.create({
      data: {
        ...data,
        status: 'ACTIVE',
        verificationStatus: 'Pending',
        renewalRequired: data.expirationDate ? true : false,
        renewalDeadline: data.expirationDate,
        proofOfTraining: data.proofOfTraining || [],
        trustScoreImpact: data.trustScoreImpact || this.calculateCertificationImpact(data.certificationType),
        isPubliclyDisplayed: data.isPubliclyDisplayed ?? true,
      },
      include: {
        holder: true,
      },
    });

    // Update trust score
    await this.recalculateTrustScore(data.holderId);

    // Set renewal reminders
    if (data.expirationDate) {
      await this.setRenewalReminders(certification.id, data.expirationDate);
    }

    return certification;
  }

  async verifyCertification(
    certificationId: string,
    verifiedBy: string,
    verificationNotes?: string
  ): Promise<SafetyCertificationTracking> {
    const certification = await db.safetyCertificationTracking.update({
      where: { id: certificationId },
      data: {
        verificationStatus: 'Verified',
        verifiedBy,
        verificationDate: new Date(),
        verificationNotes,
      },
      include: { holder: true },
    });

    // Update trust score after verification
    await this.recalculateTrustScore(certification.holderId);

    return certification;
  }

  async renewCertification(
    certificationId: string,
    newExpirationDate: Date,
    certificateFile?: string
  ): Promise<SafetyCertificationTracking> {
    return await db.safetyCertificationTracking.update({
      where: { id: certificationId },
      data: {
        expirationDate: newExpirationDate,
        status: 'ACTIVE',
        renewalRequired: false,
        renewalDeadline: newExpirationDate,
        certificateFile: certificateFile || undefined,
      },
    });
  }

  async markCertificationExpired(certificationId: string): Promise<SafetyCertificationTracking> {
    const certification = await db.safetyCertificationTracking.update({
      where: { id: certificationId },
      data: {
        status: 'EXPIRED',
        renewalRequired: true,
      },
      include: { holder: true },
    });

    // Recalculate trust score due to expired certification
    await this.recalculateTrustScore(certification.holderId);

    return certification;
  }

  // Trust Score Management
  async calculateTrustScore(userId: string): Promise<TrustScoreCalculation> {
    const [
      user,
      certifications,
      reviews,
      jobsCompleted,
      verificationStatus,
    ] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        include: {
          professionalProfile: true,
          companyProfile: true,
        },
      }),
      db.safetyCertificationTracking.findMany({
        where: { holderId: userId, status: 'ACTIVE' },
      }),
      db.review.findMany({
        where: { targetId: userId },
      }),
      db.job.count({
        where: { 
          posterId: userId,
          status: 'COMPLETED',
        },
      }),
      db.user.findUnique({
        where: { id: userId },
        select: { verificationStatus: true },
      }),
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate individual score components
    const certificationScore = this.calculateCertificationScore(certifications);
    const reviewScore = this.calculateReviewScore(reviews);
    const experienceScore = this.calculateExperienceScore(jobsCompleted, user);
    const verificationScore = this.calculateVerificationScore(verificationStatus?.verificationStatus);
    
    // Component scores
    const safetyScore = (certificationScore + verificationScore) / 2;
    const reliabilityScore = (experienceScore + reviewScore) / 2;
    const qualityScore = reviewScore;
    const communicationScore = this.calculateCommunicationScore(reviews);

    // Overall score with weights
    const weights = {
      safety: 0.3,
      reliability: 0.25,
      quality: 0.25,
      communication: 0.2,
    };

    const overallScore = Math.round(
      safetyScore * weights.safety +
      reliabilityScore * weights.reliability +
      qualityScore * weights.quality +
      communicationScore * weights.communication
    );

    const scoringFactors = {
      weights,
      componentScores: {
        certification: certificationScore,
        review: reviewScore,
        experience: experienceScore,
        verification: verificationScore,
      },
      dataPoints: {
        certificationsCount: certifications.length,
        reviewsCount: reviews.length,
        jobsCompleted,
        isVerified: verificationStatus?.verificationStatus === 'VERIFIED',
      },
    };

    const recommendations = this.generateTrustScoreRecommendations(
      overallScore,
      certificationScore,
      reviewScore,
      experienceScore,
      verificationScore
    );

    return {
      overallScore,
      safetyScore,
      reliabilityScore,
      qualityScore,
      communicationScore,
      certificationScore,
      reviewScore,
      experienceScore,
      verificationScore,
      scoringFactors,
      recommendations,
    };
  }

  async recalculateTrustScore(userId: string): Promise<TrustScore> {
    const calculation = await this.calculateTrustScore(userId);

    const existingScore = await db.trustScore.findUnique({
      where: { userId },
    });

    const scoreData = {
      overallScore: calculation.overallScore,
      safetyScore: calculation.safetyScore,
      reliabilityScore: calculation.reliabilityScore,
      qualityScore: calculation.qualityScore,
      communicationScore: calculation.communicationScore,
      certificationScore: calculation.certificationScore,
      reviewScore: calculation.reviewScore,
      experienceScore: calculation.experienceScore,
      verificationScore: calculation.verificationScore,
      lastCalculatedAt: new Date(),
      scoringFactors: calculation.scoringFactors,
      previousScore: existingScore?.overallScore,
      scoreChange: existingScore 
        ? calculation.overallScore - existingScore.overallScore.toNumber()
        : 0,
      scoreChangeDate: new Date(),
      isPubliclyVisible: true,
    };

    if (existingScore) {
      return await db.trustScore.update({
        where: { userId },
        data: scoreData,
      });
    } else {
      return await db.trustScore.create({
        data: {
          userId,
          ...scoreData,
        },
      });
    }
  }

  // Online Review Management
  async importOnlineReview(data: {
    businessId: string;
    rating: number;
    title?: string;
    content: string;
    source: ReviewSource;
    sourceUrl?: string;
    sourceReviewId?: string;
    reviewerName?: string;
    reviewerProfile?: string;
    reviewDate: Date;
    jobId?: string;
  }): Promise<OnlineReview> {
    const review = await db.onlineReview.create({
      data: {
        ...data,
        sentimentScore: this.analyzeSentiment(data.content),
        sentimentLabel: this.getSentimentLabel(data.content),
        keywords: this.extractKeywords(data.content),
        hasResponse: false,
        isVerified: false,
        isFlagged: false,
        isFeaturedin: false,
        isPromoted: false,
        trustScoreImpact: this.calculateReviewImpact(data.rating),
      },
      include: {
        business: true,
        job: true,
      },
    });

    // Update trust score
    await this.recalculateTrustScore(data.businessId);

    // Check if review needs attention (negative sentiment)
    if (review.sentimentScore < -0.3) {
      await this.flagReviewForAttention(review.id, 'Negative sentiment detected');
    }

    return review;
  }

  async respondToReview(
    reviewId: string,
    responseText: string,
    respondedBy: string
  ): Promise<OnlineReview> {
    return await db.onlineReview.update({
      where: { id: reviewId },
      data: {
        hasResponse: true,
        responseText,
        responseDate: new Date(),
        respondedBy,
      },
    });
  }

  async promoteReview(reviewId: string): Promise<OnlineReview> {
    return await db.onlineReview.update({
      where: { id: reviewId },
      data: {
        isPromoted: true,
        isFeaturedin: true,
      },
    });
  }

  // Crisis Management
  async createCrisisEvent(data: {
    crisisType: string;
    severity: string;
    title: string;
    description: string;
    priority?: string;
    reputationImpact?: string;
    businessImpact?: string;
    publicVisibility?: string;
    assignedToId?: string;
    relatedJobId?: string;
    responseStrategy?: string;
    keyMessages?: string[];
    approvedSpokesperson?: string;
  }): Promise<CrisisManagement> {
    const crisis = await db.crisisManagement.create({
      data: {
        ...data,
        status: 'Active',
        priority: data.priority || 'High',
        crisisStartTime: new Date(),
        keyMessages: data.keyMessages || [],
        immediateActions: [],
        shortTermActions: [],
        longTermActions: [],
        preventionMeasures: [],
        monitoringKeywords: [],
        alertsSetup: false,
        recoveryActions: [],
        brandRepairEfforts: [],
        followUpRequired: true,
      },
      include: {
        assignedTo: true,
        relatedJob: true,
      },
    });

    // Set up monitoring if this is a public crisis
    if (data.publicVisibility && data.publicVisibility !== 'Internal') {
      await this.setupCrisisMonitoring(crisis.id, data.title);
    }

    return crisis;
  }

  async updateCrisisResponse(
    crisisId: string,
    data: {
      responseTime?: number;
      internalCommunication?: string;
      externalCommunication?: string;
      mediaResponse?: string;
      socialMediaResponse?: string;
      immediateActions?: string[];
      shortTermActions?: string[];
      longTermActions?: string[];
      affectedParties?: string[];
      notifiedParties?: string[];
    }
  ): Promise<CrisisManagement> {
    const updateData: any = { ...data };
    
    if (data.responseTime) {
      updateData.responseTime = data.responseTime;
    }

    return await db.crisisManagement.update({
      where: { id: crisisId },
      data: updateData,
    });
  }

  async resolveCrisis(
    crisisId: string,
    resolutionTime: number,
    recoveryActions: string[],
    brandRepairEfforts: string[],
    preventionMeasures: string[]
  ): Promise<CrisisManagement> {
    return await db.crisisManagement.update({
      where: { id: crisisId },
      data: {
        status: 'Resolved',
        resolutionTime,
        recoveryActions,
        brandRepairEfforts,
        preventionMeasures,
        resolvedAt: new Date(),
      },
    });
  }

  // Reputation Monitoring
  async createReputationMonitoring(data: {
    monitoringType: string;
    keywords: string[];
    sources: string[];
    alertThreshold?: number;
    alertEnabled?: boolean;
    alertRecipients?: string[];
    scanFrequency?: string;
  }): Promise<ReputationMonitoring> {
    return await db.reputationMonitoring.create({
      data: {
        ...data,
        alertThreshold: data.alertThreshold || -0.3,
        alertEnabled: data.alertEnabled ?? true,
        alertRecipients: data.alertRecipients || [],
        scanFrequency: data.scanFrequency || 'Daily',
        mentionCount: 0,
        positiveMentions: 0,
        negativeMentions: 0,
        neutralMentions: 0,
      },
    });
  }

  async addBrandMention(
    monitoringId: string,
    data: {
      source: string;
      url?: string;
      title?: string;
      content: string;
      author?: string;
      mentionDate: Date;
      estimatedReach?: number;
      engagementCount?: number;
    }
  ): Promise<BrandMention> {
    const sentimentScore = this.analyzeSentiment(data.content);
    const sentiment = this.getSentimentLabel(data.content);
    const relevanceScore = this.calculateRelevanceScore(data.content);
    const influenceScore = this.calculateInfluenceScore(data.source, data.estimatedReach);

    const mention = await db.brandMention.create({
      data: {
        monitoringId,
        ...data,
        sentiment,
        sentimentScore,
        relevanceScore,
        influenceScore,
        requiresResponse: sentimentScore < -0.3,
        hasResponded: false,
        isCustomerFeedback: this.isCustomerFeedback(data.content),
        isCompetitorMention: this.isCompetitorMention(data.content),
        isMediaCoverage: this.isMediaCoverage(data.source),
        discoveredAt: new Date(),
      },
    });

    // Update monitoring statistics
    await this.updateMonitoringStats(monitoringId);

    // Send alerts if needed
    if (sentimentScore < -0.5) {
      await this.sendReputationAlert(monitoringId, mention.id);
    }

    return mention;
  }

  async respondToBrandMention(
    mentionId: string,
    responseText: string,
    respondedBy: string
  ): Promise<BrandMention> {
    return await db.brandMention.update({
      where: { id: mentionId },
      data: {
        hasResponded: true,
        responseText,
        responseDate: new Date(),
        respondedBy,
        requiresResponse: false,
      },
    });
  }

  // Analytics & Reporting
  async getReputationSummary(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<ReputationSummary> {
    const whereClause: any = {};
    if (dateFrom || dateTo) {
      whereClause.firstDetected = {};
      if (dateFrom) whereClause.firstDetected.gte = dateFrom;
      if (dateTo) whereClause.firstDetected.lte = dateTo;
    }

    const mentionWhereClause: any = {};
    if (dateFrom || dateTo) {
      mentionWhereClause.discoveredAt = {};
      if (dateFrom) mentionWhereClause.discoveredAt.gte = dateFrom;
      if (dateTo) mentionWhereClause.discoveredAt.lte = dateTo;
    }

    const [
      reviews,
      mentions,
      sentimentData,
      responseData,
    ] = await Promise.all([
      db.onlineReview.findMany({
        where: whereClause,
        select: { rating: true, sentimentScore: true, hasResponse: true },
      }),
      db.brandMention.findMany({
        where: mentionWhereClause,
        select: { sentiment: true, content: true },
      }),
      db.brandMention.aggregate({
        where: mentionWhereClause,
        _avg: { sentimentScore: true },
      }),
      db.onlineReview.count({
        where: { ...whereClause, hasResponse: true },
      }),
    ]);

    const totalReviews = reviews.length;
    const totalMentions = mentions.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, r) => sum + r.rating.toNumber(), 0) / totalReviews 
      : 0;

    const positiveMentions = mentions.filter(m => m.sentiment === 'Positive').length;
    const negativeMentions = mentions.filter(m => m.sentiment === 'Negative').length;
    const neutralMentions = mentions.filter(m => m.sentiment === 'Neutral').length;

    const overallSentiment = sentimentData._avg.sentimentScore?.toNumber() || 0;
    const responseRate = totalReviews > 0 ? (responseData / totalReviews) * 100 : 0;

    let brandHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (averageRating >= 4.5 && overallSentiment >= 0.3 && responseRate >= 80) {
      brandHealth = 'excellent';
    } else if (averageRating >= 4.0 && overallSentiment >= 0.1 && responseRate >= 60) {
      brandHealth = 'good';
    } else if (averageRating >= 3.5 && overallSentiment >= -0.1 && responseRate >= 40) {
      brandHealth = 'fair';
    }

    const trendingTopics = this.extractTrendingTopics(mentions.map(m => m.content));

    return {
      overallSentiment,
      totalMentions,
      positiveMentions,
      negativeMentions,
      neutralMentions,
      averageRating,
      totalReviews,
      responseRate,
      brandHealth,
      trendingTopics,
    };
  }

  async getCrisisResponse(crisisId: string): Promise<CrisisResponse> {
    const crisis = await db.crisisManagement.findUnique({
      where: { id: crisisId },
    });

    if (!crisis) {
      throw new Error('Crisis not found');
    }

    const responseTime = crisis.responseTime || 0;
    const affectedParties = (crisis.affectedParties as string[]) || [];
    const notifiedParties = (crisis.notifiedParties as string[]) || [];

    // Calculate metrics
    const communicationChannels = [];
    if (crisis.internalCommunication) communicationChannels.push('Internal');
    if (crisis.externalCommunication) communicationChannels.push('External');
    if (crisis.mediaResponse) communicationChannels.push('Media');
    if (crisis.socialMediaResponse) communicationChannels.push('Social Media');

    const socialMediaImpact = this.calculateSocialMediaImpact(crisis.title);
    const recoveryTimeEstimate = this.estimateRecoveryTime(crisis.severity);

    return {
      responseTime,
      communicationChannels,
      stakeholdersNotified: notifiedParties.length,
      mediaQueries: 0, // Would be tracked separately in production
      socialMediaImpact,
      reputationImpact: crisis.reputationImpact || 'Minimal',
      recoveryTimeEstimate,
    };
  }

  // Private Helper Methods
  private calculateCertificationImpact(certificationType: string): number {
    const impactMap: Record<string, number> = {
      'ISA_Arborist': 25,
      'OSHA_10': 15,
      'CPR_First_Aid': 10,
      'TCIA_Accreditation': 20,
      'Business_License': 10,
      'Insurance_Certificate': 15,
    };

    return impactMap[certificationType] || 5;
  }

  private calculateCertificationScore(certifications: SafetyCertificationTracking[]): number {
    if (certifications.length === 0) return 0;

    const totalImpact = certifications.reduce(
      (sum, cert) => sum + (cert.trustScoreImpact?.toNumber() || 5),
      0
    );

    return Math.min(100, totalImpact); // Cap at 100
  }

  private calculateReviewScore(reviews: any[]): number {
    if (reviews.length === 0) return 50; // Neutral score for no reviews

    const averageRating = reviews.reduce(
      (sum, review) => sum + review.rating.toNumber(),
      0
    ) / reviews.length;

    return (averageRating / 5) * 100; // Convert to 0-100 scale
  }

  private calculateExperienceScore(jobsCompleted: number, user: any): number {
    const yearsExperience = user.professionalProfile?.yearsExperience || 
                           user.companyProfile?.foundedYear ? 
                           new Date().getFullYear() - user.companyProfile.foundedYear : 0;

    const experienceScore = Math.min(50, yearsExperience * 5); // Max 50 points for experience
    const jobScore = Math.min(50, jobsCompleted * 2); // Max 50 points for jobs

    return experienceScore + jobScore;
  }

  private calculateVerificationScore(verificationStatus?: string): number {
    switch (verificationStatus) {
      case 'VERIFIED': return 100;
      case 'PENDING': return 50;
      case 'REJECTED': return 0;
      default: return 25;
    }
  }

  private calculateCommunicationScore(reviews: any[]): number {
    // Simplified - would analyze review content for communication mentions
    const communicationReviews = reviews.filter(r => 
      r.content?.toLowerCase().includes('communication') ||
      r.content?.toLowerCase().includes('responsive') ||
      r.content?.toLowerCase().includes('professional')
    );

    if (communicationReviews.length === 0) return 70; // Default score

    const avgRating = communicationReviews.reduce(
      (sum, review) => sum + review.rating.toNumber(),
      0
    ) / communicationReviews.length;

    return (avgRating / 5) * 100;
  }

  private generateTrustScoreRecommendations(
    overallScore: number,
    certificationScore: number,
    reviewScore: number,
    experienceScore: number,
    verificationScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (overallScore < 70) {
      recommendations.push('Focus on improving overall trust score to build customer confidence');
    }

    if (certificationScore < 50) {
      recommendations.push('Obtain additional safety certifications to enhance credibility');
    }

    if (reviewScore < 60) {
      recommendations.push('Encourage satisfied customers to leave reviews and respond to existing feedback');
    }

    if (experienceScore < 50) {
      recommendations.push('Complete more projects to build experience and expertise');
    }

    if (verificationScore < 80) {
      recommendations.push('Complete verification process to increase trust with potential customers');
    }

    return recommendations;
  }

  private analyzeSentiment(content: string): number {
    // Simplified sentiment analysis - would use actual NLP service in production
    const positiveWords = ['great', 'excellent', 'amazing', 'professional', 'quality', 'recommend'];
    const negativeWords = ['bad', 'terrible', 'awful', 'unprofessional', 'poor', 'disappointed'];

    const words = content.toLowerCase().split(/\s+/);
    let score = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.1;
      if (negativeWords.includes(word)) score -= 0.1;
    });

    return Math.max(-1, Math.min(1, score));
  }

  private getSentimentLabel(content: string): string {
    const score = this.analyzeSentiment(content);
    if (score > 0.2) return 'Positive';
    if (score < -0.2) return 'Negative';
    return 'Neutral';
  }

  private extractKeywords(content: string): string[] {
    // Simplified keyword extraction
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const stopWords = ['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been'];
    return words.filter(word => !stopWords.includes(word)).slice(0, 10);
  }

  private calculateReviewImpact(rating: number): number {
    return (rating - 3) * 5; // Reviews above 3 stars have positive impact
  }

  private calculateRelevanceScore(content: string): number {
    // Check for business-relevant keywords
    const relevantKeywords = ['tree', 'service', 'removal', 'pruning', 'arborist', 'professional'];
    const words = content.toLowerCase().split(/\s+/);
    
    const relevantCount = words.filter(word => 
      relevantKeywords.some(keyword => word.includes(keyword))
    ).length;

    return Math.min(1, relevantCount / 3); // Max relevance score of 1
  }

  private calculateInfluenceScore(source: string, estimatedReach?: number): number {
    const sourceInfluence: Record<string, number> = {
      'twitter': 0.8,
      'facebook': 0.7,
      'google': 0.9,
      'yelp': 0.8,
      'bbb': 0.9,
      'news': 0.9,
    };

    let baseScore = 0.5;
    for (const [platform, score] of Object.entries(sourceInfluence)) {
      if (source.toLowerCase().includes(platform)) {
        baseScore = score;
        break;
      }
    }

    if (estimatedReach) {
      const reachMultiplier = Math.min(2, Math.log10(estimatedReach) / 4);
      baseScore *= reachMultiplier;
    }

    return Math.min(1, baseScore);
  }

  private isCustomerFeedback(content: string): boolean {
    const customerIndicators = ['hired', 'service', 'job', 'work', 'experience', 'customer'];
    return customerIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );
  }

  private isCompetitorMention(content: string): boolean {
    const competitorIndicators = ['vs', 'compared to', 'better than', 'competitor'];
    return competitorIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );
  }

  private isMediaCoverage(source: string): boolean {
    const mediaIndicators = ['news', 'press', 'media', 'journalist', 'reporter'];
    return mediaIndicators.some(indicator => 
      source.toLowerCase().includes(indicator)
    );
  }

  private extractTrendingTopics(contents: string[]): string[] {
    const allWords = contents.join(' ')
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4);

    const wordCount: Record<string, number> = {};
    allWords.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private calculateSocialMediaImpact(title: string): number {
    // Simplified social media impact calculation
    return Math.floor(Math.random() * 1000) + 100;
  }

  private estimateRecoveryTime(severity: string): number {
    const recoveryTimes: Record<string, number> = {
      'Low': 7,
      'Medium': 30,
      'High': 90,
      'Critical': 180,
    };

    return recoveryTimes[severity] || 30;
  }

  private async setRenewalReminders(
    certificationId: string,
    expirationDate: Date
  ): Promise<void> {
    const reminders = {
      '90_days': new Date(expirationDate.getTime() - 90 * 24 * 60 * 60 * 1000),
      '30_days': new Date(expirationDate.getTime() - 30 * 24 * 60 * 60 * 1000),
      '7_days': new Date(expirationDate.getTime() - 7 * 24 * 60 * 60 * 1000),
    };

    await db.safetyCertificationTracking.update({
      where: { id: certificationId },
      data: { renewalReminders: reminders },
    });
  }

  private async flagReviewForAttention(reviewId: string, reason: string): Promise<void> {
    await db.onlineReview.update({
      where: { id: reviewId },
      data: {
        isFlagged: true,
        flagReason: reason,
      },
    });
  }

  private async setupCrisisMonitoring(crisisId: string, title: string): Promise<void> {
    const keywords = this.extractKeywords(title);
    
    await db.crisisManagement.update({
      where: { id: crisisId },
      data: {
        monitoringKeywords: keywords,
        alertsSetup: true,
      },
    });
  }

  private async updateMonitoringStats(monitoringId: string): Promise<void> {
    const mentions = await db.brandMention.findMany({
      where: { monitoringId },
      select: { sentiment: true },
    });

    const stats = mentions.reduce(
      (acc, mention) => {
        acc.total++;
        if (mention.sentiment === 'Positive') acc.positive++;
        else if (mention.sentiment === 'Negative') acc.negative++;
        else acc.neutral++;
        return acc;
      },
      { total: 0, positive: 0, negative: 0, neutral: 0 }
    );

    const averageSentiment = mentions.length > 0
      ? mentions.reduce((sum, m) => {
          if (m.sentiment === 'Positive') return sum + 0.5;
          if (m.sentiment === 'Negative') return sum - 0.5;
          return sum;
        }, 0) / mentions.length
      : 0;

    await db.reputationMonitoring.update({
      where: { id: monitoringId },
      data: {
        mentionCount: stats.total,
        positiveMentions: stats.positive,
        negativeMentions: stats.negative,
        neutralMentions: stats.neutral,
        averageSentiment,
        lastScanAt: new Date(),
      },
    });
  }

  private async sendReputationAlert(
    monitoringId: string,
    mentionId: string
  ): Promise<void> {
    // Placeholder for sending alerts - would integrate with notification service
    console.log(`Reputation alert: Negative mention detected - ${mentionId}`);
  }
}

export const brandTrustManagementService = new BrandTrustManagementService();

