export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    is_admin: boolean
                    created_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    is_admin?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    is_admin?: boolean
                    created_at?: string
                }
            }
            teams: {
                Row: {
                    id: string
                    name: string
                    max_members: number
                    vehicle_capacity: number
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    max_members: number
                    vehicle_capacity?: number
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    max_members?: number
                    vehicle_capacity?: number
                    created_by?: string | null
                    created_at?: string
                }
            }
            team_members: {
                Row: {
                    id: string
                    team_id: string
                    user_id: string
                    has_car: boolean
                    joined_at: string
                }
                Insert: {
                    id?: string
                    team_id: string
                    user_id: string
                    has_car?: boolean
                    joined_at?: string
                }
                Update: {
                    id?: string
                    team_id?: string
                    user_id?: string
                    has_car?: boolean
                    joined_at?: string
                }
            }
            cycles: {
                Row: {
                    id: string
                    team_id: string
                    cycle_number: number
                    started_at: string
                    completed_at: string | null
                    is_active: boolean
                }
                Insert: {
                    id?: string
                    team_id: string
                    cycle_number: number
                    started_at?: string
                    completed_at?: string | null
                    is_active?: boolean
                }
                Update: {
                    id?: string
                    team_id?: string
                    cycle_number?: number
                    started_at?: string
                    completed_at?: string | null
                    is_active?: boolean
                }
            }
            dice_rolls: {
                Row: {
                    id: string
                    cycle_id: string
                    user_id: string
                    die1: number
                    die2: number
                    total: number
                    rolled_at: string
                }
                Insert: {
                    id?: string
                    cycle_id: string
                    user_id: string
                    die1: number
                    die2: number
                    rolled_at?: string
                }
                Update: {
                    id?: string
                    cycle_id?: string
                    user_id?: string
                    die1?: number
                    die2?: number
                    rolled_at?: string
                }
            }
            meal_turns: {
                Row: {
                    id: string
                    cycle_id: string
                    user_id: string
                    turn_order: number
                    week_number: number
                    restaurant_name: string | null
                    meal_date: string | null
                    is_completed: boolean
                    completed_at: string | null
                }
                Insert: {
                    id?: string
                    cycle_id: string
                    user_id: string
                    turn_order: number
                    week_number: number
                    restaurant_name?: string | null
                    meal_date?: string | null
                    is_completed?: boolean
                    completed_at?: string | null
                }
                Update: {
                    id?: string
                    cycle_id?: string
                    user_id?: string
                    turn_order?: number
                    week_number?: number
                    restaurant_name?: string | null
                    meal_date?: string | null
                    is_completed?: boolean
                    completed_at?: string | null
                }
            }
            vehicle_assignments: {
                Row: {
                    id: string
                    meal_turn_id: string
                    driver_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    meal_turn_id: string
                    driver_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    meal_turn_id?: string
                    driver_id?: string
                    created_at?: string
                }
            }
        }
    }
}
