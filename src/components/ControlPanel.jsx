import { getPlainVerb } from '../utils/verbConjugate';
import { useEffect, useCallback, useRef, useState } from 'react';
import '../styles/ControlPanel.css';

const SLOT_COLOR_MAP = {
    subj: 'var(--c-yellow2)', verb: 'var(--c-pink2)', obj: 'var(--c-blue2)',
    mod: 'var(--c-green2)', rel: 'var(--c-cream2)', ext: 'var(--c-grey2)',
};

export default function ControlPanel({
    layer, tense, selection, onReset, onResult, slotOrder, onRegisterRefresh,
    layers, layerIdx, onLayerChange, onRegisterCheck,
}) {
    const lastResultRef = useRef(null);  // { sentence, result }
    const [isLoading, setIsLoading] = useState(false);

    function getOrderedSlots() {
        return slotOrder.map(key => layer.slots.find(s => s.key === key)).filter(Boolean);
    }

    function buildParts() {
        const slots = getOrderedSlots();
        const parts = [];
        const hasModal = !!selection['modal'];
        slots.forEach(slot => {
            const sel = selection[slot.key];
            if (!sel) return;
            const text = slot.isVerb
                ? getPlainVerb(sel.item, selection['subject']?.item, tense, hasModal)
                : (sel.item.eng ?? sel.item.base);
            parts.push({ text, color: SLOT_COLOR_MAP[slot.color] ?? null, slotKey: slot.key, canOmit: sel.item.canOmit ?? false });
        });
        return parts;
    }

    function buildSentence() {
        const parts = buildParts();
        if (parts.length === 0) return '';
        const firstSlot = getOrderedSlots()[0];
        const isAdverbFront = firstSlot?.color === 'ext' && selection[firstSlot.key];
        let sentence;
        if (isAdverbFront) {
            const [first, ...rest] = parts.map(p => p.text);
            const mainText = rest.join(' ');
            const mainClause = (mainText === 'I' || mainText.startsWith('I '))
                ? mainText
                : mainText.charAt(0).toLowerCase() + mainText.slice(1);
            sentence = `${first}, ${mainClause}`;
        } else {
            sentence = parts.map(p => p.text).join(' ');
        }
        sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
        if (!sentence.endsWith('.')) sentence += '.';
        return sentence;
    }

    function buildColoredNodes() {
        const parts = buildParts();
        if (parts.length === 0) return null;

        const result = parts.map((p, i) => ({
            ...p, text: i === 0 ? p.text.charAt(0).toUpperCase() + p.text.slice(1) : p.text
        }));

        const firstSlot = getOrderedSlots()[0];
        const isAdverbFront = firstSlot?.color === 'ext' && selection[firstSlot.key];

        const nodes = [];
        result.forEach((part, i) => {
            const needsComma = isAdverbFront && i === 0;
            const firstWord = part.text.split(' ')[0];
            const restWords = part.text.split(' ').slice(1).join(' ');
            nodes.push(
                <span key={i} style={{
                    color: part.color ?? 'var(--text-primary)',
                    background: part.color ? part.color + 'ff' : 'transparent',
                    borderRadius: '6px', padding: '0 4px',
                }}>
                    {part.canOmit ? (
                        <>
                            <span style={{ opacity: 0.35 }}>{firstWord}</span>
                            {restWords ? ' ' + restWords : ''}
                        </>
                    ) : part.text}
                    {needsComma ? ',' : ''}
                </span>
            );
            if (i < result.length - 1) nodes.push(' ');
        });
        nodes.push('.');
        return nodes;
    }

    function validate() {
        for (const slot of layer.slots) {
            if (!slot.optional && !selection[slot.key]) return false;
        }
        return true;
    }

    async function callClaude(prompt, maxTokens = 512) {
        const res = await fetch('/api/claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, maxTokens })
        });
        const data = await res.json();
        if (!data.content?.[0]?.text) throw new Error(JSON.stringify(data));
        return JSON.parse(data.content[0].text.match(/\{[\s\S]*\}/)[0]);
    }

    async function handleCheck() {
        if (!validate()) {
            alert('필수 슬롯을 모두 선택해 주세요.');
            return;
        }

        const sentence = buildSentence();

        // 관계절 구조 명시: canOmit 카드 텍스트를 [대괄호]로 감싸서 AI에 전달
        const parts = buildParts();
        const sentenceForAI = parts.map(p => p.canOmit ? `[${p.text}]` : p.text).join(' ');
        const sentenceForAIFinal = sentenceForAI.charAt(0).toUpperCase() + sentenceForAI.slice(1) + '.';

        const prompt = `너는 초등학교 4학년 영어 선생님이야.

학생이 단어 카드를 조합해서 만든 문장:
"${sentenceForAIFinal}"
([대괄호] 안은 앞 명사를 수식하는 관계절임)

학생이 단어 카드를 조합해서 만든 문장의 해석:
- 직역하되 초등학생 학습용이므로 과도한 직역은 지양한다
- 단어에 여러가지 뜻이 있으므로 상식적인 판단을 잘 해서 해석한다
- 예외 처리 : Fly guy, Fly girl은 영어 원서에 나오는 파리 캐릭터임 (해석은 '플라이 가이', '플라이 걸'로 적는다)

평가 기준:
- 1차 : 조합된 전체 문장의 문법 오류가 있는지 판단
- 2차 : 조합된 전체 문장이 문맥상 자연스러운지 판단
        한글 해석의 앞부분부터 읽었을 때, 상황과 정황이 어색한지 여부
       (잘못된 해석 : While she likes pizza, 그녀가 피자를 좋아하는 동안 => 그녀가 피자를 좋아하는 반면에)
- 3차 : 부사절, 전치사구, 조동사, 관계사가 들어간 문장은 이걸 기준으로 판단

정답이면:
- "explanation": 친근하고 따뜻한 말투로 2문장 이내 피드백
- 원어민으로서 왜 이 문장이 자연스러운지 설명한다
- 문맥상 의미가 불분명한 경우, 적절한 문구를 제안한다.
-  추천하는 문장 : 
  전체 문장의 문맥과 상황을 상식에 맞게 추천한다.
  (잘못된 추천 : While she likes pizza, my firends like him. => 음식이 나와야 상식적)

오답이면:
- 조합된 전체 문장의 문법 오류를 바로 잡는다
- 조합된 전체 문장의 문맥의 오류를 바로 잡는다 (한글 해석의 앞부분부터 읽었을 때, 상황과 정황이 어색한지 여부)
- "explanation": 친근하고 따뜻한 말투지만 본론만 간결하게 피드백
     조합된 문장이 왜 어색한지, 원어민은 이렇게 쓴다는 제안하기
     어색하거나 틀린 단어는 2pt 더 큰 볼드체의 오렌지색 컬러 (#f97316)의 텍스트
     추천하는 단어는 2pt 더 큰 볼드체의 스카이블루 컬러(#0084ea)의 텍스트
- 추천하는 문장 : 
  전체 문장의 문맥과 상황을 상식에 맞게 추천한다.
  (잘못된 추천 : While she likes pizza, my firends like him. => 음식이 나와야 상식적)

정답/오답 공통 : 관계사절에서 who/which를 생략한 문장일 경우 아래의 설명을 꼭 넣는다.
"who/which 절에 주어가 있는 경우 생략하는 게 가장 자연스러워요. 만약 꼭 쓰고 싶다면 whom을 쓰는 게 자연스러워요.
주의: 관계절은 제한적 용법으로 피드백 한다.
  
    
JSON만 응답:
{
  "isCorrect": true또는false,
  "translation": "한국어 번역",
  "explanation": "피드백 (HTML span 태그 포함 가능)",
  "wrongWord": "어색하거나 틀린 단어 또는 구 (정답이면 null)",
  "rec1": "추천 문장 1 (정답이면 null)",
  "rec1kor": "추천 번역 1 (정답이면 null)",
  "rec2": "추천 문장 2 (정답이면 null)",
  "rec2kor": "추천 번역 2 (정답이면 null)"
}`;

        // 같은 문장이면 캐시된 결과 바로 표시
        if (lastResultRef.current?.sentence === sentence) {
            onResult(lastResultRef.current.result);
            return;
        }

        setIsLoading(true);
        try {
            const parsed = await callClaude(prompt, 512);
            const wrongWords = parsed.wrongWord ? [parsed.wrongWord] : [];

            const result = {
                isCorrect: parsed.isCorrect,
                sentence,
                wrongWords,
                wordSlots: buildParts(), // S/V 레이블용
                correctWords: [],
                translation: parsed.translation,
                explanation: parsed.explanation,
                recommendedSentence: parsed.rec1 ?? null,
                recommendedSentence2: parsed.rec2 ?? null,
                rec1Translation: parsed.rec1kor ?? null,
                rec2Translation: parsed.rec2kor ?? null,
            };

            lastResultRef.current = { sentence, result };
            onResult(result);
        } catch (e) {
            alert('오류: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    }

    const handleRefresh = useCallback(async (rec1Eng, rec2Eng) => {
        const sentence = buildSentence();

        const excludeList = [rec1Eng, rec2Eng].filter(Boolean).map(s => `"${s}"`).join(', ');

        const prompt = `학생의 문장: "${sentence}"
이미 보여준 추천: [${excludeList}]

위 추천 말고 다른 자연스러운 대안 2개를 초등학생 수준으로 제시해줘.
학생이 선택한 주어/시제/부사절/조동사는 최대한 유지해.

JSON만 응답:
{
  "rec1": "추천 문장 1",
  "rec1kor": "추천 번역 1",
  "rec2": "추천 문장 2",
  "rec2kor": "추천 번역 2"
}`;

        try {
            const parsed = await callClaude(prompt, 256);

            if (!parsed.rec1) {
                alert('더 이상 추천할 문장이 없어요!');
                return;
            }

            onResult(prev => ({
                ...prev,
                correctWords: [],
                recommendedSentence: parsed.rec1 ?? null,
                recommendedSentence2: parsed.rec2 ?? null,
                rec1Translation: parsed.rec1kor ?? null,
                rec2Translation: parsed.rec2kor ?? null,
            }));
        } catch (e) {
            alert('오류: ' + e.message);
        }
    }, [selection, slotOrder, tense, layer]);

    useEffect(() => {
        onRegisterCheck?.(handleCheck);
    }, [selection, slotOrder, tense, layer]);

    useEffect(() => {
        onRegisterRefresh?.(handleRefresh);
    }, [handleRefresh, onRegisterRefresh]);

    return (
        <>
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-box">
                        <div className="loading-spinner" />
                        <div className="loading-text">✨ 문장 분석 중...</div>
                    </div>
                </div>
            )}
            <div className="control-panel">
                <div className="control-left">
                    <div className="topbar-tabs">
                        {layers.map((l, i) => (
                            <button
                                key={l.id}
                                className={`tab-btn ${i === layerIdx ? 'active' : ''}`}
                                onClick={() => onLayerChange(i)}
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="control-right">
                    <button className="btn-reset" onClick={onReset}>초기화</button>
                    <button className="btn-submit" onClick={handleCheck} disabled={isLoading}>
                        문장 확인
                    </button>
                </div>
            </div>
        </>
    );
}