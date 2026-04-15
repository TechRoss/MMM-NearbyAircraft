# MMM-NearbyAircraft

A [MagicMirror²](https://magicmirror.builders) module that displays live nearby aircraft using the free [ADSB.lol](https://adsb.lol) API. No API key required.

Aircraft are listed by distance from a configured location, with FR24-style altitude colour coding, heading indicators, and optional military aircraft highlighting.

---

## Features

- Live aircraft list updated on a configurable interval
- Sorted by distance from your location
- FR24-style altitude colour bar and coloured altitude readout
- Rotating ✈ heading indicator showing direction of travel
- Climb / descent / level arrow
- Ground speed and distance columns
- Military aircraft float to the top of the list with a red MIL badge
- No API key or local ADS-B receiver required

---

## Screenshots

_Coming soon_

---

## Installation

Navigate to your MagicMirror `modules` directory and clone the repository:

```bash
cd ~/MagicMirror/modules
git clone https://github.com/rossbateman/MMM-NearbyAircraft.git
```

No additional dependencies — the module uses only Node.js built-ins.

---

## Configuration

Add the module to the `modules` array in your `config/config.js`:

```js
{
    module: "MMM-NearbyAircraft",
    position: "top_right",
    config: {
        lat: 52.2853,
        lon: -1.5200,
        radiusNm: 25,
        count: 10,
        updateIntervalSeconds: 15
    }
}
```

### Configuration options

| Option | Type | Default | Description |
|---|---|---|---|
| `lat` | `float` | `52.2853` | Latitude of your location |
| `lon` | `float` | `-1.5200` | Longitude of your location |
| `radiusNm` | `int` | `25` | Search radius in nautical miles (max 250) |
| `count` | `int` | `10` | Maximum number of aircraft to display |
| `updateIntervalSeconds` | `int` | `15` | How often to refresh the aircraft list |
| `title` | `string` | `"NEARBY AIRCRAFT"` | Module header text |
| `showOperator` | `bool` | `true` | Show airline/operator name below aircraft type |
| `showSpeed` | `bool` | `true` | Show ground speed column |
| `showDistance` | `bool` | `true` | Show distance column |
| `militaryAlert` | `bool` | `true` | Highlight military aircraft and sort them to the top of the list |

---

## Altitude colour scale

Altitude colours match the Flightradar24 convention:

| Altitude | Colour |
|---|---|
| Ground | Grey |
| < 2,500 ft | Red |
| < 5,000 ft | Orange-red |
| < 10,000 ft | Orange |
| < 15,000 ft | Yellow |
| < 20,000 ft | Yellow-green |
| < 25,000 ft | Green |
| < 30,000 ft | Cyan |
| < 35,000 ft | Blue |
| 35,000+ ft | Blue-grey |

---

## Military aircraft

When `militaryAlert` is enabled (default), military aircraft are:

- Sorted to the top of the list above all other traffic
- Shown with a red **MIL** badge next to the callsign
- Shown with a red heading icon

Military status is determined from the ADSB.lol database flags and aircraft type data.

---

## Data source

Aircraft data is provided by [ADSB.lol](https://adsb.lol) — a free, community-run ADS-B aggregator. No account or API key is required.

Endpoint used: `GET https://api.adsb.lol/v2/lat/{lat}/lon/{lon}/dist/{dist}`

---

## License

MIT
