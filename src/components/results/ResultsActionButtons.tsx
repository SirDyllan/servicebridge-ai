import { ExternalLink, MapPin } from "lucide-react";
import { isValidExternalUrl } from "@/lib/urlSafety";
import type { BenefitMatch } from "@/types/benefits";

export function ResultsActionButtons({ match, userLocation = "" }: { match: BenefitMatch; userLocation?: string }) {
  const officialUrl = getOfficialProgramUrl(match);
  const mapUrl = getMapSearchUrl(match, userLocation);

  if (!officialUrl && !mapUrl) {
    return (
      <p className="rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-950">
        Source or map link needs review before external actions can be shown.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {officialUrl ? (
        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sb-button-motion inline-flex items-center justify-center gap-2 rounded-xl bg-[#B8793A] px-5 py-3 text-sm font-black text-white shadow-[0_12px_26px_rgba(184,121,58,0.22)] transition hover:bg-[#9f642f]"
        >
          Open official program
          <ExternalLink className="size-4" />
        </a>
      ) : null}

      {mapUrl ? (
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sb-button-motion inline-flex items-center justify-center gap-2 rounded-xl border border-[#B8793A]/25 bg-white px-5 py-3 text-sm font-black text-[#244B35] transition hover:bg-[#F6F1E7]"
        >
          Open Google Maps search
          <MapPin className="size-4" />
        </a>
      ) : null}
    </div>
  );
}

export function getOfficialProgramUrl(match: BenefitMatch) {
  const url = match.officialProgramUrl || match.sourceUrl;
  return isValidExternalUrl(url) ? url : "";
}

export function getMapSearchUrl(match: BenefitMatch, userLocation = "") {
  if (isValidExternalUrl(match.officeSearchUrl)) return match.officeSearchUrl ?? "";

  const query = buildSafeMapQuery(match, userLocation);
  if (query) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  if (typeof match.coordinates?.lat === "number" && typeof match.coordinates?.lng === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${match.coordinates.lat},${match.coordinates.lng}`,
    )}`;
  }

  return "";
}

function buildSafeMapQuery(match: BenefitMatch, userLocation = "") {
  const officeType = match.location?.trim();
  if (!officeType) return "";

  const cleanLocation = userLocation.trim();
  const locationPart = cleanLocation ? ` near ${cleanLocation}` : "";
  return `${officeType}${locationPart} ${match.category}`.replace(/\s+/g, " ").trim();
}
