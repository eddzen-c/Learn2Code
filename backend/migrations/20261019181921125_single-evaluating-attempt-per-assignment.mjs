export const up = (pgm) => {
  pgm.sql(`
    CREATE UNIQUE INDEX uq_attempts_evaluating_assignment
    ON public.exercise_attempts (assignment_id)
    WHERE assignment_id IS NOT NULL
      AND status = 'evaluating';
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX public.uq_attempts_evaluating_assignment;
  `);
};