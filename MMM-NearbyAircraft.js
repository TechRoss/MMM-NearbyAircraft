Module.register("MMM-NearbyAircraft", {

    defaults: {
        lat: 52.2853,
        lon: -1.5200,
        radiusNm: 25,
        count: 10,
        updateIntervalSeconds: 15,
        showOperator: true,
        showDistance: true,
        showSpeed: true,
        title: "NEARBY AIRCRAFT",
        militaryAlert: true
    },

    requiresVersion: "2.1.0",

    start: function () {
        this.aircraft = [];
        this.timestamp = null;
        this.error = null;
        this.loaded = false;
        this.scheduleUpdate();
    },

    scheduleUpdate: function () {
        this.fetchAircraft();
        setInterval(() => {
            this.fetchAircraft();
        }, this.config.updateIntervalSeconds * 1000);
    },

    fetchAircraft: function () {
        this.sendSocketNotification("FETCH_AIRCRAFT", {
            lat: this.config.lat,
            lon: this.config.lon,
            radiusNm: this.config.radiusNm,
            count: this.config.count
        });
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "AIRCRAFT_DATA") {
            this.aircraft = payload.aircraft;
            this.timestamp = payload.timestamp;
            this.error = null;
            this.loaded = true;
            this.updateDom(300);
        } else if (notification === "AIRCRAFT_ERROR") {
            this.error = payload.error;
            this.loaded = true;
            this.updateDom(300);
        }
    },


    getHeader: function () {
        return this.config.title;
    },

    getDom: function () {
        const wrapper = document.createElement("div");
        wrapper.className = "mmm-nearby-aircraft";

        if (!this.loaded) {
            const loading = document.createElement("div");
            loading.className = "mna-status";
            loading.textContent = "Scanning...";
            wrapper.appendChild(loading);
            return wrapper;
        }

        if (this.error) {
            const err = document.createElement("div");
            err.className = "mna-status mna-error";
            err.textContent = "No signal";
            wrapper.appendChild(err);
            return wrapper;
        }

        if (this.aircraft.length === 0) {
            const empty = document.createElement("div");
            empty.className = "mna-status";
            empty.textContent = `No aircraft within ${this.config.radiusNm}nm`;
            wrapper.appendChild(empty);
        } else {
            const table = document.createElement("table");
            table.className = "mna-table";

            this.aircraft.forEach(ac => {
                const row = document.createElement("tr");
                const isMil = this.config.militaryAlert && ac.military;
                row.className = isMil ? "mna-row mna-row-military" : "mna-row";

                // Altitude colour bar
                const barCell = document.createElement("td");
                barCell.className = "mna-bar-cell";
                const bar = document.createElement("div");
                bar.className = "mna-alt-bar";
                bar.style.backgroundColor = this.altitudeColor(ac.altitude, ac.onGround);
                barCell.appendChild(bar);
                row.appendChild(barCell);

                // Heading icon
                const headingCell = document.createElement("td");
                headingCell.className = "mna-heading-cell";
                const icon = document.createElement("span");
                icon.className = isMil ? "mna-heading-icon mna-heading-icon-military" : "mna-heading-icon";
                icon.textContent = "✈";
                if (ac.track != null) {
                    // ✈ naturally points right (90°), so offset by -90 to make 0° = north
                    icon.style.transform = `rotate(${ac.track - 90}deg)`;
                }
                headingCell.appendChild(icon);
                row.appendChild(headingCell);

                // Callsign
                const callCell = document.createElement("td");
                callCell.className = "mna-callsign";
                if (isMil) {
                    callCell.innerHTML = `${ac.callsign} <span class="mna-mil-badge">MIL</span>`;
                } else {
                    callCell.textContent = ac.callsign;
                }
                row.appendChild(callCell);

                // Type / operator
                const infoCell = document.createElement("td");
                infoCell.className = "mna-info";
                const typeStr = ac.description || ac.type || "—";
                const opStr = this.config.showOperator && ac.operator ? ac.operator : null;
                infoCell.innerHTML = opStr
                    ? `<span class="mna-type">${typeStr}</span><br><span class="mna-operator">${opStr}</span>`
                    : `<span class="mna-type">${typeStr}</span>`;
                row.appendChild(infoCell);

                // Altitude + vspeed arrow
                const altCell = document.createElement("td");
                altCell.className = "mna-altitude";
                const altStr = ac.onGround ? "GND" : `${Math.round(ac.altitude).toLocaleString()}ft`;
                const arrow = this.verticalArrow(ac.verticalRate);
                altCell.style.color = this.altitudeColor(ac.altitude, ac.onGround);
                altCell.innerHTML = `${altStr} <span class="mna-arrow">${arrow}</span>`;
                row.appendChild(altCell);

                // Speed (optional)
                if (this.config.showSpeed) {
                    const spdCell = document.createElement("td");
                    spdCell.className = "mna-speed";
                    spdCell.textContent = ac.onGround ? "" : `${ac.groundSpeed}kt`;
                    row.appendChild(spdCell);
                }

                // Distance (optional)
                if (this.config.showDistance) {
                    const distCell = document.createElement("td");
                    distCell.className = "mna-distance";
                    distCell.textContent = `${ac.distanceNm.toFixed(1)}nm`;
                    row.appendChild(distCell);
                }

                table.appendChild(row);
            });

            wrapper.appendChild(table);
        }

        // Footer
        if (this.timestamp) {
            const footer = document.createElement("div");
            footer.className = "mna-footer";
            footer.textContent = `Updated ${this.timestamp}`;
            wrapper.appendChild(footer);
        }

        return wrapper;
    },

    altitudeColor: function (alt, onGround) {
        if (onGround || alt === 0)  return "#8B949E";
        if (alt < 2500)             return "#F85149";
        if (alt < 5000)             return "#FF7B2E";
        if (alt < 10000)            return "#FF9500";
        if (alt < 15000)            return "#FFCC02";
        if (alt < 20000)            return "#A3D977";
        if (alt < 25000)            return "#3FB950";
        if (alt < 30000)            return "#26C6DA";
        if (alt < 35000)            return "#58A6FF";
        return "#7B9EBD";
    },

    verticalArrow: function (rate) {
        if (!rate || Math.abs(rate) < 64) return "→";
        return rate > 0 ? "↑" : "↓";
    },

    getStyles: function () {
        return ["MMM-NearbyAircraft.css"];
    }
});
