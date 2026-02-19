import {
  CareRecipient, Caregiver, Appointment, Medication,
  ActivityLogEntry, Provider, BloodPressureReading,
  DoctorInstruction, ActionItem, ChatMessage
} from "@/types";

// ─── Providers ───────────────────────────────────────────

export const drFuzaylov: Provider = {
  id: "1",
  name: "Dr. Fuzaylov",
  specialty: "Cardiology",
  type: "doctor",
  phone: "(718) 897-0327",
  fax: "(718) 897-0330",
  address: { street: "108-15 Queens Blvd", city: "Forest Hills", state: "NY", zip: "11375" },
  officeHours: "Mon–Fri 9am–5pm",
  notes: "Responsive to portal messages",
};

export const drPatel: Provider = {
  id: "2",
  name: "Dr. Patel",
  specialty: "Primary Care",
  type: "doctor",
  phone: "(718) 555-0456",
  fax: "(718) 555-0457",
  address: { street: "72-10 Austin St", city: "Forest Hills", state: "NY", zip: "11375" },
  officeHours: "Mon–Fri 8am–6pm",
  notes: "Best to call before 2pm",
};

export const drMehta: Provider = {
  id: "3",
  name: "Dr. Mehta",
  specialty: "Gastroenterology",
  type: "doctor",
  phone: "(718) 555-0789",
  fax: "(718) 555-0790",
  address: { street: "79-01 Broadway", city: "Elmhurst", state: "NY", zip: "11373" },
};

export const cvsQueensBlvd: Provider = {
  id: "4",
  name: "CVS — Queens Blvd",
  specialty: "Pharmacy",
  type: "pharmacy",
  phone: "(718) 555-1234",
  address: { street: "100-05 Queens Blvd", city: "Forest Hills", state: "NY", zip: "11375" },
};

export const providers: Provider[] = [drFuzaylov, drPatel, drMehta, cvsQueensBlvd];

// ─── Care Recipient ──────────────────────────────────────

export const careRecipient: CareRecipient = {
  id: "1",
  name: "Rosa Martinez",
  dateOfBirth: new Date("1952-04-15"),
  allergies: [
    { name: "Penicillin", severity: "moderate", reaction: "Rash" },
    { name: "Sulfa drugs", severity: "severe", reaction: "Anaphylaxis" },
  ],
  medicalConditions: ["Hypertension", "Type 2 Diabetes", "GERD", "History of heart disease"],
  primaryCareDoctor: "Dr. Patel",
  preferredHospital: "Elmhurst Hospital",
  preferredPharmacy: "CVS — Queens Blvd",
  standingInstructions: ["Elevate bed to 35 degrees per MD", "Reduce sodium intake"],
  insurance: {
    carrier: "Healthfirst",
    policyNumber: "HF29571834",
    medicare: "XXX-XX-4567",
  },
  emergencyContacts: [
    { name: "Manny", relationship: "Son", phone: "(917) 555-1111", priority: 1 },
    { name: "Maria", relationship: "Daughter", phone: "(917) 555-2222", priority: 2 },
    { name: "Jessica", relationship: "Daughter", phone: "(917) 555-3333", priority: 3 },
  ],
};

// ─── Caregivers ──────────────────────────────────────────

export const caregivers: Caregiver[] = [
  { id: "1", name: "Manny", phone: "(917) 555-1111", email: "manny@email.com", relationship: "Son", role: "admin" },
  { id: "2", name: "Maria", phone: "(917) 555-2222", email: "maria@email.com", relationship: "Daughter", role: "caregiver" },
  { id: "3", name: "Jessica", phone: "(917) 555-3333", email: "jessica@email.com", relationship: "Daughter", role: "caregiver" },
];

// ─── Medications ─────────────────────────────────────────

export const medications: Medication[] = [
  {
    id: "1",
    careRecipientId: "1",
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "1x daily, morning",
    instructions: "Take in the morning",
    purpose: "Blood Pressure",
    prescriptionQuantity: 30,
    prescriptionDate: new Date("2026-01-20"),
    provider: drFuzaylov,
    pharmacy: "CVS — Queens Blvd",
    refillDueDate: new Date("2026-02-28"),
    refillStatus: "due-soon",
    status: "active",
  },
  {
    id: "2",
    careRecipientId: "1",
    name: "Jardiance",
    dosage: "10mg",
    frequency: "1x daily, morning",
    instructions: "Take with food",
    purpose: "Diabetes",
    prescriptionQuantity: 30,
    prescriptionDate: new Date("2026-01-22"),
    provider: drPatel,
    pharmacy: "CVS — Queens Blvd",
    refillDueDate: new Date("2026-03-22"),
    refillStatus: "current",
    status: "active",
  },
  {
    id: "3",
    careRecipientId: "1",
    name: "Omeprazole",
    dosage: "20mg",
    frequency: "1x daily, evening",
    purpose: "GERD",
    prescriptionQuantity: 30,
    prescriptionDate: new Date("2026-01-15"),
    provider: drPatel,
    pharmacy: "CVS — Queens Blvd",
    refillDueDate: new Date("2026-03-15"),
    refillStatus: "current",
    status: "active",
  },
  {
    id: "4",
    careRecipientId: "1",
    name: "Amlodipine",
    dosage: "5mg",
    frequency: "1x daily, morning",
    purpose: "Blood Pressure",
    prescriptionQuantity: 30,
    prescriptionDate: new Date("2026-01-20"),
    provider: drFuzaylov,
    pharmacy: "CVS — Queens Blvd",
    refillDueDate: new Date("2026-03-20"),
    refillStatus: "current",
    status: "active",
  },
];

// ─── Appointments ────────────────────────────────────────

export const appointments: Appointment[] = [
  {
    id: "1",
    careRecipientId: "1",
    provider: drFuzaylov,
    dateTime: new Date("2026-03-20T14:00:00"),
    duration: 30,
    type: "specialist",
    location: "108-15 Queens Blvd, Floor 3",
    purpose: "3-month follow-up for blood pressure",
    preAppointmentNotes: "Bring BP log and recent blood work",
    questionsToAsk: ["Is current medication dosage working?", "Any concerns from blood work?"],
    assignedCaregiver: caregivers[0],
    coverageStatus: "assigned",
    status: "scheduled",
  },
  {
    id: "2",
    careRecipientId: "1",
    provider: drPatel,
    dateTime: new Date("2026-03-05T10:30:00"),
    duration: 45,
    type: "primary-care",
    location: "72-10 Austin St, Suite 200",
    purpose: "Annual checkup",
    coverageStatus: "needs-coverage",
    status: "scheduled",
  },
  {
    id: "3",
    careRecipientId: "1",
    provider: { id: "5", name: "Quest Diagnostics", specialty: "Laboratory", type: "clinic", phone: "(718) 555-0199", address: { street: "98-10 Queens Blvd", city: "Rego Park", state: "NY", zip: "11374" } },
    dateTime: new Date("2026-03-10T09:00:00"),
    duration: 15,
    type: "lab",
    location: "Quest — Queens Blvd",
    purpose: "Blood work — cholesterol panel + A1C",
    assignedCaregiver: caregivers[2],
    coverageStatus: "assigned",
    status: "scheduled",
  },
];

// ─── Blood Pressure Readings ────────────────────────────

const today = new Date();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d;
};

export const bpReadings: BloodPressureReading[] = [
  { id: "1", careRecipientId: "1", systolic: 132, diastolic: 85, pulse: 72, position: "sitting", loggedBy: "Maria", timestamp: daysAgo(0), notes: "After breakfast" },
  { id: "2", careRecipientId: "1", systolic: 128, diastolic: 82, pulse: 70, position: "sitting", loggedBy: "Manny", timestamp: daysAgo(1) },
  { id: "3", careRecipientId: "1", systolic: 135, diastolic: 88, pulse: 74, position: "sitting", loggedBy: "Mom", timestamp: daysAgo(2) },
  { id: "4", careRecipientId: "1", systolic: 140, diastolic: 90, pulse: 76, position: "lying", loggedBy: "Jessica", timestamp: daysAgo(3), notes: "Before bed" },
  { id: "5", careRecipientId: "1", systolic: 130, diastolic: 84, pulse: 71, position: "sitting", loggedBy: "Maria", timestamp: daysAgo(4) },
  { id: "6", careRecipientId: "1", systolic: 126, diastolic: 80, pulse: 69, position: "sitting", loggedBy: "Manny", timestamp: daysAgo(5) },
  { id: "7", careRecipientId: "1", systolic: 138, diastolic: 87, pulse: 73, position: "sitting", loggedBy: "Maria", timestamp: daysAgo(6) },
];

// ─── Doctor Instructions ────────────────────────────────

export const doctorInstructions: DoctorInstruction[] = [
  { id: "1", careRecipientId: "1", text: "Elevate bed to 35 degrees", doctorName: "Dr. Fuzaylov", dateGiven: new Date("2026-02-15"), status: "in-progress" },
  { id: "2", careRecipientId: "1", text: "Reduce sodium intake", doctorName: "Dr. Patel", dateGiven: new Date("2026-01-22"), status: "in-progress" },
  { id: "3", careRecipientId: "1", text: "Walk 20 minutes daily", doctorName: "Dr. Patel", dateGiven: new Date("2026-01-22"), status: "done" },
];

// ─── Action Items ────────────────────────────────────────

export const actionItems: ActionItem[] = [
  { id: "1", careRecipientId: "1", description: "Schedule blood work before March 20 appointment", assignedTo: "Jessica", dueDate: new Date("2026-03-10"), status: "open", linkedEntityType: "appointment", linkedEntityId: "1" },
  { id: "2", careRecipientId: "1", description: "Pick up Lisinopril refill from CVS", assignedTo: undefined, dueDate: new Date("2026-02-28"), status: "open", linkedEntityType: "medication", linkedEntityId: "1" },
];

// ─── Activity Log ────────────────────────────────────────

export const activityLog: ActivityLogEntry[] = [
  { id: "1", caregiverId: "2", caregiverName: "Maria", action: "bp-logged", description: "Logged Mom's BP: 132/85", timestamp: daysAgo(0) },
  { id: "2", caregiverId: "1", caregiverName: "Manny", action: "provider-added", description: "Added Dr. Mehta's contact info", timestamp: daysAgo(1) },
  { id: "3", caregiverId: "3", caregiverName: "Jessica", action: "appointment-confirmed", description: "Confirmed she'll attend March 5 appointment", timestamp: daysAgo(2) },
  { id: "4", caregiverId: "2", caregiverName: "Maria", action: "visit-summary-added", description: "Added summary from Dr. Fuzaylov visit", timestamp: daysAgo(3) },
  { id: "5", caregiverId: "1", caregiverName: "Manny", action: "instruction-added", description: "Added instruction: Elevate bed to 35°", timestamp: daysAgo(4) },
];

// ─── Sample Chat Messages ────────────────────────────────

export const chatMessages: ChatMessage[] = [
  { id: "1", senderId: "1", senderName: "Manny", senderType: "family", content: "Has Mom had an upper endoscopy?", timestamp: daysAgo(1), type: "text" },
  { id: "2", senderId: "circle", senderName: "Circle", senderType: "circle", content: "I don't have a record of an upper endoscopy in Mom's history. Let me check with the family — does anyone remember?", timestamp: daysAgo(1), type: "text" },
  { id: "3", senderId: "3", senderName: "Jessica", senderType: "family", content: "Yes! About 2 years ago with Dr. Mehta at Elmhurst", timestamp: daysAgo(1), type: "text" },
  { id: "4", senderId: "circle", senderName: "Circle", senderType: "circle", content: "Got it — logging: Upper endoscopy ~2 years ago, Dr. Mehta, Elmhurst Hospital. Added to Mom's medical history. 👍", timestamp: daysAgo(1), type: "text" },
  { id: "5", senderId: "2", senderName: "Maria", senderType: "family", content: "Mom's BP this morning was 132/85", timestamp: daysAgo(0), type: "text" },
  { id: "6", senderId: "circle", senderName: "Circle", senderType: "circle", content: "Logged! 132/85 — that's slightly above Dr. Fuzaylov's target of 140/90 but within a normal range. Her 7-day average is 133/85. Looking stable. 💚", timestamp: daysAgo(0), type: "text" },
];
