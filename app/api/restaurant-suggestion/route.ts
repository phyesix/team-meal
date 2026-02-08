import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const searchQuery = searchParams.get('query') || ''
        const lat = searchParams.get('lat') || '41.0082' // Default: Istanbul
        const lon = searchParams.get('lon') || '28.9784'

        // If no search query, return a random nearby restaurant (for the button)
        if (!searchQuery) {
            const radius = searchParams.get('radius') || '2000'
            const query = `
                [out:json];
                (
                    node["amenity"="restaurant"](around:${radius},${lat},${lon});
                    way["amenity"="restaurant"](around:${radius},${lat},${lon});
                );
                out body 50;
            `

            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: query,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch restaurants from OpenStreetMap')
            }

            const data = await response.json()
            const restaurants = data.elements?.filter((el: any) => el.tags?.name) || []

            if (restaurants.length === 0) {
                return NextResponse.json({
                    name: 'Restoran bulunamadı',
                    cuisine: 'Genel',
                    address: ''
                })
            }

            const randomRestaurant = restaurants[Math.floor(Math.random() * restaurants.length)]
            return NextResponse.json({
                name: randomRestaurant.tags.name,
                cuisine: randomRestaurant.tags.cuisine || 'Genel',
                address: randomRestaurant.tags['addr:street'] || '',
                phone: randomRestaurant.tags.phone || '',
                website: randomRestaurant.tags.website || ''
            })
        }

        // Use Nominatim for name-based search
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(searchQuery + ' restoran')}&` +
            `format=json&` +
            `addressdetails=1&` +
            `limit=10&` +
            `countrycodes=tr&` +  // Turkey
            `viewbox=${parseFloat(lon) - 0.5},${parseFloat(lat) + 0.5},${parseFloat(lon) + 0.5},${parseFloat(lat) - 0.5}&` +
            `bounded=0`

        const response = await fetch(nominatimUrl, {
            headers: {
                'User-Agent': 'TeamMealApp/1.0'  // Required by Nominatim
            }
        })

        if (!response.ok) {
            throw new Error('Failed to search restaurants')
        }

        const data = await response.json()

        // Map results to restaurant format
        const suggestions = data
            .filter((place: any) => place.display_name)
            .slice(0, 10)
            .map((place: any) => ({
                name: place.display_name.split(',')[0], // Get first part of display name
                cuisine: place.type === 'restaurant' ? 'Restoran' : (place.type || 'Mekan'),
                address: place.address?.road || place.address?.suburb || place.address?.city || '',
                fullAddress: place.display_name
            }))

        return NextResponse.json(suggestions)
    } catch (error) {
        console.error('Error fetching restaurant suggestion:', error)
        return NextResponse.json(
            { error: 'Restoran önerisi alınamadı' },
            { status: 500 }
        )
    }
}

