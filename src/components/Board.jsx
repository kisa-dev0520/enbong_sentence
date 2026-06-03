import { useState, useRef, useEffect } from 'react';
import CardColumn from './CardColumn';
import '../styles/Board.css';

// 데이터 파일 정적 import
import subjectData from '../data/set1/subject.json';
import verbData from '../data/set1/verb.json';
import objectData from '../data/set1/object.json';
import modalData from '../data/set1/modal.json';
import adverbData from '../data/set1/adverb.json';
import prepositionData from '../data/set1/preposition.json';
import relativeData from '../data/set1/relative.json';

const DATA_MAP = {
    subject: subjectData,
    verb: verbData,
    object: objectData,
    modal: modalData,
    adverb: adverbData,
    preposition: prepositionData,
    relative: relativeData,
};

export default function Board({ layer, tense, selection, onSelect, slotOrder, onSlotReorder }) {

    const [dragIdx, setDragIdx] = useState(null);
    const boardRef = useRef(null);

    useEffect(() => {
        const el = boardRef.current;
        if (!el) return;
        const onWheel = (e) => {
            if (e.deltaY === 0) return;
            e.preventDefault();
            el.scrollLeft += e.deltaY;
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    const orderedSlots = slotOrder
        .map(key => layer.slots.find(s => s.key === key))
        .filter(Boolean);

    function handleDragStart(idx) {
        setDragIdx(idx);
    }

    function handleDrop(idx) {
        if (dragIdx === null || dragIdx === idx) return;
        const newOrder = [...slotOrder];
        const [removed] = newOrder.splice(dragIdx, 1);
        newOrder.splice(idx, 0, removed);
        onSlotReorder(newOrder);
        setDragIdx(null);
    }

    function handleDragEnd() {
        setDragIdx(null);
    }

    const firstSlotKey = slotOrder[0];
    const firstSlot = layer.slots.find(s => s.key === firstSlotKey);
    const isAdverbFront = firstSlot?.color === 'ext' && !!selection[firstSlotKey];

    const hasModal = !!selection['modal'];

    return (
        <div className="board" ref={boardRef}>
            {orderedSlots.map((slot, idx) => (
                <CardColumn
                    key={slot.key}
                    hasModal={hasModal}
                    isAdverbFront={isAdverbFront}
                    slot={slot}
                    data={DATA_MAP[slot.dataFile]}
                    tense={tense}
                    selectedItem={selection[slot.key]?.item ?? null}
                    selectedSubject={selection['subject']?.item ?? null}
                    onSelect={(item) => onSelect(slot.key, item)}
                    isDragging={dragIdx === idx}
                    onDragStart={() => handleDragStart(idx)}
                    onDrop={() => handleDrop(idx)}
                    onDragEnd={handleDragEnd}
                />
            ))}
        </div>
    );
}