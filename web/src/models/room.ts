import type { DatabaseId, Decimal, Timestamp } from "./shared";

export interface Room {
  id: DatabaseId;
  dormitory_id: DatabaseId;
  room_number: string;
  floor: number | null;
  room_type: string | null;
  capacity: number;
  monthly_rent: Decimal;
  status: string;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/** Read model returned by queries that join a room with its dormitory. */
export interface RoomWithDormitory extends Room {
  dormitory_name: string;
}

export interface CreateRoomInput {
  dormitoryId: DatabaseId;
  roomNumber: string;
  floor?: number | null;
  roomType?: string | null;
  capacity: number;
  monthlyRent: number;
}
