/**
 * 동사 변형 로직 : 예를 들어 love + He + 현재 → love(검정) + s(빨강) 으로 분리해주는 함수들.
 * getVerbForm(verbObj, subject, tense)
 * @param verbObj  - verb.json 항목 { base, s, ed }
 * @param subject  - subject.json 항목 { eng, isT3, ... }
 * @param tense    - 'present' | 'past'
 * @returns { base: string, suffix: string }
 *   base   = 카드에 원래 있던 부분 (검정)
 *   suffix = 새로 추가된 부분 (빨강)
 */

export function getVerbForm(verbObj, subject, tense, hasModal = false) {
    if (hasModal) return { base: verbObj.base, suffix: '' };
    const isT3 = subject?.isT3 ?? false;

    if (tense === 'past') {
        return splitForm(verbObj.base, verbObj.ed);
    }

    if (tense === 'present' && isT3) {
        return splitForm(verbObj.base, verbObj.s);
    }

    return { base: verbObj.base, suffix: '' };
}

/**
 * getPlainVerb(verbObj, subject, tense)
 * 문장 조합용 plain text
 */
export function getPlainVerb(verbObj, subject, tense, hasModal = false) {
    if (hasModal) return verbObj.base;
    const isT3 = subject?.isT3 ?? false;
    if (tense === 'past') return verbObj.ed;
    if (tense === 'present' && isT3) return verbObj.s;
    return verbObj.base;
}

/**
 * getAdverbForm(adverbObj)
 * 부사절 카드에서 접속사(conj) 부분만 분리
 * @param adverbObj - adverb.json 항목 { kor, eng, conj }
 * @returns { conj: string, base: string }
 *   conj = 접속사 부분 (강조색)
 *   base = 접속사 이후 나머지 (검정)
 */
export function getAdverbForm(adverbObj) {
    const { eng, conj } = adverbObj;
    if (!conj) return { conj: '', base: eng };

    const idx = eng.toLowerCase().indexOf(conj.toLowerCase());
    if (idx === -1) return { conj: '', base: eng };

    return {
        conj: eng.slice(idx, idx + conj.length),
        base: eng.slice(idx + conj.length),
    };
}

/**
 * splitForm(base, conjugated)
 * 원형과 변형형 비교 → 공통 앞부분(검정) + 달라진 부분(빨강) 분리
 */
function splitForm(base, conjugated) {
    if (base === conjugated) return { base: conjugated, suffix: '' };

    let i = 0;
    while (i < base.length && i < conjugated.length && base[i] === conjugated[i]) {
        i++;
    }

    return {
        base: conjugated.slice(0, i),
        suffix: conjugated.slice(i)
    };
}