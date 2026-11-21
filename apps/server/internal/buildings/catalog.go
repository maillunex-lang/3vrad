package buildings

// Catalog entries from BUILDINGS-001 (APPROVED).

type StageCost struct {
	UnlockLevel int `json:"unlockLevel"`
	CostStars   int `json:"costStars"`
}

type BuildingDef struct {
	ID     string      `json:"id"`
	Name   string      `json:"name"`
	Zone   string      `json:"zone"`
	Stages []StageCost `json:"stages"`
	Role   string      `json:"role"`
}

var Catalog = []BuildingDef{
	{ID: "B01", Name: "Входная арка", Zone: "Z1", Stages: []StageCost{{1, 1}, {3, 2}}, Role: "welcome"},
	{ID: "B02", Name: "Пляжная дорожка", Zone: "Z1", Stages: []StageCost{{4, 1}, {5, 1}, {7, 2}}, Role: "path"},
	{ID: "B03", Name: "Мастерская Клеша", Zone: "Z1", Stages: []StageCost{{8, 1}, {10, 2}}, Role: "workshop"},
	{ID: "B04", Name: "Спасательный причал", Zone: "Z2", Stages: []StageCost{{11, 1}, {12, 1}, {14, 2}}, Role: "pier"},
	{ID: "B05", Name: "Кафе «Кокос и Ко»", Zone: "Z2", Stages: []StageCost{{15, 1}, {17, 2}}, Role: "cafe"},
	{ID: "B06", Name: "Пальмовая аллея", Zone: "Z3", Stages: []StageCost{{18, 1}, {19, 1}, {21, 2}}, Role: "avenue"},
	{ID: "B07", Name: "Пляжные бунгало", Zone: "Z3", Stages: []StageCost{{22, 1}, {24, 2}}, Role: "bungalow"},
	{ID: "B08", Name: "Смотровая площадка", Zone: "Z3", Stages: []StageCost{{25, 1}, {26, 1}, {28, 2}}, Role: "viewpoint"},
	{ID: "B09", Name: "Рынок ракушек", Zone: "Z4", Stages: []StageCost{{29, 1}, {31, 2}}, Role: "shop"},
	{ID: "B10", Name: "Фонтан жемчужин", Zone: "Z4", Stages: []StageCost{{32, 1}, {33, 1}, {35, 2}}, Role: "fountain"},
	{ID: "B11", Name: "Почтовая станция", Zone: "Z4", Stages: []StageCost{{36, 1}, {38, 2}}, Role: "mail"},
	{ID: "B12", Name: "Клуб путешественников", Zone: "Z4", Stages: []StageCost{{39, 1}, {40, 1}, {42, 2}}, Role: "teams"},
	{ID: "B13", Name: "Мост к лагуне", Zone: "Z5", Stages: []StageCost{{43, 1}, {45, 2}}, Role: "bridge"},
	{ID: "B14", Name: "Лагунный бар", Zone: "Z5", Stages: []StageCost{{46, 1}, {47, 1}, {49, 2}}, Role: "bar"},
	{ID: "B15", Name: "Сад светлячков", Zone: "Z5", Stages: []StageCost{{50, 1}, {52, 2}}, Role: "garden"},
	{ID: "B16", Name: "Домик исследователя", Zone: "Z5", Stages: []StageCost{{53, 1}, {54, 1}, {56, 2}}, Role: "explorer"},
	{ID: "B17", Name: "Сцена фестиваля", Zone: "Z6", Stages: []StageCost{{57, 1}, {59, 2}}, Role: "stage"},
	{ID: "B18", Name: "Отель «Райский»", Zone: "Z6", Stages: []StageCost{{60, 1}, {61, 1}, {63, 2}}, Role: "hotel"},
	{ID: "B19", Name: "Башня наблюдений", Zone: "Z7", Stages: []StageCost{{64, 1}, {66, 2}}, Role: "tower"},
	{ID: "B20", Name: "Старый маяк", Zone: "Z7", Stages: []StageCost{{67, 1}, {68, 1}, {70, 2}}, Role: "lighthouse"},
}

func ByID(id string) (BuildingDef, bool) {
	for _, b := range Catalog {
		if b.ID == id {
			return b, true
		}
	}
	return BuildingDef{}, false
}

func TotalMandatoryStars() int {
	sum := 0
	for _, b := range Catalog {
		for _, s := range b.Stages {
			sum += s.CostStars
		}
	}
	return sum
}
