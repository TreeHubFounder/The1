// TreeHub Platform Types
import { UserRole, UserStatus, VerificationStatus, JobType, JobStatus, JobPriority, JobUrgency, EquipmentCategory, EquipmentCondition, ListingType, ListingStatus, TransactionType, TransactionStatus, PaymentMethod, AlertType, AlertPriority, AlertStatus, CertificationType, InsuranceType, ReviewType, MessageType } from '@prisma/client';

// User & Authentication Types
export interface TreeHubUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  verificationStatus: VerificationStatus;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  
  // Location
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  serviceRadius?: number;
  
  // Business Info
  businessLicense?: string;
  taxId?: string;
  yearsExperience?: number;
  teamSize?: number;
  
  // Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  emergencyAlerts: boolean;
  
  // Relations
  professionalProfile?: ProfessionalProfile;
  companyProfile?: CompanyProfile;
}

export interface ProfessionalProfile {
  id: string;
  userId: string;
  title?: string;
  specializations: string[];
  hourlyRate?: number;
  availability?: string;
  equipmentOwned: string[];
  isaCertified: boolean;
  isVerified: boolean;
  backgroundCheck: boolean;
  completedJobs: number;
  averageRating?: number;
  responseTime?: number;
  reliabilityScore?: number;
  portfolioImages: string[];
  portfolioVideos: string[];
}

export interface CompanyProfile {
  id: string;
  userId: string;
  legalName?: string;
  dbaName?: string;
  foundedYear?: number;
  employeeCount?: number;
  serviceAreas: string[];
  licenseNumber?: string;
  bondedAmount?: number;
  workerCompCoverage?: number;
  serviceTypes: string[];
  equipmentInventory: string[];
  crewSize?: number;
  averageJobSize?: number;
  completedProjects: number;
  averageRating?: number;
}

// Job Types
export interface Job {
  id: string;
  title: string;
  description: string;
  jobType: JobType;
  status: JobStatus;
  priority: JobPriority;
  urgency: JobUrgency;
  
  // Details
  estimatedHours?: number;
  budgetMin?: number;
  budgetMax?: number;
  budgetFlexible: boolean;
  
  // Location
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  accessNotes?: string;
  
  // Requirements
  requiredCertifications: string[];
  requiredEquipment: string[];
  requiredExperience?: number;
  physicalRequirements?: string;
  
  // Timeline
  preferredStartDate?: Date;
  deadline?: Date;
  estimatedDuration?: number;
  
  // Media
  images: string[];
  videos: string[];
  documents: string[];
  
  // Emergency
  isEmergency: boolean;
  weatherDependent: boolean;
  hazardLevel?: string;
  emergencyContactInfo?: string;
  
  // Relations
  posterId: string;
  assignedToId?: string;
  
  // Tracking
  viewCount: number;
  bidCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  postedAt?: Date;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Bid {
  id: string;
  amount: number;
  estimatedHours?: number;
  proposedStartDate?: Date;
  proposedEndDate?: Date;
  message?: string;
  includesCleanup: boolean;
  includesPermits: boolean;
  warrantyPeriod?: number;
  paymentTerms?: string;
  status: string;
  isCounterOffer: boolean;
  jobId: string;
  bidderId: string;
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
}

// Equipment Types
export interface Equipment {
  id: string;
  title: string;
  description: string;
  category: EquipmentCategory;
  condition: EquipmentCondition;
  listingType: ListingType;
  status: ListingStatus;
  
  // Details
  make?: string;
  model?: string;
  year?: number;
  serialNumber?: string;
  hoursUsed?: number;
  
  // Pricing
  salePrice?: number;
  rentalPriceDaily?: number;
  rentalPriceWeekly?: number;
  rentalPriceMonthly?: number;
  auctionStartPrice?: number;
  reservePrice?: number;
  
  // Specifications
  specifications?: any;
  weight?: number;
  dimensions?: string;
  powerSource?: string;
  
  // Location
  location: string;
  city: string;
  state: string;
  zipCode: string;
  deliveryAvailable: boolean;
  deliveryRadius?: number;
  deliveryCost?: number;
  
  // Media
  images: string[];
  videos: string[];
  manuals: string[];
  
  // Rental specific
  minRentalPeriod?: number;
  maxRentalPeriod?: number;
  securityDeposit?: number;
  rentalTerms?: string;
  
  // Auction specific
  auctionEndDate?: Date;
  highestBid?: number;
  bidIncrement?: number;
  
  // Relations
  ownerId: string;
  
  // Tracking
  viewCount: number;
  inquiryCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  soldAt?: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter & Search Types
export interface JobFilters {
  jobType?: JobType[];
  priority?: JobPriority[];
  urgency?: JobUrgency[];
  budgetMin?: number;
  budgetMax?: number;
  location?: string;
  radius?: number;
  requiredCertifications?: string[];
  isEmergency?: boolean;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export interface ProfessionalFilters {
  specializations?: string[];
  isVerified?: boolean;
  isaCertified?: boolean;
  location?: string;
  radius?: number;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  availabilityType?: string;
  minRating?: number;
  equipmentOwned?: string[];
}

export interface EquipmentFilters {
  category?: EquipmentCategory[];
  condition?: EquipmentCondition[];
  listingType?: ListingType[];
  priceMin?: number;
  priceMax?: number;
  location?: string;
  radius?: number;
  make?: string;
  yearMin?: number;
  yearMax?: number;
  deliveryAvailable?: boolean;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalEarnings: number;
  pendingPayments: number;
  averageRating: number;
  responseTime: number;
  profileViews: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'bid' | 'job_completed' | 'review' | 'payment' | 'message' | 'emergency_alert';
  title: string;
  description: string;
  createdAt: Date;
  metadata?: any;
}

// Form Types
export interface JobPostForm {
  title: string;
  description: string;
  jobType: JobType;
  priority: JobPriority;
  urgency: JobUrgency;
  estimatedHours?: number;
  budgetMin?: number;
  budgetMax?: number;
  budgetFlexible: boolean;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  accessNotes?: string;
  requiredCertifications: string[];
  requiredEquipment: string[];
  requiredExperience?: number;
  physicalRequirements?: string;
  preferredStartDate?: Date;
  deadline?: Date;
  estimatedDuration?: number;
  images: File[];
  videos: File[];
  documents: File[];
  isEmergency: boolean;
  weatherDependent: boolean;
  hazardLevel?: string;
  emergencyContactInfo?: string;
}

export interface BidForm {
  amount: number;
  estimatedHours?: number;
  proposedStartDate?: Date;
  proposedEndDate?: Date;
  message?: string;
  includesCleanup: boolean;
  includesPermits: boolean;
  warrantyPeriod?: number;
  paymentTerms?: string;
}