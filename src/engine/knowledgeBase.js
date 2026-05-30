/**
 * KnowledgeBase — Domain knowledge for local LLM context
 * 
 * Compiles expert knowledge from all engine modules into searchable text chunks
 * that can be used as context for the local SmolLM2 model.
 */

class KnowledgeBase {

  static KNOWLEDGE_CHUNKS = [
    // ─── DRAINAGE SOLUTIONS ─────────────────────────────────────────
    {
      topic: 'french_drain',
      keywords: ['french drain', 'subsurface', 'perforated pipe', 'trench drain', 'water away'],
      content: `French drains redirect subsurface and surface water away from problem areas using a gravel-filled trench with perforated pipe.

Installation:
- Dig a trench 18-24 inches deep and 12 inches wide with minimum 1% slope (1/8 inch per foot)
- Line with landscape fabric to prevent soil infiltration into gravel
- Add 2-3 inches of 3/4" washed gravel at the bottom
- Place 4" perforated PVC or corrugated drain pipe (holes down for groundwater, holes up for surface water)
- Cover pipe with gravel to within 4 inches of surface
- Wrap landscape fabric over gravel
- Top with soil and sod or decorative stone

Sizing guidelines:
- Use Manning's equation: V = (1.49/n) × R^(2/3) × S^(1/2)
- 4" pipe handles up to ~20 GPM at 1% slope
- 6" pipe handles up to ~50 GPM at 1% slope
- For clay soils, the french drain collects but does NOT infiltrate — must discharge to positive outlet
- Space perforations towards bottom for groundwater interception

Materials per 50 linear feet:
- 50 ft perforated pipe (4" standard, 6" for heavy flow)
- 2-3 cubic yards of 3/4" washed gravel
- 75 sq ft landscape fabric
- Fittings: couplings, outlet adapter, pop-up emitter or discharge point

Cost estimate: $25-50 per linear foot (DIY) or $50-100 per linear foot (professional)`
    },
    {
      topic: 'catch_basin',
      keywords: ['catch basin', 'surface water', 'inlet', 'grate', 'collection', 'pooling', 'standing water', 'low point'],
      content: `Catch basins collect surface water at low points and connect to underground pipe systems for discharge.

When to use:
- Standing water or pooling at low points in the yard
- Areas where surface grading alone cannot solve drainage
- Intersections of multiple drainage paths
- Driveways, patios, or hardscape areas that collect water
- Peak flow exceeds 50 GPM indicating need for active collection

Installation:
- Excavate a hole sized for the catch basin box (typically 12"x12" or 18"x18")
- Set basin on 4" compacted gravel base
- Connect 4" or 6" solid pipe to outlet
- Ensure outlet pipe has minimum 1% slope to discharge
- Backfill around basin and compact
- Install grate flush with finished grade

Types:
- Square grate basins (12x12, 18x18, 24x24 inches)
- Round drain grates (4", 6", 8" diameter)
- Channel drains (linear) for driveways and patios
- Atrium grates for areas with leaves/debris

Cost estimate: $150-400 per basin (materials) or $500-1500 installed`
    },
    {
      topic: 'rain_garden',
      keywords: ['rain garden', 'bioretention', 'infiltration', 'native plants', 'stormwater', 'runoff', 'garden'],
      content: `Rain gardens are shallow depressions planted with native vegetation that capture and filter stormwater runoff.

Design principles:
- Locate 10+ feet from building foundations
- Size to 20-30% of the impervious area draining to it
- Standard depth: 6-8 inches with flat bottom
- Soil mix: 60% sand, 20% compost, 20% topsoil for optimal infiltration
- Should drain within 24-48 hours after a storm event

Sizing:
- For clay soils: size larger (30% of drainage area) with shallower depth (6")
- For sandy soils: can be smaller (20% of drainage area) with deeper ponding (12")
- Target storage: 1 inch of rainfall over contributing drainage area

Plant zones within rain garden:
- Bottom (wet zone): Blue Flag Iris, Cardinal Flower, Switchgrass, Soft Rush, Sedge
- Sides (moist zone): Black-Eyed Susan, Coneflower, Daylily, Ferns, Little Bluestem
- Edges (dry zone): Sedum, Lavender, Prairie Dropseed, Creeping Juniper

Maintenance:
- Water during establishment (first 2 years)
- Weed regularly in year 1-2
- Cut back perennials in late winter
- Remove sediment buildup from inlet area annually
- Replace mulch layer annually

Cost estimate: $3-15 per square foot depending on plants and soil amendments`
    },
    {
      topic: 'dry_well',
      keywords: ['dry well', 'drywell', 'infiltration pit', 'underground storage', 'soak away', 'downspout'],
      content: `Dry wells are underground structures that collect stormwater and slowly release it into surrounding soil.

When to use:
- Properties with good infiltration (sandy or loamy soils)
- Downspout drainage where surface discharge isn't practical
- Small to medium runoff volumes (< 500 gallons per event)
- NOT effective in clay or heavy clay soils (water cannot infiltrate out)

Installation:
- Excavate a hole 3-4 feet in diameter and 3-4 feet deep
- Line sides with landscape fabric
- Fill with clean 3/4" - 1.5" stone, or install prefab dry well chamber
- Connect inlet pipe from source (gutters, French drain, etc.)
- Cover top with landscape fabric, 6" topsoil, and sod

Sizing:
- Volume = rainfall depth × drainage area × runoff coefficient
- Typical residential: 50-100 gallon capacity per downspout
- Allow for percolation during storm event (reduces needed volume)
- Perc rate test: dig a 12" deep hole, fill with water, measure drop rate

Important considerations:
- Must be at least 10 feet from foundations
- Must be at least 10 feet from septic systems
- Soil must perc at minimum 0.5 in/hr
- NOT suitable for clay soils
- Check local codes — some jurisdictions require permits

Cost estimate: $200-500 DIY or $500-1500 professional per well`
    },
    {
      topic: 'swale',
      keywords: ['swale', 'bioswale', 'channel', 'grass channel', 'water flow', 'redirect', 'conveyance'],
      content: `Swales are shallow, vegetated channels that convey and infiltrate stormwater runoff.

Types:
- Grass swale: Simple grass-lined channel for sheet flow conveyance
- Bioswale: Enhanced with engineered soil and native plants for filtration
- Dry creek bed: Aesthetic rock-lined channel for intermittent flow

Design:
- Minimum 1% slope along length (0.5% for bioswales)
- Side slopes: 3:1 or flatter for mowable grass swales
- Bottom width: 2-8 feet depending on flow volume
- Depth: 12-18 inches typical
- Use check dams every 50 feet on steeper slopes to slow flow

Vegetation for bioswales:
- Channel bottom: Switchgrass, Soft Rush, Sedge, Blue Flag Iris
- Channel sides: Black-Eyed Susan, Little Bluestem, Daylily
- Edges: Native grasses, Coneflower

Best for:
- Large properties needing to convey water across distances
- Properties with gentle existing slopes
- Aesthetic alternative to underground pipe
- Filtering pollutants from runoff
- Areas with flat grades where pipes would be too shallow

Cost estimate: $5-15 per linear foot (grass) or $15-40 per linear foot (bioswale)`
    },
    {
      topic: 'grading',
      keywords: ['grade', 'grading', 'slope', 'regrade', 'foundation', 'flat', 'ponding', 'puddle', 'level'],
      content: `Proper grading is the most fundamental drainage solution — controlling where water flows using the natural slope of the land.

Standards and requirements:
- IRC (International Residential Code) requires minimum 6" fall in first 10 feet from foundation (5% slope)
- Minimum functional slope for lawn drainage: 2% (1/4" per foot)
- Ideal slope away from house: 5% for first 10 feet, then 2% minimum beyond
- For swales and ditches: minimum 1% longitudinal slope

Assessing existing grades:
- Use a string level, laser level, or transit to measure elevations
- Check all sides of the house for proper fall
- Identify low points where water collects
- Map flow paths across the property

Slope assessment ratings:
- Below 0.5%: POOR — ponding likely, needs re-grading or subsurface drainage
- 0.5-1.0%: MARGINAL — below minimum for reliable surface drainage
- 1.0-2.0%: ACCEPTABLE — minimum slope for lawn drainage
- 2.0-5.0%: GOOD — meets IRC foundation grading requirements
- 5.0-10%: STEEP — good drainage but may need erosion control
- Above 10%: VERY STEEP — erosion risk high, needs terracing or retaining walls

Cut/fill considerations:
- Always compact fill in lifts (6" maximum) to prevent settling
- Topsoil should be stripped before grading and replaced after
- Final grade should be 2-3" below door thresholds
- Maintain swale profiles during grading for cross-property drainage

Cost estimate: $500-3000 for basic re-grading, $5000-15000 for major grade changes`
    },
    {
      topic: 'channel_drain',
      keywords: ['channel drain', 'trench drain', 'linear drain', 'driveway drain', 'patio drain', 'garage'],
      content: `Channel drains (trench drains) are linear drainage systems that intercept sheet flow across hardscape surfaces.

When to use:
- Driveways that slope toward garage
- Patios or pool decks where water sheets across surface
- Transition from hardscape to softscape
- Areas with steep slopes meeting flat surfaces
- Anywhere sheet flow needs to be intercepted in a line

Types:
- Polymer concrete channel with slotted grate (residential)
- Cast iron channels (heavy-duty/commercial)
- Stainless steel slot drains (decorative/architectural)

Installation:
- Saw-cut or form a trench in concrete/asphalt
- Set channel sections on concrete bed with minimum 0.5% slope along length
- Connect channel outlet to 4" or 6" drain pipe
- Pipe must discharge to approved point (storm drain, dry well, daylight)
- Backfill and finish grade flush with surrounding surface

Sizing:
- Standard residential: 4-6 inch wide channel
- Handle 2-3 GPM per linear foot typically
- For heavy flow: use wider channels or multiple outlets

Cost estimate: $30-80 per linear foot installed`
    },
    {
      topic: 'retaining_wall',
      keywords: ['retaining wall', 'wall', 'terrace', 'slope', 'hillside', 'hold back', 'erosion', 'block'],
      content: `Retaining walls hold back soil on slopes and can incorporate drainage features.

Types:
- Gravity walls (segmental block, natural stone): up to 4 feet without engineering
- Reinforced walls (geogrid + block): 4-10+ feet, requires design
- Timber walls: economical for under 3 feet
- Poured concrete: strongest, most expensive
- Boulder walls: natural appearance, good for informal settings

Drainage behind retaining walls (CRITICAL):
- ALWAYS install drainage behind retaining walls — water pressure is the #1 cause of wall failure
- Place 4" perforated pipe at base behind wall
- Surround pipe with 12" of 3/4" washed gravel
- Install filter fabric between gravel and native soil
- Weep holes every 6-8 feet at wall base
- Outlet pipe must discharge to daylight or storm system

Design rules of thumb:
- Base width = 50-70% of wall height for gravity walls
- Bury first course 10% of wall height (minimum 6")
- Setback (batter) each course 1/4" to 1/2" toward hillside
- Step back with geogrid at every other course for reinforced walls
- Maximum unreinforced height varies by code (typically 4 feet)

Cost estimate: $20-40 per sq ft face area (block) or $40-80 per sq ft (natural stone)`
    },
    {
      topic: 'erosion_control',
      keywords: ['erosion', 'slope', 'wash', 'bare soil', 'sediment', 'stabilize', 'runoff', 'hillside'],
      content: `Erosion control prevents soil loss from water flow, wind, and gravity on slopes and disturbed areas.

Immediate/temporary solutions:
- Erosion control blankets (straw, coconut fiber): install on freshly seeded slopes
- Straw wattles/fiber logs: install across slope face every 10-20 feet vertically
- Silt fence at base of disturbed areas
- Hydroseeding for large areas
- Mulch application: 3-4" layer of shredded hardwood

Permanent vegetation solutions:
- Groundcovers: Creeping Juniper, Crown Vetch, Pachysandra, Virginia Creeper
- Deep-rooted grasses: Buffalograss, Creeping Red Fescue, Switchgrass
- Native prairie mix for large slopes
- Shrubs for steep areas: Virginia Sweetspire, Spicebush, Winterberry

Structural erosion control:
- Riprap (large stone) for concentrated flow areas and channel banks
- Gabion baskets (wire cages filled with stone) for steep slopes
- Terracing with retaining walls to break long slopes
- Check dams in swales/channels to reduce flow velocity
- Geotextile fabric under stone/mulch on severe slopes

Best practices:
- Address BOTH the water source and the erosion symptom
- Redirect concentrated flow before it reaches erodible soil
- Combine structural and vegetative approaches
- Establish vegetation as quickly as possible after disturbance
- Maintain 3-4" mulch layer until plants establish

Cost varies widely: $1-5/sq ft for seeding/mulch, $10-30/sq ft for riprap/structural`
    },
    {
      topic: 'soil',
      keywords: ['soil', 'clay', 'sand', 'loam', 'drainage', 'perc', 'infiltration', 'compaction', 'amend'],
      content: `Soil type is the most critical factor in drainage planning. It determines infiltration rate, runoff potential, and which solutions will work.

USDA Hydrologic Soil Groups:
- Group A (Sand, Sandy Loam, Gravel): High infiltration (2-12+ in/hr), low runoff. French drains and dry wells very effective.
- Group B (Loam, Silt Loam): Moderate infiltration (0.5-2 in/hr), moderate runoff. Most solutions work well.
- Group C (Silty Clay, Sandy Clay Loam): Slow infiltration (0.1-0.5 in/hr), high runoff. Need aggressive drainage, dry wells less effective.
- Group D (Clay, Heavy Clay): Very slow infiltration (0.01-0.3 in/hr), very high runoff. Need comprehensive systems, dry wells NOT effective.

Soil improvement for drainage:
- Gypsum (calcium sulfate): breaks up clay particles, improves structure. Apply 5-15 lbs per 100 sq ft.
- Organic matter/compost: add 3-6" and till into top 8" to improve all soil types
- Coarse sand: mix with clay soils for planting beds (not lawns)
- Core aeration: reduces compaction, improves infiltration in lawns
- Raised beds: bypass poor soil entirely for planting areas

Perc test (percolation test):
- Dig a hole 12" wide × 12" deep
- Fill with water and let it drain completely (pre-soak)
- Fill again and measure how fast it drops
- Good drainage: drops 1" or more per hour
- Poor drainage: less than 0.5" per hour

Compaction issues:
- Construction equipment compacts soil, reducing infiltration by 70-90%
- New construction sites almost always need soil decompaction
- Deep tilling (12-18") with organic matter helps restore structure
- Avoid working clay soil when wet — causes severe compaction`
    },
    {
      topic: 'permeable_pavers',
      keywords: ['permeable', 'paver', 'porous', 'pervious', 'driveway', 'patio', 'hardscape', 'infiltration'],
      content: `Permeable pavers allow water to infiltrate through the surface rather than running off, reducing drainage load.

Types:
- Interlocking concrete pavers with widened joints (filled with gravel)
- Permeable interlocking concrete pavers (PICP) with open cells
- Porous concrete/asphalt (water passes through material itself)
- Grass pavers/grid systems (plastic grid with grass growing through)
- Gravel-filled grid systems

Installation (typical PICP system):
1. Excavate to subgrade (typically 18-24" total depth)
2. Compact subgrade (do NOT use geotextile on bottom if infiltration desired)
3. Place 6-12" open-graded base aggregate (no fines)
4. Place 4" open-graded bedding aggregate
5. Install pavers with 1/4" joints
6. Fill joints with ASTM #8 or #9 aggregate
7. Compact and sweep additional aggregate into joints

Storage/infiltration capacity:
- Aggregate base provides storage: approximately 40% void space
- 12" of aggregate base stores approximately 4.8" of rainfall
- Infiltration rate: 100+ inches per hour for well-maintained systems

Maintenance:
- Vacuum or pressure wash joints annually to prevent clogging
- Replace joint aggregate as needed
- Avoid sealing pavers (defeats purpose)
- Keep landscaping debris off surface
- Re-level settled pavers as needed

Cost estimate: $12-30 per sq ft installed (vs $8-15 for standard pavers)`
    },
    {
      topic: 'downspout',
      keywords: ['downspout', 'gutter', 'roof', 'extension', 'underground', 'discharge', 'splash block'],
      content: `Proper downspout management is the first line of defense in foundation drainage — roofs concentrate enormous water volumes.

The problem:
- A 1,000 sq ft roof generates 620 gallons per 1 inch of rainfall
- A typical house generates 1,000-3,000 gallons per storm event
- Dumping this water at the foundation is the #1 cause of basement/crawlspace water issues

Solutions (from basic to advanced):
1. Splash blocks: Minimum solution. Place at each downspout to direct water 2-3 feet from foundation.
2. Downspout extensions: Extend downspouts 6-10 feet from foundation using solid pipe (above or below ground).
3. Underground piping: Bury solid 4" pipe from downspouts to discharge point (yard edge, dry well, storm drain).
4. Pop-up emitters: Underground pipe terminating in a pop-up that opens when water flows, then closes.
5. Rain barrels/cisterns: Capture and store water for irrigation (50-100 gallon barrels).

Underground downspout routing:
- Use solid (non-perforated) 4" pipe
- Maintain minimum 1% slope toward outlet
- Use sweep elbows (not 90° fittings) to prevent clogs
- Install cleanouts at direction changes
- Outlet should be at least 10 feet from foundation
- Pop-up emitters should be in areas that can handle the discharge

Cost estimate: $10-30 per downspout (extensions) or $200-500 per run (underground to pop-up)`
    },
    {
      topic: 'irrigation',
      keywords: ['irrigation', 'sprinkler', 'watering', 'drip', 'water management', 'lawn'],
      content: `Irrigation and drainage work together — over-irrigation is a common cause of drainage problems.

Water management principles:
- Water deeply but infrequently to encourage deep root growth
- Most lawns need 1-1.5 inches per week total (including rainfall)
- Best time to water: early morning (4-8 AM) to minimize evaporation and disease
- Avoid watering late evening — promotes fungal disease

Irrigation types:
- Spray heads: cover 5-15 ft radius, apply water fast (1.5-2 in/hr)
- Rotary nozzles: cover 15-30 ft radius, apply water slower (0.4-0.8 in/hr) — better for clay soils
- Drip irrigation: precise, applies water slowly at root zone — ideal for beds
- Soaker hoses: economical drip alternative for beds and hedgerows

Irrigation and drainage interaction:
- Run times too long on clay soil causes runoff and puddles
- Matched precipitation rate prevents dry/wet spots
- Proper head-to-head coverage eliminates dry patches
- Rain sensors or smart controllers prevent over-watering
- Check sprinklers aren't spraying foundation walls

Signs of over-irrigation causing drainage issues:
- Perpetually soggy areas in yard
- Mushroom/fungal growth in lawn
- Algae on walkways or structures
- Higher-than-expected water bills
- Foundation settlement from chronically wet soil`
    },
    {
      topic: 'lawn_care',
      keywords: ['lawn', 'grass', 'mow', 'seed', 'sod', 'thatch', 'aerate', 'fertilize', 'weed'],
      content: `Healthy lawns improve drainage through better root structure and organic matter development.

Lawn and drainage connection:
- Healthy grass roots improve infiltration by 50-200% vs bare soil
- Compacted lawns have drastically reduced infiltration
- Thatch layer over 1/2" acts as water repellent barrier
- Core aeration creates channels for water to penetrate

Core aeration for drainage improvement:
- Best timing: fall for cool-season grass, late spring for warm-season
- Use a machine that pulls 2-3" plugs, 2-3" apart
- Leave plugs on surface to break down
- Follow with overseeding and compost topdressing
- Repeat annually for compacted soils

Overseeding after aeration:
- Cool-season mix: Kentucky Bluegrass (40%), Perennial Ryegrass (30%), Fine Fescue (30%)
- Warm-season: Bermuda or Zoysia plugs/seed depending on zone
- Apply 4-6 lbs seed per 1000 sq ft for cool-season renovation
- Keep moist (not soggy) for 2-3 weeks until germination

Mowing for health:
- Never remove more than 1/3 of blade height at once
- Cool-season grasses: maintain at 3-4 inches (promotes deeper roots)
- Warm-season grasses: maintain at 1.5-2.5 inches
- Mulch clippings return nutrients and organic matter
- Sharp blades only — dull blades tear and stress grass`
    },
    {
      topic: 'cost_estimation',
      keywords: ['cost', 'price', 'budget', 'estimate', 'how much', 'expensive', 'cheap', 'afford'],
      content: `Drainage project cost estimation guidelines for residential properties:

French Drains:
- DIY: $8-15 per linear foot (materials only)
- Professional: $25-50 per linear foot (typical)
- Premium (larger pipe, deeper): $50-100 per linear foot
- Average residential project: 50-150 linear feet = $1,250 - $7,500

Catch Basins:
- Materials: $50-200 per basin
- Installed: $500-1,500 per basin
- Including connecting pipe: add $15-30 per linear foot

Rain Gardens:
- DIY: $3-8 per square foot
- Professional: $10-20 per square foot
- Typical size (100-300 sq ft): $1,000 - $6,000

Grading/Re-grading:
- Minor (hand-grading small areas): $500-2,000
- Moderate (machine grading, small yard): $2,000-5,000
- Major (significant earth moving): $5,000-15,000+

Retaining Walls:
- Block walls: $20-40 per sq ft of face area
- Natural stone: $40-80 per sq ft
- Engineered (over 4 ft): add 30-50% for engineering and geogrid

Permeable Pavers:
- $15-30 per sq ft installed (including excavation and base)
- Standard patio/driveway comparison: $8-15 per sq ft

Complete drainage system (typical residential):
- Basic (grading + extensions): $1,000-3,000
- Moderate (french drain + catch basins): $3,000-8,000
- Comprehensive (full system): $8,000-20,000+

Factors affecting cost:
- Soil type (clay = more excavation difficulty)
- Accessibility (equipment access to backyard)
- Depth to outlet (longer runs = more pipe)
- Local labor rates
- Permitting requirements`
    },
    {
      topic: 'permits_codes',
      keywords: ['permit', 'code', 'regulation', 'legal', 'inspection', 'building code', 'setback'],
      content: `Building codes and permits related to drainage and landscaping work:

When permits are typically required:
- Retaining walls over 4 feet high (measured from bottom of footing to top)
- Connecting to municipal storm sewer system
- Work affecting neighboring property drainage
- Grading that changes more than 12 inches of elevation
- Work within easements or setbacks
- Work near wetlands, streams, or flood zones

Key codes for residential drainage:
- IRC R401.3: Surface grading minimum 6" fall in first 10 feet from foundation
- IRC R405: Foundation drainage (perimeter drains) required for habitable spaces below grade
- Local stormwater management ordinances (vary widely)
- Setback requirements for dry wells, retaining walls
- Discharge restrictions (cannot direct water onto neighbor's property)

Best practices:
- Check local codes BEFORE starting any drainage project
- Get a survey to know property lines and easements
- Document existing conditions (photos, measurements)
- Keep drainage on your own property when possible
- Maintain positive grade away from all structures
- Consider downstream effects of your changes

Professional consultation recommended for:
- Projects near property lines
- Connecting to storm sewers
- Walls over 4 feet
- Work in flood zones or near water features
- Properties with known wetlands or springs`
    },
    {
      topic: 'seasonal_maintenance',
      keywords: ['maintenance', 'seasonal', 'winter', 'spring', 'fall', 'clean', 'inspect', 'annual'],
      content: `Seasonal maintenance schedule for drainage and landscaping systems:

Spring (March-May):
- Inspect all drainage outlets for blockage from winter debris
- Check French drain surface for settling or sinkholes
- Clean catch basin grates and sumps
- Test sump pump operation
- Check gutters and downspouts for winter damage
- Assess winter erosion and repair bare areas
- Apply first fertilizer application (cool-season lawns)
- Core aerate compacted areas
- Reseed bare spots

Summer (June-August):
- Monitor irrigation — reduce if drainage issues appear
- Mow at proper height (3-4" cool season, 2" warm season)
- Check rain garden plants for establishment
- Monitor swales during storms for proper function
- Watch for standing water > 48 hours (indicates blockage)

Fall (September-November):
- CRITICAL: Clear leaves from all drain grates and inlets
- Install leaf guards on catch basins if needed
- Core aerate and overseed lawns (cool-season)
- Cut back rain garden perennials after frost
- Flush underground pipes with hose
- Check pop-up emitters for proper operation
- Add mulch to all beds (3-4" layer)
- Final fertilizer application

Winter (December-February):
- Monitor for ice dams on roof (indicates poor attic ventilation)
- Keep snow away from foundation (don't pile against house)
- Check basement/crawl for moisture during thaws
- Plan spring projects during downtime
- Order materials for spring installation`
    },
    {
      topic: 'outdoor_living',
      keywords: ['patio', 'deck', 'outdoor', 'living space', 'fire pit', 'seating', 'entertainment'],
      content: `Integrating outdoor living spaces with proper drainage design:

Patio drainage:
- Slope patio surface 1-2% away from house (1/8" to 1/4" per foot)
- Use channel drains at patio/house interface if slope toward house exists
- Permeable pavers eliminate the need for surface slope (water goes through)
- Ensure patio edge doesn't create a dam trapping water against foundation
- French drain or gravel trench along downhill edge of patio

Deck considerations:
- Under-deck drainage systems catch water between boards
- Grade soil beneath deck away from foundation
- Ensure adequate ventilation under deck to prevent moisture issues
- Downspouts near decks need to discharge away from the structure

Fire pit areas:
- Grade area with slight crown (high in center, sloping out)
- Use gravel base 6-8 inches deep for infiltration
- Keep at least 10 feet from structures
- Consider permeable paver surround

Outdoor kitchens:
- Must be on impervious surface for food safety
- Require channel drain or floor drain for washdown
- Connect drain to approved discharge point
- Slope surrounding grade away on all sides

Retaining walls creating terraced living spaces:
- Each terrace needs its own drainage plan
- Include drainage behind AND at base of wall
- Upper terrace runoff should bypass lower terrace surfaces
- Consider stairs/ramps with proper drainage to prevent icing`
    },
    {
      topic: 'general_contracting',
      keywords: ['contractor', 'hire', 'diy', 'project', 'plan', 'install', 'professional', 'work'],
      content: `General contracting guidance for outdoor and drainage projects:

When to DIY vs. hire a professional:
DIY-friendly projects:
- Downspout extensions and splash blocks
- Small French drains (under 30 feet)
- Rain garden installation
- Basic grading (hand tools, small area)
- Plant installation and mulching
- Catch basin installation (single unit)

Hire a professional for:
- Retaining walls over 3 feet
- Connecting to municipal storm system
- Major re-grading (machine work)
- French drains over 100 feet or in difficult soils
- Work requiring permits
- Projects near utilities or foundations
- Comprehensive drainage systems

Finding a good contractor:
- Look for licensed, insured, and bonded
- Ask for references and photos of similar projects
- Get 3 quotes minimum
- Ask about warranty on workmanship
- Verify they pull necessary permits
- Check reviews on multiple platforms
- Ask about drainage specifically — not all landscapers understand hydrology

Project planning steps:
1. Document the problem (photos, video during rain)
2. Understand your soil type (perc test or USDA Web Soil Survey)
3. Map your property slopes and flow paths
4. Research solutions appropriate for your situation
5. Get professional assessment if unsure
6. Obtain permits if required
7. Schedule work during dry season if possible
8. Plan for proper disposal of excavated soil

Red flags in contractors:
- No written contract or scope of work
- Demands large upfront payment (>30%)
- No insurance or won't provide certificate
- Unrealistically low bid
- No timeline or milestone schedule
- Won't pull permits when required`
    }
  ];

  /**
   * Find relevant knowledge chunks for a user query
   * Returns up to maxChunks most relevant pieces of knowledge
   */
  static findRelevantKnowledge(query, maxChunks = 3) {
    const lower = query.toLowerCase();
    const scored = [];

    for (const chunk of this.KNOWLEDGE_CHUNKS) {
      let score = 0;

      // Score based on keyword matches
      for (const keyword of chunk.keywords) {
        if (lower.includes(keyword)) {
          score += 10;
          // Bonus for exact phrase match
          if (lower.includes(keyword) && keyword.length > 5) {
            score += 5;
          }
        }
      }

      // Score based on topic match
      if (lower.includes(chunk.topic.replace('_', ' '))) {
        score += 15;
      }

      // Score based on word overlap with content (lighter weight)
      const queryWords = lower.split(/\s+/).filter(w => w.length > 3);
      for (const word of queryWords) {
        if (chunk.content.toLowerCase().includes(word)) {
          score += 1;
        }
      }

      if (score > 0) {
        scored.push({ chunk, score });
      }
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Return top chunks
    return scored.slice(0, maxChunks).map(s => s.chunk.content);
  }

  /**
   * Get a general introduction context for the model
   */
  static getSystemContext() {
    return `You are an expert outdoor contractor and landscaping specialist with deep knowledge of:
- Yard drainage systems: French drains, catch basins, channel drains, dry wells, swales
- Landscaping: rain gardens, native plants, bioswales, erosion control
- Hardscaping: retaining walls, permeable pavers, patios, outdoor living spaces
- Soil science: types, infiltration rates, amendments, compaction
- Grading and topography: slope requirements, cut/fill, water flow management
- Irrigation and water management
- Building codes and permit requirements for outdoor work
- Cost estimation for residential outdoor projects
- Seasonal maintenance schedules

You provide practical, actionable advice based on proven construction and landscaping practices. You reference specific measurements, materials, and techniques that professionals use. When appropriate, you recommend when to hire a professional vs DIY.`;
  }
}

module.exports = KnowledgeBase;
