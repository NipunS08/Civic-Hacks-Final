import { findItem } from "@/lib/city-data";
import {
  isMobileItem,
  API_VERSION,
} from "../../../../../../packages/shared/mobile";
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
};
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ itemNumber: string }> },
) {
  const { itemNumber } = await params;
  if (itemNumber.length > 180)
    return Response.json(
      { error: "Invalid item reference." },
      { status: 400, headers },
    );
  try {
    const item = await findItem(itemNumber);
    if (!item || !isMobileItem(item))
      return Response.json(
        { error: "This item is no longer in the current source feed." },
        { status: 404, headers },
      );
    return Response.json(
      {
        version: API_VERSION,
        items: [{ ...item, address: null, lat: null, lng: null }],
      },
      { headers },
    );
  } catch {
    return Response.json(
      { error: "The municipal source is unavailable." },
      { status: 503, headers },
    );
  }
}
