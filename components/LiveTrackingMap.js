import React, { useEffect, useRef, useState } from 'react';
import { 
  Bike, 
  MapPin, 
  Store, 
  Navigation, 
  Maximize2, 
  Crosshair, 
  Compass, 
  Phone,
  ShieldCheck,
  Zap,
  Clock
} from 'lucide-react';
import { io } from 'socket.io-client';
export default function LiveTrackingMap({ 
  order, 
  socket,
  t = (key) => key 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);

  // Default Chitral Town Center coordinates
  const defaultRestaurantCoord = [35.8520, 71.7850];
  const defaultCustomerCoord = [35.8480, 71.7910];

  // Coordinates from order or fallback
  const restLat = order?.restaurantId?.location?.lat || defaultRestaurantCoord[0];
  const restLng = order?.restaurantId?.location?.lng || defaultRestaurantCoord[1];

  const custLat = order?.customerAddress?.coordinates?.lat || defaultCustomerCoord[0];
  const custLng = order?.customerAddress?.coordinates?.lng || defaultCustomerCoord[1];

  // Rider position state (starts between restaurant and customer)
  const initialRiderLat = order?.assignedDriverId?.currentLocation?.lat || (restLat + (custLat - restLat) * 0.35);
  const initialRiderLng = order?.assignedDriverId?.currentLocation?.lng || (restLng + (custLng - restLng) * 0.35);

  const [riderPos, setRiderPos] = useState({ lat: initialRiderLat, lng: initialRiderLng });
  const [speed, setSpeed] = useState(28); // km/h
  const [etaMinutes, setEtaMinutes] = useState(Math.max(5, Math.round(order?.prepTimeMinutes ? order.prepTimeMinutes / 2 : 8)));
  const [distanceKm, setDistanceKm] = useState(1.4);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;

    let L;
    let map;

    async function initMap() {
      try {
        L = (await import('leaflet')).default;

        // Fix leaflet's default icon path issue
        delete L.Icon.Default.prototype._getIconUrl;

        // Clean up previous instance if exists
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Create Map
        map = L.map(mapContainerRef.current, {
          center: [(restLat + custLat) / 2, (restLng + custLng) / 2],
          zoom: 14,
          zoomControl: false,
        });

        // Add clean street tiles (CartoDB Positron / OSM clean)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapInstanceRef.current = map;

        // Custom HTML Icons
        const restaurantIcon = L.divIcon({
          className: 'custom-rest-marker',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 36px; height: 36px; background: rgba(245, 158, 11, 0.3); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="background: #1e293b; color: #f59e0b; width: 34px; height: 34px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
                🏪
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const customerIcon = L.divIcon({
          className: 'custom-cust-marker',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 38px; height: 38px; background: rgba(16, 185, 129, 0.3); border-radius: 50%; animation: pulse 2s infinite;"></div>
              <div style="background: #065f46; color: #ffffff; width: 34px; height: 34px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
                🏠
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const riderIcon = L.divIcon({
          className: 'custom-rider-marker',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 44px; height: 44px; background: rgba(2, 132, 199, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="background: #0284c7; color: #ffffff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid #ffffff; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.5);">
                🛵
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        // Add Restaurant Marker
        L.marker([restLat, restLng], { icon: restaurantIcon })
          .addTo(map)
          .bindPopup(`<b>${order?.restaurantId?.name || 'Restaurant Kitchen'}</b><br/><span style="font-size:11px;color:#64748b;">${order?.restaurantId?.locality || 'Chitral Town'}</span>`);

        // Add Customer Marker
        L.marker([custLat, custLng], { icon: customerIcon })
          .addTo(map)
          .bindPopup(`<b>${order?.customerName || 'Delivery Drop-off'}</b><br/><span style="font-size:11px;color:#64748b;">${order?.customerAddress?.streetAddress || ''}, ${order?.customerAddress?.locality || ''}</span>`);

        // Add Rider Marker
        const riderMarker = L.marker([initialRiderLat, initialRiderLng], { icon: riderIcon })
          .addTo(map)
          .bindPopup(`<b>${order?.assignedDriverId?.name || 'Qashqar Rider'}</b><br/><span style="font-size:11px;color:#0284c7;">🛵 Live Rider GPS • 03426522787</span>`);

        riderMarkerRef.current = riderMarker;

        // Waypoints route polyline (with gentle valley curve simulation)
        const midLat = (restLat + custLat) / 2 + 0.0012;
        const midLng = (restLng + custLng) / 2 + 0.0018;

        const routeCoords = [
          [restLat, restLng],
          [midLat, midLng],
          [custLat, custLng],
        ];

        const routeLine = L.polyline(routeCoords, {
          color: '#0284c7',
          weight: 5,
          opacity: 0.85,
          dashArray: '8, 8',
          lineCap: 'round',
        }).addTo(map);

        routePolylineRef.current = routeLine;

        // Fit bounds to show both restaurant and customer
        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

      } catch (err) {
        console.error('Failed to initialize Leaflet Map:', err);
      }
    }

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, restLat, restLng, custLat, custLng]);

  // Live real-time Rider movement simulation along route
  useEffect(() => {
    if (!order || order.status === 'delivered' || order.status === 'cancelled') return;

    let step = 0;
    const totalSteps = 100;

    const interval = setInterval(() => {
      step = (step + 1) % totalSteps;
      const progress = step / totalSteps;

      // Interpolate along route
      const curLat = restLat + (custLat - restLat) * progress;
      const curLng = restLng + (custLng - restLng) * progress;

      setRiderPos({ lat: curLat, lng: curLng });

      // Update rider marker on Leaflet map
      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng([curLat, curLng]);
      }

      // Calculate distance and ETA
      const remainingDist = Math.max(0.1, (1.8 * (1 - progress))).toFixed(1);
      const remainingEta = Math.max(1, Math.round(8 * (1 - progress)));
      const simulatedSpeed = Math.floor(25 + Math.random() * 8);

      setDistanceKm(remainingDist);
      setEtaMinutes(remainingEta);
      setSpeed(simulatedSpeed);
    }, 2500);

    return () => clearInterval(interval);
  }, [order, restLat, restLng, custLat, custLng]);

const socketRef = useRef(socket || (typeof window !== 'undefined' ? io() : null));

  // Socket listener for real-time driver updates from server
  useEffect(() => {
    const activeSocket = socketRef.current;
    if (!activeSocket) return;

    const handleDriverLoc = (data) => {
      if (data.lat && data.lng) {
        setRiderPos({ lat: data.lat, lng: data.lng });
        if (riderMarkerRef.current) {
          riderMarkerRef.current.setLatLng([data.lat, data.lng]);
        }
        if (data.speedKmH) setSpeed(data.speedKmH);
      }
    };

    activeSocket.on('driver:location_update', handleDriverLoc);
    return () => {
      activeSocket.off('driver:location_update', handleDriverLoc);
    };
  }, [socketRef]);

  const recenterOnRider = () => {
    if (mapInstanceRef.current && riderPos) {
      mapInstanceRef.current.setView([riderPos.lat, riderPos.lng], 16, { animate: true });
    }
  };

  const fitFullRoute = () => {
    if (mapInstanceRef.current && routePolylineRef.current) {
      mapInstanceRef.current.fitBounds(routePolylineRef.current.getBounds(), { padding: [50, 50], animate: true });
    }
  };

  const riderName = order?.assignedDriverId?.name || 'Karim Ullah';
  const riderPlate = order?.assignedDriverId?.vehiclePlate || 'CH-2024-884';
  const riderVehicle = order?.assignedDriverId?.vehicleType || 'Honda CD70 Motorcycle';
  const isDelivered = order?.status === 'delivered';

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md">
      
      {/* Map Header / Live Status Bar (Uber Style) */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-qashqar-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center font-bold text-xl">
            🛵
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                {t('liveTrackingTitle')} • Chitral Valley GPS
              </span>
            </div>
            <h3 className="font-extrabold text-base text-white mt-0.5">
              {isDelivered ? t('orderDelivered') : `${riderName} ${t('riderOnTheWay')}`}
            </h3>
          </div>
        </div>

        {/* Telemetry Live Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">{t('etaRemaining')}</span>
            <span className="text-sm font-black text-amber-400">
              {isDelivered ? 'Arrived' : `~${etaMinutes} mins`}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">{t('distanceRemaining')}</span>
            <span className="text-sm font-black text-white">
              {isDelivered ? '0.0 km' : `${distanceKm} km`}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">{t('riderSpeed')}</span>
            <span className="text-sm font-black text-sky-300">
              {isDelivered ? '0 km/h' : `${speed} km/h`}
            </span>
          </div>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div className="relative w-full h-[380px] sm:h-[440px] bg-slate-100">
        
        {/* Leaflet DOM container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Uber-style Map Floating Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={recenterOnRider}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl shadow-lg border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            title="Recenter on Rider"
          >
            <Crosshair className="w-4 h-4 text-sky-600" />
            <span className="hidden sm:inline">{t('recenterMap')}</span>
          </button>

          <button
            onClick={fitFullRoute}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl shadow-lg border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            title="Fit Full Route"
          >
            <Maximize2 className="w-4 h-4 text-slate-700" />
            <span className="hidden sm:inline">Route</span>
          </button>
        </div>

        {/* Legend Banner on bottom-left of map */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 shadow-lg text-[11px] font-bold text-slate-800 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>{order?.restaurantId?.name?.slice(0, 16) || 'Restaurant'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
            <span>Rider ({riderName})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Your Address</span>
          </div>
        </div>
      </div>

      {/* Driver Card Footer (Like Uber Rider Card) */}
      <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 text-white flex items-center justify-center font-black text-xl shadow-md">
              🛵
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-base text-slate-900 leading-tight">
                {riderName}
              </h4>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                ⭐ 4.9 (Chitral Valley Rider)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {riderVehicle} • Plate: <b className="text-slate-800 font-mono">{riderPlate}</b> • Hotline: <b>03426522787</b>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            href="tel:03426522787"
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{t('callRider')}</span>
          </a>

          <a
            href="https://wa.me/923426522787"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

    </div>
  );
}
