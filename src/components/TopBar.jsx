import '../styles/TopBar.css';

export default function TopBar({ coloredNodes, currentSet, sets, onSetChange }) {
    return (
        <header className="topbar">
            <select
                className="set-select"
                value={currentSet}
                onChange={e => onSetChange(e.target.value)}
            >
                {sets.map(s => (
                    <option key={s} value={s}>{s.toUpperCase()}</option>
                ))}
            </select>
            <div className="sentence-preview">
                {coloredNodes
                    ? <span className="sentence-text">{coloredNodes}</span>
                    : <span className="placeholder">단어를 선택하면 문장이 완성됩니다.</span>
                }
            </div>
        </header>
    );
}