# Database Schema

To get the current schema from Supabase, run this SQL query in the SQL Editor:

```sql
SELECT 
    table_name,
    column_name,
    data_type,
    column_default,
    is_nullable,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

## Current Tables

### boost_contributions
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| slot_id | uuid | YES | null |
| wallet_address | text | NO | null |
| amount | numeric | NO | null |
| transaction_signature | text | NO | null |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP |

### boost_slots
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| slot_number | integer | NO | null |
| project_name | varchar(255) | NO | null |
| project_logo | varchar(2048) | NO | null |
| project_link | varchar(2048) | NO | null |
| telegram_link | varchar(2048) | YES | null |
| chart_link | varchar(2048) | YES | null |
| start_time | timestamp with time zone | NO | null |
| end_time | timestamp with time zone | NO | null |
| initial_contribution | numeric | NO | null |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP |
| updated_at | timestamp with time zone | YES | CURRENT_TIMESTAMP |

### boost_stats
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | bigint | NO | null |
| total_projects_boosted | integer | YES | 0 |
| total_sol_contributed | numeric(20,9) | YES | 0 |
| last_updated | timestamp with time zone | YES | CURRENT_TIMESTAMP |

### boost_waitlist
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NO | nextval('boost_waitlist_id_seq') |
| project_name | text | NO | null |
| project_logo | text | NO | null |
| project_link | text | NO | null |
| telegram_link | text | YES | null |
| chart_link | text | YES | null |
| wallet_address | text | NO | null |
| created_at | timestamp with time zone | YES | now() |
| contribution_amount | numeric | NO | 0 |
| transaction_signature | text | YES | null |
| updated_at | timestamp with time zone | YES | CURRENT_TIMESTAMP |

### comments
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | bigint | NO | null |
| content | text | NO | null |
| user_id | text | NO | null |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP |
| updated_at | timestamp with time zone | YES | CURRENT_TIMESTAMP |
| is_general | boolean | YES | true |

### spot_history
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| spot_id | integer | YES | null |
| previous_project_name | varchar(255) | YES | null |
| project_name | varchar(255) | YES | null |
| timestamp | timestamp with time zone | YES | CURRENT_TIMESTAMP |

### spots
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NO | nextval('spots_id_seq') |
| current_bid | numeric | NO | 0 |
| current_bidder | text | YES | null |
| project_name | text | YES | null |
| project_link | text | YES | null |
| project_logo | text | YES | null |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) |
| updated_at | timestamp with time zone | NO | timezone('utc'::text, now()) |
| last_transaction | text | YES | null |
| wallet_address | text | YES | null |

### wallet_interactions
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| wallet_address | text | NO | null |
| interaction_type | text | NO | null |
| interaction_time | timestamp with time zone | YES | now() |
| amount | numeric | YES | null |
| spot_id | integer | YES | null |
| boost_slot_id | uuid | YES | null |
| transaction_signature | text | YES | null |
| additional_data | jsonb | YES | null |

### wallet_stats
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| wallet_address | text | NO | null |
| first_interaction | timestamp with time zone | YES | now() |
| last_interaction | timestamp with time zone | YES | now() |
| total_spots_owned | integer | YES | 0 |
| total_spots_stolen | integer | YES | 0 |
| total_spots_lost | integer | YES | 0 |
| total_boost_contributions | integer | YES | 0 |
| total_boost_amount | numeric | YES | 0 |
| total_bids | integer | YES | 0 |
| total_bid_amount | numeric | YES | 0 |
| highest_bid | numeric | YES | 0 |
| total_boosted_projects | integer | YES | 0 |
| longest_spot_hold_time | integer | YES | 0 |
