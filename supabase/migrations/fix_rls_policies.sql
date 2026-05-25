-- ============================================================
-- Fix RLS policies for workout_plans, workout_days, exercises
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable RLS on all three tables
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_days  ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises     ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- workout_plans
-- ============================================================

DROP POLICY IF EXISTS "workout_plans_select" ON workout_plans;
CREATE POLICY "workout_plans_select" ON workout_plans
  FOR SELECT USING (
    trainer_id = auth.uid() OR client_id = auth.uid()
  );

DROP POLICY IF EXISTS "workout_plans_insert" ON workout_plans;
CREATE POLICY "workout_plans_insert" ON workout_plans
  FOR INSERT WITH CHECK (
    trainer_id = auth.uid()
  );

DROP POLICY IF EXISTS "workout_plans_update" ON workout_plans;
CREATE POLICY "workout_plans_update" ON workout_plans
  FOR UPDATE USING (
    trainer_id = auth.uid()
  );

DROP POLICY IF EXISTS "workout_plans_delete" ON workout_plans;
CREATE POLICY "workout_plans_delete" ON workout_plans
  FOR DELETE USING (
    trainer_id = auth.uid()
  );

-- ============================================================
-- workout_days
-- ============================================================

DROP POLICY IF EXISTS "workout_days_select" ON workout_days;
CREATE POLICY "workout_days_select" ON workout_days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_plans wp
      WHERE wp.id = workout_days.plan_id
        AND (wp.trainer_id = auth.uid() OR wp.client_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "workout_days_insert" ON workout_days;
CREATE POLICY "workout_days_insert" ON workout_days
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_plans wp
      WHERE wp.id = workout_days.plan_id
        AND wp.trainer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workout_days_update" ON workout_days;
CREATE POLICY "workout_days_update" ON workout_days
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workout_plans wp
      WHERE wp.id = workout_days.plan_id
        AND wp.trainer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workout_days_delete" ON workout_days;
CREATE POLICY "workout_days_delete" ON workout_days
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workout_plans wp
      WHERE wp.id = workout_days.plan_id
        AND wp.trainer_id = auth.uid()
    )
  );

-- ============================================================
-- exercises
-- (chain: exercises → workout_days → workout_plans)
-- ============================================================

DROP POLICY IF EXISTS "exercises_select" ON exercises;
CREATE POLICY "exercises_select" ON exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_days wd
      JOIN workout_plans wp ON wp.id = wd.plan_id
      WHERE wd.id = exercises.day_id
        AND (wp.trainer_id = auth.uid() OR wp.client_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "exercises_insert" ON exercises;
CREATE POLICY "exercises_insert" ON exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_days wd
      JOIN workout_plans wp ON wp.id = wd.plan_id
      WHERE wd.id = exercises.day_id
        AND wp.trainer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "exercises_update" ON exercises;
CREATE POLICY "exercises_update" ON exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workout_days wd
      JOIN workout_plans wp ON wp.id = wd.plan_id
      WHERE wd.id = exercises.day_id
        AND wp.trainer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "exercises_delete" ON exercises;
CREATE POLICY "exercises_delete" ON exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workout_days wd
      JOIN workout_plans wp ON wp.id = wd.plan_id
      WHERE wd.id = exercises.day_id
        AND wp.trainer_id = auth.uid()
    )
  );
