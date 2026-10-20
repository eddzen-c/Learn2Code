import {
    LuCircleHelp,
    LuDatabase,
} from 'react-icons/lu'

import {
    SiCss,
    SiHtml5,
    SiJavascript,
    SiNodedotjs,
    SiOpenjdk,
    SiPython,
    SiReact,
    SiTypescript,
} from 'react-icons/si'

const technologyConfiguration =
    Object.freeze({
        javascript: Object.freeze({
            label: 'JavaScript',
            color: '#f7df1e',
            Icon: SiJavascript,
        }),

        python: Object.freeze({
            label: 'Python',
            color: '#3776ab',
            Icon: SiPython,
        }),

        react: Object.freeze({
            label: 'React',
            color: '#087ea4',
            Icon: SiReact,
        }),

        nodejs: Object.freeze({
            label: 'Node.js',
            color: '#5fa04e',
            Icon: SiNodedotjs,
        }),

        typescript: Object.freeze({
            label: 'TypeScript',
            color: '#3178c6',
            Icon: SiTypescript,
        }),

        java: Object.freeze({
            label: 'Java',
            color: '#437291',
            Icon: SiOpenjdk,
        }),

        sql: Object.freeze({
            label: 'SQL',
            color: '#336791',
            Icon: LuDatabase,
        }),

        other: Object.freeze({
            label: 'Otra tecnología',
            color: '#64748b',
            Icon: LuCircleHelp,
        }),
    })

const joinClassNames = (
    ...classNames
) => (
    classNames
        .filter(Boolean)
        .join(' ')
)

export function TechnologyIcon({
    technologyKey,
    size = 24,
    className = '',
    showLabel = false,
}) {
    if (technologyKey === 'html_css') {
        return (
            <span
                aria-label="HTML y CSS"
                className={joinClassNames(
                    'technology-icon',
                    'technology-icon-combined',
                    className,
                )}
                role="img"
            >
                <SiHtml5
                    aria-hidden="true"
                    color="#e34f26"
                    focusable="false"
                    size={size}
                />

                <SiCss
                    aria-hidden="true"
                    color="#663399"
                    focusable="false"
                    size={size}
                />

                {showLabel && (
                    <span className="technology-icon-label">
                        HTML y CSS
                    </span>
                )}
            </span>
        )
    }

    const configuration =
        technologyConfiguration[
        technologyKey
        ]
        ?? technologyConfiguration.other

    const {
        Icon,
        color,
        label,
    } = configuration

    return (
        <span
            aria-label={label}
            className={joinClassNames(
                'technology-icon',
                className,
            )}
            role="img"
        >
            <Icon
                aria-hidden="true"
                color={color}
                focusable="false"
                size={size}
            />

            {showLabel && (
                <span className="technology-icon-label">
                    {label}
                </span>
            )}
        </span>
    )
}