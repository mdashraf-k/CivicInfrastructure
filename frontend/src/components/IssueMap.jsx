import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { getImageUrl } from '../api/client';
import { Link } from 'react-router-dom';

// Custom Marker Icons for Leaflet
const createCustomIcon = (level, isPicker = false) => {
  if (isPicker) {
    const svgPicker = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0284c7" width="36" height="36" stroke="#ffffff" stroke-width="2">
        <circle cx="12" cy="12" r="8" fill="#0284c7" fill-opacity="0.4"/>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>`;
    return L.divIcon({
      html: svgPicker,
      className: 'custom-picker-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });
  }

  let color = '#0284c7';
  if (level === 'Critical') color = '#e11d48';
  else if (level === 'High') color = '#f97316';
  else if (level === 'Medium') color = '#f59e0b';
  else if (level === 'Low') color = '#10b981';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32" stroke="#ffffff" stroke-width="1.5">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Component to dynamically re-center Leaflet view when GPS coordinates update
const MapRecenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom);
    }
  }, [center[0], center[1], zoom, map]);
  return null;
};

// Click handler component for interactive location picker
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

export const IssueMap = ({
  center = [37.7749, -122.4194],
  zoom = 13,
  issues = [],
  radiusMeters = 0,
  onMarkerClick = null,
  onLocationSelect = null,
  selectedLocation = null, // [lat, lng] for interactive pin selection
  height = '500px'
}) => {
  const pickerPosition = selectedLocation || center;

  const eventHandlers = useMemo(
    () => ({
      dragend(e) {
        const marker = e.target;
        if (marker != null && onLocationSelect) {
          const latLng = marker.getLatLng();
          onLocationSelect(latLng.lat, latLng.lng);
        }
      },
    }),
    [onLocationSelect]
  );

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-slate-800 shadow-xl relative z-10">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Dynamic Map View Recenter Listener */}
        <MapRecenter center={center} zoom={zoom} />

        {/* Map Click Listener for interactive location picker */}
        {onLocationSelect && <MapClickHandler onLocationSelect={onLocationSelect} />}

        {/* Draggable location picker marker when onLocationSelect is provided */}
        {onLocationSelect && (
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={pickerPosition}
            icon={createCustomIcon('Critical', true)}
          >
            <Popup>
              <div className="text-xs font-bold text-sky-400 p-1">
                📍 Geotagged Location<br />
                <span className="text-[10px] text-slate-300 font-normal">
                  Drag pin or click map to adjust GPS point
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Radius circle */}
        {radiusMeters > 0 && (
          <Circle
            center={center}
            radius={radiusMeters}
            pathOptions={{ color: '#0284c7', fillColor: '#0284c7', fillOpacity: 0.1, weight: 1.5, dashArray: '4, 4' }}
          />
        )}

        {/* Issue Markers */}
        {issues.map((issue) => {
          const lat = parseFloat(issue.latitude);
          const lng = parseFloat(issue.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          const imagePath = issue.images && issue.images.length > 0 ? issue.images[0].storage_path : null;

          return (
            <Marker
              key={issue.id}
              position={[lat, lng]}
              icon={createCustomIcon(issue.priority_level)}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(issue)
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="w-64 p-1">
                  {imagePath && (
                    <img
                      src={getImageUrl(imagePath)}
                      alt={issue.category}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                  )}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <StatusBadge status={issue.status} />
                    <PriorityBadge score={issue.priority_score} level={issue.priority_level} showScore={false} />
                  </div>
                  <h4 className="font-bold text-sm text-white line-clamp-1">
                    {issue.title || issue.category}
                  </h4>
                  <p className="text-xs text-slate-300 capitalize mb-2">
                    Category: {issue.category}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-700 text-xs text-slate-400">
                    <span>👍 {issue.support_count} support</span>
                    <Link
                      to={`/issues/${issue.id}`}
                      className="text-sky-400 font-semibold hover:underline"
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
