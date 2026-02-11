import { api } from '@/lib/api';

export interface Protocol {
  id: string;
  protocol_number: string;
  user_id: string;
  standard_id: string;
  check_id: string;
  issue_date: string;
  valid_until: string | null;
  metadata: any;
  data_hash: string;
  signed_by_user_id: string;
  signature_timestamp: string;
  organisation_id: string;
  // Expanded relations
  training_standards?: {
    code: string;
    name: string;
    description?: string;
  };
  users?: {
    full_name: string;
    emb_number?: string;
  };
  organisations?: {
    name: string;
    logo_url?: string;
  };
}

export interface VerificationResult {
  valid: boolean;
  expired?: boolean;
  reason?: string;
  holder?: string;
  validUntil?: string;
}

export const ProtocolService = {
  /**
   * Get a single protocol by ID
   */
  async getProtocolById(id: string): Promise<Protocol> {
    const response = await api.get(`/protocols/${id}`);
    return response.data;
  },

  /**
   * Get all protocols for a user
   */
  async getUserProtocols(userId: string): Promise<Protocol[]> {
    const response = await api.get(`/protocols/user/${userId}`);
    return response.data;
  },

  /**
   * Verify a protocol (Public/shared)
   */
  async verifyProtocol(protocolNumber: string, hash: string): Promise<VerificationResult> {
    const response = await api.post('/protocols/verify', {
      protocol_number: protocolNumber,
      hash,
    });
    return response.data;
  },
};
