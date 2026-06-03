import { getVerbForm, getAdverbForm } from '../utils/verbConjugate';
import '../styles/WordCard.css';

const COLOR_VAR_MAP = {
    subj: 'var(--c-yellow)',
    verb: 'var(--c-pink)',
    obj: 'var(--c-blue)',
    mod: 'var(--c-green)',
    rel: 'var(--c-cream)',
    ext: 'var(--c-grey)',
};

const SENTENCE_ONLY_CAPS = new Set(['she', 'he', 'we', 'they', 'you', 'it', 'my', 'the', 'a', 'your']);

function toMidSentence(text) {
    if (text === 'I') return 'I';
    const firstWord = text.split(' ')[0].toLowerCase();
    if (SENTENCE_ONLY_CAPS.has(firstWord)) return text.charAt(0).toLowerCase() + text.slice(1);
    return text;
}

export default function WordCard({
    item, slot, tense,
    selectedSubject, isSelected, onSelect, isAdverbFront, hasModal
}) {
    const verbForm = slot.isVerb
        ? getVerbForm(item, selectedSubject, tense, hasModal)
        : null;

    const adverbForm = slot.key === 'adverb'
        ? getAdverbForm(item)
        : null;

    return (
        <div
            className={`word-card ${isSelected ? 'selected' : ''}`}
            style={isSelected ? { background: `color-mix(in srgb, ${COLOR_VAR_MAP[slot.color] ?? 'transparent'} 50%, transparent)` } : {}}
            onClick={onSelect}
        >
            {(slot.key === 'adverb' || slot.key === 'preposition' ||
                slot.key === 'subRel' || slot.key === 'objRel') && (
                    <span className="kor-txt">{item.kor}</span>
                )}

            <span className="eng-txt">
                {slot.isVerb ? (
                    <>
                        {verbForm.base}
                        {verbForm.suffix && (
                            <span className="verb-change">{verbForm.suffix}</span>
                        )}
                    </>
                ) : adverbForm ? (
                    <>
                        <span className="conj-change">{adverbForm.conj}</span>
                        {adverbForm.base}
                    </>
                ) : (
                    slot.key === 'subject' && isAdverbFront
                        ? toMidSentence(item.eng)
                        : (item.eng ?? item.base)
                )}
            </span>
        </div>
    );
}