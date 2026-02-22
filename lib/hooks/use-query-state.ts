'use client';

import * as React from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

type QueryValue = string | string[] | undefined;

interface UseQueryStateOptions<T> {
  parse?: (value: string | null) => T;
  serialize?: (value: T) => string | null;
  defaultValue?: T;
  shallow?: boolean;
}

export function useQueryState<T extends QueryValue = string>(
  key: string,
  options: UseQueryStateOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void] {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const {
    parse = (v: string | null) => (v ?? options.defaultValue) as T,
    serialize = (v: T) => (v === options.defaultValue ? null : String(v)),
    defaultValue,
    shallow = true,
  } = options;

  const currentValue = React.useMemo(() => {
    const param = searchParams.get(key);
    return parse(param);
  }, [searchParams, key, parse]);

  const setValue = React.useCallback(
    (value: T | ((prev: T) => T)) => {
      const newValue =
        typeof value === 'function'
          ? (value as (prev: T) => T)(currentValue)
          : value;
      const serialized = serialize(newValue);

      const params = new URLSearchParams(searchParams.toString());

      if (
        serialized === null ||
        serialized === undefined ||
        serialized === ''
      ) {
        params.delete(key);
      } else {
        params.set(key, serialized);
      }

      const search = params.toString();
      const url = search ? `${pathname}?${search}` : pathname;

      if (shallow) {
        window.history.replaceState(null, '', url);
      } else {
        router.push(url, { scroll: false });
      }
    },
    [key, serialize, searchParams, pathname, router, shallow, currentValue]
  );

  return [currentValue, setValue];
}

export function useQueryStates<T extends Record<string, QueryValue>>(
  keys: Record<keyof T, UseQueryStateOptions<T[keyof T]>>
): [T, (updates: Partial<T>) => void] {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const values = React.useMemo(() => {
    const result: Record<string, QueryValue> = {};
    for (const key of Object.keys(keys)) {
      const options = keys[key as keyof T];
      const param = searchParams.get(key);
      const parse =
        options.parse ||
        ((v: string | null) => (v ?? options.defaultValue) as T[keyof T]);
      result[key] = parse(param);
    }
    return result as T;
  }, [searchParams, keys]);

  const setValues = React.useCallback(
    (updates: Partial<T>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const key of Object.keys(updates)) {
        const options = keys[key as keyof T];
        const serialize =
          options.serialize ||
          ((v: T[keyof T]) => (v === options.defaultValue ? null : String(v)));
        const serialized = serialize(updates[key as keyof T] as T[keyof T]);

        if (
          serialized === null ||
          serialized === undefined ||
          serialized === ''
        ) {
          params.delete(key);
        } else {
          params.set(key, serialized);
        }
      }

      const search = params.toString();
      const url = search ? `${pathname}?${search}` : pathname;
      window.history.replaceState(null, '', url);
    },
    [keys, searchParams, pathname]
  );

  return [values, setValues];
}

export function parseArrayParam(
  value: string | null,
  separator = ','
): string[] {
  if (!value) return [];
  return value.split(separator).filter(Boolean);
}

export function serializeArrayParam(
  value: string[],
  separator = ','
): string | null {
  if (!value || value.length === 0) return null;
  return value.join(separator);
}

export function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
}

export function serializeDateParam(value: Date | undefined): string | null {
  if (!value) return null;
  return value.toISOString().split('T')[0];
}
