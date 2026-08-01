import {
    z,
} from 'zod';

const SUBMITTED_CODE_MAX_BYTES =
    100_000;

export const exerciseAssignmentParamsSchema =
    z.object({
        assignmentId:
            z.string().uuid(),
    }).strict();

export const submitExerciseAttemptBodySchema =
    z.object({
        submittedCode:
            z.string()
                .min(1)
                .refine(
                    (value) => (
                        Buffer.byteLength(
                            value,
                            'utf8',
                        )
                        <= SUBMITTED_CODE_MAX_BYTES
                    ),
                    {
                        message:
                            `Submitted code cannot exceed ${SUBMITTED_CODE_MAX_BYTES} UTF-8 bytes`,
                    },
                ),
    }).strict();

export const parseExerciseAssignmentParams =
    (params) => (
        exerciseAssignmentParamsSchema
            .parse(params)
    );

export const parseSubmitExerciseAttemptBody =
    (body) => (
        submitExerciseAttemptBodySchema
            .parse(body)
    );