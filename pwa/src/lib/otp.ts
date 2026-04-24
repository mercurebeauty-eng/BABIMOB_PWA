/**
 * OTP (OpenTripPlanner) GraphQL Client for BABIMOB
 */

const OTP_URL = process.env.NEXT_PUBLIC_OTP_URL || 'http://localhost:8080/otp/routers/default/index/graphql';

export interface PlanParams {
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  date?: string;
  time?: string;
  arriveBy?: boolean;
}

export async function fetchItinerary(params: PlanParams) {
  const query = `
    query Plan($fromLat: Float!, $fromLon: Float!, $toLat: Float!, $toLon: Float!) {
      plan(
        from: { lat: $fromLat, lon: $fromLon }
        to: { lat: $toLat, lon: $toLon }
        numItineraries: 3
        transportModes: [{ mode: WALK }, { mode: BUS }, { mode: TRANSIT }]
      ) {
        itineraries {
          duration
          startTime
          endTime
          walkDistance
          legs {
            mode
            startTime
            endTime
            duration
            distance
            route {
              gtfsId
              shortName
              longName
              color
            }
            from {
              name
              stop {
                code
              }
            }
            to {
              name
            }
            legGeometry {
              points
            }
          }
        }
      }
    }
  `;

  const variables = {
    fromLat: params.from.lat,
    fromLon: params.from.lon,
    toLat: params.to.lat,
    toLon: params.to.lon,
  };

  try {
    const res = await fetch(OTP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) throw new Error(`OTP Error: ${res.statusText}`);
    const json = await res.json();
    const itineraries = json.data?.plan?.itineraries || [];

    // Decode polylines
    return itineraries.map((iti: any) => ({
      ...iti,
      legs: iti.legs.map((leg: any) => ({
        ...leg,
        coords: decodePolyline(leg.legGeometry.points),
      })),
    }));
  } catch (err) {
    console.error('Failed to fetch itinerary from OTP:', err);
    return [];
  }
}

/**
 * Decodes a Google Polyline into an array of [lat, lon]
 */
export function decodePolyline(str: string): [number, number][] {
  let index = 0,
    lat = 0,
    lng = 0,
    coordinates: [number, number][] = [],
    shift = 0,
    result = 0,
    byte = null,
    latitude_change,
    longitude_change;

  while (index < str.length) {
    byte = null;
    shift = 0;
    result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitude_change = result & 1 ? ~(result >> 1) : result >> 1;
    lat += latitude_change;

    shift = 0;
    result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude_change = result & 1 ? ~(result >> 1) : result >> 1;
    lng += longitude_change;

    coordinates.push([lat / 100000, lng / 100000]);
  }

  return coordinates;
}
