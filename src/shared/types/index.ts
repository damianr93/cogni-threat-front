// Tipos compartidos para toda la aplicación

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  permission: 'READ' | 'WRITE';
}

export interface NewsArticle {
  id: string;
  title: string;
  link: string;
  snippet?: string;
  source: string;
  publishedDate: string;
  origin: 'serper' | 'rss';
  matchedKeywords?: string[];
  alertKeywords?: string[];
  isAlert?: boolean;
}

export interface Alert extends NewsArticle {
  isAlert: true;
  alertKeywords: string[];
}

export interface Keyword extends BaseEntity {
  word: string;
  priority: 'low' | 'medium' | 'high';
  alert: boolean;
  userId: number;
}

export interface RssSource extends BaseEntity {
  url: string;
  name?: string;
  userId: number;
}

export interface GlobalRssSource extends BaseEntity {
  url: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: number;
}

export interface UserRssPreference extends BaseEntity {
  userId: number;
  globalRssSourceId: number;
  isActive: boolean;
}

export interface Feed extends BaseEntity {
  userId: number;
  name: string;
  description?: string;
  isDefault: boolean;
}

export interface FeedKeyword extends BaseEntity {
  feedId: number;
  word: string;
  priority: 'low' | 'medium' | 'high';
  alert: boolean;
}

export interface FeedSource extends BaseEntity {
  feedId: number;
  url: string;
  name?: string;
}

export interface FeedData {
  feed: Feed;
  keywords: FeedKeyword[];
  sources: FeedSource[];
  news: NewsArticle[];
  alerts: Alert[];
  aiAnalysis?: any;
}

export interface SearchParams {
  query: string;
  country?: string;
  dateRange?: string;
  resultLimit?: number;
}

export interface FilterParams {
  country: string;
  dateRange: string;
  resultLimit: number;
}

export interface CartItem extends NewsArticle {
  addedAt: string;
}

export interface AiAnalysis {
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface ScrapeResult {
  totals: {
    total: number;
    withSnippet: number;
    withoutSnippet: number;
  };
  articles: NewsArticle[];
}

export interface NewsState {
  news: NewsArticle[];
  alerts: Alert[];
  keywords: Keyword[];
  sources: RssSource[];
  searchResults: {
    news: NewsArticle[];
    alerts: Alert[];
    aiAnalysis?: AiAnalysis;
    sourcesUsed: string[];
  } | null;
  aiAnalysis: AiAnalysis | null;
  scrapeResult: ScrapeResult | null;
  scrapeError: string | null;
  scrapingSelection: boolean;
  lastUpdated: string | null;
  loading: boolean;
  error: string | null;
}

export interface FeedsState {
  feeds: Feed[];
  selectedFeed: Feed | null;
  feedData: FeedData | null;
  loading: boolean;
  error: string | null;
  showFeedManager: boolean;
  sidebarOpen: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

export interface DisclaimerState {
  hasAccepted: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

export interface GlobalRssState {
  sources: GlobalRssSource[];
  userPreferences: UserRssPreference[];
  loading: boolean;
  error: string | null;
}

export interface AdminRssState {
  sources: GlobalRssSource[];
  loading: boolean;
  error: string | null;
}

export interface RagState {
  conversations: any[];
  currentConversation: any | null;
  messages: any[];
  loading: boolean;
  error: string | null;
}

export interface SerperFiltersState {
  country: string;
  dateRange: string;
  resultLimit: number;
}

export interface RootState {
  news: NewsState;
  feeds: FeedsState;
  auth: AuthState;
  cart: CartState;
  disclaimer: DisclaimerState;
  globalRss: GlobalRssState;
  adminRss: AdminRssState;
  rag: RagState;
  serperParams: SerperFiltersState;
}

export interface NotificationChannel {
  id: string;
  userId: string;
  type: string;
  label?: string;
  botToken?: string;
  chatId?: string; // Mantener para retrocompatibilidad
  chatIds?: string[]; // Nuevo campo para múltiples IDs
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertSourceSchemaField {
  name: string;
  label: string;
  type: 'chips' | 'multi-select' | 'number' | 'select';
  required?: boolean;
  helperText?: string;
  min?: number;
  max?: number;
  options?: { label: string; value: string }[];
  optionsSource?: 'telegramChannels' | 'vulnProfiles';
}

export type VulnEnvironment = 'APP' | 'IT' | 'OT' | 'OTHER';

export interface VulnWatchProfileItem {
  id: string;
  profileId: string;
  label: string;
  query: string;
  vendor?: string | null;
  product?: string | null;
  ecosystem?: string | null;
}

export interface VulnWatchProfile {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  environment: VulnEnvironment;
  items: VulnWatchProfileItem[];
  createdAt: string;
  updatedAt: string;
}

export interface VulnAlertPreviewSample {
  cveId: string | null;
  severity: string | null;
  matchedProfiles: string[];
  matchedOn: string[];
}

export interface VulnAlertPreviewResult {
  totalMatches: number;
  days: number;
  samples: VulnAlertPreviewSample[];
}

export interface VulnMonitorSettings {
  profileIds: string[];
  severities: string[];
  cvssMin?: number | null;
  epssMin?: number | null;
  isKevOnly?: boolean;
  sources?: string[];
  keywords?: string[];
}

export interface AlertSourceSchema {
  key: string;
  title: string;
  description: string;
  defaults: Record<string, any>;
  fields: AlertSourceSchemaField[];
}

export interface AlertSourceEntity {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  serviceName?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  schema?: AlertSourceSchema | null;
}

export interface AlertSubscriptionEntity {
  id: string;
  userId: string;
  sourceId: string;
  name: string;
  enabled: boolean;
  deliveryChannelId: string;
  settings: Record<string, any>;
  lastTriggered?: string | null;
  createdAt: string;
  updatedAt: string;
  source: AlertSourceEntity;
  deliveryChannel: NotificationChannel;
}
