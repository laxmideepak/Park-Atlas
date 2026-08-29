import { ParkCode } from "../types";

export interface ParkMini {
  code: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  /** Set only for the 4 Phase 0.5 validation-cohort parks that have real Month Fit data. */
  cohort?: ParkCode;
}

/**
 * All 63 designated National Parks, minimal fields for map placement.
 * Coordinates are approximate (visitor-center / landmark centroid), fine for
 * a stylized wayfinding map — not a GIS product. Every park gets a real page;
 * the 4 cohort parks additionally carry full Month Fit scoring.
 */
export const ALL_PARKS_MINI: ParkMini[] = [
  { code: "acad", name: "Acadia", state: "ME", lat: 44.35, lng: -68.21, cohort: "acad" },
  { code: "npsa", name: "National Park of American Samoa", state: "AS", lat: -14.25, lng: -170.68 },
  { code: "arch", name: "Arches", state: "UT", lat: 38.73, lng: -109.59 },
  { code: "badl", name: "Badlands", state: "SD", lat: 43.75, lng: -102.5 },
  { code: "bibe", name: "Big Bend", state: "TX", lat: 29.25, lng: -103.25 },
  { code: "bisc", name: "Biscayne", state: "FL", lat: 25.65, lng: -80.2 },
  { code: "blca", name: "Black Canyon of the Gunnison", state: "CO", lat: 38.58, lng: -107.72 },
  { code: "brca", name: "Bryce Canyon", state: "UT", lat: 37.59, lng: -112.19 },
  { code: "cany", name: "Canyonlands", state: "UT", lat: 38.3, lng: -109.88 },
  { code: "care", name: "Capitol Reef", state: "UT", lat: 38.2, lng: -111.17 },
  { code: "cave", name: "Carlsbad Caverns", state: "NM", lat: 32.17, lng: -104.44 },
  { code: "chis", name: "Channel Islands", state: "CA", lat: 34.01, lng: -119.42 },
  { code: "cong", name: "Congaree", state: "SC", lat: 33.78, lng: -80.78 },
  { code: "crla", name: "Crater Lake", state: "OR", lat: 42.94, lng: -122.1 },
  { code: "cuva", name: "Cuyahoga Valley", state: "OH", lat: 41.24, lng: -81.55 },
  { code: "deva", name: "Death Valley", state: "CA / NV", lat: 36.505, lng: -117.079, cohort: "deva" },
  { code: "dena", name: "Denali", state: "AK", lat: 63.12, lng: -151.19 },
  { code: "drto", name: "Dry Tortugas", state: "FL", lat: 24.63, lng: -82.87 },
  { code: "ever", name: "Everglades", state: "FL", lat: 25.29, lng: -80.9 },
  { code: "gaar", name: "Gates of the Arctic", state: "AK", lat: 67.78, lng: -153.3 },
  { code: "jeff", name: "Gateway Arch", state: "MO", lat: 38.625, lng: -90.185 },
  { code: "glac", name: "Glacier", state: "MT", lat: 48.7, lng: -113.8 },
  { code: "glba", name: "Glacier Bay", state: "AK", lat: 58.66, lng: -136.9 },
  { code: "grca", name: "Grand Canyon", state: "AZ", lat: 36.06, lng: -112.14 },
  { code: "grte", name: "Grand Teton", state: "WY", lat: 43.79, lng: -110.68 },
  { code: "grba", name: "Great Basin", state: "NV", lat: 38.98, lng: -114.3 },
  { code: "grsa", name: "Great Sand Dunes", state: "CO", lat: 37.79, lng: -105.51 },
  { code: "grsm", name: "Great Smoky Mountains", state: "TN / NC", lat: 35.68, lng: -83.53, cohort: "grsm" },
  { code: "gumo", name: "Guadalupe Mountains", state: "TX", lat: 31.92, lng: -104.87 },
  { code: "hale", name: "Haleakalā", state: "HI", lat: 20.72, lng: -156.17 },
  { code: "havo", name: "Hawaiʻi Volcanoes", state: "HI", lat: 19.38, lng: -155.2 },
  { code: "hosp", name: "Hot Springs", state: "AR", lat: 34.51, lng: -93.05 },
  { code: "indu", name: "Indiana Dunes", state: "IN", lat: 41.65, lng: -87.05 },
  { code: "isro", name: "Isle Royale", state: "MI", lat: 48.1, lng: -88.55 },
  { code: "jotr", name: "Joshua Tree", state: "CA", lat: 33.87, lng: -115.9 },
  { code: "katm", name: "Katmai", state: "AK", lat: 58.5, lng: -155.0 },
  { code: "kefj", name: "Kenai Fjords", state: "AK", lat: 59.92, lng: -149.65 },
  { code: "kica", name: "Kings Canyon", state: "CA", lat: 36.8, lng: -118.55 },
  { code: "kova", name: "Kobuk Valley", state: "AK", lat: 67.4, lng: -159.3 },
  { code: "lacl", name: "Lake Clark", state: "AK", lat: 60.97, lng: -153.42 },
  { code: "lavo", name: "Lassen Volcanic", state: "CA", lat: 40.49, lng: -121.51 },
  { code: "maca", name: "Mammoth Cave", state: "KY", lat: 37.19, lng: -86.1 },
  { code: "meve", name: "Mesa Verde", state: "CO", lat: 37.18, lng: -108.49 },
  { code: "mora", name: "Mount Rainier", state: "WA", lat: 46.85, lng: -121.75 },
  { code: "neri", name: "New River Gorge", state: "WV", lat: 37.99, lng: -81.07 },
  { code: "noca", name: "North Cascades", state: "WA", lat: 48.7, lng: -121.2 },
  { code: "olym", name: "Olympic", state: "WA", lat: 47.8, lng: -123.6 },
  { code: "pefo", name: "Petrified Forest", state: "AZ", lat: 34.91, lng: -109.81 },
  { code: "pinn", name: "Pinnacles", state: "CA", lat: 36.49, lng: -121.16 },
  { code: "redw", name: "Redwood", state: "CA", lat: 41.21, lng: -124.0 },
  { code: "romo", name: "Rocky Mountain", state: "CO", lat: 40.34, lng: -105.68 },
  { code: "sagu", name: "Saguaro", state: "AZ", lat: 32.25, lng: -110.5 },
  { code: "seki", name: "Sequoia", state: "CA", lat: 36.43, lng: -118.68 },
  { code: "shen", name: "Shenandoah", state: "VA", lat: 38.53, lng: -78.35 },
  { code: "thro", name: "Theodore Roosevelt", state: "ND", lat: 46.97, lng: -103.45 },
  { code: "viis", name: "Virgin Islands", state: "VI", lat: 18.33, lng: -64.73 },
  { code: "voya", name: "Voyageurs", state: "MN", lat: 48.5, lng: -92.88 },
  { code: "whsa", name: "White Sands", state: "NM", lat: 32.78, lng: -106.17 },
  { code: "wica", name: "Wind Cave", state: "SD", lat: 43.57, lng: -103.48 },
  { code: "wrst", name: "Wrangell-St. Elias", state: "AK", lat: 61.0, lng: -142.0 },
  { code: "yell", name: "Yellowstone", state: "WY / MT / ID", lat: 44.6, lng: -110.5, cohort: "yell" },
  { code: "yose", name: "Yosemite", state: "CA", lat: 37.75, lng: -119.59 },
  { code: "zion", name: "Zion", state: "UT", lat: 37.3, lng: -113.05 },
];
