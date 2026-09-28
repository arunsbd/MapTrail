export const EUROPE_BETA_POLICY = {
  roster: "UN M49 Europe intersected with MapTrail's 195-country world roster",
  targetPool: "The 40-country primary terrestrial component",
  isolatedGuessOnly: ["Iceland", "Malta"],
  separateComponentGuessOnly: ["Ireland", "United Kingdom"],
  microstates: ["Andorra", "Liechtenstein", "Monaco", "San Marino", "Vatican City"],
  gateways: [] as const,
  pointContacts: "Excluded",
  overseasTerritories: "Do not create a land border for the sovereign state",
  disputedTerritories: "No separate playable nodes in the beta",
  excludedDisputedBoundaryCandidates: ["ALB-SRB", "MKD-SRB"] as const,
  transcontinental: "UN M49 placement controls roster membership; Russia is included in Europe",
} as const;
