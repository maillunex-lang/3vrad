package buildings

// SoftlockResult is the outcome of a greedy 1–70 island spend simulation.
type SoftlockResult struct {
	OK          bool
	FinalStars  int
	FinalStages map[string]int
	Failures    []string
}

// SimulateIslandRoute clears levels 1–70 (one star each) and greedily spends
// on the earliest unlocked affordable stage. Soft-lock if mandatory stages
// remain incomplete or stars remain after level 70.
func SimulateIslandRoute() SoftlockResult {
	stages := make(map[string]int, len(Catalog))
	for _, b := range Catalog {
		stages[b.ID] = 0
	}
	stars := 0
	var failures []string

	nextAffordable := func(maxLevel int) (BuildingDef, int, int, bool) {
		bestIdx := -1
		bestStage := -1
		bestCost := 0
		for i, b := range Catalog {
			cur := stages[b.ID]
			if cur >= len(b.Stages) {
				continue
			}
			st := b.Stages[cur]
			if st.UnlockLevel <= maxLevel && st.CostStars <= stars {
				if bestIdx < 0 || i < bestIdx {
					bestIdx = i
					bestStage = cur
					bestCost = st.CostStars
				}
			}
		}
		if bestIdx < 0 {
			return BuildingDef{}, 0, 0, false
		}
		return Catalog[bestIdx], bestStage, bestCost, true
	}

	for level := 1; level <= 70; level++ {
		stars++
		for guard := 0; guard < 64; guard++ {
			b, _, cost, ok := nextAffordable(level)
			if !ok {
				break
			}
			stars -= cost
			stages[b.ID]++
		}
	}

	final := make(map[string]int, len(Catalog))
	for _, b := range Catalog {
		cur := stages[b.ID]
		final[b.ID] = cur
		if cur != len(b.Stages) {
			failures = append(failures, b.ID+" incomplete")
		}
	}
	if stars != 0 {
		failures = append(failures, "leftover stars")
	}
	return SoftlockResult{
		OK:          len(failures) == 0,
		FinalStars:  stars,
		FinalStages: final,
		Failures:    failures,
	}
}
