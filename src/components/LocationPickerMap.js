import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoiem5lcmlnaHQiLCJhIjoiY21kZzFlaXd2MDM3NjJrczcwemVpMDlxOSJ9.EsDK4EfxFiml0EqsPS-F6g';

const INTRAMUROS_BOUNDS = [
    [120.9680, 14.5840],
    [120.9880, 14.6005],
];

const isInsideIntramuros = (lng, lat) => {
    const [swLng, swLat] = INTRAMUROS_BOUNDS[0];
    const [neLng, neLat] = INTRAMUROS_BOUNDS[1];
    return lng >= swLng && lng <= neLng && lat >= swLat && lat <= neLat;
};

const LocationPickerMap = ({ onLocationSelect }) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [120.9788, 14.5925],
            zoom: 13.5,
            maxBounds: INTRAMUROS_BOUNDS,
        });

        mapRef.current = map;

        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl,
            placeholder: 'Search within Intramuros...',
            bbox: [...INTRAMUROS_BOUNDS[0], ...INTRAMUROS_BOUNDS[1]],
            proximity: { longitude: 120.9788, latitude: 14.5925 },
        });

        map.addControl(geocoder);

        map.on('click', async (e) => {
            const { lng, lat } = e.lngLat;

            if (!isInsideIntramuros(lng, lat)) {
                alert('Please select a location within Intramuros.');
                return;
            }

            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
            );
            const data = await response.json();
            const address = data.features?.[0]?.place_name || 'Unknown location';

            if (markerRef.current) markerRef.current.remove();

            markerRef.current = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);

            if (typeof onLocationSelect === 'function') {
                onLocationSelect({ lng, lat, address });
            }
        });

    },);

    return (
        <div style={{ height: '300px', width: '100%', marginTop: '10px' }} ref={mapContainerRef}></div>
    );
};

export default LocationPickerMap;
