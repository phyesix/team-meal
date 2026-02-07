import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const lat = searchParams.get('lat') || '41.0082' // Default: Istanbul
        const lon = searchParams.get('lon') || '28.9784'
        const radius = searchParams.get('radius') || '2000' // 2km radius

        // Using OpenStreetMap Overpass API - completely free, no authentication
        const query = `
            [out:json];
            (
                node["amenity"="restaurant"](around:${radius},${lat},${lon});
                way["amenity"="restaurant"](around:${radius},${lat},${lon});
            );
            out body 20;
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

        if (!data.elements || data.elements.length === 0) {
            return NextResponse.json({
                name: 'Restoran bulunamadı',
                cuisine: 'Genel',
                address: ''
            })
        }

        // Get random restaurant from results
        const restaurants = data.elements.filter((el: any) => el.tags?.name)
        const randomRestaurant = restaurants[Math.floor(Math.random() * restaurants.length)]

        return NextResponse.json({
            name: randomRestaurant.tags.name,
            cuisine: randomRestaurant.tags.cuisine || 'Genel',
            address: randomRestaurant.tags['addr:street'] || '',
            phone: randomRestaurant.tags.phone || '',
            website: randomRestaurant.tags.website || ''
        })
    } catch (error) {
        console.error('Error fetching restaurant suggestion:', error)
        return NextResponse.json(
            { error: 'Restoran önerisi alınamadı' },
            { status: 500 }
        )
    }
}
