 // Core data types for Caregiver Coordinator
 
 export interface CareRecipient {
   id: string;
   name: string;
   dateOfBirth: Date;
   allergies: string[];
   medicalConditions: string[];
   primaryCareDoctor: string;
   preferredHospital: string;
   insurance: {
     medicare: string;
     supplemental?: {
       provider: string;
       memberId: string;
     };
   };
   emergencyContacts: EmergencyContact[];
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
   address: {
     street: string;
     city: string;
     state: string;
     zip: string;
   };
 }
 
 export interface ActivityLogEntry {
   id: string;
   caregiverId: string;
   caregiverName: string;
   action: string;
   description: string;
   timestamp: Date;
 }