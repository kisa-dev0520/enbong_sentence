import WordCard from './WordCard';
import '../styles/CardColumn.css';

const COLOR_MAP = {
    subj: 'col-yellow',
    verb: 'col-pink',
    obj: 'col-blue',
    mod: 'col-green',
    rel: 'col-cream',
    ext: 'col-grey',
};

const SINGLE_COL_KEYS = ['adverb', 'modal', 'subRel', 'objRel'];

export default function CardColumn({
    slot, data, tense,
    selectedItem, selectedSubject, onSelect,
    isDragging, onDragStart, onDrop, onDragEnd, isAdverbFront, hasModal
}) {
    const isSingleCol = SINGLE_COL_KEYS.includes(slot.key);

    // 새 구조 { left, right } 또는 구 구조 배열 모두 지원
    const isArray = Array.isArray(data);
    const leftItems = isArray ? [] : (data.left ?? []);
    const rightItems = isArray ? [] : (data.right ?? []);
    const flatItems = isArray ? data : [];

    const maxRows = Math.max(leftItems.length, rightItems.length);

    return (
        <div
            className={`card-column ${COLOR_MAP[slot.color]} ${isDragging ? 'dragging' : ''}`}
            draggable
            onDragStart={onDragStart}
            onDragOver={e => e.preventDefault()}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
        >
            <div className="column-header" style={{ cursor: 'grab' }}>
                <div className="main-title">{slot.label}</div>
            </div>

            <div className={`word-grid ${isSingleCol ? 'single-col' : ''}`}>
                {isArray ? (
                    // 구 구조: 그냥 flat 렌더
                    flatItems.map((item, i) => (
                        <WordCard
                            key={i}
                            item={item}
                            slot={slot}
                            tense={tense}
                            selectedSubject={selectedSubject}
                            isSelected={selectedItem === item}
                            onSelect={() => onSelect(item)}
                            isAdverbFront={isAdverbFront}
                            hasModal={hasModal}
                        />
                    ))
                ) : isSingleCol ? (
                    // 한 열짜리: left + right 합쳐서 세로 나열
                    [...leftItems, ...rightItems].map((item, i) => (
                        <WordCard
                            key={i}
                            item={item}
                            slot={slot}
                            tense={tense}
                            selectedSubject={selectedSubject}
                            isSelected={selectedItem === item}
                            onSelect={() => onSelect(item)}
                            isAdverbFront={isAdverbFront}
                            hasModal={hasModal}
                        />
                    ))
                ) : (
                    // 두 열짜리: left/right 행 순서대로 교차 배치
                    Array.from({ length: maxRows }).flatMap((_, i) => {
                        const cells = [];
                        if (leftItems[i]) {
                            cells.push(
                                <WordCard
                                    key={`l${i}`}
                                    item={leftItems[i]}
                                    slot={slot}
                                    tense={tense}
                                    selectedSubject={selectedSubject}
                                    isSelected={selectedItem === leftItems[i]}
                                    onSelect={() => onSelect(leftItems[i])}
                                    isAdverbFront={isAdverbFront}
                                    hasModal={hasModal}
                                />
                            );
                        } else {
                            cells.push(<div key={`le${i}`} />);
                        }
                        if (rightItems[i]) {
                            cells.push(
                                <WordCard
                                    key={`r${i}`}
                                    item={rightItems[i]}
                                    slot={slot}
                                    tense={tense}
                                    selectedSubject={selectedSubject}
                                    isSelected={selectedItem === rightItems[i]}
                                    onSelect={() => onSelect(rightItems[i])}
                                    isAdverbFront={isAdverbFront}
                                    hasModal={hasModal}
                                />
                            );
                        } else {
                            cells.push(<div key={`re${i}`} />);
                        }
                        return cells;
                    })
                )}
            </div>
        </div>
    );
}