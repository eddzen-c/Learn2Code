import {
    useState,
} from 'react'

import {
    FiCheck,
    FiCopy,
} from 'react-icons/fi'

export function DiagnosticCodeBlock({
    code,
}) {
    const [copied, setCopied] =
        useState(false)

    const normalizedCode =
        typeof code === 'string'
            ? code.trimEnd()
            : ''

    const codeLines =
        normalizedCode.split('\n')

    const handleCopy = async () => {
        if (!navigator.clipboard) {
            return
        }

        try {
            await navigator.clipboard.writeText(
                normalizedCode,
            )

            setCopied(true)
        } catch {
            setCopied(false)
        }
    }

    return (
        <section
            aria-label="Código de la pregunta"
            className="diagnostic-code-block"
        >
            <header>
                <span>
                    Código
                </span>

                <button
                    aria-label={
                        copied
                            ? 'Código copiado'
                            : 'Copiar código'
                    }
                    className={
                        copied
                            ? 'is-copied'
                            : ''
                    }
                    onClick={handleCopy}
                    type="button"
                >
                    {
                        copied
                            ? (
                                <FiCheck
                                    aria-hidden="true"
                                />
                            )
                            : (
                                <FiCopy
                                    aria-hidden="true"
                                />
                            )
                    }

                    <span>
                        {
                            copied
                                ? 'Copiado'
                                : 'Copiar código'
                        }
                    </span>
                </button>
            </header>

            <pre>
                <code>
                    {
                        codeLines.map(
                            (line, index) => (
                                <span
                                    className="diagnostic-code-line"
                                    key={
                                        `${index}-${line}`
                                    }
                                >
                                    <span
                                        aria-hidden="true"
                                        className="diagnostic-code-line-number"
                                    >
                                        {index + 1}
                                    </span>

                                    <span className="diagnostic-code-line-content">
                                        {line || ' '}
                                    </span>
                                </span>
                            ),
                        )
                    }
                </code>
            </pre>
        </section>
    )
}