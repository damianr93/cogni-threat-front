export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskStatus = "IDENTIFIED" | "ANALYZED" | "TREATMENT_DEFINED" | "TREATED" | "ACCEPTED" | "CLOSED";
export type TreatmentOption = "MITIGATE" | "ACCEPT" | "TRANSFER" | "AVOID";
export type TreatmentStatus = "PLANNED" | "IN_PROGRESS" | "IMPLEMENTED" | "VERIFIED";
export type TreatmentActionStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type OperationalControlStatus = "DRAFT" | "ACTIVE" | "MONITORING" | "NEEDS_ATTENTION" | "RETIRED";
export type KpiMetricType = "NUMBER" | "PERCENTAGE" | "RATIO" | "INDEX";
export type KpiFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL";
export type KpiDirection = "HIGHER_IS_BETTER" | "LOWER_IS_BETTER";

export interface InformationAsset {
  id: string;
  code: string;
  name: string;
  type: string;
  criticality: RiskLevel;
  confidentiality: number;
  integrity: number;
  availability: number;
  ownerName?: string | null;
  ownerUserId?: string | null;
  /** @deprecated legacy field, no longer editable via the form; kept for reading historical API responses */
  businessContext?: string | null;
  description?: string | null;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Risk {
  id: string;
  assetId: string;
  asset?: InformationAsset;
  title: string;
  scenario: string;
  threat: string;
  vulnerability: string;
  threatSource?: string | null;
  affectedCia: string[];
  likelihood: number;
  impact: number;
  inherentScore: number;
  inherentLevel: RiskLevel;
  residualLikelihood?: number | null;
  residualImpact?: number | null;
  residualScore?: number | null;
  residualLevel?: RiskLevel | null;
  status: RiskStatus;
  ownerUserId?: string | null;
  ownerName?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RiskAlertMatchedAsset {
  id: string;
  code: string;
  name: string;
  criticality: RiskLevel;
  tags: string[];
  matchedTags: string[];
}

export interface RiskAlertMatch {
  id: string;
  incidentId: string;
  eventId?: string | null;
  sourceKey?: string | null;
  serviceSource: string;
  country?: string | null;
  victim?: string | null;
  group?: string | null;
  severity?: string | null;
  sentAt?: string | null;
  createdAt: string;
  sourceMessage: string;
  payload: Record<string, unknown>;
  matchedAssets: RiskAlertMatchedAsset[];
}

export interface TreatmentAction {
  id: string;
  treatmentId: string;
  title: string;
  description?: string | null;
  ownerName?: string | null;
  dueDate?: string | null;
  status: TreatmentActionStatus;
  evidenceUrl?: string | null;
  evidenceNotes?: string | null;
  controlId?: string | null;
  kpiId?: string | null;
  control?: OperationalControl | null;
  kpi?: Kpi | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RiskTreatment {
  id: string;
  riskId: string;
  risk?: Risk;
  strategy: TreatmentOption;
  plan: string;
  responsibleUserId?: string | null;
  responsibleName?: string | null;
  dueDate?: string | null;
  residualLikelihood?: number | null;
  residualImpact?: number | null;
  residualScore?: number | null;
  residualLevel?: RiskLevel | null;
  acceptedBy?: string | null;
  acceptedAt?: string | null;
  status: TreatmentStatus;
  actions: TreatmentAction[];
  createdAt: string;
  updatedAt: string;
}

export interface OperationalControl {
  id: string;
  title: string;
  category: string;
  type: string;
  objective: string;
  implementation?: string | null;
  monitoringFrequency?: string | null;
  ownerName?: string | null;
  parameters?: Record<string, unknown> | null;
  status: OperationalControlStatus;
  risks?: Risk[];
  treatments?: RiskTreatment[];
  createdAt: string;
  updatedAt: string;
}

export interface KpiMeasurement {
  id: string;
  kpiId: string;
  measuredAt: string;
  value: number;
  notes?: string | null;
  source: string;
  evidenceUrl?: string | null;
  createdAt: string;
}

export interface Kpi {
  id: string;
  name: string;
  description?: string | null;
  metricType: KpiMetricType;
  unit: string;
  frequency: KpiFrequency;
  targetValue: number;
  warningValue?: number | null;
  direction: KpiDirection;
  assetId?: string | null;
  riskId?: string | null;
  controlId?: string | null;
  asset?: InformationAsset | null;
  risk?: Risk | null;
  control?: OperationalControl | null;
  status: string;
  isActive: boolean;
  measurements: KpiMeasurement[];
  createdAt: string;
  updatedAt: string;
}

export interface RiskCriteriaLevel {
  id: string;
  dimension: "PROBABILITY" | "IMPACT";
  value: number;
  label: string;
}

export interface RiskCriteriaConfig {
  matrixSize: number;
  acceptanceThreshold: number;
  probability: RiskCriteriaLevel[];
  impact: RiskCriteriaLevel[];
}

export interface RiskMatrixCell {
  probability: number;
  impact: number;
  count: number;
  riskIds: string[];
}

export interface RiskMatrixData {
  matrixSize: number;
  acceptanceThreshold: number;
  cells: RiskMatrixCell[];
}

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW: "Bajo",
  MEDIUM: "Medio",
  HIGH: "Alto",
  CRITICAL: "Crítico",
};

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  IDENTIFIED: "Identificado",
  ANALYZED: "Analizado",
  TREATMENT_DEFINED: "Tratamiento definido",
  TREATED: "Tratado",
  ACCEPTED: "Aceptado",
  CLOSED: "Cerrado",
};

export const TREATMENT_OPTION_LABELS: Record<TreatmentOption, string> = {
  MITIGATE: "Mitigar",
  ACCEPT: "Aceptar",
  TRANSFER: "Transferir",
  AVOID: "Evitar",
};

export const TREATMENT_STATUS_LABELS: Record<TreatmentStatus, string> = {
  PLANNED: "Planificado",
  IN_PROGRESS: "En progreso",
  IMPLEMENTED: "Implementado",
  VERIFIED: "Verificado",
};
