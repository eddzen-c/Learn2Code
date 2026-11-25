import {
    databasePool,
} from '../../../config/database.js';

import {
    findPublishedAcademicUnitExercise,
} from '../repositories/academic-catalog.repository.js';

import {
    createExerciseAssignmentRecord,
    findActiveAcademicAssignmentRecord,
} from '../repositories/exercise.repository.js';

export class AcademicExerciseAssignmentConflictError
    extends Error {
    constructor() {
        super(
            'El ejercicio ya tiene una asignación activa en otro contexto.',
        );

        this.name =
            'AcademicExerciseAssignmentConflictError';

        this.code =
            'ACADEMIC_EXERCISE_ASSIGNMENT_CONFLICT';
    }
}

const toPublicAssignment = (
    assignment,
    academicUnitId,
) => Object.freeze({
    id: assignment.id,
    exerciseId: assignment.exerciseId,
    academicUnitId,
    status: assignment.status,
    expiresAt: assignment.expiresAt,
});

export const assignAcademicExercise = async ({
    userId,
    unitId,
    exerciseId,
    pool = databasePool,
    findAcademicExercise =
    findPublishedAcademicUnitExercise,
    findActiveAssignment =
    findActiveAcademicAssignmentRecord,
    createAssignment =
    createExerciseAssignmentRecord,
}) => {
    const client = await pool.connect();

    let transactionOpen = false;

    try {
        await client.query('BEGIN');
        transactionOpen = true;

        // Evita solicitudes simultáneas del mismo
        // usuario para el mismo ejercicio.
        await client.query({
            text: `
                SELECT pg_advisory_xact_lock(
                    hashtextextended(
                        $1::text || ':' || $2::text,
                        0
                    )
                )
            `,
            values: [userId, exerciseId],
        });

        // Comprueba que el ejercicio pertenezca
        // a la unidad académica publicada.
        const academicExercise =
            await findAcademicExercise({
                unitId,
                exerciseId,
                client,
            });

        if (!academicExercise) {
            await client.query('COMMIT');
            transactionOpen = false;

            return null;
        }

        // Actualiza asignaciones vencidas que
        // todavía mantienen un estado activo.
        await client.query({
            text: `
                UPDATE exercise_assignments
                SET status = 'expired'
                WHERE user_id = $1
                    AND exercise_id = $2
                    AND status IN (
                        'assigned',
                        'started'
                    )
                    AND expires_at IS NOT NULL
                    AND expires_at <= NOW()
            `,
            values: [userId, exerciseId],
        });

        // Reutiliza una asignación válida
        // de esta unidad y ejercicio.
        const existing =
            await findActiveAssignment({
                userId,
                academicUnitId: unitId,
                exerciseId,
                client,
            });

        if (existing) {
            await client.query('COMMIT');
            transactionOpen = false;

            return Object.freeze({
                created: false,
                assignment: toPublicAssignment(
                    existing,
                    unitId,
                ),
            });
        }

        // Detecta una asignación activa del mismo
        // ejercicio vinculada a otro contexto.
        const conflict = await client.query({
            text: `
                SELECT id
                FROM exercise_assignments
                WHERE user_id = $1
                    AND exercise_id = $2
                    AND status IN (
                        'assigned',
                        'started'
                    )
                LIMIT 1
            `,
            values: [userId, exerciseId],
        });

        if (conflict.rows.length > 0) {
            throw new AcademicExerciseAssignmentConflictError();
        }

        // Crea una asignación académica real.
        const assignment =
            await createAssignment({
                userId,
                exerciseId,
                academicUnitId: unitId,
                source: 'manual',
                status: 'assigned',
                expiresAt: null,
                metadata: {},
                client,
            });

        await client.query('COMMIT');
        transactionOpen = false;

        return Object.freeze({
            created: true,
            assignment: toPublicAssignment(
                assignment,
                unitId,
            ),
        });
    } catch (error) {
        if (transactionOpen) {
            await client.query('ROLLBACK');
        }

        // Convierte una colisión del índice único
        // en un error controlado.
        if (
            error?.code === '23505'
            && error?.constraint
            === 'uq_active_assignment_user_exercise'
        ) {
            throw new AcademicExerciseAssignmentConflictError();
        }

        throw error;
    } finally {
        client.release();
    }
};