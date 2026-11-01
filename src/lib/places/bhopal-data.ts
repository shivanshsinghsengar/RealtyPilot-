export interface BhopalLandmark {
  id: string;
  name: string;
  category: "school" | "hospital" | "transit" | "shopping" | "landmark";
  distanceKm: number;
  driveTimeMins: number;
  address: string;
  highlights: string;
}

export interface ProjectLocalityInfo {
  projectId: string;
  projectName: string;
  locationArea: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  connectivitySummary: string;
  landmarks: BhopalLandmark[];
}

/**
 * Curated, verified geographic data for Bhopal projects
 * Grounded in exact locations along Kolar Road & Hoshangabad Road
 */
export const BHOPAL_PROJECTS_LOCALITY: Record<string, ProjectLocalityInfo> = {
  "narmada-greens": {
    projectId: "p1000000-0000-0000-0000-000000000001",
    projectName: "Narmada Greens",
    locationArea: "Kolar Road, Bhopal",
    coordinates: {
      lat: 23.1652,
      lng: 77.4158,
    },
    connectivitySummary:
      "Located on 6-lane expanded Kolar Road with direct connectivity to Shahpura, Chunabhatti, and MP Nagar.",
    landmarks: [
      {
        id: "ng-h1",
        name: "JK Hospital & Medical College",
        category: "hospital",
        distanceKm: 2.5,
        driveTimeMins: 6,
        address: "Kolar Road, Bhopal",
        highlights: "500-bed multispecialty hospital with 24/7 emergency & trauma care.",
      },
      {
        id: "ng-h2",
        name: "Bansal Hospital",
        category: "hospital",
        distanceKm: 6.8,
        driveTimeMins: 14,
        address: "Shahpura, Bhopal",
        highlights: "NABH-accredited super-specialty hospital (cardiology, oncology, neurology).",
      },
      {
        id: "ng-s1",
        name: "Delhi Public School (DPS) Kolar",
        category: "school",
        distanceKm: 3.2,
        driveTimeMins: 8,
        address: "Kolar Road, Bhopal",
        highlights: "CBSE affiliated premier K-12 school with modern sports campus.",
      },
      {
        id: "ng-s2",
        name: "St. Joseph's Co-Ed School",
        category: "school",
        distanceKm: 5.5,
        driveTimeMins: 12,
        address: "Arera Colony / Kolar, Bhopal",
        highlights: "Top-ranked convent educational institution in Bhopal.",
      },
      {
        id: "ng-s3",
        name: "Sagar Public School (SPS)",
        category: "school",
        distanceKm: 4.1,
        driveTimeMins: 9,
        address: "Rohit Nagar / Kolar, Bhopal",
        highlights: "Well-established CBSE school with swimming pool and tech labs.",
      },
      {
        id: "ng-t1",
        name: "Rani Kamlapati Railway Station (Habibganj)",
        category: "transit",
        distanceKm: 8.5,
        driveTimeMins: 18,
        address: "Habibganj, Bhopal",
        highlights: "India's first world-class airport-like railway station with Vande Bharat connectivity.",
      },
      {
        id: "ng-t2",
        name: "Raja Bhoj International Airport (BHO)",
        category: "transit",
        distanceKm: 22.0,
        driveTimeMins: 42,
        address: "Gandhi Nagar, Bhopal",
        highlights: "Direct flights to Delhi, Mumbai, Bengaluru, Hyderabad, and Ahmedabad.",
      },
      {
        id: "ng-sh1",
        name: "D-Mart Kolar",
        category: "shopping",
        distanceKm: 2.8,
        driveTimeMins: 7,
        address: "Kolar Main Road, Bhopal",
        highlights: "Hypermarket for all daily grocery and household needs.",
      },
      {
        id: "ng-sh2",
        name: "C21 Mall / Century 21",
        category: "shopping",
        distanceKm: 8.0,
        driveTimeMins: 16,
        address: "Hoshangabad Road, Bhopal",
        highlights: "Multiplex cinema, food court, and branded retail apparel stores.",
      },
    ],
  },
  "bhojpal-enclave": {
    projectId: "p1000000-0000-0000-0000-000000000002",
    projectName: "Bhojpal Enclave",
    locationArea: "Hoshangabad Road (NH-46), Bhopal",
    coordinates: {
      lat: 23.1784,
      lng: 77.4621,
    },
    connectivitySummary:
      "Direct frontage along National Highway 46 (Hoshangabad Road) with dedicated BRTS corridor and fast access to AIIMS Bhopal.",
    landmarks: [
      {
        id: "be-h1",
        name: "AIIMS Bhopal (All India Institute of Medical Sciences)",
        category: "hospital",
        distanceKm: 4.2,
        driveTimeMins: 9,
        address: "Saket Nagar, Bhopal",
        highlights: "Apex healthcare institute of national importance with all medical specialties.",
      },
      {
        id: "be-h2",
        name: "Narmada Trauma Centre",
        category: "hospital",
        distanceKm: 3.5,
        driveTimeMins: 8,
        address: "Hoshangabad Road, Bhopal",
        highlights: "Specialized emergency trauma and orthopedics center.",
      },
      {
        id: "be-s1",
        name: "Ryan International School",
        category: "school",
        distanceKm: 2.8,
        driveTimeMins: 6,
        address: "Bawadiya Kalan, Bhopal",
        highlights: "ICSE/CBSE English medium school with expansive athletics ground.",
      },
      {
        id: "be-s2",
        name: "Carmel Convent Senior Secondary School",
        category: "school",
        distanceKm: 5.0,
        driveTimeMins: 11,
        address: "BHEL, Bhopal",
        highlights: "Renowned institution with 50+ years of academic excellence.",
      },
      {
        id: "be-t1",
        name: "Rani Kamlapati Railway Station (Habibganj)",
        category: "transit",
        distanceKm: 5.1,
        driveTimeMins: 11,
        address: "Habibganj, Bhopal",
        highlights: "Ultra-modern railway terminal with direct Vande Bharat & Rajdhani express trains.",
      },
      {
        id: "be-t2",
        name: "Misrod Railway Station & BRTS Hub",
        category: "transit",
        distanceKm: 1.8,
        driveTimeMins: 4,
        address: "Misrod, Hoshangabad Road, Bhopal",
        highlights: "Dedicated bus rapid transit connecting directly to Old Bhopal & BHEL.",
      },
      {
        id: "be-t3",
        name: "Raja Bhoj International Airport (BHO)",
        category: "transit",
        distanceKm: 20.5,
        driveTimeMins: 38,
        address: "Gandhi Nagar, Bhopal",
        highlights: "Fast transit via VIP Road / Ring Road bypass.",
      },
      {
        id: "be-sh1",
        name: "Aashima Anupama The Mall",
        category: "shopping",
        distanceKm: 2.2,
        driveTimeMins: 5,
        address: "Hoshangabad Road, Bhopal",
        highlights: "Cinepolis Multiplex, Reliance Smart, food court, and brand outlets.",
      },
      {
        id: "be-sh2",
        name: "DB City Mall",
        category: "shopping",
        distanceKm: 7.5,
        driveTimeMins: 15,
        address: "Arera Hills / MP Nagar, Bhopal",
        highlights: "Central India's largest shopping mall with 200+ global brands and fun zone.",
      },
    ],
  },
};
