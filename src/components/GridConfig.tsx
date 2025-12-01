import type { GridConfig } from '../types';

interface GridConfigProps {
  config: GridConfig;
  onChange: (config: GridConfig) => void;
}

const EVEN_NUMBERS = [2, 4, 6, 8, 10, 12, 14, 16];

export default function GridConfigComponent({ config, onChange }: GridConfigProps) {
  const totalCells = config.columns * config.rows;

  return (
    <div className="grid-config">
      <h2>Grid Configuration</h2>
      <div className="config-controls">
        <div className="config-group">
          <label htmlFor="columns">Columns:</label>
          <select
            id="columns"
            value={config.columns}
            onChange={(e) => onChange({ ...config, columns: Number(e.target.value) })}
          >
            {EVEN_NUMBERS.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
        <div className="config-group">
          <label htmlFor="rows">Rows:</label>
          <select
            id="rows"
            value={config.rows}
            onChange={(e) => onChange({ ...config, rows: Number(e.target.value) })}
          >
            {EVEN_NUMBERS.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="total-cells">Total cells: {totalCells}</p>
    </div>
  );
}

