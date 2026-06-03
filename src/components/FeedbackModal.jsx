import '../styles/FeedbackModal.css';

function highlightEn(text, wrongWords = [], correctWords = []) {
    return text.replace(/['"]([^'"]+)['"]/g, (_, phrase) => {
        const lower = phrase.toLowerCase();
        const isErr = wrongWords?.some(e => lower === e.toLowerCase() || lower.includes(e.toLowerCase()));
        const isCorrect = correctWords?.some(e => lower === e.toLowerCase() || lower.includes(e.toLowerCase()));
        if (isCorrect) return `<span class="en-word">${phrase}</span>`;
        if (isErr) return `<span class="word-err">${phrase}</span>`;
        return `'${phrase}'`;
    });
}

function getErrIndices(words, wrongWords) {
    const errIndices = new Set();
    if (!wrongWords?.length) return errIndices;

    wrongWords.forEach(phrase => {
        const phraseWords = phrase.toLowerCase().split(' ');
        for (let i = 0; i <= words.length - phraseWords.length; i++) {
            const match = phraseWords.every((pw, j) => {
                const bare = words[i + j].replace(/[^A-Za-z']/g, '').toLowerCase();
                return bare === pw || bare.startsWith(pw);
            });
            if (match) {
                for (let j = 0; j < phraseWords.length; j++) errIndices.add(i + j);
            }
        }
    });

    return errIndices;
}

const SLOT_LABEL = {
    subject: { text: 'S', color: 'var(--c-yellow2)' },
    verb: { text: 'V', color: 'var(--c-pink2)' },
    object: { text: 'O', color: 'var(--c-blue2)' },
};

export default function FeedbackModal({ modal, onClose, onRefresh }) {
    const {
        isCorrect, sentence, wrongWords, translation, explanation,
        recommendedSentence, rec1Translation,
        recommendedSentence2, rec2Translation,
        wordSlots,
    } = modal;

    const explanationLines = (explanation ?? '').split('\\n');
    const sentenceWords = sentence.split(' ');
    const errIndices = getErrIndices(sentenceWords, wrongWords);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>

                {/* 헤더 */}
                <div className={`modal-header ${isCorrect ? 'success' : 'warn'}`}>
                    {isCorrect ? '🌟 좋은 문장이야!' : '✏️ 한 군데만 바꿔봐!'}
                </div>

                {/* 바디 */}
                <div className="modal-body">

                    {/* 완성 문장 */}
                    <div className="modal-sentence">
                        {wordSlots ? (
                            <div className="sentence-slots">
                                {wordSlots.map((part, i) => {
                                    const label = SLOT_LABEL[part.slotKey];
                                    const isErr = wrongWords?.some(w =>
                                        part.text.toLowerCase().includes(w.toLowerCase())
                                    );
                                    return (
                                        <div key={i} className="sentence-slot-item">
                                            <span className={isErr ? 'word-err' : ''}>
                                                {part.canOmit ? (
                                                    <>
                                                        <span style={{ opacity: 0.35 }}>{part.text.split(' ')[0]}</span>
                                                        {' '}{part.text.split(' ').slice(1).join(' ')}
                                                    </>
                                                ) : (
                                                    i === 0
                                                        ? part.text.charAt(0).toUpperCase() + part.text.slice(1)
                                                        : part.text
                                                )}
                                                {i === 0 && wordSlots.length > 1 && part.slotKey === 'adverb' ? ',' : ''}
                                            </span>
                                            <div className="slot-underline" style={{ background: label?.color ?? 'var(--btn-border)' }} />
                                            <div className="slot-label" style={{ color: label?.color ?? 'transparent' }}>
                                                {label?.text ?? ''}
                                            </div>
                                        </div>
                                    );
                                })}
                                <span className="sentence-period">.</span>
                            </div>
                        ) : (
                            sentenceWords.map((word, i) => (
                                errIndices.has(i)
                                    ? <span key={i} className="word-err">{word} </span>
                                    : <span key={i}>{word} </span>
                            ))
                        )}
                        {translation && (
                            <div className="modal-translation">{translation}</div>
                        )}
                    </div>

                    {/* 설명 박스 */}
                    <div className="modal-explanation">
                        {explanationLines.map((line, i) => (
                            <p key={i} dangerouslySetInnerHTML={{ __html: highlightEn(line, wrongWords ?? [], modal.correctWords ?? []) }} />
                        ))}
                    </div>

                    {/* 추천 문장 */}
                    {(recommendedSentence || recommendedSentence2) && (
                        <div className="modal-recommends">
                            <div className="recommends-title">{isCorrect ? '💡 이런 문장도 있어:' : '💡 이렇게 바꿀 수 있어:'}</div>

                            {recommendedSentence && (
                                <div className="modal-recommend">
                                    <span className="recommend-method">방법 1</span>
                                    <span className="recommend-sentence">{recommendedSentence}</span>
                                    {rec1Translation && (
                                        <span className="recommend-translation">{rec1Translation}</span>
                                    )}
                                </div>
                            )}

                            {recommendedSentence2 && (
                                <div className="modal-recommend">
                                    <span className="recommend-method">방법 2</span>
                                    <span className="recommend-sentence">{recommendedSentence2}</span>
                                    {rec2Translation && (
                                        <span className="recommend-translation">{rec2Translation}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 푸터 */}
                <div className="modal-footer">
                    {isCorrect ? (
                        <button className="btn-close btn-next" onClick={onClose}>다음 문장도 도전! →</button>
                    ) : (
                        <>
                            <button className="btn-close btn-retry" onClick={onClose}>다시 해볼게!</button>
                            {onRefresh && (
                                <button className="btn-close btn-refresh" onClick={() => onRefresh(recommendedSentence, recommendedSentence2)}>
                                    추천 문장 🔄
                                </button>
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}