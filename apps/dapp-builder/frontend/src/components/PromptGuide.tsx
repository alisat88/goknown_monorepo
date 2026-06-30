import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import {
  PROMPT_GUIDE_INTRO,
  PROMPT_CHECKLIST,
  PROMPT_OPENING,
  PROMPT_SECTIONS,
  EXAMPLE_PROMPT_RAW,
} from '../promptGuide';

export function PromptGuide() {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EXAMPLE_PROMPT_RAW);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — silent fail
    }
  }, []);

  return (
    <div className="prompt-guide">
      <button
        className={`prompt-guide-toggle${expanded ? ' expanded' : ''}`}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="prompt-guide-toggle-label">How to Write a Good Prompt</span>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {expanded && (
        <div className="prompt-guide-body">
          <p className="prompt-guide-intro">{PROMPT_GUIDE_INTRO}</p>

          <div className="prompt-guide-checklist-card">
            <p className="prompt-guide-checklist-title">A good prompt usually includes:</p>
            <ul className="prompt-guide-checklist">
              {PROMPT_CHECKLIST.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="prompt-guide-example-label">Example prompt</div>

          <div className="prompt-guide-sections">
            <div className="prompt-guide-row prompt-guide-row--opening">
              <pre className="prompt-guide-content prompt-guide-content--opening">
                {PROMPT_OPENING}
              </pre>
              <div className="prompt-guide-annotation prompt-guide-annotation--empty" />
            </div>

            {PROMPT_SECTIONS.map((section) => (
              <div key={section.id} className="prompt-guide-row">
                <div className="prompt-guide-text">
                  <p className="prompt-guide-heading">{section.heading}</p>
                  <pre className="prompt-guide-content">{section.content}</pre>
                </div>
                {section.annotation ? (
                  <div className="prompt-guide-annotation">
                    <span className="prompt-guide-annotation-label">Why this works</span>
                    <p className="prompt-guide-annotation-text">{section.annotation}</p>
                  </div>
                ) : (
                  <div className="prompt-guide-annotation prompt-guide-annotation--empty" />
                )}
              </div>
            ))}
          </div>

          <div className="prompt-guide-copy-row">
            <button
              className={`prompt-guide-copy-btn${copied ? ' copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Example Prompt'}
            </button>
            <span className="prompt-guide-copy-note">
              Copies the prompt only — annotations not included.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
