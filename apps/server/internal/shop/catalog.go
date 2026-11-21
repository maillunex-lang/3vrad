package shop

// Catalog of coin-priced boosters (ECON-002 C). Prices are provisional (OPEN_QUESTIONS #12).
type Item struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Currency    string `json:"currency"` // coins | diamonds
	Price       int    `json:"price"`
	Kind        string `json:"kind"` // booster
}

var Catalog = []Item{
	{ID: "booster_rocket", Name: "Ракета", Description: "Стартовый усилитель: ракета на поле", Currency: "coins", Price: 80, Kind: "booster"},
	{ID: "booster_bomb", Name: "Кокос-бомба", Description: "Стартовый усилитель: бомба", Currency: "coins", Price: 120, Kind: "booster"},
	{ID: "booster_propeller", Name: "Пропеллер", Description: "Стартовый усилитель: пропеллер", Currency: "coins", Price: 100, Kind: "booster"},
	{ID: "booster_pearl", Name: "Жемчужина", Description: "Стартовый усилитель: жемчужина", Currency: "coins", Price: 150, Kind: "booster"},
	{ID: "pack_small", Name: "Набор новичка", Description: "Ракета ×2 + бомба ×1", Currency: "coins", Price: 250, Kind: "pack"},
	{ID: "diamond_hint", Name: "Подсказка", Description: "Алмазная подсказка (расходник)", Currency: "diamonds", Price: 1, Kind: "booster"},
}

func ByID(id string) (Item, bool) {
	for _, it := range Catalog {
		if it.ID == id {
			return it, true
		}
	}
	return Item{}, false
}

// PackContents expands pack purchases into inventory lines.
func PackContents(itemID string) map[string]int {
	switch itemID {
	case "pack_small":
		return map[string]int{"booster_rocket": 2, "booster_bomb": 1}
	default:
		return map[string]int{itemID: 1}
	}
}
