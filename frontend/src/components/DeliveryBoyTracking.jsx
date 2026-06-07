import React from 'react'
import scooter from "../assets/scooter.png"
import home from "../assets/home.png"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'

const deliveryBoyIcon = new L.Icon({
    iconUrl: scooter,
    iconSize: [45, 45],
    iconAnchor: [22, 45],
    popupAnchor: [0, -40]
})

const customerIcon = new L.Icon({
    iconUrl: home,
    iconSize: [45, 45],
    iconAnchor: [22, 45],
    popupAnchor: [0, -40]
})

const shopIcon = new L.divIcon({
    html: `<div style="font-size: 35px; background: white; border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">🏪</div>`,
    className: 'custom-shop-icon',
    iconSize: [45, 45],
    iconAnchor: [22, 45],
    popupAnchor: [0, -40]
})

// Auto-adjust bounds to fit the route gracefully
function MapController({ routePath, fallbackPoints }) {
    const map = useMap()

    React.useEffect(() => {
        if (routePath && routePath.length > 0) {
            const bounds = L.latLngBounds(routePath)
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
        } else if (fallbackPoints && fallbackPoints.length >= 2) {
            // Filter out any undefined/null points before calculating bounds
            const validPoints = fallbackPoints.filter(p => p[0] !== undefined && p[1] !== undefined);
            if (validPoints.length >= 2) {
                const bounds = L.latLngBounds(validPoints)
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
            }
        }
    }, [map, routePath, fallbackPoints])

    return null
}

function DeliveryBoyTracking({ data }) {
    const deliveryBoyLat = data.deliveryBoyLocation.lat
    const deliveryBoylon = data.deliveryBoyLocation.lon
    const customerLat = data.customerLocation?.lat
    const customerlon = data.customerLocation?.lon
    const shopLat = data.shopLocation?.lat
    const shoplon = data.shopLocation?.lon

    const [routePath, setRoutePath] = React.useState([])
    const [deliveryLocName, setDeliveryLocName] = React.useState("Locating...")
    const [customerLocName, setCustomerLocName] = React.useState("Locating...")
    const [shopLocName, setShopLocName] = React.useState("Locating...")

    // Reverse geocoding function
    const fetchLocationName = async (lat, lon, setter) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`)
            const data = await response.json()
            if (data && data.address) {
                // Try to get the most relevant local name
                const name = data.address.neighbourhood || data.address.suburb || data.address.road || data.address.city_district || "Unknown Area"
                setter(name)
            } else {
                setter("Unknown Area")
            }
        } catch (error) {
            console.error("Geocoding error:", error)
            setter("Area unavailable")
        }
    }

    React.useEffect(() => {
        if (deliveryBoyLat && deliveryBoylon) fetchLocationName(deliveryBoyLat, deliveryBoylon, setDeliveryLocName)
        if (customerLat && customerlon) fetchLocationName(customerLat, customerlon, setCustomerLocName)
        if (shopLat && shoplon) fetchLocationName(shopLat, shoplon, setShopLocName)
    }, [deliveryBoyLat, deliveryBoylon, customerLat, customerlon, shopLat, shoplon])

    React.useEffect(() => {
        const fetchRoute = async () => {
            try {
                // If shop exists, route Boy -> Shop -> Customer
                let coordsString = `${deliveryBoylon},${deliveryBoyLat};${customerlon},${customerLat}`
                if (shopLat && shoplon) {
                    coordsString = `${deliveryBoylon},${deliveryBoyLat};${shoplon},${shopLat};${customerlon},${customerLat}`
                }

                // OSRM expects coordinates in lon, lat order
                const response = await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`
                )
                const routeData = await response.json()
                if (routeData.routes && routeData.routes.length > 0) {
                    const coordinates = routeData.routes[0].geometry.coordinates
                    // OSRM returns [lon, lat], Leaflet expects [lat, lon]
                    const latLngs = coordinates.map(coord => [coord[1], coord[0]])
                    setRoutePath(latLngs)
                }
            } catch (error) {
                console.error("Error fetching route from OSRM:", error)
            }
        }

        if (deliveryBoyLat && deliveryBoylon && customerLat && customerlon) {
            fetchRoute()
        }
    }, [deliveryBoyLat, deliveryBoylon, customerLat, customerlon, shopLat, shoplon])

    const center = [deliveryBoyLat || 19.3917, deliveryBoylon || 72.8397]
    const fallbackPath = [
        [deliveryBoyLat, deliveryBoylon],
        ...(shopLat !== undefined && shoplon !== undefined ? [[shopLat, shoplon]] : []),
        [customerLat, customerlon]
    ].filter(p => p[0] !== undefined && p[1] !== undefined)

    return (
        <div className='w-full h-[450px] mt-4 rounded-3xl overflow-hidden shadow-2xl border border-gray-200 relative group transition-all duration-300 hover:shadow-red-900/10'>

            {/* Live Indicator Overlay */}
            <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2 transform transition-transform group-hover:scale-105">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm font-bold text-gray-800 tracking-tight">Live Tracking</span>
            </div>

            <MapContainer
                className="w-full h-full z-0"
                center={center}
                zoom={14}
                zoomControl={false}
            >
                {/* 
                  Google Maps Standard Tiles 
                  Displays the exact look and feel of Google Maps. 
                */}
                <TileLayer
                    url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    attribution='&copy; Google Maps'
                />

                <MapController routePath={routePath} fallbackPoints={fallbackPath} />

                {deliveryBoyLat && deliveryBoylon && (
                    <Marker position={[deliveryBoyLat, deliveryBoylon]} icon={deliveryBoyIcon}>
                        <Popup className="font-bold text-gray-800 shadow-xl rounded-xl" autoPan={false}>
                            <div className="flex flex-col items-center min-w-[120px]">
                                <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Partner Location</span>
                                <div className="flex items-center gap-2 text-[#e23744]">
                                    <span className="text-xl">🛵</span>
                                    <span className="truncate max-w-[150px]">{deliveryLocName}</span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {shopLat && shoplon && (
                    <Marker position={[shopLat, shoplon]} icon={shopIcon} zIndexOffset={50}>
                        <Popup className="font-bold text-gray-800 shadow-xl rounded-xl" autoPan={false}>
                            <div className="flex flex-col items-center min-w-[120px]">
                                <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pickup Store</span>
                                <div className="flex items-center gap-2 text-orange-600">
                                    <span className="text-xl">🏪</span>
                                    <span className="truncate max-w-[150px]">{shopLocName}</span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {customerLat && customerlon && (
                    <Marker position={[customerLat, customerlon]} icon={customerIcon}>
                        <Popup className="font-bold text-gray-800 shadow-xl rounded-xl" autoPan={false}>
                            <div className="flex flex-col items-center min-w-[120px]">
                                <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Drop Location</span>
                                <div className="flex items-center gap-2 text-green-600">
                                    <span className="text-xl">🏠</span>
                                    <span className="truncate max-w-[150px]">{customerLocName}</span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Display elegant route with outer glow for premium feel */}
                {routePath.length > 0 ? (
                    <>
                        {/* Glow / shadow line */}
                        <Polyline positions={routePath} color='#e23744' weight={10} opacity={0.15} lineJoin="round" lineCap="round" />

                        {/* Core path */}
                        <Polyline positions={routePath} color='#e23744' weight={4} opacity={0.9} lineJoin="round" lineCap="round" dashArray="8, 10" />
                    </>
                ) : (
                    // Fallback to straight line if API fails
                    <Polyline positions={fallbackPath} color='#e23744' weight={4} dashArray="8, 10" opacity={0.4} />
                )}

            </MapContainer>
        </div>
    )
}

export default DeliveryBoyTracking
