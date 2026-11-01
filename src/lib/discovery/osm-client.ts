import "server-only";

/**
 * OpenStreetMap Overpass API Client
 * Free alternative to Google Places — discovers businesses in Bhopal
 */

export interface OSMPlace {
  id: string;
  name: string;
  category: string;
  address?: string;
  city: string;
  phone?: string;
  website?: string;
  latitude: number;
  longitude: number;
  tags: Record<string, string>;
}

/**
 * Search businesses in Bhopal using OpenStreetMap Overpass API
 * Categories: builders, architects, real_estate_agents, construction
 */
export async function searchBhopalBusinesses(
  category: "builder" | "architect" | "real_estate" | "construction" | "all",
  limit: number = 50
): Promise<OSMPlace[]> {
  // Bhopal bounding box coordinates
  const bhopalBBox = {
    south: 23.1,
    west: 77.3,
    north: 23.4,
    east: 77.6,
  };

  // Overpass QL query — searches for businesses in Bhopal
  const queries: Record<string, string> = {
    builder: `
      [out:json][timeout:25];
      (
        node["shop"="trade"]["trade"~"builder|building_materials"](${bhopalBBox.south},${bhopalBBox.west},${bhopalBBox.north},${bhopalBBox.east});
        node["craft"="builder"](${bhopalBBox.south},${bhopalBBox.west},${bhopalBBox.north},${bhopalBBox.east});
        way["shop"="trade"]["trade"~"builder|building_materials"](${bhopalBBox.south},${bhopalBBox.west},${bhopalBBox.north},${bhopalBBox.east});
      );
      out center ${limit};
    `,
    architect: `
      [out:json][timeout:25];
      (
        node["office"="architect"](${bhopalBBox.south},${bhopalBBox.west},${bhopalBBox.north},${bhopalBBox.east});
        way["office"="architect"](${bhopalBBox.south},${bhopalBBox.west},${bhopalBBox.north},${bhopalBBox.east});
      );
      out center ${limit};
    `,
    real_estate: `
      [out:json][timeout:25];
      (
        node["office"="estate_agent"](${bhopalBBox.south},${bhopalBBox.west},${bhopalBBox.north},${bhopalBBox.east});
        node["shop"="estate_agent"](${bhopalBBox.south},${bhopalBBox.west},${bhopalBBox.north},${bhopalBBox.east});
        way["office"="estate_agent"](${bhopalBBox.south},${bhopalBBox.west},${bhopalBBox.north},${bhopalBBox.east});
      );
      out center ${limit};
    `,
    construction: `
      [out:json][timeout:25];
      (
        node["office"="construction_company"](${bhopalBBox.south},${bhopalBBox.west},${bhopalBBox.north},${bhopalBBox.east});
        node["industrial"="construction"](${bhopalBBox.south},${bhopalBBox.west},${bhopalBBox.north},${bhopalBBox.east});
        way["office"="construction_company"](${bhopalBBox.south},${bhopalBBox.west},${bhopalBBox.north},${bhopalBBox.east});
      );
      out center ${limit};
    `,
    all: "", // Will execute all queries
  };

  const targetQuery = category === "all" 
    ? Object.values(queries).filter(q => q).join("") 
    : queries[category];

  if (!targetQuery) {
    throw new Error(`Invalid category: ${category}`);
  }

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "RealtyPilot/1.0 (Bhopal Real Estate CRM)",
      },
      body: `data=${encodeURIComponent(targetQuery)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    const elements = data.elements || [];

    const places: OSMPlace[] = elements
      .filter((el: any) => el.tags?.name) // Only places with names
      .map((el: any) => {
        const lat = el.lat || el.center?.lat || 0;
        const lon = el.lon || el.center?.lon || 0;

        return {
          id: `osm-${el.type}-${el.id}`,
          name: el.tags.name,
          category: getCategoryFromTags(el.tags),
          address: buildAddress(el.tags),
          city: el.tags["addr:city"] || "Bhopal",
          phone: el.tags.phone || el.tags["contact:phone"] || undefined,
          website: el.tags.website || el.tags["contact:website"] || undefined,
          latitude: lat,
          longitude: lon,
          tags: el.tags,
        };
      })
      .filter((p: OSMPlace) => p.name && p.name.length > 2); // Valid names only

    return places.slice(0, limit);
  } catch (error) {
    console.error("OSM search error:", error);
    return [];
  }
}

function getCategoryFromTags(tags: Record<string, string>): string {
  if (tags.office === "architect") return "Architect";
  if (tags.office === "estate_agent" || tags.shop === "estate_agent") return "Real Estate Agent";
  if (tags.office === "construction_company") return "Construction Company";
  if (tags.craft === "builder" || tags.trade?.includes("builder")) return "Builder";
  return "Business";
}

function buildAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    tags["addr:street"],
    tags["addr:housenumber"],
    tags["addr:suburb"],
    tags["addr:city"],
    tags["addr:postcode"],
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : undefined;
}
