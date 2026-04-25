import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { DateTime } from 'luxon';

const NUMERIC_TZ = /^-?\d+(\.\d+)?$/;

export type ResolvedPob = {
  lat: number;
  lon: number;
  /** Hours east of UTC (e.g. 5.5 for India), for chartPayloadFromProfileFields */
  timezoneHours: number;
  /** IANA id when known, else null (numeric-only tz) */
  tzIana: string | null;
};

type OpenMeteoHit = {
  latitude: number;
  longitude: number;
  timezone?: string;
};

@Injectable()
export class PobResolveService {
  async resolve(input: {
    pobCity: string;
    pobLat?: number;
    pobLon?: number;
    pobTz?: string;
    dob: string;
    tob: string;
  }): Promise<ResolvedPob> {
    const { pobCity, dob, tob } = input;
    let lat = input.pobLat;
    let lon = input.pobLon;
    const hasLatLon =
      lat != null && lon != null && Number.isFinite(lat) && Number.isFinite(lon);

    let tzIanaFromGeo: string | null = null;
    if (!hasLatLon) {
      const geo = await this.geocodeCity(pobCity);
      lat = geo.latitude;
      lon = geo.longitude;
      tzIanaFromGeo = geo.timezone ?? null;
    }

    const rawTz = input.pobTz?.trim();
    if (rawTz && NUMERIC_TZ.test(rawTz)) {
      return {
        lat: lat!,
        lon: lon!,
        timezoneHours: parseFloat(rawTz),
        tzIana: null,
      };
    }
    if (rawTz && !NUMERIC_TZ.test(rawTz)) {
      const hours = this.offsetHoursAtLocalWallClock(rawTz, dob, tob);
      if (!Number.isFinite(hours)) {
        throw new BadRequestException('Invalid timezone identifier');
      }
      return { lat: lat!, lon: lon!, timezoneHours: hours, tzIana: rawTz };
    }

    const iana =
      tzIanaFromGeo ?? (hasLatLon ? (await this.reverseGeocode(lat!, lon!))?.timezone : null) ?? null;
    if (!iana) {
      throw new BadRequestException('Could not resolve timezone for place of birth');
    }
    const hours = this.offsetHoursAtLocalWallClock(iana, dob, tob);
    if (!Number.isFinite(hours)) {
      throw new BadRequestException('Could not resolve timezone for place of birth');
    }
    return { lat: lat!, lon: lon!, timezoneHours: hours, tzIana: iana };
  }

  private async geocodeCity(city: string): Promise<OpenMeteoHit> {
    const q = city.trim();
    if (!q) {
      throw new BadRequestException('pob_city is required');
    }
    try {
      const res = await axios.get<{ results?: OpenMeteoHit[] }>(
        'https://geocoding-api.open-meteo.com/v1/search',
        {
          params: { name: q, count: 1 },
          timeout: 12_000,
          headers: { 'User-Agent': 'AatmabodhaStartupVibe/1.0' },
        },
      );
      const hit = res.data?.results?.[0];
      if (!hit) {
        throw new BadRequestException('Place of birth could not be resolved (no geocoding results)');
      }
      return hit;
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Place of birth geocoding failed');
    }
  }

  private async reverseGeocode(lat: number, lon: number): Promise<OpenMeteoHit | null> {
    try {
      const res = await axios.get<{ results?: OpenMeteoHit[] }>(
        'https://geocoding-api.open-meteo.com/v1/search',
        {
          params: { latitude: lat, longitude: lon, count: 1 },
          timeout: 12_000,
          headers: { 'User-Agent': 'AatmabodhaStartupVibe/1.0' },
        },
      );
      return res.data?.results?.[0] ?? null;
    } catch {
      return null;
    }
  }

  /** Local wall clock (dob + tob) interpreted in `iana` → offset hours east of UTC. */
  offsetHoursAtLocalWallClock(iana: string, dob: string, tob: string): number {
    const [y, m, d] = dob.split('-').map(Number);
    const [hhRaw, mmRaw] = tob.split(':').map(Number);
    const dt = DateTime.fromObject(
      { year: y, month: m, day: d, hour: hhRaw, minute: mmRaw ?? 0 },
      { zone: iana },
    );
    if (!dt.isValid) {
      return Number.NaN;
    }
    return dt.offset / 60;
  }
}
