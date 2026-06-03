import { useState, useRef } from 'react';
import { getPlainVerb } from './utils/verbConjugate';
import TopBar from './components/TopBar';
import Board from './components/Board';
import ControlPanel from './components/ControlPanel';
import FeedbackModal from './components/FeedbackModal';
import './App.css';

// 레이어 정의 — 어떤 슬롯을 어떤 순서로 보여줄지
export const LAYERS = [
  {
    id: 'layer1',
    label: '기본 문장 + 부사절',
    slots: [
      { key: 'adverb', label: '문장 늘리기 (부사절)', color: 'ext', dataFile: 'adverb', optional: true },
      { key: 'subject', label: '명사 (주어)', color: 'subj', dataFile: 'subject', optional: false },
      { key: 'verb', label: '동사', color: 'verb', dataFile: 'verb', optional: false, isVerb: true },
      { key: 'object', label: '명사 (목적어/보어)', color: 'obj', dataFile: 'object', optional: true },
    ]
  },
  {
    id: 'layer2',
    label: '조동사 + 전치사구',
    slots: [
      { key: 'subject', label: '명사 (주어)', color: 'subj', dataFile: 'subject', optional: false },
      { key: 'modal', label: '조동사', color: 'mod', dataFile: 'modal', optional: false },
      { key: 'verb', label: '동사원형', color: 'verb', dataFile: 'verb', optional: false, isVerb: true },
      { key: 'object', label: '명사 (목적어)', color: 'obj', dataFile: 'object', optional: true },
      { key: 'preposition', label: '늘리기 (전치사구)', color: 'ext', dataFile: 'preposition', optional: true },
    ]
  },
  {
    id: 'layer3',
    label: '관계대명사',
    slots: [
      { key: 'subject', label: '명사 (주어)', color: 'subj', dataFile: 'subject', optional: false },
      { key: 'subRel', label: '주어 꾸미기 (who/which)', color: 'rel', dataFile: 'relative', optional: true },
      { key: 'verb', label: '메인 동사', color: 'verb', dataFile: 'verb', optional: false, isVerb: true },
      { key: 'object', label: '메인 목적어', color: 'obj', dataFile: 'object', optional: true },
      { key: 'objRel', label: '목적어 꾸미기 (who/which)', color: 'rel', dataFile: 'relative', optional: true },
    ]
  }
];

const SLOT_COLOR_MAP = {
  subj: 'var(--c-yellow2)', verb: 'var(--c-pink2)', obj: 'var(--c-blue2)',
  mod: 'var(--c-green2)', rel: 'var(--c-cream2)', ext: 'var(--c-grey2)',
};

const SETS = ['set1'];

export default function App() {
  const [layerIdx, setLayerIdx] = useState(0);
  const [slotOrder, setSlotOrder] = useState(LAYERS[0].slots.map(s => s.key));
  const [tense, setTense] = useState('present');
  const [currentSet, setCurrentSet] = useState('set1');
  const [selection, setSelection] = useState({}); // { [slotKey]: { item, slotKey } }
  const [modal, setModal] = useState(null); // null | { isCorrect, sentence, translation, explanation }

  const checkRef = useRef(null);
  const refreshRef = useRef(null);

  const layer = LAYERS[layerIdx];

  const extSlot = layer.slots.find(s => s.color === 'ext');
  const extItem = extSlot ? selection[extSlot.key]?.item : null;
  const effectiveTense = extItem?.tense ?? tense;

  function buildColoredNodes() {
    const orderedSlots = slotOrder.map(key => layer.slots.find(s => s.key === key)).filter(Boolean);
    const parts = [];
    orderedSlots.forEach(slot => {
      const sel = selection[slot.key];
      if (!sel) return;
      const hasModal = !!selection['modal'];
      const text = slot.isVerb
        ? getPlainVerb(sel.item, selection['subject']?.item, effectiveTense, hasModal)
        : (sel.item.eng ?? sel.item.base);
      parts.push({ text, color: SLOT_COLOR_MAP[slot.color] ?? null, canOmit: sel.item.canOmit ?? false });
    });
    if (parts.length === 0) return null;
    const firstSlot = orderedSlots[0];
    const isAdverbFront = firstSlot?.color === 'ext' && selection[firstSlot.key];
    const result = parts.map((p, i) => {
      if (i === 0) return { ...p, text: p.text.charAt(0).toUpperCase() + p.text.slice(1) };
      if (i === 1 && isAdverbFront) {
        const t = p.text;
        const lowered = (t === 'I' || t.startsWith('I ')) ? t : t.charAt(0).toLowerCase() + t.slice(1);
        return { ...p, text: lowered };
      }
      return p;
    });
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

  function handleSelect(slotKey, item) {
    setSelection(prev => {
      // 같은 카드 다시 누르면 해제
      if (prev[slotKey]?.item === item) {
        const next = { ...prev };
        delete next[slotKey];
        return next;
      }
      return { ...prev, [slotKey]: { item, slotKey } };
    });
  }

  function handleReset() {
    setSelection({});
    setModal(null);
  }

  function handleLayerChange(idx) {
    setLayerIdx(idx);
    setSelection({});
    setModal(null);
    setSlotOrder(LAYERS[idx].slots.map(s => s.key));
    setTense('present');
  }

  const coloredNodes = buildColoredNodes();

  return (
    <div className="app">
      <TopBar
        coloredNodes={coloredNodes}
        currentSet={currentSet}
        sets={SETS}
        onSetChange={(s) => { setCurrentSet(s); handleReset(); }}
      />
      <Board
        layer={layer}
        slotOrder={slotOrder}
        onSlotReorder={setSlotOrder}
        tense={effectiveTense}
        selection={selection}
        onSelect={handleSelect}
      />
      <ControlPanel
        layer={layer}
        slotOrder={slotOrder}
        tense={effectiveTense}
        selection={selection}
        onReset={handleReset}
        onResult={(updater) => setModal(prev => typeof updater === 'function' ? updater(prev) : updater)}
        layers={LAYERS}
        layerIdx={layerIdx}
        onLayerChange={handleLayerChange}
        onRegisterCheck={(fn) => { checkRef.current = fn; }}
        onRegisterRefresh={(fn) => { refreshRef.current = fn; }}
        currentSet={currentSet}
        sets={SETS}
        onSetChange={(s) => { setCurrentSet(s); handleReset(); }}
        onCheck={() => checkRef.current?.()}
      />
      {modal && (
        <FeedbackModal
          modal={modal}
          onClose={() => setModal(null)}
          onRefresh={(r1, r2) => refreshRef.current?.(r1, r2)}
        />
      )}
    </div>
  );
}