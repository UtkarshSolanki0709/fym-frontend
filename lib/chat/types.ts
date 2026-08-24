export type ChatPayloadV1 =
  | { v: 1; t: 'text'; body: string }
  | { v: 1; t: 'image'; mediaId: string; mime: string; w?: number; h?: number }
  | { v: 1; t: 'system'; kind: 'screenshot_alert'; by: string; at: string };

export type WireMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  ciphertext: string;
  nonce: string;
  content_type: 'text' | 'image' | 'system';
  client_id: string | null;
  status?: string;
  created_at: string;
};

export type MatchRow = {
  room_id: string;
  peer: {
    id: string;
    display_name: string;
    age: number | null;
    photo_url: string | null;
    last_active_at: string | null;
  };
  last_message: {
    id: string;
    sender_id: string;
    ciphertext: string;
    nonce: string;
    content_type: string;
    created_at: string;
  } | null;
  unread: number;
  joined_at?: string;
};

export type DecryptedMessage = {
  id: string;
  sender_id: string;
  created_at: string;
  client_id: string | null;
  payload: ChatPayloadV1 | null;
  decryptError?: boolean;
  pending?: boolean;
};
