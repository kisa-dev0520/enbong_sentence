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

export default function CardColumn({
    slot, data, tense,
    selectedItem, selectedSubject, onSelect,
    isDragging, onDragStart, onDrop, onDragEnd, isAdverbFront, hasModal
}) {
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

            <div className={`word-grid ${isArray ? 'single-col' : ''}`}>
                {isArray ? (
                    // flat 배열: 1열 순서대로
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
                ) : (
                    // { left, right } 구조: 2열 교차 배치
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