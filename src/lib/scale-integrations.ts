/**
 * Scale Integrations — credential storage for third-party services.
 * All credentials are stored in localStorage under "scale-integrations".
 */

export type IntegrationName = 'meta' | 'dataforseo' | 'firecrawl' | 'stripe' | 'apollo' | 'resend' | 'twilio' | 'openai';

export interface MetaCredentials {
  appId: string;
  appSecret: string;
  accessToken: string;
  adAccountId: string;
  connectedAt: string;
}

export interface DataForSEOCredentials {
  login: string;
  apiPassword: string;
  connectedAt: string;
}

export interface FirecrawlCredentials {
  apiKey: string;
  connectedAt: string;
}

export interface StripeCredentials {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  connectedAt: string;
}

export interface ApolloCredentials {
  apiKey: string;
  connectedAt: string;
}

export interface ResendCredentials {
  apiKey: string;
  senderName: string;
  senderEmail: string;
  replyTo: string;
  connectedAt: string;
}

export interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  userPhone: string;
  twimlAppSid: string;
  connectedAt: string;
}

export interface OpenAICredentials {
  apiKey: string;
  connectedAt: string;
}

export interface IntegrationsStore {
  meta?: MetaCredentials;
  dataforseo?: DataForSEOCredentials;
  firecrawl?: FirecrawlCredentials;
  stripe?: StripeCredentials;
  apollo?: ApolloCredentials;
  resend?: ResendCredentials;
  twilio?: TwilioCredentials;
  openai?: OpenAICredentials;
}

type CredentialsFor<T extends IntegrationName> =
  T extends 'meta' ? MetaCredentials :
  T extends 'dataforseo' ? DataForSEOCredentials :
  T extends 'firecrawl' ? FirecrawlCredentials :
  T extends 'stripe' ? StripeCredentials :
  T extends 'apollo' ? ApolloCredentials :
  T extends 'resend' ? ResendCredentials :
  T extends 'twilio' ? TwilioCredentials :
  T extends 'openai' ? OpenAICredentials :
  never;

const STORAGE_KEY = 'scale-integrations';

function load(): IntegrationsStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(store: IntegrationsStore) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getAllIntegrations(): IntegrationsStore {
  return load();
}

export function getIntegration<T extends IntegrationName>(name: T): CredentialsFor<T> | undefined {
  const store = load();
  return store[name] as CredentialsFor<T> | undefined;
}

export function isConnected(name: IntegrationName): boolean {
  const store = load();
  return store[name] !== undefined;
}

export function setIntegration<T extends IntegrationName>(name: T, data: Omit<CredentialsFor<T>, 'connectedAt'>): void {
  const store = load();
  (store as Record<string, unknown>)[name] = { ...data, connectedAt: new Date().toISOString() };
  save(store);
}

export function removeIntegration(name: IntegrationName): void {
  const store = load();
  delete store[name];
  save(store);
}

export function listConnected(): IntegrationName[] {
  const store = load();
  return (Object.keys(store) as IntegrationName[]).filter((k) => store[k] !== undefined);
}
