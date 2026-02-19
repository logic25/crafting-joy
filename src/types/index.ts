// Core data types for CareCircle

export interface CareRecipient {
  id: string;
  name: string;
  dateOfBirth: Date;
  photoUrl?: string;
  allergies: Allergy[];
  medicalConditions: string[];
  primaryCareDoctor: string;
  preferredHospital: string;
  preferredPharmacy?: string;
  standingInstructions?: string[];
  insurance: {
    carrier: string;
    policyNumber: string;
    groupNumber?: string;
    medicare?: string;
    supplemental?: {
      provider: string;
      memberId: string;
    };
  };
  emergencyContacts: EmergencyContact[];
}

export interface Allergy {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  priority: number;
}

export interface Caregiver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  role: 'admin' | 'caregiver' | 'view-only';
  avatar?: string;
}

export interface Appointment {
  id: string;
  careRecipientId: string;
  provider: Provider;
  dateTime: Date;
  duration: number;
  type: 'primary-care' | 'specialist' | 'lab' | 'imaging' | 'procedure' | 'follow-up';
  location: string;
  purpose: string;
  preAppointmentNotes?: string;
  questionsToAsk?: string[];
  assignedCaregiver?: Caregiver;
  coverageStatus: 'assigned' | 'needs-coverage' | 'coverage-requested' | 'completed' | 'cancelled';
  visitSummary?: VisitSummary;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
}

export interface VisitSummary {
  doctorAssessment: string;
  nextSteps: string[];
  medicationChanges: string[];
  testResults?: string;
  nextAppointmentDate?: Date;
  anythingConcerning?: boolean;
  enteredBy: string;
  enteredAt: Date;
}

export interface Medication {
  id: string;
  careRecipientId: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  purpose: string;
  prescriptionQuantity: number;
  prescriptionDate: Date;
  provider: Provider;
  pharmacy: string;
  refillDueDate: Date;
  refillStatus: 'current' | 'due-soon' | 'overdue' | 'requested' | 'ready' | 'picked-up';
  lastRefillDate?: Date;
  status: 'active' | 'discontinued';
  discontinuedDate?: Date;
  discontinuedReason?: string;
}

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  type: 'doctor' | 'clinic' | 'hospital' | 'pharmacy';
  phone: string;
  fax?: string;
  email?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  officeHours?: string;
  portalUrl?: string;
  insuranceAccepted?: string[];
  notes?: string;
}

export interface BloodPressureReading {
  id: string;
  careRecipientId: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  position: 'sitting' | 'lying';
  loggedBy: string;
  timestamp: Date;
  notes?: string;
}

export interface DoctorInstruction {
  id: string;
  careRecipientId: string;
  text: string;
  doctorName: string;
  dateGiven: Date;
  status: 'done' | 'in-progress' | 'need-help';
}

export interface ActionItem {
  id: string;
  careRecipientId: string;
  description: string;
  assignedTo?: string;
  dueDate?: Date;
  status: 'open' | 'in-progress' | 'done';
  linkedEntityType?: 'appointment' | 'medication' | 'instruction';
  linkedEntityId?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'family' | 'circle';
  content: string;
  timestamp: Date;
  type: 'text' | 'card' | 'system';
  metadata?: Record<string, unknown>;
}

export interface Document {
  id: string;
  careRecipientId: string;
  name: string;
  category: 'lab-results' | 'imaging' | 'discharge' | 'insurance' | 'prescriptions' | 'referral' | 'legal' | 'other';
  uploadedBy: string;
  uploadDate: Date;
  relatedProviderId?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  tags?: string[];
}

export interface ActivityLogEntry {
  id: string;
  caregiverId: string;
  caregiverName: string;
  action: string;
  description: string;
  timestamp: Date;
}
