export type WildlifeCategory = "Bird" | "Mammal" | "Fish" | "Reptile" | "Insect";

export type WildlifeIconKey =
  | "bear"
  | "bison"
  | "wolf"
  | "ungulate"
  | "rodent"
  | "marine"
  | "bat"
  | "turtle"
  | "lizard"
  | "bird"
  | "fish"
  | "butterfly";

export interface Wildlife {
  name: string;
  category: WildlifeCategory;
  fact: string;
}

/** One signature species per park — real, well-known associations, not filler. */
export const PARK_WILDLIFE: Record<string, Wildlife> = {
  acad: { name: "Peregrine Falcon", category: "Bird", fact: "Nesting pairs close sections of Precipice Trail every spring." },
  npsa: { name: "Samoan Flying Fox", category: "Mammal", fact: "One of the few bats that pollinates flowers by day." },
  arch: { name: "Collared Lizard", category: "Reptile", fact: "Can sprint upright on its hind legs across the slickrock." },
  badl: { name: "Bison", category: "Mammal", fact: "North America's largest land mammal, reintroduced here in 1963." },
  bibe: { name: "Greater Roadrunner", category: "Bird", fact: "Can outrun a rattlesnake — and often does." },
  bisc: { name: "West Indian Manatee", category: "Mammal", fact: "Grazes the bay's seagrass beds at a gentle 5 mph." },
  blca: { name: "Peregrine Falcon", category: "Bird", fact: "Dives over 2,000 feet of sheer gneiss canyon wall." },
  brca: { name: "Utah Prairie Dog", category: "Mammal", fact: "Found only in southern Utah, and only at this elevation." },
  cany: { name: "Desert Bighorn Sheep", category: "Mammal", fact: "Navigates canyon rims most hikers wouldn't dare walk." },
  care: { name: "Golden Eagle", category: "Bird", fact: "Nests in the cliffs above the historic Fruita orchards." },
  cave: { name: "Mexican Free-tailed Bat", category: "Mammal", fact: "Up to 400,000 emerge from the cavern mouth each summer evening." },
  chis: { name: "Island Fox", category: "Mammal", fact: "Found nowhere else on Earth — one of the smallest fox species alive." },
  cong: { name: "Barred Owl", category: "Bird", fact: "Calls “who cooks for you” through the old-growth floodplain forest." },
  crla: { name: "Clark's Nutcracker", category: "Bird", fact: "Remembers the location of thousands of buried whitebark pine seeds." },
  cuva: { name: "Great Blue Heron", category: "Bird", fact: "A large rookery nests above the Cuyahoga River each spring." },
  deva: { name: "Salt Creek Pupfish", category: "Fish", fact: "Survives in water saltier than the sea, in one of the hottest places on Earth." },
  dena: { name: "Grizzly Bear", category: "Mammal", fact: "Shares the tundra with wolves, moose, and Dall sheep below Denali's summit." },
  drto: { name: "Loggerhead Sea Turtle", category: "Reptile", fact: "Nests on the same sandy keys it hatched from decades earlier." },
  ever: { name: "American Alligator", category: "Reptile", fact: "The “river of grass” is the only place alligators and crocodiles coexist." },
  gaar: { name: "Caribou", category: "Mammal", fact: "The Western Arctic herd migrates through this roadless wilderness." },
  jeff: { name: "Peregrine Falcon", category: "Bird", fact: "Nests on ledges of the Gateway Arch itself, 630 feet above St. Louis." },
  glac: { name: "Mountain Goat", category: "Mammal", fact: "Bounds across cliffs that keep even the park's grizzlies away." },
  glba: { name: "Humpback Whale", category: "Mammal", fact: "Bubble-net feeds in the same bay glaciers carved just centuries ago." },
  grca: { name: "California Condor", category: "Bird", fact: "North America's largest bird, reintroduced after nearly going extinct." },
  grte: { name: "Moose", category: "Mammal", fact: "Wades chest-deep through Teton wetlands most mornings." },
  grba: { name: "American Pika", category: "Mammal", fact: "A tiny, heat-sensitive relative of the rabbit living near 13,000 feet." },
  grsa: { name: "Ord's Kangaroo Rat", category: "Mammal", fact: "Never needs to drink — it metabolizes all its water from seeds." },
  grsm: { name: "Black Bear", category: "Mammal", fact: "The highest density of black bears anywhere in the eastern U.S." },
  gumo: { name: "Elk", category: "Mammal", fact: "Reintroduced to the Guadalupe foothills after being hunted out a century ago." },
  hale: { name: "Nēnē (Hawaiian Goose)", category: "Bird", fact: "The world's rarest goose, found only in Hawaii." },
  havo: { name: "Hawaiian Hoary Bat", category: "Mammal", fact: "The only land mammal native to the Hawaiian islands." },
  hosp: { name: "Eastern Box Turtle", category: "Reptile", fact: "Can live over 50 years in the same patch of Ouachita forest." },
  indu: { name: "Karner Blue Butterfly", category: "Insect", fact: "An endangered butterfly that depends entirely on wild lupine." },
  isro: { name: "Gray Wolf", category: "Mammal", fact: "Site of the longest continuous predator-prey study on Earth, with moose." },
  jotr: { name: "Desert Tortoise", category: "Reptile", fact: "Can live 50-80 years and spends 95% of its life underground." },
  katm: { name: "Brown Bear", category: "Mammal", fact: "Stars of “Fat Bear Week” as they gorge on salmon each fall." },
  kefj: { name: "Sea Otter", category: "Mammal", fact: "Uses a favorite rock to crack open shellfish on its belly." },
  kica: { name: "Yellow-bellied Marmot", category: "Mammal", fact: "Whistles a warning from granite boulders below the sequoia groves." },
  kova: { name: "Caribou", category: "Mammal", fact: "Half a million animals cross the Kobuk River twice a year." },
  lacl: { name: "Bald Eagle", category: "Bird", fact: "Fishes the same salmon runs grizzlies compete for each summer." },
  lavo: { name: "Black Bear", category: "Mammal", fact: "Forages volcanic slopes still steaming from geothermal vents." },
  maca: { name: "Gray Bat", category: "Mammal", fact: "An endangered species roosting deep in the world's longest cave system." },
  meve: { name: "Golden Eagle", category: "Bird", fact: "Soars above cliff dwellings built 800 years ago." },
  mora: { name: "Hoary Marmot", category: "Mammal", fact: "Whistles echo across subalpine meadows every summer." },
  neri: { name: "Peregrine Falcon", category: "Bird", fact: "Nests on the gorge's sandstone cliffs above the rapids." },
  noca: { name: "Gray Wolf", category: "Mammal", fact: "Returned on its own to one of the most rugged ranges in the Lower 48." },
  olym: { name: "Roosevelt Elk", category: "Mammal", fact: "Named for the president who helped protect this temperate rainforest." },
  pefo: { name: "Pronghorn", category: "Mammal", fact: "The fastest land animal in North America crosses the painted desert." },
  pinn: { name: "California Condor", category: "Bird", fact: "A key release site for the world's most endangered bird recovery program." },
  redw: { name: "Roosevelt Elk", category: "Mammal", fact: "Grazes beneath trees that were already centuries old at the time of Rome." },
  romo: { name: "Elk", category: "Mammal", fact: "Bugles echo through the valleys every September rut." },
  sagu: { name: "Gila Woodpecker", category: "Bird", fact: "Carves nest holes into saguaro cacti that later shelter owls." },
  seki: { name: "Black Bear", category: "Mammal", fact: "Climbs among trees that are among the largest living things on Earth." },
  shen: { name: "Black Bear", category: "Mammal", fact: "One of the highest black bear densities in the National Park System." },
  thro: { name: "Bison", category: "Mammal", fact: "Roams the same badlands that inspired Theodore Roosevelt's conservation legacy." },
  viis: { name: "Hawksbill Sea Turtle", category: "Reptile", fact: "Nests on the same beaches it's returned to for millions of years." },
  voya: { name: "Gray Wolf", category: "Mammal", fact: "Howls across a park that's 40% water, best explored by canoe." },
  whsa: { name: "Bleached Earless Lizard", category: "Reptile", fact: "Evolved pale white skin to match the gypsum dunes in just a few thousand years." },
  wica: { name: "Black-tailed Prairie Dog", category: "Mammal", fact: "Colonies burrow above 130+ miles of mapped cave passages below." },
  wrst: { name: "Dall Sheep", category: "Mammal", fact: "Climbs North America's largest national park, bigger than Switzerland." },
  yell: { name: "Grizzly Bear", category: "Mammal", fact: "Shares the park with the largest bison herd on public land in the U.S." },
  yose: { name: "Black Bear", category: "Mammal", fact: "Learned to avoid campground coolers after decades of park bear-proofing." },
  zion: { name: "Desert Bighorn Sheep", category: "Mammal", fact: "Reintroduced to the cliffs above the Virgin River in the 1970s." },
};

export function getWildlife(code: string): Wildlife | undefined {
  return PARK_WILDLIFE[code];
}

/** Maps a species name to a distinct full-body silhouette — so "Mammal" stops meaning one generic bear/panda blob. */
export function getWildlifeIconKey(wildlife: Wildlife): WildlifeIconKey {
  const n = wildlife.name.toLowerCase();
  if (n.includes("bear")) return "bear";
  if (n.includes("bison")) return "bison";
  if (n.includes("wolf")) return "wolf";
  if (n.includes("whale") || n.includes("otter") || n.includes("manatee")) return "marine";
  if (n.includes("bat") || n.includes("flying fox")) return "bat";
  if (n.includes("turtle") || n.includes("tortoise")) return "turtle";
  if (n.includes("alligator") || n.includes("lizard")) return "lizard";
  if (n.includes("butterfly")) return "butterfly";
  if (n.includes("fish")) return "fish";
  if (
    n.includes("eagle") ||
    n.includes("falcon") ||
    n.includes("owl") ||
    n.includes("condor") ||
    n.includes("heron") ||
    n.includes("nutcracker") ||
    n.includes("woodpecker") ||
    n.includes("nēnē") ||
    n.includes("goose") ||
    n.includes("roadrunner")
  ) {
    return "bird";
  }
  if (n.includes("prairie dog") || n.includes("marmot") || n.includes("pika") || n.includes("kangaroo rat") || n.includes("fox")) {
    return "rodent";
  }
  if (n.includes("moose") || n.includes("elk") || n.includes("caribou") || n.includes("sheep") || n.includes("goat") || n.includes("pronghorn")) {
    return "ungulate";
  }
  // fallback by broad category
  if (wildlife.category === "Bird") return "bird";
  if (wildlife.category === "Fish") return "fish";
  if (wildlife.category === "Insect") return "butterfly";
  if (wildlife.category === "Reptile") return "lizard";
  return "ungulate";
}
