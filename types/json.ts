export type JsonPrimitive = string | number | boolean | null;

export type Json = JsonPrimitive | JsonObject | JsonArray;

export interface JsonObject {
  [key: string]: Json;
}

export type JsonArray = Json[];
