/**
 * Presentación segura de la respuesta del tutor.
 * Permite párrafos, énfasis **negrita** y pasos numerados aunque
 * el modelo los escriba seguidos en la misma línea.
 * No renderiza HTML proporcionado por el modelo.
 */

function InlineTutorText({ text }) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => (
        part.startsWith('**') && part.endsWith('**')
            ? <strong key={index}>{part.slice(2, -2)}</strong>
            : <span key={index}>{part}</span>
    ))
}

function formatTutorBlocks(text) {
    const normalized = String(text ?? '')
        .replace(/\r\n?/g, '\n')
        .replace(/([^\n])\s+(\d{1,2}[.)])\s+(?=[^\s])/g, '$1\n$2 ')
    const blocks = []

    for (const rawLine of normalized.split('\n')) {
        const line = rawLine.trim()
        if (!line) continue

        const numbered = line.match(/^(\d{1,2})[.)]\s+(.+)$/)
        const bullet = line.match(/^(?:-|•|\*)\s+(.+)$/)

        if (numbered) {
            if (blocks.at(-1)?.type !== 'steps') {
                blocks.push({ type: 'steps', items: [] })
            }
            blocks.at(-1).items.push({
                number: numbered[1],
                text: numbered[2],
            })
        } else if (bullet) {
            if (blocks.at(-1)?.type !== 'bullets') {
                blocks.push({ type: 'bullets', items: [] })
            }
            blocks.at(-1).items.push(bullet[1])
        } else {
            blocks.push({
                type: line.startsWith('### ') ? 'heading' : 'paragraph',
                text: line.replace(/^#{1,3}\s+/, ''),
            })
        }
    }

    return blocks
}

export function TutorMessageContent({ text }) {
    return (
        <div className="pistas-chat__respuesta">
            {formatTutorBlocks(text).map((block, index) => {
                if (block.type === 'steps') {
                    return (
                        <ol className="pistas-chat__pasos" key={index}>
                            {block.items.map((item, itemIndex) => (
                                <li key={itemIndex}>
                                    <strong className="pistas-chat__paso-numero">
                                        {item.number}.{' '}
                                    </strong>
                                    <span>
                                        <InlineTutorText text={item.text} />
                                    </span>
                                </li>
                            ))}
                        </ol>
                    )
                }
                if (block.type === 'bullets') {
                    return (
                        <ul className="pistas-chat__vinetas" key={index}>
                            {block.items.map((item, itemIndex) => (
                                <li key={itemIndex}>
                                    <InlineTutorText text={item} />
                                </li>
                            ))}
                        </ul>
                    )
                }
                if (block.type === 'heading') {
                    return (
                        <h4 key={index}>
                            <InlineTutorText text={block.text} />
                        </h4>
                    )
                }
                return (
                    <p key={index}>
                        <InlineTutorText text={block.text} />
                    </p>
                )
            })}
        </div>
    )
}
