import {
    render,
    screen,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    DiagnosticCodeBlock,
} from './DiagnosticCodeBlock.jsx'

describe('DiagnosticCodeBlock', () => {
    it(
        'shows line numbers and copies the code',
        async () => {
            const user = userEvent.setup()

            const writeText = vi
                .spyOn(
                    window.navigator.clipboard,
                    'writeText',
                )
                .mockResolvedValue()

            const code = [
                'const total = 5;',
                'console.log(total);',
            ].join('\n')

            render(
                <DiagnosticCodeBlock
                    code={code}
                />,
            )

            const codeBlock =
                screen.getByLabelText(
                    'Código de la pregunta',
                )

            expect(
                codeBlock.textContent,
            ).toContain(
                'const total = 5;',
            )

            expect(
                codeBlock.textContent,
            ).toContain(
                'console.log(total);',
            )

            expect(
                codeBlock.textContent,
            ).toContain('1')

            expect(
                codeBlock.textContent,
            ).toContain('2')

            await user.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Copiar código',
                    },
                ),
            )

            expect(
                writeText,
            ).toHaveBeenCalledWith(code)

            expect(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Código copiado',
                    },
                ),
            ).toBeTruthy()
        },
    )
})