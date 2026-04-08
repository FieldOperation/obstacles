-- ============================================
-- TEST QUERIES - Run these to verify data exists
-- ============================================

-- Test 1: Check if cases exist
SELECT COUNT(*) as case_count FROM cases;
SELECT * FROM cases LIMIT 5;

-- Test 2: Check if zones exist
SELECT COUNT(*) as zone_count FROM zones;
SELECT * FROM zones LIMIT 5;

-- Test 3: Check if roads exist
SELECT COUNT(*) as road_count FROM roads;
SELECT * FROM roads LIMIT 5;

-- Test 4: Check if developers exist
SELECT COUNT(*) as developer_count FROM developers;
SELECT * FROM developers LIMIT 5;

-- Test 5: Test RLS - Try to read cases as authenticated user
-- This simulates what the frontend is doing
SELECT 
  id,
  type,
  status,
  description,
  created_at
FROM cases
LIMIT 5;

-- Test 6: Test RLS - Try to read zones
SELECT id, name FROM zones LIMIT 5;

-- Test 7: Test RLS - Try to read roads
SELECT id, name, zone_id FROM roads LIMIT 5;

-- If Test 5, 6, or 7 return nothing but Test 1, 2, 3 show data exists,
-- then RLS is blocking the queries!
