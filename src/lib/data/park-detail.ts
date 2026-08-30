import { ParkCode } from "../types";

export interface Hike {
  name: string;
  distanceMi: number;
  difficulty: "Easy" | "Moderate" | "Strenuous";
  durationHr: string;
  bestMonths: string;
  reservation: boolean;
  npsRecommended: boolean;
  waterFeature: boolean;
  officiallyListed: boolean;
}

export interface Spot {
  name: string;
  category: "Viewpoint" | "Waterfall" | "Lake" | "Scenic Drive" | "Historic" | "Wildlife" | "Beach" | "Geological" | "Cave";
}

export interface WaterFeature {
  name: string;
  type: string;
  note: string;
}

export type DiningLabel = "Excellent" | "Good" | "Limited" | "Very Limited" | "None";

export interface DiningInfo {
  label: DiningLabel;
  restaurants: number;
  quickService: number;
  generalStores: number;
  bringFood: boolean;
  operations: { name: string; type: string; location: string; seasonal: boolean }[];
}

export interface Alert {
  type: string;
  description: string;
  lastUpdated: string;
}

export interface ParkDetail {
  hikes: Hike[];
  spots: Spot[];
  water: WaterFeature[];
  dining: DiningInfo;
  alerts: Alert[];
  /** Editorial margin notes, keyed by ThemedSection id ("hiking", "water"…).
   * Rendered in the right gutter on wide viewports, inline below the eyebrow
   * otherwise. Cohort parks only; 2–3 short notes, grounded in park data. */
  marginNotes?: { section: string; note: string }[];
}

export const PARK_DETAIL: Record<ParkCode, ParkDetail> = {
  acad: {
    hikes: [
      { name: "Precipice Trail", distanceMi: 2.1, difficulty: "Strenuous", durationHr: "2-3", bestMonths: "Jun-Oct (closed spring for peregrine nesting)", reservation: false, npsRecommended: true, waterFeature: false, officiallyListed: true },
      { name: "Beehive Loop", distanceMi: 1.5, difficulty: "Strenuous", durationHr: "1.5-2", bestMonths: "May-Oct", reservation: false, npsRecommended: true, waterFeature: false, officiallyListed: true },
      { name: "Jordan Pond Path", distanceMi: 3.3, difficulty: "Easy", durationHr: "2", bestMonths: "May-Oct", reservation: false, npsRecommended: true, waterFeature: true, officiallyListed: true },
    ],
    spots: [
      { name: "Cadillac Mountain Summit", category: "Viewpoint" },
      { name: "Thunder Hole", category: "Geological" },
      { name: "Park Loop Road", category: "Scenic Drive" },
      { name: "Bass Harbor Head Light", category: "Historic" },
    ],
    water: [
      { name: "Jordan Pond", type: "Lake", note: "Crystal-clear glacial pond, popular canoe launch." },
      { name: "Eagle Lake", type: "Lake", note: "Largest lake fully inside the park boundary." },
      { name: "Somes Sound", type: "Fjard", note: "Only fjard-like feature on the U.S. East Coast." },
    ],
    dining: {
      label: "Good",
      restaurants: 3,
      quickService: 4,
      generalStores: 2,
      bringFood: false,
      operations: [
        { name: "Jordan Pond House", type: "Restaurant", location: "Inside park", seasonal: true },
        { name: "Cadillac Mountain Snack Bar", type: "Quick service", location: "Inside park", seasonal: true },
      ],
    },
    alerts: [
      { type: "Road", description: "Park Loop Road one-way section open; Ocean Path parking fills by 9am in summer.", lastUpdated: "2026-08-27T14:00:00Z" },
      { type: "Reservation", description: "Cadillac Summit Road vehicle reservation required through Oct.", lastUpdated: "2026-08-27T14:00:00Z" },
    ],
    marginNotes: [
      { section: "when-to-go", note: "Cadillac Summit Road requires a vehicle reservation through October." },
      { section: "hiking", note: "Precipice closes for peregrine nesting most springs." },
      { section: "dining", note: "Jordan Pond House is seasonal — the teahouse lawn has been serving since the 1890s." },
    ],
  },
  yell: {
    hikes: [
      { name: "Fairy Falls", distanceMi: 5.0, difficulty: "Moderate", durationHr: "2.5-3", bestMonths: "Jun-Sep", reservation: false, npsRecommended: true, waterFeature: true, officiallyListed: true },
      { name: "Mount Washburn", distanceMi: 6.2, difficulty: "Strenuous", durationHr: "3-4", bestMonths: "Jul-Sep", reservation: false, npsRecommended: true, waterFeature: false, officiallyListed: true },
      { name: "Upper Geyser Basin Boardwalk", distanceMi: 2.7, difficulty: "Easy", durationHr: "1.5-2", bestMonths: "Year-round (weather permitting)", reservation: false, npsRecommended: true, waterFeature: false, officiallyListed: true },
    ],
    spots: [
      { name: "Old Faithful", category: "Geological" },
      { name: "Grand Prismatic Spring", category: "Geological" },
      { name: "Lamar Valley", category: "Wildlife" },
      { name: "Grand Canyon of the Yellowstone", category: "Viewpoint" },
    ],
    water: [
      { name: "Yellowstone Lake", type: "Lake", note: "Largest high-elevation lake in North America." },
      { name: "Yellowstone River", type: "River", note: "Feeds the park's two major waterfalls." },
      { name: "Shoshone Lake", type: "Lake", note: "Largest backcountry (no-road-access) lake in the lower 48." },
    ],
    dining: {
      label: "Excellent",
      restaurants: 8,
      quickService: 10,
      generalStores: 6,
      bringFood: false,
      operations: [
        { name: "Old Faithful Inn Dining Room", type: "Restaurant", location: "Inside park", seasonal: true },
        { name: "Lake Yellowstone Hotel Dining Room", type: "Restaurant", location: "Inside park", seasonal: true },
      ],
    },
    alerts: [
      { type: "Road", description: "All interior roads open; Dunraven Pass construction causing delays.", lastUpdated: "2026-08-27T16:00:00Z" },
      { type: "Wildlife", description: "Bear activity reported near Fishing Bridge; food storage orders in effect.", lastUpdated: "2026-08-26T09:00:00Z" },
    ],
    marginNotes: [
      { section: "hiking", note: "Dunraven Pass roadwork slows the drive to the Washburn trailhead." },
      { section: "must-see", note: "Lamar Valley runs on dawn light — wolf watchers arrive before sunrise." },
      { section: "water", note: "Shoshone Lake is the largest lake in the lower 48 you can't drive to." },
    ],
  },
  "deva": {
    hikes: [
      { name: "Golden Canyon to Zabriskie Point", distanceMi: 3.0, difficulty: "Moderate", durationHr: "2", bestMonths: "Nov-Mar", reservation: false, npsRecommended: true, waterFeature: false, officiallyListed: true },
      { name: "Mosaic Canyon", distanceMi: 4.0, difficulty: "Moderate", durationHr: "2-3", bestMonths: "Nov-Mar", reservation: false, npsRecommended: true, waterFeature: false, officiallyListed: true },
      { name: "Badwater Basin Salt Flats", distanceMi: 1.8, difficulty: "Easy", durationHr: "1", bestMonths: "Nov-Mar (sunrise recommended year-round)", reservation: false, npsRecommended: true, waterFeature: false, officiallyListed: true },
    ],
    spots: [
      { name: "Badwater Basin", category: "Geological" },
      { name: "Zabriskie Point", category: "Viewpoint" },
      { name: "Artists Drive", category: "Scenic Drive" },
      { name: "Mesquite Flat Sand Dunes", category: "Geological" },
    ],
    water: [
      { name: "Salt Creek", type: "Stream", note: "Home to the endemic Salt Creek pupfish." },
      { name: "Lake Manly (ephemeral)", type: "Ephemeral lake", note: "Briefly reappears on the Badwater Basin floor after major rain." },
    ],
    dining: {
      label: "Limited",
      restaurants: 2,
      quickService: 1,
      generalStores: 2,
      bringFood: true,
      operations: [
        { name: "The Ranch at Death Valley", type: "Restaurant", location: "Inside park", seasonal: false },
      ],
    },
    alerts: [
      { type: "Heat", description: "Extreme heat advisory in effect for the valley floor; hike before 10am.", lastUpdated: "2026-08-27T12:00:00Z" },
      { type: "Road", description: "All paved roads open; some unpaved backcountry roads require 4WD after recent rain.", lastUpdated: "2026-08-25T10:00:00Z" },
    ],
    marginNotes: [
      { section: "when-to-go", note: "The hiking calendar here is inverted: November through March, not summer." },
      { section: "hiking", note: "Heat protocol: valley-floor hikes end by 10 a.m. in summer." },
      { section: "water", note: "Lake Manly returns to the basin floor only after major rain — days, not seasons." },
    ],
  },
  "grsm": {
    hikes: [
      { name: "Alum Cave to Mount LeConte", distanceMi: 11.0, difficulty: "Strenuous", durationHr: "6-8", bestMonths: "Apr-Oct", reservation: false, npsRecommended: true, waterFeature: false, officiallyListed: true },
      { name: "Charlies Bunion", distanceMi: 8.1, difficulty: "Strenuous", durationHr: "5-6", bestMonths: "May-Oct", reservation: false, npsRecommended: true, waterFeature: false, officiallyListed: true },
      { name: "Laurel Falls", distanceMi: 2.6, difficulty: "Easy", durationHr: "1.5-2", bestMonths: "Year-round", reservation: false, npsRecommended: true, waterFeature: true, officiallyListed: true },
    ],
    spots: [
      { name: "Clingmans Dome Tower", category: "Viewpoint" },
      { name: "Cades Cove Loop", category: "Scenic Drive" },
      { name: "Laurel Falls", category: "Waterfall" },
      { name: "Roaring Fork Motor Nature Trail", category: "Historic" },
    ],
    water: [
      { name: "Little Pigeon River", type: "River", note: "Runs through Gatlinburg entrance corridor." },
      { name: "Abrams Creek", type: "Creek", note: "Feeds Abrams Falls, one of the park's highest-volume waterfalls." },
    ],
    dining: {
      label: "Very Limited",
      restaurants: 0,
      quickService: 0,
      generalStores: 1,
      bringFood: true,
      operations: [
        { name: "LeConte Lodge Dining Room", type: "Restaurant", location: "Inside park (reservation-only, summit lodging guests)", seasonal: true },
      ],
    },
    alerts: [
      { type: "Road", description: "Clingmans Dome Rd open; Newfound Gap Rd occasionally closed overnight for maintenance.", lastUpdated: "2026-08-27T15:00:00Z" },
      { type: "Trail", description: "Alum Cave Trail bridge repair — expect single-file sections.", lastUpdated: "2026-08-24T11:00:00Z" },
    ],
    marginNotes: [
      { section: "when-to-go", note: "Synchronous firefly viewing at Elkmont is lottery-only, drawn each spring." },
      { section: "hiking", note: "Alum Cave's bridge repair means single-file stretches below LeConte." },
      { section: "dining", note: "LeConte Lodge dining is for summit lodging guests only — pack food for everything else." },
    ],
  },
};
