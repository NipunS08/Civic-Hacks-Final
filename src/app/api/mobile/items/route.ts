import { getCity } from "@/lib/cities";
import { fetchCityItems } from "@/lib/city-data";
import {
  API_VERSION,
  COVERAGE_NOTE,
  isMobileItem,
} from "../../../../../packages/shared/mobile";
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
};
// Public, read-only endpoint; no account cookies or privileged operations.
export async function GET(request: Request) {
  const city = getCity(new URL(request.url).searchParams.get("city"));
  if (!city)
    return Response.json(
      { error: "Choose a supported city." },
      { status: 400, headers },
    );
  try {
    const items = (await fetchCityItems(city.id))
      .filter(isMobileItem)
      .map((i) => ({ ...i, address: null, lat: null, lng: null }));
    return Response.json(
      { version: API_VERSION, city: city.id, items, coverage: COVERAGE_NOTE },
      { headers },
    );
  } catch {
    return Response.json(
      {
        error:
          "The municipal source is unavailable. Please try again or use the official calendar.",
      },
      { status: 503, headers },
    );
  }
}
