const NodeHelper = require("node_helper");
const https = require("https");

const AIRLINE_MAP = {
    // UK & Ireland
    BAW: "British Airways",    EZY: "easyJet",           RYR: "Ryanair",
    TOM: "TUI Airways",        TCX: "Thomas Cook",        EXS: "Jet2",
    VIR: "Virgin Atlantic",    LOG: "Loganair",           FLB: "Flybe",
    BEE: "Flybe",              ENT: "Eastern Airways",    SHT: "British Airways Shuttle",
    AEU: "Aer Lingus",         EIN: "Aer Lingus",         RUK: "Ryanair UK",
    // Europe
    DLH: "Lufthansa",          AFL: "Aeroflot",           AFR: "Air France",
    KLM: "KLM",                IBE: "Iberia",             VLG: "Vueling",
    AZA: "ITA Airways",        AUA: "Austrian Airlines",  SAS: "Scandinavian Airlines",
    FIN: "Finnair",            TAP: "TAP Air Portugal",   THY: "Turkish Airlines",
    SWR: "Swiss",              BEL: "Brussels Airlines",  CSA: "Czech Airlines",
    WZZ: "Wizz Air",           NOZ: "Norwegian",          NAX: "Norwegian",
    // North America
    AAL: "American Airlines",  DAL: "Delta Air Lines",    UAL: "United Airlines",
    SWA: "Southwest Airlines", JBU: "JetBlue",            ASA: "Alaska Airlines",
    WJA: "WestJet",            ACA: "Air Canada",
    // Middle East & Asia
    UAE: "Emirates",           ETD: "Etihad Airways",     QTR: "Qatar Airways",
    SVA: "Saudia",             THM: "Air Arabia",         FDB: "flydubai",
    SIA: "Singapore Airlines", CPA: "Cathay Pacific",     JAL: "Japan Airlines",
    ANA: "All Nippon Airways",
    // Cargo
    UPS: "UPS Airlines",       FDX: "FedEx",              DHL: "DHL Air",
    BCS: "European Air Transport",
};

module.exports = NodeHelper.create({

    start: function () {
        console.log("[MMM-NearbyAircraft] Node helper started");
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "FETCH_AIRCRAFT") {
            this.fetchAircraft(payload);
        }
    },

    fetchAircraft: function (config) {
        const { lat, lon, radiusNm, count } = config;
        const url = `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${radiusNm}`;

        https.get(url, { headers: { "Accept": "application/json" } }, (res) => {
            let data = "";

            res.on("data", (chunk) => { data += chunk; });

            res.on("end", () => {
                try {
                    const json = JSON.parse(data);
                    const aircraft = (json.ac || [])
                        .filter(ac => ac.flight && ac.flight.trim() !== "")
                        .map(ac => this.mapAircraft(ac, lat, lon))
                        .sort((a, b) => {
                            if (a.military !== b.military) return a.military ? -1 : 1;
                            return a.distanceNm - b.distanceNm;
                        })
                        .slice(0, count);

                    this.sendSocketNotification("AIRCRAFT_DATA", { aircraft, timestamp: new Date().toLocaleTimeString() });
                } catch (e) {
                    console.error("[MMM-NearbyAircraft] Parse error:", e.message);
                    this.sendSocketNotification("AIRCRAFT_ERROR", { error: e.message });
                }
            });
        }).on("error", (e) => {
            console.error("[MMM-NearbyAircraft] Fetch error:", e.message);
            this.sendSocketNotification("AIRCRAFT_ERROR", { error: e.message });
        });
    },

    mapAircraft: function (ac, userLat, userLon) {
        const alt = ac.alt_baro === "ground" ? 0 : (ac.alt_baro || 0);

        return {
            icao:        ac.hex || "",
            callsign:    (ac.flight || "").trim(),
            type:        ac.t || "",
            description: ac.desc || "",
            registration: ac.r || "",
            operator:    this.resolveOperator(ac),
            altitude:    alt,
            groundSpeed: Math.round(ac.gs || 0),
            verticalRate: ac.baro_rate || 0,
            track:       ac.track != null ? ac.track : null,
            military:    ac.military === true || (ac.dbFlags & 1) === 1,
            distanceNm:  this.haversineNm(userLat, userLon, ac.lat || userLat, ac.lon || userLon),
            onGround:    ac.alt_baro === "ground"
        };
    },

    resolveOperator: function (ac) {
        if (ac.operator) return ac.operator;
        const callsign = (ac.flight || "").trim();
        if (callsign.length >= 3) {
            const prefix = callsign.substring(0, 3).toUpperCase();
            if (AIRLINE_MAP[prefix]) return AIRLINE_MAP[prefix];
        }
        return "";
    },

    haversineNm: function (lat1, lon1, lat2, lon2) {
        const R = 3440.065; // Earth radius in nautical miles
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },

    toRad: function (deg) {
        return deg * (Math.PI / 180);
    }
});
