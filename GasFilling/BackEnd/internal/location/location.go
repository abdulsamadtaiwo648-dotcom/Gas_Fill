package location

import "math"

type Coordinate struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

func DistanceKm(
	a Coordinate,
	b Coordinate,
) float64 {

	const earthRadiusKm = 6371.0

	lat1 :=
		a.Latitude *
			math.Pi /
			180

	lat2 :=
		b.Latitude *
			math.Pi /
			180

	deltaLat :=
		(b.Latitude -
			a.Latitude) *
			math.Pi /
			180

	deltaLon :=
		(b.Longitude -
			a.Longitude) *
			math.Pi /
			180

	h :=
		math.Sin(deltaLat/2)*
			math.Sin(deltaLat/2) +
			math.Cos(lat1)*
				math.Cos(lat2)*
				math.Sin(deltaLon/2)*
				math.Sin(deltaLon/2)

	c :=
		2 *
			math.Atan2(
				math.Sqrt(h),
				math.Sqrt(1-h),
			)

	return earthRadiusKm * c
}