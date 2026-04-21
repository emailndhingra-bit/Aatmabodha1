import React, { useState } from 'react';
import './QuestionSelector.css';

interface Question {
  id: number;
  text: string;
}

interface QuestionSelectorProps {
  questions: Question[];
  onSubmit: (selectedIds: number[]) => void;
  onCancel: () => void;
}

export const QuestionSelector: React.FC<QuestionSelectorProps> = ({ questions, onSubmit, onCancel }) => {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const toggleQuestion = (id: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelected(newSelected);
  };
  const handleSubmit = () => {
    if (selected.size === 0) return;
    onSubmit(Array.from(selected));
  };
  const selectedCount = selected.size;
  return (
    <div className="question-selector">
      <div className="selector-header">
        <span className="selector-icon">✨</span>
        <span className="selector-title">Chuno jo abhi poochna hai</span>
      </div>
      <div className="questions-list">
        {questions.map((q) => (
          <div
            key={q.id}
            className={`question-item ${selected.has(q.id) ? 'selected' : ''}`}
            onClick={() => toggleQuestion(q.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleQuestion(q.id);
              }
            }}
          >
            <div className="question-checkbox">{selected.has(q.id) ? '✓' : ''}</div>
            <div className="question-text">
              <span className="question-number">{q.id}.</span>
              {q.text}
            </div>
          </div>
        ))}
      </div>
      <div className="selector-actions">
        <button className="selector-btn selector-btn-cancel" onClick={onCancel} type="button">Cancel</button>
        <button className="selector-btn selector-btn-proceed" onClick={handleSubmit} disabled={selectedCount === 0} type="button">
          {selectedCount === 0 ? 'Select karo' : selectedCount === 1 ? 'Proceed' : `Proceed with ${selectedCount}`}
        </button>
      </div>
    </div>
  );
};
