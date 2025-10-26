import React, { useEffect, useState, useRef, useCallback } from "react";
import { GOOGLE_MAPS_API_KEY } from "../config";

// --- INSTRUCTIONS FOR YOUR DATASET ---
// 1. Place your CSV data file in the same root directory as your index.html file.
// 2. Update the constant below to match your file's name.
// 3. Ensure your CSV has the columns: 'location_name', 'latitude', and 'longitude'.
const YOUR_DATASET_FILE = "/users.csv"; // e.g., 'users.csv'

// A small sample dataset to use as a fallback if your file isn't found.
const FALLBACK_CSV_DATA = `Userid,Name,Email,Status,"Last seen location (latitude, longitude)",Time of day,Day of the week,Month,Weather,Academic calendar events,Building
user1,John Doe,jd@osu.edu,active,"39.9992, -83.0149",10:00,Monday,April,Sunny,Finals,Thompson Library
user2,Jane Smith,js@osu.edu,idle,"39.9993, -83.0150",10:05,Monday,April,Sunny,Finals,Thompson Library
user3,Sam Ray,sr@osu.edu,active,"39.9991, -83.0148",10:07,Monday,April,Sunny,Finals,Thompson Library
user4,Lisa Ray,lr@osu.edu,active,"40.00167, -83.01337",11:00,Monday,April,Sunny,Finals,18th Avenue Library
user5,Mike P,mp@osu.edu,idle,"40.00170, -83.01340",11:02,Monday,April,Sunny,Finals,18th Avenue Library
user6,Pat Q,pq@osu.edu,active,"39.9977, -83.0086",12:00,Monday,April,Sunny,Finals,Ohio Union
`;

const studyLocations = [
  { name: "Thompson Library", center: { lat: 39.9992, lng: -83.0149 } },
  { name: "18th Avenue Library", center: { lat: 40.00167, lng: -83.01337 } },
  { name: "Knowlton Hall", center: { lat: 40.0036, lng: -83.0166 } },
  { name: "Ohio Union", center: { lat: 39.9977, lng: -83.0086 } },
  { name: "Orton Library", center: { lat: 39.9983, lng: -83.0119 } },
  { name: "Wexner Center", center: { lat: 40.00026, lng: -83.0094 } },
];

const Heatmap: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [heatmapData, setHeatmapData] = useState<any[][]>([]);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const mapsRef = useRef<any[]>([]);

  const loadScript = useCallback((src: string, id: string) => {
    return new Promise((resolve, reject) => {
      if (document.getElementById(id)) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.id = id;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error(`Script load error for ${src}`));
      document.head.appendChild(script);
    });
  }, []);

  useEffect(() => {
    // Only treat the API key as missing when it's falsy. We accept any
    // non-empty key (it can be provided via Vite as VITE_GOOGLE_MAPS_API_KEY
    // which `config.ts` reads into `GOOGLE_MAPS_API_KEY`).
    if (!GOOGLE_MAPS_API_KEY) {
      setApiKeyError(
        "Google Maps API key is missing. Please open config.ts in your project root and add your key."
      );
      return;
    }

    loadScript(
      `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=visualization`,
      "google-maps-script"
    )
      .then(() => {
        console.log(
          "Google Maps script loaded, window.google:",
          (window as any).google
        );
        setScriptsLoaded(true);
      })
      .catch((error) =>
        console.error("Failed to load Google Maps script:", error)
      );
  }, [loadScript]);

  // This useEffect handles loading and parsing the CSV data.
  useEffect(() => {
    const parseAndGroupData = (csvText: string) => {
      // Simple CSV line splitter that respects quoted fields.
      // A more robust CSV parsing function that handles quoted fields.
      const splitCSVLine = (line: string) => {
        const regex = /(?:,|^)("(?:[^"]|"")*"|[^,]*)/g;
        let matches: string[] = [];
        let match;
        while ((match = regex.exec(line))) {
          let value = match[1];
          // Strip leading/trailing quotes and un-escape double quotes
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1).replace(/""/g, '"');
          }
          matches.push(value);
        }
        return matches;
      };

      const allPoints: { name: string; lat: number; lng: number }[] = [];
      const lines = csvText.trim().split("\n");
      const rawHeader = lines.shift() || "";
      const headers = splitCSVLine(rawHeader).map((h) => h.trim());
      console.log("Parsed CSV Headers:", headers);

      const headerLower = headers.map((h) => h.toLowerCase());

      const hasStandard =
        headerLower.includes("location_name") &&
        headerLower.includes("latitude") &&
        headerLower.includes("longitude");

      if (hasStandard) {
        const nameIndex = headerLower.indexOf("location_name");
        const latIndex = headerLower.indexOf("latitude");
        const lngIndex = headerLower.indexOf("longitude");

        for (const line of lines) {
          if (!line.trim()) continue;
          const values = splitCSVLine(line);
          allPoints.push({
            name: values[nameIndex]?.trim() || "",
            lat: parseFloat(values[latIndex] || "NaN"),
            lng: parseFloat(values[lngIndex] || "NaN"),
          });
        }
      } else {
        // Try to parse other common formats like the provided users.csv which has
        // a combined "Last seen location (latitude, longitude)" column and a
        // "Building" column that can serve as the location name.
        // Find a coordinate column (one that contains 'latitude' and 'longitude' in the header
        // or something like 'last seen location').
        let coordIndex = -1;
        for (let i = 0; i < headerLower.length; i++) {
          const h = headerLower[i];
          if (
            h.includes("last seen") ||
            (h.includes("latitude") && h.includes("longitude")) ||
            /latitude.*longitude/.test(h)
          ) {
            coordIndex = i;
            break;
          }
          // Some headers include parentheses: "Last seen location (latitude, longitude)"
          if (
            h.includes("(") &&
            h.includes("latitude") &&
            h.includes("longitude")
          ) {
            coordIndex = i;
            break;
          }
        }

        console.log("Found coordinate column at index:", coordIndex);
        const buildingIndex = headerLower.indexOf("building");

        // Fallback: if we couldn't find a coord column, log and return empty groups.
        if (coordIndex === -1) {
          console.error(
            "CSV must contain either 'location_name/latitude/longitude' columns or a combined coordinate column."
          );
          return [];
        }

        const toClosestLocationName = (lat: number, lng: number) => {
          let best = studyLocations[0];
          let bestDist = Infinity;
          for (const loc of studyLocations) {
            const dlat = lat - loc.center.lat;
            const dlng = lng - loc.center.lng;
            const dist = dlat * dlat + dlng * dlng;
            if (dist < bestDist) {
              bestDist = dist;
              best = loc;
            }
          }
          return best.name;
        };

        for (const line of lines) {
          if (!line.trim()) continue;
          const values = splitCSVLine(line);
          const coordRaw = values[coordIndex] || "";
          // coordRaw may be like:  "40.001529, -83.013037"  (with quotes removed by splitter)
          const coordParts = coordRaw.split(",").map((s) => s.trim());
          if (coordParts.length < 2) continue;
          const lat = parseFloat(coordParts[0]);
          const lng = parseFloat(coordParts[1]);
          if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

          let name = "";
          if (buildingIndex !== -1) {
            name = (values[buildingIndex] || "").trim();
          }
          if (!name) {
            name = toClosestLocationName(lat, lng);
          }

          allPoints.push({ name, lat, lng });
          console.log(`Parsed point: Name='${name}', Lat=${lat}, Lng=${lng}`);
        }
      }

      // Group points by the known studyLocations (case-insensitive match of names).
      return studyLocations.map((location) =>
        allPoints.filter(
          (point) =>
            point.name?.trim().toLowerCase() === location.name.toLowerCase()
        )
      );
    };

    const loadData = async () => {
      try {
        const response = await fetch(YOUR_DATASET_FILE);
        if (!response.ok) {
          throw new Error(
            `File not found or network error. Status: ${response.status}`
          );
        }
        const csvText = await response.text();
        console.log(
          `Successfully loaded custom dataset from '${YOUR_DATASET_FILE}'.`
        );
        const groupedData = parseAndGroupData(csvText);
        setHeatmapData(groupedData);
      } catch (error) {
        console.warn(
          `Could not load custom dataset. Falling back to sample data. Error:`,
          error
        );
        const groupedData = parseAndGroupData(FALLBACK_CSV_DATA);
        setHeatmapData(groupedData);
      }
    };

    loadData();
  }, []);

  // This useEffect initializes the maps and heatmaps once scripts and data are ready.
  useEffect(() => {
    if (!scriptsLoaded || heatmapData.length === 0) return;
    const { google } = window as any;
    if (!google) return;

    const localMaps: any[] = [];
    const localHeatmaps: any[] = [];

    studyLocations.forEach((loc, i) => {
      const mapElement = mapElementsRef.current[i];
      if (!mapElement || mapsRef.current[i]) return; // Don't re-initialize

      const map = new google.maps.Map(mapElement, {
        center: loc.center,
        zoom: 18,
        disableDefaultUI: true,
        draggable: false,
        scrollwheel: false,
        disableDoubleClickZoom: true,
        styles: [
          // Dark mode for maps
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          {
            elementType: "labels.text.stroke",
            stylers: [{ color: "#242f3e" }],
          },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#263c3f" }],
          },
          {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6b9a76" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#746855" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#1f2835" }],
          },
          {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#f3d19c" }],
          },
          {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#2f3948" }],
          },
          {
            featureType: "transit.station",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
          },
          {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#515c6d" }],
          },
          {
            featureType: "water",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#17263c" }],
          },
        ],
      });

      const googlePoints =
        heatmapData[i]?.map((point) => ({
          location: new google.maps.LatLng(point.lat, point.lng),
          weight: 2, // You can add a 'weight' column to your CSV for more detail
        })) || [];

      const gradient = [
        "rgba(0, 255, 0, 0)",
        "rgba(0, 255, 0, 1)",
        "rgba(255, 255, 0, 1)",
        "rgba(255, 165, 0, 1)",
        "rgba(255, 0, 0, 1)",
      ];

      const heatmap = new google.maps.visualization.HeatmapLayer({
        data: googlePoints,
        map: map,
        radius: 12, // Drastically reduced radius for small, distinct circles
        opacity: 0.6, // Slightly increased opacity for better visibility
        maxIntensity: 10, // Increased intensity to show "hot" areas with smaller radius
        gradient: gradient,
      });

      console.log(`Initialized map for ${loc.name}:`, {
        map,
        heatmap,
        points: googlePoints.length,
      });

      localMaps.push(map);
      localHeatmaps.push(heatmap);
    });

    mapsRef.current = localMaps;
  }, [scriptsLoaded, heatmapData]);

  const refreshVisibleMap = useCallback(() => {
    const { google } = window as any;
    if (!google) return;

    const map = mapsRef.current[currentSlide];
    if (map) {
      const center = studyLocations[currentSlide].center;
      requestAnimationFrame(() => {
        google.maps.event.trigger(map, "resize");
        map.setCenter(center);
      });
    }
  }, [currentSlide]);

  useEffect(() => {
    if (mapContainerRef.current) {
      const slideWidth = mapContainerRef.current.offsetWidth;
      mapContainerRef.current.style.transform = `translateX(-${
        currentSlide * slideWidth
      }px)`;
      refreshVisibleMap();
    }
  }, [currentSlide, refreshVisibleMap]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentSlide((prev) =>
      prev < studyLocations.length - 1 ? prev + 1 : prev
    );
  };

  if (apiKeyError) {
    return (
      <div className="w-full text-center p-6 bg-red-900/50 border border-red-700 rounded-lg">
        <h2 className="text-2xl font-bold text-red-300">Configuration Error</h2>
        <p className="mt-2 text-red-400">{apiKeyError}</p>
      </div>
    );
  }

  return (
    <div className="w-full text-center">
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
        Live Study Spot Heatmaps
      </h2>
      <p className="mt-2 mb-6 text-md text-gray-400">
        Busyness at popular OSU locations based on user data.
      </p>

      <div className="relative w-full max-w-lg mx-auto overflow-hidden rounded-lg border border-gray-800 shadow-2xl">
        <div
          ref={mapContainerRef}
          className="flex transition-transform duration-300 ease-in-out"
        >
          {studyLocations.map((loc, i) => (
            <div key={loc.name} className="min-w-full h-96 bg-gray-800">
              <div
                ref={(el) => {
                  mapElementsRef.current[i] = el;
                }}
                className="w-full h-full"
              ></div>
            </div>
          ))}
        </div>

        <button
          onClick={handlePrev}
          disabled={currentSlide === 0}
          className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 z-10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={handleNext}
          disabled={currentSlide === studyLocations.length - 1}
          className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 z-10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {studyLocations.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors cursor-pointer ${
              currentSlide === i ? "bg-white" : "bg-gray-600"
            }`}
            onClick={() => setCurrentSlide(i)}
          ></div>
        ))}
      </div>
      <p className="text-sm text-white mt-4 font-semibold">
        {studyLocations[currentSlide].name}
      </p>
    </div>
  );
};

export default Heatmap;
