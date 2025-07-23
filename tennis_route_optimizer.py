#!/usr/bin/env python3
"""
Tennis Facility Route Optimizer
Calculates optimal routes to visit all tennis facilities in 4-5 trips
Starting and ending at: 2116 4th Avenue W, Seattle, WA 98119
"""

import requests
import json
import itertools
from typing import List, Tuple, Dict
import time

# Starting/ending point
START_END_POINT = "2116 4th Avenue W, Seattle, WA 98119"

# Tennis facilities from the SQL data
TENNIS_FACILITIES = [
    ("Alki Playfield Tennis", "5817 SW Lander St, Seattle, WA 98136"),
    ("Amy Yee Tennis Center", "2000 Martin Luther King Jr Way S, Seattle, WA 98144"),
    ("Beacon Hill Playfield Tennis", "1902 13th Ave S, Seattle, WA 98144"),
    ("Bitter Lake Playfield Tennis", "13035 Linden Ave N, Seattle, WA 98133"),
    ("Brighton Playfield Tennis", "6000 39th Ave S, Seattle, WA 98136"),
    ("Bryant Playground Tennis", "4103 NE 65th St, Seattle, WA 98115"),
    ("David Rodgers Park Tennis", "2800 1st Ave W, Seattle, WA 98119"),
    ("Dearborn Park Tennis", "2919 S Brandon St, Seattle, WA 98126"),
    ("Delridge Playfield Tennis", "4458 Delridge Way SW, Seattle, WA 98106"),
    ("Discovery Park Tennis", "3801 Discovery Park Blvd, Seattle, WA 98199"),
    ("Froula Playground Tennis", "7200 12th Ave NE, Seattle, WA 98115"),
    ("Garfield Playfield Tennis", "2323 E Cherry St, Seattle, WA 98122"),
    ("Gilman Playfield Tennis", "923 NW 54th St, Seattle, WA 98107"),
    ("Green Lake Park West Tennis", "7201 E Green Lake Dr N, Seattle, WA 98115"),
    ("Hiawatha Playfield Tennis", "2700 California Ave SW, Seattle, WA 98116"),
    ("Jefferson Park Tennis", "3901 Beacon Ave S, Seattle, WA 98108"),
    ("Laurelhurst Playfield Tennis", "4544 NE 41st St, Seattle, WA 98105"),
    ("Lower Woodland Playfield", "5773 West Green Lake Way N, Seattle, WA 98103"),
    ("Lower Woodland Upper Courts", "1000 N 50th St, Seattle, WA 98103"),
    ("Madison Park Tennis", "1800 42nd Ave E, Seattle, WA 98112"),
    ("Madrona Playground Tennis", "3211 E Spring St, Seattle, WA 98122"),
    ("Magnolia Park Tennis", "461 Magnolia Blvd W, Seattle, WA 98199"),
    ("Magnolia Playfield Tennis", "2518 W 34th St, Seattle, WA 98199"),
    ("Meadowbrook Playfield Tennis", "10533 35th Ave NE, Seattle, WA 98125"),
    ("Miller Playfield Tennis", "300 19th Ave E, Seattle, WA 98112"),
    ("Montlake Playfield Tennis", "1618 E Calhoun St, Seattle, WA 98112"),
    ("Mount Baker Park Tennis", "2521 Lake Park Dr S, Seattle, WA 98144"),
    ("Observatory Tennis", "1405 Warren Ave N, Seattle, WA 98109"),
    ("Rainier Beach Playfield Tennis", "8802 Rainier Ave S, Seattle, WA 98118"),
    ("Rainier Playfield Tennis", "3700 S Alaska St, Seattle, WA 98118"),
    ("Riverview Playfield Tennis", "7226 12th Ave SW, Seattle, WA 98106"),
    ("Rogers Playfield Tennis", "2568 Eastlake Ave E, Seattle, WA 98102"),
    ("Sam Smith Park Tennis", "1400 Martin Luther King Jr Way S, Seattle, WA 98144"),
    ("Seward Park Tennis", "5898 Lake Washington Blvd S, Seattle, WA 98118"),
    ("Solstice Park Tennis", "7400 Fauntleroy Way SW, Seattle, WA 98136"),
    ("Soundview Playfield Tennis", "1590 NW 90th St, Seattle, WA 98117"),
    ("Volunteer Park Tennis", "1247 15th Ave E, Seattle, WA 98112"),
    ("Wallingford Playfield Tennis", "4219 Wallingford Ave N, Seattle, WA 98103"),
    ("Walt Hundley Playfield Tennis", "6920 34th Ave SW, Seattle, WA 98126")
]

def get_distance_matrix(origins: List[str], destinations: List[str]) -> Dict:
    """
    Calculate distance matrix using Google Maps API
    Note: This requires a Google Maps API key
    """
    # For demonstration, we'll use approximate coordinates and calculate as-the-crow-flies distances
    # In a real implementation, you'd use the Google Maps Distance Matrix API
    
    # Approximate coordinates for Seattle areas (for demonstration)
    area_coords = {
        "98119": (47.6356, -122.3635),  # Start point area
        "98136": (47.5493, -122.3616),  # Alki/Brighton area
        "98144": (47.5889, -122.2969),  # Beacon Hill/Amy Yee area
        "98133": (47.7379, -122.3493),  # Bitter Lake area
        "98115": (47.6829, -122.3021),  # Bryant/Froula area
        "98126": (47.5393, -122.3516),  # Dearborn area
        "98106": (47.5320, -122.3516),  # Delridge area
        "98199": (47.6436, -122.4194),  # Discovery/Magnolia area
        "98122": (47.6062, -122.3063),  # Garfield/Madrona area
        "98107": (47.6768, -122.3750),  # Gilman area
        "98116": (47.5493, -122.3864),  # Hiawatha area
        "98108": (47.5393, -122.3063),  # Jefferson area
        "98105": (47.6614, -122.2969),  # Laurelhurst area
        "98103": (47.6768, -122.3320),  # Lower Woodland area
        "98112": (47.6298, -122.2969),  # Madison/Miller area
        "98125": (47.7201, -122.2969),  # Meadowbrook area
        "98109": (47.6298, -122.3493),  # Observatory area
        "98118": (47.5151, -122.2654),  # Rainier area
        "98102": (47.6356, -122.3240),  # Rogers area
        "98117": (47.6979, -122.3750)   # Soundview area
    }
    
    return area_coords

def calculate_approximate_time(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """
    Calculate approximate driving time between two coordinates
    Uses haversine distance and average Seattle driving speed
    """
    import math
    
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    
    # Haversine formula
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance_km = 6371 * c
    
    # Assume average speed of 30 mph (48 km/h) in Seattle
    time_hours = distance_km / 48
    return time_hours * 60  # Return in minutes

def group_facilities_by_area(facilities: List[Tuple[str, str]]) -> Dict[str, List[Tuple[str, str]]]:
    """Group facilities by ZIP code area for initial clustering"""
    groups = {}
    for name, address in facilities:
        zip_code = address.split()[-1]
        if zip_code not in groups:
            groups[zip_code] = []
        groups[zip_code].append((name, address))
    return groups

def optimize_routes(facilities: List[Tuple[str, str]], num_trips: int = 5) -> List[List[Tuple[str, str]]]:
    """
    Create optimized routes for visiting all facilities
    Uses geographic clustering to minimize travel time
    """
    area_groups = group_facilities_by_area(facilities)
    
    # Group nearby areas together
    route_clusters = [
        # Trip 1: North Seattle
        [],
        # Trip 2: Northeast Seattle  
        [],
        # Trip 3: Central/East Seattle
        [],
        # Trip 4: South Seattle
        [],
        # Trip 5: West Seattle
        []
    ]
    
    # North Seattle (98133, 98117, 98107, 98103)
    for zip_code in ["98133", "98117", "98107", "98103"]:
        if zip_code in area_groups:
            route_clusters[0].extend(area_groups[zip_code])
    
    # Northeast Seattle (98115, 98125, 98105)
    for zip_code in ["98115", "98125", "98105"]:
        if zip_code in area_groups:
            route_clusters[1].extend(area_groups[zip_code])
    
    # Central/East Seattle (98112, 98122, 98102, 98109)
    for zip_code in ["98112", "98122", "98102", "98109"]:
        if zip_code in area_groups:
            route_clusters[2].extend(area_groups[zip_code])
    
    # South Seattle (98144, 98108, 98118)
    for zip_code in ["98144", "98108", "98118"]:
        if zip_code in area_groups:
            route_clusters[3].extend(area_groups[zip_code])
    
    # West Seattle (98136, 98126, 98106, 98116, 98199, 98119)
    for zip_code in ["98136", "98126", "98106", "98116", "98199", "98119"]:
        if zip_code in area_groups:
            route_clusters[4].extend(area_groups[zip_code])
    
    # Remove empty clusters and balance if needed
    route_clusters = [cluster for cluster in route_clusters if cluster]
    
    return route_clusters

def calculate_route_time(route: List[Tuple[str, str]], start_point: str) -> float:
    """Calculate total time for a route including return to start"""
    if not route:
        return 0
    
    # More realistic Seattle driving times (in minutes) between areas
    area_travel_times = {
        ("98119", "98133"): 25,  # Home to Bitter Lake
        ("98119", "98117"): 20,  # Home to Soundview  
        ("98119", "98107"): 15,  # Home to Gilman
        ("98119", "98103"): 18,  # Home to Woodland
        ("98119", "98115"): 22,  # Home to Bryant (confirmed by Google Maps)
        ("98119", "98125"): 28,  # Home to Meadowbrook
        ("98119", "98105"): 20,  # Home to Laurelhurst
        ("98119", "98112"): 15,  # Home to Madison Park area
        ("98119", "98122"): 18,  # Home to Garfield area
        ("98119", "98102"): 12,  # Home to Rogers
        ("98119", "98109"): 8,   # Home to Observatory
        ("98119", "98144"): 25,  # Home to Beacon Hill area
        ("98119", "98108"): 22,  # Home to Jefferson
        ("98119", "98118"): 30,  # Home to Rainier area
        ("98119", "98136"): 15,  # Home to Alki area
        ("98119", "98126"): 18,  # Home to West Seattle
        ("98119", "98106"): 20,  # Home to Delridge
        ("98119", "98116"): 25,  # Home to Highland Park
        ("98119", "98199"): 10,  # Home to Magnolia
    }
    
    # Inter-area travel times (approximate)
    same_area_time = 5      # Within same ZIP area
    adjacent_area_time = 8  # Between adjacent areas
    distant_area_time = 15  # Between distant areas
    
    total_time = 0
    
    # Time from home to first facility
    first_zip = route[0][1].split()[-1]
    home_zip = "98119"
    total_time += area_travel_times.get((home_zip, first_zip), 20)
    
    # Time between facilities
    for i in range(1, len(route)):
        prev_zip = route[i-1][1].split()[-1]
        curr_zip = route[i][1].split()[-1]
        
        if prev_zip == curr_zip:
            total_time += same_area_time
        elif abs(int(prev_zip) - int(curr_zip)) < 10:
            total_time += adjacent_area_time
        else:
            total_time += distant_area_time
    
    # Time from last facility back to home
    last_zip = route[-1][1].split()[-1]
    total_time += area_travel_times.get((last_zip, home_zip), 
                                       area_travel_times.get((home_zip, last_zip), 20))
    
    return total_time

def main():
    print("Tennis Facility Route Optimizer")
    print("="*50)
    print(f"Starting/Ending Point: {START_END_POINT}")
    print(f"Total Facilities: {len(TENNIS_FACILITIES)}")
    print()
    
    # Generate optimized routes
    routes = optimize_routes(TENNIS_FACILITIES, 5)
    
    total_time = 0
    for i, route in enumerate(routes, 1):
        route_time = calculate_route_time(route, START_END_POINT)
        total_time += route_time
        
        print(f"Trip {i}: {len(route)} facilities - Estimated time: {route_time:.1f} minutes")
        for name, address in route:
            print(f"  • {name}: {address}")
        print()
    
    print(f"Total estimated time for all trips: {total_time:.1f} minutes ({total_time/60:.1f} hours)")
    print("\nNote: Times are approximate and based on geographic distance.")
    print("Actual driving times may vary due to traffic, road conditions, and route optimization.")

if __name__ == "__main__":
    main()